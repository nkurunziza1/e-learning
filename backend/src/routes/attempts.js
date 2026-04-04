import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/mine', authRequired, requireRole('trainee'), async (req, res) => {
  const r = await pool.query(
    `SELECT id, started_at, submitted_at, score, passed FROM attempts
     WHERE user_id = $1 AND submitted_at IS NOT NULL
     ORDER BY submitted_at DESC`,
    [req.user.id]
  );
  res.json(r.rows);
});

router.get('/summary', authRequired, requireRole('facilitator'), async (_req, res) => {
  const r = await pool.query(
    `SELECT a.id, a.started_at, a.submitted_at, a.score, a.passed,
            u.name AS trainee_name, u.email AS trainee_email
     FROM attempts a
     JOIN users u ON u.id = a.user_id
     WHERE a.submitted_at IS NOT NULL
     ORDER BY a.submitted_at DESC`
  );
  res.json(r.rows);
});

router.get('/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const a = await pool.query(
    `SELECT id, user_id, started_at, submitted_at, score, passed FROM attempts WHERE id = $1`,
    [id]
  );
  if (a.rows.length === 0) {
    return res.status(404).json({ error: 'Not found' });
  }
  const row = a.rows[0];
  if (req.user.role === 'trainee' && row.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!row.submitted_at) {
    return res.status(400).json({ error: 'Attempt not finished' });
  }
  const ans = await pool.query(
    `SELECT aa.question_id, aa.selected_option, aa.is_correct,
            q.stem, q.options, q.answer_key, q.explanation, q.topic_tag
     FROM attempt_answers aa
     JOIN questions q ON q.id = aa.question_id
     WHERE aa.attempt_id = $1
     ORDER BY aa.id`,
    [id]
  );
  const cert = await pool.query(`SELECT id FROM certificates WHERE attempt_id = $1`, [id]);
  const feedback = ans.rows.map((q) => ({
    questionId: q.question_id,
    stem: q.stem,
    options: q.options,
    selected: q.selected_option,
    correctKey: q.answer_key,
    isCorrect: q.is_correct,
    explanation: q.explanation || '',
    topic_tag: q.topic_tag,
  }));
  const passThreshold = Number(process.env.PASS_PERCENT) || 70;
  res.json({
    attempt: {
      id: row.id,
      started_at: row.started_at,
      submitted_at: row.submitted_at,
      score: row.score,
      passed: row.passed,
    },
    passThreshold,
    feedback,
    certificateId: cert.rows[0]?.id || null,
  });
});

export default router;
