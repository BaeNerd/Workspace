import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export type Role = "user" | "admin";

// 관리자 범위: global = 전사관리자(시스템관리자 역할 흡수, 전체 권한),
//             company = 관계사관리자(managedCompanies에 포함된 관계사만 관리)
export type AdminScope = "global" | "company";

export type CurrentUser = {
  name: string;
  email: string;
  dept: string;
  title: string;
  role: Role;
  company: string;         // 소속 관계사 코드 (예: "KKM" = 한국콜마) — TODO: SSO 연동 시 Graph API 조직 속성에서 매핑
  isGroupViewer: boolean;  // 그룹 전체보기 권한 — TODO: 백엔드 GET /api/v1/auth/me 응답에 포함되어야 함
  // ★ 신규 — 관리자 권한 범위. role === "admin"일 때만 의미 있음.
  //   adminScope 미지정(레거시) 시 "global"로 간주해 기존 동작과 호환.
  adminScope?: AdminScope;
  managedCompanies?: string[]; // adminScope === "company"일 때 담당 관계사 코드 목록. Teams 동기화 관계사 코드와 동일 소스.
} | null;

type AuthContextType = {
  user: CurrentUser;
  loading: boolean;
  login: (user: NonNullable<CurrentUser>) => void;
  logout: () => void;
  isAdmin: boolean;
  isGroupViewer: boolean;
  // ★ 신규 — 권한 판정 헬퍼 (모든 관리자 화면이 이 기준을 재사용)
  isGlobalAdmin: boolean;
  managedCompanies: string[];
  canManageCompany: (code: string) => boolean;
  canManageItem: (companies: string[], isCompanyWide?: boolean) => boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  // TODO: 실제 연동 시 앱 진입 시 세션 확인
  // useEffect(() => {
  //   fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, { credentials: "include" })
  //     .then(res => res.ok ? res.json() : null)
  //     .then(data => setUser(data)) // data에는 company, isGroupViewer, adminScope, managedCompanies가 포함되어 응답되어야 함
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

  const isAdmin = user?.role === "admin";
  // adminScope 미지정(레거시 데이터)은 전사관리자로 간주 → 기존 단일 Admin 동작과 호환
  const isGlobalAdmin = isAdmin && (user?.adminScope ?? "global") === "global";
  const managedCompanies = user?.managedCompanies ?? [];

  // 단일 관계사 코드 관리 가능 여부
  const canManageCompany = (code: string): boolean => {
    if (!isAdmin) return false;
    if (isGlobalAdmin) return true;
    return managedCompanies.includes(code);
  };

  // 항목(프로젝트·플랫폼) 관리 가능 여부.
  //  - companies: 항목이 속한 관계사 코드 목록 (프로젝트는 orgEntries의 company, 플랫폼은 company 필드)
  //  - isCompanyWide: 전사 공용 항목 여부(플랫폼에서 company가 빈 배열인 경우)
  // 규칙: (가) 전사 공용은 global만 관리 / (나) 특정 관계사 항목은 담당 관계사가 하나라도 겹치면 관리 가능
  const canManageItem = (companies: string[], isCompanyWide = false): boolean => {
    if (!isAdmin) return false;
    if (isGlobalAdmin) return true;
    if (isCompanyWide) return false; // 전사 공용은 관계사관리자 권한 밖
    return companies.some(code => managedCompanies.includes(code));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin,
      isGroupViewer: user?.isGroupViewer ?? false,
      isGlobalAdmin,
      managedCompanies,
      canManageCompany,
      canManageItem,
    }}>
      {children}
    </AuthContext.Provider>
  );
}