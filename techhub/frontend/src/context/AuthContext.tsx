import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export type Role = "user" | "admin";

export type CurrentUser = {
  name: string;
  email: string;
  dept: string;
  title: string;
  role: Role;
  company: string;         // 소속 관계사 코드 (예: "KKM" = 한국콜마) — TODO: SSO 연동 시 Graph API 조직 속성에서 매핑
  isGroupViewer: boolean;  // 그룹 전체보기 권한 — TODO: 백엔드 GET /api/v1/auth/me 응답에 포함되어야 함
} | null;

type AuthContextType = {
  user: CurrentUser;
  loading: boolean;
  login: (user: NonNullable<CurrentUser>) => void;
  logout: () => void;
  isAdmin: boolean;
  isGroupViewer: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  // TODO: 실제 연동 시 앱 진입 시 세션 확인
  // useEffect(() => {
  //   fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, { credentials: "include" })
  //     .then(res => res.ok ? res.json() : null)
  //     .then(data => setUser(data)) // data에는 company, isGroupViewer가 포함되어 응답되어야 함
  //     .finally(() => setLoading(false));
  // }, []);

  // 데모용: 새로고침해도 유지되도록 sessionStorage 사용 (실제 연동 시 제거)
  useEffect(() => {
    const saved = sessionStorage.getItem("demo_user");
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = (u: NonNullable<CurrentUser>) => {
    setUser(u);
    sessionStorage.setItem("demo_user", JSON.stringify(u)); // 데모용
  };

  const logout = () => {
    // TODO: 실제 연동 시 POST /api/v1/auth/logout 호출
    setUser(null);
    sessionStorage.removeItem("demo_user");
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin: user?.role === "admin",
      isGroupViewer: user?.isGroupViewer ?? false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

