# Kolmar Tech Hub — 프로젝트 구조 문서

> React + TypeScript (Vite) 프론트엔드 / FastAPI + PostgreSQL 백엔드  
> 사내 IT 프로젝트를 등록·탐색·연결하는 내부 플랫폼

---

## 디렉터리 트리

```
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
        │   ├── AuthContext.tsx # 전역 인증 상태 (user, login, logout, isAdmin 등)
        │   └── useAuth.ts     # useAuth 훅 (useContext(AuthContext))
        ├── types/
        │   └── platformTypes.ts # PlatformId, Platform, PlatformItem 등 플랫폼 공용 타입
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
```

---

## 라우트 & 페이지 요약

### 공개 페이지 (인증 불필요)

#### `LandingPage.tsx` — `/`
- **역할**: 플랫폼 홈. Hero 섹션 + 통계 + 최근 등록 프로젝트 6개 카드. 검색창에서 `/projects?q=...`로 이동.
- **주요 state**
  - `hovered: number | null` — 프로젝트 카드 hover 인덱스
  - `search: string` — Hero 검색 입력값

#### `LoginPage.tsx` — `/login`
- **역할**: Microsoft SSO 로그인 화면. 현재는 관리자 계정으로 고정 로그인하는 데모 처리. `?redirect=` 쿼리로 로그인 후 복귀 경로 수신.
- **주요 state**
  - `loading: boolean` — SSO 요청 진행 중 여부
- **AuthContext 사용**: `login()` — 사용자 세션 저장

#### `AboutPage.tsx` — `/about`
- **역할**: 플랫폼 소개 페이지. 문제 정의 → 작동 방식(4단계) → 핵심 가치 → Phase 2 로드맵 → CTA.
- **주요 state**: 없음 (정적 콘텐츠)

#### `ProjectListPage.tsx` — `/projects`
- **역할**: 전체 프로젝트 목록. 좌측 필터 사이드바(도메인·상태·유형)와 상단 검색·정렬. URL 쿼리스트링(`?q=`)과 검색어 동기화.
- **주요 state**
  - `search: string` — 검색어 (URL 쿼리스트링과 동기화)
  - `domain / status / type: string` — 필터 선택값
  - `sort: "최신순" | "이름순" | "부서순"` — 정렬 기준
  - `sidebarOpen: boolean` — 필터 사이드바 열림 여부
  - `hovered: number | null` — 카드 hover 인덱스
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
- **역할**: 플랫폼 항목(n8n 워크플로우, 나만의 비서 에이전트, AI Agent 모델) 상세 보기. 플랫폼 종류에 따라 다른 섹션을 조건부 렌더링. 좋아요·댓글·복사 기능.
- **URL param**: `itemId` (`useParams`). 어느 경로에서 도달했는지 `useLocation`이나 경로 파싱으로 `platformId` 도출.

---

### 인증 필요 페이지 (`ProtectedRoute`)

#### `ProjectRegisterPage.tsx` — `/projects/new`
- **역할**: 신규 프로젝트 등록 신청. 4단계 스텝 폼 (기본정보 → 분류·태그 → 담당자·링크 → 최종확인).
- **주요 state**
  - `step: 0–3` — 현재 스텝
  - `form: FormState` — 전체 폼 데이터
    - `title, summary, description` — 기본정보
    - `status, systemType, domains[], audiences[], departments[], stack[]` — 분류
    - `freeTags, integrations` — 태그
    - `contacts: Contact[]` — 담당자 목록
    - `links: LinkItem[]` — 외부 링크 목록
  - `saving / saved: boolean` — 제출 진행·완료 여부

#### `MyStatusPage.tsx` — `/my-status`
- **역할**: 내가 등록 신청한 프로젝트 목록. 승인/대기/반려 탭 필터. 승인 항목은 상태(개발 중/운영 중 등) 직접 변경 가능. 반려 항목은 재제출 또는 삭제 가능.
- **내부 컴포넌트** (모듈 레벨): `StatusChanger` — 승인된 항목 상태 드롭다운. 종료 상태는 잠금. 입력 끊김 버그 방지를 위해 모듈 레벨 선언.
- **주요 state**
  - `filter: "전체" | "승인" | "대기" | "반려"` — 목록 필터
  - `expanded: string | null` — 내용 확인 패널이 펼쳐진 항목 ID
  - `resubmit: string | null` — 재제출 패널이 열린 항목 ID
  - `deleteConfirm: string | null` — 삭제 확인 패널이 열린 항목 ID
  - `deleted: string[]` — 로컬에서 제거된 항목 ID 목록
  - `statusOverrides: Record<string, string>` — 로컬 상태 변경값
