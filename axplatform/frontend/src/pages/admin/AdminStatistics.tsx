import { useState, useMemo, useEffect } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminScopeSelect from "../../components/AdminScopeSelect";
import type { ScopeSelection } from "../../components/AdminScopeSelect";
import { useAuth } from "../../context/useAuth";
import { CATEGORIES } from "../../types/categoryTypes";
import { getStatsByScope, monthTotal, COMPANY_NAME } from "../../lib/dataSource";
import { COLOR } from "../../styles/tokens";
import type { MonthPoint, SourceKey } from "../../lib/dataSource";

const PERIODS = ["이번 달", "최근 3개월", "최근 6개월", "올해 전체"] as const;
type Period = typeof PERIODS[number];

const pad2 = (n: number) => String(n).padStart(2, "0");

// 유형 색상·라벨은 CATEGORIES 단일 소스에서 파생 (7유형: etc 포함)
const SOURCES: { key: SourceKey; label: string; color: string }[] =
  CATEGORIES.map(p => ({ key: p.id, label: p.name, color: p.color }));

// ============================================================
// 화면 고유 통계 더미(부서·난이도·비용·ML유형·키워드·절감시간·후기 TOP5)와
// 범위 집계 헬퍼는 mocks/statsMockData로 이관·합류됨. 소비 시점 합성은
// dataSource.getStatsByScope가 담당한다. 아래 *_META는 표시(라벨·색상) 전용
// 프레젠테이션 메타로 화면에 잔류한다.
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

// 담당 관계사 배지 텍스트 (코드 → 표시명, 매핑 없으면 코드 그대로) — AdminDashboard와 동일 방식
const scopeCompanyNames = (codes: string[]): string =>
  codes.map(c => COMPANY_NAME[c] ?? c).join(" · ");

const PICK_YEARS = [2025];
const PICK_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const PERIOD_MULTIPLIER: Record<string, number> = {
  "일": 365, "하루": 365, "주": 52, "주일": 52, "월": 12, "개월": 12, "년": 1, "연": 1,
};

function parseTimeSaved(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;
  const hourMatch = text.match(/(일|하루|주일|주|월|개월|년|연)\s*(\d+(?:\.\d+)?)\s*시간/);
  const minMatch = text.match(/(일|하루|주일|주|월|개월|년|연)\s*(\d+(?:\.\d+)?)\s*분/);
  if (hourMatch) {
    const mult = PERIOD_MULTIPLIER[hourMatch[1]];
    const value = parseFloat(hourMatch[2]);
    if (mult && !isNaN(value)) return value * mult;
  }
  if (minMatch) {
    const mult = PERIOD_MULTIPLIER[minMatch[1]];
    const value = parseFloat(minMatch[2]);
    if (mult && !isNaN(value)) return (value / 60) * mult;
  }
  return null;
}

const selectStyle: React.CSSProperties = {
  padding: "6px 10px", fontSize: 12, fontWeight: 600, color: COLOR.text, background: "#fff",
  border: `1.5px solid ${COLOR.border}`, borderRadius: 6, outline: "none", fontFamily: "inherit", cursor: "pointer",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 800, color: COLOR.text2, letterSpacing: "0.04em",
  textTransform: "uppercase", margin: "8px 0 14px",
  display: "flex", alignItems: "center", gap: 8,
};

