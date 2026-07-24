// ============================================================
// 데이터 접근 계층 (동기, DEMO) — 목업 → 실서버 전환의 유일한 교체 지점
// ------------------------------------------------------------
// 페이지·훅은 mocks/*를 직접 import하지 않고 이 계층만 경유한다.
// ⭐ 백엔드 연동 시 mocks 배열을 삭제하고 아래 함수 본문만 실제 API 호출로
//    바꾸면 된다. (동기 시그니처 → 비동기 전환·로딩 상태 도입은 실제 연동 시로 유보.)
//
// 함수 카탈로그
//   [자산]      getAssetItems · getAssetItem · getReviewsByItem · getPostsByItem
//               · getFallbackN8nWorkflowJson
//   [검토/신청] getReviewQueue · getMyApplications · getMyReviews
//   [관리자]    getDashboardData · getStatsByScope · getManagedAssetItems
//               · getAdmins · getGroupViewers · getRegistrants · getAuditLogs
//               · getSsoUsers · getSelectableCompanies · getCompanyAdmins
//               · getManagedCompanies
//   [소식/알림] getNotices · getAdminNotices · sortNotices · getNotifications
//   [통계 위임] monthTotal · COMPANY_NAME (mocks 헬퍼 재-export, 로직 복제 없음)
// ============================================================

import type { AssetItem, AssetReview, Post } from "../types/categoryTypes";
import {
  MOCK_ASSET_ITEMS,
  MOCK_REVIEWS_BY_ITEM,
  MOCK_POSTS_BY_ITEM,
  MOCK_N8N_WORKFLOW,
} from "../mocks/assetItemMockData";
import { INITIAL_ITEMS as REVIEW_QUEUE } from "../mocks/adminReviewMockData";
import { INITIAL_ITEMS as MY_APPLICATIONS, MOCK_MY_REVIEWS } from "../mocks/myStatusMockData";
import {
  PENDING_ALL, RECENT_APPROVED_ALL, ACTIVE_TOOLS_BY_COMPANY, REVIEW_COUNT_BY_COMPANY,
} from "../mocks/adminDashboardMockData";
import {
  scopedCompanies, aggregateSourceTotal, aggregateMonthly, aggregateDomain,
  aggregateIndexed, aggregateDept, aggregateKeyword, aggregateTimeSaved,
  DIFFICULTY_BY_COMPANY, COST_BY_COMPANY, ML_TYPE_BY_COMPANY, TOP5_REVIEWS_ALL,
  STAT_COMPANIES,
} from "../mocks/statsMockData";
import { INITIAL_ASSET_ITEMS } from "../mocks/adminProjectManageMockData";
import {
  INITIAL_ADMINS, INITIAL_GROUP_VIEWERS, REGISTRANTS, LOGS, MOCK_SSO_USERS, SELECTABLE_COMPANIES,
} from "../mocks/adminUsersMockData";
import { INITIAL_COMPANY_ADMINS, managedCompaniesOf } from "../mocks/companyAdminMockData";
import {
  INITIAL_COMPANIES, INITIAL_DEPTS, ASSET_ITEM_REFS, TEAMS_SYNC_SOURCE,
} from "../mocks/adminOrgMockData";
import { INITIAL_CATEGORY_TAXONOMY, INITIAL_FREE_TAGS } from "../mocks/adminTaxonomyMockData";
import { visibleNoticesByKind, NOTICE_MOCK_DATA } from "../mocks/noticeMockData";
import type { NoticeKind } from "../types/noticeTypes";
import { notificationsByDate } from "../mocks/notificationMockData";

// ===== 자산 도메인 =====

// 전체 자산 항목 목록 (목록/카운트).
// TODO: 실제 연동 시 GET /api/v1/platform-items 호출로 교체
export function getAssetItems(): AssetItem[] {
  return MOCK_ASSET_ITEMS;
}

// 단건 조회 (상세). 없으면 undefined.
// TODO: 실제 연동 시 GET /api/v1/platform-items/:id 호출로 교체
export function getAssetItem(id: string): AssetItem | undefined {
  return MOCK_ASSET_ITEMS.find(i => i.id === id);
}

