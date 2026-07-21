# Kolmar AX Platform — 프로젝트 구조 문서

> React + TypeScript (Vite) 프론트엔드 / FastAPI + PostgreSQL 백엔드  
> 그룹 전체 AX(AI 전환) 확산 산출물(자동화·AI 도구·ML 모델·Vibe Coding·AI 프로젝트)을 등록·탐색·관리하는 7유형 사내 통합 플랫폼

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
| **타입 검증 명령** | **`npx tsc -b`** 사용. 루트 `tsc --noEmit`은 루트 tsconfig가 `files: []` + `references` 구조라 항상 통과하므로 **무효**. 빌드 스크립트도 `tsc -b && vite build`. |
| 호버 확장 패널 | 트리거와 패널 사이 틈을 **브리지**(래퍼 내부 `paddingTop`으로 간격을 호버 영역화)로 이어 붙이고, `onMouseLeave`에 **200ms 닫힘 유예**(`setTimeout`)를 둔다. (예: LandingPage `TopViewedBar`) |
| 아이콘 path 조회 | 아이콘 키 → SVG path는 `ICON_PRESETS` 레지스트리를 통해 조회하고, 미등록 키는 **폴백**(`iconPreset()` → `automation`)으로 방어한다. |

---

## 역할(Role) 3단계 모델

| 역할 | 식별자 | 설명 | 접근 가능 페이지 |
|------|--------|------|-----------------|
| 일반 사용자 | `"user"` | 플랫폼 탐색·신청·후기 작성 | `/projects`, `/my-status`, 상세 페이지, `ProjectRegisterPage` |
| 관계사 관리자 | `"companyAdmin"` | 담당 관계사(복수 가능)의 승인·제한된 목록 관리 | `/admin`, `/admin/review`, `/admin/projects`, `/admin/statistics` |
| 최고(전사) 관리자 | `"admin"` | 전사 승인·통계·조직·분류·플랫폼 관리 | `/admin/*` 전체 |

- **CompanyAdmin은 복수 관계사 담당 가능** — `managedCompanies: string[]`. 단수 필드 `managedCompany`는 **폐기됨**.

### CurrentUser 타입 (`src/context/AuthContext.tsx`)

```ts
export type Role = "user" | "companyAdmin" | "admin";

export type CurrentUser = {
  name: string;
  email: string;
  dept: string;
  title: string;
  role: Role;                  // "user" | "companyAdmin" | "admin"
  company: string;             // 소속 관계사 코드 (예: "KKM")
  isGroupViewer: boolean;      // 그룹 전체보기 권한
  department?: string;         // 업무 분야 — 히어로 카드 매칭용
  managedCompanies?: string[]; // CompanyAdmin 전용: 담당 관계사 코드 목록 (복수 담당 가능)
} | null;
```

### AuthContext 제공 값

| 값 | 파생 |
|----|------|
| `user` | `CurrentUser` |
| `loading` | 세션 로드 중 여부 |
| `login(user)` | `setUser` + `sessionStorage("demo_user")` 저장 (데모) |
| `logout()` | `setUser(null)` + `sessionStorage` 삭제 |
| `isAdmin` | `user.role === "admin"` |
| `isCompanyAdmin` | `user.role === "companyAdmin"` |
| `isGroupViewer` | `user.isGroupViewer ?? false` |
| `managedCompanies` | `user.managedCompanies ?? []` |

### ProtectedRoute 사용법

```tsx
// Admin만 접근
<ProtectedRoute requireAdmin>…</ProtectedRoute>

// Admin + CompanyAdmin 모두 접근
<ProtectedRoute requireAdmin allowCompanyAdmin>…</ProtectedRoute>
```

| 라우트 | requireAdmin | allowCompanyAdmin |
|--------|-------------|-------------------|
| `/admin` | ✓ | ✓ |
| `/admin/review` | ✓ | ✓ |
| `/admin/projects` | ✓ | ✓ |
| `/admin/statistics` | ✓ | ✓ |
| `/admin/taxonomy` | ✓ | — |
| `/admin/org` | ✓ | — |
| `/admin/users` | ✓ | — |
| `/admin/platforms` | ✓ | — |

→ companyAdmin이 접근 가능한 4종은 **대시보드·검토·프로젝트 관리·통계**. `taxonomy·org·users·platforms`는 **admin 단독**.

### 역할별 UI 노출

- **AdminSidebar** (`src/components/AdminSidebar.tsx`): `ADMIN_NAV` 각 항목에 `companyAdmin: boolean` 플래그. `isCompanyAdmin`이면 `companyAdmin: true`인 4개(대시보드·등록 신청 검토·프로젝트 관리·통계)만 노출하고, 사이드바 라벨을 **"관계사 관리자 메뉴"**로(그 외 "관리자 메뉴") 표시. `/admin/review` 항목엔 `pendingCount` 뱃지.
- **Navbar** (`src/components/Navbar.tsx`): 관리자 진입(별 아이콘 "관리자" 링크·드롭다운 "관리자 페이지")은 `isAdmin || isCompanyAdmin` 조건. 역할 배지 2종 — admin은 `관리자`(앰버 `#FEF3C7`/`#92400E`), companyAdmin은 `관계사 관리자`(파스텔 오렌지 `#FBEEE4`/`#B4602E`). 아바타 배경색도 역할별로 분기.

---

## 승인 흐름 — 병렬 2슬롯 (ApprovalSlots)

**직렬 2단계(1차대기 → 2차대기)는 폐기.** 항목마다 **순서 없는 병렬 승인 슬롯 2개**를 두고,
어느 쪽이 먼저 승인해도 되며 **두 슬롯이 모두 승인되면 게시**, **어느 한쪽이라도 반려하면 종결**한다.

```
                 ┌─────────────────────────────┐
[사용자 신청] ──▶ │ company 슬롯: 관계사 관리자 승인 │─┐
                 │  (담당 companyAdmin 또는 admin) │ │  둘 다 승인 → "게시됨"
                 ├─────────────────────────────┤ ├─▶ 어느 한쪽 반려 → "반려"
                 │ global 슬롯: 전사 관리자 승인   │─┘  admin 중지 → "중지"
                 │  (admin 전용)                 │
                 └─────────────────────────────┘
```

- 순서 없음 — company/global 어느 슬롯이든 자격 있는 관리자가 먼저 승인 가능.
- **admin도 슬롯별 개별 승인** — 일괄 게시 버튼은 없다. 게시는 두 번째 슬롯 승인의 결과로 **파생**된다.
- **전사 공용 항목**(`company.length === 0`)은 company 슬롯도 admin만 승인 가능 → admin이 양 슬롯을 모두 처리.
- **"1차/2차" 서수 명칭은 전면 폐기.** 잔존은 이행 코드(`LEGACY_APPROVAL_MAP`·`legacy()` 시드)와 제품 고유명(예: "해외법인 계약서 1차 검토 비서")뿐이다.

### 승인 타입 (`src/types/platformTypes.ts`)

