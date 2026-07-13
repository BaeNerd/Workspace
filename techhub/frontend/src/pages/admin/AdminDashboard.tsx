import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminScopeSelect from "../../components/AdminScopeSelect";
import type { ScopeSelection } from "../../components/AdminScopeSelect";
import { PLATFORMS } from "../../types/platformTypes";
import type { ApprovalSlots } from "../../types/platformTypes";
import { useAuth } from "../../context/useAuth";
import {
  scopedCompanies, aggregateSourceTotal, aggregateMonthly, aggregateDomain,
  monthTotal, COMPANY_NAME,
} from "../../mocks/statsMockData";
import type { SourceKey, StatCompany } from "../../mocks/statsMockData";

// 출처 표시용 정의 — PLATFORMS 색상과 동기화
const SOURCES: { key: SourceKey; label: string; color: string }[] = [
  { key: "n8n", label: "n8n", color: "#EA580C" },
  { key: "pa", label: "Power Automate", color: "#0078D4" },
  { key: "assistant", label: "나만의비서", color: "#2563EB" },
  { key: "ai-orchestration", label: "AI Agent", color: "#7C3AED" },
  { key: "ml", label: "ML 모델", color: "#0891B2" },
  { key: "vibe", label: "Vibe Coding", color: "#9333EA" },
];

const sourceColor = (key: SourceKey) => SOURCES.find(s => s.key === key)!.color;
const sourceLabel = (key: SourceKey) => SOURCES.find(s => s.key === key)!.label;

const detailPathOf = (source: SourceKey, id: string) => {
  const platform = PLATFORMS.find(p => p.id === source)!;
  return `${platform.path}/${id}`;
};

// ============================================================
// ★ 화면 고유 더미 — 승인 대기·최근 승인 목록, 운영 중 도구 수
// TODO: 백엔드 연동 시 폐기.
// ============================================================

// 병렬 2슬롯 승인 상태 더미 (company/global). 두 슬롯 모두 미승인=승인 대기, 하나만=부분 승인.
const slots = (company: boolean, global: boolean): ApprovalSlots => ({ company: { approved: company }, global: { approved: global } });

type PendingItem = { id: string; title: string; dept: string; submittedAt: string; type: string; source: SourceKey; company: StatCompany; approvalSlots: ApprovalSlots };
const PENDING_ALL: PendingItem[] = [
  { id: "N8N-2025-031", title: "재고 알림 자동화 워크플로우", dept: "구매팀", submittedAt: "2025.06.02", type: "n8n 워크플로우", source: "n8n", company: "KKM", approvalSlots: slots(false, false) },
  { id: "AST-2025-018", title: "계약서 요약 비서", dept: "법무팀", submittedAt: "2025.06.03", type: "나만의비서", source: "assistant", company: "KBH", approvalSlots: slots(true, false) },
  { id: "PA-2025-012", title: "월별 경비 승인 자동화 흐름", dept: "재무팀", submittedAt: "2025.06.04", type: "Power Automate 흐름", source: "pa", company: "KMG", approvalSlots: slots(false, false) },
  { id: "AIO-2025-007", title: "원료 추천 에이전트", dept: "IT개발팀", submittedAt: "2025.06.05", type: "AI Agent", source: "ai-orchestration", company: "HC", approvalSlots: slots(false, true) },
  { id: "ML-2025-003", title: "불량품 분류 ML 모델", dept: "품질관리팀", submittedAt: "2025.06.06", type: "ML 모델", source: "ml", company: "KKM", approvalSlots: slots(false, false) },
];

type ApprovedItem = { id: string; title: string; dept: string; approvedAt: string; source: SourceKey; company: StatCompany };
const RECENT_APPROVED_ALL: ApprovedItem[] = [
  { id: "AIO-005", title: "원료 안전성 문의 봇", dept: "메이크업연구소", approvedAt: "2025.05.31", source: "ai-orchestration", company: "KKM" },
  { id: "N8N-029", title: "일일 매출 리포트 자동 발송", dept: "재무팀", approvedAt: "2025.05.29", source: "n8n", company: "KBH" },
  { id: "PA-2025-009", title: "신규 입사자 IT 장비 신청 흐름", dept: "인사팀", approvedAt: "2025.05.28", source: "pa", company: "HC" },
  { id: "VIBE-2025-001", title: "주간 보고서 초안 생성 도구", dept: "경영지원팀", approvedAt: "2025.05.27", source: "vibe", company: "KKM" },
];

