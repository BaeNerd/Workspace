import { useNavigate, useLocation } from "react-router-dom";

const ADMIN_NAV = [
  { label: "대시보드", path: "/admin" },
  { label: "등록 신청 검토", path: "/admin/review" },
  { label: "프로젝트 관리", path: "/admin/projects" },
  { label: "분류체계 관리", path: "/admin/taxonomy" },
  { label: "부서/조직 관리", path: "/admin/org" },
  { label: "사용자 관리", path: "/admin/users" },
  { label: "통계", path: "/admin/statistics" },
  { label: "자동화·AI 도구 관리", path: "/admin/platforms" },
];

type Props = { pendingCount?: number };

export default function AdminSidebar({ pendingCount = 0 }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: "#fff", borderRight: "1px solid #E2E8F0",
      padding: "20px 12px", position: "sticky", top: 56,
      height: "calc(100vh - 56px)", overflowY: "auto",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, padding: "0 8px" }}>
        관리자 메뉴
      </div>
      {ADMIN_NAV.map(n => {
        const isActive = pathname === n.path;
        return (
          <div
            key={n.path}
            onClick={() => navigate(n.path)}
            style={{
              padding: "8px 10px", borderRadius: 7, cursor: "pointer", marginBottom: 2,
              fontSize: 13, fontWeight: isActive ? 700 : 500,
              color: isActive ? "#2563EB" : "#475569",
              background: isActive ? "#EFF6FF" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            {n.label}
            {n.path === "/admin/review" && pendingCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, background: "#EF4444", color: "#fff", padding: "1px 6px", borderRadius: 20 }}>
                {pendingCount}
              </span>
            )}
          </div>
        );
      })}
    </aside>
  );
}