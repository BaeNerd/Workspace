# Kolmar AX Platform — 프로젝트 구조 문서

> React + TypeScript (Vite) 프론트엔드 / FastAPI + PostgreSQL 백엔드  
> 그룹 전체 AX(AI 전환) 확산 산출물(자동화·AI 도구·ML 모델·Vibe Coding)을 등록·탐색·관리하는 사내 통합 플랫폼

---

## 코딩 컨벤션 (필수 준수)

| 규칙 | 내용 |
|------|------|
| 서브컴포넌트 위치 | 컴포넌트 함수 **외부(모듈 레벨)**에 정의. 함수 내부 정의 금지. |
| 스타일 객체 위치 | 컴포넌트 함수 **외부(모듈 레벨)**에 정의. |
| `border` 혼용 금지 | 같은 요소에 `border` 축약형과 방향별 `border-*` 속성 혼용 금지. |
| 내부 식별자 변경 금지 | `PlatformItem`, `platformId`, `platformScope`, `PLATFORMS` 등 변경 금지. |
| 파일 단위 저장 | 부분 diff가 아닌 수정 완료된 전체 파일로 저장. |
| 인라인 오류 UI | 오류·확인 UI는 인라인으로 처리. 팝업·모달 신설 금지. |
| `import type` | 타입 전용 import는 `import type` 분리 (`verbatimModuleSyntax`). |

---

## 역할(Role) 3단계 모델

| 역할 | 식별자 | 설명 | 접근 가능 페이지 |
|------|--------|------|-----------------|
| 일반 사용자 | `"user"` | 플랫폼 탐색·신청·후기 작성 | `/projects`, `/my-status`, 상세 페이지, `ProjectRegisterPage` |
| 관계사 관리자 | `"companyAdmin"` | 담당 관계사의 1차 검토 + 제한된 목록 관리 | `/admin/review` (1차대기 항목만), `/admin/projects` (삭제만 가능) |
| 최고 관리자 | `"admin"` | 전체 승인·통계·조직 관리 | `/admin/*` 전체 |

### CurrentUser 타입 (`src/context/AuthContext.tsx`)

```ts
type CurrentUser = {
  name: string;
  email: string;
  dept: string;
  title: string;
  role: Role;               // "user" | "companyAdmin" | "admin"
  company: string;          // 소속 관계사 코드 (예: "KKM")
  isGroupViewer: boolean;
  department?: string;      // 업무 분야 — 히어로 카드 매칭용
  managedCompany?: string;  // CompanyAdmin 전용: 담당 관계사 코드
} | null;
```

### ProtectedRoute 사용법

```tsx
// Admin만 접근
<ProtectedRoute requireAdmin>…</ProtectedRoute>

// Admin + CompanyAdmin 모두 접근
<ProtectedRoute requireAdmin allowCompanyAdmin>…</ProtectedRoute>
```

| 라우트 | requireAdmin | allowCompanyAdmin |
|--------|-------------|-------------------|
| `/admin` | ✓ | — |
| `/admin/review` | ✓ | ✓ |
| `/admin/projects` | ✓ | ✓ |
| `/admin/taxonomy` | ✓ | — |
| `/admin/org` | ✓ | — |
| `/admin/users` | ✓ | — |
| `/admin/statistics` | ✓ | — |
| `/admin/platforms` | ✓ | — |

---

## 2단계 승인 흐름 (ApprovalStage)

```
[사용자 신청]
      ↓
"1차대기"  ─── CompanyAdmin 반려 ──→ "반려"
      │
      ↓ CompanyAdmin 1차 승인
"2차대기"  ─── Admin 반려 ──────→ "반려"
      │
      ↓ Admin 최종 승인
"게시됨"
      │
      ↓ Admin 중지
"중지"
```

### ApprovalStage 타입 (`src/types/platformTypes.ts`)

```ts
export type ApprovalStage = "1차대기" | "2차대기" | "게시됨" | "반려" | "중지";
```

### ApprovalRecord 타입

```ts
export type ApprovalRecord = {
  stage: ApprovalStage;
  at: string;     // 처리 일시 (예: "2026.07.10")
  by: string;     // 처리자 이름
  note?: string;  // 반려 사유 등 선택적 메모
};
```

### 단계별 배지 색상

