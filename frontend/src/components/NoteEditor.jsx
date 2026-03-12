import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HiOutlineTrash,
  HiOutlineArchive,
  HiOutlineClock,
} from 'react-icons/hi';
import { BsPin, BsPinFill } from 'react-icons/bs';
import { format } from 'date-fns';
import { useDebounce } from '../hooks/useDebounce';

export default function NoteEditor({ note, onUpdate, onDelete }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const isInitialLoad = useRef(true);
  const titleRef = useRef(null);
  const contentRef = useRef(null);

  // Load note data
  useEffect(() => {
    if (note) {
      isInitialLoad.current = true;
      setTitle(note.title || '');
      setContent(note.content || '');
      setSaveStatus('saved');
      setShowDeleteConfirm(false);
    }
  }, [note?.id]);

  const debouncedTitle = useDebounce(title, 800);
  const debouncedContent = useDebounce(content, 800);

  // Auto-save on debounced changes
  useEffect(() => {
    if (!note || isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (debouncedTitle !== note.title || debouncedContent !== note.content) {
      setSaveStatus('saving');
      onUpdate(note.id, { title: debouncedTitle, content: debouncedContent })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('error'));
    }
  }, [debouncedTitle, debouncedContent]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setSaveStatus('unsaved');
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setSaveStatus('unsaved');
  };

  const handlePin = () => {
    onUpdate(note.id, { is_pinned: !note.is_pinned });
  };

  const handleArchive = () => {
    onUpdate(note.id, { is_archived: !note.is_archived });
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(note.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // Handle tab key in content area
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      setSaveStatus('unsaved');
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  if (!note) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-content">
          <div className="editor-empty-icon">📝</div>
          <h2>Select a note or create a new one</h2>
          <p>Your notes will appear here</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy · h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <div className="editor">
      <div className="editor-toolbar">
        <div className="editor-meta">
          <HiOutlineClock className="meta-icon" />
          <span className="meta-date">{formatDate(note.updated_at)}</span>
          <span className={`save-indicator ${saveStatus}`}>
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
              ? 'Saved'
              : saveStatus === 'error'
              ? 'Error saving'
              : 'Unsaved changes'}
          </span>
        </div>
        <div className="editor-actions">
          <button
            className={`btn-action ${note.is_pinned ? 'active' : ''}`}
            onClick={handlePin}
            title={note.is_pinned ? 'Unpin note' : 'Pin note'}
          >
            {note.is_pinned ? <BsPinFill /> : <BsPin />}
          </button>
          <button
            className="btn-action"
            onClick={handleArchive}
            title={note.is_archived ? 'Unarchive note' : 'Archive note'}
          >
            <HiOutlineArchive />
          </button>
          <button
            className={`btn-action danger ${showDeleteConfirm ? 'confirm' : ''}`}
            onClick={handleDelete}
            title={showDeleteConfirm ? 'Click again to confirm' : 'Delete note'}
          >
            <HiOutlineTrash />
            {showDeleteConfirm && <span className="confirm-text">Confirm?</span>}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <input
          ref={titleRef}
          type="text"
          className="editor-title"
          placeholder="Note title..."
          value={title}
          onChange={handleTitleChange}
        />
        <textarea
          ref={contentRef}
          className="editor-textarea"
          placeholder="Start writing your note..."
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
