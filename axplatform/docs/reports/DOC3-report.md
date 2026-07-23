# DOC3 — 기획설명서 v2 → v3 업데이트 보고서

> 대상: `docs/AX-Platform-화면별-기획설명서.md` (v2 → v3, 전체 파일 재작성)
> 코드 변경: `frontend/src/pages/admin/AdminNotices.tsx` 상단 주석 1행(AD-10 → ADM-09)만.
> 검증: `npx tsc -b` (frontend) EXIT 0 — 주석 수정이 코드에 영향 없음 확인.

랜딩 교체(L1)·공지 기능(L2)·전역 검수(F1r)·목업 정합(G2)·개인화 실연동(F2r) 결과를 기획설명서에 흡수했다. 서술 근거는 소스(LandingPage·NoticesPage·SettingsPage·GuidePage·AdminNotices·Navbar·AdminNavbar·NotificationBell·hooks·types)와 STRUCTURE.md이며, 문서 서술을 소스와 대조해 정합화했다.

---

## 1. 반영 항목 체크리스트

### A. 문서 메타
- [x] 버전 v2 → v3.
- [x] 서두 "LandingPage는 외부 제작물로 교체 예정이라 제외" 문구 삭제 → 랜딩 편입 명시.
- [x] 대상 화면 수 갱신: 사용자 8종 → **12종(USR-00~11)**, 관리자 8종 → **9종(ADM-01~09)**.
- [x] "v3 변경 요약" 절 신설(랜딩 편입·신규 화면 4종·개인화 축 신설·공통 정책 보강·기존 화면 갱신).

### B. 신규 화면 섹션 (6절 구조 + 개발 연동 노트)
- [x] **USR-00 랜딩** (LandingPage, /) — Vite 포팅 내부 자산 명시, 7섹션 구성, 최신소식 `noticeMockData` 단일 소스, 개인화 패널(스크랩 카운트·알림 현황·추천), 관심사 기반 추천(미설정 시 /settings 유도), 조회수(views) 병기.
- [x] **USR-09 이용 가이드** (/guide) — 네비바 "이용 가이드" 연결 대상, About은 푸터 존치.
- [x] **USR-10 공지사항·업데이트 소식** (NoticesPage, /notices) — 공개 페이지, NoticeKind 2종 탭, pinned 우선 + 최신순, visible=true만, `?kind=`, 랜딩 "더보기" 연결 대상.
- [x] **USR-11 설정** (SettingsPage, /settings) — 관심 카테고리 7종·도메인 6종 칩 다중 선택, `ax_user_interests`, 추천 실연동 관계, 향후 확장 예정.
- [x] **ADM-09 공지 관리** (AdminNotices, /admin/notices) — 전사 관리자 전용, 작성/수정/삭제·고정·노출 토글.

### C. 기존 섹션 갱신
- [x] **USR-08** (Navbar/Footer): 메뉴 "소개" → "이용 가이드"(/guide), About 링크 푸터 이동, 알림 벨(Navbar·AdminNavbar), 아바타 드롭다운 "설정" 추가.
- [x] **USR-03** (목록): 스크랩 토글(카드, stopPropagation), "스크랩 N" 필터 칩, `?scrap=1`, 목록 재사용 근거 서술.
- [x] **USR-04** (상세): 헤더 북마크 토글(좋아요 옆), 조회수 병기.
- [x] 랜딩 카드 스크랩 토글은 USR-00·0.10에 서술.

### D. 공통 정책(0.x)
- [x] **0.10 개인화 체계(스크랩·알림·관심사)** 신설 — localStorage 3종 표, 스크랩(PUT/DELETE /api/v1/scraps/:itemId 멱등), 알림(kind 7종 열거, 공지 알림 없음 결정, ax_notifications_read, 발송 트리거 서버 책임 + TODO 지점, GET/PATCH /api/v1/notifications), 관심사(ax_user_interests, 매칭 규칙 카테고리·도메인 일치 → views/likes 상위 12, PUT /api/v1/me/interests).
- [x] **0.2** 명칭 예외 목록에 localStorage 키 3종(ax_scraps·ax_user_interests·ax_notifications_read) 추가.
- [x] **0.9** 조회수(views) 서버 집계 전환 방침 추가(부재 확인 후 신설) + 목업 SSOT 정합 원칙(동일 ID·상이 제목 금지) 한 줄 기재.

