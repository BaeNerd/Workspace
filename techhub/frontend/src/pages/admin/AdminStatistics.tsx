import { useState, useMemo } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useAuth } from "../../context/useAuth";
// ★ 변경 — 관계사 차원 공용 mock·헬퍼는 공용 모듈에서 가져온다 (AdminDashboard와 정합).
import {
  STAT_COMPANIES,
  scopedCompanies, aggregateMonthly, aggregateSourceTotal, aggregateDomain,
  monthTotal, scopeBadgeText,
} from "../../mocks/statsMockData";
import type { MonthPoint, SourceKey, StatCompany } from "../../mocks/statsMockData";

const PERIODS = ["이번 달", "최근 3개월", "최근 6개월", "올해 전체"] as const;
type Period = typeof PERIODS[number];

const pad2 = (n: number) => String(n).padStart(2, "0");

// 출처 정의 (표시용 라벨/색). 키는 공용 SourceKey(ai-orchestration 정식 표기)와 일치.
const SOURCES: { key: SourceKey; label: string; color: string }[] = [
  { key: "project", label: "프로젝트", color: "#2563EB" },
  { key: "n8n", label: "n8n", color: "#DB2777" },
  { key: "assistant", label: "나만의비서", color: "#059669" },
  { key: "ai-orchestration", label: "AI Agent", color: "#7C3AED" },
];

// ============================================================
// ★ 화면 고유 더미 (공용화하지 않음) — 상태·스택·부서·시스템유형·난이도·비용·키워드·절감시간
// 모두 관계사 차원. TODO: 백엔드 연동 시 폐기.
// ============================================================

// 상태 × 관계사 (프로젝트 기준). GET /api/v1/admin/stats/status?company=:codes
const STATUS_META = [
  { label: "운영 중", color: "#059669" }, { label: "개발 중", color: "#2563EB" },
  { label: "파일럿", color: "#D97706" }, { label: "보류", color: "#EF4444" }, { label: "종료", color: "#475569" },
];
const STATUS_BY_COMPANY: Record<StatCompany, number[]> = {
  // 순서: [운영 중, 개발 중, 파일럿, 보류, 종료]
  KKM: [26, 19, 8, 3, 2],
  KBH: [10, 8, 3, 1, 1],
  HC: [7, 6, 2, 1, 0],
  KMG: [5, 4, 2, 1, 1],
  KMW: [3, 2, 2, 1, 0],
  KUS: [2, 1, 1, 0, 0],
  KBT: [1, 1, 0, 0, 0],
};

// 스택 × 관계사. GET /api/v1/admin/stats/stack?company=:codes
const STACK_META = [
  { label: "Python", color: "#2563EB" }, { label: "React", color: "#7C3AED" },
  { label: "AWS", color: "#D97706" }, { label: "TypeScript", color: "#059669" },
  { label: "PostgreSQL", color: "#0891B2" }, { label: "Docker", color: "#475569" },
  { label: "FastAPI", color: "#DB2777" }, { label: "Kubernetes", color: "#EA580C" },
];
const STACK_BY_COMPANY: Record<StatCompany, number[]> = {
  // 순서: [Python, React, AWS, TypeScript, PostgreSQL, Docker, FastAPI, Kubernetes]
  KKM: [18, 13, 11, 9, 8, 7, 5, 4],
  KBH: [7, 5, 4, 3, 3, 2, 2, 1],
  HC: [5, 3, 3, 2, 2, 2, 1, 1],
  KMG: [4, 3, 2, 2, 2, 1, 1, 1],
  KMW: [2, 2, 2, 1, 1, 1, 1, 1],
  KUS: [1, 1, 1, 1, 1, 1, 1, 0],
  KBT: [1, 0, 1, 1, 0, 0, 0, 0],
};

