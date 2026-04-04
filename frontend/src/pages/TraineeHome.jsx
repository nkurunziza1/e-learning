import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function TraineeHome() {
  const { user, logout } = useAuth();
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    api('/api/attempts/mine')
      .then(setAttempts)
      .catch(() => setAttempts([]));
  }, []);

  return (
    <div className="layout">
      <div className="nav">
        <div>
          <h1 style={{ margin: 0 }}>Hello, {user.name}</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>Introduction to Research — MCQ assessment</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => logout()}>
          Log out
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Start a quiz</h2>
        <p style={{ color: 'var(--muted)' }}>
          You will get a random set of questions from the bank, one at a time. Pass score applies at the end.
        </p>
        <Link className="btn btn-primary" to="/quiz">
          Begin assessment
        </Link>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Past attempts</h2>
        {attempts.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No completed attempts yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Score</th>
                <th>Result</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td>{a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '—'}</td>
                  <td>{a.score}%</td>
                  <td>
                    <span className={`badge ${a.passed ? 'ok' : 'fail'}`}>{a.passed ? 'Pass' : 'Fail'}</span>
                  </td>
                  <td>
                    <Link className="btn btn-ghost" style={{ padding: '0.35rem 0.6rem' }} to={`/results/${a.id}`}>
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
