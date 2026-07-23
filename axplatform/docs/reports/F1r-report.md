# F1r — 랜딩·전역 검수 수정 일괄 보고서

> 커밋 `f3a4342` · `tsc -b` · `vite build` 모두 EXIT 0 · dev 서버 부팅·라우트·에셋 확인 완료

## PART별 결과

### A — 배경 이미지 배선
- 히어로: `bg_sec2.png`를 라디얼 그라디언트 오버레이 위 배경으로 배선. `[확인 필요]` 마커 해소 (`LandingPage.tsx:499`).
- 섹션4(인기 항목): `bg_sec4.webp`를 상하 페이드 마스크 + opacity 0.14로 카드 뒤에 배치. 마커 해소 (`LandingPage.tsx:911`).

### B — 대형 이미지 최적화 (webp q80, 원본 삭제, 참조 갱신)

| 파일 | 전 | 후 | 절감 |
|---|--:|--:|--:|
| banner_chatbot | 5,103 KB | 58 KB | 98.9% |
| banner_hk | 4,975 KB | 37 KB | 99.3% |
| banner_ml | 5,064 KB | 56 KB | 98.9% |
| banner_n8n | 4,992 KB | 70 KB | 98.6% |
| banner_pad | 5,163 KB | 54 KB | 99.0% |
| banner_vibe | 5,534 KB | 125 KB | 97.7% |
| cta_kolling | 2,391 KB | 62 KB | 97.4% |
| bg_sec4 | 577 KB | 102 KB | 82.4% |
| **합계** | **33,800 KB** | **563 KB** | **98.3%** |

### C — 조회수
- `AssetItem.views?: number` + TODO(백엔드 집계) 추가. 랜딩(23)·목록(50)·상세(50) 목업에 현실적 views 배선(views > likes, 분산).
- 카드·상세 헤더에 눈 아이콘 + 좋아요 병기. "실시간 인기"를 views 기준 정렬로 변경.
- AdminStatistics에는 조회수 축 미추가(규칙 준수).

### D — 업무별 칩
- 이미 `BUSINESS_DOMAINS` 6종(영업/생산/연구/재무/HR/IT) 파생. 품질·사무·기타 잔재 없음 → 변경 불필요(정합 확인만).

### E — 검수 이슈
- **E-1 원인**: 이중 헤더·z-index 충돌 **없음**. LandingPage는 공통 `<Navbar/>`를 1회만 렌더(`:900`), 자체 헤더 잔재 없음. sticky 요소는 Navbar(z-index 100)뿐이고 랜딩 콘텐츠 zIndex는 0~2로 모두 하위 → 단일 헤더 체계가 이미 정립됨(Next.js→Vite 포팅 시 해소된 것으로 판단). 구조 변경 불필요.
- **E-2**: 상세 캐러셀 이미지 보유 목업을 카테고리별 1건 이상(총 7건)으로 확충 — assistant/ml/vibe에 인라인 SVG data URL 이미지 추가(신규 placeholder 2종 포함). 렌더 결함 없음.

### F — 네비바 개편 + 이용 가이드
- Navbar "소개" 제거 → "이용 가이드"(/guide). `/about`·AboutPage 유지, 푸터에 "서비스 소개"(/about) 링크 신설.
- `GuidePage.tsx`(/guide) 신설 — ①시작하기(로그인→탐색→상세→문의) ②등록 3단계+유형별 팁 ③병렬 2슬롯 승인(관계사+전사, 순서 무관, 반려 시 재신청) ④FAQ 4개(+ /about FAQ 링크). AboutPage 디자인 체계 준수.
- 랜딩 CTA "이용 가이드" 박스 → /guide 활성 연결(L1 후속 2번 해소).

### G — 더미 데이터 점검
- **수정**: 상세 `N8N-2026-001` 제목 오적재(Outlook↔신규 입사자) → SSOT 기준 "신규 입사자 계정 자동 생성"으로 정정(workflowDef 포함). 랜딩 `CATEGORY_COUNTS`/`TOTAL_COUNT` 하드코딩(217) → SSOT 실계수 산출(50) + TODO 주석. `etc` 카테고리가 목록에서 접근 불가(0건) → `ETC-2026-001`을 카탈로그에 추가. 목록 검색 placeholder "AI 에이전트" → "AI 모델".
- **죽은 링크**: 랜딩 이용 가이드 CTA 빈 함수 → /guide 연결(유일 사례, F에서 해소). 그 외 미등록 경로 이동·빈 onClick 없음.

## [확인 필요] (판단/독립 데모 데이터라 미수정)
1. **Admin 계열 독립 데모 큐**: AdminDashboard/ProjectManage/Statistics/Review/Taxonomy가 SSOT와 같은 ID를 다른 제목으로 재사용하고, 카탈로그에 없는 모델명(Claude Sonnet 5, Llama 3, GPT-4o)을 참조. 통계 수치와 얽혀 있어 임의 정렬 시 리스크 → SSOT 일원화 여부 확인 필요.
2. **AdminUsers 감사 로그**: `AGENT-2025-007`, `HKGPT-2025-018` — ID 접두어 규격 외. 이력 로그(원본 보존 원칙)로 추정, 정규화 여부 확인 필요.
3. **statsMockData `DOMAIN_LABELS`**: 8종(제조/생산·IT 인프라·마케팅 등)으로 정식 6종 BusinessDomain과 다른 관리자 분석 축. 별개 축인지, 6종 정합 대상인지 확인 필요.
4. **경미한 텍스트 드리프트**: 상세 `VIBE-2026-001` 요약("요약 리포트" vs SSOT "요약"), `PA-2026-003` 담당자(이지원 vs SSOT 김재원) — 어느 쪽을 정본으로 할지 확인 필요.

## 검증
- `tsc -b` EXIT 0 · `vite build` EXIT 0 (65 modules transformed).
- dev 서버 부팅 후 `/`·`/guide` HTTP 200, webp 에셋 `image/webp` 정상 서빙, 삭제된 PNG는 SPA 폴백 처리(디스크 제거 확인).
- webp 변환용 `sharp`는 `--no-save`로 설치해 `package.json`/`package-lock.json` 무변경(node_modules 한정, 미추적).
