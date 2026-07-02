// ============================================================
// 통계·대시보드 공용 mock 데이터 (DEMO 전용)
// ------------------------------------------------------------
// AdminStatistics.tsx / AdminDashboard.tsx가 공유하는 관계사 차원 더미와
// 범위 집계 헬퍼. 두 화면의 숫자 정합성(동일 관계사의 SOURCE_TOTAL 등)을
// 한 곳에서 관리하기 위해 추출.
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//    실제로는 GET /api/v1/admin/stats/*?company=:codes 형태로 서버가
//    관계사 범위로 필터링한 집계를 응답한다(화면 단 합산 불필요).
//
// 화면 고유 데이터(AdminStatistics의 상태·스택·부서·난이도·비용·키워드·
// 절감시간, AdminDashboard의 PENDING·RECENT_APPROVED·ACTIVE_TOOLS)는
// 공용화하지 않고 각 화면 파일에 그대로 둔다.
// ============================================================

import type { PlatformId } from "../types/platformTypes";

// 출처 키 — platformTypes와 정합한 정식 표기 사용
export type SourceKey = "project" | PlatformId; // "project" | "n8n" | "assistant" | "ai-orchestration"

// 월별 포인트 — 두 화면이 각기 쓰던 키를 모두 제공(key/m/month)
export type MonthPoint = {
  key: string;   // "2025-06"
  m: string;     // "6월" (AdminStatistics 표기)
  month: string; // "6월" (AdminDashboard 표기, m과 동일값)
  project: number;
  n8n: number;
  assistant: number;
  "ai-orchestration": number;
};

// 더미 기준 관계사 코드 (visible 관계사 일부). 데모 계정의 managedCompanies와 매칭.
export const STAT_COMPANIES = ["KKM", "KBH", "HC", "KMG", "KMW", "KUS", "KBT"] as const;
export type StatCompany = typeof STAT_COMPANIES[number];

// 관계사 코드 → 표시명 (배지·범례용)
export const COMPANY_NAME: Record<string, string> = {
  KKM: "한국콜마", KBH: "콜마비앤에이치", HC: "콜마생활건강", KMG: "콜마글로벌",
  KMW: "무석콜마", KUS: "미국콜마", KBT: "콜마바이오텍",
};

// 월 라벨 도우미
const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월"];
const MONTH_KEYS = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06"];

