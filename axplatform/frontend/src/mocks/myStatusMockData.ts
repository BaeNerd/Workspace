// ============================================================
// MyStatusPage 내 신청·내 후기 공용 mock 데이터 (DEMO 전용) — 단일 소스(SSOT)
// ------------------------------------------------------------
// MyStatusPage(/my-status)가 lib/dataSource.ts(getMyApplications·getMyReviews)를
// 경유해 이 한 곳을 참조한다.
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//   GET /api/v1/projects/mine — INITIAL_ITEMS (내 신청)
//   GET /api/v1/reviews/mine  — MOCK_MY_REVIEWS (내 후기)
// ============================================================

import { LEGACY_APPROVAL_MAP, type ApprovalSlots } from "../types/categoryTypes";
import type { AssetReview } from "../types/categoryTypes";
import type { MyItem } from "../pages/MyStatusPage";

// 레거시 stage → 슬롯 초기값(항목별 독립 객체) 구성
const legacyMy = (stage: string): { approvalSlots: ApprovalSlots; rejected: boolean; suspended: boolean } => {
  const m = LEGACY_APPROVAL_MAP[stage];
  return {
    approvalSlots: { company: { ...m.slots.company }, global: { ...m.slots.global } },
    rejected: m.rejected, suspended: m.suspended,
  };
};

// TODO: 실제 연동 시 GET /api/v1/projects/mine 응답으로 교체
export const INITIAL_ITEMS: MyItem[] = [
  {
    id: "N8N-2026-012", kind: "n8n",
    title: "신규 입사자 계정 자동 생성",
    summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성하는 n8n 워크플로우",
    submittedAt: "2026.02.10", updatedAt: "2026.02.14",
    ...legacyMy("게시됨"),
    rejectionReason: null,
    difficulty: "보통", expectedTimeSaved: "주 2시간",
  },
  {
    id: "AST-2026-021", kind: "assistant",
    title: "원료 성분 규제 문의 봇",
    summary: "원료 MSDS·규제 데이터를 자연어로 검색하는 HK GPT 커스텀 봇",
    submittedAt: "2026.05.06", updatedAt: "2026.05.09",
    ...legacyMy("2차대기"), // 관계사 관리자 승인 완료 · 전사 대기 → 부분 승인
    rejectionReason: null,
    basedModel: "Claude Opus 4.8",
  },
  {
    id: "AIO-2026-004", kind: "ai-orchestration",
    title: "Claude Sonnet 4.6",
    summary: "일상 업무의 기본기가 균형 잡힌 모델 — 문서 요약·회의록 정리에 강함",
    submittedAt: "2026.06.03", updatedAt: "2026.06.05",
    ...legacyMy("2차대기"), // 부분 승인
    rejectionReason: null,
    agentAvailability: "사용 가능", costTier: "보통",
  },
  {
    id: "PA-2026-015", kind: "pa",
    title: "신제품 출시 승인 자동화 플로우",
    summary: "신제품 등록 시 관련 부서 승인을 Power Automate로 자동화",
    submittedAt: "2026.06.01", updatedAt: "2026.06.01",
    ...legacyMy("1차대기"), // 승인 대기
    rejectionReason: null,
    expectedTimeSaved: "월 4시간",
  },
  {
    id: "ETC-2026-001", kind: "etc",
    title: "사내 뉴스 한눈에 요약 미니 프로젝트",
    summary: "매일 아침 사내 공지·업계 뉴스를 한 장으로 요약하는 개인 사이드 프로젝트",
    submittedAt: "2026.05.28", updatedAt: "2026.05.28",
    ...legacyMy("1차대기"), // 승인 대기
    rejectionReason: null,
  },
  {
    id: "ML-2026-009", kind: "ml",
    title: "색차 불량 이미지 분류 모델",
    summary: "분광측색계 이미지를 분석해 색차 불량 여부를 자동 판정하는 ML 모델",
    submittedAt: "2026.05.20", updatedAt: "2026.05.22",
    ...legacyMy("반려"),
    rejectionReason: "유사한 기능의 ML 모델이 이미 운영 중입니다(ML-2026-001). 해당 모델 담당자와 협의 후 개선 방향을 명확히 하여 재제출해 주세요.",
    mlType: "이미지 인식",
  },
];

// TODO: 실제 연동 시 GET /api/v1/reviews/mine 응답으로 교체
export const MOCK_MY_REVIEWS: AssetReview[] = [
  {
    id: "mr1", itemId: "N8N-2026-001", itemTitle: "신규 입사자 계정 자동 생성",
    itemKind: "n8n", author: "나", dept: "IT인프라팀",
    text: "입사자 계정 생성 시간이 1시간에서 5분으로 줄었습니다. 현업 부서 만족도가 매우 높습니다.",
    createdAt: "2026.06.10", likes: 8,
  },
  {
    id: "mr2", itemId: "AST-2026-001", itemTitle: "법무 검토 보조 봇",
    itemKind: "assistant", author: "나", dept: "IT인프라팀",
    text: "영문 계약서 리뷰 시간이 절반으로 줄었어요. 사소한 오류도 잘 잡아줍니다.",
    createdAt: "2026.06.20", likes: 5,
  },
];
