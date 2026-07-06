# Kolmar AX Platform — 프로젝트 구조 문서

> React + TypeScript (Vite) 프론트엔드 / FastAPI + PostgreSQL 백엔드  
> 그룹 전체 AX(AI 전환) 확산 산출물(자동화·AI 도구·ML 모델·Vibe Coding)을 등록·탐색·관리하는 사내 통합 플랫폼

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
│   ├── AuthContext.tsx # 전역 인증 상태 (user, login, logout, isAdmin, isGroupViewer)
│   └── useAuth.ts      # useAuth 훅 (useContext(AuthContext))
├── types/
│   └── platformTypes.ts # PlatformId(6종), Platform, PlatformItem 등 플랫폼 공용 타입
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
├── ProjectListPage.tsx         # AX 플랫폼 탐색 (/projects)
├── PlatformItemDetailPage.tsx  # 6개 플랫폼 타입 항목 상세
├── ProjectRegisterPage.tsx     # AX 항목 등록 신청 (/projects/new)
├── MyStatusPage.tsx
├── EditRequestPage.tsx
└── admin/
├── AdminDashboard.tsx
├── AdminReview.tsx
├── AdminProjectManage.tsx
├── AdminTaxonomy.tsx
├── AdminOrg.tsx
├── AdminUsers.tsx
├── AdminStatistics.tsx
└── AdminPlatforms.tsx

---

## 라우트 & 페이지 요약

### 공개 페이지 (인증 불필요)

#### `LandingPage.tsx` — `/`
- **역할**: 플랫폼 홈. Hero 섹션 + 통계 + 최근 등록 AX 항목 6개 카드. 검색창에서 `/projects?q=...`로 이동.
- **주요 state**
  - `hovered: number | null` — 항목 카드 hover 인덱스
  - `search: string` — Hero 검색 입력값

#### `LoginPage.tsx` — `/login`
- **역할**: Microsoft SSO 로그인 화면. `?redirect=` 쿼리로 로그인 후 복귀 경로 수신. 데모 단계에서는 SSO 버튼이 관리자 계정으로 로그인하고, 그 아래 접이식 데모 계정 전환 UI로 일반 사용자 계정을 선택할 수 있다.
- **데모 계정 프리셋** (`DEMO_ACCOUNTS`, DEMO 전용 — 실제 SSO 연동 시 이 영역 전량 제거)
  - 관리자 (`role: "admin"`) — 전체 데이터 관리·집계
  - 일반 사용자 (`role: "user"`) — 등록 신청만 가능, 관리자 화면 접근 불가
  - 관리자 계정 선택 시 `/admin`으로, 그 외에는 `redirect` 경로로 이동
- **주요 state**
  - `loading: boolean` — SSO 요청 진행 중 여부
  - `demoOpen: boolean` — 데모 계정 선택 영역 펼침 여부
- **AuthContext 사용**: `login()` — 사용자 세션 저장

#### `AboutPage.tsx` — `/about`
- **역할**: 플랫폼 소개 페이지. 문제 정의 → 작동 방식(4단계) → 핵심 가치 → Phase 2 로드맵 → CTA.
- **주요 state**: 없음 (정적 콘텐츠)

#### `ProjectListPage.tsx` — `/projects`
- **역할**: AX 플랫폼 탐색. 좌측 필터 사이드바(플랫폼 종류·상태·관계사)와 상단 검색·정렬. URL 쿼리스트링(`?q=`)과 검색어 동기화.
- **주요 state**
  - `search: string` — 검색어 (URL 쿼리스트링과 동기화)
  - `source: "전체" | PlatformId` — 플랫폼 필터 (6종 + 전체)
  - `status: string` — 운영 상태 필터
  - `company: string` — 관계사 필터
  - `sort: "최신순" | "인기순" | "이름순" | "부서순"` — 정렬 기준 (최신순 기본)
  - `sidebarOpen: boolean` — 필터 사이드바 열림 여부 (기본 닫힘)
  - `hovered: number | null` — 카드 hover 인덱스
