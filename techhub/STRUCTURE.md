# Kolmar Tech Hub — 프로젝트 구조 문서

> React + TypeScript (Vite) 프론트엔드 / FastAPI + PostgreSQL 백엔드  
> 사내 IT 프로젝트·자동화·AI 도구를 등록·탐색·관리하는 그룹 통합 내부 플랫폼

---

## 디렉터리 트리
techhub/
├── docker-compose.yml          # postgres + backend 서비스 정의
├── .env                        # 백엔드 환경변수 (DB URL 등)
├── .env.example
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                 # 직접 실행용 진입점 (uvicorn)
│   └── app/
│       ├── main.py             # FastAPI 앱 생성 및 라우터 등록
│       ├── core/
│       │   ├── config.py       # 환경변수 → Settings 객체
│       │   └── database.py     # SQLAlchemy(미정) 엔진 / 세션 팩토리
│       ├── api/routes/
│       │   └── health.py       # GET /health
│       ├── models/             # SQLAlchemy(미정) 모델 (현재 빈 패키지)
│       └── schemas/            # Pydantic 스키마 (현재 빈 패키지)
│
└── frontend/
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig*.json
├── .env.local              # VITE_API_URL=http://localhost:8000
└── src/
├── main.tsx            # ReactDOM.createRoot 진입점
├── App.tsx             # 라우트 테이블 + AuthProvider 래퍼
├── lib/
│   └── api.ts          # fetch 래퍼 (get/post/put/delete)
├── context/
│   ├── AuthContext.tsx # 전역 인증 상태 (user, login, logout, isAdmin, 권한 헬퍼 등)
│   └── useAuth.ts      # useAuth 훅 (useContext(AuthContext))
├── types/
│   └── platformTypes.ts # PlatformId, Platform, PlatformItem 등 플랫폼 공용 타입
├── mocks/
│   └── statsMockData.ts # 통계·대시보드 공용 mock 데이터·범위 집계 헬퍼 (DEMO 전용, 백엔드 연동 시 폐기)
├── components/
│   ├── Navbar.tsx      # 일반 사용자용 상단 네비게이션
│   ├── AdminNavbar.tsx # 관리자 페이지용 상단 네비게이션
│   ├── AdminSidebar.tsx# 관리자 좌측 사이드바 (useLocation 활성 감지)
│   ├── Footer.tsx      # 공통 푸터
│   └── ProtectedRoute.tsx # 로그인/관리자 권한 라우트 가드
└── pages/
├── LandingPage.tsx
├── LoginPage.tsx
├── AboutPage.tsx
├── ProjectListPage.tsx
├── ProjectDetailPage.tsx
├── PlatformItemDetailPage.tsx  # n8n·나만의비서·AI Agent 항목 상세
├── ProjectRegisterPage.tsx
├── MyStatusPage.tsx
├── EditRequestPage.tsx
└── admin/
├── AdminDashboard.tsx
├── AdminReview.tsx
├── AdminProjectManage.tsx
├── AdminTaxonomy.tsx
├── AdminOrg.tsx
├── AdminUsers.tsx
└── AdminStatistics.tsx

---

## 라우트 & 페이지 요약

### 공개 페이지 (인증 불필요)

#### `LandingPage.tsx` — `/`
- **역할**: 플랫폼 홈. Hero 섹션 + 통계 + 최근 등록 프로젝트 6개 카드. 검색창에서 `/projects?q=...`로 이동.
- **주요 state**
  - `hovered: number | null` — 프로젝트 카드 hover 인덱스
  - `search: string` — Hero 검색 입력값

#### `LoginPage.tsx` — `/login`
- **역할**: Microsoft SSO 로그인 화면. `?redirect=` 쿼리로 로그인 후 복귀 경로 수신. 데모 단계에서는 SSO 버튼이 전사관리자 계정으로 로그인하고, 그 아래 접이식 데모 계정 전환 UI로 권한 범위별 계정을 선택할 수 있다.
- **데모 계정 프리셋** (`DEMO_ACCOUNTS`, DEMO 전용 — 실제 SSO 연동 시 이 영역 전량 제거)
  - 전사관리자 (`adminScope: "global"`) — 전체 관계사 관리·집계
  - 관계사관리자 (`adminScope: "company"`, `managedCompanies: ["KBH", "HC"]`) — 담당 관계사만 관리·집계
  - 관계사관리자 (`adminScope: "company"`, `managedCompanies: ["KMG"]`) — 단독 관계사 담당
  - 일반 사용자 (`role: "user"`) — 등록 신청만 가능, 관리자 화면 접근 불가
  - 관리자 계정 선택 시 `/admin`으로, 그 외에는 `redirect` 경로로 이동
- **주요 state**
  - `loading: boolean` — SSO 요청 진행 중 여부
  - `demoOpen: boolean` — 데모 계정 선택 영역 펼침 여부
