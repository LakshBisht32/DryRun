import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function GuestRoute({ children }) {
  const { token, user } = useAuth();

  if (token && user) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
}
