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
//   [통계 위임] getStatsByScope · getDashboardData (lib/statsDerive 파생) · monthTotal ·
//               STAT_COMPANIES 재-export · orgCompanyName(조직 SSOT 재-export)
// ============================================================

import type { AssetItem, AssetReview, Post, ApprovalSlots } from "../types/categoryTypes";
import { CATEGORIES, deriveStage } from "../types/categoryTypes";
import type { ManagedAssetItem } from "../pages/admin/AdminProjectManage";
import { fromWorkflowDef } from "../components/WorkflowDiagram";
import {
  MOCK_ASSET_ITEMS,
  MOCK_REVIEWS_BY_ITEM,
  MOCK_POSTS_BY_ITEM,
  MOCK_N8N_WORKFLOW,
} from "../mocks/assetItemMockData";
import { INITIAL_ITEMS as REVIEW_QUEUE } from "../mocks/adminReviewMockData";
import { INITIAL_ITEMS as MY_APPLICATIONS, MOCK_MY_REVIEWS } from "../mocks/myStatusMockData";
import {
  scopedCompanies,
  deriveSourceTotal, deriveMonthly, deriveDomain, deriveDept, deriveDeptCount,
  deriveDifficulty, deriveCost, deriveMlType, deriveCompanyTotals, deriveNewThisMonth,
  deriveTimeSaved, deriveTagFrequency, deriveTopReviews,
} from "./statsDerive";
import type { SourceKey } from "./statsDerive";
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

// AdminDashboard 범위별 대시보드 데이터 (자산 SSOT·검토 큐·후기에서 파생). scope=null → 전사, 배열 → 해당 관계사(ownerCompany).
// TODO: 실제 연동 시 GET /api/v1/admin/stats/dashboard?company=:codes
export type DashboardPending = { id: string; title: string; dept: string; submittedAt: string; type: string; source: SourceKey; company: string; approvalSlots: ApprovalSlots };
export type DashboardApproved = { id: string; title: string; dept: string; approvedAt: string; source: SourceKey };
export function getDashboardData(scope: string[] | null) {
  const assets = MOCK_ASSET_ITEMS;
  const inScope = (co: string | undefined) => scope === null || (co != null && scope.includes(co));
  const scopedAssets = scope === null ? assets : assets.filter(i => inScope(i.ownerCompany));

  const sourceTotal = deriveSourceTotal(assets, scope);
  const monthly = deriveMonthly(assets, scope);
  const domain = deriveDomain(assets, scope);

  // 승인 대기 = 검토 큐 중 미종결(승인 대기·부분 승인) 항목을 등록 관계사(ownerCompany) 범위로 필터. 부분 승인 = 슬롯 하나만 완료.
  const catName = (k: SourceKey) => CATEGORIES.find(c => c.id === k)?.name ?? k;
  const pending: DashboardPending[] = REVIEW_QUEUE
    .filter(q => {
      const stage = deriveStage(q.approvalSlots, q.rejected, q.suspended);
      return inScope(q.ownerCompany) && (stage === "승인 대기" || stage === "부분 승인");
    })
    .map(q => ({ id: q.id, title: q.title, dept: q.dept, submittedAt: q.submittedAt, type: catName(q.kind), source: q.kind, company: q.ownerCompany, approvalSlots: q.approvalSlots }));
  const partialCount = pending.filter(p => p.approvalSlots.company.approved !== p.approvalSlots.global.approved).length;

  // 최근 승인 = 게시된 카탈로그(자산 SSOT) 최신 updatedAt 상위 4건. 검토 큐에는 승인 완료분이 없어 게시본에서 파생(승인 완료 = 게시 카드 ⊂ 카탈로그).
  const recentApproved: DashboardApproved[] = [...scopedAssets]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4)
    .map(i => ({ id: i.id, title: i.title, dept: i.dept, approvedAt: i.updatedAt, source: i.categoryId }));

  // 게시된 도구 = 범위 내 카탈로그 수 / 누적 후기 = 범위 내 카드의 실제 후기 수(ownerCompany 파생).
  const activeTools = scopedAssets.length;
  const reviewTotal = Object.entries(MOCK_REVIEWS_BY_ITEM).reduce((sum, [id, rs]) => {
    const item = assets.find(a => a.id === id);
    return sum + (item && inScope(item.ownerCompany) ? rs.length : 0);
  }, 0);
  const newThisMonth = deriveNewThisMonth(assets, scope);
  const companies = scopedCompanies(assets, scope);
  return { companies, sourceTotal, monthly, domain, pending, recentApproved, activeTools, reviewTotal, partialCount, newThisMonth };
}

// ===== 관리자 통계 =====

