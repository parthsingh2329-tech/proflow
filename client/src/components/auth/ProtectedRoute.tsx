import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const location = useLocation();

  // If no access token, immediately redirect to /login
  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