- **AuthContext 사용**: `login()` — 사용자 세션 저장
- **참고**: `CurrentUser` 타입을 `../context/AuthContext`에서 import하여 계정 정의의 타입 안전성 확보. 데모 계정의 담당 관계사 코드는 `mocks/statsMockData.ts`의 `STAT_COMPANIES` 및 관계사 차원 더미 키와 일치하도록 맞춰, 통계·대시보드 범위 한정이 데모에서 실제로 동작한다.

#### `AboutPage.tsx` — `/about`
- **역할**: 플랫폼 소개 페이지. 문제 정의 → 작동 방식(4단계) → 핵심 가치 → Phase 2 로드맵 → CTA.
- **주요 state**: 없음 (정적 콘텐츠)

#### `ProjectListPage.tsx` — `/projects`
- **역할**: 전체 프로젝트 목록. 좌측 필터 사이드바(도메인·상태·유형)와 상단 검색·정렬. URL 쿼리스트링(`?q=`)과 검색어 동기화.
- **주요 state**
  - `search: string` — 검색어 (URL 쿼리스트링과 동기화)
  - `domain / status / type: string` — 필터 선택값
  - `sort: "최신순" | "인기순" | "이름순" | "부서순"` — 정렬 기준 (최신순 기본)
  - `sidebarOpen: boolean` — 필터 사이드바 열림 여부 (기본 닫힘, 적용 개수 배지 표시)
  - `hovered: number | null` — 카드 hover 인덱스
- **필터 노출 규칙**: 출처 → 상태 → 관계사는 항상 노출, 도메인·유형은 전체·프로젝트 선택 시에만 노출. 관계사 필터는 플랫폼 항목에도 적용(전사 공용 + 해당 관계사).
- **파생 값**: `filtered` — `useMemo`로 계산한 필터·정렬 결과

#### `ProjectDetailPage.tsx` — `/projects/:id`
- **역할**: 단일 프로젝트 상세 보기. 기본정보·기술스택·담당자·링크·댓글 탭 구성.
- **주요 state**
  - `activeTab: string` — 현재 선택된 탭 (`"overview"` 등)
  - `comment: string` — 댓글 입력값
  - `comments: Comment[]` — 댓글 목록
  - `bookmarked: boolean` — 북마크 여부
- **URL param**: `id` (`useParams`)

#### `PlatformItemDetailPage.tsx` — `/n8n/:itemId` `/assistant/:itemId` `/ai-orchestration/:itemId`
- **역할**: 플랫폼 항목(n8n 워크플로우, 나만의 비서 에이전트, AI Agent 모델) 상세 보기. 플랫폼 종류에 따라 다른 섹션을 조건부 렌더링. 좋아요·댓글·복사 기능. 헤더 메타 정보 줄 요약과 개요 탭의 "대상 관계사" 카드로 `company` 표시.
- **URL param**: `itemId` (`useParams`). 어느 경로에서 도달했는지 `useLocation`이나 경로 파싱으로 `platformId` 도출.

---

### 인증 필요 페이지 (`ProtectedRoute`)

#### `ProjectRegisterPage.tsx` — `/projects/new`
- **역할**: 신규 프로젝트·플랫폼 항목 등록 신청. 4단계 스텝 폼 (기본정보 → 분류·태그 → 담당자·링크 → 최종확인).
- **내부 컴포넌트** (모듈 레벨): `RowRemoveButton`(담당자·링크 행 정렬용), `CompanyMultiSelect`(관계사 닫힌 멀티셀렉트)
- **주요 state**
  - `step: 0–3` — 현재 스텝
  - `form: FormState` — 전체 폼 데이터
    - `title, summary, description` — 기본정보
    - `status, systemType, domains[], audiences[], departments[], stack[]` — 분류
    - `freeTags, integrations` — 태그
    - `company: string[]`, `platformScope: "unset" | "company-wide" | "specific"` — 소속/대상 관계사 (플랫폼 항목). "전사 공용" 체크박스와 관계사 선택은 상호 배타. `platformScope`가 `unset`이면 다음 스텝 진행 차단.
    - `contacts: Contact[]` — 담당자 목록
    - `links: LinkItem[]` — 외부 링크 목록
  - `saving / saved: boolean` — 제출 진행·완료 여부
- **후속 작업**: "예상 절감 시간" 필드 정규화(자유 텍스트 → 수치 입력 + 고정 단위 "시간/주"). AdminStatistics 집계 연동 예정.