| 단계 | 배경색 | 글자색 |
|------|--------|--------|
| 1차대기 | `#FBF3E4` | `#B4802E` |
| 2차대기 | `#E8F0FE` | `#2563C9` |
| 게시됨 | `#E6F5EC` | `#1F7A46` |
| 반려 | `#EDF0F4` | `#4B5768` |
| 중지 | `#EDF0F4` | `#4B5768` |

### 역할별 승인 행동

| 역할 | 보이는 항목 | 승인 결과 단계 | 반려 결과 단계 |
|------|------------|---------------|---------------|
| CompanyAdmin | `1차대기` + 담당 관계사 항목 | `2차대기` | `반려` |
| Admin | `2차대기` 전체 | `게시됨` | `반려` |

---

## 활용 후기 흐름 (PlatformReview)

### PlatformReview 타입

```ts
export type PlatformReview = {
  id: string;
  itemId: string;
  itemTitle: string;
  itemKind: PlatformId;
  author: string;
  dept: string;
  text: string;
  createdAt: string;   // "YYYY.MM.DD"
  likes: number;
};
```

### 흐름

```
[게시됨 항목 상세 페이지 — 후기 탭]
  ↓ 사용자 텍스트 입력 + 등록
  ↓ PlatformReview 생성

[MyStatusPage — "내가 남긴 후기" 섹션]
  ← 내 계정 필터

[AdminStatistics — "후기 많은 항목 TOP 5"]
  ← reviewCount 기준 정렬

[AdminDashboard — "누적 활용 후기" KPI]
  ← 전체 합계
```

---

## localStorage 키 명세

| 키 | 타입 | 설명 |
|----|------|------|
| `ax_recent_viewed` | `string` (JSON) | 최근 본 항목 ID 배열. 최대 10개, 최신 항목이 앞에 위치. |

```ts
// PlatformItemDetailPage.tsx — useEffect 내부
const prev: string[] = JSON.parse(localStorage.getItem("ax_recent_viewed") ?? "[]");
const next = [id, ...prev.filter(x => x !== id)].slice(0, 10);
localStorage.setItem("ax_recent_viewed", JSON.stringify(next));
```

---

## 항목 노출 정책

### 관계사 범위 (`platformScope`)

| 값 | 의미 |
|----|------|
| `"unset"` | 신청자가 범위를 지정하지 않음. AdminReview에서 승인 전 반드시 지정 필요. |
| `"company-wide"` | 전사 공용. 모든 관계사 사용자에게 노출. |
| `"specific"` | `company[]` 배열에 명시된 관계사 사용자에게만 노출. |

### CompanyAdmin 항목 가시성

- `company.length === 0` (전사 공용) → 항목 표시
- `company.includes(managedCo)` (담당 관계사 포함) → 항목 표시
- 위 두 조건 모두 불충족 → 항목 비표시

### 관계사 노출 관리 (AdminOrg 섹션 1)

- `visible: true`인 관계사만 일반 사용자 목록·필터·통계에 노출.
- `isGroupViewer: true` 보유자는 비노출 관계사도 조회 가능.
- 비노출 처리해도 기존 항목 데이터는 삭제되지 않음.

---

## 디렉터리 트리

```
techhub/
├── docker-compose.yml
├── .env / .env.example
├── STRUCTURE.md              ← 이 문서
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   └── app/
│       ├── main.py
│       ├── core/
│       │   ├── config.py
│       │   └── database.py
│       ├── api/routes/
│       │   └── health.py
│       ├── models/
│       └── schemas/
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    ├── tsconfig*.json
    ├── .env.local            # VITE_API_URL=http://localhost:8000
    └── src/
        ├── main.tsx
        ├── App.tsx           # 라우트 테이블 + AuthProvider
        ├── lib/
        │   └── api.ts
        ├── context/
        │   ├── AuthContext.tsx
        │   └── useAuth.ts
        ├── types/
        │   └── platformTypes.ts
        ├── mocks/
        │   └── statsMockData.ts
        ├── components/
        │   ├── Navbar.tsx
        │   ├── AdminNavbar.tsx
        │   ├── AdminSidebar.tsx
        │   ├── Footer.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── N8nFlowPreview.tsx
        │   └── ScrollToTop.tsx
        └── pages/
            ├── LandingPage.tsx
            ├── LoginPage.tsx
            ├── AboutPage.tsx
            ├── ProjectListPage.tsx
            ├── PlatformItemDetailPage.tsx
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
                ├── AdminStatistics.tsx
                └── AdminPlatforms.tsx
```

