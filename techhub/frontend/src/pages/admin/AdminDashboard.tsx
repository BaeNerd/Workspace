import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { PLATFORMS } from "../../types/platformTypes";
import { useAuth } from "../../context/useAuth";
// ★ 변경 — 관계사 차원 공용 mock·헬퍼는 공용 모듈에서 가져온다 (AdminStatistics와 정합).
import {
  scopedCompanies, aggregateSourceTotal, aggregateMonthly, aggregateDomain,
  monthTotal, scopeBadgeText,
} from "../../mocks/statsMockData";
import type { SourceKey, MonthPoint, StatCompany } from "../../mocks/statsMockData";

// 출처 표시용 정의 (라벨/색만 보유). 상세 경로는 PLATFORMS의 path를 단일 기준으로 사용 → detailPathOf 참고.
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

// ============================================================
// ★ 화면 고유 더미 (공용화하지 않음) — 승인 대기·최근 승인 목록, 운영 중 도구 수
// 각 항목에 소속 관계사를 부여해 담당 범위로 필터링. TODO: 백엔드 연동 시 폐기.
// ============================================================

// 승인 대기. GET /api/v1/admin/pending?company=:codes
type PendingItem = { id: string; title: string; dept: string; submittedAt: string; type: string; source: SourceKey; company: StatCompany };
const PENDING_ALL: PendingItem[] = [
  { id: "PRJ-2025-071", title: "연구 실험 데이터 통합 플랫폼", dept: "메이크업연구소", submittedAt: "2025.06.01", type: "내부 플랫폼", source: "project", company: "KKM" },
  { id: "N8N-2025-031", title: "재고 알림 자동화 워크플로우", dept: "구매팀", submittedAt: "2025.06.02", type: "n8n 워크플로우", source: "n8n", company: "KKM" },
  { id: "HKGPT-2025-018", title: "계약서 요약 비서", dept: "법무팀", submittedAt: "2025.06.03", type: "나만의비서", source: "assistant", company: "KBH" },
  { id: "PRJ-2025-074", title: "글로벌 규제 모니터링 대시보드", dept: "법무팀", submittedAt: "2025.06.04", type: "웹 애플리케이션", source: "project", company: "KMG" },
  { id: "AGENT-2025-007", title: "원료 추천 에이전트", dept: "IT개발팀", submittedAt: "2025.06.05", type: "AI Agent", source: "ai-orchestration", company: "HC" },
];

// 최근 승인. GET /api/v1/admin/recent-approved?company=:codes
type ApprovedItem = { id: string; title: string; dept: string; approvedAt: string; source: SourceKey; company: StatCompany };
const RECENT_APPROVED_ALL: ApprovedItem[] = [
  { id: "AIO-005", title: "원료 안전성 문의 봇", dept: "메이크업연구소", approvedAt: "2025.05.31", source: "ai-orchestration", company: "KKM" },
  { id: "PRJ-2025-069", title: "통합 정산 자동화 시스템 v2", dept: "재무팀", approvedAt: "2025.05.30", source: "project", company: "KKM" },
  { id: "N8N-029", title: "일일 매출 리포트 자동 발송", dept: "재무팀", approvedAt: "2025.05.29", source: "n8n", company: "KBH" },
  { id: "PRJ-2025-067", title: "HR 온보딩 자동화 포털", dept: "인사팀", approvedAt: "2025.05.28", source: "project", company: "HC" },
];

// 운영 중 도구 수 × 관계사. GET /api/v1/admin/stats/active-tools?company=:codes
const ACTIVE_TOOLS_BY_COMPANY: Record<StatCompany, number> = {
  KKM: 44, KBH: 14, HC: 10, KMG: 8, KMW: 4, KUS: 2, KBT: 2,
};

