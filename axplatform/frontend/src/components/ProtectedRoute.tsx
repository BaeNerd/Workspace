import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

type ProtectedRouteProps = {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  allowCompanyAdmin?: boolean;
};

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  allowCompanyAdmin = false,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, isCompanyAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (requireAuth && !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireAdmin) {
    const hasAccess = isAdmin || (allowCompanyAdmin && isCompanyAdmin);
    if (!hasAccess) {
      return <Navigate to="/projects" replace />;
    }
  }

  return <>{children}</>;
}
