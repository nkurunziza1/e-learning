import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import HomeRedirect from './pages/HomeRedirect.jsx';
import Quiz from './pages/Quiz.jsx';
import Results from './pages/Results.jsx';
import FacilitatorQuestions from './pages/FacilitatorQuestions.jsx';
import FacilitatorAttempts from './pages/FacilitatorAttempts.jsx';

function Private({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="layout">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <Private>
            <HomeRedirect />
          </Private>
        }
      />
      <Route
        path="/quiz"
        element={
          <Private role="trainee">
            <Quiz />
          </Private>
        }
      />
      <Route
        path="/results/:attemptId"
        element={
          <Private role="trainee">
            <Results />
          </Private>
        }
      />
      <Route
        path="/facilitator"
        element={
          <Private role="facilitator">
            <FacilitatorQuestions />
          </Private>
        }
      />
      <Route
        path="/facilitator/attempts"
        element={
          <Private role="facilitator">
            <FacilitatorAttempts />
          </Private>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