#### `MyStatusPage.tsx` — `/my-status`
- **역할**: 내가 등록 신청한 프로젝트 목록. 승인/대기/반려 탭 필터. 승인 항목은 상태(개발 중/운영 중 등) 직접 변경 가능. 반려 항목은 재제출 또는 삭제 가능.
- **내부 컴포넌트** (모듈 레벨): `StatusChanger` — 승인된 항목의 상태 변경 드롭다운. `"종료"` 상태는 자기 되돌림 방지를 위해 잠금 처리. 입력 포커스 끊김·스크롤 점프 버그 방지를 위해 모듈 레벨에 선언.
- **주요 state**
  - `filter: "전체" | "승인" | "대기" | "반려"` — 목록 필터
  - `expanded: string | null` — 내용 확인 패널이 펼쳐진 항목 ID
  - `resubmit: string | null` — 재제출 패널이 열린 항목 ID
  - `deleteConfirm: string | null` — 삭제 확인 패널이 열린 항목 ID
  - `deleted: string[]` — 로컬에서 제거된 항목 ID 목록 (삭제 처리 시 목록에서 필터링)
  - `statusOverrides: Record<string, string>` — 승인 항목 상태 변경값 로컬 저장
- **마운트 동작**: `useEffect`로 `window.scrollTo({ top: 0 })` 자동 실행 (다른 페이지에서 진입 시 스크롤 위치 초기화)
- **정렬**: `useMemo`로 `submittedAt` 내림차순(최신순) 정렬 + `statusOverrides`·`deleted` 반영

#### `EditRequestPage.tsx` — `/projects/:id/edit-request`
- **역할**: 기존 프로젝트의 정보 수정 신청. 수정할 필드를 체크박스로 선택 후 변경 내용과 사유 입력.
- **주요 state**
  - `selectedFields: string[]` — 수정 신청 대상 필드 키 목록
  - `changes: Record<string, string>` — 필드별 변경 내용
  - `reason: string` — 수정 사유
  - `submitting / submitted: boolean` — 제출 진행·완료 여부
- **URL param**: `id` (`useParams`)
- **검토 예정**: `orgEntries`(조직 계층) 및 플랫폼 전용 필드의 수정 신청 지원 여부 (작업 큐 항목)

---

### 관리자 전용 페이지 (`RequireAdmin`)

모든 관리자 페이지는 `<AdminNavbar />` + `<AdminSidebar />` 레이아웃을 공유합니다.

#### `AdminDashboard.tsx` — `/admin`
- **역할**: 관리자 메인 대시보드. 핵심 지표(전체 등록물·승인 대기·이번 달 신규·운영 중 도구), 대기 목록, 최근 승인 목록, 월별 출처별 누적 추이, 출처 구성, 도메인 분포. 관계사 관리자 권한 범위(B안 enforcement) 적용 — 완료.
- **내부 상수**: `CARD_BORDER` — 전체 카드 테두리 통일(별도 강조 테두리 없음).
- **권한 범위 집계** (`useAuth()` 사용)
  - `isGlobalAdmin ? null : managedCompanies`를 `scope`로 삼아 `useMemo`로 지표·목록 재계산
  - 공용 데이터·헬퍼는 `mocks/statsMockData.ts`에서 import(`scopedCompanies`, `aggregateSourceTotal`, `aggregateMonthly`, `aggregateDomain`, `monthTotal`, `scopeBadgeText`)
  - 화면 고유 데이터: `PENDING_ALL`, `RECENT_APPROVED_ALL`(각 항목에 소속 관계사 `company` 부여 → 담당 범위 필터링), `ACTIVE_TOOLS_BY_COMPANY`
  - 집계 범위 배지(전사 기준 / 담당 관계사 N곳), 담당 관계사 없음·목록 빈 상태 처리
  - `pendingCount`는 필터링된 `pending.length`를 `<AdminSidebar>`에 전달(사이드바 뱃지도 범위 반영)
- **경로 정합성**: 최근 승인 항목 클릭 시 `detailPathOf`가 `PLATFORMS.path` 기준으로 동작 — ProjectListPage와 동일 경로 규칙 사용
- **타입 주의**: `SourceKey`·`MonthPoint`·`StatCompany`는 공용 모듈에서 `import type`으로 분리 import(값 import에 섞으면 `verbatimModuleSyntax` 오류로 화면 로딩 실패)

#### `AdminReview.tsx` — `/admin/review`
- **역할**: 프로젝트와 플랫폼 항목(n8n, 나만의 비서, AI Agent)을 단일 대기열로 통합 검토. 관리자가 정보를 직접 수정한 후 승인/반려. 관계사 관리자 권한 범위(B안 enforcement) 적용 — 완료.
- **내부 타입**
  - `ReviewProjectItem` (`kind: "project"`) — 조직 계층(`orgEntries`), 도메인, 기술 스택 포함
  - `ReviewPlatformItem` (`kind: PlatformId`) — 플랫폼 전용 필드(n8n/assistant의 `nodes`·`connectedApps`·`triggerAction`·`expectedTimeSaved`·`difficulty`, ai-orchestration의 `provider`·`contextWindow`·`strengths`·`costTier`) + `company: string[]` + `platformScope: "unset" | "company-wide" | "specific"`
  - `ReviewItem` = 위 두 타입의 유니온, `isProjectKind()` 타입 가드로 분기
