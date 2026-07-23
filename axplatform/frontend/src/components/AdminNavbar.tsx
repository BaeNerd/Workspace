import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import NotificationBell from "./NotificationBell";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const initial = user?.name?.[0] ?? "관";

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
      borderBottom: "1px solid #E2E8F0", padding: "0 32px", height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
        <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.03em" }}>KOLMAR</span>
        <span style={{ fontWeight: 500, fontSize: 12, color: "#94A3B8" }}>AX Platform</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {user && <NotificationBell />}
        <span style={{ fontSize: 11, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: 20 }}>관리자</span>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{initial}</div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          style={{ background: "transparent", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
        >로그아웃</button>
      </div>
    </nav>
  );
}
