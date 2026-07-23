// ===== mocks/notificationMockData.ts =====
// 알림 목업 단일 소스(SSOT). 벨(NotificationBell)·개인화 패널 "알림 현황"이 모두 이 배열을 참조하고,
// 읽음 상태는 useNotifications가 localStorage "ax_notifications_read"와 병합해 파생한다.
// TODO: 실제 연동 시 GET /api/v1/notifications 응답으로 교체(서버 발급 id·서버 read 상태).
//
// 병렬 2슬롯 승인이 드러나는 예시를 포함한다("한국콜마 관리자 승인 완료 — 전사 승인 대기 중").

import type { AxNotification } from "../types/notificationTypes";

export const NOTIFICATION_MOCK_DATA: AxNotification[] = [
  {
    id: "NOTI-2026-001",
    kind: "관계사승인",
    title: "한국콜마 관리자 승인 완료 — 전사 승인 대기 중",
    body: "「신규 입사자 계정 자동 생성」의 관계사 슬롯이 승인되었습니다. 전사 관리자 승인이 완료되면 게시됩니다.",
    date: "2026.07.22",
    read: false,
    itemId: "N8N-2026-001",
  },
  {
    id: "NOTI-2026-002",
    kind: "전사승인",
    title: "전사 관리자 승인 완료 — 게시되었습니다",
    body: "「회의록 요약 봇」이 관계사·전사 승인을 모두 통과해 게시되었습니다.",
    date: "2026.07.21",
    read: false,
    itemId: "AST-2026-002",
  },
  {
    id: "NOTI-2026-003",
    kind: "전사승인",
    title: "전사 관리자 승인 완료 — 관계사 승인 대기 중",
    body: "「계약 만료 사전 알림 플로우」의 전사 슬롯이 승인되었습니다. 관계사 관리자 승인이 완료되면 게시됩니다.",
    date: "2026.07.20",
    read: false,
    itemId: "PA-2026-005",
  },
  {
    id: "NOTI-2026-004",
    kind: "반려",
    title: "등록 신청이 반려되었습니다",
    body: "반려 사유: 담당자 연락처가 누락되었습니다. 담당자 정보를 보완해 재신청해 주세요.",
    date: "2026.07.19",
    read: false,
    itemId: "VIBE-2026-001",
  },
  {
    id: "NOTI-2026-005",
    kind: "신청접수",
    title: "등록 신청이 접수되었습니다",
    body: "「판매 채널별 수요 예측 모델」 등록 신청이 접수되어 승인 대기 중입니다.",
    date: "2026.07.18",
    read: true,
    itemId: "ML-2026-005",
  },
  {
    id: "NOTI-2026-006",
    kind: "후기등록",
    title: "내 항목에 새 활용 후기가 등록되었습니다",
    body: "「법무 검토 보조 봇」에 활용 후기 1건이 등록되었습니다.",
    date: "2026.07.17",
    read: true,
    itemId: "AST-2026-001",
  },
  {
    id: "NOTI-2026-007",
    kind: "게시판글",
    title: "「Outlook 긴급 메일 자동 전달」에 새 글이 등록되었습니다",
    body: "업데이트 & 논의에 Q&A 1건이 등록되었습니다.",
    date: "2026.07.16",
    read: true,
    itemId: "N8N-2026-005",
  },
  {
    id: "NOTI-2026-008",
    kind: "수정요청처리",
    title: "수정 요청이 반영되었습니다",
    body: "「일일 매출 리포트 자동 발송」 수정 요청이 검토 후 게시본에 반영되었습니다.",
    date: "2026.07.15",
    read: true,
    itemId: "N8N-2026-003",
  },
];

// 최신순(날짜 내림차순) 정렬본 — 벨·패널 공용. 목업 id 순서와 일치하나 방어적으로 정렬.
export const notificationsByDate = (): AxNotification[] =>
  [...NOTIFICATION_MOCK_DATA].sort((a, b) => b.date.localeCompare(a.date));
