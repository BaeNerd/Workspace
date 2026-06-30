import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { PLATFORMS } from "../../types/platformTypes";
import type { PlatformId } from "../../types/platformTypes";

type SourceKey = "project" | PlatformId;

// 출처 표시용 정의 (라벨/색만 보유). 상세 경로는 PLATFORMS의 path를 단일 기준으로 사용 → detailPathOf 참고.
// TODO: platformTypes.ts PLATFORMS 색상과 일치 여부 점검(현재는 표시용 색만 별도 보유).
const SOURCES: { key: SourceKey; label: string; color: string }[] = [
  { key: "project", label: "프로젝트", color: "#2563EB" },
  { key: "n8n", label: "n8n", color: "#DB2777" },
  { key: "assistant", label: "나만의비서", color: "#059669" },
  { key: "ai-orchestration", label: "AI Agent", color: "#7C3AED" },
];

const sourceColor = (key: SourceKey) => SOURCES.find(s => s.key === key)!.color;
const sourceLabel = (key: SourceKey) => SOURCES.find(s => s.key === key)!.label;

// 상세 경로 — ProjectListPage와 동일하게 PLATFORMS.path를 단일 기준으로 사용(화면 간 경로 불일치 방지)
const detailPathOf = (source: SourceKey, id: string) => {
  if (source === "project") return `/projects/${id}`;
  const platform = PLATFORMS.find(p => p.id === source)!;
  return `${platform.path}/${id}`;
};