// 항목별 활용 후기.
// TODO: 실제 연동 시 GET /api/v1/platform-items/:id/reviews 호출로 교체
export function getReviewsByItem(id: string): AssetReview[] {
  return MOCK_REVIEWS_BY_ITEM[id] ?? [];
}

// 항목별 게시글(업데이트 & 논의).
// TODO: 실제 연동 시 GET /api/v1/platform-items/:id/posts 호출로 교체
export function getPostsByItem(id: string): Post[] {
  return MOCK_POSTS_BY_ITEM[id] ?? [];
}

// n8n 워크플로우 다운로드/미리보기 폴백 JSON (item.workflowJson 부재 시).
// TODO: 실제 연동 시 GET /api/v1/platform-items/:id/workflow 호출로 교체
export function getFallbackN8nWorkflowJson(): string {
  return MOCK_N8N_WORKFLOW;
}

// ===== 검토 대기 큐 · 내 신청/후기 =====

// AdminReview 검토 대기 큐. TODO: 실제 연동 시 GET /api/v1/admin/review-queue
export function getReviewQueue() {
  return REVIEW_QUEUE;
}

// MyStatus 내 신청. TODO: 실제 연동 시 GET /api/v1/projects/mine
export function getMyApplications() {
  return MY_APPLICATIONS;
}

// MyStatus 내 후기. TODO: 실제 연동 시 GET /api/v1/reviews/mine
export function getMyReviews() {
  return MOCK_MY_REVIEWS;
}

// ===== 관리자 대시보드 =====

// AdminDashboard 범위별 대시보드 데이터 합성. scope=null → 전사, 배열 → 해당 관계사.
// TODO: 실제 연동 시 GET /api/v1/admin/stats/dashboard?scope=:codes
export function getDashboardData(scope: string[] | null) {
  const companies = scopedCompanies(scope);
  const sourceTotal = aggregateSourceTotal(companies);
  const monthly = aggregateMonthly(companies);
  const domain = aggregateDomain(companies);
  const pending = PENDING_ALL.filter(p => companies.includes(p.company));
  const recentApproved = RECENT_APPROVED_ALL.filter(p => companies.includes(p.company));
  const activeTools = companies.reduce((s, co) => s + (ACTIVE_TOOLS_BY_COMPANY[co] ?? 0), 0);
  const reviewTotal = companies.reduce((s, co) => s + (REVIEW_COUNT_BY_COMPANY[co] ?? 0), 0);
  // 대기 = 미게시·미반려 중 미승인 슬롯이 남은 항목. 부분 승인 = 한 슬롯만 완료.
  const partialCount = pending.filter(p => p.approvalSlots.company.approved !== p.approvalSlots.global.approved).length;
  return { companies, sourceTotal, monthly, domain, pending, recentApproved, activeTools, reviewTotal, partialCount };
}

// ===== 관리자 통계 =====

// AdminStatistics 범위별 통계 데이터 합성(META 병합·시간 파싱은 화면 프레젠테이션에서 처리).
// TODO: 실제 연동 시 GET /api/v1/admin/stats?scope=:codes
export function getStatsByScope(scope: string[] | null) {
  const companies = scopedCompanies(scope);
  const monthSeries = aggregateMonthly(companies);
  const sourceTotal = aggregateSourceTotal(companies);
  const domain = aggregateDomain(companies);
  const difficultyCounts = aggregateIndexed(companies, DIFFICULTY_BY_COMPANY, DIFFICULTY_BY_COMPANY[STAT_COMPANIES[0]].length);
  const costCounts = aggregateIndexed(companies, COST_BY_COMPANY, COST_BY_COMPANY[STAT_COMPANIES[0]].length);
  const mlTypeCounts = aggregateIndexed(companies, ML_TYPE_BY_COMPANY, ML_TYPE_BY_COMPANY[STAT_COMPANIES[0]].length);
  const dept = aggregateDept(companies);
  const keyword = aggregateKeyword(companies);
  const timeSamples = aggregateTimeSaved(companies);
  const topReviews = TOP5_REVIEWS_ALL.filter(r => companies.includes(r.company));
  return { companies, monthSeries, sourceTotal, domain, difficultyCounts, costCounts, mlTypeCounts, dept, keyword, timeSamples, topReviews };
}