### E. 부록
- [x] **부록 A** 데이터 흐름도에 알림·스크랩·조회수·관심사·공지 흐름 추가.
- [x] **부록 B**: "LandingPage 교체 예정" 완료 처리(deprecated 상태 타입 삭제 반영), F2r API 후보 3종 백로그 편입, 나머지(백엔드 명명·이미지 스토리지·audiences·좋아요/게시판) 유지.
- [x] G2 목업 재배번·텍스트 드리프트는 기획 사항이 아니므로 본문 미기재, 정합 원칙 한 줄만 0.9에 기재.

### F. 코드
- [x] `AdminNotices.tsx:10` 주석 `AD-10` → `ADM-09` (주석만, 코드 무변경). `tsc -b` EXIT 0.

---

## 2. 보고에서 문서로 옮긴 설계 판단 (보고 삭제 전 보존 대상)

| 근거 보고 | 문서로 옮긴 설계 판단 | 반영 위치 |
|---|---|---|
| L1 | 랜딩을 외부 제작물 → Vite 포팅 **내부 자산**으로 편입, 자기완결(외부 CDN·라이브러리 0) 원칙 | USR-00 정의·룰 |
| L1 | 관계사 마퀴·그룹사명·"N개 그룹사 참여" 제거(관계사 표시 금지 정합) | USR-00 룰 |
| L1 | 애니메이션을 외부 라이브러리 없이 CSS/rAF/IntersectionObserver로 재현 | USR-00 기획 의도 |
| F1r | 최신소식을 정적 `LATEST_NEWS` → 공지 단일 소스(`noticeMockData`) 참조로 전환 | USR-00·USR-10·0.10 |
| F1r | 조회수(views) 필드 도입 + 서버 집계 전환 방침, 통계 축 미추가(입력 없는 축 금지) | 0.9·USR-04·ADM-04 |
| F1r | 네비바 "소개" → "이용 가이드"(/guide), About은 푸터 존치(개념 vs 실행 동선 역할 분리) | USR-08·USR-09 |
| G2 | 목업은 상세 페이지를 SSOT로, 동일 ID·상이 제목 금지(대기 큐 미게시 항목은 다음 순번 신규 ID 발급) | 0.9 |
| G2 | 감사 로그 등 이력 레코드는 원본 보존(소급 정정 금지) | 0.9 |
| G2 | 관리자 도메인 분석 축을 `BusinessDomain` 6종으로 정합 | ADM-04 룰 |
| F2r(STRUCTURE) | 개인화 3축을 localStorage 단일 소스 + 공용 훅(useSyncExternalStore)로 전 화면 동기화 | 0.10 |
| F2r(STRUCTURE) | 스크랩 필터를 전용 페이지 대신 목록 재사용(?scrap=1) — 단순한 쪽 선택 | USR-03 기획 의도·0.10 |
| F2r(STRUCTURE) | 공지(Notice)는 알림 미발생(브로드캐스트 vs 개인 통지 축 분리) | 0.10·USR-10·ADM-09 |
| F2r(STRUCTURE) | 알림 발송 트리거는 서버 책임(프론트는 TODO 주석만: AdminReview·EditRequestPage) | 0.10·ADM-02·USR-06 |
| F2r(STRUCTURE) | 관심사 명시 선언으로 추천 콜드스타트 해결(향후 개인 정보 확장 자리) | USR-11 기획 의도 |
| L1/STRUCTURE | 운영 상태 deprecated 타입·목업 status 필드 삭제 완료(랜딩 교체가 마지막 참조 제거) | 0.4·부록 B |

