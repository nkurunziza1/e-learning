import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';

export default function FacilitatorAttempts() {
  const { logout } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api('/api/attempts/summary').then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div className="layout">
      <div className="nav">
        <div>
          <h1 style={{ margin: 0 }}>Trainee attempts</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>Submitted assessments</p>
        </div>
        <div className="nav-links">
          <Link className="btn btn-ghost" to="/facilitator">
            Questions
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Trainee</th>
              <th>Email</th>
              <th>Submitted</th>
              <th>Score</th>
              <th>Pass/Fail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.trainee_name}</td>
                <td>{r.trainee_email}</td>
                <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</td>
                <td>{r.score}%</td>
                <td>
                  <span className={`badge ${r.passed ? 'ok' : 'fail'}`}>{r.passed ? 'Pass' : 'Fail'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p style={{ color: 'var(--muted)' }}>No attempts yet.</p>}
      </div>
    </div>
  );
}
