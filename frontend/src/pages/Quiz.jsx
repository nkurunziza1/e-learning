import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Quiz() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [session, setSession] = useState(null);
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState({});

  useEffect(() => {
    api('/api/quiz/start', { method: 'POST' })
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch((e) => {
        setErr(e.message || 'Could not start quiz');
        setLoading(false);
      });
  }, []);

  const qs = session?.questions || [];
  const total = qs.length;
  const current = qs[index];
  const answered = Object.keys(choices).length;
  const pct = total ? (answered / total) * 100 : 0;

  function select(letter) {
    if (!current) return;
    setChoices({ ...choices, [current.id]: letter });
  }

  function next() {
    if (index < total - 1) {
      setIndex(index + 1);
    }
  }

  function prev() {
    if (index > 0) {
      setIndex(index - 1);
    }
  }

  async function submit() {
    if (!session) return;
    for (const q of qs) {
      if (!choices[q.id]) {
        setErr('Answer every question before submitting.');
        return;
      }
    }
    setErr('');
    const answers = qs.map((q) => ({ questionId: q.id, selected: choices[q.id] }));
    try {
      const result = await api(`/api/quiz/submit/${session.attemptId}`, {
        method: 'POST',
        body: { answers },
      });
      nav(`/results/${session.attemptId}`, { state: { result } });
    } catch (e) {
      setErr(e.message || 'Submit failed');
    }
  }

  if (loading) {
    return (
      <div className="layout">
        <p>Preparing your quiz…</p>
      </div>
    );
  }

  if (err && !session) {
    return (
      <div className="layout">
        <p className="error">{err}</p>
        <button type="button" className="btn btn-primary" onClick={() => nav('/')}>
          Back home
        </button>
      </div>
    );
  }

  const opts = current?.options || {};

  return (
    <div className="layout">
      <div className="nav">
        <h2 style={{ margin: 0 }}>Question {index + 1} of {total}</h2>
        <button type="button" className="btn btn-ghost" onClick={() => nav('/')}>
          Exit
        </button>
      </div>
      <div className="progress">
        <div style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="card">
        {current && (
          <>
            <p className="badge">
              {current.topic_tag} · {current.difficulty}
            </p>
            <h3 style={{ marginTop: '0.75rem' }}>{current.stem}</h3>
            {['A', 'B', 'C', 'D'].map((L) => (
              <label key={L} className="option-row">
                <input
                  type="radio"
                  name={`q-${current.id}`}
                  checked={choices[current.id] === L}
                  onChange={() => select(L)}
                />
                <span>
                  <strong>{L}.</strong> {opts[L] || '—'}
                </span>
              </label>
            ))}
          </>
        )}
      </div>
      {err && <p className="error">{err}</p>}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button type="button" className="btn btn-ghost" onClick={prev} disabled={index === 0}>
          Previous
        </button>
        {index < total - 1 ? (
          <button type="button" className="btn btn-primary" onClick={next}>
            Next
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={submit}>
            Submit all answers
          </button>
        )}
      </div>
    </div>
  );
}