---

## 라우트 & 페이지 요약

### 공개 페이지 (인증 불필요)

#### `LandingPage.tsx` — `/`

3존(Zone) 레이아웃:

| 존 | 설명 | 주요 요소 |
|----|------|----------|
| **히어로 존** | 로그인 사용자 맞춤 카드 + CTA + compact 검색바 | 히어로 카드, 검색바 |
| **유형별 존** | 6개 플랫폼 유형별 항목 탐색 (전폭 가로 스크롤) | PlatformSection × 6 |
| **업무별 존** | 업무 도메인별 항목 탐색 (전폭 가로 스크롤) | DomainSection |

- **TOP5 헤더 호버 바**: 조회수 기준 TOP5 항목이 헤더 영역에 표시. 마우스 오버 시 플랫폼 색상 배경 바(bar) 표시.
- **주요 state**: `hovered: number | null`, `search: string`

#### `LoginPage.tsx` — `/login`

- Microsoft SSO 로그인 화면. `?redirect=` 쿼리로 복귀 경로 수신.
- 데모 단계: SSO 버튼 클릭 → 관리자 계정 로그인, 접이식 데모 계정 전환 UI.
- **데모 계정 프리셋** (`DEMO_ACCOUNTS`, DEMO 전용):
  - `role: "admin"` — 전체 관리
  - `role: "companyAdmin"` + `managedCompany` — 담당 관계사 1차 검토
  - `role: "user"` — 등록 신청만 가능
- admin → `/admin` 이동, 그 외 → `redirect` 경로.

#### `AboutPage.tsx` — `/about`

정적 소개 페이지. 문제 정의 → 작동 방식(4단계) → 핵심 가치 → Phase 2 로드맵 → CTA.

#### `ProjectListPage.tsx` — `/projects`

AX 플랫폼 탐색. 좌측 필터 사이드바(플랫폼 종류·상태·관계사) + 상단 검색·정렬.

- **상태 필터**: `STATUS_ORDER` 기반 5-chip 행.
- **`?status=available`** 등 URL 파라미터 지원.
- **주요 state**: `search`, `source`, `status`, `company`, `sort`, `sidebarOpen`, `hovered`

#### `PlatformItemDetailPage.tsx` — `/n8n/:itemId` 외 5개 경로

AX 항목 상세. 플랫폼 종류별 섹션 조건부 렌더링. 좋아요·댓글·복사.

- **localStorage**: 방문 시 `ax_recent_viewed`에 itemId 추가 (최대 10개).
- **후기 탭**: 게시된 항목에서 `PlatformReview` 등록 가능.

---

### 인증 필요 페이지 (`ProtectedRoute`)

#### `ProjectRegisterPage.tsx` — `/projects/new`

4단계 스텝 폼. 유형 선택 → 기본정보 → 플랫폼별 상세 → 담당자·링크 → 최종확인.

- n8n: N8nFlowPreview + JSON 업로드.
- **내부 컴포넌트** (모듈 레벨): `Section`, `Field`, `Tag`, `RowRemoveButton`, `TimeSavedInput`, `CompanyMultiSelect`, `ChipInput`

#### `MyStatusPage.tsx` — `/my-status`

내가 등록한 AX 항목 상태 조회. `ApprovalStage` 기반 5탭 필터(전체/1차대기/2차대기/게시됨/반려).

- **`ApprovalIndicator`** (모듈 레벨 컴포넌트): 4단계 수평 인디케이터.
  - `APPROVAL_STEPS: [null/"신청 완료", "1차대기"/"1차 검토", "2차대기"/"2차 검토", "게시됨"/"게시 완료"]`
  - `STAGE_STEP_INDEX: { "1차대기": 1, "2차대기": 2, "게시됨": 3, "반려": -1, "중지": -1 }`
  - 완료 단계: 초록 ✓ / 현재 단계: 파란 원 / 미래 단계: 회색 원.
  - 반려·중지: 단계 인디케이터 대신 컬러 배너 표시.