// 부서 × 관계사. GET /api/v1/admin/stats/department?company=:codes
const DEPT_BY_COMPANY: Record<StatCompany, { dept: string; count: number }[]> = {
  KKM: [
    { dept: "IT개발팀", count: 14 }, { dept: "메이크업연구소", count: 8 }, { dept: "IT인프라팀", count: 6 },
    { dept: "재무팀", count: 5 }, { dept: "마케팅팀", count: 5 }, { dept: "영업팀", count: 3 },
  ],
  KBH: [
    { dept: "연구개발팀", count: 6 }, { dept: "경영지원팀", count: 4 }, { dept: "품질관리팀", count: 3 },
  ],
  HC: [
    { dept: "생활건강연구소", count: 5 }, { dept: "마케팅팀", count: 3 }, { dept: "영업팀", count: 2 },
  ],
  KMG: [
    { dept: "글로벌사업팀", count: 4 }, { dept: "경영지원팀", count: 3 },
  ],
  KMW: [
    { dept: "제조기술팀", count: 5 }, { dept: "품질관리팀", count: 4 },
  ],
  KUS: [
    { dept: "US Operations", count: 3 },
  ],
  KBT: [
    { dept: "바이오연구팀", count: 2 },
  ],
};

// 시스템 유형 × 관계사. GET /api/v1/admin/stats/system-type?company=:codes
const TYPE_META = ["웹 애플리케이션", "데이터 파이프라인", "ML/AI 모델", "API/서비스", "내부 플랫폼", "내부 도구", "기타"];
const TYPE_BY_COMPANY: Record<StatCompany, number[]> = {
  // 순서: [웹, 데이터파이프라인, ML/AI, API, 내부플랫폼, 내부도구, 기타]
  KKM: [18, 11, 10, 9, 6, 5, 2],
  KBH: [7, 4, 3, 3, 2, 2, 1],
  HC: [5, 2, 3, 2, 1, 1, 0],
  KMG: [3, 2, 2, 2, 1, 1, 1],
  KMW: [3, 2, 1, 1, 1, 1, 0],
  KUS: [1, 1, 1, 1, 0, 0, 0],
  KBT: [1, 0, 0, 0, 1, 0, 0],
};

// 난이도 × 관계사 (플랫폼 항목). GET /api/v1/admin/stats/platform-difficulty?company=:codes
const DIFFICULTY_META = [
  { label: "입문", color: "#059669" }, { label: "중급", color: "#2563EB" }, { label: "고급", color: "#7C3AED" },
];
const DIFFICULTY_BY_COMPANY: Record<StatCompany, number[]> = {
  // 순서: [입문, 중급, 고급]
  KKM: [15, 18, 7],
  KBH: [6, 7, 2],
  HC: [4, 5, 1],
  KMG: [3, 4, 2],
  KMW: [1, 2, 1],
  KUS: [1, 1, 1],
  KBT: [1, 1, 1],
};

// 비용 구간 × 관계사 (플랫폼 항목). GET /api/v1/admin/stats/platform-cost?company=:codes
const COST_META = [
  { label: "무료", color: "#059669" }, { label: "저비용", color: "#2563EB" },
  { label: "중비용", color: "#D97706" }, { label: "고비용", color: "#EF4444" },
];
const COST_BY_COMPANY: Record<StatCompany, number[]> = {
  // 순서: [무료, 저비용, 중비용, 고비용]
  KKM: [21, 11, 6, 2],
  KBH: [8, 4, 2, 1],
  HC: [5, 3, 2, 1],
  KMG: [4, 2, 1, 1],
  KMW: [3, 1, 1, 0],
  KUS: [2, 1, 1, 0],
  KBT: [1, 0, 0, 0],
};

