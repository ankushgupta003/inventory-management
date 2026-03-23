import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}
