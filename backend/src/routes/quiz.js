import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';

const router = Router();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

router.post('/start', authRequired, requireRole('trainee'), async (req, res) => {
  const count = Math.max(1, Math.min(50, Number(process.env.QUIZ_QUESTION_COUNT) || 5));
  const total = await pool.query('SELECT COUNT(*)::int AS c FROM questions');
  const n = total.rows[0].c;
  if (n === 0) {
    return res.status(400).json({ error: 'No questions in bank' });
  }
  const pick = Math.min(count, n);
  const r = await pool.query(
    `SELECT id, stem, options, topic_tag, difficulty FROM questions ORDER BY RANDOM() LIMIT $1`,
    [pick]
  );
  const ids = r.rows.map((q) => q.id);
  const attempt = await pool.query(
    `INSERT INTO attempts (user_id, question_ids) VALUES ($1, $2::jsonb) RETURNING id, started_at`,
    [req.user.id, JSON.stringify(ids)]
  );
  const questions = r.rows.map((q) => ({
    id: q.id,
    stem: q.stem,
    options: q.options,
    topic_tag: q.topic_tag,
    difficulty: q.difficulty,
  }));
  res.status(201).json({
    attemptId: attempt.rows[0].id,
    startedAt: attempt.rows[0].started_at,
    questions: shuffle(questions),
  });
});

router.post('/submit/:attemptId', authRequired, requireRole('trainee'), async (req, res) => {
  const attemptId = Number(req.params.attemptId);
  const { answers } = req.body || {};
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'answers array required' });
  }
  const aCheck = await pool.query(
    `SELECT id, user_id, submitted_at, question_ids FROM attempts WHERE id = $1`,
    [attemptId]
  );
  if (aCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Attempt not found' });
  }
  const att = aCheck.rows[0];
  if (att.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (att.submitted_at) {
    return res.status(400).json({ error: 'Already submitted' });
  }

  let allowed = att.question_ids;
  if (typeof allowed === 'string') {
    allowed = JSON.parse(allowed || '[]');
  }
  if (!Array.isArray(allowed)) {
    allowed = [];
  }
  allowed = allowed.map(Number);
  const allowedSet = new Set(allowed);
  const answerIds = answers.map((x) => Number(x.questionId));
  if (answerIds.length !== allowed.length) {
    return res.status(400).json({ error: 'Must submit one answer per question in this attempt' });
  }
  const seen = new Set();
  for (const id of answerIds) {
    if (!allowedSet.has(id) || seen.has(id)) {
      return res.status(400).json({ error: 'Invalid or duplicate question in answers' });
    }
    seen.add(id);
  }
  const qIds = answerIds;
  const placeholders = qIds.map((_, i) => `$${i + 1}`).join(',');
  const qr = await pool.query(
    `SELECT id, stem, options, answer_key, topic_tag, difficulty, explanation FROM questions WHERE id IN (${placeholders})`,
    qIds
  );
  const byId = Object.fromEntries(qr.rows.map((q) => [q.id, q]));

  let correct = 0;
  const feedback = [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const ans of answers) {
      const qid = Number(ans.questionId);
      const sel = String(ans.selected || '').toUpperCase();
      const q = byId[qid];
      if (!q || !['A', 'B', 'C', 'D'].includes(sel)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid question or option' });
      }
      const isCorrect = q.answer_key === sel;
      if (isCorrect) correct += 1;
      await client.query(
        `INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [attemptId, qid, sel, isCorrect]
      );
      feedback.push({
        questionId: qid,
        stem: q.stem,
        options: q.options,
        selected: sel,
        correctKey: q.answer_key,
        isCorrect,
        explanation: q.explanation || '',
        topic_tag: q.topic_tag,
      });
    }
    const total = answers.length;
    const score = total === 0 ? 0 : Math.round((correct / total) * 100);
    const passPercent = Number(process.env.PASS_PERCENT) || 70;
    const passed = score >= passPercent;

    await client.query(
      `UPDATE attempts SET submitted_at = NOW(), score = $1, passed = $2 WHERE id = $3`,
      [score, passed, attemptId]
    );

    let certificate = null;
    if (passed) {
      const code = crypto.randomBytes(16).toString('hex');
      const cr = await client.query(
        `INSERT INTO certificates (user_id, attempt_id, code) VALUES ($1, $2, $3) RETURNING id, code, issued_at`,
        [req.user.id, attemptId, code]
      );
      certificate = cr.rows[0];
    }

    await client.query('COMMIT');
    res.json({
      attemptId,
      score,
      totalQuestions: total,
      correctCount: correct,
      passed,
      passThreshold: passPercent,
      feedback: shuffle(feedback),
      certificate,
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Submit failed' });
  } finally {
    client.release();
  }
});

router.get('/certificate/:certificateId/pdf', authRequired, async (req, res) => {
  const certificateId = Number(req.params.certificateId);
  const r = await pool.query(
    `SELECT c.id, c.code, c.issued_at, c.user_id, c.attempt_id, u.name, u.email, a.score
     FROM certificates c
     JOIN users u ON u.id = c.user_id
     JOIN attempts a ON a.id = c.attempt_id
     WHERE c.id = $1`,
    [certificateId]
  );
  if (r.rows.length === 0) {
    return res.status(404).json({ error: 'Not found' });
  }
  const row = r.rows[0];
  if (row.user_id !== req.user.id && req.user.role !== 'facilitator') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${row.code}.pdf"`);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);
  doc.fontSize(22).text('Certificate of Completion', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text('Introduction to Research — MCQ Assessment', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(14).text(`This certifies that`, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(18).text(row.name, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`has successfully passed the module assessment (score: ${row.score}%).`, {
    align: 'center',
  });
  doc.moveDown(2);
  doc.fontSize(10).text(`Certificate code: ${row.code}`, { align: 'center' });
  doc.text(`Issued: ${new Date(row.issued_at).toISOString().slice(0, 10)}`, { align: 'center' });
  doc.text('Organisation: Greenstarz', { align: 'center' });
  doc.end();
});

export default router;