- **"내가 남긴 후기" 섹션**: 하단에 `MOCK_MY_REVIEWS` 표시. 플랫폼 배지 + 제목 + 내용 + 날짜 + 좋아요 수.
- **주요 state**: `filter`, `expanded`, `deleted`, `statusOverrides`

#### `EditRequestPage.tsx` — `/edit-request/:id`

게시된 항목 수정 신청. 체크박스로 수정할 필드 선택 + 변경 내용 + 사유 입력.

---

### 관리자 전용 페이지

모든 관리자 페이지는 `<AdminNavbar />` + `<AdminSidebar />` 레이아웃 공유.

#### `AdminDashboard.tsx` — `/admin`

KPI 5개 (`repeat(5, 1fr)` 그리드):

| KPI | 설명 |
|-----|------|
| 전체 등록물 | 전체 항목 수 |
| 승인 대기 | 현재 대기 중인 항목 수 |
| 이번 달 신규 | 당월 신규 등록 수 |
| 운영 중 도구 | 게시됨 항목 수 |
| 누적 활용 후기 | 전체 항목 합산 후기 수 |

- 대기 목록, 최근 승인 목록, 월별 출처별 누적 추이, 출처 구성, 도메인 분포.

#### `AdminReview.tsx` — `/admin/review`

AX 항목 2단계 승인 검토.

- **역할별 접근**: `allowCompanyAdmin` 라우트 가드 적용.
- **CompanyAdmin**: `1차대기` + 담당 관계사 항목만 표시. 좌측 패널에 orange "1차 검토 담당" 배지.
- **Admin**: `2차대기` 항목 표시. 좌측 패널에 blue "최종 승인 담당 (2차)" 배지.
- **`canActOnCurrent`**: Admin이면 `approvalStage === "2차대기"`, CompanyAdmin이면 `approvalStage === "1차대기"` 조건 충족 시만 버튼 활성.
- **승인 버튼**: Admin → 초록(`#059669`) "최종 승인 (게시)" / CompanyAdmin → 파란(`#2563EB`) "1차 승인 → 관리자 검토 요청".
- **n8n JSON**: "✓ JSON 첨부됨" + 다운로드 버튼 표시. WorkflowEditor/WorkflowDiagram 없음.
- **승인 이력**: `approvalHistory.length > 0`이면 이력 블록 표시.
- **내부 컴포넌트** (모듈 레벨): `FieldRow`, `SectionBlock`, `SingleSelectTag`, `TimeSavedInput`, `ChipEditor`, `CompanyMultiSelect`

#### `AdminProjectManage.tsx` — `/admin/projects`

승인된 AX 항목 전체 관리.

- **역할별 접근**: `allowCompanyAdmin` 라우트 가드 적용.
- **CompanyAdmin**: 담당 관계사 항목만 표시 (`company.length === 0 || company.includes(managedCo)`). 좌측 패널에 orange 배지. 삭제만 가능.
- **Admin 전용**: ★ 하이라이트 토글, ✦ 금주의 발견 토글, 수정, 직접 등록 버튼.
- **`isWeeklyDiscover`**: 한 항목만 true, 나머지는 false (단일 선택).
- **n8n FieldRow**: "✓ JSON 첨부됨" + 다운로드 버튼 / "JSON 없음". WorkflowEditor 없음.
- **내부 컴포넌트** (모듈 레벨): `FieldRow`, `SectionBlock`, `SingleSelectTag`, `ChipEditor`, `CompanyMultiSelect`, `TimeSavedInput`

#### `AdminTaxonomy.tsx` — `/admin/taxonomy`

AX 항목 분류체계 관리. 탭별 항목 추가/삭제/편집.

#### `AdminOrg.tsx` — `/admin/org`

조직 관리 3개 섹션:

1. **섹션 1 — 관계사 노출 관리**: 관계사별 플랫폼 노출 on/off.
2. **섹션 2 — 부서 관리**: 부서 CRUD, 관계사 단위 아코디언.
3. **섹션 3 — 관계사 관리자(CompanyAdmin) 지정**: 각 관계사에 CompanyAdmin 이메일·이름 지정. 인라인 편집(팝업 없음).
   - `CompanyAdminAssignment: { companyCode, adminEmail, adminName }`
   - 지정/변경 버튼 클릭 → 인라인 입력 활성화 → 저장/취소.

- **내부 컴포넌트** (모듈 레벨): `CompanyVisibilityDropdown`