- **파생 값**: `filtered` — `useMemo`로 계산한 필터·정렬 결과 (`PlatformItem[]`)

#### `PlatformItemDetailPage.tsx` — `/n8n/:itemId` `/pa/:itemId` `/assistant/:itemId` `/ai-orchestration/:itemId` `/ml/:itemId` `/vibe/:itemId`
- **역할**: AX 항목(n8n 워크플로우·Power Automate 플로우·나만의 비서 에이전트·AI Agent 모델·ML 모델·Vibe Coding) 상세 보기. 플랫폼 종류에 따라 다른 섹션을 조건부 렌더링. 좋아요·댓글·복사 기능.
- **URL param**: `itemId` (`useParams`). `useLocation`이나 경로 파싱으로 `platformId` 도출.

---

### 인증 필요 페이지 (`ProtectedRoute`)

#### `ProjectRegisterPage.tsx` — `/projects/new`
- **역할**: 신규 AX 항목 등록 신청. 4단계 스텝 폼 (유형 선택 → 기본정보 → 플랫폼별 상세 → 담당자·링크 → 최종확인).
- **등록 가능 유형**: `PlatformId` 6종 — n8n, pa(Power Automate), assistant(나만의 비서), ai-orchestration(AI Agent), ml, vibe
- **내부 컴포넌트** (모듈 레벨): `Section`, `Field`, `Tag`, `RowRemoveButton`, `TimeSavedInput`, `CompanyMultiSelect`, `ChipInput`
- **주요 state**
  - `step: 0–4` — 현재 스텝
  - `kind: PlatformId | null` — 선택된 항목 유형
  - `form: FormState` — 전체 폼 데이터
    - `title, summary, description` — 기본정보
    - `status` — 운영 상태
    - `triggerAction, nodes[], connectedApps[], specificUrl` — 워크플로우형(n8n·pa·assistant) 전용
    - `timeSavedValue, timeSavedPeriod` — 예상 절감 시간 (워크플로우형)
    - `provider, contextWindow, strengths, costTier` — AI Agent 전용
    - `mlType, trainingDataDesc, performanceSummary` — ML 전용
    - `devTool, sourceRepo, outputType` — ML/Vibe 공용
    - `platformCompanies: string[]`, `platformScope: "unset" | "company-wide" | "specific"` — 소속/대상 관계사
    - `contacts: Contact[]` — 담당자 목록
    - `links: LinkItem[]` — 외부 링크 목록
  - `saving / saved: boolean` — 제출 진행·완료 여부
- **Step 2 분기**: 워크플로우형(n8n·pa·assistant) → 동작 정보·커넥터/노드 구성·예상 효과 / AI Agent → 모델 사양 / ML → ML 모델 정보 / Vibe → Vibe Coding 정보

#### `MyStatusPage.tsx` — `/my-status`
- **역할**: 내가 등록 신청한 AX 항목 목록. 승인/대기/반려 탭 필터. 승인 항목은 운영 상태 직접 변경 가능. 반려 항목은 재제출 또는 삭제 가능.
- **내부 컴포넌트** (모듈 레벨): `StatusChanger` — 승인된 항목의 상태 변경 드롭다운
- **주요 state**
  - `filter: "전체" | "승인" | "대기" | "반려"` — 목록 필터
  - `expanded / resubmit / deleteConfirm: string | null` — 패널 열림 항목 ID
  - `deleted: string[]` — 로컬에서 제거된 항목 ID
  - `statusOverrides: Record<string, string>` — 승인 항목 상태 변경값 로컬 저장
- **승인 항목 클릭**: 플랫폼 경로(`PLATFORMS.path`)로 상세 페이지 이동

