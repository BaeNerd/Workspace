// ============================================================
// 통계·대시보드 공용 mock 데이터 (DEMO 전용)
// ------------------------------------------------------------
// AdminStatistics.tsx / AdminDashboard.tsx가 공유하는 관계사 차원 더미와
// 범위 집계 헬퍼. 두 화면의 숫자 정합성을 한 곳에서 관리하기 위해 추출.
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//
// 화면 고유 데이터(AdminStatistics의 상태·스택·부서·난이도·비용·키워드·
// 절감시간, AdminDashboard의 PENDING·RECENT_APPROVED·ACTIVE_TOOLS)는
// 공용화하지 않고 각 화면 파일에 그대로 둔다.
// ============================================================

import type { PlatformId } from "../types/platformTypes";

// 출처 키 = 6개 플랫폼 타입 그대로
export type SourceKey = PlatformId;

// 월별 포인트 — 두 화면이 각기 쓰던 키를 모두 제공(key/m/month)
export type MonthPoint = {
  key: string;               // "2025-06"
  m: string;                 // "6월" (AdminStatistics 표기)
  month: string;             // "6월" (AdminDashboard 표기, m과 동일값)
  n8n: number;
  pa: number;
  assistant: number;
  "ai-orchestration": number;
  ml: number;
  vibe: number;
};

// 더미 기준 관계사 코드 (visible 관계사 일부).
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

// 관계사별 월 × 출처 raw 수치 (순서: n8n, pa, assistant, ai-orchestration, ml, vibe)
// TODO: 백엔드 연동 시 폐기. GET /api/v1/admin/stats/monthly-by-source?company=:codes
const MONTHLY_RAW: Record<StatCompany, [number, number, number, number, number, number][]> = {
  KKM: [
    [1, 0, 0, 0, 0, 0], [1, 1, 1, 0, 0, 0], [0, 1, 1, 0, 0, 0], [1, 1, 1, 1, 0, 0], [2, 1, 1, 1, 1, 0], [2, 1, 1, 1, 1, 1],
  ],
  KBH: [
    [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0], [1, 1, 0, 0, 0, 0], [1, 1, 0, 1, 0, 0], [1, 1, 1, 0, 0, 0],
  ],
  HC: [
    [0, 0, 0, 0, 0, 0], [1, 1, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0], [1, 1, 0, 1, 0, 0],
  ],
  KMG: [
    [0, 0, 1, 0, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0], [1, 1, 0, 0, 0, 0], [1, 1, 1, 0, 0, 0], [1, 1, 0, 0, 1, 0],
  ],
  KMW: [
    [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0], [0, 0, 1, 0, 0, 0],
  ],
  KUS: [
    [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0],
  ],
  KBT: [
    [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0], [1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0],
  ],
};

// raw → MonthPoint[] 변환 (key/m/month 동시 제공)
export const MONTH_SERIES_BY_COMPANY: Record<StatCompany, MonthPoint[]> = Object.fromEntries(
  STAT_COMPANIES.map(co => [
    co,
    MONTHLY_RAW[co].map((row, i) => ({
      key: MONTH_KEYS[i], m: MONTH_LABELS[i], month: MONTH_LABELS[i],
      n8n: row[0], pa: row[1], assistant: row[2], "ai-orchestration": row[3], ml: row[4], vibe: row[5],
    })),
  ])
) as Record<StatCompany, MonthPoint[]>;

// 누적 출처별 × 관계사. TODO: 백엔드 연동 시 폐기.
export const SOURCE_TOTAL_BY_COMPANY: Record<StatCompany, Record<SourceKey, number>> = {
  KKM: { n8n: 18, pa: 12, assistant: 13, "ai-orchestration": 9, ml: 4, vibe: 2 },
  KBH: { n8n: 7, pa: 5, assistant: 4, "ai-orchestration": 3, ml: 1, vibe: 0 },
  HC: { n8n: 5, pa: 4, assistant: 3, "ai-orchestration": 2, ml: 0, vibe: 0 },
  KMG: { n8n: 4, pa: 3, assistant: 4, "ai-orchestration": 3, ml: 2, vibe: 1 },
  KMW: { n8n: 2, pa: 1, assistant: 2, "ai-orchestration": 1, ml: 1, vibe: 0 },
  KUS: { n8n: 1, pa: 0, assistant: 1, "ai-orchestration": 0, ml: 0, vibe: 0 },
  KBT: { n8n: 1, pa: 0, assistant: 0, "ai-orchestration": 1, ml: 0, vibe: 0 },
};

// 도메인 라벨(고정 순서) + 관계사별 수치. TODO: 백엔드 연동 시 폐기.
export const DOMAIN_LABELS = ["제조/생산", "IT 인프라", "재무/회계", "데이터/분석", "HR/인사", "마케팅", "영업/CRM", "기타"];
export const DOMAIN_BY_COMPANY: Record<StatCompany, number[]> = {
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
// scope === null → 전사(전체 관계사 합산)
// scope === string[] → 해당 관계사 코드만 합산
// ============================================================

export const scopedCompanies = (scope: string[] | null): StatCompany[] =>
  scope === null ? [...STAT_COMPANIES] : STAT_COMPANIES.filter(c => scope.includes(c));

export const aggregateMonthly = (companies: StatCompany[]): MonthPoint[] => {
  const base: MonthPoint[] = MONTH_KEYS.map((key, i) => ({
    key, m: MONTH_LABELS[i], month: MONTH_LABELS[i],
    n8n: 0, pa: 0, assistant: 0, "ai-orchestration": 0, ml: 0, vibe: 0,
  }));
  companies.forEach(co => {
    MONTH_SERIES_BY_COMPANY[co].forEach((p, idx) => {
      base[idx].n8n += p.n8n;
      base[idx].pa += p.pa;
      base[idx].assistant += p.assistant;
      base[idx]["ai-orchestration"] += p["ai-orchestration"];
      base[idx].ml += p.ml;
      base[idx].vibe += p.vibe;
    });
  });
  return base;
};

export const aggregateSourceTotal = (companies: StatCompany[]): Record<SourceKey, number> => {
  const acc: Record<SourceKey, number> = { n8n: 0, pa: 0, assistant: 0, "ai-orchestration": 0, ml: 0, vibe: 0 };
  companies.forEach(co => (Object.keys(acc) as SourceKey[]).forEach(k => { acc[k] += SOURCE_TOTAL_BY_COMPANY[co][k]; }));
  return acc;
};

export const aggregateDomain = (companies: StatCompany[]): { label: string; count: number }[] =>
  DOMAIN_LABELS.map((label, i) => ({
    label,
    count: companies.reduce((s, co) => s + (DOMAIN_BY_COMPANY[co][i] ?? 0), 0),
  }));

// 월 합계
export const monthTotal = (m: MonthPoint) =>
  m.n8n + m.pa + m.assistant + m["ai-orchestration"] + m.ml + m.vibe;
