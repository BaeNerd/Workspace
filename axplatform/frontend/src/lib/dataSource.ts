// ============================================================
// 자산 도메인 데이터 접근 계층 (동기, DEMO)
// ------------------------------------------------------------
// 페이지는 mocks/assetItemMockData를 직접 import하지 않고 이 계층만 경유한다.
// ⭐ 이 파일이 목업 → 실서버 전환의 "유일한 교체 지점"이다. 백엔드 연동 시
//    mocks 배열을 삭제하고 아래 함수 본문만 실제 API 호출로 바꾸면 된다.
//    (동기 시그니처 → 비동기 전환·로딩 상태 도입은 실제 연동 시로 유보 — 확정 방침.)
//
// ※ 이번 세션 범위: 자산 도메인 함수만. 기존 mocks 4종
//    (notice·notification·stats·companyAdmin)의 계층 편입은 M2에서 진행.
// ============================================================

import type { AssetItem, AssetReview, Post } from "../types/categoryTypes";
import {
  MOCK_ASSET_ITEMS,
  MOCK_REVIEWS_BY_ITEM,
  MOCK_POSTS_BY_ITEM,
  MOCK_N8N_WORKFLOW,
} from "../mocks/assetItemMockData";

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
