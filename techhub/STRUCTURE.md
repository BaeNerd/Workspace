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
│       │   └── database.py     # SQLAlchemy 엔진 / 세션 팩토리
│       ├── api/routes/
│       │   └── health.py       # GET /health
│       ├── models/             # SQLAlchemy 모델 (현재 빈 패키지)
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
        │   └── AuthContext.tsx # 전역 인증 상태 (user, login, logout, isAdmin)
        ├── components/
        │   ├── Navbar.tsx      # 일반 사용자용 상단 네비게이션
        │   ├── AdminNavbar.tsx # 관리자 페이지용 상단 네비게이션
        │   ├── AdminSidebar.tsx# 관리자 좌측 사이드바 (useLocation 활성 감지)
        │   ├── Footer.tsx      # 공통 푸터
        │   └── Guards.tsx      # RequireAuth / RequireAdmin 라우트 가드
        └── pages/
            ├── LandingPage.tsx
            ├── LoginPage.tsx
            ├── AboutPage.tsx
            ├── ProjectListPage.tsx
            ├── ProjectDetailPage.tsx
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

---

### 인증 필요 페이지 (`RequireAuth`)

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
- **역할**: 내가 등록 신청한 프로젝트 목록. 승인/대기/반려 상태 표시. 반려 사유 상세 토글.
- **주요 state**
  - `items: MyItem[]` — 내 등록 항목 목록 (승인 상태 포함)
  - `expanded: string | null` — 반려 사유 펼침 대상 항목 ID

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
- **역할**: 등록 신청 검토 워크플로우. 대기 목록 → 클릭 시 상세 슬라이드 패널 → 분류 항목 직접 수정 후 승인/반려 처리.
- **주요 state**
  - `pendingItems: ReviewItem[]` — 검토 대기 항목 목록 (승인/반려 시 목록에서 제거)
  - `selectedId: string | null` — 현재 열린 항목 ID (상세 패널)
  - `editForm` — 선택된 항목의 수정 가능한 분류 데이터
  - `rejectionReason: string` — 반려 사유 입력값
  - `showRejectInput: boolean` — 반려 사유 입력 영역 표시 여부
- **`pendingCount`**: `pendingItems.length`를 `<AdminSidebar>`에 전달

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
| `Footer.tsx` | 공통 푸터. 로고 + "사내 전용 플랫폼 · 외부 접근 불가". |
| `Guards.tsx` | `RequireAuth` — 미인증 시 `/login?redirect=<pathname>`으로 리다이렉트. `RequireAdmin` — 비관리자 시 `/`로 리다이렉트. |

---

## 인증 흐름 (`AuthContext.tsx`)

```
CurrentUser { name, email, dept, title, role: "user" | "admin" }

AuthProvider
  ├── user: CurrentUser | null
  ├── loading: boolean          ← 초기 세션 확인 중
  ├── login(user) → setUser + sessionStorage 저장 (데모)
  ├── logout()   → setUser(null) + sessionStorage 삭제
  └── isAdmin    → user.role === "admin"
```

- 데모 모드: 앱 진입 시 `sessionStorage("demo_user")`를 읽어 새로고침에도 로그인 유지
- 실제 연동 시: `GET /api/v1/auth/me` 호출로 세션 확인 예정

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
| `GET` | `/api/v1/my/projects` | MyStatusPage |
| `GET` | `/api/v1/admin/review-queue` | AdminReview |
| `PATCH` | `/api/v1/admin/review-queue/:id/approve` | AdminReview |
| `PATCH` | `/api/v1/admin/review-queue/:id/reject` | AdminReview |
| `GET` | `/api/v1/admin/projects` | AdminProjectManage |
| `GET` | `/api/v1/admin/taxonomy` | AdminTaxonomy |
| `GET` | `/api/v1/admin/departments` | AdminOrg |
| `GET` | `/api/v1/admin/users` | AdminUsers |
| `GET` | `/api/v1/admin/stats/*` | AdminStatistics, AdminDashboard |
| `GET` | `/api/v1/auth/me` | AuthContext |
| `POST` | `/api/v1/auth/logout` | AuthContext |
