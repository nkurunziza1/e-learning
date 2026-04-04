import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user) {
      nav(user.role === 'facilitator' ? '/facilitator' : '/');
    }
  }, [user, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      login(data.token, data.user);
      nav(data.user.role === 'facilitator' ? '/facilitator' : '/');
    } catch (ex) {
      setErr(ex.message || 'Login failed');
    }
  }

  return (
    <div className="layout">
      <div className="nav">
        <h1 style={{ margin: 0 }}>Research Module Assessment</h1>
        <Link className="btn btn-ghost" to="/register">
          Register
        </Link>
      </div>
      <div className="card" style={{ maxWidth: 420 }}>
        <h2 style={{ marginTop: 0 }}>Log in</h2>
        <form onSubmit={onSubmit}>
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
            />
          </div>
          {err && <p className="error">{err}</p>}
          <button type="submit" className="btn btn-primary">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
