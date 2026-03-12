const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all notes (with optional search & filter)
router.get('/', async (req, res) => {
  try {
    const { search, archived } = req.query;
    let query = '';
    let params = [];

    if (search) {
      query = `
        SELECT * FROM notes 
        WHERE is_archived = $1 
          AND (title ILIKE $2 OR content ILIKE $2)
        ORDER BY is_pinned DESC, updated_at DESC
      `;
      params = [archived === 'true', `%${search}%`];
    } else {
      query = `
        SELECT * FROM notes 
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
    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);

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
    const result = await pool.query(
      'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
      [title || 'Untitled', content || '']
    );
    res.status(201).json(result.rows[0]);
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

    res.json(result.rows[0]);
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
