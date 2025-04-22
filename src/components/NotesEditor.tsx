'use client';

import { EditorProvider, useCurrentEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Extension, mergeAttributes } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  MinusSquare,
  Undo,
  Redo,
  Eraser,
  Type,
} from 'lucide-react';
import React, { useEffect, useRef } from 'react';

interface NotesEditorProps {
  id?: string;
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  disabled?: boolean;
}

// Simplified MenuBar component with icons
const MenuBar = () => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <div className='menu-bar'>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
        title='Bold'
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
        title='Italic'
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'is-active' : ''}
        title='Strikethrough'
      >
        <Strikethrough size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        title='Clear formatting'
      >
        <Eraser size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={editor.isActive('paragraph') ? 'is-active' : ''}
        title='Normal text'
      >
        <Type size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        title='Heading 1'
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        title='Heading 3'
      >
        <Heading3 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        title='Bullet List'
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
        title='Numbered List'
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={editor.isActive('taskList') ? 'is-active' : ''}
        title='Task List'
      >
        <CheckSquare size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
        title='Quote'
      >
        <Quote size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title='Horizontal Rule'
      >
        <MinusSquare size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title='Undo'
      >
        <Undo size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title='Redo'
      >
        <Redo size={16} />
      </button>
    </div>
  );
};

// Add this custom extension to handle the enter behavior for both heading levels
const CustomHeadingExit = Extension.create({
  name: 'customHeadingExit',
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (editor.isActive('heading')) {
          // Split the node at cursor position
          editor.commands.splitBlock();
          // Then convert the new node to paragraph
          editor.commands.setParagraph();
          return true;
        }
        return false;
      },
    };
  },
});

// Create our own TaskItem extension that extends the default one
const CustomTaskItem = TaskItem.extend({
  renderHTML({ node, HTMLAttributes }) {
    const { checked } = node.attrs;

    // Merge our custom attributes with the original ones
    const attributes = mergeAttributes(
      HTMLAttributes,
      checked ? { 'data-checked': 'true' } : {}
    );

    return [
      'li',
      attributes,
      [
        'label',
        [
          'input',
          {
            type: 'checkbox',
            checked: checked ? 'checked' : null,
          },
        ],
      ],
      ['div', {}, 0], // Content
    ];
  },
});

// Simplified version of the empty doc handler that doesn't use buggy plugin
const CustomEmptyDocHandler = Extension.create({
  name: 'customEmptyDocHandler',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleKeyDown(view, event) {
            // Special handling for the first paragraph typing
            if (view.state.doc.childCount === 1 && 
                view.state.doc.firstChild?.type.name === 'paragraph' &&
                view.state.doc.firstChild.content.size === 0) {
              // Allow backspace to work as expected
              if (event.key === 'Backspace') {
                return false;
              }
            }
            return false; // Let Tiptap handle other key events
          }
        }
      })
    ];
  }
});

export function NotesEditor({
  id = 'default-editor',
  content = '',
  placeholder = 'Write something...',
  onChange,
  disabled,
}: NotesEditorProps) {
  const editorRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  const lastContentRef = useRef(content);
  const initializedRef = useRef(false);

  // Improve update handling for performance
  const handleUpdate = ({ editor }: { editor: any }) => {
    // Skip update if we're currently updating or if the content hasn't changed
    if (isUpdatingRef.current) return;

    const currentContent = editor.getHTML();
    if (lastContentRef.current === currentContent) return;

    lastContentRef.current = currentContent;
    onChange?.(currentContent);
  };

  // Initialize with specified content if changed
  useEffect(() => {
    if (editorRef.current && content !== lastContentRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      
      if (content === '' && editorRef.current.isEmpty) {
        // If both are empty, don't update
        isUpdatingRef.current = false;
        return;
      }
      
      editorRef.current.commands.setContent(content);
      lastContentRef.current = content;
      
      // Add a small delay before allowing further updates to prevent update loops
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 10);
    }
  }, [content]);

  return (
    <EditorProvider
      slotBefore={<MenuBar />}
      extensions={[
        StarterKit.configure({
          heading: {
            levels: [1, 3],
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        TaskList.configure({
          HTMLAttributes: {
            class: 'task-list',
          },
        }),
        CustomTaskItem.configure({
          nested: true,
        }),
        CustomHeadingExit,
        CustomEmptyDocHandler,
      ]}
      content={content}
      editorProps={{
        attributes: {
          class: 'prose prose-sm dark:prose-invert prose-headings:my-3 prose-p:my-2 focus:outline-none max-w-none px-3 py-2 border rounded-md border-input bg-transparent shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[150px] max-h-[350px] overflow-y-auto',
          id,
          spellcheck: 'true',
        },
      }}
      onUpdate={handleUpdate}
      onCreate={({ editor }) => {
        editorRef.current = editor;
        initializedRef.current = true;
      }}
      editable={!disabled}
    >
      {/* Tiptap editor content */}
    </EditorProvider>
  );
}
