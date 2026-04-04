import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import TraineeHome from './TraineeHome.jsx';

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="layout">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'facilitator') {
    return <Navigate to="/facilitator" replace />;
  }
  return <TraineeHome />;
}
