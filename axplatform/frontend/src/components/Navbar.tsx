// ===== Navbar.tsx =====
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { IS_SHARE_MODE } from "../config/shareMode";
import { SHARE_BANNER_HEIGHT } from "./SharePreviewBanner";
import NotificationBell from "./NotificationBell";
import { COLOR } from "../styles/tokens";

const NAV_LINKS = [
  { label: "이용 가이드", path: "/guide" },
  { label: "AX 플랫폼", path: "/projects" },
  { label: "AX 항목 등록", path: "/projects/new" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, isCompanyAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      position: "sticky", top: IS_SHARE_MODE ? SHARE_BANNER_HEIGHT : 0, zIndex: 100,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
      borderBottom: `1px solid ${COLOR.border}`, padding: "0 32px", height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.03em", color: COLOR.text }}>KOLMAR</span>
          <span style={{ fontWeight: 500, fontSize: 12, color: COLOR.text3 }}>AX Platform</span>
        </div>
        <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {NAV_LINKS.map(l => (
            <span key={l.label} onClick={() => {
              if (location.pathname === l.path) {
                navigate(l.path, { replace: true, state: { _resetAt: Date.now() } });
              } else {
                navigate(l.path);
              }
            }} style={{
              fontSize: 13, cursor: "pointer",
              fontWeight: location.pathname === l.path ? 600 : 500,
              color: location.pathname === l.path ? COLOR.primary : COLOR.text2,
            }}>
              {l.label}
            </span>
          ))}

          {(isAdmin || isCompanyAdmin) && (
            <span onClick={() => navigate("/admin")} style={{
              fontSize: 13, cursor: "pointer",
              fontWeight: location.pathname.startsWith("/admin") ? 700 : 600,
              color: location.pathname.startsWith("/admin") ? "#D97706" : "#92400E",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4.5L6 21l1.5-7.5L2 9h7z" />
              </svg>
              관리자
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* 알림 벨 — 로그인 사용자, 비공유 모드에서만 노출(벨과 동일 소스는 개인화 패널 "알림 현황") */}
        {user && !IS_SHARE_MODE && <NotificationBell />}
        {user ? (
          <div style={{ position: "relative" }}>
            <div onClick={() => setMenuOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              {isAdmin && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: 20 }}>관리자</span>
              )}
              {isCompanyAdmin && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#FBEEE4", color: "#B4602E", padding: "3px 10px", borderRadius: 20 }}>관계사 관리자</span>
              )}
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: isAdmin ? "#D97706" : isCompanyAdmin ? "#B4602E" : "#0F172A", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
              }}>
                {user.name[0]}
              </div>
            </div>

            {menuOpen && (
              <div style={{
                position: "absolute", top: 42, right: 0, background: "#fff",
                border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: 8,
                width: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 50,
              }}>
                <div style={{ padding: "8px 10px", borderBottom: `1px solid ${COLOR.bgSubtle}`, marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: COLOR.text3 }}>{user.title} · {user.dept}</div>
                </div>
                <div onClick={() => { setMenuOpen(false); navigate("/my-status"); }} style={{ padding: "8px 10px", fontSize: 13, color: COLOR.text2, cursor: "pointer", borderRadius: 6 }}>
                  내 등록 현황
                </div>
                <div onClick={() => { setMenuOpen(false); navigate("/settings"); }} style={{ padding: "8px 10px", fontSize: 13, color: COLOR.text2, cursor: "pointer", borderRadius: 6 }}>
                  설정
                </div>
                {(isAdmin || isCompanyAdmin) && (
                  <div onClick={() => { setMenuOpen(false); navigate("/admin"); }} style={{ padding: "8px 10px", fontSize: 13, color: "#D97706", fontWeight: 600, cursor: "pointer", borderRadius: 6 }}>
                    관리자 페이지
                  </div>
                )}
                <div onClick={() => { setMenuOpen(false); logout(); navigate("/"); }} style={{ padding: "8px 10px", fontSize: 13, color: "#EF4444", cursor: "pointer", borderRadius: 6, borderTop: `1px solid ${COLOR.bgSubtle}`, marginTop: 4 }}>
                  로그아웃
                </div>
              </div>
            )}
          </div>
        ) : IS_SHARE_MODE ? null : (
          <button onClick={() => navigate("/login")} style={{
            background: "#0F172A", color: "#fff", border: "none", borderRadius: 6,
            padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            SSO 로그인
          </button>
        )}
      </div>
    </nav>
  );
}