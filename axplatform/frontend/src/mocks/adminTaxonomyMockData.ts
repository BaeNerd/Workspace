// ============================================================
// AdminTaxonomy 분류체계·자유 태그 공용 mock 데이터 (DEMO 전용) — 단일 소스(SSOT)
// ------------------------------------------------------------
// AdminTaxonomy(/admin/taxonomy)가 lib/dataSource.ts를 경유해 이 한 곳을 참조한다.
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//   GET /api/v1/admin/taxonomy?scope=platform  — INITIAL_CATEGORY_TAXONOMY
//   GET /api/v1/admin/taxonomy/free-tags       — INITIAL_FREE_TAGS
// ============================================================

import { BUSINESS_DOMAINS, ML_TYPES } from "../types/categoryTypes";
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
    items: [...ML_TYPES],
  },
};

// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy/free-tags 응답으로 교체
// ⚠️ sourceItems·count 정합 규칙: 각 태그는 SSOT(assetItemMockData) 실존 항목만 참조하고,
//    count는 SSOT tags에 해당 태그를 실제 보유한 항목 수와 일치한다.
//    SSOT에 보유 항목이 없던 기존 유령 태그(결재자동화·신제품기획·온프레미스보안·AI페어프로그래밍·AI뉴스)는
//    각 출처 유형의 실존 태그로 대체해 실체화했다(7개 출처 유형 커버리지 유지).
export const INITIAL_FREE_TAGS: FreeTag[] = [
  {
    tag: "재고관리", count: 2, proposedBy: "김도윤", dept: "생산본부", sourceKind: "n8n",
    sourceItems: [
      { id: "N8N-2026-006", kind: "n8n", title: "주간 재고 현황 자동 취합" },
      { id: "PA-2026-004", kind: "pa", title: "재고 부족 알림 자동화" },
    ],
  },
  {
    tag: "전자결재", count: 1, proposedBy: "최유진", dept: "구매팀", sourceKind: "pa",
    sourceItems: [{ id: "PA-2026-001", kind: "pa", title: "결재 문서 SharePoint 자동 저장" }],
  },
  {
    tag: "문서작성", count: 1, proposedBy: "한지민", dept: "마케팅팀", sourceKind: "assistant",
    sourceItems: [{ id: "AST-2026-005", kind: "assistant", title: "영업 제안서 초안 봇" }],
  },
  {
    tag: "오픈소스", count: 1, proposedBy: "정태영", dept: "IT개발팀", sourceKind: "ai-orchestration",
    sourceItems: [{ id: "AIO-2026-011", kind: "ai-orchestration", title: "DeepSeek R2" }],
  },
  {
    tag: "이미지분류", count: 1, proposedBy: "오승현", dept: "연구개발본부", sourceKind: "ml",
    sourceItems: [{ id: "ML-2026-003", kind: "ml", title: "불량품 이미지 분류 모델" }],
  },
  {
    tag: "Python", count: 2, proposedBy: "이상민", dept: "IT개발팀", sourceKind: "vibe",
    sourceItems: [
      { id: "VIBE-2026-002", kind: "vibe", title: "원가 분석 자동화 스크립트" },
      { id: "VIBE-2026-003", kind: "vibe", title: "부서별 KPI 현황판 자동화" },
    ],
  },
  {
    tag: "사이드프로젝트", count: 1, proposedBy: "한지민", dept: "DX추진팀", sourceKind: "etc",
    sourceItems: [{ id: "ETC-2026-001", kind: "etc", title: "사내 뉴스 한눈에 요약 미니 프로젝트" }],
  },
];