#### `EditRequestPage.tsx` — `/edit-request/:id`
- **역할**: 게시된 AX 항목 정보 수정 신청. 수정할 필드를 체크박스로 선택 후 변경 내용과 사유 입력.
- **수정 가능 필드**: 항목명, 한 줄 요약, 상세 설명, 운영 상태
- **주요 state**
  - `selectedFields: string[]` — 수정 신청 대상 필드 키 목록
  - `changes: Record<string, string>` — 필드별 변경 내용
  - `reason: string` — 수정 사유
  - `submitting / submitted: boolean` — 제출 진행·완료 여부
- **URL param**: `id` (`useParams`)

---

### 관리자 전용 페이지 (`RequireAdmin`)

모든 관리자 페이지는 `<AdminNavbar />` + `<AdminSidebar />` 레이아웃을 공유합니다.

#### `AdminDashboard.tsx` — `/admin`
- **역할**: 관리자 메인 대시보드. 핵심 지표(전체 등록물·승인 대기·이번 달 신규·운영 중 도구), 대기 목록, 최근 승인 목록, 월별 출처별 누적 추이, 출처 구성, 도메인 분포.
- **권한**: 모든 관리자가 전체 데이터를 조회·집계. (`useAuth` 미사용 — `canEdit = true`)
- **공용 데이터**: `mocks/statsMockData.ts`에서 `scopedCompanies`, `aggregateSourceTotal`, `aggregateMonthly`, `aggregateDomain`, `monthTotal` import
- **경로 정합성**: 최근 승인 항목 클릭 시 `PLATFORMS.path` 기준으로 상세 경로 이동

#### `AdminReview.tsx` — `/admin/review`
- **역할**: AX 항목을 단일 대기열로 통합 검토. 관리자가 정보를 직접 수정한 후 승인/반려.
- **내부 타입**: `ReviewPlatformItem` (`kind: PlatformId`) — 워크플로우형·AI Agent·ML·Vibe 각 전용 필드 포함. `company: string[]`, `platformScope`
- **권한**: `canEdit = true` — 모든 관리자가 전체 항목 처리 가능 (`useAuth` 미사용)
- **내부 컴포넌트** (모듈 레벨): `FieldRow`, `SectionBlock`, `TagSelect`, `SingleSelectTag`, `ChipEditor`, `CompanyMultiSelect`, `TimeSavedInput`
- **주요 state**
  - `items: ReviewItem[]`, `selected: string`, `done: string[]`
  - `edits: Record<string, Partial<ReviewItem>>` — 관리자 수정 누적 맵
  - `filter / sourceFilter` — 목록 필터
  - `rejectOpen / rejectReason` — 반려 사유 입력
- **예상 절감 시간**: `timeSavedValue`·`timeSavedPeriod`를 임시 키로 보관, 승인 시 `serializeTimeSaved`로 `expectedTimeSaved`에 직렬화

#### `AdminProjectManage.tsx` — `/admin/projects`
- **역할**: 승인된 AX 항목 전체 관리. 검색·필터링, 인라인 편집, 상태 변경, 삭제, 관리자 직접 등록.
- **내부 타입**: `ManagedPlatformItem` (`kind: PlatformId`) — 6개 플랫폼 타입 전용 필드 포함
- **권한**: `canEdit = true` — 모든 관리자가 전체 항목 관리 가능 (`useAuth` 미사용)
- **내부 컴포넌트** (모듈 레벨): `FieldRow`, `SectionBlock`, `TagSelect`, `SingleSelectTag`, `ChipEditor`, `CompanyMultiSelect`, `TimeSavedInput`
- **주요 state**
  - `items: ManagedItem[]`, `selected: string`
  - `editMode / isNew: boolean`, `editData: ManagedItem | null`
  - `timeSavedValue / timeSavedPeriod` — 예상 절감 시간 편집 상태 (editData와 분리)
  - `deleteConfirm / search / filterStatus / sourceFilter`
- **신규 등록**: `startNew(kind: PlatformId)` — 6개 플랫폼 타입별 빈 항목 생성

