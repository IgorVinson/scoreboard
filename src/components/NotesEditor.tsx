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
import { useEffect, useRef } from 'react';

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
// Create our own TaskItem extension that extends the default one
const CustomTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: element => {
          // Handle both 'data-checked' attribute formats from database
          const dataChecked = element.getAttribute('data-checked');
          return dataChecked === 'true' || dataChecked === '';
        },
        renderHTML: attributes => ({
          'data-checked': attributes.checked ? 'true' : 'false',
        }),
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: `li[data-type="taskItem"]`,
        priority: 51,
      },
      {
        tag: 'li[data-checked]',
        priority: 52,
      },
    ]
  },
  
  renderHTML({ node, HTMLAttributes }) {
    const { checked } = node.attrs;

    // Merge our custom attributes with the original ones
    const attributes = mergeAttributes(
      HTMLAttributes,
      {
        'data-type': 'taskItem',
        'data-checked': checked ? 'true' : 'false',
      }
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
    // Skip if this is an update from our own setContent
    if (isUpdatingRef.current) return;
    
    const html = editor.getHTML();

    // Only call the external onChange if content actually changed
    if (onChange && html !== lastContentRef.current) {
      lastContentRef.current = html;
      onChange(html);
    }
  };

  // Handle external content changes
  useEffect(() => {
    // Only update content from props if it's different from our last known content
    if (editorRef.current && content !== lastContentRef.current) {
      isUpdatingRef.current = true;
      editorRef.current.commands.setContent(content);
      lastContentRef.current = content;
      // Reset the flag after a short delay to ensure the update has processed
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 10);
    }
  }, [content]);

  // Ensure the editor is properly focused after first render
  useEffect(() => {
    if (editorRef.current && !initializedRef.current) {
      // A small delay to ensure DOM is fully rendered
      setTimeout(() => {
        initializedRef.current = true;
        // Only focus if the editor is empty and not disabled
        if ((!content || content === '<p></p>') && !disabled) {
          editorRef.current.commands.focus('end');
        }
      }, 100);
    }
  }, [content, disabled]);

  // Set up the extensions
  const extensions = [
    StarterKit.configure({
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
      heading: {
        levels: [1, 3],
      },
    }),
    Placeholder.configure({
      placeholder,
      showOnlyWhenEditable: true,
      includeChildren: true, // Ensures placeholder works in nested nodes too
    }),
    TaskList,
    // Replace TaskItem with our custom implementation
    CustomTaskItem.configure({
      nested: true,
    }),
    // TaskItem,
    CustomHeadingExit,
    CustomEmptyDocHandler, // Add our custom handler for empty document
  ];

  // Custom editorProps for styling
  const editorProps = {
    attributes: {
      class: 'tiptap',
    },
    editable: () => !disabled, // Fix the type error by providing a function
  };

  return (
    <div className={`editor-wrapper ${disabled ? 'disabled' : ''}`}>
      <EditorProvider
        onBeforeCreate={({ editor }) => {
          editorRef.current = editor;
        }}
        slotBefore={<MenuBar />}
        extensions={extensions}
        content={content || '<p></p>'} // Ensure we always have at least one paragraph
        editorProps={editorProps}
        onUpdate={handleUpdate}
      />
      <style>{`
        /* Editor container */
        .editor-wrapper {
          border: 1px solid #ccc;
          border-radius: 0.5rem;
          overflow: hidden;
          background-color: white;
        }

        .dark .editor-wrapper {
          background-color: #1f2937;
          border-color: #374151;
        }

        /* Toolbar styling */
        .menu-bar {
          padding: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          background-color: #f9fafb;
        }

        .dark .menu-bar {
          background-color: #374151;
          border-color: #4b5563;
        }

        /* Button styling */
        .menu-bar button {
          background-color: #fff;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          color: #4b5563;
          padding: 0.25rem;
          width: 28px;
          height: 28px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .dark .menu-bar button {
          background-color: #1f2937;
          border-color: #4b5563;
          color: #e5e7eb;
        }

        .menu-bar button:hover {
          background-color: #f3f4f6;
        }

        .dark .menu-bar button:hover {
          background-color: #374151;
        }

        .menu-bar button.is-active {
          background-color: #e5e7eb;
          color: #111827;
        }

        .dark .menu-bar button.is-active {
          background-color: #4b5563;
          color: #f9fafb;
        }

        .menu-bar button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Tiptap editor content area */
        .tiptap {
          padding: 1rem;
          min-height: 150px;
          outline: none;
        }

        .tiptap > *:first-child {
          margin-top: 0;
        }

        /* Regular lists - make markers visible */
        .tiptap ul:not([data-type='taskList']) {
          list-style-type: disc !important;
          padding-left: 2rem;
          margin: 0.5rem 0;
        }

        .tiptap ol {
          list-style-type: decimal !important;
          padding-left: 2rem;
          margin: 0.5rem 0;
        }

        .tiptap ul:not([data-type='taskList']) li,
        .tiptap ol li {
          display: list-item !important;
          margin: 0.2rem 0;
        }

        .tiptap ul:not([data-type='taskList']) li > p,
        .tiptap ol li > p {
          margin: 0;
          display: inline;
        }

        .tiptap h1,
        .tiptap h3 {
          line-height: 1.1;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .tiptap h1 {
          font-size: 1.4rem;
        }

        .tiptap h3 {
          font-size: 1.1rem;
        }

        .tiptap blockquote {
          border-left: 3px solid #d1d5db;
          margin: 0.5rem 0;
          padding-left: 1rem;
        }

        .dark .tiptap blockquote {
          border-left-color: #4b5563;
        }

        .tiptap hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1rem 0;
        }

        .dark .tiptap hr {
          border-top-color: #4b5563;
        }

        /* Task List styling */
        .tiptap ul[data-type='taskList'] {
          list-style-type: none !important;
          padding-left: 0.5rem;
          margin: 0.5rem 0;
        }

        .tiptap ul[data-type='taskList'] li {
          display: flex !important;
          align-items: flex-start;
          margin: 0.5em 0;
        }

        .tiptap ul[data-type='taskList'] li > label {
          margin-right: 0.5em;
          user-select: none;
        }

        .tiptap ul[data-type='taskList'] li > div {
          flex: 1;
        }

        /* Placeholder styling - improved for better responsiveness */
        .tiptap .is-editor-empty.is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          cursor: text;
        }

        /* Make sure the placeholder doesn't interfere with typing */
        .tiptap .is-editor-empty:first-child::before {
          height: 0;
          pointer-events: none;
          user-select: none;
          position: absolute;
          opacity: 0.5;
        }

        /* Add this to create the strikethrough effect */
        .tiptap ul[data-type='taskList'] li[data-checked='true'] > div {
          text-decoration: line-through;
          opacity: 0.7;
        }

        /* Add disabled state styling */
        .editor-wrapper.disabled {
          opacity: 0.7;
          pointer-events: none;
        }
        
        .editor-wrapper.disabled .menu-bar {
          display: none;
        }
      `}</style>
    </div>
  );
}