- **마운트 동작**: `useEffect`로 `window.scrollTo({ top: 0 })` 자동 실행
- **정렬**: `useMemo`로 `submittedAt` 내림차순 정렬 + `statusOverrides` 반영

#### `EditRequestPage.tsx` — `/projects/:id/edit-request`
- **역할**: 기존 프로젝트의 정보 수정 신청. 수정할 필드를 체크박스로 선택 후 변경 내용과 사유 입력.
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
- **역할**: 관리자 메인 대시보드. 핵심 지표(전체 프로젝트 수·검토 대기·이번 달 신규), 대기 목록, 최근 승인 목록, 월별 등록 추이, 도메인/스택 분포 차트.
- **주요 state**: 없음 (정적 목업 데이터)
- **`pendingCount`**: `PENDING.length`를 `<AdminSidebar>`에 전달하여 뱃지 표시

#### `AdminReview.tsx` — `/admin/review`
- **역할**: 프로젝트와 플랫폼 항목(n8n, 나만의 비서, AI Agent)을 단일 대기열로 통합 검토. 관리자가 정보를 직접 수정한 후 승인/반려. 관계사 관리자 권한 범위 적용.
- **내부 타입**
  - `ReviewProjectItem` (`kind: "project"`) — 조직 계층(orgEntries), 도메인, 기술 스택 포함
  - `ReviewPlatformItem` (`kind: PlatformId`) — 플랫폼 전용 필드(nodes, connectedApps, modelMeta 등) + `company: string[]` + `platformScope: "unset" | "company-wide" | "specific"`
  - `ReviewItem` = 위 두 타입의 유니온
- **내부 컴포넌트** (모듈 레벨): `FieldRow`, `SectionBlock`, `TagSelect`, `SingleSelectTag`, `ChipEditor`, `CompanyMultiSelect`
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
  - `isGlobalAdmin`: 전사관리자 여부
  - `managedCompanies`: 관계사관리자 담당 관계사 코드 목록
  - `canManageItem(companies, isCompanyWide)`: 항목 처리 가능 여부 판정
  - `outOfScope`: 담당 범위 밖 → 승인·반려 버튼 미노출, 열람만 허용
  - `unsetScope`: `platformScope === "unset"` → 승인 차단 (관계사 미지정)
- **담당자(contacts) 편집**: 검토 패널에서 이름·부서·이메일·역할 직접 수정 가능
- **`pendingCount`**: `pendingItems.length`를 `<AdminSidebar>`에 전달
- **⚠️ 빌드 오류**: `useAuth` import 경로가 `../../auth/useAuth`로 되어 있으나 실제 파일은 `src/context/useAuth.ts` — 경로 불일치로 빌드 실패

#### `AdminProjectManage.tsx` — `/admin/projects`
- **역할**: 승인된 프로젝트 전체 관리. 검색·필터링, 인라인 편집, 프로젝트 삭제.
- **주요 state**
  - `projects: ProjectItem[]` — 전체 프로젝트 목록
  - `search: string` — 검색어
  - `filterStatus / filterDomain / filterType: string` — 필터 선택값
  - `editingId: string | null` — 현재 인라인 편집 중인 항목 ID
  - `editForm` — 편집 중인 항목 데이터

#### `AdminTaxonomy.tsx` — `/admin/taxonomy`
- **역할**: 분류체계 관리. 탭(비즈니스 도메인·시스템 유형·상태·사용 대상·기술 스택·자유 태그)별 항목 추가/삭제/편집. 자유 태그 → 공식 분류 편입.
- **주요 state**
  - `activeTab: TabId` — 현재 선택된 분류 탭
  - `taxonomy: Record<string, Category>` — 전체 분류체계 데이터
  - `freeTags: FreeTag[]` — 자유 태그 목록
  - `editingItem / newItem: string` — 편집·추가 입력값

#### `AdminOrg.tsx` — `/admin/org`
- **역할**: 부서/조직 관리. 부서 목록 CRUD, 상위 조직 기준 필터, Teams 연동 미리보기(동기화 시뮬레이션).
- **주요 state**
  - `depts: Dept[]` — 부서 목록
  - `search: string` — 검색어
  - `filterParent: string` — 상위 조직 필터
  - `editingId: number | null` — 인라인 편집 대상
  - `showSyncPreview: boolean` — Teams 동기화 미리보기 패널 표시 여부

