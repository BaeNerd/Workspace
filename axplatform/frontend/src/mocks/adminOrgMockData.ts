// ============================================================
// AdminOrg 조직(관계사·부서) 공용 mock 데이터 (DEMO 전용) — 단일 소스(SSOT)
// ------------------------------------------------------------
// AdminOrg(/admin/org)가 lib/dataSource.ts를 경유해 이 한 곳을 참조한다.
// (구 AdminOrg 내장 배열 이관 — 식별자명 유지.)
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//   GET /api/v1/admin/companies              — INITIAL_COMPANIES (Teams 조직도 API)
//   GET /api/v1/admin/departments            — INITIAL_DEPTS
//   GET /api/v1/admin/platform-items?fields=company — ASSET_ITEM_REFS (관계사 집계용 최소 투영)
//   GET /api/v1/admin/teams/org-preview      — TEAMS_SYNC_SOURCE (Graph API 조직도 미리보기)
// ============================================================

import type { Company, Dept, AssetItemRef } from "../pages/admin/AdminOrg";

// TODO: 실제 연동 시 GET /api/v1/admin/companies 응답으로 교체 (Microsoft Teams 조직도 API)
export const INITIAL_COMPANIES: Company[] = [
  { code: "KMH", name: "콜마홀딩스", visible: true },
  { code: "KKM", name: "한국콜마", visible: true },
  { code: "KBH", name: "콜마비앤에이치", visible: true },
  { code: "HKN", name: "에이치케이이노엔", visible: true },
  { code: "YWK", name: "연우", visible: true },
  { code: "KAF", name: "근오농림", visible: false },
  { code: "NAB", name: "넥스트앤바이오", visible: false },
  { code: "HC", name: "콜마생활건강", visible: true },
  { code: "HNG", name: "에치엔지", visible: false },
  { code: "MOD", name: "엠오디머티리얼즈", visible: false },
  { code: "KMG", name: "콜마글로벌", visible: true },
  { code: "KMSK", name: "콜마스크", visible: true },
  { code: "KUX", name: "콜마유엑스", visible: false },
  { code: "KMW", name: "무석콜마", visible: true },
  { code: "KMB", name: "북경콜마", visible: true },
  { code: "KBJ", name: "강소콜마", visible: false },
  { code: "KAY", name: "연태콜마", visible: false },
  { code: "HKV", name: "한국헬스케어베너", visible: false },
  { code: "PLT", name: "플래닛147", visible: false },
  { code: "LSL", name: "레스리", visible: false },
  { code: "LOD", name: "라우드랩스", visible: false },
  { code: "KMP", name: "콜마헬스케어필리핀", visible: false },
  { code: "KMS", name: "에이치케이콜마싱가포르", visible: false },
  { code: "KML", name: "콜마랩스", visible: false },
  { code: "KUS", name: "미국콜마", visible: true },
  { code: "KCA", name: "캐나다콜마", visible: false },
  { code: "HKJ", name: "에이치케이글로벌퍼팩", visible: false },
  { code: "KMM", name: "에이치케이콜마말레이시아", visible: false },
  { code: "KBT", name: "콜마바이오텍", visible: true },
];

// TODO: 실제 연동 시 GET /api/v1/admin/departments 응답으로 교체
export const INITIAL_DEPTS: Dept[] = [
  { id: 1, name: "메이크업연구소", parent: "연구개발본부", company: "KKM", projectCount: 8, source: "manual" },
  { id: 2, name: "스킨케어연구소", parent: "연구개발본부", company: "KKM", projectCount: 5, source: "manual" },
  { id: 3, name: "IT개발팀", parent: "IT본부", company: "KKM", projectCount: 14, source: "manual" },
  { id: 4, name: "IT인프라팀", parent: "IT본부", company: "KKM", projectCount: 6, source: "manual" },
  { id: 5, name: "재무팀", parent: "경영지원본부", company: "KKM", projectCount: 4, source: "manual" },
  { id: 6, name: "인사팀", parent: "경영지원본부", company: "KKM", projectCount: 3, source: "manual" },
  { id: 7, name: "마케팅팀", parent: "영업마케팅본부", company: "KKM", projectCount: 5, source: "manual" },
  { id: 8, name: "영업팀", parent: "영업마케팅본부", company: "KKM", projectCount: 3, source: "manual" },
  { id: 9, name: "품질관리팀", parent: "생산본부", company: "KKM", projectCount: 4, source: "manual" },
  { id: 10, name: "제조기술팀", parent: "생산본부", company: "KKM", projectCount: 5, source: "manual" },
  { id: 11, name: "헬스케어연구소", parent: "연구개발본부", company: "KBH", projectCount: 3, source: "manual" },
  { id: 12, name: "사업기획팀", parent: "경영지원본부", company: "KBH", projectCount: 2, source: "manual" },
  { id: 13, name: "글로벌사업팀", parent: "영업마케팅본부", company: "KMG", projectCount: 2, source: "manual" },
  { id: 14, name: "생산관리팀", parent: "생산본부", company: "KMW", projectCount: 1, source: "manual" },
  { id: 15, name: "전략기획팀", parent: null, company: "KMH", projectCount: 1, source: "manual" },
];

// ★ AssetItem 관계사 집계용 최소 투영 목업
// TODO: 실제 연동 시 GET /api/v1/admin/platform-items?fields=company 응답으로 교체
export const ASSET_ITEM_REFS: AssetItemRef[] = [
  { id: "N8N-001", company: ["KKM"] },
  { id: "N8N-002", company: ["KKM"] },
  { id: "N8N-003", company: ["KKM", "KMG"] },
  { id: "N8N-004", company: ["KMW"] },
  { id: "AST-001", company: [] },
  { id: "AST-002", company: [] },
  { id: "AST-003", company: [] },
  { id: "AST-004", company: ["KKM"] },
  { id: "AIO-001", company: [] },
  { id: "AIO-002", company: [] },
  { id: "AIO-003", company: ["KKM", "KBH", "KMG"] },
  { id: "AIO-004", company: [] },
];

// Teams 동기화 시 들어올 원천 데이터(목업). 실제로는 Graph API 조직도 응답.
// TODO: 실제 연동 시 GET /api/v1/admin/teams/org-preview 응답으로 교체
export const TEAMS_SYNC_SOURCE: { name: string; parent: string; company: string }[] = [
  { name: "디지털마케팅팀", parent: "영업마케팅본부", company: "KKM" }, // 신규
  { name: "데이터분석팀", parent: "IT본부", company: "KKM" },          // 신규
  { name: "IT개발팀", parent: "IT본부", company: "KKM" },              // 기존 수동 등록과 동일 키 → 병합
];