// 탐색 키워드 × 관계사. GET /api/v1/admin/stats/search-keywords?company=:codes
const KEYWORD_BY_COMPANY: Record<StatCompany, { keyword: string; count: number }[]> = {
  KKM: [
    { keyword: "Python", count: 22 }, { keyword: "ML", count: 18 }, { keyword: "자동화", count: 14 },
    { keyword: "AWS", count: 12 }, { keyword: "데이터", count: 11 }, { keyword: "React", count: 10 },
    { keyword: "API", count: 9 }, { keyword: "대시보드", count: 7 },
  ],
  KBH: [
    { keyword: "Python", count: 8 }, { keyword: "ML", count: 6 }, { keyword: "자동화", count: 5 },
    { keyword: "AWS", count: 4 }, { keyword: "데이터", count: 4 }, { keyword: "React", count: 3 },
    { keyword: "API", count: 3 }, { keyword: "대시보드", count: 2 },
  ],
  HC: [
    { keyword: "Python", count: 5 }, { keyword: "ML", count: 4 }, { keyword: "자동화", count: 3 },
    { keyword: "AWS", count: 3 }, { keyword: "데이터", count: 3 }, { keyword: "React", count: 2 },
    { keyword: "API", count: 2 }, { keyword: "대시보드", count: 2 },
  ],
  KMG: [
    { keyword: "Python", count: 3 }, { keyword: "ML", count: 3 }, { keyword: "자동화", count: 3 },
    { keyword: "AWS", count: 2 }, { keyword: "데이터", count: 2 }, { keyword: "React", count: 2 },
    { keyword: "API", count: 1 }, { keyword: "대시보드", count: 1 },
  ],
  KMW: [
    { keyword: "Python", count: 2 }, { keyword: "ML", count: 2 }, { keyword: "자동화", count: 2 },
    { keyword: "AWS", count: 2 }, { keyword: "데이터", count: 1 }, { keyword: "React", count: 1 },
    { keyword: "API", count: 1 }, { keyword: "대시보드", count: 1 },
  ],
  KUS: [
    { keyword: "Python", count: 1 }, { keyword: "ML", count: 1 }, { keyword: "자동화", count: 1 },
    { keyword: "AWS", count: 1 }, { keyword: "데이터", count: 1 }, { keyword: "React", count: 1 },
    { keyword: "API", count: 1 }, { keyword: "대시보드", count: 1 },
  ],
  KBT: [
    { keyword: "Python", count: 1 }, { keyword: "ML", count: 1 }, { keyword: "자동화", count: 0 },
    { keyword: "AWS", count: 0 }, { keyword: "데이터", count: 0 }, { keyword: "React", count: 0 },
    { keyword: "API", count: 0 }, { keyword: "대시보드", count: 0 },
  ],
};

// 절감 시간 표본 × 관계사. GET /api/v1/platform-items?fields=expectedTimeSaved&company=:codes
const TIME_SAVED_BY_COMPANY: Record<StatCompany, string[]> = {
  KKM: ["주 3시간", "월 4시간", "주 1시간", "하루 30분", "월 8시간", "주 2시간", "연 40시간", "추정 불가"],
  KBH: ["주 1시간", "월 2시간", "주 5시간", "측정 어려움"],
  HC: ["월 6시간", "하루 1시간", "주 2시간"],
  KMG: ["월 3시간", "주 1시간", "미정"],
  KMW: ["주 2시간", "월 1시간"],
  KUS: ["월 2시간"],
  KBT: [""],
};

// 월 지정 드롭다운 옵션
const PICK_YEARS = [2025];
const PICK_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

// 인덱스 배열 기반 합산 (상태/스택/유형/난이도/비용)
const aggregateIndexed = (companies: StatCompany[], table: Record<StatCompany, number[]>, len: number): number[] =>
  Array.from({ length: len }, (_, i) => companies.reduce((s, co) => s + (table[co][i] ?? 0), 0));

// 부서 합산 (관계사별 부서명이 다르므로 합쳐서 상위 정렬)
const aggregateDept = (companies: StatCompany[]): { dept: string; count: number }[] => {
  const map = new Map<string, number>();
  companies.forEach(co => DEPT_BY_COMPANY[co].forEach(d => map.set(d.dept, (map.get(d.dept) ?? 0) + d.count)));
  return [...map.entries()].map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count).slice(0, 8);
};

