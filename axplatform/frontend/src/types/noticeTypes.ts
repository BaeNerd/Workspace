// ===== types/noticeTypes.ts =====
// 공지사항·업데이트 소식 공용 타입.
// 관리자(전사 관리자)가 작성·관리하고, 랜딩 최신소식 섹션과 /notices 목록에 노출된다.
// TODO: 실제 연동 시 서버 스키마로 교체.
//   GET    /api/v1/notices              — 사용자 공개 목록(visible=true만)
//   GET    /api/v1/admin/notices        — 관리자 전체 목록(비노출 포함)
//   POST   /api/v1/admin/notices        — 신규 작성
//   PUT    /api/v1/admin/notices/:id    — 전체 교체
//   PATCH  /api/v1/admin/notices/:id    — 고정(pinned)·노출(visible) 토글
//   DELETE /api/v1/admin/notices/:id    — 삭제

export type NoticeKind = "공지사항" | "업데이트";
export const NOTICE_KINDS: NoticeKind[] = ["공지사항", "업데이트"];

export type Notice = {
  id: string;            // "NOTICE-{YYYY}-{NNN}" — TODO: 실제 연동 시 서버 발급 ID로 교체
  kind: NoticeKind;      // 종류(공지사항/업데이트)
  title: string;         // 제목
  body: string;          // 본문(펼침 시 표시)
  date: string;          // 게시일 "YYYY.MM.DD"
  pinned: boolean;       // 상단 고정 여부(정렬 우선)
  visible: boolean;      // 노출 여부(false면 랜딩·목록에서 숨김)
};