// AdminStatistics 범위별 통계 데이터 (자산 SSOT·후기에서 파생). 표시 전용 META 병합은 화면 프레젠테이션에서 처리.
// TODO: 실제 연동 시 GET /api/v1/admin/stats?company=:codes
export function getStatsByScope(scope: string[] | null) {
  const assets = MOCK_ASSET_ITEMS;
  return {
    companies: scopedCompanies(assets, scope),
    companyTotals: deriveCompanyTotals(assets),
    monthSeries: deriveMonthly(assets, scope),
    sourceTotal: deriveSourceTotal(assets, scope),
    domain: deriveDomain(assets, scope),
    difficultyCounts: deriveDifficulty(assets, scope),
    costCounts: deriveCost(assets, scope),
    mlTypeCounts: deriveMlType(assets, scope),
    dept: deriveDept(assets, scope),
    deptCount: deriveDeptCount(assets, scope),
    tagFreq: deriveTagFrequency(assets, scope),
    timeSaved: deriveTimeSaved(assets, scope),
    topReviews: deriveTopReviews(assets, MOCK_REVIEWS_BY_ITEM, scope),
    newThisMonth: deriveNewThisMonth(assets, scope),
  };
}

// 랜딩·통계 공용 "이번 달 신규"(전사 기준, createdAt 당월 실측). 로직 복제 금지 — statsDerive 위임.
// TODO: 실제 연동 시 GET /api/v1/stats/new-this-month?company=:codes 응답으로 교체
export function getMonthlyNewCount(scope: string[] | null = null): number {
  return deriveNewThisMonth(MOCK_ASSET_ITEMS, scope);
}

// 통계 파생 계층 재-export (화면·컴포넌트는 dataSource만 경유 — 로직 복제 금지).
// 관계사 표시명은 조직 SSOT orgCompanyName(하단)을 사용한다.
export { monthTotal, STAT_COMPANIES } from "./statsDerive";
export type { SourceKey, MonthPoint, TopReview } from "./statsDerive";

// ===== 관리자 카드 관리 =====

// 자산 SSOT(AssetItem) → 카드 관리 표시 모델(ManagedAssetItem) 파생 매핑.
// 별도 목업 사본을 두지 않고 getAssetItems()의 단일 소스에서 관리 화면 전용 필드로 투영한다.
// (owner/ownerEmail → 담당자 1인·신청자 이메일, tags 배열 → 쉼표 문자열, workflowDef → workflowInput 등)
// ⚠️ 실제 연동 시 이 데모 파생 매퍼는 폐기하고 admin 전용 응답을 그대로 사용한다(아래 getManagedAssetItems 참조).
function toManagedAssetItem(item: AssetItem): ManagedAssetItem {
  const company = item.company ?? [];
  return {
    kind: item.categoryId,
    id: item.id,
    title: item.title,
    dept: item.dept,
    summary: item.summary,
    description: item.description,
    contacts: [{ name: item.owner, dept: item.dept, role: "주담당자", email: item.ownerEmail }],
    updatedAt: item.updatedAt,
    createdByEmail: item.ownerEmail,
    tags: item.tags.join(", "),
    images: item.images,
    domain: item.domain,
    company,
    // 등록 주체 관계사 — 관리 화면 "등록 관계사" 배지용(노출 범위 company와 별개 축, ADM-02).
    // SSOT ownerCompany 우선, 미보유 시 company 첫 요소로 폴백.
    ownerCompany: item.ownerCompany ?? company[0],
    companyScope: company.length > 0 ? "specific" : "company-wide",
    // n8n / pa
    expectedTimeSaved: item.expectedTimeSaved,
    difficulty: item.difficulty,
    workflowInput: item.workflowDef ? fromWorkflowDef(item.workflowDef) : undefined,
    // assistant
    sharedPrompt: item.sharedPrompt,
    basedModel: item.basedModel,
    // ai-orchestration (모델 접속 URL은 specificUrl)
    agentAvailability: item.agentAvailability,
    strengthsDetail: item.modelMeta?.strengthsDetail,
    specificUrl: item.specificUrl,
    modelName: item.modelMeta?.modelName,
    contextWindow: item.modelMeta?.contextWindow,
    costTier: item.modelMeta?.costTier,
    // ml
    mlType: item.mlType,
    trainingDataDesc: item.trainingDataDesc,
    devTool: item.devTool,
  };
}

// AdminProjectManage 게시 항목 전체 (자산 SSOT 파생). TODO: 실제 연동 시 GET /api/v1/admin/platform-items
export function getManagedAssetItems(): ManagedAssetItem[] {
  return MOCK_ASSET_ITEMS.map(toManagedAssetItem);
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
// 관계사 코드 → 표시명(조직 SSOT 파생). 관리자 배지·Navbar 소속 표기 공용. 로직 복제 금지.
export { orgCompanyName } from "../mocks/adminOrgMockData";
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
