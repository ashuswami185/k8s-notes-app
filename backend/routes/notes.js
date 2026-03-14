const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const notificationTimers = {};
const DEBOUNCE_TIME = 5 * 60 * 1000; // 5 minutes

function queueEmailNotification(noteId, noteTitle, authorName, authorEmail) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  
  if (notificationTimers[noteId]) {
    clearTimeout(notificationTimers[noteId]);
  }
  
  notificationTimers[noteId] = setTimeout(async () => {
    try {
      const usersRes = await pool.query('SELECT name, email FROM users WHERE email != $1', [authorEmail]);
      if (usersRes.rows.length === 0) return;
      
      const recipient = usersRes.rows[0];
      
      await transporter.sendMail({
        from: `"Notes App" <${process.env.SMTP_USER}>`,
        to: recipient.email,
        subject: `[Notes App] ${authorName} updated a note: ${noteTitle}`,
        text: `Hello ${recipient.name},\n\n${authorName} just made some changes to the note "${noteTitle}".\n\nLogin to the app to see the updates!`,
        html: `<h3>Hello ${recipient.name},</h3><p><b>${authorName}</b> just made some changes to the note "<b>${noteTitle}</b>".</p><p>Login to the app to see the updates!</p>`
      });
      console.log(`✅ Notification email sent to ${recipient.email} for note ${noteId}`);
    } catch (err) {
      console.error('❌ Failed to send notification email:', err);
    } finally {
      delete notificationTimers[noteId];
    }
  }, DEBOUNCE_TIME);
}

// Apply auth middleware to all note routes
router.use(authMiddleware);

// GET all notes (with optional search & filter)
router.get('/', async (req, res) => {
  try {
    const { search, archived } = req.query;
    let query = '';
    let params = [];

    if (search) {
      query = `
        SELECT notes.*, users.name as author_name FROM notes 
        LEFT JOIN users ON notes.user_id = users.id
        WHERE is_archived = $1 
          AND (title ILIKE $2 OR content ILIKE $2)
        ORDER BY is_pinned DESC, updated_at DESC
      `;
      params = [archived === 'true', `%${search}%`];
    } else {
      query = `
        SELECT notes.*, users.name as author_name FROM notes 
        LEFT JOIN users ON notes.user_id = users.id
        WHERE is_archived = $1
        ORDER BY is_pinned DESC, updated_at DESC
      `;
      params = [archived === 'true'];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET single note
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT notes.*, users.name as author_name FROM notes 
       LEFT JOIN users ON notes.user_id = users.id
       WHERE notes.id = $1`, 
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching note:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST create note
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;
    
    const result = await pool.query(
      'INSERT INTO notes (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title || 'Untitled', content || '', userId]
    );
    
    // Return with the author name so frontend can display immediately
    const newNote = result.rows[0];
    newNote.author_name = req.user.name;
    
    queueEmailNotification(newNote.id, newNote.title, req.user.name, req.user.email);
    
    res.status(201).json(newNote);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT update note
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_pinned, is_archived, color } = req.body;

    const result = await pool.query(
      `UPDATE notes 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           is_pinned = COALESCE($3, is_pinned),
           is_archived = COALESCE($4, is_archived),
           color = $5
       WHERE id = $6 
       RETURNING *`,
      [title, content, is_pinned, is_archived, color, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updatedNote = result.rows[0];
    
    // we should also fetch author_name to return back
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [updatedNote.user_id]);
    if (userResult.rows.length > 0) {
      updatedNote.author_name = userResult.rows[0].name;
    }

    queueEmailNotification(updatedNote.id, updatedNote.title, req.user.name, req.user.email);

    res.json(updatedNote);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
