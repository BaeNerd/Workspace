// ============================================================
// 통계 파생 계층 (순수 함수) — 자산 SSOT·후기에서 통계 수치를 계산한다.
// ------------------------------------------------------------
// 합성 관계사 더미 테이블 없이 MOCK_ASSET_ITEMS·MOCK_REVIEWS_BY_ITEM 단일 소스에서
// 파생하므로 전 화면 총량이 카탈로그(50)와 일치한다. 모든 함수는 인자로 받은 배열만
// 읽는 순수 함수이며, 범위(scope)는 관계사 코드 배열(null=전사)을 ownerCompany 기준으로 적용한다.
// 이 축이 곧 서버 ?company= 파라미터 계약이다.
//
// ⭐ 실제 연동 시 이 파생 계층을 폐기하고 서버 집계 응답(GET /api/v1/stats/...)을 그대로 쓴다.
//    각 함수 주석의 엔드포인트가 그 계약 초안이다.
// ============================================================

import type { AssetItem, AssetReview, CategoryId, BusinessDomain } from "../types/categoryTypes";
import { CATEGORIES, BUSINESS_DOMAINS } from "../types/categoryTypes";

// 출처 키 = 7개 카테고리 그대로 (etc = AI 프로젝트 포함)
export type SourceKey = CategoryId;

// 통계 표시 대상 관계사 코드 (배지·범례·조회 범위 선택기 표시 순서).
// 실측상 자산 SSOT의 ownerCompany 등장 관계사 집합과 일치한다(표시명은 조직 SSOT orgCompanyName 파생).
export const STAT_COMPANIES = ["KKM", "KBH", "HC", "KMG", "KMW", "KUS", "KBT"] as const;
export type StatCompany = typeof STAT_COMPANIES[number];

// 월별 포인트 — 카테고리 스택(막대) 렌더용. key="YYYY-MM", m/month="YY.MM"(연도 구분 표기).
export type MonthPoint = {
  key: string;
  m: string;
  month: string;
  n8n: number;
  pa: number;
  assistant: number;
  "ai-orchestration": number;
  ml: number;
  vibe: number;
  etc: number;
};

export type TopReview = { id: string; title: string; kind: string; reviewCount: number; avgLikes: number; company: string };
export type TagCount = { tag: string; count: number };
export type CompanyTotal = { code: string; count: number };

// ── 범위 필터 (ownerCompany 기준, null=전사) ──
const inScope = (item: AssetItem, scope: string[] | null): boolean =>
  scope === null || (item.ownerCompany != null && scope.includes(item.ownerCompany));

const scoped = (items: AssetItem[], scope: string[] | null): AssetItem[] =>
  scope === null ? items : items.filter(i => inScope(i, scope));

// 범위 내 등장 관계사 코드 (STAT_COMPANIES 표시 순서 유지).
export const scopedCompanies = (items: AssetItem[], scope: string[] | null): string[] => {
  const present = new Set(scoped(items, scope).map(i => i.ownerCompany).filter(Boolean) as string[]);
  return STAT_COMPANIES.filter(c => present.has(c));
};

// 월 합계 (7유형 전량 — etc 포함).
export const monthTotal = (m: MonthPoint): number =>
  m.n8n + m.pa + m.assistant + m["ai-orchestration"] + m.ml + m.vibe + m.etc;

// ── 기간(월 범위) ──
// 통계·대시보드 공용 기간 선택 계약. 프리셋 3종은 시스템 현재월 파생(하드코딩 금지),
// "범위 지정"은 커스텀 범위(kind:"range")로 표현한다. 유효 범위는 항상 {from,to}로 환원되어
// 파생 계층 1곳에서 createdAt 필터로 적용된다(화면별 개별 필터 없음).
// 전 기간 프리셋은 없다 — 레거시(2024) 구간은 범위 지정으로만 조회한다.
export type PeriodPreset = "최근 3개월" | "최근 6개월" | "올해 전체";
export type PeriodSelection =
  | { kind: "preset"; preset: PeriodPreset }
  | { kind: "range"; from: string; to: string }; // "YYYY-MM" (시작·종료 inclusive)
export type MonthRange = { from: string; to: string }; // "YYYY-MM" inclusive

export const PERIOD_PRESETS: PeriodPreset[] = ["최근 3개월", "최근 6개월", "올해 전체"];
export const MAX_RANGE_MONTHS = 24; // 범위 지정 최대 길이(시작~종료 inclusive)

