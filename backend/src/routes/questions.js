import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, requireRole('facilitator'), async (_req, res) => {
  const r = await pool.query(
    `SELECT id, stem, options, answer_key, topic_tag, difficulty, explanation FROM questions ORDER BY id`
  );
  res.json(r.rows);
});

router.post('/', authRequired, requireRole('facilitator'), async (req, res) => {
  const { stem, options, answer_key, topic_tag, difficulty, explanation } = req.body || {};
  if (!stem || !options || !answer_key || !topic_tag || !difficulty) {
    return res.status(400).json({ error: 'stem, options, answer_key, topic_tag, difficulty required' });
  }
  const key = String(answer_key).toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(key)) {
    return res.status(400).json({ error: 'answer_key must be A–D' });
  }
  try {
    const r = await pool.query(
      `INSERT INTO questions (stem, options, answer_key, topic_tag, difficulty, explanation)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6)
       RETURNING id, stem, options, answer_key, topic_tag, difficulty, explanation`,
      [stem, JSON.stringify(options), key, topic_tag, difficulty, explanation || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not create question' });
  }
});

router.put('/:id', authRequired, requireRole('facilitator'), async (req, res) => {
  const id = Number(req.params.id);
  const { stem, options, answer_key, topic_tag, difficulty, explanation } = req.body || {};
  if (!stem || !options || !answer_key || !topic_tag || !difficulty) {
    return res.status(400).json({ error: 'stem, options, answer_key, topic_tag, difficulty required' });
  }
  const key = String(answer_key).toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(key)) {
    return res.status(400).json({ error: 'answer_key must be A–D' });
  }
  const r = await pool.query(
    `UPDATE questions SET stem=$1, options=$2::jsonb, answer_key=$3, topic_tag=$4, difficulty=$5, explanation=$6
     WHERE id=$7
     RETURNING id, stem, options, answer_key, topic_tag, difficulty, explanation`,
    [stem, JSON.stringify(options), key, topic_tag, difficulty, explanation || null, id]
  );
  if (r.rows.length === 0) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(r.rows[0]);
});

router.delete('/:id', authRequired, requireRole('facilitator'), async (req, res) => {
  const id = Number(req.params.id);
  const r = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);
  if (r.rows.length === 0) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(204).send();
});

export default router;
