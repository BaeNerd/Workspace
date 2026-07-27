import { useState, useMemo, useEffect } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminScopeSelect from "../../components/AdminScopeSelect";
import type { ScopeSelection } from "../../components/AdminScopeSelect";
import AdminPeriodSelect from "../../components/AdminPeriodSelect";
import { useAuth } from "../../context/useAuth";
import { CATEGORIES } from "../../types/categoryTypes";
import { getStatsByScope, resolvePeriod, monthTotal, orgCompanyName } from "../../lib/dataSource";
import { COLOR } from "../../styles/tokens";
import { ADMIN_CONTENT_MAX, ADMIN_PAD } from "../../styles/layout";
import type { SourceKey, PeriodSelection } from "../../lib/dataSource";

// 유형 색상·라벨은 CATEGORIES 단일 소스에서 파생 (7유형: etc 포함)
const SOURCES: { key: SourceKey; label: string; color: string }[] =
  CATEGORIES.map(p => ({ key: p.id, label: p.name, color: p.color }));

// ============================================================
// 통계 수치는 자산 SSOT·후기에서 파생된다(lib/statsDerive). 소비 시점 범위 집계는
// dataSource.getStatsByScope가 공급하며, 아래 *_META는 표시(라벨·색상) 전용
// 프레젠테이션 메타로 화면에 둔다(파생 결과의 인덱스 축과 1:1 대응).
// ============================================================

// n8n 워크플로우 기준 (난이도 축은 n8n 전용)
const DIFFICULTY_META = [
  { label: "쉬움", color: "#059669" }, { label: "보통", color: "#2563EB" }, { label: "어려움", color: "#7C3AED" },
];

// AI Model 모델 기준 (3단계)
const COST_META = [
  { label: "낮음", color: "#059669" }, { label: "보통", color: "#2563EB" }, { label: "높음", color: "#EF4444" },
];

// ML 모델 유형 분포
const ML_TYPE_META = [
  { label: "이미지 인식", color: "#0891B2" },
  { label: "시계열 예측", color: "#2563EB" },
  { label: "자연어 처리", color: "#7C3AED" },
  { label: "분류/회귀", color: "#059669" },
];

// 담당 관계사 배지 텍스트 (코드 → 표시명, 조직 SSOT orgCompanyName 파생) — AdminDashboard와 동일 방식
const scopeCompanyNames = (codes: string[]): string =>
  codes.map(c => orgCompanyName(c)).join(" · ");

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 800, color: COLOR.text2, letterSpacing: "0.04em",
  textTransform: "uppercase", margin: "8px 0 14px",
  display: "flex", alignItems: "center", gap: 8,
};

// ============================================================
// 순위 목록 차트 공용 패턴 — 기본 상위 5만 표시하고, 상자 클릭 또는 헤더 "전체 보기 (N)" 토글로
// 같은 상자를 전체 목록으로 펼친다(재클릭·"접기"로 복귀). 부서별 현황·비즈니스 도메인 두 차트가
// 이 한 컴포넌트를 공유한다(중복 구현 금지). 도메인은 현재 6종이라 상위 5 + 외 1개지만 동일 패턴을
// 적용한다 — SSO 연동 후 부서·도메인이 급증해도 분기 없이 대응하기 위한 것이 사유다.
// 접힘/펼침과 무관하게 분모(total·max)는 전량에서 계산하므로 막대 비율이 불변이고,
// 표시 항목(상위 5) + "외 N개"의 합이 곧 전체다. 선택 기간·범위 필터 정합은 items가 이미
// 파생 계층에서 기간 집계된 값이라 자동으로 보장된다.
// ============================================================
const TOP_RANK_LIMIT = 5;

const rankCardStyle: React.CSSProperties = {
  background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 22px",
};
const rankHeaderStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8,
};
const rankToggleStyle: React.CSSProperties = {
  background: "transparent", border: "none", color: COLOR.primary, fontSize: 11, fontWeight: 700,
  cursor: "pointer", padding: 0, whiteSpace: "nowrap",
};

