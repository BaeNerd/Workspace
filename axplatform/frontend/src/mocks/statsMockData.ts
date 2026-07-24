// ============================================================
// 통계·대시보드 공용 mock 데이터 (DEMO 전용)
// ------------------------------------------------------------
// AdminStatistics.tsx / AdminDashboard.tsx가 공유하는 관계사 차원 더미와
// 범위 집계 헬퍼. 두 화면의 숫자 정합성을 한 곳에서 관리하기 위해 추출.
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//
// [M2 방침 변경] AdminStatistics의 화면 고유 통계(부서·난이도·비용·ML유형·
// 키워드·절감시간·후기 TOP5)도 이 통계 SSOT에 합류했다. 소비 화면은
// mocks를 직접 import하지 않고 dataSource(getStatsByScope)가 범위 집계 후 공급한다.
// (AdminDashboard의 화면 고유 데이터 PENDING·RECENT_APPROVED·ACTIVE_TOOLS는
// 별도 모듈 adminDashboardMockData.ts로 분리, dataSource(getDashboardData)가 합성.)
// ============================================================

import type { CategoryId } from "../types/categoryTypes";

// 출처 키 = 7개 플랫폼 타입 그대로 (etc 포함, 운영 상태 필드 없음)
export type SourceKey = CategoryId;

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
  etc: number; // AI 프로젝트 카테고리(내부 키 etc) — 더미 데이터 없음 → 항상 0, 중립
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
      n8n: row[0], pa: row[1], assistant: row[2], "ai-orchestration": row[3], ml: row[4], vibe: row[5], etc: 0,
    })),
  ])
) as Record<StatCompany, MonthPoint[]>;

// 누적 출처별 × 관계사. TODO: 백엔드 연동 시 폐기.
export const SOURCE_TOTAL_BY_COMPANY: Record<StatCompany, Record<SourceKey, number>> = {
  KKM: { n8n: 18, pa: 12, assistant: 13, "ai-orchestration": 9, ml: 4, vibe: 2, etc: 0 },
  KBH: { n8n: 7, pa: 5, assistant: 4, "ai-orchestration": 3, ml: 1, vibe: 0, etc: 0 },
  HC: { n8n: 5, pa: 4, assistant: 3, "ai-orchestration": 2, ml: 0, vibe: 0, etc: 0 },
  KMG: { n8n: 4, pa: 3, assistant: 4, "ai-orchestration": 3, ml: 2, vibe: 1, etc: 0 },
  KMW: { n8n: 2, pa: 1, assistant: 2, "ai-orchestration": 1, ml: 1, vibe: 0, etc: 0 },
  KUS: { n8n: 1, pa: 0, assistant: 1, "ai-orchestration": 0, ml: 0, vibe: 0, etc: 0 },
  KBT: { n8n: 1, pa: 0, assistant: 0, "ai-orchestration": 1, ml: 0, vibe: 0, etc: 0 },
};

