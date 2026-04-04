import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '../schema.sql');

async function main() {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);

  const email = process.env.SEED_FACILITATOR_EMAIL || 'facilitator@greenstarz.local';
  const password = process.env.SEED_FACILITATOR_PASSWORD || 'facilitator123';
  const hash = await bcrypt.hash(password, 10);
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'facilitator')`,
      ['Module Facilitator', email, hash]
    );
  }

  const qCount = await pool.query('SELECT COUNT(*)::int AS c FROM questions');
  if (qCount.rows[0].c === 0) {
    const samples = [
      {
        stem: 'What is the primary purpose of a literature review in research?',
        options: { A: 'To summarize unrelated books', B: 'To situate your study in existing knowledge', C: 'To replace primary data collection', D: 'To avoid citing sources' },
        answer_key: 'B',
        topic_tag: 'Literature Review',
        difficulty: 'easy',
        explanation: 'A literature review positions your work within the scholarly conversation.',
      },
      {
        stem: 'Which of the following best describes a research hypothesis?',
        options: { A: 'A vague opinion', B: 'A testable prediction', C: 'A final conclusion', D: 'A bibliography entry' },
        answer_key: 'B',
        topic_tag: 'Research Design',
        difficulty: 'easy',
        explanation: 'A hypothesis is a specific, testable statement about expected outcomes.',
      },
      {
        stem: 'What does "validity" refer to in measurement?',
        options: { A: 'How cheap the instrument is', B: 'Whether the measure captures what it intends', C: 'Sample size only', D: 'How fast data is collected' },
        answer_key: 'B',
        topic_tag: 'Data Collection',
        difficulty: 'medium',
        explanation: 'Validity concerns whether conclusions from scores are appropriate for the construct.',
      },
      {
        stem: 'Snowball sampling is most associated with:',
        options: { A: 'Random digit dialing', B: 'Recruiting participants through referrals', C: 'Stratified random sampling', D: 'Census enumeration' },
        answer_key: 'B',
        topic_tag: 'Data Collection',
        difficulty: 'medium',
        explanation: 'Snowball sampling uses participant referrals to reach hard-to-access groups.',
      },
      {
        stem: 'A mixed-methods design typically:',
        options: { A: 'Uses only quantitative data', B: 'Combines qualitative and quantitative approaches', C: 'Avoids ethics review', D: 'Ignores theory' },
        answer_key: 'B',
        topic_tag: 'Research Design',
        difficulty: 'medium',
        explanation: 'Mixed methods integrate qualitative and quantitative data to strengthen inquiry.',
      },
      {
        stem: 'Peer review primarily aims to:',
        options: { A: 'Increase journal profits', B: 'Assess quality and rigor before publication', C: 'Remove all errors automatically', D: 'Replace replication' },
        answer_key: 'B',
        topic_tag: 'Literature Review',
        difficulty: 'easy',
        explanation: 'Peer review is a quality-control process for scholarly communication.',
      },
      {
        stem: 'Informed consent in research means participants:',
        options: { A: 'Waive all rights', B: 'Understand risks and voluntarily agree', C: 'Pay a fee', D: 'Remain anonymous in all cases' },
        answer_key: 'B',
        topic_tag: 'Research Design',
        difficulty: 'easy',
        explanation: 'Informed consent requires disclosure, comprehension, voluntariness, and competence.',
      },
      {
        stem: 'Which is an example of primary data?',
        options: { A: 'A textbook summary', B: 'Surveys you administer for your study', C: 'A Wikipedia article', D: 'A meta-analysis table from a paper' },
        answer_key: 'B',
        topic_tag: 'Data Collection',
        difficulty: 'easy',
        explanation: 'Primary data are collected firsthand for the research purpose.',
      },
    ];
    for (const q of samples) {
      await pool.query(
        `INSERT INTO questions (stem, options, answer_key, topic_tag, difficulty, explanation)
         VALUES ($1, $2::jsonb, $3, $4, $5, $6)`,
        [q.stem, JSON.stringify(q.options), q.answer_key, q.topic_tag, q.difficulty, q.explanation]
      );
    }
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