---

## 3. 소스와 대조해 정정/확정한 서술

| 항목 | 확인·정정 내용 | 근거 소스 |
|---|---|---|
| AdminNotices 문서 번호 | 상단 주석 `AD-10` → 문서 체계 `ADM-09`로 정정(주석만 수정) | `AdminNotices.tsx:10` |
| 알림 kind 7종 | 열거를 소스 그대로 기재(신청접수/관계사승인/전사승인/반려/후기등록/게시판글/수정요청처리) | `types/notificationTypes.ts` |
| 공지 종류 2종 | 공지사항/업데이트 (`NOTICE_KINDS`) 확인 | `types/noticeTypes.ts` |
| localStorage 키 3종 | `ax_scraps`·`ax_user_interests`·`ax_notifications_read` 정확 명칭·형태 확인 | `hooks/useScraps.ts`·`useInterests.ts`·`useNotifications.ts` |
| 스크랩 토글 3지점 | 상세 헤더·목록 카드(stopPropagation)·랜딩 카드 확인 | `AssetItemDetailPage.tsx:811`·`ProjectListPage.tsx:505-510`·`LandingPage.tsx:754` |
| `?scrap=1` 진입·필터 | 초기값만 URL에서 읽고 이후 로컬 유지, "스크랩 N" 토글 칩·빈 상태 안내 확인 | `ProjectListPage.tsx:208-266,397-445` |
| 추천 규칙 | `RECOMMEND_N=12`, 관심 카테고리 또는 도메인 일치 → views→likes 정렬, 미설정 시 /settings 유도 | `LandingPage.tsx:369-385,476-496` |
| 조회수 병기 | 상세 헤더 views 표시·카드 조회수 확인, "실시간 인기"는 views 정렬(트렌딩 TODO) | `AssetItemDetailPage.tsx:787-796`·`LandingPage.tsx:776,878-879` |
| Navbar 메뉴·설정·벨 | "이용 가이드"(/guide), NotificationBell(로그인·비공유), 아바타 "설정"(/settings) 확인 | `Navbar.tsx:7,10,68,101-102` |
| AdminNavbar 벨 | NotificationBell 배치 확인 | `AdminNavbar.tsx:3,22` |
| 최신소식 표시 규칙 | visible=true·pinned 우선·최신순, 랜딩은 탭별 5건, `?kind=` 동기화 확인 | `NoticesPage.tsx:27-40`·`mocks/noticeMockData`(STRUCTURE) |
| PA-2026-003 담당자 | 소스가 SSOT 값 "김재원"으로 이미 통일됨 확인(G2 반영) → 본문에 담당자 예시로 오기재하지 않음 | `ProjectListPage.tsx:83`·G2 |
| 운영 상태 타입 삭제 | `PlatformItemStatus` 계열·`AssetItem.status` 삭제 완료 확인 → 0.2 예외 목록·0.4·부록 B 갱신 | STRUCTURE.md·L1 grep |

> AdminCategories.tsx:8의 `AD-09 자동화·AI 도구` 주석은 지시 범위 밖(AdminNotices 주석만 정정 지시)이라 무변경으로 두었다.

---

## 4. 검증

- `npx tsc -b` (frontend) → **EXIT 0** (주석 수정이 타입·동작에 영향 없음).
- 문서는 전체 파일 재작성 방식으로 작성(부분 diff 아님). v2 기획 의도 서술은 압축·요약 없이 보존하고 추가·갱신만 수행.
- 내부 식별자·라우트·API TODO 경로·값 문자열 변경 없음.

## 5. 변경 파일

- `docs/AX-Platform-화면별-기획설명서.md` — v2 → v3 전체 재작성.
- `frontend/src/pages/admin/AdminNotices.tsx` — 상단 주석 1행(AD-10 → ADM-09).
- `docs/reports/DOC3-report.md` — 본 보고서(신규).