#### `AdminTaxonomy.tsx` — `/admin/taxonomy`
- **역할**: AX 항목 분류체계 관리. 탭별 항목 추가/삭제/편집. 출처(SourceKind = PlatformId) 탭에는 6개 플랫폼 종류가 포함되며, "project" 탭은 없다.
- **주요 state**
  - `activeTab: TabId` — 현재 선택된 분류 탭
  - `taxonomy: Record<string, Category>` — 전체 분류체계 데이터
  - `freeTags: FreeTag[]` — 자유 태그 목록

#### `AdminOrg.tsx` — `/admin/org`
- **역할**: 부서/조직 관리 + 관계사별 AX Platform 노출 관리. 섹션 1(관계사 노출 관리) / 섹션 2(부서 관리). 부서 CRUD, 관계사 단위 아코디언, Teams 연동 미리보기.
- **내부 컴포넌트** (모듈 레벨): `CompanyVisibilityDropdown`

#### `AdminUsers.tsx` — `/admin/users`
- **역할**: 사용자 권한 관리. 탭 3개 — 관리자 권한 부여/회수, 등록자 현황, 활동 로그.
- **권한 모델**: `role: "admin" | "user"` 2단계. 별도 adminScope/managedCompanies 없음.
  - 관리자 부여 UI: SSO 사용자 검색 후 `role: "admin"` 부여. 전사관리자 최소 1명 유지 가드.
  - 등록자 현황: 플랫폼 항목 통합 집계
  - 활동 로그: 출처 칩 표시

#### `AdminStatistics.tsx` — `/admin/statistics`
- **역할**: 통계 대시보드. 기간 선택에 따른 플랫폼 종류별 등록 현황·등록 추이, 상태·부서별 분포, 절감 효과 요약.
- **권한**: 모든 관리자가 전체 집계 조회. (`useAuth` 미사용)
- **공용 데이터**: `mocks/statsMockData.ts`에서 `STAT_COMPANIES`, `COMPANY_NAME`, `scopedCompanies`, `aggregateMonthly`, `aggregateSourceTotal`, `aggregateDomain`, `monthTotal` import
- **주요 state**: `periodMode`, `period`, `pickYear`, `pickMonth` — 조회 기간

#### `AdminPlatforms.tsx` — `/admin/platforms`
- **역할**: AX 플랫폼 메타데이터 관리. 6개 플랫폼 항목의 이름·설명·경로·색상·아이콘 등 메타 정보 CRUD.
- **권한**: 모든 관리자 편집 가능
- **내부 상수**: `ICON_OPTIONS`(아이콘 선택지), `COLOR_PRESETS`(색상 프리셋)

---

## 공통 컴포넌트

| 파일 | 역할 |
|------|------|
| `Navbar.tsx` | 일반 페이지 상단 고정 네비게이션. "AX 플랫폼 바로가기" 드롭다운(`EXTERNAL_PLATFORMS` — n8n·나만의 비서·AI Agent·Power Automate·ML 모델·Vibe Coding 6개). n8n은 실제 링크, 나머지는 "준비 중" 비활성. 로그인 시 아바타 클릭 → 드롭다운 메뉴. 관리자에게만 별 아이콘 링크 노출. |
| `AdminNavbar.tsx` | 관리자 페이지 상단 네비게이션. 로고 + 관리자 뱃지 + 사용자 이니셜 + 로그아웃. |
| `AdminSidebar.tsx` | 관리자 좌측 사이드바. `useLocation`으로 현재 경로 자동 감지 → 활성 메뉴 강조. `pendingCount` prop으로 검토 대기 뱃지 표시. |
| `Footer.tsx` | 공통 푸터. |
| `ProtectedRoute.tsx` | 라우트 가드. `requireAdmin` prop 없으면 미인증 시 `/login?redirect=<pathname>`으로 이동. `requireAdmin` 있으면 비관리자 시 `/projects`로 이동. |