// 키워드 합산
const aggregateKeyword = (companies: StatCompany[]): { keyword: string; count: number }[] => {
  const keys = KEYWORD_BY_COMPANY[STAT_COMPANIES[0]].map(k => k.keyword);
  return keys.map((keyword, i) => ({
    keyword,
    count: companies.reduce((s, co) => s + (KEYWORD_BY_COMPANY[co][i]?.count ?? 0), 0),
  })).sort((a, b) => b.count - a.count);
};

// 절감 시간 표본 합치기
const aggregateTimeSaved = (companies: StatCompany[]): string[] =>
  companies.flatMap(co => TIME_SAVED_BY_COMPANY[co]);

// 주기 표현 → 연간 환산 배수
const PERIOD_MULTIPLIER: Record<string, number> = {
  "일": 365, "하루": 365,
  "주": 52, "주일": 52,
  "월": 12, "개월": 12,
  "년": 1, "연": 1,
};

/**
 * 자유 텍스트 형태의 절감 시간 문자열을 연간 환산 시간(시간/년)으로 파싱한다.
 * 매칭 실패 시 null을 반환하며, 이 경우 "추정 불가" 건으로 별도 집계한다.
 * 지원 패턴 예시: "주 1시간", "월 4시간", "하루 30분", "연 100시간"
 */
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
  padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#0F172A", background: "#fff",
  border: "1.5px solid #E2E8F0", borderRadius: 6, outline: "none", fontFamily: "inherit", cursor: "pointer",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 800, color: "#64748B", letterSpacing: "0.04em",
  textTransform: "uppercase", margin: "8px 0 14px",
  display: "flex", alignItems: "center", gap: 8,
};