- **내부 컴포넌트** (모듈 레벨): `FieldRow`, `SectionBlock`, `TagSelect`, `SingleSelectTag`, `ChipEditor`, `CompanyMultiSelect`
  - `CompanyMultiSelect`는 `allowedCodes`(토글 허용 관계사 화이트리스트)와 `allowCompanyWide`(전사 공용 선택 허용 여부) prop으로 권한 범위 제한을 수용. 담당 외 공동 소속 관계사는 "담당 외" 잠금 표시(해제 불가).
- **주요 state**
  - `items: ReviewItem[]` — 전체 검토 목록 (초기값 `INITIAL_ITEMS`)
  - `selected: string` — 현재 선택된 항목 ID
  - `done: string[]` — 처리 완료(승인/반려)된 항목 ID 목록
  - `edits: Record<string, Partial<ReviewItem>>` — 관리자가 수정한 내용 누적 맵
  - `filter: "전체" | "대기" | "처리완료"` — 목록 필터
  - `sourceFilter: "전체" | "project" | PlatformId` — 출처별 필터
  - `rejectOpen: boolean` — 반려 사유 입력 영역 표시 여부
  - `rejectReason: string` — 반려 사유 입력값
  - `draftCompany / draftParent / draftDept: string` — 프로젝트 조직 항목 추가용 드래프트
- **권한 판정** (`useAuth()` 사용)
  - `isGlobalAdmin`: 전사관리자 여부 (미지정 시 전사관리자로 간주 — 레거시 호환)
  - `managedCompanies`: 관계사관리자 담당 관계사 코드 목록
  - `canManageItem(companies, isCompanyWide)`: 항목 처리 가능 여부 판정. 전사 공용은 global만, 특정 관계사는 담당 관계사가 하나라도 겹치면 가능.
  - `itemCompaniesOf()` / `itemIsCompanyWideOf()`: 항목에서 관계사 집합·전사공용 여부를 도출하는 헬퍼 (프로젝트는 `orgEntries`의 company, 플랫폼은 `company` 필드)
  - `canManageReviewItem(item)`: 항상 **원본 항목** 기준으로 판정 — 편집을 통한 권한 우회 차단
  - `outOfScope`: 담당 범위 밖 → 승인·반려 버튼 미노출, 열람만 허용 + 목록에 "권한 범위 외" 배지
  - `unsetScope`: `platformScope === "unset"` → 승인 차단 (관계사 미지정) + "관계사 미지정" 배지
  - **escalation 방지**: 관계사관리자는 항목을 전사 공용으로 승격 불가 (`setPlatformCompanies`에서 빈 배열 차단, `CompanyMultiSelect`에서 전사 공용 옵션 숨김)
- **담당자(contacts) 편집**: 검토 패널에서 이름·부서·이메일·역할 직접 수정 가능 (퇴사·인사이동 대응). 처리 완료 항목은 읽기 전용 카드로 표시.
- **`pendingCount`**: `pendingItems.length`를 `<AdminSidebar>`에 전달
- **`useAuth` import 경로**: `../../context/useAuth` (`AdminReview.tsx`는 `src/pages/admin/`, `useAuth.ts`는 `src/context/`에 위치 — 경로 정합 확인됨)

#### `AdminProjectManage.tsx` — `/admin/projects`
- **역할**: 승인된 프로젝트·플랫폼 항목 전체 관리. 검색·필터링, 인라인 편집, 상태 변경, 삭제, 관리자 직접 등록. 관계사 관리자 권한 범위(B안 enforcement) 적용 — 완료.
- **내부 타입**: `ManagedProjectItem`(`kind: "project"`) | `ManagedPlatformItem`(`kind: PlatformId`, `company`·`platformScope` 포함) 유니온. `isProjectKind()` 타입 가드로 분기.
- **내부 컴포넌트** (모듈 레벨): `FieldRow`, `SectionBlock`, `TagSelect`, `SingleSelectTag`, `ChipEditor`, `CompanyMultiSelect`(`allowedCodes`·`allowCompanyWide` 확장)
- **주요 state**
  - `items: ManagedItem[]` — 전체 관리 대상 목록(프로젝트 + 플랫폼 항목)
  - `selected: string` — 현재 선택 항목 ID
  - `editMode / isNew: boolean`, `editData: ManagedItem | null` — 편집·신규 등록 상태
  - `deleteConfirm: string | null` — 삭제 확인 대상
  - `search / filterStatus / sourceFilter` — 검색·필터
  - `draftCompany / draftParent / draftDept` — 프로젝트 조직 항목 추가용 드래프트
- **권한 판정** (`useAuth()` 사용, AdminReview와 동일 규칙 재사용)
  - `itemCompaniesOf()` / `itemIsCompanyWideOf()` / `canManageManagedItem()` — 항상 원본 항목 기준 판정
  - `canManageCurrent`: 현재 선택 항목 관리 가능 여부(신규 등록은 항상 true) → 수정·삭제 버튼 조건 노출, 범위 밖은 열람 안내
  - `handleSave` / `handleDelete`에 이중 가드(UI 우회 방지). 관계사관리자의 전사 공용 저장 차단.
  - `orgCompanyChoices`: 신규 프로젝트 `orgEntries` 추가용 관계사 선택지를 담당 관계사로 제한, `addOrgEntry`에서 재검증
  - `CompanyMultiSelect`에 `allowedCodes={companyEditAllowed}`·`allowCompanyWide={isGlobalAdmin}` 적용