---

## 인증 흐름 (`AuthContext.tsx` + `useAuth.ts`)

```
CurrentUser {
  name, email, dept, title,
  role: "user" | "admin",
  company: string,          // 소속 관계사 코드
  isGroupViewer: boolean,   // 그룹 전체보기 권한
}

AuthProvider (context/AuthContext.tsx)
├── user: CurrentUser | null
├── loading: boolean
├── login(user) → setUser + sessionStorage 저장 (데모)
├── logout()   → setUser(null) + sessionStorage 삭제
├── isAdmin    → user.role === "admin"
└── isGroupViewer → user.isGroupViewer

useAuth() (context/useAuth.ts)
→ useContext(AuthContext) 래퍼. Provider 외부 사용 시 throw.
```

- **데모 모드**: 앱 진입 시 `sessionStorage("demo_user")`를 읽어 새로고침에도 로그인 유지
- **실제 연동 시**: `GET /api/v1/auth/me` 호출로 세션 확인 예정

### 관리자 권한체계

- **역할 단계**: User / Admin 2단계.
  - `role: "admin"` — 전사 기준 전체 항목 관리·승인·집계 가능.
  - `role: "user"` — 등록 신청만 가능, 관리자 화면 접근 불가.
- **불변 규칙**: 관리자 최소 1명 유지 (AdminUsers에서 마지막 admin 회수 차단).

---

## 공용 타입 (`types/platformTypes.ts`)

| 타입/상수 | 설명 |
|---|---|
| `PlatformId` | `"n8n" \| "pa" \| "assistant" \| "ai-orchestration" \| "ml" \| "vibe"` (6종) |
| `Platform` | 플랫폼 메타 (id, name, shortDesc, path, accessUrl, color, bg, icon). `accessUrl: string \| null` — pa·ml·vibe는 아직 URL 미확정 |
| `PlatformItemStatus` | `"운영 중" \| "개발 중" \| "파일럿" \| "보류" \| "종료"` |
| `PlatformItem` | AX 항목 공용 타입. `company: string[]` — 소속 관계사 코드(비어있으면 전사 공용). `platformScope`. `expectedTimeSaved?: string`. 워크플로우형 전용 필드(nodes·connectedApps 등), AI Agent 전용(modelMeta), ML 전용(mlType·trainingDataDesc·performanceSummary), ML/Vibe 공용(devTool·sourceRepo·outputType) 포함. |
| `PLATFORMS` | 6개 플랫폼 메타 배열. 출처 색상·경로의 단일 기준(source of truth). |
| `PLATFORM_ICON_PATH` | 플랫폼 아이콘 SVG path 매핑 (6키) |

---

## 공용 Mock 모듈 (`mocks/statsMockData.ts`)

> AdminStatistics.tsx / AdminDashboard.tsx가 공유하는 관계사 차원 더미와 범위 집계 헬퍼.  
> **DEMO 전용 — 백엔드 연동 시 전량 폐기.**

| 항목 | 설명 |
|---|---|
| `SourceKey` (type) | `PlatformId` — 6종 플랫폼 타입. "project" 없음. |
| `MonthPoint` (type) | 월별 포인트. 6개 플랫폼 필드(n8n·pa·assistant·"ai-orchestration"·ml·vibe). `key`·`m`·`month` 동시 제공. |
| `STAT_COMPANIES` / `StatCompany` | 더미 기준 관계사 코드. |
| `COMPANY_NAME` | 관계사 코드 → 표시명 매핑. |
| `MONTH_SERIES_BY_COMPANY` | 관계사별 월×출처 시계열. |
| `SOURCE_TOTAL_BY_COMPANY` | 관계사별 누적 출처 합계. |
| `DOMAIN_LABELS` / `DOMAIN_BY_COMPANY` | 도메인 라벨 + 관계사별 수치. |
| `scopedCompanies(scope)` | `scope === null`이면 전체, 배열이면 해당 관계사만 반환. |
| `aggregateMonthly` / `aggregateSourceTotal` / `aggregateDomain` | 범위 내 관계사 합산 헬퍼. |
| `monthTotal(m)` | 월 포인트의 출처 합계. |