```ts
export type ApprovalSlotKey = "company" | "global";
export type ApprovalSlot = { approved: boolean; by?: string; at?: string };
export type ApprovalSlots = Record<ApprovalSlotKey, ApprovalSlot>;

export const APPROVAL_SLOT_LABEL: Record<ApprovalSlotKey, string> = {
  company: "관계사 관리자 승인",
  global: "전사 관리자 승인",
};

export type ApprovalStage = "승인 대기" | "부분 승인" | "게시됨" | "반려" | "중지";

// 슬롯 승인 상태 + 종결 플래그로부터 stage 파생 (종결 상태가 우선)
export function deriveStage(slots: ApprovalSlots, rejected: boolean, suspended: boolean): ApprovalStage;

export type ApprovalRecord = {
  slot?: ApprovalSlotKey;
  action: "승인" | "반려";
  at: string;
  by: string;
  note?: string;
};
```

- **`deriveStage`**: `suspended` → `중지`, `rejected` → `반려`, 승인 슬롯 2개 → `게시됨`, 1개 → `부분 승인`, 0개 → `승인 대기`.
- **`LEGACY_APPROVAL_MAP`**: 레거시 stage 문자열 → `{ slots, rejected, suspended }` 초기값. `"1차대기"` → 둘 다 미승인(승인 대기), `"2차대기"` → company 슬롯 승인 완료(부분 승인), `"게시됨"·"반려"·"중지"`는 동일 상태. 데모 시드가 `legacy(stage)` 헬퍼로 이 맵을 소비한다.

### ApprovalStage 배지 색상 (`APPROVAL_STAGE_STYLE`)

| 단계 | 의미 |
|------|------|
| 승인 대기 | 두 슬롯 모두 미승인 |
| 부분 승인 | 한 슬롯만 승인 |
| 게시됨 | 두 슬롯 모두 승인 (종결) |
| 반려 | 어느 슬롯이든 반려 (종결) |
| 중지 | admin이 게시 후 중지 (종결) |

### AdminReview 슬롯 UI

- **`SummaryStrip`** — 상단 요약 스트립(2×2 필터 겸용 칩). `ReviewFilterKey = "전체" | "승인 대기" | "부분 승인" | "처리완료"`. 각 칩은 `baseItems` 기준 카운트를 보이고 클릭 시 `filter`를 전환. `부분 승인` 칩은 count > 0일 때 `관계사만 N · 전사만 N` 서브라인 표시.
- **`SlotPill`** — 목록 행의 2분할 진행 필(왼쪽 관계사 / 오른쪽 전사). 슬롯이 승인되면 해당 반쪽이 초록 + `✓`.
- **`SlotCard`** — 상세 패널의 슬롯별 병렬 카드 2장(`display: flex`). 각 카드는 `APPROVAL_SLOT_LABEL` + 상태 배지(승인 완료/대기) + `이 슬롯 승인` 버튼 또는 비활성 사유(`disabledReason`)를 렌더.
- **슬롯 행동 자격**:
  - `canActCompanySlot(i) = isAdmin || (isCompanyAdmin && companyScopeMatch(i))`
  - `canActGlobalSlot(i) = isAdmin`
  - `companyScopeMatch(i) = i.company.length > 0 && i.company.some(c => managedCompanies.includes(c))`
  - 관계사 지정 편집 UI는 폐기 — 신규·데모 항목은 전사 공용(`company: []`, `platformScope: "company-wide"`)이라 company 슬롯도 admin이 처리. (`platformScope === "unset"` 방어 가드는 코드에 잔존.)
- **`pendingCount` (사이드바)** — 사용자가 처리 가능한 **미승인 슬롯 잔여 항목 수**. admin: 미종결(`게시됨/반려/중지` 아님) 전체. companyAdmin: `companyScopeMatch(i) && !i.approvalSlots.company.approved`. 전체 `items` 기준(요약 스트립 카운트는 사용자 가시 `baseItems` 기준).
- **일괄 게시 버튼 없음** — 액션은 슬롯별 `이 슬롯 승인` 2개와 `반려`뿐. 배너 안내: "두 승인이 모두 완료되면 게시됩니다."
- **내부 컴포넌트**(모듈 레벨): `SlotPill`, `SlotCard`, `SummaryStrip`, `FieldRow`, `SectionBlock`, `SingleSelectTag`, `TimeSavedInput`, `ImageStripView`. (상태·관계사 편집 UI 제거로 `ChipEditor`·`CompanyMultiSelect`·상태 셀렉터 삭제.)

### MyStatusPage 슬롯 UI

- **탭 5종** (`STAT_TABS`, `repeat(5, 1fr)`): `전체` / `승인 대기` / `부분 승인` / `게시됨` / `반려`. (`중지`는 stage·counts엔 있으나 탭엔 없음.)
- **`ParallelApprovalIndicator`** — 카드별 병렬 인디케이터. `반려`/`중지`는 컬러 배너("승인이 반려되었습니다."/"항목이 중지되었습니다."), 그 외에는 `신청 완료`(항상 ✓) → 두 `SlotChip`(company·global 수직 스택) → `게시 완료`(`게시됨`일 때만 ✓)의 수평 흐름. `SlotChip`은 `APPROVAL_SLOT_LABEL`을 라벨로 사용.
- **주요 state**: `filter`, `expanded`, `resubmit`, `deleteConfirm`, `deleted`, `statusOverrides`.
- **"내가 남긴 후기" 섹션**: 하단에 `MOCK_MY_REVIEWS` 표시(플랫폼 배지 + 제목 + 내용 + 날짜 + `N명이 도움됨`), 빈 상태 "아직 남긴 후기가 없습니다."

---

## 관리자 지정 체계

관리자 지정 데이터는 공용 모듈 **`mocks/companyAdminMockData.ts`** 한 곳을 SSOT로 둔다.

```ts
export type CompanyAdminUser = { email: string; name: string; dept?: string; managedCompanies: string[] };

export const INITIAL_COMPANY_ADMINS: CompanyAdminUser[] = [
  { email: "cadmin.choi@kolmar.co.kr", name: "최관리", dept: "IT인프라팀", managedCompanies: ["KKM"] },
  { email: "cadmin.jung@kolmar.co.kr", name: "정담당", dept: "경영지원팀", managedCompanies: ["KBH", "HC"] },
];

// 이메일 → 담당 관계사 코드 목록 (LoginPage 데모 계정 → AuthContext managedCompanies 모사)
export const managedCompaniesOf = (email: string): string[];
```

- **소비자 3곳** — `AdminUsers`(편집), `AdminOrg` 섹션 3(읽기 전용 투영), `LoginPage`(데모 계정).
- **설계 의도**: 실제 연동 시 `관리자 지정 DB → GET /api/v1/auth/me 의 managedCompanies → AuthContext` 흐름을 데모 계층에서 모사하는 **단일 데이터 지점** 구조. 실제 연동 시 이 모듈을 폐기하고 `GET/PUT /api/v1/admin/company-admins` + `auth/me` 응답으로 교체.
- **`김관리`(role `admin`, 전사 관리자)는 이 목록에 포함하지 않는다.**