// 통계 헬퍼 재-export (로직 복제 금지 — mocks의 단일 정의를 위임). 화면 프레젠테이션 계산에 사용.
export { monthTotal, COMPANY_NAME } from "../mocks/statsMockData";
export type { SourceKey, StatCompany, MonthPoint } from "../mocks/statsMockData";

// ===== 관리자 프로젝트 관리 =====

// AdminProjectManage 게시 항목 전체. TODO: 실제 연동 시 GET /api/v1/admin/platform-items
export function getManagedAssetItems() {
  return INITIAL_ASSET_ITEMS;
}

// ===== 관리자 사용자·권한·로그 =====

// TODO: 실제 연동 시 GET /api/v1/admin/users?role=admin
export function getAdmins() {
  return INITIAL_ADMINS;
}
// TODO: 실제 연동 시 GET /api/v1/admin/users?permission=group_viewer
export function getGroupViewers() {
  return INITIAL_GROUP_VIEWERS;
}
// TODO: 실제 연동 시 GET /api/v1/admin/registrants
export function getRegistrants() {
  return REGISTRANTS;
}
// AdminUsers 활동 로그. TODO: 실제 연동 시 GET /api/v1/admin/logs
export function getAuditLogs() {
  return LOGS;
}
// SSO 검색 목업. TODO: 실제 연동 시 GET /api/v1/admin/sso-search?q=:q
export function getSsoUsers() {
  return MOCK_SSO_USERS;
}
// 담당 관계사 선택 대상. TODO: 실제 연동 시 GET /api/v1/admin/companies?visible=true
export function getSelectableCompanies() {
  return SELECTABLE_COMPANIES;
}

// ===== 관계사 관리자 지정 =====

// AdminUsers·AdminOrg 참조. TODO: 실제 연동 시 GET/PUT /api/v1/admin/company-admins
export function getCompanyAdmins() {
  return INITIAL_COMPANY_ADMINS;
}
// LoginPage 데모 계정 → managedCompanies 모사. TODO: 실제 연동 시 GET /api/v1/auth/me
export function getManagedCompanies(email: string): string[] {
  return managedCompaniesOf(email);
}
export type { CompanyAdminUser } from "../mocks/companyAdminMockData";

// ===== 공지·업데이트 소식 =====

// 공개 목록(visible=true) — LandingPage·NoticesPage. TODO: 실제 연동 시 GET /api/v1/notices?kind=:kind
export function getNotices(kind: NoticeKind) {
  return visibleNoticesByKind(kind);
}
// 관리자 전체 목록(비노출 포함) — AdminNotices 로컬 state 초기값. TODO: GET /api/v1/admin/notices
export function getAdminNotices() {
  return NOTICE_MOCK_DATA;
}
// 정렬 헬퍼 위임(AdminNotices 로컬 CRUD 재정렬용). 로직 복제 금지.
export { sortNotices } from "../mocks/noticeMockData";

// ===== 알림 =====

// 벨·개인화 패널·useNotifications 훅 공용 소스. TODO: 실제 연동 시 GET /api/v1/notifications
export function getNotifications() {
  return notificationsByDate();
}

// ===== 조직(관계사·부서) — AdminOrg =====

// TODO: 실제 연동 시 GET /api/v1/admin/companies (Teams 조직도 API)
export function getOrgCompanies() {
  return INITIAL_COMPANIES;
}
// TODO: 실제 연동 시 GET /api/v1/admin/departments
export function getOrgDepts() {
  return INITIAL_DEPTS;
}
// 관계사 집계용 최소 투영. TODO: 실제 연동 시 GET /api/v1/admin/platform-items?fields=company
export function getAssetItemRefs() {
  return ASSET_ITEM_REFS;
}
// Teams 동기화 미리보기 원천. TODO: 실제 연동 시 GET /api/v1/admin/teams/org-preview
export function getTeamsSyncSource() {
  return TEAMS_SYNC_SOURCE;
}

// ===== 분류체계·자유 태그 — AdminTaxonomy =====

// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy?scope=platform
export function getCategoryTaxonomy() {
  return INITIAL_CATEGORY_TAXONOMY;
}
// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy/free-tags
export function getFreeTags() {
  return INITIAL_FREE_TAGS;
}