- **타입 import 주의**: `SourceKey`·`MonthPoint`·`StatCompany`는 반드시 `import type`으로 분리. 값 import와 섞으면 `verbatimModuleSyntax` 위반.

---

## 플랫폼 포지셔닝 — 그룹 AX 확산

Kolmar AX Platform은 그룹 전체 AX(AI 전환) 확산 활동의 산출물을 모으는 저장소로 포지셔닝됩니다.

- **6대 AX 플랫폼 유형**: n8n(업무 자동화), Power Automate(플로우 자동화), 나만의 비서(HK GPT 커스텀), AI Agent(AI 오케스트레이션), ML 모델, Vibe Coding
- **빌더-카탈로그 계층 분리**: 도구를 만드는 빌더 활동과 이를 발견·재사용하는 카탈로그 계층을 구분.
- **정량적 성과 가시화**: 예상 절감 시간 등 정량 지표를 표면화하여 도구의 실효 가치를 드러냄.

### 예상 절감 시간 데이터 모델 (`expectedTimeSaved`)

- **입력 정규화**: "수치 + 주기(일/주/월/년)" 입력으로 정규화. `"<주기> N시간"` 표준 문자열로 직렬화(예: `"주 3시간"`).
  - **연간 환산 계수**: `PERIOD_ANNUAL_FACTOR = { 일: 365, 주: 52, 월: 12, 년: 1 }`
  - **입력 위젯**: `TimeSavedInput`(모듈 레벨 컴포넌트) — 주기 선택 + 수치 입력 + 연간 환산 안내
- **집계 방식**: AdminStatistics의 `parseTimeSaved()`가 표준 문자열을 연간 환산 시간으로 파싱.

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
| `GET` | `/api/v1/platform-items` | ProjectListPage (AX 항목 탐색) |
| `POST` | `/api/v1/platform-items` | ProjectRegisterPage (AX 항목 등록, body에 kind·expectedTimeSaved 포함) |
| `POST` | `/api/v1/platform-items/:id/edit-requests` | EditRequestPage |
| `GET` | `/api/v1/platforms/:platformId/items/:itemId` | PlatformItemDetailPage |
| `GET` | `/api/v1/my/platform-items` | MyStatusPage |
| `PATCH` | `/api/v1/platform-items/:id/status` | MyStatusPage (상태 변경) |
| `GET` | `/api/v1/admin/review-queue` | AdminReview |
| `PATCH` | `/api/v1/admin/platform-items/:id/approve` | AdminReview (body에 company·platformScope·expectedTimeSaved 포함) |
| `PATCH` | `/api/v1/admin/platform-items/:id/reject` | AdminReview |
| `GET` | `/api/v1/admin/platform-items` | AdminProjectManage |
| `PUT` | `/api/v1/admin/platform-items/:id` | AdminProjectManage |
| `GET` | `/api/v1/admin/taxonomy` | AdminTaxonomy |
| `GET` | `/api/v1/admin/departments` | AdminOrg |
| `GET` | `/api/v1/admin/companies?visible=true` | AdminOrg, AdminReview, AdminProjectManage, ProjectRegisterPage |
| `GET` | `/api/v1/admin/users` | AdminUsers |
| `GET` | `/api/v1/admin/platforms` | AdminPlatforms |
| `PUT` | `/api/v1/admin/platforms` | AdminPlatforms |
| `GET` | `/api/v1/admin/stats/*` | AdminStatistics, AdminDashboard |
| `GET` | `/api/v1/auth/me` | AuthContext |
| `POST` | `/api/v1/auth/logout` | AuthContext |
