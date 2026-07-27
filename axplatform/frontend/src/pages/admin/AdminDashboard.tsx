import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminScopeSelect from "../../components/AdminScopeSelect";
import type { ScopeSelection } from "../../components/AdminScopeSelect";
import { CATEGORIES } from "../../types/categoryTypes";
import { useAuth } from "../../context/useAuth";
import { getDashboardData, recentMonthsRange, monthTotal, orgCompanyName } from "../../lib/dataSource";
import type { SourceKey } from "../../lib/dataSource";
import { COLOR } from "../../styles/tokens";

// 출처 표시용 정의 — CATEGORIES 단일 소스에서 파생 (7유형: etc 포함)
const SOURCES: { key: SourceKey; label: string; color: string }[] =
  CATEGORIES.map(p => ({ key: p.id, label: p.name, color: p.color }));

const sourceColor = (key: SourceKey) => SOURCES.find(s => s.key === key)!.color;
const sourceLabel = (key: SourceKey) => SOURCES.find(s => s.key === key)!.label;

const detailPathOf = (source: SourceKey, id: string) => {
  const category = CATEGORIES.find(p => p.id === source)!;
  return `${category.path}/${id}`;
};

// 대시보드 수치는 자산 SSOT·검토 큐·후기에서 파생된다. 범위 집계·큐 파생은 dataSource.getDashboardData가 담당한다.
// (승인 대기 = 검토 큐 미종결분 / 최근 승인 = 게시 카탈로그 최신순 / 게시된 도구·누적 후기 = ownerCompany 파생)

const CARD_BORDER = `1.5px solid ${COLOR.border}`;

