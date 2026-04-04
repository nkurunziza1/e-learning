import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, apiBlob } from '../api.js';

export default function Results() {
  const { attemptId } = useParams();
  const location = useLocation();
  const [data, setData] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (location.state?.result) {
      return;
    }
    api(`/api/attempts/${attemptId}`)
      .then((d) => {
        setData({
          attemptId: d.attempt.id,
          score: d.attempt.score,
          totalQuestions: d.feedback.length,
          correctCount: d.feedback.filter((f) => f.isCorrect).length,
          passed: d.attempt.passed,
          passThreshold: d.passThreshold,
          feedback: d.feedback,
          certificate: d.certificateId ? { id: d.certificateId } : null,
        });
        setLoading(false);
      })
      .catch((e) => {
        setErr(e.message || 'Could not load results');
        setLoading(false);
      });
  }, [attemptId, location.state]);

  if (loading) {
    return (
      <div className="layout">
        <p>Loading results…</p>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="layout">
        <p className="error">{err || 'No data'}</p>
        <Link className="btn btn-primary" to="/">
          Home
        </Link>
      </div>
    );
  }

  async function downloadCert() {
    if (!data.certificate?.id) return;
    const blob = await apiBlob(`/api/quiz/certificate/${data.certificate.id}/pdf`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${data.certificate.code || data.certificate.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="layout">
      <h1 style={{ marginTop: 0 }}>Results</h1>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>
          Score: <strong>{data.score}%</strong> ({data.correctCount}/{data.totalQuestions} correct)
        </p>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Pass threshold: {data.passThreshold}%
        </p>
        <p style={{ margin: '0.75rem 0 0' }}>
          <span className={`badge ${data.passed ? 'ok' : 'fail'}`}>
            {data.passed ? 'Passed' : 'Not passed'}
          </span>
        </p>
        {data.passed && data.certificate && (
          <p style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-primary" onClick={downloadCert}>
              Download certificate (PDF)
            </button>
          </p>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Review</h2>
        {data.feedback.map((f) => (
          <div key={f.questionId} className="feedback-item">
            <p className="badge">{f.topic_tag}</p>
            <h3 style={{ fontSize: '1rem', margin: '0.5rem 0' }}>{f.stem}</h3>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
              Your answer: <strong>{f.selected}</strong> · Correct: <strong>{f.correctKey}</strong>{' '}
              {f.isCorrect ? (
                <span style={{ color: 'var(--accent)' }}>✓</span>
              ) : (
                <span style={{ color: 'var(--danger)' }}>✗</span>
              )}
            </p>
            {f.explanation && (
              <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>{f.explanation}</p>
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: '1.5rem' }}>
        <Link className="btn btn-ghost" to="/">
          Back to home
        </Link>
      </p>
    </div>
  );
}
