
import { useAuth } from "../context/useAuth";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";


export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  // 로그인 후 돌아갈 경로 (예: /login?redirect=/projects/new)
  const redirectTo = searchParams.get("redirect") || "/projects";

  const handleSsoLogin = () => {
    setLoading(true);
    // TODO: 실제 연동 시 아래로 교체
    // window.location.href = `${import.meta.env.VITE_API_URL}/api/v1/auth/login?redirect=${encodeURIComponent(redirectTo)}`;
    // Microsoft Entra ID 인증 페이지로 리다이렉트되며, 인증 성공 후
    // 백엔드가 redirect_uri로 Authorization Code를 담아 복귀시킨다.
    // 콜백 처리는 보통 /auth/callback 같은 별도 라우트에서 수행한다.

    // 데모용 임시 처리: 관리자 계정으로 로그인 후 redirectTo로 이동
    setTimeout(() => {
      login({ name: "김관리", email: "admin.kim@kolmar.co.kr", dept: "IT개발팀", title: "팀장", role: "admin", company: "KKM", isGroupViewer: true });
      navigate(redirectTo);
    }, 800);
  };

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, sans-serif",
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