// 담당 관계사 배지 텍스트 (코드 → 표시명, 조직 SSOT orgCompanyName 파생)
const scopeCompanyNames = (codes: string[]): string =>
  codes.map(c => orgCompanyName(c)).join(" · ");

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isCompanyAdmin, managedCompanies } = useAuth();

  // 대시보드는 기간 선택기 없는 고정 스냅숏이다. 등록 추이(월별 시계열)만 최근 12개월 고정 창을 쓰고,
  // KPI·카테고리 구성·도메인은 전체 기간 누적, "이번 달 신규"는 당월 실측 — 위젯별 기준이 고정되어 있다.
  const range = useMemo(() => recentMonthsRange(12), []);
  const rangeKey = `${range.from}~${range.to}`;

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
    return getDashboardData(currentScope, range);
  }, [scopeKey, rangeKey]);

  const { sourceTotal, monthly, domain, pending, recentApproved } = agg;

  // 사이드바 pendingCount — 조회 선택과 무관하게 권한 범위(baseScope) 기준으로 산출
  // (조회 범위는 표시용 필터일 뿐, "내가 처리할 건수" 알림을 바꾸지 않는다)
  // admin: 미종결 대기 항목 전체 / companyAdmin: 담당 범위 내 관계사 슬롯 미승인 항목
  const userPendingCount = getDashboardData(baseScope).pending
    .filter(p => isCompanyAdmin ? !p.approvalSlots.company.approved : true).length;

  const totalRegistrations =
    sourceTotal.n8n + sourceTotal.pa + sourceTotal.assistant +
    sourceTotal["ai-orchestration"] + sourceTotal.ml + sourceTotal.vibe + sourceTotal.etc;
  const thisMonthTotal = agg.newThisMonth;
  const maxMonthly = Math.max(...monthly.map(monthTotal), 1);
  const totalDomain = domain.reduce((s, x) => s + x.count, 0) || 1;

  const KPIS = [
    { label: "전체 등록물", value: String(totalRegistrations), sub: "자동화·AI 도구 합산", subColor: "#059669" },
    { label: "승인 대기", value: String(pending.length), sub: `부분 승인 ${agg.partialCount}건 포함`, subColor: "#D97706" },
    { label: "이번 달 신규", value: String(thisMonthTotal), sub: "전체 유형 합산", subColor: "#2563EB" },
    { label: "게시된 도구", value: String(agg.activeTools), sub: "승인 완료·게시 카드", subColor: "#7C3AED" },
    { label: "누적 활용 후기", value: String(agg.reviewTotal), sub: "전체 카드 합산", subColor: "#059669" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text }}>
      <AdminNavbar />
      <div style={{ display: "flex" }}>
        <AdminSidebar pendingCount={userPendingCount} />
        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{isCompanyAdmin ? "관계사 관리자" : "관리자"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>대시보드</h1>
                {showScopeSelect ? (
                  <AdminScopeSelect value={scopeSel} onChange={setScopeSel} restrictTo={baseScope} />
                ) : !noScope && baseScope ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#B4602E", background: "#FBEEE4", padding: "3px 10px", borderRadius: 20 }}>
                    담당 관계사 {baseScope.length}곳: {scopeCompanyNames(baseScope)}
                  </span>
                ) : null}
              </div>
              <p style={{ fontSize: 13, color: COLOR.text2, marginTop: 4 }}>AX 플랫폼(n8n · Power Automate · 나만의 비서 · AI Model · ML · Vibe · AI 프로젝트) 통합 현황</p>
            </div>
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
                <div style={{ fontSize: 11, fontWeight: 600, color: COLOR.text3, marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.03em", marginBottom: 6 }}>{k.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: k.subColor }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* PENDING + RECENT */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLOR.bgSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>승인 대기 <span style={{ fontSize: 12, color: "#D97706", fontWeight: 700 }}>{pending.length}</span></div>
                <span onClick={() => navigate("/admin/review")} style={{ fontSize: 12, color: COLOR.primary, fontWeight: 600, cursor: "pointer" }}>전체 보기 →</span>
              </div>
              {pending.length === 0 ? (
                <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12, color: COLOR.text3 }}>승인 대기 건이 없습니다.</div>
              ) : pending.map((p, i) => (
                <div key={p.id} style={{
                  padding: "12px 18px", borderBottom: i < pending.length - 1 ? `1px solid ${COLOR.bgSubtle}` : "none",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: sourceColor(p.source), padding: "1px 6px", borderRadius: 20, flexShrink: 0 }}>{sourceLabel(p.source)}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLOR.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    </div>
                    <div style={{ fontSize: 11, color: COLOR.text3 }}>{p.dept} · {p.type}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: COLOR.text3 }}>{p.submittedAt}</span>
                    <button onClick={() => navigate("/admin/review")} style={{ background: COLOR.primary, color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      검토
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLOR.bgSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>최근 승인</div>
                <span onClick={() => navigate("/admin/projects")} style={{ fontSize: 12, color: COLOR.primary, fontWeight: 600, cursor: "pointer" }}>전체 보기 →</span>
              </div>
              {recentApproved.length === 0 ? (
                <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12, color: COLOR.text3 }}>최근 승인 건이 없습니다.</div>
              ) : recentApproved.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => navigate(detailPathOf(p.source, p.id))}
                  style={{
                    padding: "12px 18px", borderBottom: i < recentApproved.length - 1 ? `1px solid ${COLOR.bgSubtle}` : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = COLOR.bgSubtle)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: sourceColor(p.source), padding: "1px 6px", borderRadius: 20, flexShrink: 0 }}>{sourceLabel(p.source)}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLOR.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    </div>
                    <div style={{ fontSize: 11, color: COLOR.text3 }}>{p.dept}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: COLOR.text3 }}>{p.approvedAt}</span>
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
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>월별 등록 추이 <span style={{ fontSize: 11, color: COLOR.text3, fontWeight: 500, marginLeft: 6 }}>최근 12개월 · 카테고리별</span></div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {SOURCES.map(s => (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                      <span style={{ fontSize: 10, color: COLOR.text2 }}>{s.label}</span>
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
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.text }}>{total}</div>
                      <div style={{ width: "100%", maxWidth: 40, height: h, borderRadius: "4px 4px 0 0", overflow: "hidden", display: "flex", flexDirection: "column-reverse", background: total === 0 ? COLOR.bgSubtle : "transparent" }}>
                        {total > 0 && SOURCES.map(s => {
                          const val = m[s.key];
                          if (!val) return null;
                          return <div key={s.key} title={`${s.label} ${val}건`} style={{ height: `${(val / total) * 100}%`, background: s.color }} />;
                        })}
                      </div>
                      <div style={{ fontSize: 10, color: COLOR.text3, fontWeight: 500 }}>{m.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 16 }}>카테고리별 구성 <span style={{ fontSize: 11, color: COLOR.text3, fontWeight: 500, marginLeft: 6 }}>누적 {totalRegistrations}건</span></div>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16, background: COLOR.bgSubtle }}>
                {SOURCES.map(s => sourceTotal[s.key] > 0 && <div key={s.key} title={`${s.label}: ${sourceTotal[s.key]}건`} style={{ flex: sourceTotal[s.key], background: s.color }} />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {SOURCES.map(s => {
                  const pct = totalRegistrations > 0 ? Math.round(sourceTotal[s.key] / totalRegistrations * 100) : 0;
                  return (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: COLOR.text2, flex: 1 }}>{s.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLOR.text }}>{sourceTotal[s.key]}</span>
                      <span style={{ fontSize: 11, color: COLOR.text3, width: 32, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 비즈니스 도메인 분포 */}
          <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 16 }}>비즈니스 도메인 분포 <span style={{ fontSize: 11, color: COLOR.text3, fontWeight: 500, marginLeft: 6 }}>AX 플랫폼 기준</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "9px 32px" }}>
              {domain.map((d, i) => {
                const pct = Math.round((d.count / totalDomain) * 100);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 11, color: COLOR.text2, width: 72, flexShrink: 0, fontWeight: 500 }}>{d.label}</div>
                    <div style={{ flex: 1, background: COLOR.bgSubtle, borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: COLOR.primary, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: COLOR.text3, width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</div>
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
