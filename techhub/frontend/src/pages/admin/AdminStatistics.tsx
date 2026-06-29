import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";

const PERIODS = ["이번 달", "최근 3개월", "최근 6개월", "올해 전체"] as const;
type Period = typeof PERIODS[number];

type SourceKey = "project" | "n8n" | "assistant" | "agent";
type MonthPoint = { key: string; m: string; project: number; n8n: number; assistant: number; agent: number };

const pad2 = (n: number) => String(n).padStart(2, "0");
const ptTotal = (p: MonthPoint) => p.project + p.n8n + p.assistant + p.agent;

// 출처 정의 (단일 소스). TODO: platformTypes.ts의 PLATFORMS 출처/색상과 일치시켜 통합 관리 권장.
const SOURCES: { key: SourceKey; label: string; color: string }[] = [
  { key: "project", label: "프로젝트", color: "#2563EB" },
  { key: "n8n", label: "n8n", color: "#DB2777" },
  { key: "assistant", label: "나만의비서", color: "#059669" },
  { key: "agent", label: "AI Agent", color: "#7C3AED" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/monthly-by-source 응답으로 교체 (월별 × 출처별 등록 수)
const MONTH_SERIES: MonthPoint[] = [
  { key: "2025-01", m: "1월", project: 4, n8n: 1, assistant: 1, agent: 0 },
  { key: "2025-02", m: "2월", project: 5, n8n: 2, assistant: 1, agent: 1 },
  { key: "2025-03", m: "3월", project: 4, n8n: 1, assistant: 2, agent: 0 },
  { key: "2025-04", m: "4월", project: 6, n8n: 3, assistant: 2, agent: 1 },
  { key: "2025-05", m: "5월", project: 7, n8n: 4, assistant: 2, agent: 2 },
  { key: "2025-06", m: "6월", project: 5, n8n: 5, assistant: 3, agent: 2 },
];

const PRESET_MONTHS: Record<Period, MonthPoint[]> = {
  "이번 달": MONTH_SERIES.slice(-1),
  "최근 3개월": MONTH_SERIES.slice(-3),
  "최근 6개월": MONTH_SERIES.slice(-6),
  "올해 전체": MONTH_SERIES,
};

// 월 지정 드롭다운 옵션
const PICK_YEARS = [2025];
const PICK_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

// TODO: 실제 연동 시 GET /api/v1/admin/stats/source-total 응답으로 교체 (누적 출처별 등록 수)
const SOURCE_TOTAL: Record<SourceKey, number> = { project: 124, n8n: 38, assistant: 27, agent: 19 };
const totalRegistrations = SOURCE_TOTAL.project + SOURCE_TOTAL.n8n + SOURCE_TOTAL.assistant + SOURCE_TOTAL.agent;
const platformTotal = SOURCE_TOTAL.n8n + SOURCE_TOTAL.assistant + SOURCE_TOTAL.agent;

// TODO: 실제 연동 시 GET /api/v1/admin/stats/domain 응답으로 교체
const DOMAIN_DATA = [
  { label: "제조/생산", count: 28 }, { label: "IT 인프라", count: 22 }, { label: "재무/회계", count: 18 },
  { label: "데이터/분석", count: 15 }, { label: "HR/인사", count: 12 }, { label: "마케팅", count: 11 },
  { label: "영업/CRM", count: 10 }, { label: "기타", count: 8 },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/status 응답으로 교체 (프로젝트 기준)
const STATUS_DATA = [
  { label: "운영 중", count: 54, color: "#059669" }, { label: "개발 중", count: 41, color: "#2563EB" },
  { label: "파일럿", count: 18, color: "#D97706" }, { label: "보류", count: 7, color: "#EF4444" },
  { label: "종료", count: 4, color: "#475569" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/stack 응답으로 교체
const STACK_DATA = [
  { label: "Python", count: 38, color: "#2563EB" }, { label: "React", count: 27, color: "#7C3AED" },
  { label: "AWS", count: 24, color: "#D97706" }, { label: "TypeScript", count: 19, color: "#059669" },
  { label: "PostgreSQL", count: 17, color: "#0891B2" }, { label: "Docker", count: 14, color: "#475569" },
  { label: "FastAPI", count: 11, color: "#DB2777" }, { label: "Kubernetes", count: 8, color: "#EA580C" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/department 응답으로 교체
const DEPT_DATA = [
  { dept: "IT개발팀", count: 14 }, { dept: "메이크업연구소", count: 8 }, { dept: "IT인프라팀", count: 6 },
  { dept: "재무팀", count: 5 }, { dept: "제조기술팀", count: 5 }, { dept: "마케팅팀", count: 5 },
  { dept: "품질관리팀", count: 4 }, { dept: "영업팀", count: 3 },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/system-type 응답으로 교체
const TYPE_DATA = [
  { label: "웹 애플리케이션", count: 38 }, { label: "데이터 파이프라인", count: 22 },
  { label: "ML/AI 모델", count: 20 }, { label: "API/서비스", count: 18 },
  { label: "내부 플랫폼", count: 12 }, { label: "내부 도구", count: 10 }, { label: "기타", count: 4 },
];

// 플랫폼 항목(n8n+나만의비서+AI Agent, 합계 84) 기준 난이도 분포
// TODO: 라벨/구간은 AdminTaxonomy의 실제 difficulty tier 정의와 일치시킬 것. GET /api/v1/admin/stats/platform-difficulty
const DIFFICULTY_DATA = [
  { label: "입문", count: 31, color: "#059669" },
  { label: "중급", count: 38, color: "#2563EB" },
  { label: "고급", count: 15, color: "#7C3AED" },
];

// 플랫폼 항목 비용 구간 분포 (합계 84)
// TODO: 라벨/구간은 AdminTaxonomy의 실제 cost tier 정의와 일치시킬 것. GET /api/v1/admin/stats/platform-cost
const COST_DATA = [
  { label: "무료", count: 44, color: "#059669" },
  { label: "저비용", count: 22, color: "#2563EB" },
  { label: "중비용", count: 13, color: "#D97706" },
  { label: "고비용", count: 5, color: "#EF4444" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/search-keywords 응답으로 교체
const SEARCH_KEYWORDS = [
  { keyword: "Python", count: 42 }, { keyword: "ML", count: 35 }, { keyword: "자동화", count: 28 },
  { keyword: "AWS", count: 24 }, { keyword: "데이터", count: 22 }, { keyword: "React", count: 19 },
  { keyword: "API", count: 17 }, { keyword: "대시보드", count: 14 },
];

// ============================================================
// ★ 신규 — 예상 절감 시간(expectedTimeSaved) 정규화 유틸
// STRUCTURE.md "예상 절감 시간 정규화 규칙" 참조.
// 원본 PlatformItem.expectedTimeSaved 필드는 변경하지 않고,
// 통계 화면에서만 파싱하여 연간 환산 시간(시간/년)으로 집계한다.
// 백엔드 연동 시 이 로직은 서버 사이드(API 응답 생성 시점)로 이전 권장.
// ============================================================

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

  // "주기 + 숫자 + 시간" 또는 "주기 + 숫자 + 분" 패턴
  const hourMatch = text.match(/(일|하루|주일|주|월|개월|년|연)\s*(\d+(?:\.\d+)?)\s*시간/);
  const minMatch = text.match(/(일|하루|주일|주|월|개월|년|연)\s*(\d+(?:\.\d+)?)\s*분/);

  if (hourMatch) {
    const periodKey = hourMatch[1];
    const value = parseFloat(hourMatch[2]);
    const mult = PERIOD_MULTIPLIER[periodKey];
    if (mult && !isNaN(value)) return value * mult;
  }
  if (minMatch) {
    const periodKey = minMatch[1];
    const value = parseFloat(minMatch[2]);
    const mult = PERIOD_MULTIPLIER[periodKey];
    if (mult && !isNaN(value)) return (value / 60) * mult;
  }

  return null;
}

// TODO: 실제 연동 시 GET /api/v1/platform-items?fields=expectedTimeSaved 응답(n8n·나만의비서 전체 84건 중 자동화형)으로 교체.
// 여기서는 AdminStatistics 단독 검증을 위해 대표 표본만 mock으로 둔다.
const EXPECTED_TIME_SAVED_SAMPLES: string[] = [
  "주 3시간", "월 4시간", "주 1시간", "하루 30분", "월 8시간", "주 2시간",
  "연 40시간", "주 1시간", "월 2시간", "측정 어려움", "미정", "",
  "주 5시간", "월 6시간", "하루 1시간", "주 2시간", "월 3시간", "추정 불가",
];

const timeSavedParsed = EXPECTED_TIME_SAVED_SAMPLES.map(parseTimeSaved);
const totalAnnualHoursSaved = timeSavedParsed.reduce<number>((sum, v) => sum + (v ?? 0), 0);
const unestimableCount = timeSavedParsed.filter(v => v === null).length;
const estimableCount = timeSavedParsed.length - unestimableCount;

const totalProjects = STATUS_DATA.reduce((s, d) => s + d.count, 0);
const totalDomain = DOMAIN_DATA.reduce((s, d) => s + d.count, 0);
const totalType = TYPE_DATA.reduce((s, d) => s + d.count, 0);
const totalDifficulty = DIFFICULTY_DATA.reduce((s, d) => s + d.count, 0);
const totalCost = COST_DATA.reduce((s, d) => s + d.count, 0);
const maxStack = Math.max(...STACK_DATA.map(s => s.count));
const maxDept = Math.max(...DEPT_DATA.map(d => d.count));
const maxKeyword = Math.max(...SEARCH_KEYWORDS.map(k => k.count));

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
  const [periodMode, setPeriodMode] = useState<"preset" | "month">("preset");
  const [period, setPeriod] = useState<Period>("최근 6개월");
  const [pickYear, setPickYear] = useState(2025);
  const [pickMonth, setPickMonth] = useState(6);

  const monthly: MonthPoint[] = periodMode === "month"
    ? [MONTH_SERIES.find(s => s.key === `${pickYear}-${pad2(pickMonth)}`)
        ?? { key: `${pickYear}-${pad2(pickMonth)}`, m: `${pickMonth}월`, project: 0, n8n: 0, assistant: 0, agent: 0 }]
    : PRESET_MONTHS[period];

  const maxMonthly = Math.max(...monthly.map(ptTotal), 1);
  const periodLabel = periodMode === "month" ? `${pickYear}.${pad2(pickMonth)}` : period;

  // 출처별 등록 현황 (선택 기간 기준)
  const sourceByPeriod = SOURCES.map(s => ({ ...s, count: monthly.reduce((acc, m) => acc + m[s.key], 0) }));
  const periodTotal = sourceByPeriod.reduce((a, b) => a + b.count, 0);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
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

          {/* ===== 상단 4카드 (출처 인지형) ===== */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "전체 등록물", value: totalRegistrations, sub: `프로젝트 ${SOURCE_TOTAL.project} · 플랫폼 ${platformTotal}`, color: "#0F172A" },
              { label: "이번 달 신규", value: ptTotal(MONTH_SERIES[MONTH_SERIES.length - 1]), sub: `프로젝트 ${MONTH_SERIES[MONTH_SERIES.length - 1].project} · 플랫폼 ${MONTH_SERIES[MONTH_SERIES.length - 1].n8n + MONTH_SERIES[MONTH_SERIES.length - 1].assistant + MONTH_SERIES[MONTH_SERIES.length - 1].agent}`, color: "#2563EB" },
              { label: "활성 프로젝트", value: 54 + 41 + 18, sub: "운영 중 + 개발 중 + 파일럿", color: "#059669" },
              { label: "참여 부서", value: 38, sub: "전체 부서 82%", color: "#7C3AED" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: "-0.03em", marginBottom: 4 }}>{k.value}</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ===== 등록 추이(출처별 누적) | 프로젝트 상태 ===== */}
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
                  const total = ptTotal(m);
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
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16 }}>
                {STATUS_DATA.map((s, i) => <div key={i} title={`${s.label}: ${s.count}건`} style={{ flex: s.count, background: s.color }} />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {STATUS_DATA.map((s, i) => (
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

          {/* ===== 출처별 등록 현황 (선택 기간 기준, 최우선) ===== */}
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

          {/* ===== 프로젝트 분석 섹션 ===== */}
          <div style={sectionLabelStyle}>
            <span style={{ width: 4, height: 14, borderRadius: 2, background: "#2563EB" }} />프로젝트 분석
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>비즈니스 도메인 분포</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {DOMAIN_DATA.map((d, i) => {
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
                {TYPE_DATA.map((t, i) => {
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
                {STACK_DATA.map((s, i) => (
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
                {DEPT_DATA.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: "#475569", width: 100, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.dept}</span>
                    <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 7, overflow: "hidden" }}>
                      <div style={{ width: `${(d.count / maxDept) * 100}%`, height: "100%", background: "#059669", borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#94A3B8", width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== 플랫폼 항목 분석 섹션 ===== */}
          <div style={sectionLabelStyle}>
            <span style={{ width: 4, height: 14, borderRadius: 2, background: "#DB2777" }} />플랫폼 항목 분석
            <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8", textTransform: "none", letterSpacing: 0 }}>n8n · 나만의비서 · AI Agent 기준 (총 {platformTotal}건)</span>
          </div>

          {/* ===== ★ 신규 — 절감 효과 요약 (SKT AXMS 사례 참고: 정량 성과 가시화) ===== */}
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
                    {totalAnnualHoursSaved.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>시간 / 년</span>
                </div>
              </div>
              <div style={{ border: "1px solid #F1F5F9", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>집계 가능 항목 수</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{estimableCount}</span>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>건</span>
                </div>
              </div>
              <div style={{ border: "1px solid #F1F5F9", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>추정 불가 항목 수</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#D97706", letterSpacing: "-0.02em" }}>{unestimableCount}</span>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>건 · 입력값 표준화 필요</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>난이도 분포</div>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16 }}>
                {DIFFICULTY_DATA.map((d, i) => <div key={i} title={`${d.label}: ${d.count}건`} style={{ flex: d.count, background: d.color }} />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DIFFICULTY_DATA.map((d, i) => (
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
                {COST_DATA.map((c, i) => {
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

          {/* ===== 탐색 키워드 빈도 ===== */}
          <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>탐색 키워드 빈도 <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginLeft: 8 }}>사용자가 검색한 상위 키워드</span></div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 100 }}>
              {SEARCH_KEYWORDS.map((k, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>{k.count}</div>
                  <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: `hsl(${220 + i * 12}, 70%, ${55 + i * 3}%)`, height: `${(k.count / maxKeyword) * 76}px` }} />
                  <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textAlign: "center" }}>{k.keyword}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}