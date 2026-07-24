// ============================================================
// AdminDashboard 화면 고유 mock 데이터 (DEMO 전용) — 단일 소스(SSOT)
// ------------------------------------------------------------
// AdminDashboard(/admin)가 lib/dataSource.ts(getDashboardData)를 경유해
// 이 한 곳을 참조한다.
// 관계사 차원 통계·범위 집계 헬퍼는 statsMockData.ts에 있으며 dataSource가 합성한다.
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//   GET /api/v1/admin/stats/dashboard — 승인 대기·최근 승인·게시 도구 수·후기 수
// ============================================================

import type { ApprovalSlots } from "../types/categoryTypes";
import type { SourceKey, StatCompany } from "./statsMockData";

// 병렬 2슬롯 승인 상태 더미 (company/global). 두 슬롯 모두 미승인=승인 대기, 하나만=부분 승인.
const slots = (company: boolean, global: boolean): ApprovalSlots => ({ company: { approved: company }, global: { approved: global } });

export type PendingItem = { id: string; title: string; dept: string; submittedAt: string; type: string; source: SourceKey; company: StatCompany; approvalSlots: ApprovalSlots };
export const PENDING_ALL: PendingItem[] = [
  { id: "N8N-2026-031", title: "재고 알림 자동화 워크플로우", dept: "구매팀", submittedAt: "2026.06.02", type: "n8n 워크플로우", source: "n8n", company: "KKM", approvalSlots: slots(false, false) },
  { id: "AST-2026-018", title: "계약서 요약 비서", dept: "법무팀", submittedAt: "2026.06.03", type: "나만의 비서", source: "assistant", company: "KBH", approvalSlots: slots(true, false) },
  { id: "PA-2026-012", title: "월별 경비 승인 자동화 흐름", dept: "재무팀", submittedAt: "2026.06.04", type: "Power Automate 흐름", source: "pa", company: "KMG", approvalSlots: slots(false, false) },
  { id: "AIO-2026-012", title: "GPT-5.4 Mini", dept: "IT개발팀", submittedAt: "2026.06.05", type: "AI Model", source: "ai-orchestration", company: "HC", approvalSlots: slots(false, true) },
  { id: "ML-2026-006", title: "불량품 분류 ML 모델", dept: "품질관리팀", submittedAt: "2026.06.06", type: "ML 모델", source: "ml", company: "KKM", approvalSlots: slots(false, false) },
];

export type ApprovedItem = { id: string; title: string; dept: string; approvedAt: string; source: SourceKey; company: StatCompany };
export const RECENT_APPROVED_ALL: ApprovedItem[] = [
  { id: "AIO-2026-013", title: "Claude Sonnet 5", dept: "메이크업연구소", approvedAt: "2026.05.31", source: "ai-orchestration", company: "KKM" },
  { id: "N8N-2026-029", title: "일일 매출 리포트 자동 발송", dept: "재무팀", approvedAt: "2026.05.29", source: "n8n", company: "KBH" },
  { id: "PA-2026-009", title: "신규 입사자 IT 장비 신청 흐름", dept: "인사팀", approvedAt: "2026.05.28", source: "pa", company: "HC" },
  { id: "VIBE-2026-007", title: "주간 보고서 초안 생성 도구", dept: "경영지원팀", approvedAt: "2026.05.27", source: "vibe", company: "KKM" },
];

export const ACTIVE_TOOLS_BY_COMPANY: Record<StatCompany, number> = {
  KKM: 44, KBH: 14, HC: 10, KMG: 8, KMW: 4, KUS: 2, KBT: 2,
};

// 누적 활용 후기 — 관계사별 더미 (합 47 = 기존 전사 표기와 일치). TODO: 백엔드 연동 시 폐기.
export const REVIEW_COUNT_BY_COMPANY: Record<StatCompany, number> = {
  KKM: 22, KBH: 9, HC: 6, KMG: 5, KMW: 2, KUS: 2, KBT: 1,
};