#### `AdminUsers.tsx` — `/admin/users`
- **역할**: 사용자 권한 관리. 탭 3개 — 관리자 권한 부여/회수, 등록자 현황, 활동 로그.
- **주요 state**
  - `activeTab: "관리자 권한" | "등록자 관리" | "활동 로그"` — 현재 탭
  - `admins: Admin[]` — 관리자 목록
  - `ssoSearch: string` — SSO 사용자 검색 입력값
  - `logCategory: string` — 활동 로그 카테고리 필터

#### `AdminStatistics.tsx` — `/admin/statistics`
- **역할**: 통계 대시보드. 기간 선택(이번 달/3개월/6개월/올해)에 따른 월별 등록 추이, 도메인·상태·스택·시스템 유형·부서별 분포 차트.
- **주요 state**
  - `period: "이번 달" | "최근 3개월" | "최근 6개월" | "올해 전체"` — 조회 기간

---

## 공통 컴포넌트

| 파일 | 역할 |
|------|------|
| `Navbar.tsx` | 일반 페이지 상단 고정 네비게이션. `useLocation`으로 활성 링크 감지. 로그인 시 아바타 클릭 → 드롭다운 메뉴(내 현황·관리자 이동·로그아웃). 관리자에게만 별 아이콘 링크 노출. |
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
  adminScope?: "global" | "company",
  managedCompanies?: string[]
}

AuthProvider (context/AuthContext.tsx)
  ├── user: CurrentUser | null
  ├── loading: boolean
  ├── login(user) → setUser + sessionStorage 저장 (데모)
  ├── logout()   → setUser(null) + sessionStorage 삭제
  ├── isAdmin    → user.role === "admin"
  ├── isGlobalAdmin → isAdmin && adminScope !== "company"
  ├── managedCompanies → user.managedCompanies ?? []
  ├── canManageCompany(code) → isGlobalAdmin || managedCompanies.includes(code)
  └── canManageItem(companies, isCompanyWide?) → 항목 단위 관리 가능 여부

useAuth() (context/useAuth.ts)
  → useContext(AuthContext) 래퍼
```

- 데모 모드: 앱 진입 시 `sessionStorage("demo_user")`를 읽어 새로고침에도 로그인 유지
- 실제 연동 시: `GET /api/v1/auth/me` 호출로 세션 확인 예정 (AuthContext.tsx 내 TODO 주석 참조)

---

## 공용 타입 (`types/platformTypes.ts`)

| 타입/상수 | 설명 |
|---|---|
| `PlatformId` | `"n8n" \| "assistant" \| "ai-orchestration"` |
| `Platform` | 플랫폼 메타 (id, name, shortDesc, path, accessUrl, color, bg, icon) |
| `PlatformItemStatus` | `"운영 중" \| "개발 중" \| "파일럿" \| "보류" \| "종료"` |
| `PlatformItem` | 플랫폼 항목 타입. `company?: string[]` — 소속 관계사 코드 배열 (비어있으면 전사 공용). n8n/assistant 전용 필드(nodes, connectedApps 등)와 AI Agent 전용 필드(modelMeta) 포함. |
| `PLATFORMS` | n8n·나만의 비서·AI Agent 플랫폼 메타 배열 |
| `PLATFORM_ICON_PATH` | 플랫폼 아이콘 SVG path 매핑 |

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
| `PATCH` | `/api/v1/admin/platform-items/:id/approve` | AdminReview (플랫폼 항목) |
| `PATCH` | `/api/v1/admin/platform-items/:id/reject` | AdminReview (플랫폼 항목) |
| `GET` | `/api/v1/admin/projects` | AdminProjectManage |
| `GET` | `/api/v1/admin/taxonomy` | AdminTaxonomy |
| `GET` | `/api/v1/admin/departments` | AdminOrg |
| `GET` | `/api/v1/admin/companies?visible=true` | AdminOrg, AdminReview (관계사 목록) |
| `GET` | `/api/v1/admin/users` | AdminUsers |
| `GET` | `/api/v1/admin/stats/*` | AdminStatistics, AdminDashboard |
| `GET` | `/api/v1/auth/me` | AuthContext |
| `POST` | `/api/v1/auth/logout` | AuthContext |
