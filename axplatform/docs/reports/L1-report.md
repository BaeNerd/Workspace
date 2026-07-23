# L1 작업 보고 — LandingPage 교체 (Next.js 랜딩 → Vite SPA 포팅 + 정합화)

- **일자**: 2026-07-23
- **대상**: `axplatform/frontend/src/pages/LandingPage.tsx` 전면 교체 + 운영 상태 deprecated 정리
- **소스**: `axplatform/frontend/_incoming-landing/`(외부 제작 Next.js 랜딩)

## 커밋 (3개)

| 해시 | 메시지 |
|------|--------|
| `34bd767` | feat: 랜딩 페이지 교체 (Next.js 원본 포팅 + 신 체계 정합화) |
| `16d5b2c` | refactor: 운영 상태 deprecated 타입·목업 status 필드 일괄 삭제 |
| `5d36cb8` | docs: STRUCTURE.md — 랜딩 교체·운영 상태 삭제 반영 |

---

## 1. 원본 구조 요약 (`_incoming-landing/app/page.tsx`)

Next.js 14 App Router 단일 홈. 구 6카테고리(ml·hkgpt·chatbot·n8n·power-automate·vibe-coding) + 사례/템플릿/그룹사/업무기능 모델 기반.

섹션 순서:
1. **PromoAndPersonalPanel** — 배너 슬라이더 + 개인화 패널
2. **IconHero** — 회전 헤드라인 + 검색 + 카테고리 타일
3. **PlatformStatus** — 총 사례 카운터 + 카테고리별 막대
4. **PopularCases** — 인기 사례(카테고리 필터)
5. **LatestNewsAndTrending** — 최신소식 + 실시간 인기
6. **CasesByJobFunction** — 업무별 사례
7. **CtaBoxes** — 고민상담소 CTA
8. **PartnerMarquee** — 관계사 로고 마퀴

의존: `motion/react`, `lucide-react`, `@tabler/icons-react`, `category-backgrounds`(AnimatedBeam·OrbitingCircles·Terminal·AnimatedList·TypingAnimation 6개 + n8n/LLM 600여 SVG), 로컬 폰트(SB Aggro·SCoreDream).

---

## 2. 치환한 Next API

| Next | → Vite SPA |
|------|-----------|
| `"use client"` | 삭제 |
| `next/link` · `useRouter().push` | `useNavigate()` onClick (코드베이스 규약) |
| `next/image` | `<img>` |
| `next/font` · globals `@font-face` | `index.css` 로컬 `@font-face`(SB Aggro·SCoreDream) + `--font-heading`/`--font-landing` |
| `metadata` / `next/head` | 기존 `index.html` (무변경) |
| Tailwind 유틸 · CSS 디자인 토큰 | 인라인 스타일 + 리터럴 토큰(`C`) |
| `motion/react` (useInView·useSpring·motion.div) | CSS 키프레임 + `rAF` + `IntersectionObserver` (외부 의존 0) |
| `lucide-react` · `@tabler/icons-react` | 인라인 SVG 아이콘 세트 |
| 서버 데이터(cases·templates·companies) | 로컬 목업 `LANDING_ITEMS` (ProjectListPage ID·제목 일치) |

배너 배경 애니메이션은 사용자 결정(**CSS 경량 재현**)에 따라 `beam`/`orbit`/`list`/`terminal` 씬으로 근사 구현 — `motion` 라이브러리·600여 SVG 미도입. 그 외 시그니처 애니메이션(회전 헤드라인, 숫자 카운트업, 카테고리 막대 채움, 배너 슬라이더 자동전환)은 CSS/rAF로 원본과 동일하게 재현.

---

## 3. [확인 필요]