- **목록 배지**: `platformScope === "unset"` → "관계사 미지정", 담당 범위 밖 → "권한 범위 외"

#### `AdminTaxonomy.tsx` — `/admin/taxonomy`
- **역할**: 분류체계 관리. 탭(비즈니스 도메인·시스템 유형·상태·사용 대상·기술 스택·자유 태그)별 항목 추가/삭제/편집. 자유 태그 → 공식 분류 편입.
- **주요 state**
  - `activeTab: TabId` — 현재 선택된 분류 탭
  - `taxonomy: Record<string, Category>` — 전체 분류체계 데이터
  - `freeTags: FreeTag[]` — 자유 태그 목록
  - `editingItem / newItem: string` — 편집·추가 입력값

#### `AdminOrg.tsx` — `/admin/org`
- **역할**: 부서/조직 관리 + 관계사별 Tech Hub 노출 관리. 섹션 1(관계사 노출 관리) / 섹션 2(부서 관리)로 번호 분리. 부서 CRUD, 관계사 단위 아코디언(기본 접힘·검색 시 자동 펼침·모두 펼치기/접기), Teams 연동 미리보기.
- **내부 컴포넌트** (모듈 레벨): `CompanyVisibilityDropdown`(닫힌 멀티셀렉트)
- **내부 헬퍼**: `platformItemCountByCompany()` — 관계사별 플랫폼 항목 수 집계
- **주요 동작**: 부서 dedup 키를 `company + parent + name` 조합으로 사용. Teams 동기화 시 동일 키는 병합(`source: merged`).
- **주요 state**
  - `depts: Dept[]` — 부서 목록
  - `search: string` — 검색어
  - `filterParent: string` — 상위 조직 필터
  - `editingId: number | null` — 인라인 편집 대상
  - `showSyncPreview: boolean` — Teams 동기화 미리보기 패널 표시 여부

#### `AdminUsers.tsx` — `/admin/users`
- **역할**: 사용자 권한 관리. 탭 3개 — 관리자 권한 부여/회수, 등록자 현황, 활동 로그.
- **주요 동작**
  - 관리자 부여 UI에 전사/관계사 범위 선택 + 담당 관계사 멀티셀렉트(`ManagedCompanySelect`). 관계사 관리자는 담당 관계사 1곳 이상 필수.
  - 목록에 권한 범위 배지. 전사관리자 최소 1명 유지 가드(마지막 global 회수 차단).
  - 등록자 현황은 프로젝트 + 플랫폼 항목 통합 집계.
  - 활동 로그 카테고리는 "등록물"로 통합 + 출처 칩 + 알 수 없는 카테고리 방어 fallback.
- **내부 컴포넌트** (모듈 레벨): `ManagedCompanySelect`
- **주요 state**
  - `activeTab: "관리자 권한" | "등록자 관리" | "활동 로그"` — 현재 탭
  - `admins: Admin[]` — 관리자 목록 (`adminScope`·`managedCompanies` 포함)
  - `ssoSearch: string` — SSO 사용자 검색 입력값
  - `logCategory: string` — 활동 로그 카테고리 필터

#### `AdminStatistics.tsx` — `/admin/statistics`
- **역할**: 통계 대시보드. 기간 선택(이번 달/3개월/6개월/올해/월 지정)에 따른 출처별 등록 현황·등록 추이(stacked), 도메인·상태·스택·시스템 유형·부서별 분포, 플랫폼 항목 분석(난이도·비용), 절감 효과 요약. 관계사 관리자 권한 범위(B안 enforcement) 적용 — 완료.
- **권한 범위 집계** (`useAuth()` 사용)
  - `isGlobalAdmin ? null : managedCompanies`를 `scope`로 삼아 `useMemo`로 전 지표 재계산
  - 공용 데이터·헬퍼는 `mocks/statsMockData.ts`에서 import(`STAT_COMPANIES`, `COMPANY_NAME`, `scopedCompanies`, `aggregateMonthly`, `aggregateSourceTotal`, `aggregateDomain`, `monthTotal`, `scopeBadgeText`)
  - 화면 고유 데이터: 상태·스택·부서·시스템유형·난이도·비용·키워드·절감시간의 관계사 차원 더미와 전용 헬퍼(`aggregateIndexed`, `aggregateDept`, `aggregateKeyword`, `aggregateTimeSaved`, `parseTimeSaved`)
  - 집계 범위 배지, 담당 관계사 없음 빈 상태, 0 나눗셈 방지(`|| 1`) 처리