type RankRow = { count: number };
function CollapsibleRankChart<T extends RankRow>({ title, items, renderRow, emptyText }: {
  title: string;
  items: T[];
  renderRow: (item: T, rank: number, max: number, total: number) => React.ReactNode;
  emptyText: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(() => [...items].sort((a, b) => b.count - a.count), [items]);
  const total = sorted.reduce((s, x) => s + x.count, 0) || 1;
  const max = Math.max(...sorted.map(x => x.count), 1);
  const shown = expanded ? sorted : sorted.slice(0, TOP_RANK_LIMIT);
  const hidden = sorted.length - shown.length; // 접힘 상태에서 감춰진 항목 수 = "외 N개"
  const canExpand = sorted.length > TOP_RANK_LIMIT;

  return (
    <div
      onClick={canExpand ? () => setExpanded(v => !v) : undefined}
      onMouseEnter={canExpand ? e => (e.currentTarget.style.borderColor = COLOR.primary) : undefined}
      onMouseLeave={canExpand ? e => (e.currentTarget.style.borderColor = COLOR.border) : undefined}
      style={{ ...rankCardStyle, cursor: canExpand ? "pointer" : "default", transition: "border-color 0.12s" }}
    >
      <div style={rankHeaderStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>{title}</div>
        {canExpand && (
          <button type="button" onClick={e => { e.stopPropagation(); setExpanded(v => !v); }} style={rankToggleStyle}>
            {expanded ? "접기" : `전체 보기 (${sorted.length})`}
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {shown.map((item, i) => renderRow(item, i, max, total))}
        {!expanded && hidden > 0 && (
          <div style={{ fontSize: 11, color: COLOR.text3, paddingTop: 2 }}>외 {hidden}개</div>
        )}
        {sorted.length === 0 && (
          <div style={{ fontSize: 12, color: COLOR.text3, padding: "8px 0" }}>{emptyText}</div>
        )}
      </div>
    </div>
  );
}

export default function AdminStatistics() {
  const { isCompanyAdmin, managedCompanies } = useAuth();
  // 기간 선택 — 기본 "올해 전체"(현재 연도 1월~현재 월, 시스템 현재월 파생). 유효 범위는 resolvePeriod로 환원.
  const [periodSel, setPeriodSel] = useState<PeriodSelection>({ kind: "preset", preset: "올해 전체" });
  const range = useMemo(() => resolvePeriod(periodSel), [periodSel]);
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
  // 유효 조회 범위: 개별 관계사 선택 시 해당 코드, 아니면 권한 범위 (기간 × 관계사 이중 필터)
  const viewScope = scopeSel.kind === "company" ? [scopeSel.code] : baseScope;
  // useMemo 의존성용 안정 키 ("ALL"=전사, ""=담당 없음, 그 외=코드 정렬 조인)
  const scopeKey = viewScope ? [...viewScope].sort().join(",") : "ALL";

  const agg = useMemo(() => {
    const currentScope = scopeKey === "ALL" ? null : (scopeKey === "" ? [] : scopeKey.split(","));
    const s = getStatsByScope(currentScope, range);

    // 표시 전용 META(라벨·색상) 병합만 화면에서 처리 — 데이터·집계·시간 파싱은 dataSource(statsDerive)가 공급.
    const difficulty = DIFFICULTY_META.map((d, i) => ({ ...d, count: s.difficultyCounts[i] }));
    const cost = COST_META.map((c, i) => ({ ...c, count: s.costCounts[i] }));
    const mlType = ML_TYPE_META.map((t, i) => ({ ...t, count: s.mlTypeCounts[i] }));

    return { companies: s.companies, monthSeries: s.monthSeries, sourceTotal: s.sourceTotal, domain: s.domain,
      difficulty, cost, mlType, dept: s.dept, deptCount: s.deptCount, tagFreq: s.tagFreq,
      topReviews: s.topReviews, newThisMonth: s.newThisMonth,
      totalAnnualHoursSaved: s.timeSaved.annualTotal, estimableCount: s.timeSaved.estimable, unestimableCount: s.timeSaved.unestimable };
  }, [scopeKey, rangeKey]);

  const totalRegistrations =
    agg.sourceTotal.n8n + agg.sourceTotal.pa + agg.sourceTotal.assistant +
    agg.sourceTotal["ai-orchestration"] + agg.sourceTotal.ml + agg.sourceTotal.vibe + agg.sourceTotal.etc;

  // 도메인·부서 분포는 CollapsibleRankChart가 자체적으로 total·max를 전량에서 산출한다(접힘/펼침 합계 불변).
  const totalDifficulty = agg.difficulty.reduce((s, d) => s + d.count, 0) || 1;
  const totalCost = agg.cost.reduce((s, d) => s + d.count, 0) || 1;
  const totalMlType = agg.mlType.reduce((s, d) => s + d.count, 0) || 1;
  const maxTag = Math.max(...agg.tagFreq.map(k => k.count), 1);

  // 월별 시계열은 선택 범위 위에서 0-fill된 연속 축(파생 계층 공급). 카테고리 합계도 동일 기간 소스(sourceTotal)에서 파생 — 화면 개별 필터 없음.
  const monthly = agg.monthSeries;
  const maxMonthly = Math.max(...monthly.map(monthTotal), 1);
  // x축 라벨 밀도 자동 조정 — 범위 지정 최대 24개월까지 YY.MM 라벨이 겹치지 않도록 표기 간격을 늘린다(막대는 전량 유지).
  const monthLabelStep = monthly.length > 14 ? 2 : 1;
  const periodLabel = range.from === range.to ? range.from.replace("-", ".") : `${range.from.replace("-", ".")} ~ ${range.to.replace("-", ".")}`;

  const sourceByPeriod = SOURCES.map(s => ({ ...s, count: agg.sourceTotal[s.key] }));
  const periodTotal = totalRegistrations;

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: `28px ${ADMIN_PAD}px`, minWidth: 0, maxWidth: ADMIN_CONTENT_MAX }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{isCompanyAdmin ? "관계사 관리자" : "관리자"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>통계 대시보드</h1>
                {showScopeSelect ? (
                  <AdminScopeSelect value={scopeSel} onChange={setScopeSel} restrictTo={baseScope} />
                ) : !noScope && baseScope ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#B4602E", background: "#FBEEE4", padding: "3px 10px", borderRadius: 20 }}>
                    담당 관계사 {baseScope.length}곳: {scopeCompanyNames(baseScope)}
                  </span>
                ) : null}
              </div>
              <p style={{ fontSize: 13, color: COLOR.text2, marginTop: 4 }}>AX 플랫폼(n8n · Power Automate · 나만의 비서 · AI Model · ML · Vibe · AI 프로젝트) 등록 현황을 통합 분석합니다.</p>
            </div>

            <AdminPeriodSelect value={periodSel} onChange={setPeriodSel} />
          </div>

          {noScope && (
            <div style={{ background: "#FBEEE4", border: "1px solid #F0D4BF", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 13, fontWeight: 600, color: "#B4602E" }}>
              담당 관계사가 지정되지 않았습니다. 전사관리자에게 문의하세요.
            </div>
          )}

          {/* 상단 4카드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "전체 등록물", value: totalRegistrations, sub: "전체 유형 합산", color: "#0F172A" },
              { label: "이번 달 신규", value: agg.newThisMonth, sub: "당월 createdAt 기준", color: "#2563EB" },
              { label: "참여 부서", value: agg.deptCount, sub: "집계된 부서 수", color: "#059669" },
              { label: "참여 관계사", value: agg.companies.length, sub: "전체 관계사", color: "#7C3AED" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLOR.text3, marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: "-0.03em", marginBottom: 4 }}>{k.value}</div>
                <div style={{ fontSize: 11, color: COLOR.text3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* 등록 추이 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>등록 추이 <span style={{ fontSize: 11, color: COLOR.text3, fontWeight: 500, marginLeft: 8 }}>{periodLabel}</span></div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {SOURCES.map(s => (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 9, height: 9, borderRadius: 2, background: s.color }} />
                      <span style={{ fontSize: 11, color: COLOR.text2 }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: monthly.length === 1 ? 0 : 10, height: 130, justifyContent: monthly.length === 1 ? "center" : "flex-start" }}>
                {monthly.map((m, i) => {
                  const total = monthTotal(m);
                  const h = total === 0 ? 6 : Math.max((total / maxMonthly) * 100, 8);
                  return (
                    <div key={i} style={{ flex: monthly.length === 1 ? "0 0 90px" : 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLOR.text }}>{total}</div>
                      <div style={{ width: "100%", maxWidth: 64, height: h, borderRadius: "4px 4px 0 0", overflow: "hidden", display: "flex", flexDirection: "column-reverse", background: total === 0 ? COLOR.bgSubtle : "transparent" }}>
                        {total > 0 && SOURCES.map(s => {
                          const val = (m as Record<SourceKey, number>)[s.key];
                          if (!val) return null;
                          return <div key={s.key} title={`${s.label} ${val}건`} style={{ height: `${(val / total) * 100}%`, background: s.color }} />;
                        })}
                      </div>
                      <div style={{ fontSize: 11, color: COLOR.text3, minHeight: 14 }}>{i % monthLabelStep === 0 ? m.m : ""}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 출처별 등록 현황 */}
          <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>카테고리별 등록 현황 <span style={{ fontSize: 11, color: COLOR.text3, fontWeight: 500, marginLeft: 8 }}>{periodLabel} 기준 · 총 {periodTotal}건</span></div>
            </div>
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16, background: COLOR.bgSubtle }}>
              {sourceByPeriod.map(s => s.count > 0 && <div key={s.key} title={`${s.label}: ${s.count}건`} style={{ flex: s.count, background: s.color }} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {sourceByPeriod.map(s => {
                const pct = periodTotal > 0 ? Math.round(s.count / periodTotal * 100) : 0;
                return (
                  <div key={s.key} style={{ border: `1px solid ${COLOR.bgSubtle}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLOR.text2 }}>{s.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>{s.count}</span>
                      <span style={{ fontSize: 11, color: COLOR.text3 }}>건 · {pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AX 플랫폼 분석 섹션 */}
          <div style={sectionLabelStyle}>
            <span style={{ width: 4, height: 14, borderRadius: 2, background: COLOR.primary }} />AX 플랫폼 분석
          </div>

          {/* 비즈니스 도메인 분포 | 부서별 현황 — 공용 TOP5 펼치기 패턴(CollapsibleRankChart) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, alignItems: "start" }}>
            <CollapsibleRankChart
              title="비즈니스 도메인 분포"
              items={agg.domain}
              emptyText="해당 범위의 도메인 데이터가 없습니다."
              renderRow={(d, _rank, _max, total) => {
                const pct = Math.round(d.count / total * 100);
                return (
                  <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: COLOR.text2, width: 80, flexShrink: 0 }}>{d.label}</span>
                    <div style={{ flex: 1, background: COLOR.bgSubtle, borderRadius: 4, height: 7, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: COLOR.primary, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, color: COLOR.text3, width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
                  </div>
                );
              }}
            />

            <CollapsibleRankChart
              title="부서별 현황"
              items={agg.dept}
              emptyText="해당 범위의 부서 데이터가 없습니다."
              renderRow={(d, rank, max, _total) => (
                <div key={d.dept} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: COLOR.text3, width: 16, textAlign: "right", flexShrink: 0 }}>{rank + 1}</span>
                  <span style={{ fontSize: 12, color: COLOR.text2, width: 100, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.dept}</span>
                  <div style={{ flex: 1, background: COLOR.bgSubtle, borderRadius: 4, height: 7, overflow: "hidden" }}>
                    <div style={{ width: `${(d.count / max) * 100}%`, height: "100%", background: "#059669", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, color: COLOR.text3, width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
                </div>
              )}
            />
          </div>

          {/* 등록 항목 분석 섹션 */}
          <div style={sectionLabelStyle}>
            <span style={{ width: 4, height: 14, borderRadius: 2, background: "#DB2777" }} />등록 카드 분석
            <span style={{ fontSize: 11, fontWeight: 500, color: COLOR.text3, textTransform: "none", letterSpacing: 0 }}>전체 유형 기준 (총 {totalRegistrations}건)</span>
          </div>

          {/* 절감 효과 요약 */}
          <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>
                절감 효과 요약
                <span style={{ fontSize: 11, color: COLOR.text3, fontWeight: 500, marginLeft: 8 }}>
                  n8n · PA 등록 카드의 예상 절감 시간 기준 (자유 입력 텍스트 정규화 집계)
                </span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div style={{ border: `1px solid ${COLOR.bgSubtle}`, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLOR.text3, marginBottom: 6 }}>전사 예상 절감 시간 (연간 환산)</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#059669", letterSpacing: "-0.02em" }}>
                    {Math.round(agg.totalAnnualHoursSaved).toLocaleString()}
                  </span>
                  <span style={{ fontSize: 12, color: COLOR.text3 }}>시간 / 년</span>
                </div>
              </div>
              <div style={{ border: `1px solid ${COLOR.bgSubtle}`, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLOR.text3, marginBottom: 6 }}>집계 가능 카드 수</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>{agg.estimableCount}</span>
                  <span style={{ fontSize: 12, color: COLOR.text3 }}>건</span>
                </div>
              </div>
              <div style={{ border: `1px solid ${COLOR.bgSubtle}`, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLOR.text3, marginBottom: 6 }}>추정 불가 카드 수</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#D97706", letterSpacing: "-0.02em" }}>{agg.unestimableCount}</span>
                  <span style={{ fontSize: 12, color: COLOR.text3 }}>건 · 입력값 표준화 필요</span>
                </div>
              </div>
            </div>
          </div>

          {/* 난이도 분포 | 비용 구간 분포 | ML 모델 유형 분포 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 4 }}>난이도 분포</div>
              <div style={{ fontSize: 10, color: COLOR.text3, marginBottom: 14 }}>n8n 워크플로우 기준</div>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16, background: COLOR.bgSubtle }}>
                {agg.difficulty.map((d, i) => d.count > 0 && <div key={i} title={`${d.label}: ${d.count}건`} style={{ flex: d.count, background: d.color }} />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {agg.difficulty.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: COLOR.text2, flex: 1 }}>{d.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLOR.text }}>{d.count}</span>
                    <span style={{ fontSize: 11, color: COLOR.text3, width: 32, textAlign: "right" }}>{Math.round(d.count / totalDifficulty * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 4 }}>비용 구간 분포</div>
              <div style={{ fontSize: 10, color: COLOR.text3, marginBottom: 14 }}>AI Model 모델 기준</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {agg.cost.map((c, i) => {
                  const pct = Math.round(c.count / totalCost * 100);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: COLOR.text2, width: 42, flexShrink: 0 }}>{c.label}</span>
                      <div style={{ flex: 1, background: COLOR.bgSubtle, borderRadius: 4, height: 7, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, color: COLOR.text3, width: 44, textAlign: "right", flexShrink: 0 }}>{c.count} · {pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 4 }}>ML 모델 유형 분포</div>
              <div style={{ fontSize: 10, color: COLOR.text3, marginBottom: 14 }}>ML 모델 기준</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {agg.mlType.map((t, i) => {
                  const pct = Math.round(t.count / totalMlType * 100);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: COLOR.text2, width: 72, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
                      <div style={{ flex: 1, background: COLOR.bgSubtle, borderRadius: 4, height: 7, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: t.color, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, color: COLOR.text3, width: 44, textAlign: "right", flexShrink: 0 }}>{t.count} · {pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 후기 많은 항목 TOP 5 */}
          {(() => {
            const topReviews = agg.topReviews;
            const maxReview = Math.max(...topReviews.map(r => r.reviewCount), 1);
            return (
              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 16 }}>
                  후기 많은 카드 TOP 5 <span style={{ fontSize: 11, color: COLOR.text2, fontWeight: 500, marginLeft: 8 }}>누적 후기 수 기준</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {topReviews.map((item, i) => {
                    const pct = Math.round((item.reviewCount / maxReview) * 100);
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: i < 3 ? COLOR.text : "#CBD5E1", width: 20, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: COLOR.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                            <span style={{ fontSize: 10, color: COLOR.text3, flexShrink: 0, fontFamily: "var(--font-mono)" }}>{item.id}</span>
                          </div>
                          <div style={{ background: COLOR.bgSubtle, borderRadius: 4, height: 7, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: COLOR.primary, borderRadius: 4 }} />
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: COLOR.text }}>{item.reviewCount}</div>
                          <div style={{ fontSize: 10, color: COLOR.text3 }}>평균 ♥ {item.avgLikes}</div>
                        </div>
                      </div>
                    );
                  })}
                  {topReviews.length === 0 && (
                    <div style={{ fontSize: 12, color: COLOR.text3, padding: "8px 0" }}>해당 범위의 후기 데이터가 없습니다.</div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 태그 빈도 */}
          <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 16 }}>태그 빈도 <span style={{ fontSize: 11, color: COLOR.text2, fontWeight: 500, marginLeft: 8 }}>카드에 부착된 상위 태그</span></div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 100 }}>
              {agg.tagFreq.map((k, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.text2 }}>{k.count}</div>
                  <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: `hsl(${220 + i * 12}, 70%, ${55 + i * 3}%)`, height: `${(k.count / maxTag) * 76}px` }} />
                  <div style={{ fontSize: 10, color: COLOR.text3, fontWeight: 600, textAlign: "center" }}>{k.tag}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
