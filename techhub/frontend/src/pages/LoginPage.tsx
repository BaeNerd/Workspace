import { useAuth } from "../context/useAuth";
import type { CurrentUser } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// ============================================================
// ★ 신규 — 데모 전용 계정 프리셋 (DEMO 전용)
// ------------------------------------------------------------
// 권한체계(B안) 동작을 데모에서 확인하기 위한 계정 목록.
// - 전사관리자(global): 전체 관계사 열람·관리·집계
// - 관계사관리자(company): managedCompanies 범위만 관리·집계
// - 일반 사용자(user): 관리자 화면 접근 불가
//
// ⚠️ 백엔드(Microsoft SSO) 연동 시 이 블록과 계정 선택 UI 전량 폐기.
//    실제 사용자 속성은 GET /api/v1/auth/me 응답(adminScope·managedCompanies 포함)에서 온다.
// ============================================================
type DemoAccount = { key: string; label: string; desc: string; user: NonNullable<CurrentUser> };

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: "global-admin",
    label: "전사관리자",
    desc: "전체 관계사 관리 · 집계",
    user: {
      name: "김관리", email: "admin.kim@kolmar.co.kr", dept: "IT개발팀", title: "팀장",
      role: "admin", company: "KKM", isGroupViewer: true,
      adminScope: "global", managedCompanies: [],
    },
  },
  {
    key: "company-admin-kbh",
    label: "관계사관리자 (콜마비앤에이치)",
    desc: "담당: 콜마비앤에이치 · 콜마생활건강",
    user: {
      name: "이담당", email: "admin.lee@kolmar.co.kr", dept: "경영지원팀", title: "책임",
      role: "admin", company: "KBH", isGroupViewer: false,
      adminScope: "company", managedCompanies: ["KBH", "HC"],
    },
  },
  {
    key: "company-admin-kmg",
    label: "관계사관리자 (콜마글로벌)",
    desc: "담당: 콜마글로벌",
    user: {
      name: "박글로벌", email: "admin.park@kolmar.co.kr", dept: "글로벌사업팀", title: "책임",
      role: "admin", company: "KMG", isGroupViewer: false,
      adminScope: "company", managedCompanies: ["KMG"],
    },
  },
  {
    key: "normal-user",
    label: "일반 사용자",
    desc: "등록 신청만 가능 · 관리자 화면 불가",
    user: {
      name: "정직원", email: "user.jung@kolmar.co.kr", dept: "마케팅팀", title: "사원",
      role: "user", company: "KKM", isGroupViewer: false,
    },
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  // ★ 신규 — 데모 계정 선택 영역 펼침 여부
  const [demoOpen, setDemoOpen] = useState(false);

  // 로그인 후 돌아갈 경로 (예: /login?redirect=/projects/new)
  const redirectTo = searchParams.get("redirect") || "/projects";

  const handleSsoLogin = () => {
    setLoading(true);
    // TODO: 실제 연동 시 아래로 교체
    // window.location.href = `${import.meta.env.VITE_API_URL}/api/v1/auth/login?redirect=${encodeURIComponent(redirectTo)}`;
    // Microsoft Entra ID 인증 페이지로 리다이렉트되며, 인증 성공 후
    // 백엔드가 redirect_uri로 Authorization Code를 담아 복귀시킨다.
    // 콜백 처리는 보통 /auth/callback 같은 별도 라우트에서 수행한다.

    // 데모용 임시 처리: 전사관리자 계정으로 로그인 후 redirectTo로 이동
    setTimeout(() => {
      login(DEMO_ACCOUNTS[0].user);
      navigate(redirectTo);
    }, 800);
  };

  // ★ 신규 — 데모 계정으로 즉시 로그인 (SSO 시뮬레이션 없이 바로 전환)
  const handleDemoLogin = (account: DemoAccount) => {
    login(account.user);
    // 관리자 계정은 관리자 홈으로, 그 외에는 기본 redirect 경로로 이동
    const target = account.user.role === "admin" ? "/admin" : redirectTo;
    navigate(target);
  };

  return (
    <div style={{
      fontFamily: "var(--font-ui)",
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0F172A 0%, #1E3A5F 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        padding: "48px 40px", width: "100%", maxWidth: 380,
        textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* 로고 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.03em", color: "#0F172A" }}>KOLMAR</span>
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Tech Hub</div>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
          Kolmar Tech Hub
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 32, lineHeight: 1.6 }}>
          사내 계정으로 로그인하세요
        </p>

        {/* SSO 로그인 버튼 */}
        <button
          onClick={handleSsoLogin}
          disabled={loading}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: loading ? "#94A3B8" : "#0F172A",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "13px 0", fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {!loading && (
            <svg width="16" height="16" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
          )}
          {loading ? "이동 중..." : "Microsoft 계정으로 로그인"}
        </button>

        {/* ★ 신규 — 데모 계정 선택 (DEMO 전용, 실제 연동 시 제거) */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setDemoOpen(v => !v)}
            style={{
              width: "100%", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 8,
              padding: "10px 0", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            데모 계정으로 로그인
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{ transform: demoOpen ? "rotate(180deg)" : "none" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {demoOpen && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {DEMO_ACCOUNTS.map(acc => {
                const isGlobal = acc.user.adminScope === "global";
                const isCompany = acc.user.adminScope === "company";
                const badgeColor = isGlobal ? "#2563EB" : isCompany ? "#059669" : "#94A3B8";
                const badgeBg = isGlobal ? "#EFF6FF" : isCompany ? "#F0FDF4" : "#F1F5F9";
                const badgeText = isGlobal ? "전사" : isCompany ? "관계사" : "사용자";
                return (
                  <button
                    key={acc.key}
                    onClick={() => handleDemoLogin(acc)}
                    style={{
                      width: "100%", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 8,
                      padding: "10px 12px", cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: badgeColor, background: badgeBg,
                      padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                    }}>{badgeText}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.label}</span>
                      <span style={{ display: "block", fontSize: 10.5, color: "#94A3B8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.desc}</span>
                    </span>
                  </button>
                );
              })}
              <p style={{ fontSize: 10, color: "#CBD5E1", marginTop: 2, lineHeight: 1.5 }}>
                데모 전용 계정입니다. 실제 배포 시 이 영역은 제거됩니다.
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #F1F5F9" }}>
          <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>
            로그인에 문제가 있으신가요?<br />
            <a href="mailto:tech-hub@kolmar.co.kr" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
              tech-hub@kolmar.co.kr
            </a>
            로 문의하세요
          </p>
        </div>

        <div style={{ marginTop: 20, fontSize: 10, color: "#CBD5E1" }}>
          사내 전용 플랫폼 · 외부 접근 불가
        </div>
      </div>
    </div>
  );
}