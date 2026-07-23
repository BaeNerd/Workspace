// ============================================================
// 공지사항·업데이트 소식 공용 mock 데이터 (DEMO 전용) — 단일 소스(SSOT)
// ------------------------------------------------------------
// LandingPage 최신소식 섹션 · NoticesPage(/notices) · AdminNotices(/admin/notices)가
// 이 한 곳을 참조한다. (LandingPage의 옛 LATEST_NEWS 정적 정의를 대체 — 중복 정의 금지.)
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//   GET /api/v1/notices           — visibleNoticesByKind가 모사(공개 목록)
//   GET /api/v1/admin/notices     — 관리자 전체 목록(비노출 포함)
// AdminNotices는 이 배열을 초기값으로 로컬 state에 로드해 작성/수정/삭제를 재현한다
// (AdminCategories가 CATEGORIES를 로드하는 것과 동일 패턴).
// ============================================================

import type { Notice, NoticeKind } from "../types/noticeTypes";

// 초기 목업 — 게시일 내림차순. pinned 항목은 정렬 헬퍼가 상단으로 끌어올린다.
// TODO: 실제 연동 시 GET /api/v1/admin/notices 응답으로 교체.
export const NOTICE_MOCK_DATA: Notice[] = [
  {
    id: "NOTICE-2026-001",
    kind: "공지사항",
    title: "AX 플랫폼 정기 점검 안내",
    body: "안정적인 서비스 제공을 위해 매월 둘째 주 토요일 02:00~05:00 정기 점검을 실시합니다. 점검 시간 동안 항목 등록·탐색 기능 이용이 일시 제한될 수 있습니다.",
    date: "2026.07.10",
    pinned: true,
    visible: true,
  },
  {
    id: "NOTICE-2026-002",
    kind: "공지사항",
    title: "항목 등록 가이드라인 개정 안내",
    body: "등록 항목의 품질을 높이기 위해 제목·요약 작성 기준과 대표 이미지 권장 규격을 개정했습니다. 신규 등록 시 개정된 가이드라인을 참고해 주세요.",
    date: "2026.07.03",
    pinned: false,
    visible: true,
  },
  {
    id: "NOTICE-2026-003",
    kind: "공지사항",
    title: "AI Agent 카탈로그 모델 업데이트 안내",
    body: "AI Agent 카탈로그에 최신 모델이 추가되고 일부 모델의 설명·강점 정보가 갱신되었습니다. 카탈로그에서 업무에 맞는 모델을 확인해 보세요.",
    date: "2026.06.25",
    pinned: false,
    visible: true,
  },
  {
    id: "NOTICE-2026-004",
    kind: "업데이트",
    title: "n8n 자동화 워크플로우 30종 추가",
    body: "부서별 반복 업무를 줄여 줄 n8n 자동화 워크플로우 30종이 새로 등록되었습니다. 탐색 화면에서 카테고리를 n8n으로 필터링해 살펴보세요.",
    date: "2026.06.18",
    pinned: false,
    visible: true,
  },
  {
    id: "NOTICE-2026-005",
    kind: "업데이트",
    title: "모바일 화면 UI 개선",
    body: "모바일 환경에서 목록·카드 레이아웃과 터치 영역을 개선했습니다. 작은 화면에서도 항목을 더 편하게 탐색할 수 있습니다.",
    date: "2026.06.05",
    pinned: false,
    visible: true,
  },
];

// 정렬 규칙 — pinned 우선, 그다음 게시일 최신순.
// 날짜 문자열이 "YYYY.MM.DD" 고정 폭이라 사전식 비교가 곧 날짜 비교와 일치.
export const sortNotices = (list: Notice[]): Notice[] =>
  [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.date.localeCompare(a.date);
  });

// 공개 목록(visible=true) 중 특정 종류만 정렬해 반환 — 랜딩·/notices 공용.
// TODO: 실제 연동 시 GET /api/v1/notices?kind=:kind 응답으로 교체.
export const visibleNoticesByKind = (kind: NoticeKind): Notice[] =>
  sortNotices(NOTICE_MOCK_DATA.filter(n => n.visible && n.kind === kind));