#### `AdminUsers.tsx` — `/admin/users`

사용자 권한 관리. 탭 3개 — 관리자 권한 부여/회수 / 등록자 현황 / 활동 로그.

#### `AdminStatistics.tsx` — `/admin/statistics`

통계 대시보드.

- **후기 많은 항목 TOP 5**: `reviewCount` 기준. 순위 + 항목명 + ID + 비율 바 차트 + 수량 + 평균 좋아요.
- **탐색 키워드 빈도**: TOP5 블록 다음에 위치.
- **상태 4그룹**: 정상운영 / 검증·개발 / 제한 / 종료.
- **3-column 분석**: 난이도(n8n·PA) / 비용 구간(AI Agent) / ML 모델 유형.

#### `AdminPlatforms.tsx` — `/admin/platforms`

6개 플랫폼 메타데이터(이름·설명·경로·색상·아이콘) CRUD.

---

## 공통 컴포넌트

| 파일 | 역할 |
|------|------|
| `Navbar.tsx` | 일반 사용자용 상단 고정 네비게이션. AX 플랫폼 바로가기 드롭다운. 관리자에게만 별 아이콘 노출. |
| `AdminNavbar.tsx` | 관리자 페이지 상단 네비게이션. 로고 + 관리자 뱃지 + 이니셜 + 로그아웃. |
| `AdminSidebar.tsx` | 관리자 좌측 사이드바. `useLocation`으로 활성 메뉴 감지. `pendingCount` prop으로 검토 대기 뱃지. |
| `Footer.tsx` | 공통 푸터. |
| `ProtectedRoute.tsx` | 라우트 가드. `requireAdmin` + `allowCompanyAdmin` props. |
| `N8nFlowPreview.tsx` | SVG 기반 n8n 워크플로우 시각화 (ProjectRegisterPage 전용). |
| `ScrollToTop.tsx` | 라우트 변경 시 스크롤 최상단 이동. |

### ProtectedRoute 구현

```tsx
export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  allowCompanyAdmin = false,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, isCompanyAdmin } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (requireAuth && !user)
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (requireAdmin) {
    const hasAccess = isAdmin || (allowCompanyAdmin && isCompanyAdmin);
    if (!hasAccess) return <Navigate to="/projects" replace />;
  }
  return <>{children}</>;
}
```

---

## 인증 흐름 (`AuthContext.tsx` + `useAuth.ts`)

```
AuthProvider
├── user: CurrentUser | null
├── loading: boolean
├── login(user) → setUser + sessionStorage 저장 (데모)
├── logout()   → setUser(null) + sessionStorage 삭제
├── isAdmin         → user.role === "admin"
├── isCompanyAdmin  → user.role === "companyAdmin"
└── isGroupViewer   → user.isGroupViewer
```

- **데모 모드**: 앱 진입 시 `sessionStorage("demo_user")`를 읽어 새로고침에도 로그인 유지.
- **실제 연동 시**: `GET /api/v1/auth/me` 호출로 세션 확인 예정.

---

## 공용 타입 (`types/platformTypes.ts`)

| 타입/상수 | 설명 |
|---|---|
| `PlatformId` | `"n8n" \| "pa" \| "assistant" \| "ai-orchestration" \| "ml" \| "vibe"` (6종, 변경 금지) |
| `Platform` | 플랫폼 메타 (id, name, shortDesc, path, accessUrl, color, bg, icon) |
| `PlatformItemStatus` | `"사용 가능" \| "준비 중" \| "일부 제한" \| "사용 중지"` |
| `STATUS_ORDER` | PlatformItemStatus 4종 배열 (변경 금지) |
| `STATUS_COLOR` | `Record<PlatformItemStatus, { fg, bg }>` (변경 금지) |
| `ApprovalStage` | `"1차대기" \| "2차대기" \| "게시됨" \| "반려" \| "중지"` |
| `ApprovalRecord` | `{ stage, at, by, note? }` — 승인 이력 1건 |
| `PlatformReview` | `{ id, itemId, itemTitle, itemKind, author, dept, text, createdAt, likes }` |
| `PlatformItem` | AX 항목 공용 타입. `company: string[]`, `platformScope`, `expectedTimeSaved?`, 플랫폼별 전용 필드 포함. |
| `PLATFORMS` | 6개 플랫폼 메타 배열. 출처 색상·경로의 SSOT (변경 금지) |
| `PLATFORM_ICON_PATH` | 플랫폼 아이콘 SVG path 매핑 (6키) |