- **절감 효과 요약**: `parseTimeSaved()` + `PERIOD_MULTIPLIER`로 자유 입력 텍스트를 연간 환산 시간(시간/년)으로 정규화. 매칭 실패 건은 "추정 불가"로 별도 집계.
- **주요 state**
  - `periodMode: "preset" | "month"`, `period`, `pickYear`, `pickMonth` — 조회 기간·월 지정
- **타입 주의**: `MonthPoint`·`SourceKey`·`StatCompany`는 공용 모듈에서 `import type`으로 분리 import

---

## 공통 컴포넌트

| 파일 | 역할 |
|------|------|
| `Navbar.tsx` | 일반 페이지 상단 고정 네비게이션. `useLocation`으로 활성 링크 감지. "플랫폼 바로가기" 드롭다운(`EXTERNAL_PLATFORMS` 상수 기반): n8n은 새 탭 링크, 나만의비서·AI Agent는 "준비 중" 비활성. 로그인 시 아바타 클릭 → 드롭다운 메뉴(내 현황·관리자 이동·로그아웃). 관리자에게만 별 아이콘 링크 노출. |
| `AdminNavbar.tsx` | 관리자 페이지 상단 네비게이션. 로고 + 관리자 뱃지 + 사용자 이니셜 + 로그아웃. |
| `AdminSidebar.tsx` | 관리자 좌측 사이드바. `useLocation`으로 현재 경로 자동 감지 → 활성 메뉴 강조. `pendingCount` prop으로 검토 대기 뱃지 표시. |
| `Footer.tsx` | 공통 푸터. |
| `ProtectedRoute.tsx` | 라우트 가드. `requireAdmin` prop 없으면 미인증 시 `/login?redirect=<pathname>`으로 이동. `requireAdmin` 있으면 비관리자 시 `/projects`로 이동. |

---

## 인증 흐름 (`AuthContext.tsx` + `useAuth.ts`)
CurrentUser {
name, email, dept, title,
role: "user" | "admin",
company: string,          // 소속 관계사 코드
isGroupViewer: boolean,   // 그룹 전체보기 권한
adminScope?: "global" | "company",   // role === "admin"일 때만 의미. 미지정 = "global" 호환
managedCompanies?: string[]          // adminScope === "company"일 때 담당 관계사 코드 목록
}
AuthProvider (context/AuthContext.tsx)
├── user: CurrentUser | null
├── loading: boolean
├── login(user) → setUser + sessionStorage 저장 (데모)
├── logout()   → setUser(null) + sessionStorage 삭제
├── isAdmin    → user.role === "admin"
├── isGlobalAdmin → isAdmin && (adminScope ?? "global") === "global"
├── managedCompanies → user.managedCompanies ?? []
├── canManageCompany(code) → isGlobalAdmin || managedCompanies.includes(code)
└── canManageItem(companies, isCompanyWide?)
→ 전사 공용(isCompanyWide)은 global만 / 특정 관계사는 담당 관계사가 하나라도 겹치면 가능
useAuth() (context/useAuth.ts)
→ useContext(AuthContext) 래퍼. Provider 외부 사용 시 throw.

- **데모 모드**: 앱 진입 시 `sessionStorage("demo_user")`를 읽어 새로고침에도 로그인 유지
- **실제 연동 시**: `GET /api/v1/auth/me` 호출로 세션 확인 예정 (응답에 `company`, `isGroupViewer`, `adminScope`, `managedCompanies` 포함되어야 함 — AuthContext.tsx 내 TODO 주석 참조)

### 관리자 권한체계 (B안)

- **역할 단계**: User / Admin 2단계 유지. 별도 시스템관리자 role을 신설하지 않고, `adminScope`로 권한 범위를 구분.
  - `adminScope: "global"` — 전사관리자. 시스템관리자 역할을 흡수하여 전체 권한 보유. 전체 항목 처리·집계 가능.
  - `adminScope: "company"` — 관계사관리자. `managedCompanies`에 포함된 관계사 항목만 관리·승인·집계.
- **호환성**: `adminScope` 미지정(레거시 데이터)은 `"global"`로 간주 → 기존 단일 Admin 동작과 동일.
- **불변 규칙**: 전사관리자(global) 최소 1명 유지 (AdminUsers에서 마지막 global 회수 차단).
- **데이터 소스**: `managedCompanies`는 Teams 동기화된 관계사 코드와 동일 소스 사용.
- **enforcement 적용 범위 (전 항목 완료)**

  | 대상 | 적용 내용 | 상태 |
  |------|-----------|------|
  | AuthContext / useAuth | 타입(`adminScope`·`managedCompanies`)·헬퍼(`isGlobalAdmin`·`canManageCompany`·`canManageItem`) 중앙화 | 완료 |
  | AdminUsers | 부여 UI 범위 선택·담당 관계사 멀티셀렉트·범위 배지·최소 1명 가드 | 완료 |
  | AdminReview | 담당 관계사 기준 승인·반려 가드(원본 기준 판정), 전사 공용은 global만, escalation 방지 | 완료 |
  | AdminProjectManage | 담당 관계사 기준 관리·상태 변경·삭제 가드, orgEntries 범위 제한, 이중 가드 | 완료 |
  | AdminStatistics / AdminDashboard | 관계사관리자는 집계를 담당 관계사로 한정, global은 전체. 범위 배지·빈 상태 | 완료 |
  | LoginPage (데모 계정) | 관계사관리자 프리셋으로 enforcement 실동작 검증 수단 제공 | 완료 |