export default function AdminStatistics() {
  const { isGlobalAdmin, managedCompanies } = useAuth();
  const scope = isGlobalAdmin ? null : managedCompanies;

  const [periodMode, setPeriodMode] = useState<"preset" | "month">("preset");
  const [period, setPeriod] = useState<Period>("최근 6개월");
  const [pickYear, setPickYear] = useState(2025);
  const [pickMonth, setPickMonth] = useState(6);

  // 범위에 따라 모든 집계를 재계산 (공용 헬퍼 + 화면 고유 헬퍼 혼용)
  const agg = useMemo(() => {
    const companies = scopedCompanies(scope);
    const monthSeries = aggregateMonthly(companies);
    const sourceTotal = aggregateSourceTotal(companies);
    const domain = aggregateDomain(companies);
    const statusCounts = aggregateIndexed(companies, STATUS_BY_COMPANY, STATUS_META.length);
    const stackCounts = aggregateIndexed(companies, STACK_BY_COMPANY, STACK_META.length);
    const typeCounts = aggregateIndexed(companies, TYPE_BY_COMPANY, TYPE_META.length);
    const difficultyCounts = aggregateIndexed(companies, DIFFICULTY_BY_COMPANY, DIFFICULTY_META.length);
    const costCounts = aggregateIndexed(companies, COST_BY_COMPANY, COST_META.length);
    const dept = aggregateDept(companies);
    const keyword = aggregateKeyword(companies);
    const timeSamples = aggregateTimeSaved(companies);

    const status = STATUS_META.map((s, i) => ({ ...s, count: statusCounts[i] }));
    const stack = STACK_META.map((s, i) => ({ ...s, count: stackCounts[i] }));
    const type = TYPE_META.map((label, i) => ({ label, count: typeCounts[i] }));
    const difficulty = DIFFICULTY_META.map((d, i) => ({ ...d, count: difficultyCounts[i] }));
    const cost = COST_META.map((c, i) => ({ ...c, count: costCounts[i] }));

    const parsed = timeSamples.map(parseTimeSaved);
    const totalAnnualHoursSaved = parsed.reduce<number>((sum, v) => sum + (v ?? 0), 0);
    const unestimableCount = parsed.filter(v => v === null).length;
    const estimableCount = parsed.length - unestimableCount;

    return { companies, monthSeries, sourceTotal, domain, status, stack, type, difficulty, cost, dept, keyword,
      totalAnnualHoursSaved, unestimableCount, estimableCount };
  }, [scope]);

  const MONTH_SERIES = agg.monthSeries;
  const PRESET_MONTHS: Record<Period, MonthPoint[]> = {
    "이번 달": MONTH_SERIES.slice(-1),
    "최근 3개월": MONTH_SERIES.slice(-3),
    "최근 6개월": MONTH_SERIES.slice(-6),
    "올해 전체": MONTH_SERIES,
  };

  const totalRegistrations = agg.sourceTotal.project + agg.sourceTotal.n8n + agg.sourceTotal.assistant + agg.sourceTotal["ai-orchestration"];
  const platformTotal = agg.sourceTotal.n8n + agg.sourceTotal.assistant + agg.sourceTotal["ai-orchestration"];

  const totalProjects = agg.status.reduce((s, d) => s + d.count, 0) || 1;
  const totalDomain = agg.domain.reduce((s, d) => s + d.count, 0) || 1;
  const totalType = agg.type.reduce((s, d) => s + d.count, 0) || 1;
  const totalDifficulty = agg.difficulty.reduce((s, d) => s + d.count, 0) || 1;
  const totalCost = agg.cost.reduce((s, d) => s + d.count, 0) || 1;
  const maxStack = Math.max(...agg.stack.map(s => s.count), 1);
  const maxDept = Math.max(...agg.dept.map(d => d.count), 1);
  const maxKeyword = Math.max(...agg.keyword.map(k => k.count), 1);

  const monthly: MonthPoint[] = periodMode === "month"
    ? [MONTH_SERIES.find(s => s.key === `${pickYear}-${pad2(pickMonth)}`)
        ?? { key: `${pickYear}-${pad2(pickMonth)}`, m: `${pickMonth}월`, month: `${pickMonth}월`, project: 0, n8n: 0, assistant: 0, "ai-orchestration": 0 }]
    : PRESET_MONTHS[period];

  const maxMonthly = Math.max(...monthly.map(monthTotal), 1);
  const periodLabel = periodMode === "month" ? `${pickYear}.${pad2(pickMonth)}` : period;

  const sourceByPeriod = SOURCES.map(s => ({ ...s, count: monthly.reduce((acc, m) => acc + m[s.key], 0) }));
  const periodTotal = sourceByPeriod.reduce((a, b) => a + b.count, 0);

  const activeProjects = agg.status[0].count + agg.status[1].count + agg.status[2].count;

  const scopeBadge = scopeBadgeText(isGlobalAdmin, agg.companies);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>통계 대시보드</h1>
              <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>프로젝트와 플랫폼 항목(n8n · 나만의비서 · AI Agent)의 등록 현황을 통합 분석합니다.</p>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: 4 }}>
                {PERIODS.map(p => {
                  const active = periodMode === "preset" && period === p;
                  return (
                    <button key={p} onClick={() => { setPeriodMode("preset"); setPeriod(p); }} style={{
                      padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: active ? "#0F172A" : "transparent",
                      color: active ? "#fff" : "#64748B",
                    }}>{p}</button>
                  );
                })}
                <button onClick={() => setPeriodMode("month")} style={{
                  padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: periodMode === "month" ? "#0F172A" : "transparent",
                  color: periodMode === "month" ? "#fff" : "#64748B",
                }}>월 지정</button>
              </div>

              {periodMode === "month" && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "4px 6px" }}>
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

          {/* 집계 범위 배지 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20,
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
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "48px 24px", textAlign: "center", fontSize: 13, color: "#94A3B8" }}>
              담당 관계사가 지정되어 있지 않아 표시할 통계가 없습니다. 권한 설정에서 담당 관계사를 지정해주세요.
            </div>
          ) : (
            <>
              {/* 상단 4카드 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                  { label: "전체 등록물", value: totalRegistrations, sub: `프로젝트 ${agg.sourceTotal.project} · 플랫폼 ${platformTotal}`, color: "#0F172A" },
                  { label: "이번 달 신규", value: monthTotal(MONTH_SERIES[MONTH_SERIES.length - 1]), sub: `프로젝트 ${MONTH_SERIES[MONTH_SERIES.length - 1].project} · 플랫폼 ${MONTH_SERIES[MONTH_SERIES.length - 1].n8n + MONTH_SERIES[MONTH_SERIES.length - 1].assistant + MONTH_SERIES[MONTH_SERIES.length - 1]["ai-orchestration"]}`, color: "#2563EB" },
                  { label: "활성 프로젝트", value: activeProjects, sub: "운영 중 + 개발 중 + 파일럿", color: "#059669" },
                  { label: "참여 관계사", value: agg.companies.length, sub: isGlobalAdmin ? "전체 관계사" : "담당 관계사", color: "#7C3AED" },
                ].map((k, i) => (
                  <div key={i} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>{k.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: "-0.03em", marginBottom: 4 }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* 등록 추이 | 프로젝트 상태 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>등록 추이 <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 8 }}>{periodLabel}</span></div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {SOURCES.map(s => (
                        <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <div style={{ width: 9, height: 9, borderRadius: 2, background: s.color }} />
                          <span style={{ fontSize: 11, color: "#64748B" }}>{s.label}</span>
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
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{total}</div>
                          <div style={{ width: "100%", maxWidth: 64, height: h, borderRadius: "4px 4px 0 0", overflow: "hidden", display: "flex", flexDirection: "column-reverse", background: total === 0 ? "#F1F5F9" : "transparent" }}>
                            {total > 0 && SOURCES.map(s => {
                              const val = m[s.key];
                              if (!val) return null;
                              return <div key={s.key} title={`${s.label} ${val}건`} style={{ height: `${(val / total) * 100}%`, background: s.color }} />;
                            })}
                          </div>
                          <div style={{ fontSize: 11, color: "#94A3B8" }}>{m.m}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>프로젝트 상태</div>
                  <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16, background: "#F1F5F9" }}>
                    {agg.status.map((s, i) => s.count > 0 && <div key={i} title={`${s.label}: ${s.count}건`} style={{ flex: s.count, background: s.color }} />)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {agg.status.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>{s.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{s.count}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", width: 32, textAlign: "right" }}>{Math.round(s.count / totalProjects * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 출처별 등록 현황 */}
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>출처별 등록 현황 <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 8 }}>{periodLabel} 기준 · 총 {periodTotal}건</span></div>
                </div>
                <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16, background: "#F1F5F9" }}>
                  {sourceByPeriod.map(s => s.count > 0 && <div key={s.key} title={`${s.label}: ${s.count}건`} style={{ flex: s.count, background: s.color }} />)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {sourceByPeriod.map(s => {
                    const pct = periodTotal > 0 ? Math.round(s.count / periodTotal * 100) : 0;
                    return (
                      <div key={s.key} style={{ border: "1px solid #F1F5F9", borderRadius: 8, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{s.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          <span style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{s.count}</span>
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>건 · {pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 프로젝트 분석 섹션 */}
              <div style={sectionLabelStyle}>
                <span style={{ width: 4, height: 14, borderRadius: 2, background: "#2563EB" }} />프로젝트 분석
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>비즈니스 도메인 분포</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {agg.domain.map((d, i) => {
                      const pct = Math.round(d.count / totalDomain * 100);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 12, color: "#475569", width: 80, flexShrink: 0 }}>{d.label}</span>
                          <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 7, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "#2563EB", borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#94A3B8", width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>시스템 유형 분포</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {agg.type.map((t, i) => {
                      const pct = Math.round(t.count / totalType * 100);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 12, color: "#475569", width: 110, flexShrink: 0 }}>{t.label}</span>
                          <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 7, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "#7C3AED", borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#94A3B8", width: 28, textAlign: "right", flexShrink: 0 }}>{t.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>기술 스택 TOP 8</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {agg.stack.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", width: 80, flexShrink: 0 }}>{s.label}</span>
                        <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 7, overflow: "hidden" }}>
                          <div style={{ width: `${(s.count / maxStack) * 100}%`, height: "100%", background: s.color, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#94A3B8", width: 28, textAlign: "right", flexShrink: 0 }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>부서별 프로젝트 현황</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {agg.dept.map((d, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 12, color: "#475569", width: 100, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.dept}</span>
                        <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 7, overflow: "hidden" }}>
                          <div style={{ width: `${(d.count / maxDept) * 100}%`, height: "100%", background: "#059669", borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#94A3B8", width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
                      </div>
                    ))}
                    {agg.dept.length === 0 && (
                      <div style={{ fontSize: 12, color: "#94A3B8", padding: "8px 0" }}>해당 범위의 부서 데이터가 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 플랫폼 항목 분석 섹션 */}
              <div style={sectionLabelStyle}>
                <span style={{ width: 4, height: 14, borderRadius: 2, background: "#DB2777" }} />플랫폼 항목 분석
                <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8", textTransform: "none", letterSpacing: 0 }}>n8n · 나만의비서 · AI Agent 기준 (총 {platformTotal}건)</span>
              </div>

              {/* 절감 효과 요약 */}
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                    절감 효과 요약
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 8 }}>
                      n8n · 나만의비서 등록 항목의 예상 절감 시간 기준 (자유 입력 텍스트 정규화 집계)
                    </span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <div style={{ border: "1px solid #F1F5F9", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>전사 예상 절감 시간 (연간 환산)</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: "#059669", letterSpacing: "-0.02em" }}>
                        {Math.round(agg.totalAnnualHoursSaved).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>시간 / 년</span>
                    </div>
                  </div>
                  <div style={{ border: "1px solid #F1F5F9", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>집계 가능 항목 수</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{agg.estimableCount}</span>
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>건</span>
                    </div>
                  </div>
                  <div style={{ border: "1px solid #F1F5F9", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>추정 불가 항목 수</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: "#D97706", letterSpacing: "-0.02em" }}>{agg.unestimableCount}</span>
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>건 · 입력값 표준화 필요</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>난이도 분포</div>
                  <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16, background: "#F1F5F9" }}>
                    {agg.difficulty.map((d, i) => d.count > 0 && <div key={i} title={`${d.label}: ${d.count}건`} style={{ flex: d.count, background: d.color }} />)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {agg.difficulty.map((d, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>{d.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{d.count}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", width: 32, textAlign: "right" }}>{Math.round(d.count / totalDifficulty * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>비용 구간 분포</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {agg.cost.map((c, i) => {
                      const pct = Math.round(c.count / totalCost * 100);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 12, color: "#475569", width: 70, flexShrink: 0 }}>{c.label}</span>
                          <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 7, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#94A3B8", width: 44, textAlign: "right", flexShrink: 0 }}>{c.count} · {pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 탐색 키워드 빈도 */}
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 24px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>탐색 키워드 빈도 <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginLeft: 8 }}>사용자가 검색한 상위 키워드</span></div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 100 }}>
                  {agg.keyword.map((k, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>{k.count}</div>
                      <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: `hsl(${220 + i * 12}, 70%, ${55 + i * 3}%)`, height: `${(k.count / maxKeyword) * 76}px` }} />
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textAlign: "center" }}>{k.keyword}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}