// 도메인 라벨(고정 순서) + 관계사별 수치. 정식 BusinessDomain 6종(영업/생산/연구/재무/HR/IT)과 정합.
// TODO: 백엔드 연동 시 폐기.
export const DOMAIN_LABELS = ["영업", "생산", "연구", "재무", "HR", "IT"];
export const DOMAIN_BY_COMPANY: Record<StatCompany, number[]> = {
  KKM: [10, 12, 12, 9, 6, 11],
  KBH: [4, 5, 4, 3, 2, 4],
  HC: [3, 4, 3, 2, 2, 3],
  KMG: [2, 3, 2, 2, 1, 2],
  KMW: [1, 3, 1, 1, 1, 1],
  KUS: [1, 1, 1, 1, 0, 1],
  KBT: [0, 0, 0, 0, 0, 0],
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
    n8n: 0, pa: 0, assistant: 0, "ai-orchestration": 0, ml: 0, vibe: 0, etc: 0,
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
  const acc: Record<SourceKey, number> = { n8n: 0, pa: 0, assistant: 0, "ai-orchestration": 0, ml: 0, vibe: 0, etc: 0 };
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

// ============================================================
// AdminStatistics 화면 고유 통계 (M2 합류) — 부서·난이도·비용·ML유형·키워드·
// 절감시간·후기 TOP5. 관계사 차원 raw 테이블 + 범위 집계 헬퍼.
// 소비 화면은 dataSource(getStatsByScope) 경유. TODO: 백엔드 연동 시 폐기.
// ============================================================

export const DEPT_BY_COMPANY: Record<StatCompany, { dept: string; count: number }[]> = {
  KKM: [
    { dept: "IT개발팀", count: 14 }, { dept: "메이크업연구소", count: 8 }, { dept: "IT인프라팀", count: 6 },
    { dept: "재무팀", count: 5 }, { dept: "마케팅팀", count: 5 }, { dept: "영업팀", count: 3 },
  ],
  KBH: [{ dept: "연구개발팀", count: 6 }, { dept: "경영지원팀", count: 4 }, { dept: "품질관리팀", count: 3 }],
  HC:  [{ dept: "생활건강연구소", count: 5 }, { dept: "마케팅팀", count: 3 }, { dept: "영업팀", count: 2 }],
  KMG: [{ dept: "글로벌사업팀", count: 4 }, { dept: "경영지원팀", count: 3 }],
  KMW: [{ dept: "제조기술팀", count: 5 }, { dept: "품질관리팀", count: 4 }],
  KUS: [{ dept: "US Operations", count: 3 }],
  KBT: [{ dept: "바이오연구팀", count: 2 }],
};

// n8n 워크플로우 기준 (난이도 축은 n8n 전용)
export const DIFFICULTY_BY_COMPANY: Record<StatCompany, number[]> = {
  KKM: [15, 18, 7], KBH: [6, 7, 2], HC: [4, 5, 1], KMG: [3, 4, 2], KMW: [1, 2, 1], KUS: [1, 1, 1], KBT: [1, 1, 1],
};

// AI Model 모델 기준 (3단계)
export const COST_BY_COMPANY: Record<StatCompany, number[]> = {
  KKM: [21, 11, 8], KBH: [8, 4, 3], HC: [5, 3, 3], KMG: [4, 2, 2], KMW: [3, 1, 1], KUS: [2, 1, 1], KBT: [1, 0, 0],
};

// ML 모델 유형 분포
export const ML_TYPE_BY_COMPANY: Record<StatCompany, number[]> = {
  KKM: [3, 2, 2, 1], KBH: [1, 1, 1, 1], HC: [1, 1, 0, 1], KMG: [0, 1, 1, 0], KMW: [1, 0, 0, 1], KUS: [0, 0, 1, 0], KBT: [0, 1, 0, 0],
};

export const KEYWORD_BY_COMPANY: Record<StatCompany, { keyword: string; count: number }[]> = {
  KKM: [{ keyword: "자동화", count: 22 }, { keyword: "AI", count: 18 }, { keyword: "승인", count: 14 }, { keyword: "원료", count: 12 }, { keyword: "데이터", count: 11 }, { keyword: "보고서", count: 10 }, { keyword: "API", count: 9 }, { keyword: "분류", count: 7 }],
  KBH: [{ keyword: "자동화", count: 8 }, { keyword: "AI", count: 6 }, { keyword: "승인", count: 5 }, { keyword: "원료", count: 4 }, { keyword: "데이터", count: 4 }, { keyword: "보고서", count: 3 }, { keyword: "API", count: 3 }, { keyword: "분류", count: 2 }],
  HC:  [{ keyword: "자동화", count: 5 }, { keyword: "AI", count: 4 }, { keyword: "승인", count: 3 }, { keyword: "원료", count: 3 }, { keyword: "데이터", count: 3 }, { keyword: "보고서", count: 2 }, { keyword: "API", count: 2 }, { keyword: "분류", count: 2 }],
  KMG: [{ keyword: "자동화", count: 3 }, { keyword: "AI", count: 3 }, { keyword: "승인", count: 3 }, { keyword: "원료", count: 2 }, { keyword: "데이터", count: 2 }, { keyword: "보고서", count: 2 }, { keyword: "API", count: 1 }, { keyword: "분류", count: 1 }],
  KMW: [{ keyword: "자동화", count: 2 }, { keyword: "AI", count: 2 }, { keyword: "승인", count: 2 }, { keyword: "원료", count: 2 }, { keyword: "데이터", count: 1 }, { keyword: "보고서", count: 1 }, { keyword: "API", count: 1 }, { keyword: "분류", count: 1 }],
  KUS: [{ keyword: "자동화", count: 1 }, { keyword: "AI", count: 1 }, { keyword: "승인", count: 1 }, { keyword: "원료", count: 1 }, { keyword: "데이터", count: 1 }, { keyword: "보고서", count: 1 }, { keyword: "API", count: 1 }, { keyword: "분류", count: 1 }],
  KBT: [{ keyword: "자동화", count: 1 }, { keyword: "AI", count: 1 }, { keyword: "승인", count: 0 }, { keyword: "원료", count: 0 }, { keyword: "데이터", count: 0 }, { keyword: "보고서", count: 0 }, { keyword: "API", count: 0 }, { keyword: "분류", count: 0 }],
};

export const TIME_SAVED_BY_COMPANY: Record<StatCompany, string[]> = {
  KKM: ["주 3시간", "월 4시간", "주 1시간", "하루 30분", "월 8시간", "주 2시간", "연 40시간", "추정 불가"],
  KBH: ["주 1시간", "월 2시간", "주 5시간", "측정 어려움"],
  HC: ["월 6시간", "하루 1시간", "주 2시간"],
  KMG: ["월 3시간", "주 1시간", "미정"],
  KMW: ["주 2시간", "월 1시간"],
  KUS: ["월 2시간"],
  KBT: [""],
};

// 후기 많은 항목 TOP 5 — 각 항목에 소유 관계사 코드를 부여하여 scope를 따르게 함.
// 전사(admin) 기준에서는 5건 전량 노출(기존 표시와 동일). TODO: 백엔드 연동 시 폐기.
export type TopReview = { id: string; title: string; kind: string; reviewCount: number; avgLikes: number; company: StatCompany };
export const TOP5_REVIEWS_ALL: TopReview[] = [
  { id: "N8N-2026-001", title: "신규 입사자 계정 자동 생성", kind: "n8n",              reviewCount: 18, avgLikes: 7.2, company: "KKM" },
  { id: "AST-2026-019", title: "해외법인 계약서 1차 검토 비서", kind: "assistant",     reviewCount: 14, avgLikes: 8.5, company: "KBH" },
  { id: "AIO-2026-014", title: "Claude Opus 4.8",              kind: "ai-orchestration", reviewCount: 11, avgLikes: 6.1, company: "HC" },
  { id: "PA-2026-013",  title: "구매 결재 자동 승인 플로우",      kind: "pa",             reviewCount:  8, avgLikes: 5.9, company: "KKM" },
  { id: "ML-2026-007",  title: "성분 이미지 품질 분류 모델",      kind: "ml",             reviewCount:  6, avgLikes: 4.8, company: "KBH" },
];

// ── 화면 고유 통계용 범위 집계 헬퍼 (raw 테이블과 동거, 로직 단일 정의) ──
export const aggregateIndexed = (companies: StatCompany[], table: Record<StatCompany, number[]>, len: number): number[] =>
  Array.from({ length: len }, (_, i) => companies.reduce((s, co) => s + (table[co][i] ?? 0), 0));

export const aggregateDept = (companies: StatCompany[]): { dept: string; count: number }[] => {
  const map = new Map<string, number>();
  companies.forEach(co => DEPT_BY_COMPANY[co].forEach(d => map.set(d.dept, (map.get(d.dept) ?? 0) + d.count)));
  return [...map.entries()].map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count).slice(0, 8);
};

export const aggregateKeyword = (companies: StatCompany[]): { keyword: string; count: number }[] => {
  const keys = KEYWORD_BY_COMPANY[STAT_COMPANIES[0]].map(k => k.keyword);
  return keys.map((keyword, i) => ({
    keyword,
    count: companies.reduce((s, co) => s + (KEYWORD_BY_COMPANY[co][i]?.count ?? 0), 0),
  })).sort((a, b) => b.count - a.count);
};

export const aggregateTimeSaved = (companies: StatCompany[]): string[] =>
  companies.flatMap(co => TIME_SAVED_BY_COMPANY[co]);
