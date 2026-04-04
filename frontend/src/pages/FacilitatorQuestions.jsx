import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';

const empty = {
  stem: '',
  options: { A: '', B: '', C: '', D: '' },
  answer_key: 'A',
  topic_tag: 'Research Design',
  difficulty: 'easy',
  explanation: '',
};

export default function FacilitatorQuestions() {
  const { logout } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');

  function load() {
    api('/api/questions')
      .then(setItems)
      .catch(() => setItems([]));
  }

  useEffect(() => {
    load();
  }, []);

  function setOpt(letter, v) {
    setForm({ ...form, options: { ...form.options, [letter]: v } });
  }

  async function save(e) {
    e.preventDefault();
    setErr('');
    const body = {
      stem: form.stem,
      options: form.options,
      answer_key: form.answer_key,
      topic_tag: form.topic_tag,
      difficulty: form.difficulty,
      explanation: form.explanation,
    };
    try {
      if (editingId) {
        await api(`/api/questions/${editingId}`, { method: 'PUT', body });
      } else {
        await api('/api/questions', { method: 'POST', body });
      }
      setForm(empty);
      setEditingId(null);
      load();
    } catch (ex) {
      setErr(ex.message || 'Save failed');
    }
  }

  function edit(q) {
    setEditingId(q.id);
    setForm({
      stem: q.stem,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      answer_key: q.answer_key,
      topic_tag: q.topic_tag,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
    });
  }

  async function remove(id) {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api(`/api/questions/${id}`, { method: 'DELETE' });
      load();
    } catch (ex) {
      setErr(ex.message || 'Delete failed');
    }
  }

  return (
    <div className="layout">
      <div className="nav">
        <div>
          <h1 style={{ margin: 0 }}>Facilitator — Question bank</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>Introduction to Research</p>
        </div>
        <div className="nav-links">
          <Link className="btn btn-ghost" to="/facilitator/attempts">
            Trainee attempts
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit question' : 'New question'}</h2>
        <form onSubmit={save}>
          <div className="field">
            <label>Stem</label>
            <textarea value={form.stem} onChange={(e) => setForm({ ...form, stem: e.target.value })} required />
          </div>
          {['A', 'B', 'C', 'D'].map((L) => (
            <div className="field" key={L}>
              <label>Option {L}</label>
              <input value={form.options[L] || ''} onChange={(e) => setOpt(L, e.target.value)} required />
            </div>
          ))}
          <div className="field">
            <label>Correct answer</label>
            <select value={form.answer_key} onChange={(e) => setForm({ ...form, answer_key: e.target.value })}>
              {['A', 'B', 'C', 'D'].map((L) => (
                <option key={L} value={L}>
                  {L}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Topic tag</label>
            <input value={form.topic_tag} onChange={(e) => setForm({ ...form, topic_tag: e.target.value })} required />
          </div>
          <div className="field">
            <label>Difficulty</label>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </div>
          <div className="field">
            <label>Explanation (optional)</label>
            <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
          </div>
          {err && <p className="error">{err}</p>}
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update' : 'Add question'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginLeft: '0.5rem' }}
              onClick={() => {
                setEditingId(null);
                setForm(empty);
              }}
            >
              Cancel edit
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>All questions ({items.length})</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Topic</th>
              <th>Difficulty</th>
              <th>Preview</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((q) => (
              <tr key={q.id}>
                <td>{q.id}</td>
                <td>{q.topic_tag}</td>
                <td>{q.difficulty}</td>
                <td style={{ maxWidth: 280 }}>{q.stem.slice(0, 80)}{q.stem.length > 80 ? '…' : ''}</td>
                <td>
                  <button type="button" className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={() => edit(q)}>
                    Edit
                  </button>{' '}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '0.25rem 0.5rem' }}
                    onClick={() => remove(q.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