1. **배경 이미지 `bg_sec2.png` · `bg_sec4.png` 미제공** — `public/section/` 에셋 없음. 히어로는 은은한 그라디언트로 대체, 섹션4 배경은 생략(코드 주석 명시). 원본 제공 시 반영 가능.
2. **비존재 화면 링크 재연결** — 원본의 `/explore` · `/cases` · `/catalog/hkgpt` · `/n8n(목록)` · `/templates` → 실제 라우트(`/projects` · `?platform=` · `?domain=` · `/{cat}/{id}` 상세)로 보수적 재연결. 별도 화면 신설 여부 확인 필요.
3. **관계사 표시 제거** — `PartnerMarquee`(관계사 로고 마퀴) · 개인화 패널 그룹사명 · "N개 그룹사 참여" 문구를 신 정책(관계사 표시 금지)에 따라 삭제/치환. 마퀴는 대체물 없이 제거.
4. **브랜드/사내 문구 정합화** — "콜마인을 위한 고민상담소" → "무엇부터 시작할까요?", "상담사 콜링이" 페르소나 · 강한 "HK GPT" 브랜딩 → 카테고리 용어("AI Agent")로 완화. 확정 워딩 확인 필요.
5. **배너 카피(`PROMO_COPY`)** — 카테고리 소개용으로 새로 작성. 승인 확인 필요.

---

## 4. [후속: 관리자 기능 필요]

1. **최신소식(공지사항·업데이트)** — 관리 화면 없음. `LATEST_NEWS` 정적 목업 표시만, "더보기" 비활성.
2. **이용 가이드** — 콘텐츠/화면 없음. CTA 박스 링크 비활성.
3. **개인화 지표(관심 항목·추천 항목)** — 개인화 API/기능 없음. 정적 placeholder(3개/12개) 표시, `/projects` 연결.
4. **실시간 인기** — 조회수 개념이 신 모델에 없어 `likes` 기준으로 대체. 실제 인기 집계는 후속.

---

## 5. deprecated 삭제 결과 (grep)

- **코드 심볼 참조 0**: `PlatformItemStatus` · `STATUS_ORDER` · `STATUS_COLOR` · `STATUS_QUERY_KEY` · `LEGACY_STATUS_MAP` · `normalizeStatus` · `countAvailable` 전부 삭제. (문서용 프로즈 주석 2건만 잔존)
- **`status: "<4종>"` 목업 리터럴 99 → 0** (ProjectListPage 44 + AssetItemDetailPage 55). `AssetItem.status` 필드 삭제(필수 해제).
- **유지**: `agentAvailability`(별개 축) · `workflowDef.status`(`Stable`/`Active`/`Error`, 워크플로우 시각화용) · WorkflowDiagram 로컬 `STATUS_COLOR` — 상태 폐기와 무관.
- `tsc -b` 통과 = `item.status`를 읽는 코드가 어디에도 없음을 컴파일러가 보증.

---

## 6. 빌드 결과

- `npm run build` (**tsc -b + vite build**) → **exit 0** (양 커밋 시점 모두 재확인).
- dev 서버 부팅 `HTTP 200`, LandingPage 모듈 트랜스폼 `200` (런타임 import/트랜스폼 오류 없음).
- 헤드리스 환경이라 픽셀 단위 시각/애니메이션 육안 검증은 미수행 — 애니메이션은 CSS/rAF 스펙대로 구현.
- **공유 빌드는 미실행.** 자기완결 점검: 새 랜딩은 로컬 폰트 · 로컬 이미지 · CSS/rAF만 사용(외부 라이브러리 0, 외부 이미지 0, 하드코딩 외부 URL 0 — Teams URL은 config 경유 · share 모드 비활성). **유일한 외부 CDN 의존은 기존 `index.html`의 Google Fonts(Inter/Noto)** 로, 이번 랜딩이 도입한 것이 아니며 본문은 로컬 SCoreDream 사용(Noto는 폴백만). 엄격한 단일 HTML 자기완결이 필요하면 그 폰트도 로컬화 권장(선택).

---

## 기타

- `_incoming-landing/`은 지시대로 디스크에 보존, 히스토리에는 미포함(631개 파일 · `.next` 캐시 오염 방지).
- 작업 시작 시점부터 수정돼 있던 `docs/screen-specs/user-screens.pptx`는 본 작업과 무관하여 커밋에서 제외.
- 복사한 에셋: `public/banner/`(6종), `public/icons/icon_*·hk.png`, `public/cta/cta_kolling.png`, `public/fonts/SBAggro/*` · `public/fonts/SCoreDream/*`.