// "YYYY-MM" 월키 산술 — 문자열·정수만 사용(Date 의존은 currentMonthKey 1곳에 격리).
const pad2m = (n: number) => String(n).padStart(2, "0");
const monthIndex = (key: string): number => { const [y, m] = key.split("-").map(Number); return y * 12 + (m - 1); };
const monthFromIndex = (idx: number): string => `${Math.floor(idx / 12)}-${pad2m((idx % 12) + 1)}`;
export const addMonths = (key: string, delta: number): string => monthFromIndex(monthIndex(key) + delta);
// 시작~종료 inclusive 월 수.
export const monthSpan = (from: string, to: string): number => monthIndex(to) - monthIndex(from) + 1;
// 시작~종료 inclusive 연속 월키 목록(빈 월 포함) — x축 연속성의 기준.
export const enumerateMonths = (from: string, to: string): string[] => {
  const out: string[] = [];
  for (let i = monthIndex(from); i <= monthIndex(to); i++) out.push(monthFromIndex(i));
  return out;
};

// createdAt("YYYY.MM.DD") → 월키("YYYY-MM"). 미보유 시 null.
const itemMonthKey = (item: AssetItem): string | null => {
  if (!item.createdAt) return null;
  const [y, mo] = item.createdAt.split(".");
  return `${y}-${mo}`;
};