### AdminUsers — 유일한 편집 지점 (`/admin/users`)

- **탭 4종** (`TABS`): `관리자 권한` / `그룹 전체보기` / `등록자 관리` / `활동 로그`. 기본 `관리자 권한`.
- **`관리자 권한` 탭 = 관리자 지정의 유일한 편집 지점.** 목록을 **전사 관리자**(`admins`, `INITIAL_ADMINS` 시드)와 **관계사 관리자**(`companyAdmins`, `INITIAL_COMPANY_ADMINS` 시드)로 **분리** 렌더. 헤더 카운트 `전사 N · 관계사 N`.
- **담당 관계사 칩 인라인 편집**: 관계사 관리자 행마다 `managedCompanies` 코드를 칩(오렌지)으로 표시, `×`로 `removeManagedCompany`, `+ 관계사 추가`(`AddCompanyMenu`)로 `addManagedCompany`.
- **권한 부여**: SSO 검색 + 역할 토글(`전사 관리자`/`관계사 관리자`). 관계사 선택 시 `CompanyMultiSelect`로 담당 관계사(1곳 이상) 지정.
- **가드 2종**:
  - **마지막 전사 관리자 회수 차단** — `handleRevoke`는 `admins.length <= 1`이면 무효화, UI는 "전사 관리자는 최소 1명 유지해야 합니다. 회수할 수 없습니다." (자기 자신 `id === 1` 회수도 차단).
  - **마지막 담당 관계사 칩 제거 차단** — `removeManagedCompany`는 `managedCompanies.length <= 1`이면 "담당 관계사는 1곳 이상이어야 합니다. 담당을 모두 해제하려면 권한 회수를 사용하세요." (담당 전체 해제는 권한 회수로 유도).
- **내부 컴포넌트**(모듈 레벨): `Chevron`, `CompanyMultiSelect`, `AddCompanyMenu`.

### AdminOrg 섹션 3 — 읽기 전용 현황판 (`/admin/org`)

- **섹션 3 `관계사 관리자(CompanyAdmin) 현황`**은 **읽기 전용 투영**(`읽기 전용` 배지). 편집(지정·해제)은 AdminUsers에서만 수행.
- `INITIAL_COMPANY_ADMINS`를 **값으로만** import하여 관계사 중심으로 투영. 헬퍼 `companyAdminsFor(code)`·`adminManagedCount(email)` — 로컬 state·setter 없음, `CompanyAdminAssignment` 편집 타입도 없음.
- `사용자 관리로 이동` 버튼(→ `/admin/users`), 담당 2곳 이상 관리자에 `담당 N곳` 배지, 관리자 없는 관계사에 `미지정` 표시. 안내: "지정·해제는 사용자 관리에서 관리합니다. (관리자 권한 부여 시 담당 관계사를 함께 지정)"

---

## 조회 범위 선택기 (`components/AdminScopeSelect.tsx`)

권한 범위(baseScope)와 조회 범위(viewScope)를 분리하는 공용 드롭다운. AdminDashboard·AdminStatistics 공유.

```ts
export type ScopeSelection = { kind: "all" } | { kind: "company"; code: string };

type Props = {
  value: ScopeSelection;
  onChange: (v: ScopeSelection) => void;
  restrictTo: string[] | null; // admin=null(전사 전체+전 관계사) / companyAdmin=담당 코드 배열
};
```

- **`restrictTo` 규칙**: `null`(admin) → 옵션 `전사 전체`(합산) + `STAT_COMPANIES` 전체 개별. 배열(companyAdmin) → 옵션 `담당 전체 (합산)` + 담당 관계사 개별만.

### baseScope / viewScope 분리 패턴 (Dashboard·Statistics 공통)

```ts
const [scopeSel, setScopeSel] = useState<ScopeSelection>({ kind: "all" });
const baseScope = isCompanyAdmin ? managedCompanies : null;      // 권한 범위
const baseKey = baseScope ? [...baseScope].sort().join(",") : "ALL";
useEffect(() => { setScopeSel({ kind: "all" }); }, [baseKey]);   // 역할/담당 변경 시 리셋
const noScope = isCompanyAdmin && managedCompanies.length === 0;
const showScopeSelect = !isCompanyAdmin || managedCompanies.length >= 2;
const viewScope = scopeSel.kind === "company" ? [scopeSel.code] : baseScope; // 유효 조회 범위
```

- **노출 규칙**: `showScopeSelect`(admin 항상 / companyAdmin 담당 2곳 이상) → `AdminScopeSelect`. 담당 **1곳** → `담당 관계사 1곳: …` 배지. **0곳**(`noScope`) → "담당 관계사가 지정되지 않았습니다. 전사관리자에게 문의하세요." 안내.
- **`pendingCount`는 `baseScope` 기준 고정** — 조회 선택(`viewScope`)과 무관. (Dashboard: `permCompanies = scopedCompanies(baseScope)`로 산출. Statistics는 pendingCount 없음.)
- **역할 전환 시 `scopeSel` 리셋** — `useEffect(..., [baseKey])`로 다른 계정 로그인 등 담당 구성 변화 시 `{ kind: "all" }`로 초기화.

---

## 아이콘 체계 (`types/platformTypes.ts`)

- **`ICON_PRESETS`** — `Record<string, { label: string; path: string }>` 아이콘 레지스트리. 기존 6종(`automation`·`assistant`·`orchestration`·`pa`·`ml`·`vibe`, path·키 변경 금지) + 신규 14종(`bot`·`document`·`barChart`·`lineChart`·`branch`·`database`·`settings`·`chat`·`search`·`calendar`·`mail`·`cloud`·`shield`·`puzzle`) = **20종**.
- **`IconKey = keyof typeof ICON_PRESETS`** — `Record<string, …>` 기반이라 사실상 `string`. 리터럴 유니온이 아닌 이유는 기존 `PLATFORM_ICON_PATH`(`Record<Platform["icon"], string>` = `Record<string, string>`)의 6개 매핑 호환을 유지하기 위함(추가 키 요구 없음).
- **AdminPlatforms `IconPicker`** — `AdminScopeSelect`와 동일 패턴의 그리드 선택 패널(`repeat(3, 1fr)`). `ICON_OPTION_KEYS = Object.keys(ICON_PRESETS)`를 순회하므로 신규 프리셋이 자동 노출. 트리거는 미리보기 + `iconLabelOf(value)` + 회전 셰브론.
- **`iconPreset(icon)` 폴백** — 미등록 키는 `console.warn` 후 `ICON_PRESETS.automation`으로 대체(서버 비정상 값 방어). `PlatformIcon`이 `iconPreset(icon).path`로 SVG 렌더.

---

## 공유 빌드 체계 (랜딩 단일 HTML)

랜딩(`/`)만 담은 단일 HTML 미리보기를 산출하는 별도 빌드 모드.