// 공통 카드 테두리 — 전 카드 동일 적용(별도 강조색 없음)
const CARD_BORDER = "1.5px solid #E2E8F0";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { isGlobalAdmin, managedCompanies } = useAuth();
  const scope = isGlobalAdmin ? null : managedCompanies;

  // 범위에 따라 지표·목록 재계산 (공용 헬퍼 + 화면 고유 목록 필터)
  const agg = useMemo(() => {
    const companies = scopedCompanies(scope);
    const sourceTotal = aggregateSourceTotal(companies);
    const monthly = aggregateMonthly(companies);
    const domain = aggregateDomain(companies);
    const pending = PENDING_ALL.filter(p => companies.includes(p.company));
    const recentApproved = RECENT_APPROVED_ALL.filter(p => companies.includes(p.company));
    const activeTools = companies.reduce((s, co) => s + (ACTIVE_TOOLS_BY_COMPANY[co] ?? 0), 0);
    return { companies, sourceTotal, monthly, domain, pending, recentApproved, activeTools };
  }, [scope]);

  const { sourceTotal, monthly, domain, pending, recentApproved } = agg;

  const totalRegistrations = sourceTotal.project + sourceTotal.n8n + sourceTotal.assistant + sourceTotal["ai-orchestration"];
  const platformTotal = sourceTotal.n8n + sourceTotal.assistant + sourceTotal["ai-orchestration"];
  const thisMonthTotal = monthTotal(monthly[monthly.length - 1]);
  const maxMonthly = Math.max(...monthly.map(monthTotal), 1);
  const totalDomain = domain.reduce((s, x) => s + x.count, 0) || 1;

  const scopeBadge = scopeBadgeText(isGlobalAdmin, agg.companies);

  const KPIS = [
    { label: "전체 등록물", value: String(totalRegistrations), sub: `프로젝트 ${sourceTotal.project} · 플랫폼 ${platformTotal}`, subColor: "#059669" },
    { label: "승인 대기", value: String(pending.length), sub: "즉시 검토 필요", subColor: "#D97706" },
    { label: "이번 달 신규", value: String(thisMonthTotal), sub: "프로젝트 + 플랫폼 합산", subColor: "#2563EB" },
    { label: "운영 중 도구", value: String(agg.activeTools), sub: "바로 쓸 수 있는 자동화·AI", subColor: "#7C3AED" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <AdminNavbar />

      <div style={{ display: "flex" }}>

        <AdminSidebar pendingCount={pending.length} />

        {/* MAIN */}
        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>대시보드</h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>프로젝트와 플랫폼 항목(n8n · 나만의비서 · AI Agent) 통합 현황 · 2025년 6월 기준</p>
          </div>

          {/* 집계 범위 배지 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24,
            background: isGlobalAdmin ? "#EFF6FF" : "#F0FDF4",
            border: `1px solid ${isGlobalAdmin ? "#BFDBFE" : "#BBF7D0"}`,
            borderRadius: 8, padding: "7px 14px",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: isGlobalAdmin ? "#2563EB" : "#059669" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: isGlobalAdmin ? "#1E40AF" : "#065F46" }}>
              집계 범위 · {scopeBadge}
            </span>
          </div>

          {agg.companies.length === 0 ? (
            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "48px 24px", textAlign: "center", fontSize: 13, color: "#94A3B8" }}>
              담당 관계사가 지정되어 있지 않아 표시할 현황이 없습니다. 권한 설정에서 담당 관계사를 지정해주세요.
            </div>
          ) : (
            <>
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>승인 대기 <span style={{ fontSize: 12, color: "#D97706", fontWeight: 700 }}>{pending.length}</span></div>
                    <span onClick={() => navigate("/admin/review")} style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, cursor: "pointer" }}>전체 보기 →</span>
                  </div>
                  {pending.length === 0 ? (
                    <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>담당 범위의 승인 대기 건이 없습니다.</div>
                  ) : pending.map((p, i) => (
                    <div key={p.id} style={{
                      padding: "12px 18px", borderBottom: i < pending.length - 1 ? "1px solid #F8FAFC" : "none",
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
                  {recentApproved.length === 0 ? (
                    <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>담당 범위의 최근 승인 건이 없습니다.</div>
                  ) : recentApproved.map((p, i) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(detailPathOf(p.source, p.id))}
                      style={{
                        padding: "12px 18px", borderBottom: i < recentApproved.length - 1 ? "1px solid #F8FAFC" : "none",
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
                    {monthly.map((m, i) => {
                      const total = monthTotal(m);
                      const h = Math.max((total / maxMonthly) * 96, 6);
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{total}</div>
                          <div style={{ width: "100%", maxWidth: 40, height: h, borderRadius: "4px 4px 0 0", overflow: "hidden", display: "flex", flexDirection: "column-reverse", background: total === 0 ? "#F1F5F9" : "transparent" }}>
                            {total > 0 && SOURCES.map(s => {
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
                  <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16, background: "#F1F5F9" }}>
                    {SOURCES.map(s => sourceTotal[s.key] > 0 && <div key={s.key} title={`${s.label}: ${sourceTotal[s.key]}건`} style={{ flex: sourceTotal[s.key], background: s.color }} />)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {SOURCES.map(s => {
                      const pct = totalRegistrations > 0 ? Math.round(sourceTotal[s.key] / totalRegistrations * 100) : 0;
                      return (
                        <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>{s.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{sourceTotal[s.key]}</span>
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
                  {domain.map((d, i) => {
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
            </>
          )}

        </main>
      </div>
    </div>
  );
}