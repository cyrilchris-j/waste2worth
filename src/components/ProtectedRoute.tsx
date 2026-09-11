import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoading } from './ui';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { firebaseUser, userProfile, role, loading } = useAuth();

  if (loading) return <PageLoading />;
  if (!firebaseUser && !userProfile) return <Navigate to="/login" replace />;
  if (requiredRole && role?.toUpperCase() !== requiredRole.toUpperCase()) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
