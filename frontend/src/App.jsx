import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import NoteEditor from './components/NoteEditor';
import { fetchNotes, createNote, updateNote, deleteNote } from './api/notes';
import { useDebounce } from './hooks/useDebounce';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('notes-dark-mode');
    if (saved !== null) return JSON.parse(saved);
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    localStorage.setItem('notes-dark-mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  // Load notes
  const loadNotes = useCallback(async () => {
    try {
      const data = await fetchNotes(debouncedSearch, showArchived);
      setNotes(data);
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, showArchived]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Create new note
  const handleNewNote = async () => {
    try {
      const note = await createNote({
        title: '',
        content: '',
      });
      setNotes((prev) => [note, ...prev]);
      setActiveNoteId(note.id);
      setShowArchived(false);
      toast.success('Note created');
    } catch (err) {
      toast.error('Failed to create note');
    }
  };

  // Update note
  const handleUpdateNote = async (id, data) => {
    try {
      const updated = await updateNote(id, data);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      );
      return updated;
    } catch (err) {
      toast.error('Failed to save note');
      throw err;
    }
  };

  // Delete note
  const handleDeleteNote = async (id) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
      toast.success('Note deleted');
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      // Cmd/Ctrl + N = New note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewNote();
      }
      // Cmd/Ctrl + \ = Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  return (
    <div className="app">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: darkMode ? '#1e293b' : '#1a1a2e',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
      <div className={`app-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        {sidebarOpen && (
          <Sidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNoteId}
            onNewNote={handleNewNote}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showArchived={showArchived}
            onToggleArchived={setShowArchived}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
          />
        )}
        <main className="main-content">
          <button
            className="btn-toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <NoteEditor
            note={activeNote}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