// 관계사별 월 × 출처 raw 수치 (순서: project, n8n, assistant, ai-orchestration)
// TODO: 백엔드 연동 시 폐기. GET /api/v1/admin/stats/monthly-by-source?company=:codes
const MONTHLY_RAW: Record<StatCompany, [number, number, number, number][]> = {
  KKM: [
    [2, 1, 0, 0], [2, 1, 1, 0], [2, 0, 1, 0], [3, 1, 1, 1], [3, 2, 1, 1], [2, 2, 1, 1],
  ],
  KBH: [
    [1, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0], [1, 1, 0, 1], [1, 1, 1, 0],
  ],
  HC: [
    [1, 0, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0], [1, 0, 1, 0], [1, 0, 0, 0], [1, 1, 0, 1],
  ],
  KMG: [
    [0, 0, 1, 0], [1, 0, 0, 1], [1, 0, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [1, 1, 0, 0],
  ],
  KMW: [
    [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0],
  ],
  KUS: [
    [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
  ],
  KBT: [
    [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0], [0, 0, 0, 0],
  ],
};

// raw → MonthPoint[] 변환 (key/m/month 동시 제공)
export const MONTH_SERIES_BY_COMPANY: Record<StatCompany, MonthPoint[]> = Object.fromEntries(
  STAT_COMPANIES.map(co => [
    co,
    MONTHLY_RAW[co].map((row, i) => ({
      key: MONTH_KEYS[i], m: MONTH_LABELS[i], month: MONTH_LABELS[i],
      project: row[0], n8n: row[1], assistant: row[2], "ai-orchestration": row[3],
    })),
  ])
) as Record<StatCompany, MonthPoint[]>;

// 누적 출처별 × 관계사. TODO: 백엔드 연동 시 폐기. GET /api/v1/admin/stats/source-total?company=:codes
export const SOURCE_TOTAL_BY_COMPANY: Record<StatCompany, Record<SourceKey, number>> = {
  KKM: { project: 58, n8n: 18, assistant: 13, "ai-orchestration": 9 },
  KBH: { project: 21, n8n: 7, assistant: 4, "ai-orchestration": 3 },
  HC: { project: 16, n8n: 5, assistant: 3, "ai-orchestration": 2 },
  KMG: { project: 14, n8n: 4, assistant: 4, "ai-orchestration": 3 },
  KMW: { project: 8, n8n: 2, assistant: 2, "ai-orchestration": 1 },
  KUS: { project: 4, n8n: 1, assistant: 1, "ai-orchestration": 0 },
  KBT: { project: 3, n8n: 1, assistant: 0, "ai-orchestration": 1 },
};

// 도메인 라벨(고정 순서) + 관계사별 수치. TODO: 백엔드 연동 시 폐기. GET /api/v1/admin/stats/domain?company=:codes
export const DOMAIN_LABELS = ["제조/생산", "IT 인프라", "재무/회계", "데이터/분석", "HR/인사", "마케팅", "영업/CRM", "기타"];
export const DOMAIN_BY_COMPANY: Record<StatCompany, number[]> = {
  // 순서: DOMAIN_LABELS
  KKM: [12, 11, 9, 8, 6, 5, 5, 4],
  KBH: [5, 4, 3, 3, 2, 2, 2, 1],
  HC: [4, 3, 2, 2, 2, 2, 1, 1],
  KMG: [3, 2, 2, 1, 1, 1, 1, 1],
  KMW: [3, 1, 1, 1, 1, 0, 1, 0],
  KUS: [1, 1, 1, 0, 0, 1, 0, 1],
  KBT: [0, 0, 0, 0, 0, 0, 0, 0],
};

// ============================================================
// 범위 기반 집계 헬퍼
// scope === null → 전사(global, 전체 관계사 합산)
// scope === string[] → 해당 관계사 코드만 합산
// ============================================================

export const scopedCompanies = (scope: string[] | null): StatCompany[] =>
  scope === null ? [...STAT_COMPANIES] : STAT_COMPANIES.filter(c => scope.includes(c));

export const aggregateMonthly = (companies: StatCompany[]): MonthPoint[] => {
  const base: MonthPoint[] = MONTH_KEYS.map((key, i) => ({
    key, m: MONTH_LABELS[i], month: MONTH_LABELS[i],
    project: 0, n8n: 0, assistant: 0, "ai-orchestration": 0,
  }));
  companies.forEach(co => {
    MONTH_SERIES_BY_COMPANY[co].forEach((p, idx) => {
      base[idx].project += p.project;
      base[idx].n8n += p.n8n;
      base[idx].assistant += p.assistant;
      base[idx]["ai-orchestration"] += p["ai-orchestration"];
    });
  });
  return base;
};

export const aggregateSourceTotal = (companies: StatCompany[]): Record<SourceKey, number> => {
  const acc: Record<SourceKey, number> = { project: 0, n8n: 0, assistant: 0, "ai-orchestration": 0 };
  companies.forEach(co => (Object.keys(acc) as SourceKey[]).forEach(k => { acc[k] += SOURCE_TOTAL_BY_COMPANY[co][k]; }));
  return acc;
};

export const aggregateDomain = (companies: StatCompany[]): { label: string; count: number }[] =>
  DOMAIN_LABELS.map((label, i) => ({
    label,
    count: companies.reduce((s, co) => s + (DOMAIN_BY_COMPANY[co][i] ?? 0), 0),
  }));

// 월 합계
export const monthTotal = (m: MonthPoint) => m.project + m.n8n + m.assistant + m["ai-orchestration"];

// 집계 범위 배지 문구 (전사 / 담당 관계사 N곳: 이름...)
export const scopeBadgeText = (isGlobalAdmin: boolean, companies: StatCompany[]): string => {
  if (isGlobalAdmin) return "전사 기준 (전체 관계사)";
  if (companies.length === 0) return "담당 관계사 없음";
  const names = companies.map(c => COMPANY_NAME[c] ?? c);
  const head = names.slice(0, 3).join(", ");
  return `담당 관계사 ${companies.length}곳: ${head}${names.length > 3 ? ` 외 ${names.length - 3}곳` : ""}`;
};