export default function AdminStatistics() {
  const { isCompanyAdmin, managedCompanies } = useAuth();
  const [periodMode, setPeriodMode] = useState<"preset" | "month">("preset");
  const [period, setPeriod] = useState<Period>("최근 6개월");
  const [pickYear, setPickYear] = useState(2025);
  const [pickMonth, setPickMonth] = useState(6);

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
    const s = getStatsByScope(currentScope);

    // 표시 전용 META 병합·시간 파싱은 화면 프레젠테이션에서 처리 (데이터·집계는 dataSource가 공급).
    const difficulty = DIFFICULTY_META.map((d, i) => ({ ...d, count: s.difficultyCounts[i] }));
    const cost = COST_META.map((c, i) => ({ ...c, count: s.costCounts[i] }));
    const mlType = ML_TYPE_META.map((t, i) => ({ ...t, count: s.mlTypeCounts[i] }));

    const parsed = s.timeSamples.map(parseTimeSaved);
    const totalAnnualHoursSaved = parsed.reduce<number>((sum, v) => sum + (v ?? 0), 0);
    const unestimableCount = parsed.filter(v => v === null).length;
    const estimableCount = parsed.length - unestimableCount;

    return { companies: s.companies, monthSeries: s.monthSeries, sourceTotal: s.sourceTotal, domain: s.domain,
      difficulty, cost, mlType, dept: s.dept, keyword: s.keyword,
      topReviews: s.topReviews, totalAnnualHoursSaved, unestimableCount, estimableCount };
  }, [scopeKey]);

  const MONTH_SERIES = agg.monthSeries;
  const PRESET_MONTHS: Record<Period, MonthPoint[]> = {
    "이번 달": MONTH_SERIES.slice(-1),
    "최근 3개월": MONTH_SERIES.slice(-3),
    "최근 6개월": MONTH_SERIES.slice(-6),
    "올해 전체": MONTH_SERIES,
  };

  const totalRegistrations =
    agg.sourceTotal.n8n + agg.sourceTotal.pa + agg.sourceTotal.assistant +
    agg.sourceTotal["ai-orchestration"] + agg.sourceTotal.ml + agg.sourceTotal.vibe + agg.sourceTotal.etc;

  const totalDomain = agg.domain.reduce((s, d) => s + d.count, 0) || 1;
  const totalDifficulty = agg.difficulty.reduce((s, d) => s + d.count, 0) || 1;
  const totalCost = agg.cost.reduce((s, d) => s + d.count, 0) || 1;
  const totalMlType = agg.mlType.reduce((s, d) => s + d.count, 0) || 1;
  const maxDept = Math.max(...agg.dept.map(d => d.count), 1);
  const maxKeyword = Math.max(...agg.keyword.map(k => k.count), 1);

  const monthly: MonthPoint[] = periodMode === "month"
    ? [MONTH_SERIES.find(s => s.key === `${pickYear}-${pad2(pickMonth)}`)
        ?? { key: `${pickYear}-${pad2(pickMonth)}`, m: `${pickMonth}월`, month: `${pickMonth}월`, n8n: 0, pa: 0, assistant: 0, "ai-orchestration": 0, ml: 0, vibe: 0, etc: 0 }]
    : PRESET_MONTHS[period];

  const maxMonthly = Math.max(...monthly.map(monthTotal), 1);
  const periodLabel = periodMode === "month" ? `${pickYear}.${pad2(pickMonth)}` : period;

  const sourceByPeriod = SOURCES.map(s => ({ ...s, count: monthly.reduce((acc, m) => acc + (m as Record<SourceKey, number>)[s.key], 0) }));
  const periodTotal = sourceByPeriod.reduce((a, b) => a + b.count, 0);

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
            <div>
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

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4, background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 8, padding: 4 }}>
                {PERIODS.map(p => {
                  const active = periodMode === "preset" && period === p;
                  return (
                    <button key={p} onClick={() => { setPeriodMode("preset"); setPeriod(p); }} style={{
                      padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: active ? "#0F172A" : "transparent",
                      color: active ? "#fff" : COLOR.text2,
                    }}>{p}</button>
                  );
                })}
                <button onClick={() => setPeriodMode("month")} style={{
                  padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: periodMode === "month" ? "#0F172A" : "transparent",
                  color: periodMode === "month" ? "#fff" : COLOR.text2,
                }}>월 지정</button>
              </div>

              {periodMode === "month" && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 8, padding: "4px 6px" }}>
                  <select value={pickYear} onChange={e => setPickYear(Number(e.target.value))} style={selectStyle}>
                    {PICK_YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
                  </select>
                  <select value={pickMonth} onChange={e => setPickMonth(Number(e.target.value))} style={selectStyle}>
                    {PICK_MONTHS.map(m => <option key={m} value={m}>{m}월</option>)}
                  </select>
                </div>
              )}
            </div>
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
              { label: "이번 달 신규", value: monthTotal(MONTH_SERIES[MONTH_SERIES.length - 1]), sub: "전체 유형 합산", color: "#2563EB" },
              { label: "참여 부서", value: agg.dept.length, sub: "집계된 부서 수", color: "#059669" },
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
                      <div style={{ fontSize: 11, color: COLOR.text3 }}>{m.m}</div>
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

          {/* 비즈니스 도메인 분포 | 부서별 현황 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 16 }}>비즈니스 도메인 분포</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {agg.domain.map((d, i) => {
                  const pct = Math.round(d.count / totalDomain * 100);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: COLOR.text2, width: 80, flexShrink: 0 }}>{d.label}</span>
                      <div style={{ flex: 1, background: COLOR.bgSubtle, borderRadius: 4, height: 7, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: COLOR.primary, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, color: COLOR.text3, width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 16 }}>부서별 현황</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {agg.dept.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: COLOR.text3, width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: COLOR.text2, width: 100, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.dept}</span>
                    <div style={{ flex: 1, background: COLOR.bgSubtle, borderRadius: 4, height: 7, overflow: "hidden" }}>
                      <div style={{ width: `${(d.count / maxDept) * 100}%`, height: "100%", background: "#059669", borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, color: COLOR.text3, width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
                  </div>
                ))}
                {agg.dept.length === 0 && (
                  <div style={{ fontSize: 12, color: COLOR.text3, padding: "8px 0" }}>해당 범위의 부서 데이터가 없습니다.</div>
                )}
              </div>
            </div>
          </div>

          {/* 등록 항목 분석 섹션 */}
          <div style={sectionLabelStyle}>
            <span style={{ width: 4, height: 14, borderRadius: 2, background: "#DB2777" }} />등록 항목 분석
            <span style={{ fontSize: 11, fontWeight: 500, color: COLOR.text3, textTransform: "none", letterSpacing: 0 }}>전체 유형 기준 (총 {totalRegistrations}건)</span>
          </div>

          {/* 절감 효과 요약 */}
          <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>
                절감 효과 요약
                <span style={{ fontSize: 11, color: COLOR.text3, fontWeight: 500, marginLeft: 8 }}>
                  n8n · PA 등록 항목의 예상 절감 시간 기준 (자유 입력 텍스트 정규화 집계)
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
                <div style={{ fontSize: 11, fontWeight: 600, color: COLOR.text3, marginBottom: 6 }}>집계 가능 항목 수</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>{agg.estimableCount}</span>
                  <span style={{ fontSize: 12, color: COLOR.text3 }}>건</span>
                </div>
              </div>
              <div style={{ border: `1px solid ${COLOR.bgSubtle}`, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLOR.text3, marginBottom: 6 }}>추정 불가 항목 수</div>
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
                  후기 많은 항목 TOP 5 <span style={{ fontSize: 11, color: COLOR.text2, fontWeight: 500, marginLeft: 8 }}>누적 후기 수 기준</span>
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

          {/* 탐색 키워드 빈도 */}
          <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 16 }}>탐색 키워드 빈도 <span style={{ fontSize: 11, color: COLOR.text2, fontWeight: 500, marginLeft: 8 }}>사용자가 검색한 상위 키워드</span></div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 100 }}>
              {agg.keyword.map((k, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.text2 }}>{k.count}</div>
                  <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: `hsl(${220 + i * 12}, 70%, ${55 + i * 3}%)`, height: `${(k.count / maxKeyword) * 76}px` }} />
                  <div style={{ fontSize: 10, color: COLOR.text3, fontWeight: 600, textAlign: "center" }}>{k.keyword}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
