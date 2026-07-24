import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { COLOR } from "../styles/tokens";

// companyAdmin(관계사 관리자) 접근 허용 여부를 각 항목에 표시
const ADMIN_NAV = [
  { label: "대시보드", path: "/admin", companyAdmin: true },
  { label: "등록 신청 검토", path: "/admin/review", companyAdmin: true },
  { label: "프로젝트 관리", path: "/admin/projects", companyAdmin: true },
  { label: "분류체계 관리", path: "/admin/taxonomy", companyAdmin: false },
  { label: "부서/조직 관리", path: "/admin/org", companyAdmin: false },
  { label: "사용자 관리", path: "/admin/users", companyAdmin: false },
  { label: "통계", path: "/admin/statistics", companyAdmin: true },
  { label: "자동화·AI 도구 관리", path: "/admin/platforms", companyAdmin: false },
  { label: "공지·업데이트 관리", path: "/admin/notices", companyAdmin: false },
];

type Props = { pendingCount?: number };

export default function AdminSidebar({ pendingCount = 0 }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isCompanyAdmin } = useAuth();

  const navItems = isCompanyAdmin ? ADMIN_NAV.filter(n => n.companyAdmin) : ADMIN_NAV;

  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: "#fff", borderRight: `1px solid ${COLOR.border}`,
      padding: "20px 12px", position: "sticky", top: 56,
      height: "calc(100vh - 56px)", overflowY: "auto",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: COLOR.text3, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, padding: "0 8px" }}>
        {isCompanyAdmin ? "관계사 관리자 메뉴" : "관리자 메뉴"}
      </div>
      {navItems.map(n => {
        const isActive = pathname === n.path;
        return (
          <div
            key={n.path}
            onClick={() => navigate(n.path)}
            style={{
              padding: "8px 10px", borderRadius: 7, cursor: "pointer", marginBottom: 2,
              fontSize: 13, fontWeight: isActive ? 700 : 500,
              color: isActive ? COLOR.primary : COLOR.text2,
              background: isActive ? COLOR.primaryWeak : "transparent",
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