const ACTIVE_TOOLS_BY_COMPANY: Record<StatCompany, number> = {
  KKM: 44, KBH: 14, HC: 10, KMG: 8, KMW: 4, KUS: 2, KBT: 2,
};

// 누적 활용 후기 — 관계사별 더미 (합 47 = 기존 전사 표기와 일치). TODO: 백엔드 연동 시 폐기.
const REVIEW_COUNT_BY_COMPANY: Record<StatCompany, number> = {
  KKM: 22, KBH: 9, HC: 6, KMG: 5, KMW: 2, KUS: 2, KBT: 1,
};

const CARD_BORDER = "1.5px solid #E2E8F0";

// 담당 관계사 배지 텍스트 (코드 → 표시명, 매핑 없으면 코드 그대로)
const scopeCompanyNames = (codes: string[]): string =>
  codes.map(c => COMPANY_NAME[c] ?? c).join(" · ");

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isCompanyAdmin, managedCompanies } = useAuth();

  // 조회 범위 선택 (표시용 필터). 권한 범위(baseScope) 안에서만 선택 가능.
  const [scopeSel, setScopeSel] = useState<ScopeSelection>({ kind: "all" });
  // 권한 범위: companyAdmin은 담당 관계사만, 그 외(admin)는 전사(null) — 선택기 restrictTo로도 사용
  const baseScope = isCompanyAdmin ? managedCompanies : null;
  const baseKey = baseScope ? [...baseScope].sort().join(",") : "ALL";
  // 역할/담당 구성이 바뀌면(다른 계정 로그인 등) 이전 선택이 남지 않도록 리셋
  useEffect(() => { setScopeSel({ kind: "all" }); }, [baseKey]);
  // 담당 관계사가 지정되지 않은 companyAdmin 예외 케이스
  const noScope = isCompanyAdmin && managedCompanies.length === 0;
  // 선택기 노출: admin 항상 / companyAdmin은 담당 2곳 이상일 때만 (1곳=배지, 0곳=미지정 안내)
  const showScopeSelect = !isCompanyAdmin || managedCompanies.length >= 2;
  // 유효 조회 범위: 개별 관계사 선택 시 해당 코드, 아니면 권한 범위
  const viewScope = scopeSel.kind === "company" ? [scopeSel.code] : baseScope;
  // useMemo 의존성용 안정 키 ("ALL"=전사, ""=담당 없음, 그 외=코드 정렬 조인)
  const scopeKey = viewScope ? [...viewScope].sort().join(",") : "ALL";

  const agg = useMemo(() => {
    const currentScope = scopeKey === "ALL" ? null : (scopeKey === "" ? [] : scopeKey.split(","));
    const companies = scopedCompanies(currentScope);
    const sourceTotal = aggregateSourceTotal(companies);
    const monthly = aggregateMonthly(companies);
    const domain = aggregateDomain(companies);
    const pending = PENDING_ALL.filter(p => companies.includes(p.company));
    const recentApproved = RECENT_APPROVED_ALL.filter(p => companies.includes(p.company));
    const activeTools = companies.reduce((s, co) => s + (ACTIVE_TOOLS_BY_COMPANY[co] ?? 0), 0);
    const reviewTotal = companies.reduce((s, co) => s + (REVIEW_COUNT_BY_COMPANY[co] ?? 0), 0);
    // 대기 = 미게시·미반려 중 미승인 슬롯이 남은 항목(= 승인 대기 + 부분 승인). 부분 승인 = 한 슬롯만 완료.
    const partialCount = pending.filter(p => p.approvalSlots.company.approved !== p.approvalSlots.global.approved).length;
    return { companies, sourceTotal, monthly, domain, pending, recentApproved, activeTools, reviewTotal, partialCount };
  }, [scopeKey]);

  const { sourceTotal, monthly, domain, pending, recentApproved } = agg;

  // 사이드바 pendingCount — 조회 선택과 무관하게 권한 범위(baseScope) 기준으로 산출
  // (조회 범위는 표시용 필터일 뿐, "내가 처리할 건수" 알림을 바꾸지 않는다)
  // admin: 미종결 대기 항목 전체 / companyAdmin: 담당 범위 내 관계사 슬롯 미승인 항목
  const permCompanies = scopedCompanies(baseScope);
  const userPendingCount = PENDING_ALL
    .filter(p => permCompanies.includes(p.company))
    .filter(p => isCompanyAdmin ? !p.approvalSlots.company.approved : true).length;

  const totalRegistrations =
    sourceTotal.n8n + sourceTotal.pa + sourceTotal.assistant +
    sourceTotal["ai-orchestration"] + sourceTotal.ml + sourceTotal.vibe;
  const thisMonthTotal = monthTotal(monthly[monthly.length - 1]);
  const maxMonthly = Math.max(...monthly.map(monthTotal), 1);
  const totalDomain = domain.reduce((s, x) => s + x.count, 0) || 1;

  const KPIS = [
    { label: "전체 등록물", value: String(totalRegistrations), sub: "자동화·AI 도구 합산", subColor: "#059669" },
    { label: "승인 대기", value: String(pending.length), sub: `부분 승인 ${agg.partialCount}건 포함`, subColor: "#D97706" },
    { label: "이번 달 신규", value: String(thisMonthTotal), sub: "6개 플랫폼 합산", subColor: "#2563EB" },
    { label: "사용 가능 도구", value: String(agg.activeTools), sub: "바로 쓸 수 있는 자동화·AI", subColor: "#7C3AED" },
    { label: "누적 활용 후기", value: String(agg.reviewTotal), sub: "전체 항목 합산", subColor: "#059669" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />
      <div style={{ display: "flex" }}>
        <AdminSidebar pendingCount={userPendingCount} />
        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{isCompanyAdmin ? "관계사 관리자" : "관리자"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>대시보드</h1>
              {showScopeSelect ? (
                <AdminScopeSelect value={scopeSel} onChange={setScopeSel} restrictTo={baseScope} />
              ) : !noScope && baseScope ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#B4602E", background: "#FBEEE4", padding: "3px 10px", borderRadius: 20 }}>
                  담당 관계사 {baseScope.length}곳: {scopeCompanyNames(baseScope)}
                </span>
              ) : null}
            </div>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>AX 플랫폼(n8n · Power Automate · 나만의비서 · AI Agent · ML · Vibe) 통합 현황 · 2025년 6월 기준</p>
          </div>

          {noScope && (
            <div style={{ background: "#FBEEE4", border: "1px solid #F0D4BF", borderRadius: 10, padding: "14px 18px", marginBottom: 24, fontSize: 13, fontWeight: 600, color: "#B4602E" }}>
              담당 관계사가 지정되지 않았습니다. 전사관리자에게 문의하세요.
            </div>
          )}

          {/* KPI CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
            {KPIS.map((k, i) => (
              <div key={i} style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "18px 20px" }}>
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
                <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>승인 대기 건이 없습니다.</div>
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
                <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>최근 승인 건이 없습니다.</div>
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

          {/* CHARTS ROW — 월별 출처별 누적 추이 + 플랫폼 구성 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>월별 등록 추이 <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 6 }}>2025 · 플랫폼별</span></div>
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
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>플랫폼별 구성 <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 6 }}>누적 {totalRegistrations}건</span></div>
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

          {/* 비즈니스 도메인 분포 */}
          <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>비즈니스 도메인 분포 <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 6 }}>AX 플랫폼 기준</span></div>
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

        </main>
      </div>
    </div>
  );
}
