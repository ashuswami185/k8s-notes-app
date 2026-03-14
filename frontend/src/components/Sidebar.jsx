import { useState } from 'react';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineArchive, HiOutlineDocumentText, HiOutlineSun, HiOutlineMoon, HiOutlineLogout } from 'react-icons/hi';
import { BsPin, BsPinFill } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';

export default function Sidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onNewNote,
  searchQuery,
  onSearchChange,
  showArchived,
  onToggleArchived,
  darkMode,
  onToggleDarkMode,
  onLogout,
  user
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const pinnedNotes = notes.filter((n) => n.is_pinned);
  const unpinnedNotes = notes.filter((n) => !n.is_pinned);

  const formatDate = (dateStr) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getPreview = (content) => {
    if (!content) return 'No content';
    const plain = content.replace(/[#*_~`>-]/g, '').trim();
    return plain.length > 80 ? plain.substring(0, 80) + '...' : plain;
  };

  const NoteItem = ({ note }) => (
    <button
      className={`sidebar-note ${activeNoteId === note.id ? 'active' : ''}`}
      onClick={() => onSelectNote(note.id)}
    >
      <div className="sidebar-note-header">
        <span className="sidebar-note-title">
          {note.title || 'Untitled'}
        </span>
        {note.is_pinned && <BsPinFill className="pin-indicator" />}
      </div>
      <p className="sidebar-note-preview">{getPreview(note.content)}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="sidebar-note-date">{formatDate(note.updated_at)}</span>
        {note.author_name && (
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            by {note.author_name}
          </span>
        )}
      </div>
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">
          <HiOutlineDocumentText className="logo-icon" />
          Notes
        </h1>
        <div className="header-actions">
          <button className="btn-icon" onClick={onLogout} title="Logout" style={{ color: 'var(--danger)' }}>
            <HiOutlineLogout />
          </button>
          <button className="btn-icon" onClick={onToggleDarkMode} title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <HiOutlineSun /> : <HiOutlineMoon />}
          </button>
          <button className="btn-new-note" onClick={onNewNote} title="New note">
            <HiOutlinePlus />
          </button>
        </div>
      </div>

      <div className={`search-container ${isSearchFocused ? 'focused' : ''}`}>
        <HiOutlineSearch className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
      </div>

      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${!showArchived ? 'active' : ''}`}
          onClick={() => onToggleArchived(false)}
        >
          All Notes
        </button>
        <button
          className={`sidebar-tab ${showArchived ? 'active' : ''}`}
          onClick={() => onToggleArchived(true)}
        >
          <HiOutlineArchive style={{ marginRight: '4px' }} />
          Archived
        </button>
      </div>

      <div className="sidebar-notes-list">
        {notes.length === 0 ? (
          <div className="sidebar-empty">
            <p>{showArchived ? 'No archived notes' : 'No notes yet'}</p>
            {!showArchived && (
              <button className="btn-create-first" onClick={onNewNote}>
                Create your first note
              </button>
            )}
          </div>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <>
                <div className="sidebar-section-label">Pinned</div>
                {pinnedNotes.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </>
            )}
            {unpinnedNotes.length > 0 && (
              <>
                {pinnedNotes.length > 0 && (
                  <div className="sidebar-section-label">Others</div>
                )}
                {unpinnedNotes.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
