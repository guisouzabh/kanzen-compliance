import { Navigate, Outlet } from 'react-router-dom';

interface RequireAuthProps {
  allowedRoles?: string[];
}

function getRoleFromToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = getRoleFromToken(token);
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}

export default RequireAuth;
