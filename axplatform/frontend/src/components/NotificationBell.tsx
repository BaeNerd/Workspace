// ===== components/NotificationBell.tsx =====
// 공용 알림 벨. 미읽음 뱃지 + 드롭다운(최근 5건 · 전체 읽음 · 항목 이동).
// Navbar / AdminNavbar 양쪽에 배치한다. 읽음 상태는 useNotifications(localStorage "ax_notifications_read").
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { NOTIFICATION_KIND_STYLE } from "../types/notificationTypes";
import type { AxNotification } from "../types/notificationTypes";
import { detailPathForItemId } from "../types/categoryTypes";

const BellIcon = ({ color = "#475569" }: { color?: string }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const recent = notifications.slice(0, 5);

  const onItemClick = (n: AxNotification) => {
    markRead(n.id);
    setOpen(false);
    if (n.itemId) {
      const path = detailPathForItemId(n.itemId);
      if (path) navigate(path);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={`알림 ${unreadCount > 0 ? `(미읽음 ${unreadCount}건)` : ""}`}
        onClick={() => setOpen(v => !v)}
        style={{
          position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: "50%", background: "transparent",
          border: "none", cursor: "pointer",
        }}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, padding: "0 4px",
            borderRadius: 9999, background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
            border: "1.5px solid #fff",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 42, right: 0, width: 340, background: "#fff",
          border: "1.5px solid #E2E8F0", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
          zIndex: 200, overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
              알림 {unreadCount > 0 && <span style={{ color: "#EF4444" }}>{unreadCount}</span>}
            </span>
            <button
              type="button"
              onClick={() => markAllRead()}
              disabled={unreadCount === 0}
              style={{
                background: "none", border: "none", fontSize: 12, fontWeight: 600,
                color: unreadCount === 0 ? "#CBD5E1" : "#2563EB",
                cursor: unreadCount === 0 ? "default" : "pointer", padding: 0,
              }}
            >
              전체 읽음
            </button>
          </div>

          {recent.length === 0 ? (
            <div style={{ padding: "32px 14px", textAlign: "center", fontSize: 13, color: "#94A3B8" }}>
              새 알림이 없습니다.
            </div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {recent.map(n => {
                const ks = NOTIFICATION_KIND_STYLE[n.kind];
                return (
                  <div
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    style={{
                      display: "flex", flexDirection: "column", gap: 4, padding: "11px 14px",
                      borderBottom: "1px solid #F5F7FA", cursor: "pointer",
                      background: n.read ? "#fff" : "#F5F9FF",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
                    onMouseLeave={e => (e.currentTarget.style.background = n.read ? "#fff" : "#F5F9FF")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", flexShrink: 0 }} />}
                      <span style={{ fontSize: 10, fontWeight: 700, background: ks.bg, color: ks.fg, padding: "2px 7px", borderRadius: 20 }}>
                        {ks.label}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8", flexShrink: 0 }}>{n.date}</span>
                    </div>
                    <span style={{
                      fontSize: 12.5, fontWeight: n.read ? 500 : 700, color: "#1A1F27", lineHeight: 1.45,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {n.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
