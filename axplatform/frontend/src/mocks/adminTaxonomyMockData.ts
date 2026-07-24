// ============================================================
// AdminTaxonomy 분류체계·자유 태그 공용 mock 데이터 (DEMO 전용) — 단일 소스(SSOT)
// ------------------------------------------------------------
// AdminTaxonomy(/admin/taxonomy)가 lib/dataSource.ts를 경유해 이 한 곳을 참조한다.
// (구 AdminTaxonomy 내장 배열 이관 — 식별자명 유지.)
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//   GET /api/v1/admin/taxonomy?scope=platform  — INITIAL_CATEGORY_TAXONOMY
//   GET /api/v1/admin/taxonomy/free-tags       — INITIAL_FREE_TAGS
// ============================================================

import { BUSINESS_DOMAINS } from "../types/categoryTypes";
import type { Category, FreeTag } from "../pages/admin/AdminTaxonomy";

// ===== AX 플랫폼 분류체계 =====
// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy?scope=platform 응답으로 교체
export const INITIAL_CATEGORY_TAXONOMY: Record<string, Category> = {
  businessDomain: {
    label: "업무 도메인",
    desc: "AX 플랫폼 항목에 배정되는 업무 도메인 분류. 단일 선택. 등록 시 선택 가능한 값 목록을 관리한다.",
    type: "single",
    items: [...BUSINESS_DOMAINS],
  },
  difficulty: {
    label: "구성 난이도",
    desc: "n8n 등록 시 선택하는 난이도 등급. 단일 선택. n8n 전용. (PA·나만의 비서·AI Model·ML·Vibe·AI 프로젝트 에는 적용되지 않는다)",
    type: "single",
    items: ["쉬움", "보통", "어려움"],
  },
  costTier: {
    label: "비용 등급",
    desc: "AI Model 등록 시 선택하는 비용 등급. 단일 선택. AI Model 전용.",
    type: "single",
    items: ["낮음", "보통", "높음"],
  },
  mlTypes: {
    label: "ML 모델 유형",
    desc: "ML 모델 등록 시 사용하는 모델 유형 분류. 단일 선택. ML 전용.",
    type: "single",
    items: ["분류 (Classification)", "회귀 (Regression)", "클러스터링", "NLP / 텍스트", "이미지 인식", "시계열 예측", "추천 시스템", "이상 탐지", "강화학습", "멀티모달"],
  },
};

// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy/free-tags 응답으로 교체
export const INITIAL_FREE_TAGS: FreeTag[] = [
  {
    tag: "재고관리", count: 2, proposedBy: "김도윤", dept: "생산본부", sourceKind: "n8n",
    sourceItems: [
      { id: "N8N-2026-033", kind: "n8n", title: "재고 임계치 도달 시 Teams 알림" },
      { id: "N8N-2026-011", kind: "n8n", title: "재고 입출고 자동 집계" },
    ],
  },
  {
    tag: "결재자동화", count: 1, proposedBy: "최유진", dept: "구매팀", sourceKind: "pa",
    sourceItems: [{ id: "PA-2026-014", kind: "pa", title: "구매 결재 자동 승인 플로우" }],
  },
  {
    tag: "신제품기획", count: 1, proposedBy: "한지민", dept: "마케팅팀", sourceKind: "assistant",
    sourceItems: [{ id: "AST-2026-020", kind: "assistant", title: "신제품 기획서 초안 작성 도우미" }],
  },
  {
    tag: "온프레미스보안", count: 1, proposedBy: "정태영", dept: "IT개발팀", sourceKind: "ai-orchestration",
    sourceItems: [{ id: "AIO-2026-016", kind: "ai-orchestration", title: "Llama 3" }],
  },
  {
    tag: "이미지분류", count: 1, proposedBy: "오승현", dept: "연구개발본부", sourceKind: "ml",
    sourceItems: [{ id: "ML-2026-008", kind: "ml", title: "성분 이미지 품질 분류 모델" }],
  },
  {
    tag: "AI페어프로그래밍", count: 1, proposedBy: "이상민", dept: "IT개발팀", sourceKind: "vibe",
    sourceItems: [{ id: "VIBE-2026-009", kind: "vibe", title: "Cursor 기반 내부 API 자동 생성" }],
  },
  {
    tag: "AI뉴스", count: 1, proposedBy: "한지민", dept: "DX추진팀", sourceKind: "etc",
    sourceItems: [{ id: "ETC-2026-002", kind: "etc", title: "사내 AI 뉴스 주간 요약 미니 프로젝트" }],
  },
];
