// ============================================================
// AdminUsers 사용자·권한·활동 로그 공용 mock 데이터 (DEMO 전용) — 단일 소스(SSOT)
// ------------------------------------------------------------
// AdminUsers(/admin/users)가 lib/dataSource.ts를 경유해 이 한 곳을 참조한다.
//
// ⚠️ 감사(활동) 로그 LOGS는 과거 표기 그대로 보존한다 — 소급 수정 금지.
//    (AGENT-2025-007 · HKGPT-2025-018 등 구 표기 이력은 바이트 동일하게 유지.)
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//   GET /api/v1/admin/users?role=admin            — INITIAL_ADMINS
//   GET /api/v1/admin/users?permission=group_viewer — INITIAL_GROUP_VIEWERS
//   GET /api/v1/admin/registrants                 — REGISTRANTS
//   GET /api/v1/admin/logs                        — LOGS (활동 로그)
//   GET /api/v1/admin/companies?visible=true      — SELECTABLE_COMPANIES
//   GET /api/v1/admin/sso-search?q=:q             — MOCK_SSO_USERS
// ============================================================

import type { Admin, GroupViewer, Registrant, LogEntry, SsoUser } from "../pages/admin/AdminUsers";

// TODO: 실제 연동 시 GET /api/v1/admin/users?role=admin 응답으로 교체
export const INITIAL_ADMINS: Admin[] = [
  { id: 1, name: "김관리", email: "admin.kim@kolmar.co.kr", dept: "IT개발팀", title: "팀장", grantedAt: "2025.01.10", grantedBy: "시스템 초기화" },
  { id: 2, name: "이서현", email: "seohyun.lee@kolmar.co.kr", dept: "IT인프라팀", title: "선임", grantedAt: "2025.03.05", grantedBy: "김관리" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/users?permission=group_viewer 응답으로 교체
export const INITIAL_GROUP_VIEWERS: GroupViewer[] = [
  { id: 1, name: "최지훈", email: "jihoon.choi@kolmar.co.kr", dept: "그룹IT전략팀", title: "팀장", grantedAt: "2025.02.14", grantedBy: "김관리", reason: "그룹 IT 거버넌스 총괄" },
  { id: 2, name: "한서윤", email: "seoyoon.han@kolmar.co.kr", dept: "콜마홀딩스 경영기획팀", title: "차장", grantedAt: "2025.04.02", grantedBy: "김관리", reason: "지주사 관계사 현황 보고용" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/registrants 응답으로 교체
export const REGISTRANTS: Registrant[] = [
  { name: "이수연", email: "suyeon.lee@kolmar.co.kr", dept: "메이크업연구소", title: "책임연구원", count: 3, lastSubmit: "2025.06.01", approved: 2, pending: 1, rejected: 0 },
  { name: "정태영", email: "taeyoung.jung@kolmar.co.kr", dept: "IT개발팀", title: "선임", count: 3, lastSubmit: "2025.06.10", approved: 2, pending: 1, rejected: 0 },
  { name: "박성훈", email: "sunghoon.park@kolmar.co.kr", dept: "구매팀", title: "대리", count: 1, lastSubmit: "2025.06.02", approved: 1, pending: 0, rejected: 0 },
  { name: "이민호", email: "minho.lee@kolmar.co.kr", dept: "품질관리팀", title: "선임", count: 1, lastSubmit: "2025.05.09", approved: 0, pending: 0, rejected: 1 },
];

// TODO: 실제 연동 시 GET /api/v1/admin/logs 응답으로 교체
export const LOGS: LogEntry[] = [
  { id: 8, datetime: "2025.06.06 09:05", actor: "김관리", action: "승인", target: "원료 추천 에이전트 (AGENT-2025-007)", category: "등록물", source: "AI Model" },
  { id: 7, datetime: "2025.06.05 14:20", actor: "이서현", action: "반려", target: "계약서 요약 비서 (HKGPT-2025-018)", category: "등록물", source: "나만의비서" },
  { id: 6, datetime: "2025.06.05 10:12", actor: "김관리", action: "승인", target: "재고 알림 자동화 워크플로우 (N8N-2025-031)", category: "등록물", source: "n8n" },
  { id: 2, datetime: "2025.06.03 16:44", actor: "김관리", action: "권한 부여", target: "박준서 → 관리자", category: "권한" },
  { id: 3, datetime: "2025.05.28 13:45", actor: "김관리", action: "분류 수정", target: "n8n 노드 힌트 — Schedule Trigger 추가", category: "분류체계" },
  { id: 4, datetime: "2025.05.20 09:30", actor: "김관리", action: "부서 추가", target: "데이터분석팀 (IT본부)", category: "조직" },
  { id: 5, datetime: "2025.04.02 11:15", actor: "김관리", action: "그룹 전체보기 부여", target: "한서윤 → 그룹 전체보기", category: "권한" },
];

// 담당 관계사 선택 대상 (노출 관계사). TODO: 실제 연동 시 GET /api/v1/admin/companies?visible=true 로 교체
export const SELECTABLE_COMPANIES: { code: string; name: string }[] = [
  { code: "KMH", name: "콜마홀딩스" }, { code: "KKM", name: "한국콜마" }, { code: "KBH", name: "콜마비앤에이치" },
  { code: "HKN", name: "에이치케이이노엔" }, { code: "YWK", name: "연우" }, { code: "HC", name: "콜마생활건강" },
  { code: "KMG", name: "콜마글로벌" }, { code: "KMSK", name: "콜마스크" }, { code: "KMW", name: "무석콜마" },
  { code: "KMB", name: "북경콜마" }, { code: "KUS", name: "미국콜마" }, { code: "KBT", name: "콜마바이오텍" },
];

// SSO 검색 목업. TODO: 실제 연동 시 GET /api/v1/admin/sso-search?q=:q 응답으로 교체
export const MOCK_SSO_USERS: SsoUser[] = [
  { name: "이수연", email: "suyeon.lee@kolmar.co.kr", dept: "메이크업연구소", title: "책임연구원" },
  { name: "정태영", email: "taeyoung.jung@kolmar.co.kr", dept: "IT개발팀", title: "선임" },
  { name: "오세훈", email: "sehoon.oh@kolmar.co.kr", dept: "마케팅팀", title: "사원" },
  { name: "장미경", email: "mikyung.jang@kolmar.co.kr", dept: "콜마글로벌 경영지원팀", title: "부장" },
];