// 기준월(현재) — 시스템 현재 날짜 파생. 실서버 전환 시 서버 기준시각으로 대체.
export const currentMonthKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2m(d.getMonth() + 1)}`;
};

// 데이터 존재 월 경계 {min,max}("YYYY-MM"). 비어 있으면 현재월 단일. 레거시(2024) 하한 포함.
export const dataMonthBounds = (items: AssetItem[]): { min: string; max: string } => {
  const keys = (items.map(itemMonthKey).filter(Boolean) as string[]).sort();
  if (keys.length === 0) { const c = currentMonthKey(); return { min: c, max: c }; }
  return { min: keys[0], max: keys[keys.length - 1] };
};

// 프리셋/범위 선택 → 유효 월 범위 {from,to}. 기준월=시스템 현재월(하드코딩 금지).
// 전 기간 프리셋 없음 — 레거시(2024) 구간은 range 선택으로만 도달한다.
// range 선택은 종료<시작 자동 스왑 + 최대 길이 방어 절단(초과분은 시작 기준 +MAX-1로 클램프).
export function resolvePeriodRange(sel: PeriodSelection): MonthRange {
  if (sel.kind === "range") {
    let { from, to } = sel;
    if (monthIndex(to) < monthIndex(from)) [from, to] = [to, from];
    if (monthSpan(from, to) > MAX_RANGE_MONTHS) to = addMonths(from, MAX_RANGE_MONTHS - 1);
    return { from, to };
  }
  const now = currentMonthKey();
  switch (sel.preset) {
    case "최근 3개월": return { from: addMonths(now, -2), to: now };
    case "최근 6개월": return { from: addMonths(now, -5), to: now };
    case "올해 전체": return { from: `${now.slice(0, 4)}-01`, to: now };
  }
}

// createdAt 월이 [from,to] 안인 항목만 (기간 집계용). 날짜 미보유 항목은 제외.
export function filterByMonthRange(items: AssetItem[], from: string, to: string): AssetItem[] {
  return items.filter(i => { const k = itemMonthKey(i); return k !== null && k >= from && k <= to; });
}

// 카테고리별 등록 현황(7종). TODO: 실제 연동 시 GET /api/v1/stats/by-category?company=:codes 응답으로 교체
export function deriveSourceTotal(items: AssetItem[], scope: string[] | null): Record<SourceKey, number> {
  const acc: Record<SourceKey, number> = { n8n: 0, pa: 0, assistant: 0, "ai-orchestration": 0, ml: 0, vibe: 0, etc: 0 };
  scoped(items, scope).forEach(i => { acc[i.categoryId] += 1; });
  return acc;
}

// 빈 월 포인트("YYYY-MM" → 0 스택). 라벨은 "YY.MM"(연도 구분 표기).
const emptyMonthPoint = (key: string): MonthPoint => {
  const label = `${key.slice(2, 4)}.${key.slice(5, 7)}`;
  return { key, m: label, month: label, n8n: 0, pa: 0, assistant: 0, "ai-orchestration": 0, ml: 0, vibe: 0, etc: 0 };
};

// 월별 추이(createdAt 파생, 카테고리 스택). 등장 월만 시간순 버킷 — 빈 월 없음, 합=총 등록물.
// 레거시 1건(범위 밖 2024월)도 포함되어 월 합계 총량이 카탈로그와 일치한다.
// TODO: 실제 연동 시 GET /api/v1/stats/monthly?company=:codes&from=YYYY-MM&to=YYYY-MM 응답으로 교체
export function deriveMonthly(items: AssetItem[], scope: string[] | null): MonthPoint[] {
  const byKey = new Map<string, MonthPoint>();
  scoped(items, scope).forEach(i => {
    const key = itemMonthKey(i);
    if (key === null) return;
    let p = byKey.get(key);
    if (!p) { p = emptyMonthPoint(key); byKey.set(key, p); }
    p[i.categoryId] += 1;
  });
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

// 연속 월축(from~to inclusive, 빈 월 0-fill) — 선택 범위의 x축 연속성을 유지한다(등장 월만 뽑으면 빈 월이 축에서 빠진다).
// 프리셋·범위 지정 공용. 등장 월 집계는 deriveMonthly에 위임(로직 복제 없음).
// TODO: 실제 연동 시 GET /api/v1/stats/monthly?company=:codes&from=YYYY-MM&to=YYYY-MM 응답으로 교체
export function deriveMonthlySeries(items: AssetItem[], scope: string[] | null, from: string, to: string): MonthPoint[] {
  const present = new Map(deriveMonthly(items, scope).map(p => [p.key, p]));
  return enumerateMonths(from, to).map(key => present.get(key) ?? emptyMonthPoint(key));
}

// 비즈니스 도메인 분포(6종, 고정 순서). TODO: 실제 연동 시 GET /api/v1/stats/by-domain?company=:codes 응답으로 교체
export function deriveDomain(items: AssetItem[], scope: string[] | null): { label: string; count: number }[] {
  const rows = scoped(items, scope);
  return (BUSINESS_DOMAINS as readonly BusinessDomain[]).map(label => ({
    label,
    count: rows.filter(i => i.domain === label).length,
  }));
}

// 부서별 현황 (등록 수 내림차순 전량). 상위 N 절단·"외 N개" 접힘은 화면 표시 계층(TOP5 펼치기 패턴)이 담당하며,
// 여기서는 전체 집계를 보존해 접힘/펼침 합계가 동일하도록 한다. TODO: 실제 연동 시 GET /api/v1/stats/by-dept?company=:codes 응답으로 교체
export function deriveDept(items: AssetItem[], scope: string[] | null): { dept: string; count: number }[] {
  const map = new Map<string, number>();
  scoped(items, scope).forEach(i => { if (i.dept) map.set(i.dept, (map.get(i.dept) ?? 0) + 1); });
  return [...map.entries()].map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count);
}

// 참여 부서 수 (범위 내 등장 부서의 고유 개수). TODO: 실제 연동 시 GET /api/v1/stats/dept-count?company=:codes
export function deriveDeptCount(items: AssetItem[], scope: string[] | null): number {
  return new Set(scoped(items, scope).map(i => i.dept).filter(Boolean)).size;
}

// 난이도 분포 (n8n 한정 — difficulty 보유 항목만). 순서 [쉬움, 보통, 어려움].
// TODO: 실제 연동 시 GET /api/v1/stats/difficulty?company=:codes 응답으로 교체
const DIFFICULTY_ORDER = ["쉬움", "보통", "어려움"];
export function deriveDifficulty(items: AssetItem[], scope: string[] | null): number[] {
  const counts = [0, 0, 0];
  scoped(items, scope).forEach(i => {
    if (i.categoryId !== "n8n" || !i.difficulty) return;
    const idx = DIFFICULTY_ORDER.indexOf(i.difficulty);
    if (idx >= 0) counts[idx] += 1;
  });
  return counts;
}

// 비용 등급 분포 (AI Model 한정 — modelMeta.costTier). 순서 [낮음, 보통, 높음].
// TODO: 실제 연동 시 GET /api/v1/stats/cost-tier?company=:codes 응답으로 교체
const COST_ORDER = ["낮음", "보통", "높음"];
export function deriveCost(items: AssetItem[], scope: string[] | null): number[] {
  const counts = [0, 0, 0];
  scoped(items, scope).forEach(i => {
    const tier = i.modelMeta?.costTier;
    if (i.categoryId !== "ai-orchestration" || !tier) return;
    const idx = COST_ORDER.indexOf(tier);
    if (idx >= 0) counts[idx] += 1;
  });
  return counts;
}

// ML 모델 유형 분포 (ml 한정). 표시 4버킷 [이미지 인식, 시계열 예측, 자연어 처리, 분류/회귀]에 mlType 값을 사상.
// TODO: 실제 연동 시 GET /api/v1/stats/ml-type?company=:codes 응답으로 교체
function mlTypeBucket(mlType: string | undefined): number {
  if (!mlType) return -1;
  if (mlType.includes("이미지")) return 0;
  if (mlType.includes("시계열")) return 1;
  if (mlType.includes("NLP") || mlType.includes("자연어") || mlType.includes("텍스트")) return 2;
  if (mlType.includes("분류") || mlType.includes("회귀") || mlType.includes("Classification") || mlType.includes("Regression")) return 3;
  return -1;
}
export function deriveMlType(items: AssetItem[], scope: string[] | null): number[] {
  const counts = [0, 0, 0, 0];
  scoped(items, scope).forEach(i => {
    if (i.categoryId !== "ml") return;
    const idx = mlTypeBucket(i.mlType);
    if (idx >= 0) counts[idx] += 1;
  });
  return counts;
}

// 관계사별 합계 (ownerCompany, STAT_COMPANIES 표시 순서). 범위 무관 전량 기준.
// TODO: 실제 연동 시 GET /api/v1/stats/by-company 응답으로 교체
export function deriveCompanyTotals(items: AssetItem[]): CompanyTotal[] {
  return STAT_COMPANIES.map(code => ({ code, count: items.filter(i => i.ownerCompany === code).length }));
}

// 이번 달 신규 (createdAt이 당월인 건수). 당월 기준은 전체 데이터의 최신 createdAt 월(=현재)이며,
// 범위 내에 당월 등록물이 없으면 0. TODO: 실제 연동 시 GET /api/v1/stats/new-this-month?company=:codes
export function deriveNewThisMonth(items: AssetItem[], scope: string[] | null): number {
  const allMonths = items.map(i => i.createdAt?.slice(0, 7)).filter(Boolean) as string[];
  if (allMonths.length === 0) return 0;
  const current = allMonths.sort().at(-1)!;
  return scoped(items, scope).filter(i => i.createdAt?.slice(0, 7) === current).length;
}

// ── 절감 효과: 자유 입력 텍스트(expectedTimeSaved)를 연간 시간으로 환산 ──
// 파서 로직은 화면에서 이 계층으로 이동(로직 무변경). 집계 대상은 expectedTimeSaved 보유 카드(n8n·PA).
const PERIOD_MULTIPLIER: Record<string, number> = {
  "일": 365, "하루": 365, "주": 52, "주일": 52, "월": 12, "개월": 12, "년": 1, "연": 1,
};
export function parseTimeSaved(raw: string | undefined | null): number | null {
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

// 절감 효과 요약 (연간 환산 총량 · 집계 가능/추정 불가 카드 수).
// TODO: 실제 연동 시 GET /api/v1/stats/time-saved?company=:codes 응답으로 교체
export function deriveTimeSaved(items: AssetItem[], scope: string[] | null): { annualTotal: number; estimable: number; unestimable: number; held: number } {
  const samples = scoped(items, scope).map(i => i.expectedTimeSaved).filter((v): v is string => v != null && v !== "");
  const parsed = samples.map(parseTimeSaved);
  const annualTotal = parsed.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const unestimable = parsed.filter(v => v === null).length;
  return { annualTotal, estimable: parsed.length - unestimable, unestimable, held: samples.length };
}

// 태그 빈도 (SSOT tags 집계, 상위 8). 검색어 측정이 아니라 카드 부착 태그 기준.
// TODO: 실제 연동 시 GET /api/v1/stats/tags?company=:codes 응답으로 교체
export function deriveTagFrequency(items: AssetItem[], scope: string[] | null, limit = 8): TagCount[] {
  const map = new Map<string, number>();
  scoped(items, scope).forEach(i => (i.tags ?? []).forEach(t => map.set(t, (map.get(t) ?? 0) + 1)));
  return [...map.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

// 후기 많은 카드 TOP 5 (MOCK_REVIEWS_BY_ITEM 누적 — 누적 후기 수·평균 좋아요).
// TODO: 실제 연동 시 GET /api/v1/stats/top-reviewed?company=:codes 응답으로 교체
export function deriveTopReviews(
  items: AssetItem[],
  reviewsByItem: Record<string, AssetReview[]>,
  scope: string[] | null,
  limit = 5,
): TopReview[] {
  const byId = new Map(items.map(i => [i.id, i]));
  const rows: TopReview[] = [];
  for (const [id, reviews] of Object.entries(reviewsByItem)) {
    if (reviews.length === 0) continue;
    const item = byId.get(id);
    if (!item || !inScope(item, scope)) continue;
    const avgLikes = reviews.reduce((s, r) => s + r.likes, 0) / reviews.length;
    rows.push({
      id,
      title: item.title,
      kind: item.categoryId,
      reviewCount: reviews.length,
      avgLikes: Math.round(avgLikes * 10) / 10,
      company: item.ownerCompany ?? "",
    });
  }
  return rows.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, limit);
}

// 카테고리 표시 정의(라벨·색상) — CATEGORIES 단일 소스 재-export 헬퍼(범례·스택 공용).
export const SOURCE_DEFS: { key: SourceKey; label: string; color: string }[] =
  CATEGORIES.map(p => ({ key: p.id, label: p.name, color: p.color }));
