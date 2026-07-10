import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export type Role = "user" | "companyAdmin" | "admin";

export type CurrentUser = {
  name: string;
  email: string;
  dept: string;
  title: string;
  role: Role;
  company: string;         // 소속 관계사 코드 (예: "KKM" = 한국콜마)
  isGroupViewer: boolean;  // 그룹 전체보기 권한
  department?: string;     // 업무 분야 카테고리 — 히어로 카드 매칭용
  managedCompany?: string; // CompanyAdmin 전용: 담당 관계사 코드
} | null;

type AuthContextType = {
  user: CurrentUser;
  loading: boolean;
  login: (user: NonNullable<CurrentUser>) => void;
  logout: () => void;
  isAdmin: boolean;
  isCompanyAdmin: boolean;
  isGroupViewer: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  // 데모용: 새로고침해도 유지되도록 sessionStorage 사용 (실제 연동 시 제거)
  useEffect(() => {
    const saved = sessionStorage.getItem("demo_user");
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = (u: NonNullable<CurrentUser>) => {
    setUser(u);
    sessionStorage.setItem("demo_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("demo_user");
  };

  const isAdmin = user?.role === "admin";
  const isCompanyAdmin = user?.role === "companyAdmin";

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin,
      isCompanyAdmin,
      isGroupViewer: user?.isGroupViewer ?? false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