// TODO: 실제 연동 시 GET /api/v1/admin/pending 응답으로 교체 (프로젝트 + 플랫폼 항목 통합 검토 대기열)
type PendingItem = { id: string; title: string; dept: string; submittedAt: string; type: string; source: SourceKey };
const PENDING: PendingItem[] = [
  { id: "PRJ-2025-071", title: "연구 실험 데이터 통합 플랫폼", dept: "메이크업연구소", submittedAt: "2025.06.01", type: "내부 플랫폼", source: "project" },
  { id: "N8N-2025-031", title: "재고 알림 자동화 워크플로우", dept: "구매팀", submittedAt: "2025.06.02", type: "n8n 워크플로우", source: "n8n" },
  { id: "HKGPT-2025-018", title: "계약서 요약 비서", dept: "법무팀", submittedAt: "2025.06.03", type: "나만의비서", source: "assistant" },
  { id: "PRJ-2025-074", title: "글로벌 규제 모니터링 대시보드", dept: "법무팀", submittedAt: "2025.06.04", type: "웹 애플리케이션", source: "project" },
  { id: "AGENT-2025-007", title: "원료 추천 에이전트", dept: "IT개발팀", submittedAt: "2025.06.05", type: "AI Agent", source: "ai-orchestration" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/recent-approved 응답으로 교체
type ApprovedItem = { id: string; title: string; dept: string; approvedAt: string; source: SourceKey };
const RECENT_APPROVED: ApprovedItem[] = [
  { id: "AIO-005", title: "원료 안전성 문의 봇", dept: "메이크업연구소", approvedAt: "2025.05.31", source: "ai-orchestration" },
  { id: "PRJ-2025-069", title: "통합 정산 자동화 시스템 v2", dept: "재무팀", approvedAt: "2025.05.30", source: "project" },
  { id: "N8N-029", title: "일일 매출 리포트 자동 발송", dept: "재무팀", approvedAt: "2025.05.29", source: "n8n" },
  { id: "PRJ-2025-067", title: "HR 온보딩 자동화 포털", dept: "인사팀", approvedAt: "2025.05.28", source: "project" },
];

// 출처별 월별 등록 추이. TODO: 실제 연동 시 GET /api/v1/admin/stats/monthly-by-source 응답으로 교체
type MonthPoint = { month: string; project: number; n8n: number; assistant: number; "ai-orchestration": number };
const MONTHLY: MonthPoint[] = [
  { month: "1월", project: 4, n8n: 1, assistant: 1, "ai-orchestration": 0 },
  { month: "2월", project: 5, n8n: 2, assistant: 1, "ai-orchestration": 1 },
  { month: "3월", project: 4, n8n: 1, assistant: 2, "ai-orchestration": 0 },
  { month: "4월", project: 6, n8n: 3, assistant: 2, "ai-orchestration": 1 },
  { month: "5월", project: 7, n8n: 4, assistant: 2, "ai-orchestration": 2 },
  { month: "6월", project: 5, n8n: 5, assistant: 3, "ai-orchestration": 2 },
];

// 누적 출처별 등록 수. TODO: 실제 연동 시 GET /api/v1/admin/stats/source-total 응답으로 교체
const SOURCE_TOTAL: Record<SourceKey, number> = { project: 124, n8n: 38, assistant: 27, "ai-orchestration": 19 };

// TODO: 실제 연동 시 GET /api/v1/admin/stats/domain 응답으로 교체
const DOMAIN_DIST = [
  { label: "제조/생산", count: 28 }, { label: "IT 인프라", count: 22 }, { label: "재무/회계", count: 18 },
  { label: "데이터/분석", count: 15 }, { label: "HR/인사", count: 12 }, { label: "마케팅", count: 11 },
  { label: "영업/CRM", count: 10 }, { label: "기타", count: 8 },
];

const monthTotal = (m: MonthPoint) => m.project + m.n8n + m.assistant + m["ai-orchestration"];
const maxMonthly = Math.max(...MONTHLY.map(monthTotal));
const totalRegistrations = SOURCE_TOTAL.project + SOURCE_TOTAL.n8n + SOURCE_TOTAL.assistant + SOURCE_TOTAL["ai-orchestration"];
const platformTotal = SOURCE_TOTAL.n8n + SOURCE_TOTAL.assistant + SOURCE_TOTAL["ai-orchestration"];
const thisMonthTotal = monthTotal(MONTHLY[MONTHLY.length - 1]);
const totalDomain = DOMAIN_DIST.reduce((s, x) => s + x.count, 0);

// 공통 카드 테두리 — 전 카드 동일 적용(별도 강조색 없음)
const CARD_BORDER = "1.5px solid #E2E8F0";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const KPIS = [
    { label: "전체 등록물", value: String(totalRegistrations), sub: `프로젝트 ${SOURCE_TOTAL.project} · 플랫폼 ${platformTotal}`, subColor: "#059669" },
    { label: "승인 대기", value: String(PENDING.length), sub: "즉시 검토 필요", subColor: "#D97706" },
    { label: "이번 달 신규", value: String(thisMonthTotal), sub: "프로젝트 + 플랫폼 합산", subColor: "#2563EB" },
    { label: "운영 중 도구", value: "84", sub: "바로 쓸 수 있는 자동화·AI", subColor: "#7C3AED" },
  ];

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
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>프로젝트와 플랫폼 항목(n8n · 나만의비서 · AI Agent) 통합 현황 · 2025년 6월 기준</p>
          </div>

          {/* KPI CARDS — 전 카드 동일 기본 테두리(별도 강조색 없음) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {KPIS.map((k, i) => (
              <div key={i} style={{
                background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "18px 20px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 6 }}>{k.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: k.subColor }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* PENDING + RECENT */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>승인 대기 <span style={{ fontSize: 12, color: "#D97706", fontWeight: 700 }}>{PENDING.length}</span></div>
                <span onClick={() => navigate("/admin/review")} style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, cursor: "pointer" }}>전체 보기 →</span>
              </div>
              {PENDING.map((p, i) => (
                <div key={p.id} style={{
                  padding: "12px 18px", borderBottom: i < PENDING.length - 1 ? "1px solid #F8FAFC" : "none",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: sourceColor(p.source), padding: "1px 6px", borderRadius: 20, flexShrink: 0 }}>{sourceLabel(p.source)}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    </div>
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

            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>최근 승인</div>
                <span onClick={() => navigate("/admin/projects")} style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, cursor: "pointer" }}>전체 보기 →</span>
              </div>
              {RECENT_APPROVED.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => navigate(detailPathOf(p.source, p.id))}
                  style={{
                    padding: "12px 18px", borderBottom: i < RECENT_APPROVED.length - 1 ? "1px solid #F8FAFC" : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: sourceColor(p.source), padding: "1px 6px", borderRadius: 20, flexShrink: 0 }}>{sourceLabel(p.source)}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    </div>
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

          {/* CHARTS ROW — 월별 출처별 누적 추이 + 출처 구성 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>월별 등록 추이 <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 6 }}>2025 · 출처별</span></div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {SOURCES.map(s => (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                      <span style={{ fontSize: 10, color: "#64748B" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 130 }}>
                {MONTHLY.map((m, i) => {
                  const total = monthTotal(m);
                  const h = Math.max((total / maxMonthly) * 96, 6);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{total}</div>
                      <div style={{ width: "100%", maxWidth: 40, height: h, borderRadius: "4px 4px 0 0", overflow: "hidden", display: "flex", flexDirection: "column-reverse" }}>
                        {SOURCES.map(s => {
                          const val = m[s.key];
                          if (!val) return null;
                          return <div key={s.key} title={`${s.label} ${val}건`} style={{ height: `${(val / total) * 100}%`, background: s.color }} />;
                        })}
                      </div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>{m.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>출처 구성 <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 6 }}>누적 {totalRegistrations}건</span></div>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16 }}>
                {SOURCES.map(s => <div key={s.key} title={`${s.label}: ${SOURCE_TOTAL[s.key]}건`} style={{ flex: SOURCE_TOTAL[s.key], background: s.color }} />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {SOURCES.map(s => {
                  const pct = Math.round(SOURCE_TOTAL[s.key] / totalRegistrations * 100);
                  return (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>{s.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{SOURCE_TOTAL[s.key]}</span>
                      <span style={{ fontSize: 11, color: "#94A3B8", width: 32, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 비즈니스 도메인 분포 (프로젝트 기준) */}
          <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>비즈니스 도메인 분포 <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 6 }}>프로젝트 기준</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "9px 32px" }}>
              {DOMAIN_DIST.map((d, i) => {
                const pct = Math.round((d.count / totalDomain) * 100);
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

        </main>
      </div>
    </div>
  );
}