- **판정 원칙**: 승인·수정·삭제 등 모든 권한 판정은 **편집 중 상태가 아닌 원본 항목** 기준으로 수행하여, 관계사 필드를 편집해 권한을 우회하는 것을 차단.
- **승격 경로**: 추후 C안(scope 값을 role명으로 승격)으로 확장 가능.

---

## 공용 타입 (`types/platformTypes.ts`)

| 타입/상수 | 설명 |
|---|---|
| `PlatformId` | `"n8n" \| "assistant" \| "ai-orchestration"` |
| `Platform` | 플랫폼 메타 (id, name, shortDesc, path, accessUrl, color, bg, icon) |
| `PlatformItemStatus` | `"운영 중" \| "개발 중" \| "파일럿" \| "보류" \| "종료"` |
| `PlatformItem` | 플랫폼 항목 타입. `company: string[]` — 소속 관계사 코드 배열 (비어있으면 전사 공용). `platformScope: "unset" \| "company-wide" \| "specific"`. n8n/assistant 전용 필드(nodes, connectedApps 등)와 AI Agent 전용 필드(modelMeta) 포함. |
| `PLATFORMS` | n8n·나만의 비서·AI Agent 플랫폼 메타 배열. 출처 색상·경로의 단일 기준(source of truth). |
| `PLATFORM_ICON_PATH` | 플랫폼 아이콘 SVG path 매핑 |

---

## 공용 Mock 모듈 (`mocks/statsMockData.ts`)

> AdminStatistics.tsx / AdminDashboard.tsx가 공유하는 관계사 차원 더미와 범위 집계 헬퍼. 두 화면의 숫자 정합성(동일 관계사의 `SOURCE_TOTAL` 등)을 한 곳에서 관리하기 위해 추출.  
> **DEMO 전용 — 백엔드 연동 시 전량 폐기.** 실제로는 `GET /api/v1/admin/stats/*?company=:codes` 형태로 서버가 관계사 범위로 필터링한 집계를 응답(화면 단 합산 불필요).

| 항목 | 설명 |
|---|---|
| `SourceKey` (type) | `"project" \| PlatformId` — platformTypes와 정합한 정식 표기. `ai-orchestration` 사용. |
| `MonthPoint` (type) | 월별 포인트. `key`(예: `"2025-06"`)·`m`·`month`(둘 다 `"6월"`)를 동시 제공하여 두 화면의 표기 차이 흡수. |
| `STAT_COMPANIES` / `StatCompany` | 더미 기준 관계사 코드(`KKM`·`KBH`·`HC`·`KMG`·`KMW`·`KUS`·`KBT`). 데모 계정 `managedCompanies`와 매칭. |
| `COMPANY_NAME` | 관계사 코드 → 표시명 매핑. |
| `MONTH_SERIES_BY_COMPANY` | 관계사별 월×출처 시계열. `key`/`m`/`month` 동시 제공. |
| `SOURCE_TOTAL_BY_COMPANY` | 관계사별 누적 출처 합계. |
| `DOMAIN_LABELS` / `DOMAIN_BY_COMPANY` | 도메인 라벨(고정 순서) + 관계사별 수치. |
| `scopedCompanies(scope)` | `scope === null`이면 전체, 배열이면 해당 관계사만 반환. |
| `aggregateMonthly` / `aggregateSourceTotal` / `aggregateDomain` | 범위 내 관계사 합산 헬퍼. |
| `monthTotal(m)` | 월 포인트의 출처 합계. |
| `scopeBadgeText(isGlobalAdmin, companies)` | 집계 범위 배지 문구 생성(전사 기준 / 담당 관계사 N곳: 이름…). |

- **타입 import 주의**: `SourceKey`·`MonthPoint`·`StatCompany`는 타입이므로 소비 측에서 반드시 `import type`으로 분리. 값 import(`scopedCompanies` 등)와 한 구문에 섞으면 `verbatimModuleSyntax` 위반으로 화면 로딩이 실패한다.
- **화면 고유 데이터 비공용화**: AdminStatistics의 상태·스택·부서·유형·난이도·비용·키워드·절감시간, AdminDashboard의 `PENDING_ALL`·`RECENT_APPROVED_ALL`·`ACTIVE_TOOLS_BY_COMPANY`는 공용화하지 않고 각 화면 파일에 유지한다.

---

## 플랫폼 포지셔닝 — 그룹 AX 확산

Kolmar Tech Hub는 단순 등록·탐색 도구를 넘어, 그룹 전체 AX(AI 전환) 확산 활동의 산출물을 모으는 저장소로 포지셔닝됩니다.

