import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

type ProtectedRouteProps = {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
};

export default function ProtectedRoute({ children, requireAuth = true, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    // TODO: 필요 시 스피너 등으로 교체
    return null;
  }

  if (requireAuth && !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // 관리자가 아닌 사용자가 /admin/* 직접 접근 시도 → Tech Hub로 보냄
    // TODO: 필요 시 "접근 권한이 없습니다" 토스트/안내 페이지로 교체
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}
