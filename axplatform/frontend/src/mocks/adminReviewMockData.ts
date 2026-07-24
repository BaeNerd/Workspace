// ============================================================
// AdminReview 검토 대기 큐 공용 mock 데이터 (DEMO 전용) — 단일 소스(SSOT)
// ------------------------------------------------------------
// AdminReview(/admin/review)가 lib/dataSource.ts(getReviewQueue)를 경유해
// 이 한 곳을 참조한다. (구 AdminReview.INITIAL_ITEMS 이관 — 식별자명 유지.)
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//   GET /api/v1/admin/review-queue — INITIAL_ITEMS (검토 대기 큐)
// ============================================================

import { LEGACY_APPROVAL_MAP, type ApprovalSlots } from "../types/categoryTypes";
import type { ReviewItem } from "../pages/admin/AdminReview";

// 인라인 SVG 플레이스홀더 (네트워크 비의존)
const placeholderImage = (label: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='640' height='360' fill='#F1F5F9'/><rect x='1' y='1' width='638' height='358' fill='none' stroke='${color}' stroke-width='2'/><text x='320' y='188' font-family='sans-serif' font-size='24' fill='${color}' text-anchor='middle'>${label}</text></svg>`
  )}`;

// 레거시 stage → 슬롯 초기값(항목별 독립 객체) 구성
const legacy = (stage: string): { approvalSlots: ApprovalSlots; rejected: boolean; suspended: boolean } => {
  const m = LEGACY_APPROVAL_MAP[stage];
  return {
    approvalSlots: { company: { ...m.slots.company }, global: { ...m.slots.global } },
    rejected: m.rejected, suspended: m.suspended,
  };
};

// TODO: 실제 연동 시 GET /api/v1/admin/review-queue 응답으로 교체
export const INITIAL_ITEMS: ReviewItem[] = [
  {
    kind: "n8n",
    id: "N8N-2026-014", title: "협력사 정산서 자동 검증",
    summary: "협력사가 제출한 정산서를 ERP 데이터와 자동 대조",
    description: "매월 말 협력사로부터 수신되는 정산서를 ERP 발주 데이터와 자동으로 대조하여 불일치 항목을 표시합니다.",
    dept: "구매팀", submittedBy: "박성훈", submittedAt: "2026.06.20",
    images: [placeholderImage("워크플로우 개요", "#EA580C"), placeholderImage("실행 로그", "#059669")],
    expectedTimeSaved: "월 4시간", difficulty: "보통",
    itemTags: "정산, 구매자동화", domain: "재무",
    workflowInput: { status: "Active", nodes: [
      { label: "Schedule Trigger", type: "trigger" },
      { label: "ERP API 조회", type: "action" },
      { label: "정산서 파싱", type: "action" },
      { label: "불일치 항목 확인", type: "condition" },
      { label: "Teams 알림 발송", type: "output" },
    ]},
    company: [], companyScope: "company-wide",
    contacts: [{ name: "박성훈", dept: "구매팀", role: "주담당자", email: "sunghoon.park@kolmar.co.kr" }],
    ...legacy("1차대기"), approvalHistory: [],
  },
  {
    kind: "pa",
    id: "PA-2026-014", title: "구매 결재 자동 승인 플로우",
    summary: "SharePoint 양식 기반 구매 결재 자동 처리",
    description: "구매팀이 SharePoint에 제출한 결재 요청을 Power Automate가 ERP 데이터와 대조 후 자동 승인·반려합니다.",
    dept: "구매팀", submittedBy: "최유진", submittedAt: "2026.06.25",
    expectedTimeSaved: "주 3시간",
    itemTags: "결재, 구매자동화", domain: "재무",
    company: [], companyScope: "company-wide",
    contacts: [{ name: "최유진", dept: "구매팀", role: "주담당자", email: "yujin.choi@kolmar.co.kr" }],
    ...legacy("1차대기"), approvalHistory: [],
  },
  {
    kind: "assistant",
    id: "AST-2026-011", title: "해외법인 계약서 1차 검토 비서",
    summary: "해외법인向 영문 계약서의 주요 리스크 조항을 1차 스크리닝",
    description: "미국콜마·북경콜마 등 해외법인에서 체결하는 영문 계약서의 주요 조항을 1차로 스크리닝하여 법무팀 검토 시간을 단축합니다.",
    dept: "법무팀", submittedBy: "강현우", submittedAt: "2026.06.22",
    sharedPrompt: "당신은 해외법인 계약서를 검토하는 법무 담당자입니다. 업로드된 영문 계약서에서 위험 조항을 찾아 한국어로 요약해 주세요.",
    basedModel: "Claude Opus 4.8",
    itemTags: "계약서, 법무, 해외법인", domain: "IT",
    company: [], companyScope: "company-wide",
    contacts: [{ name: "강현우", dept: "법무팀", role: "주담당자", email: "hyunwoo.kang@kolmar.co.kr" }],
    ...legacy("2차대기"), approvalHistory: [
      { slot: "company", action: "승인", at: "2026.06.24", by: "최관리 (관계사관리자)" },
    ],
  },
  {
    kind: "ai-orchestration",
    id: "AIO-2026-015", title: "GPT-4o",
    summary: "전사 직원 누구나 사용할 수 있는 범용 업무 보조 모델",
    description: "이메일 작성, 보고서 초안, 데이터 요약 등 범용 업무에 적합합니다. 제공사는 OpenAI입니다.",
    dept: "IT개발팀", submittedBy: "정태영", submittedAt: "2026.06.24",
    agentAvailability: "사용 가능",
    strengthsDetail: "다양한 업무를 무난하게 처리합니다. 이메일 초안, 보고서 요약, 간단한 데이터 정리에 활용해보세요.",
    modelName: "GPT-4o", contextWindow: "문서 여러 장 (수십 페이지)", costTier: "보통",
    specificUrl: "https://ai-gateway.kolmar.co.kr/models/gpt-4o",
    itemTags: "범용, 업무보조",
    company: [], companyScope: "company-wide",
    contacts: [{ name: "정태영", dept: "IT개발팀", role: "주담당자", email: "taeyoung.jung@kolmar.co.kr" }],
    ...legacy("1차대기"), approvalHistory: [],
  },
  {
    kind: "ml",
    id: "ML-2026-008", title: "성분 이미지 품질 분류 모델",
    summary: "원료 이미지 기반 품질 합격/불합격 자동 판정",
    description: "YOLOv8 기반 이미지 분류 모델로 생산 라인에서 촬영한 원료 이미지를 실시간 분석합니다.",
    dept: "IT개발팀", submittedBy: "오승현", submittedAt: "2026.06.26",
    mlType: "이미지 인식", trainingDataDesc: "내부 품질 검사 이미지 1만장", devTool: "PyTorch",
    itemTags: "품질관리, 이미지분류", domain: "생산",
    company: [], companyScope: "company-wide",
    contacts: [{ name: "오승현", dept: "IT개발팀", role: "주담당자", email: "seunghyun.oh@kolmar.co.kr" }],
    ...legacy("1차대기"), approvalHistory: [],
  },
  {
    kind: "etc",
    id: "ETC-2026-002", title: "사내 AI 뉴스 주간 요약 미니 프로젝트",
    summary: "매주 사내에 공유되는 AI 트렌드 뉴스레터를 블로그 형식으로 소개",
    description: "사내 구성원이 AI 동향을 쉽게 접할 수 있도록 매주 주요 뉴스와 활용 사례를 정리해 공유하는 소규모 프로젝트입니다.",
    dept: "DX추진팀", submittedBy: "한지민", submittedAt: "2026.06.28",
    itemTags: "뉴스레터, AI트렌드", domain: "IT",
    company: [], companyScope: "company-wide",
    contacts: [{ name: "한지민", dept: "DX추진팀", role: "주담당자", email: "jimin.han@kolmar.co.kr" }],
    ...legacy("1차대기"), approvalHistory: [],
  },
];
