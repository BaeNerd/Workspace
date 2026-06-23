import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Role = "user" | "admin";

export type CurrentUser = {
  name: string;
  email: string;
  dept: string;
  title: string;
  role: Role;
} | null;

type AuthContextType = {
  user: CurrentUser;
  loading: boolean;
  login: (user: NonNullable<CurrentUser>) => void;
  logout: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  // TODO: 실제 연동 시 앱 진입 시 세션 확인
  // useEffect(() => {
  //   fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, { credentials: "include" })
  //     .then(res => res.ok ? res.json() : null)
  //     .then(data => setUser(data))
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
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}