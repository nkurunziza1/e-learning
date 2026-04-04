import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Register() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user) {
      nav('/');
    }
  }, [user, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      login(data.token, data.user);
      nav('/');
    } catch (ex) {
      setErr(ex.message || 'Registration failed');
    }
  }

  return (
    <div className="layout">
      <div className="nav">
        <h1 style={{ margin: 0 }}>Trainee registration</h1>
        <Link className="btn btn-ghost" to="/login">
          Log in
        </Link>
      </div>
      <div className="card" style={{ maxWidth: 420 }}>
        <h2 style={{ marginTop: 0 }}>Create account</h2>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>Introduction to Research — trainee access only.</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {err && <p className="error">{err}</p>}
          <button type="submit" className="btn btn-primary">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
