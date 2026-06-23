import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";

// TODO: 실제 연동 시 GET /api/v1/admin/pending-count 응답으로 교체
const PENDING = [
  { id: "PRJ-2025-071", title: "연구 실험 데이터 통합 플랫폼", dept: "메이크업연구소", submittedAt: "2025.06.01", type: "내부 플랫폼" },
  { id: "PRJ-2025-072", title: "구매 발주 자동화 시스템", dept: "구매팀", submittedAt: "2025.06.02", type: "웹 애플리케이션" },
  { id: "PRJ-2025-073", title: "용기 설계 검토 협업 툴", dept: "디자인팀", submittedAt: "2025.06.03", type: "내부 도구" },
  { id: "PRJ-2025-074", title: "글로벌 규제 모니터링 대시보드", dept: "법무팀", submittedAt: "2025.06.04", type: "웹 애플리케이션" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/recent-approved 응답으로 교체
const RECENT_APPROVED = [
  { id: "PRJ-2025-069", title: "통합 정산 자동화 시스템 v2", dept: "재무팀", approvedAt: "2025.05.30" },
  { id: "PRJ-2025-067", title: "HR 온보딩 자동화 포털", dept: "인사팀", approvedAt: "2025.05.28" },
  { id: "PRJ-2025-065", title: "영업 CRM 고도화", dept: "영업팀", approvedAt: "2025.05.25" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/monthly 응답으로 교체
const MONTHLY = [
  { month: "1월", count: 6 }, { month: "2월", count: 9 }, { month: "3월", count: 7 },
  { month: "4월", count: 12 }, { month: "5월", count: 15 }, { month: "6월", count: 4 },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/domain 응답으로 교체
const DOMAIN_DIST = [
  { label: "제조/생산", count: 28 }, { label: "IT 인프라", count: 22 }, { label: "재무/회계", count: 18 },
  { label: "데이터/분석", count: 15 }, { label: "HR/인사", count: 12 }, { label: "마케팅", count: 11 },
  { label: "영업/CRM", count: 10 }, { label: "기타", count: 8 },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/stack 응답으로 교체
const STACK_DIST = [
  { label: "Python", count: 38, color: "#2563EB" }, { label: "React", count: 27, color: "#7C3AED" },
  { label: "AWS", count: 24, color: "#D97706" }, { label: "TypeScript", count: 19, color: "#059669" },
  { label: "PostgreSQL", count: 17, color: "#0891B2" }, { label: "Docker", count: 14, color: "#475569" },
  { label: "FastAPI", count: 11, color: "#DB2777" }, { label: "Kubernetes", count: 8, color: "#EA580C" },
];

const maxMonthly = Math.max(...MONTHLY.map(m => m.count));
const maxStack = Math.max(...STACK_DIST.map(s => s.count));

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <AdminNavbar />

      <div style={{ display: "flex" }}>

        <AdminSidebar pendingCount={PENDING.length} />

        {/* MAIN */}
        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>대시보드</h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>2025년 6월 기준</p>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "전체 프로젝트", value: "124", sub: "전월 대비 +9", subColor: "#059669" },
              { label: "승인 대기", value: String(PENDING.length), sub: "즉시 검토 필요", subColor: "#D97706", alert: true },
              { label: "이번 달 신규 등록", value: "15", sub: "목표 20건 대비 75%", subColor: "#2563EB" },
              { label: "참여 부서", value: "38", sub: "전체 부서의 82%", subColor: "#7C3AED" },
            ].map((k, i) => (
              <div key={i} style={{
                background: "#fff", border: `1.5px solid ${k.alert ? "#FDE68A" : "#E2E8F0"}`,
                borderRadius: 10, padding: "18px 20px",
                borderTop: k.alert ? "3px solid #D97706" : "3px solid transparent",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 6 }}>{k.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: k.subColor }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* PENDING + RECENT */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: "1.5px solid #FDE68A", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #FEF3C7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>승인 대기</div>
                <span onClick={() => navigate("/admin/review")} style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, cursor: "pointer" }}>전체 보기 →</span>
              </div>
              {PENDING.map((p, i) => (
                <div key={p.id} style={{
                  padding: "12px 18px", borderBottom: i < PENDING.length - 1 ? "1px solid #F8FAFC" : "none",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{p.dept} · {p.type}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>{p.submittedAt}</span>
                    <button onClick={() => navigate("/admin/review")} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      검토
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>최근 승인</div>
                <span onClick={() => navigate("/admin/projects")} style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, cursor: "pointer" }}>전체 보기 →</span>
              </div>
              {RECENT_APPROVED.map((p, i) => (
                <div key={p.id} style={{
                  padding: "12px 18px", borderBottom: i < RECENT_APPROVED.length - 1 ? "1px solid #F8FAFC" : "none",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{p.dept}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>{p.approvedAt}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: 20 }}>승인</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHARTS ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 20 }}>월별 등록 추이 (2025)</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
                {MONTHLY.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB" }}>{m.count}</div>
                    <div style={{
                      width: "100%", borderRadius: "4px 4px 0 0",
                      background: i === MONTHLY.length - 1 ? "#BFDBFE" : "#2563EB",
                      height: `${(m.count / maxMonthly) * 88}px`,
                    }} />
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>{m.month}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>비즈니스 도메인 분포</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DOMAIN_DIST.map((d, i) => {
                  const total = DOMAIN_DIST.reduce((s, x) => s + x.count, 0);
                  const pct = Math.round((d.count / total) * 100);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 11, color: "#475569", width: 72, flexShrink: 0, fontWeight: 500 }}>{d.label}</div>
                      <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#2563EB", borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8", width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 기술 스택 TOP 8 */}
          <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 18 }}>기술 스택 TOP 8</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {STACK_DIST.map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{s.count}건</span>
                  </div>
                  <div style={{ background: "#F1F5F9", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${(s.count / maxStack) * 100}%`, height: "100%", background: s.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}