- **빌더-카탈로그 계층 분리**: 도구를 만드는 빌더 활동과 이를 발견·재사용하는 카탈로그 계층을 구분.
- **정량적 성과 가시화**: 예상 절감 시간 등 정량 지표를 표면화하여 도구의 실효 가치를 드러냄.
- **해커톤 연계 흐름**: 해커톤 등 확산 이벤트의 산출물이 자연스럽게 플랫폼으로 유입되도록 설계.
- **확산 메시지 포지셔닝**: 중복 개발 감소와 그룹 차원의 도구 재사용을 핵심 메시지로 전달.

### 예상 절감 시간 데이터 모델 (`expected_time_saved`)

- **입력 정규화 규칙(예정)**: 자유 텍스트 입력을 수치 + 고정 단위 "시간/주"(주당 시간 기준)로 정규화. ProjectRegisterPage 입력을 AdminStatistics 집계에 연결.
- **현재 집계 방식**: AdminStatistics의 `parseTimeSaved()`가 "주 1시간", "월 4시간", "하루 30분" 등 자유 텍스트를 연간 환산 시간(시간/년)으로 파싱. 매칭 실패 건은 "추정 불가"로 별도 집계.
- **표기 철학**
  - 랜딩 페이지: 주당 환산값으로 "현재 실효 가치"를 정직하게 표현.
  - AdminStatistics: 연간 환산값으로 "운영 성과 리포트" 관점 제공.

---

## API 연동 준비 (`lib/api.ts`)

```ts
api.get<T>(path)
api.post<T>(path, body)
api.put<T>(path, body)
api.delete<T>(path)
```

- `VITE_API_URL` 환경변수 기반 (`http://localhost:8000`)
- 현재 모든 페이지는 목업(mock) 데이터 사용 — `// TODO: 실제 연동 시 ...` 주석으로 교체 지점 표시

---

## 주요 API 엔드포인트 (연동 예정)

| 메서드 | 경로 | 대응 페이지 |
|--------|------|------------|
| `GET` | `/api/v1/projects` | ProjectListPage |
| `GET` | `/api/v1/projects/:id` | ProjectDetailPage |
| `POST` | `/api/v1/projects` | ProjectRegisterPage |
| `POST` | `/api/v1/projects/:id/edit-requests` | EditRequestPage |
| `GET` | `/api/v1/platforms/:platformId/items/:itemId` | PlatformItemDetailPage |
| `POST` | `/api/v1/platforms/:platformId/items` | ProjectRegisterPage (플랫폼 항목 등록) |
| `GET` | `/api/v1/my/projects` | MyStatusPage |
| `PATCH` | `/api/v1/projects/:id/status` | MyStatusPage (상태 변경) |
| `GET` | `/api/v1/admin/review-queue` | AdminReview |
| `PATCH` | `/api/v1/admin/projects/:id/approve` | AdminReview |
| `PATCH` | `/api/v1/admin/projects/:id/reject` | AdminReview |
| `PATCH` | `/api/v1/admin/platform-items/:id/approve` | AdminReview (플랫폼 항목, body에 company·platformScope 포함) |
| `PATCH` | `/api/v1/admin/platform-items/:id/reject` | AdminReview (플랫폼 항목) |
| `GET` | `/api/v1/admin/projects` | AdminProjectManage |
| `GET` | `/api/v1/admin/taxonomy` | AdminTaxonomy |
| `GET` | `/api/v1/admin/departments` | AdminOrg |
| `GET` | `/api/v1/admin/companies?visible=true` | AdminOrg, AdminReview, AdminProjectManage, ProjectRegisterPage (관계사 목록) |
| `GET` | `/api/v1/admin/users` | AdminUsers |
| `GET` | `/api/v1/admin/pending?company=:codes` | AdminDashboard (승인 대기, 관계사 범위 필터) |
| `GET` | `/api/v1/admin/recent-approved?company=:codes` | AdminDashboard (최근 승인, 관계사 범위 필터) |
| `GET` | `/api/v1/admin/stats/*?company=:codes` | AdminStatistics, AdminDashboard (관계사 범위 집계. `company` 미지정 시 전사) |
| `GET` | `/api/v1/auth/me` | AuthContext (응답에 adminScope·managedCompanies 포함) |
| `POST` | `/api/v1/auth/logout` | AuthContext |

> **통계·대시보드 범위 필터 방침**: 관계사 범위 한정은 서버 사이드에서 `?company=:codes` 파라미터로 수행한다. 전사관리자는 파라미터 없이(또는 전체 코드로) 전체 집계를 받고, 관계사관리자는 `managedCompanies`를 전달한다. 현재 프론트의 관계사 차원 더미·화면 단 합산(`mocks/statsMockData.ts` 및 각 화면 고유 헬퍼)은 이 서버 동작을 데모로 대체한 것이며, 연동 시 폐기한다.