import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  Code,
  CheckSquare,
  AlignLeft,
  Link,
} from 'lucide-react';
import { useEffect } from 'react';
import { Extension } from '@tiptap/core';

interface NotesEditorProps {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
}

// Create a custom extension to handle auto-switching to paragraph after headings
const AutoParagraphAfterHeading = Extension.create({
  name: 'autoParagraphAfterHeading',
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (editor.isActive('heading')) {
          return editor.chain().focus().setParagraph().run();
        }
        return false;
      },
    };
  },
});

export function NotesEditor({
  content = '',
  placeholder = 'Write something...',
  onChange,
}: NotesEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      AutoParagraphAfterHeading,
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>');
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className='rounded-md overflow-hidden shadow-sm bg-white dark:bg-background'>
      <div className='border-b bg-muted/40 p-1.5 flex gap-3 flex-wrap'>
        {/* Text formatting group */}
        <div className='flex border-r pr-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={
              editor.isActive('heading', { level: 3 })
                ? 'bg-muted font-bold text-primary'
                : ''
            }
            title='Heading'
          >
            <span className='flex items-center'>
              <span className='text-xs font-semibold'>H</span>
            </span>
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={
              editor.isActive('paragraph') && !editor.isActive('heading')
                ? 'bg-muted text-primary'
                : ''
            }
            title='Normal Text'
          >
            <span className='flex items-center'>
              <span className='text-xs'>T</span>
            </span>
          </Button>
        </div>

        {/* Formatting group */}
        <div className='flex border-r pr-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
            title='Bold'
          >
            <span className='flex items-center'>
              <span className='text-xs font-bold'>B</span>
            </span>
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
            title='Italic'
          >
            <span className='flex items-center'>
              <span className='text-xs italic'>I</span>
            </span>
          </Button>
        </div>

        {/* List group */}
        <div className='flex'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
            title='Bullet List'
          >
            <List className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
            title='Numbered List'
          >
            <ListOrdered className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={editor.isActive('taskList') ? 'bg-muted' : ''}
            title='Task List'
          >
            <CheckSquare className='h-4 w-4' />
          </Button>
        </div>
      </div>
      <div className='p-3 bg-background relative notes-paper'>
        <EditorContent
          editor={editor}
          className='prose dark:prose-invert max-w-none focus-visible:outline-none relative z-10'
        />
        <style jsx global>{`
          .notes-paper {
            background-image: linear-gradient(
              transparent 0px,
              transparent 27px,
              rgba(0, 0, 0, 0.05) 27px,
              rgba(0, 0, 0, 0.05) 28px
            );
            background-size: 100% 28px;
            background-position: 0 5px;
            position: relative;
            padding: 0;
          }

          .notes-paper::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 1px;
            background: rgba(255, 0, 0, 0.05);
            margin-left: 30px;
          }

          /* Adjust line color for dark mode */
          .dark .notes-paper {
            background-image: linear-gradient(
              transparent 0px,
              transparent 27px,
              rgba(255, 255, 255, 0.05) 27px,
              rgba(255, 255, 255, 0.05) 28px
            );
          }

          .dark .notes-paper::before {
            background: rgba(255, 0, 0, 0.1);
          }

          /* Editor content styling */
          .notes-paper .ProseMirror {
            border: none;
            outline: none !important;
            line-height: 28px;
            padding: 0 0 0 10px;
            margin: 0;
          }

          /* Ensure paragraphs align with lines */
          .notes-paper .ProseMirror p {
            margin: 0;
            padding: 0;
            min-height: 28px;
          }

          /* Headings */
          .notes-paper .ProseMirror h3 {
            line-height: 28px;
            margin: 0;
            padding: 0;
            font-size: 1.3em;
            font-weight: 600;
            color: #1a1a1a;
          }

          .dark .notes-paper .ProseMirror h3 {
            color: #e1e1e1;
          }

          /* List styling - fixed to show markers */
          .notes-paper .ProseMirror ul {
            list-style-type: disc;
            padding-left: 2em;
            margin: 0;
          }

          .notes-paper .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 2em;
            margin: 0;
          }

          .notes-paper .ProseMirror li {
            line-height: 28px;
            min-height: 28px;
            margin: 0;
            padding: 0;
            display: list-item;
          }

          .notes-paper .ProseMirror li p {
            margin: 0;
            display: inline;
          }

          /* Task List styling */
          .notes-paper .ProseMirror ul[data-type='taskList'] {
            list-style-type: none;
            padding: 0;
            margin: 0;
          }

          .notes-paper .ProseMirror ul[data-type='taskList'] li {
            display: flex;
            min-height: 28px;
            margin: 0;
            padding: 0;
            position: relative;
          }

          .notes-paper .ProseMirror ul[data-type='taskList'] li > label {
            display: flex;
            align-items: center;
            margin-right: 0.5em;
            user-select: none;
            line-height: 28px;
            height: 28px;
            padding-top: 0;
          }

          .notes-paper .ProseMirror ul[data-type='taskList'] li > div {
            flex-grow: 1;
            padding: 0;
            margin: 0;
            line-height: 28px;
            display: flex;
            align-items: center;
          }

          .notes-paper .ProseMirror ul[data-type='taskList'] li > div > p {
            margin: 0;
            padding: 0;
            line-height: 28px;
          }
        `}</style>
      </div>
    </div>
  );
}