- **`config/shareMode.ts`** — 공유 모드 판별 **단일 참조점**. `export const IS_SHARE_MODE = import.meta.env.VITE_SHARE_MODE === "true";`
- **`.env.share`** — `VITE_SHARE_MODE=true` 한 줄.
- **`package.json` 스크립트** — `build:share`: `tsc -b && vite build --mode share --outDir dist-share`.
- **`vite.config.ts`** — `mode === 'share'`일 때만 `vite-plugin-singlefile`(`viteSingleFile()`) 추가 → JS·CSS를 단일 HTML로 인라인. 그 외(개발·본 빌드)는 기존 설정 그대로.
- **App 분기** (`App.tsx`): `IS_SHARE_MODE`이면 `HashRouter`(file:// 경로 대응) + `/` 랜딩 + `*` → `ShareRedirect`. `AuthProvider`·`ScrollToTop`·`ShareNoticeProvider`·`SharePreviewBanner`로 래핑. 본 빌드는 `BrowserRouter` 전체 라우트.
- **`context/ShareNoticeContext.tsx`** — `showNotice()` 호출 시 배너 문구를 잠깐 전환하고 **약 3초 후 자동 해제**. Provider 바깥 호출도 안전한 no-op 기본값.
- **`components/ShareRedirect.tsx`** — 랜딩 외 모든 경로를 가로채 마운트 시 `showNotice()` + `<Navigate to="/" replace />` → "안내 표시 + 랜딩 유지"로 수렴.
- **`components/SharePreviewBanner.tsx`** — 최상단 sticky 안내 바. `SHARE_BANNER_HEIGHT = 32`(Navbar sticky top 오프셋과 동일). 기본(파랑) / 안내 활성(앰버) 톤. `Navbar`는 `IS_SHARE_MODE`일 때 `top: SHARE_BANNER_HEIGHT`로 밀리고 **SSO 로그인 버튼 숨김**.
- **Teams 버튼 비활성** — LandingPage `AskChannelCard`가 공유 모드에서 실제 Teams `<a>` 대신 회색 `<button>`(클릭 시 `showNotice()`)을 렌더(라벨 "채널 열기" 동일).
- **산출물**: `ax-landing-preview.html` — **현재 삭제됨.** 랜딩(`/`)이 외부 제작 콘텐츠로 교체 완료된 후 `npm run build:share`로 재생성 예정. 공유 빌드 체계(`VITE_SHARE_MODE`·`vite-plugin-singlefile`·`ShareRedirect`·`SharePreviewBanner`)는 그대로 유지한다.

---

## 항목 노출 정책

### 관계사 범위 (`company: string[]`)

| 값 | 의미 |
|----|------|
| `[]`(비움/생략) | 전사 공용. 모든 관계사 사용자에게 노출. |
| `["KKM", …]` | 명시된 관계사 사용자에게만 노출. |

- 관계사 지정 편집 UI는 폐기 — 신규 항목은 전사 공용으로 생성된다. `company`/`platformScope`는 승인 슬롯 자격·companyAdmin 조회 범위 판정 데이터로만 사용.

### CompanyAdmin 항목 가시성

- `company.length === 0`(전사 공용) → 표시
- `company.some(c => managedCompanies.includes(c))`(담당 관계사 포함) → 표시
- 위 두 조건 모두 불충족 → 비표시

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
│       ├── core/{config.py, database.py}
│       ├── api/routes/health.py
│       ├── models/
│       └── schemas/
│
└── frontend/
    ├── index.html
    ├── vite.config.ts        # share 모드에서만 vite-plugin-singlefile 인라인
    ├── package.json          # build / build:share 스크립트
    ├── tsconfig*.json
    ├── .env.local            # VITE_API_URL=http://localhost:8000
    ├── .env.share            # VITE_SHARE_MODE=true (공유 빌드용)
    │   # ax-landing-preview.html — 공유 빌드 산출물(현재 삭제, 랜딩 교체 후 재생성)
    ├── dist-share/           # build:share outDir (.gitignore)
    └── src/
        ├── main.tsx
        ├── App.tsx           # IS_SHARE_MODE 분기 라우트 + AuthProvider
        ├── lib/
        │   └── api.ts        # 백엔드 연동 대비 스텁 (현재 미사용)
        ├── config/
        │   ├── shareMode.ts  # IS_SHARE_MODE 단일 참조점
        │   └── operations.ts # TEAMS_CHANNEL_URL 등 운영 상수 단일 참조점
        ├── context/
        │   ├── AuthContext.tsx
        │   ├── useAuth.ts
        │   └── ShareNoticeContext.tsx  # 공유 모드 안내(3초)
        ├── styles/
        │   └── layout.ts     # CONTENT_MAX_WIDTH=1400 / FORM_MAX_WIDTH=760
        ├── types/
        │   └── platformTypes.ts        # 타입·PLATFORMS·ICON_PRESETS·승인 슬롯
        ├── mocks/
        │   ├── statsMockData.ts        # 통계 공용 더미
        │   └── companyAdminMockData.ts # 관계사 관리자 지정 공용 목업
        ├── components/
        │   ├── Navbar.tsx
        │   ├── AdminNavbar.tsx
        │   ├── AdminSidebar.tsx
        │   ├── AdminScopeSelect.tsx     # 조회 범위 선택기
        │   ├── ShareRedirect.tsx        # 공유 모드 경로 가로채기
        │   ├── SharePreviewBanner.tsx   # 공유 모드 상단 안내 바
        │   ├── Footer.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── N8nFlowPreview.tsx
        │   ├── WorkflowDiagram.tsx
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

flex column 루트의 다단 구성(빈 상태 안내 내장):

| 단 | 설명 | 주요 요소 |
|----|------|----------|
| **[1단] 헤더** | 인사말 + 검색 폼 + 실시간 인기 바 | `TopViewedBar` |
| **[2단] 지표 4카드** | 그라디언트 KPI | `STAT_CARDS` |
| **[3단] 통합 패널** | 유형별 둘러보기(플랫폼 타입) + 업무별 추천(도메인 스포트라이트) | `PLATFORMS.map`, `DOMAINS` |
| **[존 A] 개인화 스트립** | 이어서 살펴보기 · 우리 회사 신규 | `PersonalStrip` |
| **[존 B/C] 하단 그리드** | 최신 등록 피드 / 금주의 발견·활용 후기·문의 채널 | `LatestFeed`, `EditorsPickCard`, `ReviewRotator`, `AskChannelCard` |

- **`TopViewedBar`**: 조회수 TOP5 실시간 인기 바. 접힘(2.5s 회전 티커) → 호버 시 확장 패널(TOP5 목록). **호버 브리지 + 200ms 닫힘 유예** 패턴.
- **빈 상태**: 각 섹션에 `EmptyHint`로 안내 문구(예: "아직 등록된 항목이 없습니다. 첫 등록의 주인공이 되어보세요.").
- **공유 모드**: `AskChannelCard`가 Teams 링크를 회색 버튼(안내)으로 대체.
- **주요 state**: `search`, `rankIdx`, `domainIdx`, `reviewIdx`, `recentViewed`(hover는 카드별 로컬).
- **내부 컴포넌트**(모듈 레벨): `EyeIcon`, `SectionLabel`, `EmptyHint`, `TopViewedBar`, `PersonalStrip`, `TypeMedallion`, `LatestFeed`, `EditorsPickCard`, `ReviewQuote`, `ReviewRotator`, `AskChannelCard`.

#### `LoginPage.tsx` — `/login`

- Microsoft SSO 로그인 화면. `?redirect=` 쿼리로 복귀 경로 수신(`redirectTo`). SSO 버튼(`handleSsoLogin`)은 데모 스텁(`DEMO_ACCOUNTS[0]` 로그인).
- **데모 계정 프리셋** (`DEMO_ACCOUNTS`, 총 **6종** = admin 1 + user 3 + companyAdmin 2):
  - `admin` — 김관리 (`admin.kim@…`, isGroupViewer)
  - `user` — 박직원 / `user-finance` — 이재무 / `user-production` — 박생산 (일반 3종)
  - `companyAdmin` — 최관리 (`cadmin.choi@…`, 단일 담당) — `managedCompaniesOf(email)`로 담당 구성
  - `companyAdmin-multi` — 정담당 (`cadmin.jung@…`, KBH·HC 복수 담당)
- **로그인 후 이동**(`handleDemoLogin`): `admin` **및** `companyAdmin` → `/admin`, 그 외 → `redirectTo`.
- `mocks/companyAdminMockData.ts`에서 `managedCompaniesOf`만 import(SSOT 연동). 공유 모드 분기 없음.

#### `AboutPage.tsx` — `/about`

정적 소개 페이지. 문제 정의 → 작동 방식 → 핵심 가치 → 로드맵 → CTA.

#### `ProjectListPage.tsx` — `/projects`

AX 플랫폼 탐색. 상단 **sticky 2행 필터 바**(좌측 사이드바 아님) + 본문 헤더 정렬.

- **필터 축**: `플랫폼`(`source`) · `도메인`(`domainFilter`, `BUSINESS_DOMAINS`) · `이용 구분`(`usage` — 바로 사용/담당자 문의/사용 중지, 관리자에겐 준비 중 추가) · `관계사`(`company`, `CompanyFilterDropdown`) · 인기 태그 칩 · `초기화`.
- **정렬**: `SORT_OPTIONS` = 최신순/인기순/이름순.
- **URL 파라미터**: `?q=`(검색) · `?platform=` · `?status=`(available/restricted/stopped/preparing) · `?domain=`. `location.state._resetAt`로 필터 리셋.
- **주요 state**: `search`, `source`, `usage`, `company`, `sort`, `domainFilter`, `visibleCount`(24씩 더 보기), `hovered`. (`sidebarOpen` 없음.)
- **내부 컴포넌트**(모듈 레벨): `HeartIcon`, `CompanyFilterDropdown`.

#### `PlatformItemDetailPage.tsx` — `/n8n/:itemId` 외 5개 경로

AX 항목 상세. 플랫폼 종류별 섹션 조건부 렌더링. 좋아요·댓글·복사.

- **localStorage**: 방문 시 `ax_recent_viewed`에 itemId 추가 (최대 10개).
- **후기 탭**: 게시된 항목에서 `PlatformReview` 등록 가능.

---

### 인증 필요 페이지 (`ProtectedRoute`)

#### `ProjectRegisterPage.tsx` — `/projects/new`

**3단계 고정 스텝 폼**: 유형 선택 → 정보 입력(공통·유형별·담당자 통합) → 최종 확인.

- **공통 필드**: 사진(최대 10장, 캐러셀 입력) · 제목 · 한 줄 요약 · 상세 설명 · 업무 도메인 · 태그 · 담당자.
- **유형별**: n8n(JSON 업로드→다이어그램 자동 표시·예상 효과·구성 난이도) / pa(예상 효과) / assistant(공유 프롬프트·기반 모델) / ai-orchestration(이용 가능 여부·강점 및 활용 방법·모델 접속 URL·세부 모델명·처리 가능 글 분량·비용 등급, **관리자 전용**) / ml(모델 유형·학습 데이터 개요·개발 도구) / vibe·etc(공통만).
- **관계사 범위 입력 없음** — 전 항목 전사 공용(`company: []`)으로 고정. 상태·실행 URL(ai-orch 모델 접속 제외) 입력 없음.
- **내부 컴포넌트**(모듈 레벨): `Section`, `SubHeading`, `Field`, `Tag`, `RowRemoveButton`, `ImageCarouselInput`, `TimeSavedInput`, `ChipInput` 등.

#### `MyStatusPage.tsx` — `/my-status`

내가 등록한 AX 항목 상태 조회. 병렬 2슬롯 승인 기준 **5탭**(전체/승인 대기/부분 승인/게시됨/반려) + `ParallelApprovalIndicator` + "내가 남긴 후기" 섹션. (상세는 위 [승인 흐름] 참조.)

#### `EditRequestPage.tsx` — `/edit-request/:id`

게시된 항목 수정 신청. **등록 폼(ProjectRegisterPage) Step 1 필드 구성과 1:1 대응**한 폼을 현재 값으로 프리필한 뒤, 변경 내용 + 수정 사유를 입력해 제출 → 관리자 검토 후 반영. 상태·관계사·실행 URL·삭제된 유형별 필드의 수정 UI는 없음. 사진은 캐러셀 입력(`ImageCarouselInput`) 모듈 레벨 패턴 공유.

---

### 관리자 전용 페이지

모든 관리자 페이지는 `<AdminNavbar />` + `<AdminSidebar />` 레이아웃 공유.

#### `AdminDashboard.tsx` — `/admin` (admin + companyAdmin)

KPI 5개 (`repeat(5, 1fr)`): `전체 등록물` / `승인 대기`(부분 승인 N건 포함) / `이번 달 신규` / `게시된 도구` / `누적 활용 후기`. (운영 상태 폐기로 `사용 가능 도구` → `게시된 도구`로 변경 — 승인 완료·게시 기준.)

- **조회 범위 선택기** 헤더 노출(위 [조회 범위 선택기] 참조). `pendingCount`는 `baseScope` 기준.
- 승인 대기 · 최근 승인 2열 목록, 월별 등록 추이 스택 바(7유형), 카테고리별 구성, 비즈니스 도메인 분포. 출처 색상·라벨은 `PLATFORMS`에서 파생(etc 포함). 목업 ID는 `{PREFIX}-2026-{NNN}` 형식으로 통일.

#### `AdminReview.tsx` — `/admin/review` (admin + companyAdmin)

AX 항목 병렬 2슬롯 승인 검토. `SummaryStrip`(필터) · `SlotPill`(목록) · `SlotCard`(상세 병렬 카드) · `pendingCount` 산출. (상세는 위 [승인 흐름 → AdminReview 슬롯 UI] 참조.)

- **간소화 검토 필드**: 공통(이미지 캐러셀 표시·제목·요약·상세·도메인·태그·담당자) + 유형별(n8n 다이어그램·예상 효과·난이도 / pa 예상 효과 / assistant 공유 프롬프트·기반 모델 / ai-orch 가용 여부·강점·모델 접속 URL·세부 모델명·글 분량·비용 등급 / ml 모델 유형·학습 데이터·개발 도구 / vibe·etc 공통만). **상태·관계사 지정·삭제된 유형별 필드 검토 UI 없음.**
- **승인 권한 가드는 현행 슬롯 모델 그대로 유지** — `company`/`platformScope`는 슬롯 자격 판정 데이터로만 존치(편집 UI 제거).
- **내부 컴포넌트**(모듈 레벨): `SlotPill`, `SlotCard`, `SummaryStrip`, `FieldRow`, `SectionBlock`, `SingleSelectTag`, `TimeSavedInput`, `ImageStripView`.

#### `AdminProjectManage.tsx` — `/admin/projects` (admin + companyAdmin)

게시된 AX 항목 전체 관리. 편집 필드는 등록 폼과 동일한 간소화 7유형 체계(상태·관계사·실행 URL 편집 없음).

- **CompanyAdmin**: `canManageItem`(담당 관계사 + 전사 공용)만 표시. 삭제만 가능.
- **Admin 전용**: ★ 하이라이트 토글, ✦ 금주의 발견 토글, 수정, 직접 등록. `expectedTimeSaved` 직렬화/역직렬화(`timeSavedValue`·`timeSavedPeriod`) 유지.
- **내부 컴포넌트**(모듈 레벨): `FieldRow`, `SectionBlock`, `SingleSelectTag`, `ImageStripView`, `TimeSavedInput`.

#### `AdminTaxonomy.tsx` — `/admin/taxonomy` (admin)

AX 항목 분류체계 관리. 탭 4종(**업무 도메인 · 구성 난이도 · 비용 등급 · ML 모델 유형**) + 자유 태그. 등록 폼에서 입력이 사라진 고아 분류(n8n 노드 힌트·PA 커넥터·n8n·PA 연동 앱·Vibe 도구 힌트)는 삭제 — n8n은 JSON 업로드로 전환되어 수동 노드 입력이 없다. 구성 난이도는 **n8n 전용**. 자유 태그 출처(`sourceKind`)는 `etc`(표시명 "AI 프로젝트") 포함 7유형 대응.

#### `AdminOrg.tsx` — `/admin/org` (admin)

조직 관리 **4개 섹션**:

1. **관계사 노출 관리** — 관계사별 플랫폼 노출 on/off (`CompanyVisibilityDropdown`).
2. **부서 관리** — 부서 CRUD, 관계사 단위 아코디언 (`DeptRow`, `CompanyAccordion`).
3. **관계사 관리자(CompanyAdmin) 현황** — **읽기 전용 현황판**(위 [관리자 지정 체계] 참조).
4. **문의 채널 설정** — Teams 채널 URL 등 운영 설정(`config/operations.ts` 연동 대상).

- **내부 컴포넌트**(모듈 레벨): `Toggle`, `CompanyVisibilityDropdown`, `DeptRow`, `CompanyAccordion`.

#### `AdminUsers.tsx` — `/admin/users` (admin)

사용자 권한 관리. 탭 4종(관리자 권한 / 그룹 전체보기 / 등록자 관리 / 활동 로그). `관리자 권한` 탭이 관리자 지정 유일 편집 지점. (상세는 위 [관리자 지정 체계 → AdminUsers] 참조.)

#### `AdminStatistics.tsx` — `/admin/statistics` (admin + companyAdmin)

통계 대시보드. 조회 범위 선택기 노출(pendingCount 없음).

- 상단 카드 4개(전체 등록물/이번 달 신규/**참여 부서**/참여 관계사), 기간 프리셋 + 월 지정. (운영 상태 폐기로 `활성 항목` 카드 및 `항목 상태 4그룹` 차트 제거.)
- 등록 추이(7유형 스택) · 카테고리별 등록 현황(3-col) · 비즈니스 도메인·부서별 현황 · **절감 효과 요약**(`parseTimeSaved` → 연간 환산, `baseScope`/`viewScope`·`AdminScopeSelect` 구조 유지) · 3-column 분석(난이도[**n8n 전용**]/비용 구간[AI Agent]/ML 유형) · **후기 많은 항목 TOP 5** · 탐색 키워드 빈도. 출처 색상은 `PLATFORMS`에서 파생.

#### `AdminPlatforms.tsx` — `/admin/platforms` (admin)

7개 카테고리 메타데이터(이름·설명·경로·색상·아이콘) CRUD. `IconPicker`(ICON_PRESETS 그리드) + `iconPreset()` 폴백 + `PlatformIcon`. (표시 문자열은 "카테고리", 라우트 `/admin/platforms`·파일명·코드 심볼은 platform 계열 유지. 위 [아이콘 체계] 참조.)

---

## 공통 컴포넌트

| 파일 | 역할 |
|------|------|
| `Navbar.tsx` | 일반 사용자용 상단 고정 네비게이션. 관리자 진입은 `isAdmin \|\| isCompanyAdmin`. 역할 배지 2종. 공유 모드에선 SSO 버튼 숨김 + 배너 높이 오프셋. |
| `AdminNavbar.tsx` | 관리자 페이지 상단 네비게이션. |
| `AdminSidebar.tsx` | 관리자 좌측 사이드바. 역할별 메뉴 노출(companyAdmin 4개, 라벨 "관계사 관리자 메뉴"). `pendingCount` 뱃지. |
| `AdminScopeSelect.tsx` | 조회 범위 선택 드롭다운. `ScopeSelection` / `restrictTo`. |
| `ShareRedirect.tsx` | 공유 모드에서 랜딩 외 경로 가로채 안내 + 랜딩 복귀. |
| `SharePreviewBanner.tsx` | 공유 모드 상단 sticky 안내 바. `SHARE_BANNER_HEIGHT = 32`. |
| `Footer.tsx` | 공통 푸터(하단 고정). |
| `ProtectedRoute.tsx` | 라우트 가드. `requireAdmin` + `allowCompanyAdmin`. |
| `N8nFlowPreview.tsx` | SVG 기반 n8n 워크플로우 시각화. |
| `WorkflowDiagram.tsx` | 워크플로우 다이어그램 시각화. |
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
├── login(user) → setUser + sessionStorage("demo_user") 저장 (데모)
├── logout()   → setUser(null) + sessionStorage 삭제
├── isAdmin           → user.role === "admin"
├── isCompanyAdmin    → user.role === "companyAdmin"
├── isGroupViewer     → user.isGroupViewer ?? false
└── managedCompanies  → user.managedCompanies ?? []
```

- **데모 모드**: 앱 진입 시 `sessionStorage("demo_user")`를 읽어 새로고침에도 로그인 유지.
- **실제 연동 시**: `GET /api/v1/auth/me` 호출로 세션 확인 예정. `managedCompanies`는 이 응답으로 채워진다.

---

## 공용 타입 (`types/platformTypes.ts`)

| 타입/상수 | 설명 |
|---|---|
| `PlatformId` | `"n8n" \| "pa" \| "assistant" \| "ai-orchestration" \| "ml" \| "vibe" \| "etc"` (**7종**, 변경 금지) |
| `ID_PREFIX` / `makeItemId` | 항목 ID 접두어 매핑(`N8N`/`PA`/`AST`/`AIO`/`ML`/`VIBE`/`ETC`) + `{PREFIX}-{YYYY}-{NNN}` 생성기 (아래 [항목 ID 체계] 참조) |
| `ICON_PRESETS` | 아이콘 레지스트리 `Record<string, {label, path}>` (21종, `etc` 포함). AdminPlatforms 아이콘 선택 SSOT |
| `IconKey` | `keyof typeof ICON_PRESETS` (사실상 string — PLATFORM_ICON_PATH 호환) |
| `Platform` | 플랫폼 메타 (id, name, shortDesc, path, accessUrl, color, bg, icon) |
| `PLATFORMS` | **7개** 플랫폼 메타 배열. 출처 색상·경로 SSOT (변경 금지) |
| ~~`PlatformItemStatus`~~ | **@deprecated 운영 상태 폐기.** `"사용 가능" \| "준비 중" \| "일부 제한" \| "사용 중지"`. 제품 UI에서 전면 제거됨 — LandingPage 잔존 참조 정리 시 타입 삭제 예정. |
| ~~`STATUS_ORDER` / `STATUS_COLOR` / `STATUS_QUERY_KEY`~~ | **@deprecated** 운영 상태 4종 배열·색상·URL 키. 신규 참조 금지. |
| ~~`LEGACY_STATUS_MAP` / `normalizeStatus`~~ | **@deprecated** 레거시 상태 문자열 정규화. |
| `agentAvailability` (PlatformItem 필드) | **운영 상태 폐기의 유일한 예외** — AI Agent(ai-orchestration) 전용 이용 가능 여부 `"사용 가능" \| "사용 불가"`. 기존 4종 상태 체계와 별개 축. |
| `BUSINESS_DOMAINS` / `BusinessDomain` | 업무 도메인 축 `["영업","생산","연구","재무","HR","IT"]` |
| `ApprovalSlotKey` / `ApprovalSlot` / `ApprovalSlots` | 병렬 2슬롯 승인 (`company` / `global`) |
| `APPROVAL_SLOT_LABEL` | 슬롯 라벨 (관계사 관리자 승인 / 전사 관리자 승인) |
| `ApprovalStage` | `"승인 대기" \| "부분 승인" \| "게시됨" \| "반려" \| "중지"` |
| `deriveStage` | 슬롯 상태 + 종결 플래그 → stage 파생 |
| `LEGACY_APPROVAL_MAP` | 레거시 stage → 슬롯 초기값 매핑 (이행용) |
| `ApprovalRecord` | `{ slot?, action, at, by, note? }` — 승인/반려 이력 1건 |
| `DeletionRecord` | CompanyAdmin 삭제 이력 |
| `PlatformReview` | `{ id, itemId, itemTitle, itemKind, author, dept, text, createdAt, likes }` |
| `EditorsPick` | 금주의 발견 `{ itemId, reason, pickedAt, pickedBy }` |
| `PlatformItem` | AX 항목 공용 타입. `company?: string[]`, `expectedTimeSaved?`, `domain?`, `usageMode?`, 카테고리별 전용 필드 포함 |
| `PLATFORM_ICON_PATH` | 플랫폼 아이콘 SVG path 매핑 (6키, ICON_PRESETS 기존 6종과 동일 path) |

### 항목 ID 체계 (`ID_PREFIX` / `makeItemId`)

```
형식: {PREFIX}-{YYYY}-{NNN}   예: N8N-2026-001, AIO-2026-012, ETC-2026-001
PREFIX: n8n=N8N / pa=PA / assistant=AST / ai-orchestration=AIO / ml=ML / vibe=VIBE / etc=ETC
```

- **카테고리별·연도별 독립 순번** — 순번(NNN)은 (유형, 연도) 조합마다 1부터 매김.
- **결번 재사용 금지** — 삭제·반려된 순번은 다시 쓰지 않는다.
- **승인 전후 ID 불변** — 신청 시 발급된 ID가 게시 후에도 그대로 유지된다.
- **서버 발급** — 실제 연동 시 PostgreSQL 카테고리·연도별 시퀀스로 INSERT 시점에 원자적 발급. 데모는 `makeItemId(platformId, seq, year)`로 모사.

### 운영 상태(PlatformItemStatus) 폐기

- **운영 상태 4종(`사용 가능`/`준비 중`/`일부 제한`/`사용 중지`)은 제품에서 전면 폐기.** 등록·검토·관리·상세·통계 어디에도 상태 표시·편집·필터·집계 UI를 두지 않는다.
- **유일한 예외**: AI Agent(ai-orchestration)의 `agentAvailability`(`사용 가능`/`사용 불가`) — 운영 상태와 별개 축.
- **승인 수명주기는 유지** — `승인 대기`/`부분 승인`/`게시됨`/`반려`/`중지`는 상태와 별개 개념으로 존치(위 [승인 흐름] 참조).
- `PlatformItemStatus`·`STATUS_ORDER`·`STATUS_COLOR`·`STATUS_QUERY_KEY`·`LEGACY_STATUS_MAP`·`normalizeStatus`는 **deprecated**. 현재 잔존 참조는 `LandingPage.tsx`뿐이며, 정리 완료 시 타입 정의 자체를 삭제한다.

### 항목 URL·관계사 표시 정책

- **항목 실행/접속 URL 폐기** — 유일한 예외는 AI Agent의 **모델 접속 URL**(`specificUrl`). 그 외 유형의 실행 URL·소스 저장소 입력은 제거됨.
- **회사/관계사 표시 폐기** — 항목의 사용 주체는 **담당자 소속 부서(dept) + 업무 도메인(domain)**으로 표현. `company`/`platformScope`는 승인 권한 가드(관계사 슬롯)·companyAdmin 조회 범위 판정용 **데이터로만 존치**(편집 UI 없음, 신규 항목은 전사 공용).

### 예상 절감 시간 모델 (`expectedTimeSaved`)

```
입력: 수치 + 주기(일/주/월/년) → 직렬화: "<주기> N시간" 표준 문자열 (예: "주 3시간")
연간 환산: AdminStatistics.parseTimeSaved() — PERIOD_MULTIPLIER(일 365 / 주 52 / 월 12 / 년 1),
          분 단위는 60으로 나눔. 파싱 불가 값은 null(추정 불가 항목).
```

---

## 공용 Mock 모듈

### `mocks/statsMockData.ts`

> AdminStatistics / AdminDashboard 공유 더미. **DEMO 전용 — 백엔드 연동 시 폐기.**

| 항목 | 설명 |
|---|---|
| `SourceKey` | `PlatformId` — **7종**(etc 포함). 운영 상태 필드 없음 |
| `MonthPoint` | 월별 포인트. **7개** 유형 필드(`etc`는 더미 0·중립) |
| `STAT_COMPANIES` / `StatCompany` | 더미 기준 관계사 코드 배열 (`KKM`…`KBT` 7종) |
| `COMPANY_NAME` | 관계사 코드 → 표시명 매핑 |
| `MONTH_SERIES_BY_COMPANY` / `SOURCE_TOTAL_BY_COMPANY` / `DOMAIN_BY_COMPANY` | 관계사별 원본 시계열·합계·도메인 분포 |
| `scopedCompanies(scope)` | `null` → 전체, 배열 → 해당 관계사만 |
| `aggregateMonthly` / `aggregateSourceTotal` / `aggregateDomain` | 범위 내 관계사 합산 |
| `monthTotal(m)` | 월 포인트의 출처 합계 |

타입 import 주의: `SourceKey`, `MonthPoint`, `StatCompany`는 `import type` 분리 필수.

### `mocks/companyAdminMockData.ts`

> 관계사 관리자(CompanyAdmin) 지정 공유 목업. **DEMO 전용.** AdminUsers(편집)·AdminOrg 섹션 3(읽기 전용)·LoginPage(데모 계정) 3곳이 이 단일 데이터를 참조. (위 [관리자 지정 체계] 참조.)

| 항목 | 설명 |
|---|---|
| `CompanyAdminUser` | `{ email, name, dept?, managedCompanies: string[] }` |
| `INITIAL_COMPANY_ADMINS` | 초기 관계사 관리자 목록 (최관리 KKM / 정담당 KBH·HC) |
| `managedCompaniesOf(email)` | 이메일 → 담당 관계사 코드 목록 (auth/me managedCompanies 모사) |

---

## API 연동 준비 (`lib/api.ts`)

> 백엔드 연동 대비 스텁. **현재 미사용** — 모든 페이지는 Mock 데이터 사용.

```ts
api.get<T>(path) / api.post<T>(path, body) / api.put<T>(path, body) / api.delete<T>(path)
```

- `VITE_API_URL` 환경변수 기반 (`http://localhost:8000`).

### 주요 예정 엔드포인트

| 메서드 | 경로 | 대응 페이지 |
|--------|------|------------|
| `GET` | `/api/v1/platform-items` | ProjectListPage |
| `POST` | `/api/v1/platform-items` | ProjectRegisterPage |
| `GET` | `/api/v1/platforms/:platformId/items/:itemId` | PlatformItemDetailPage |
| `POST` | `/api/v1/platform-items/:id/reviews` | PlatformItemDetailPage (후기 등록) |
| `GET` | `/api/v1/my/platform-items` / `/api/v1/my/reviews` | MyStatusPage |
| `GET` | `/api/v1/admin/review-queue` | AdminReview |
| `PATCH` | `/api/v1/admin/platform-items/:id/approve-slot` | AdminReview (슬롯별 승인) |
| `PATCH` | `/api/v1/admin/platform-items/:id/reject` | AdminReview |
| `GET` / `PUT` | `/api/v1/admin/platform-items(/:id)` | AdminProjectManage |
| `GET` | `/api/v1/admin/companies` | AdminOrg / AdminScopeSelect |
| `GET` / `PUT` | `/api/v1/admin/company-admins` | AdminUsers (관리자 지정) |
| `GET` | `/api/v1/admin/users` | AdminUsers |
| `GET` | `/api/v1/admin/stats/*` | AdminStatistics, AdminDashboard |
| `GET` / `POST` / `PUT` | `/api/v1/admin/platforms(/:id)` | AdminPlatforms |
| `GET` | `/api/v1/admin/settings` | AdminOrg (문의 채널 등) |
| `GET` | `/api/v1/auth/me` | AuthContext (role·managedCompanies) |
| `POST` | `/api/v1/auth/logout` | AuthContext |

> **개편 반영 사항**
> - **`PATCH /platform-items/:id/status` 삭제** — 운영 상태 폐기로 상태 변경 엔드포인트 없음.
> - **승인(`approve-slot`)·수정 요청(`edit-requests`) body에서 `company`·`platformScope` 제거** — 전 항목 전사 공용, 관계사 지정 흐름 폐기. 두 필드는 승인 권한 가드 데이터로만 잔존.
> - **등록·수정 body에 `images: string[]`(최대 10장, 데모는 data URL) 추가.** AI Agent만 `agentAvailability`·모델 접속 `specificUrl` 유지.

---

## 플랫폼 포지셔닝

Kolmar AX Platform은 그룹 전체 AX(AI 전환) 확산 활동의 산출물을 모으는 저장소입니다.

- **7대 AX 플랫폼 유형**: n8n(업무 자동화), Power Automate(플로우 자동화·RPA), 나만의 비서(HK GPT 커스텀), AI Agent(AI 오케스트레이션·HK GPT 게이트웨이), ML 모델, Vibe Coding, AI 프로젝트(팀에서 구축한 AI 시스템·서비스 사례를 블로그 형식으로 소개)
- **`etc` 표시 라벨 = "AI 프로젝트"**: 내부 식별자(`PlatformId` 값 `"etc"`, ID 접두어 `ETC`, 라우트 `/etc`)는 **불변**. 사용자 노출 라벨만 "기타" → "AI 프로젝트"로 변경(`PLATFORMS`의 name이 단일 소스이며 파생 라벨은 자동 반영).
- **표시 용어 "카테고리"로 통일**: 7개 자산 유형을 가리키는 **사용자 노출 문구는 "카테고리"**(예: "카테고리별 등록 현황"). **코드 내부 식별자는 platform 계열 유지**(`PlatformItem`·`platformId`·`platformScope`·`PLATFORMS`·`PlatformId`·`AdminPlatforms` 파일·라우트 `/admin/platforms`·`PLATFORM_ICON_PATH` 등). 제품명 "AX Platform / AX 플랫폼"과 외부 실행 환경(n8n 서버·HK GPT) 지칭, TODO API 경로(`/api/v1/platforms/...`)는 그대로 둔다.
- **AI Agent 표기 규칙**: 항목 **제목은 모델명 단독**(예: `Claude Opus 4.8`) — 제공사 괄호 병기 없음. 제공사는 상세 설명/세부 모델명 등 자유 텍스트에 기재.
- **빌더-카탈로그 계층 분리**: 도구를 만드는 빌더 활동과 발견·재사용하는 카탈로그 계층을 구분.
- **정량적 성과 가시화**: 예상 절감 시간 등 정량 지표를 표면화하여 도구의 실효 가치를 드러냄.