### 예상 절감 시간 모델 (`expectedTimeSaved`)

```
입력: 수치 + 주기(일/주/월/년)
직렬화: "<주기> N시간" 표준 문자열 (예: "주 3시간")
연간 환산 계수: PERIOD_ANNUAL_FACTOR = { 일: 365, 주: 52, 월: 12, 년: 1 }
역직렬화: AdminStatistics.parseTimeSaved() → 연간 시간 수치
```

---

## 공용 Mock 모듈 (`mocks/statsMockData.ts`)

> AdminStatistics / AdminDashboard 공유 더미. **DEMO 전용 — 백엔드 연동 시 폐기.**

| 항목 | 설명 |
|---|---|
| `SourceKey` | `PlatformId` — 6종 |
| `MonthPoint` | 월별 포인트. 6개 플랫폼 필드 |
| `STAT_COMPANIES` / `StatCompany` | 더미 기준 관계사 코드 |
| `scopedCompanies(scope)` | `null` → 전체, 배열 → 해당 관계사만 |
| `aggregateMonthly` / `aggregateSourceTotal` / `aggregateDomain` | 범위 내 관계사 합산 |
| `monthTotal(m)` | 월 포인트의 출처 합계 |

타입 import 주의: `SourceKey`, `MonthPoint`, `StatCompany`는 `import type` 분리 필수.

---

## API 연동 준비 (`lib/api.ts`)

```ts
api.get<T>(path)
api.post<T>(path, body)
api.put<T>(path, body)
api.delete<T>(path)
```

- `VITE_API_URL` 환경변수 기반 (`http://localhost:8000`).
- 현재 모든 페이지는 Mock 데이터 사용.

### 주요 예정 엔드포인트

| 메서드 | 경로 | 대응 페이지 |
|--------|------|------------|
| `GET` | `/api/v1/platform-items` | ProjectListPage |
| `POST` | `/api/v1/platform-items` | ProjectRegisterPage |
| `GET` | `/api/v1/platforms/:platformId/items/:itemId` | PlatformItemDetailPage |
| `POST` | `/api/v1/platform-items/:id/reviews` | PlatformItemDetailPage (후기 등록) |
| `GET` | `/api/v1/my/platform-items` | MyStatusPage |
| `GET` | `/api/v1/my/reviews` | MyStatusPage (내 후기) |
| `GET` | `/api/v1/admin/review-queue` | AdminReview |
| `PATCH` | `/api/v1/admin/platform-items/:id/approve` | AdminReview |
| `PATCH` | `/api/v1/admin/platform-items/:id/reject` | AdminReview |
| `GET` | `/api/v1/admin/platform-items` | AdminProjectManage |
| `PUT` | `/api/v1/admin/platform-items/:id` | AdminProjectManage |
| `PATCH` | `/api/v1/admin/platform-items/:id/highlight` | AdminProjectManage |
| `GET` | `/api/v1/admin/companies` | AdminOrg |
| `PUT` | `/api/v1/admin/companies/:code/admin` | AdminOrg (CompanyAdmin 지정) |
| `GET` | `/api/v1/admin/users` | AdminUsers |
| `GET` | `/api/v1/admin/stats/*` | AdminStatistics, AdminDashboard |
| `GET` | `/api/v1/auth/me` | AuthContext |
| `POST` | `/api/v1/auth/logout` | AuthContext |

---

## 플랫폼 포지셔닝

Kolmar AX Platform은 그룹 전체 AX(AI 전환) 확산 활동의 산출물을 모으는 저장소입니다.

- **6대 AX 플랫폼 유형**: n8n(업무 자동화), Power Automate(플로우 자동화), 나만의 비서(HK GPT 커스텀), AI Agent(AI 오케스트레이션), ML 모델, Vibe Coding
- **빌더-카탈로그 계층 분리**: 도구를 만드는 빌더 활동과 발견·재사용하는 카탈로그 계층을 구분.
- **정량적 성과 가시화**: 예상 절감 시간 등 정량 지표를 표면화하여 도구의 실효 가치를 드러냄.
