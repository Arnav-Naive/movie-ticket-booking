import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function VerifierRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (!user.is_staff && !user.is_verifier)) return <Navigate to="/" replace />;
  return children;
}

export default VerifierRoute;