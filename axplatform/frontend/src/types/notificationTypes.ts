// ===== types/notificationTypes.ts =====
// 알림(Notification) 도메인 타입. 공지 알림은 없다(확정) — 알림은 "내 활동"에 대한 개인 통지만 다룬다.
// 병렬 2슬롯 승인(관계사·전사)을 kind·문구로 구분한다(§승인 흐름 참조).

// 알림 종류 7종
//  - "신청접수"       : 등록 신청이 접수됨
//  - "관계사승인"     : 관계사(company) 슬롯 승인 (1/2) — 다른 슬롯 대기 문구로 병렬성 노출
//  - "전사승인"       : 전사(global) 슬롯 승인 (1/2) 또는 두 슬롯 완료 게시(2/2) — title/body 문구로 구분
//  - "반려"           : 승인 반려 (사유 body 포함)
//  - "후기등록"       : 내 항목에 활용 후기가 등록됨
//  - "게시판글"       : 내 항목의 "업데이트 & 논의"에 새 글이 등록됨
//  - "수정요청처리"   : 내 수정 요청이 처리(반영/보류)됨
export type NotificationKind =
  | "신청접수"
  | "관계사승인"
  | "전사승인"
  | "반려"
  | "후기등록"
  | "게시판글"
  | "수정요청처리";

export type AxNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;        // 반려 사유·부가 설명 등
  date: string;         // "YYYY.MM.DD"
  read: boolean;        // 목업 시드 기본값. 실제 읽음 여부는 useNotifications가 localStorage와 병합해 파생.
  itemId?: string;      // 연결 항목 (클릭 시 상세로 이동). 형식 {PREFIX}-{YYYY}-{NNN}
};

// 종류별 배지 라벨·색상 (벨 드롭다운·패널 공용)
export const NOTIFICATION_KIND_STYLE: Record<NotificationKind, { label: string; bg: string; fg: string }> = {
  "신청접수":     { label: "신청 접수", bg: "#EEF2FF", fg: "#4338CA" },
  "관계사승인":   { label: "관계사 승인", bg: "#FBEEE4", fg: "#B4602E" },
  "전사승인":     { label: "전사 승인", bg: "#E6F5EC", fg: "#1F7A46" },
  "반려":         { label: "반려", bg: "#FEE2E2", fg: "#991B1B" },
  "후기등록":     { label: "후기", bg: "#FEF3C7", fg: "#92400E" },
  "게시판글":     { label: "게시판", bg: "#E8F0FE", fg: "#2563C9" },
  "수정요청처리": { label: "수정 요청", bg: "#F0EAFB", fg: "#6D4BC4" },
};
