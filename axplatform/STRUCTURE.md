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
| 내부 식별자 변경 금지 | `AssetItem`, `categoryId`, `companyScope`, `CATEGORIES` 등 변경 금지. |
| 파일 단위 저장 | 부분 diff가 아닌 수정 완료된 전체 파일로 저장. |
| 인라인 오류 UI | 오류·확인 UI는 인라인으로 처리. 팝업·모달 신설 금지. |
| `import type` | 타입 전용 import는 `import type` 분리 (`verbatimModuleSyntax`). |
| **타입 검증 명령** | **`npx tsc -b`** 사용. 루트 `tsc --noEmit`은 루트 tsconfig가 `files: []` + `references` 구조라 항상 통과하므로 **무효**. 빌드 스크립트도 `tsc -b && vite build`. |
| 호버 확장 패널 | 트리거와 패널 사이 틈을 **브리지**(래퍼 내부 `paddingTop`으로 간격을 호버 영역화)로 이어 붙이고, `onMouseLeave`에 **200ms 닫힘 유예**(`setTimeout`)를 둔다. |
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
| `/admin/notices` | ✓ | ✓* |

→ companyAdmin이 접근 가능한 4종은 **대시보드·검토·프로젝트 관리·통계**. `taxonomy·org·users·platforms`는 **admin 단독**.
→ **`*` `/admin/notices`는 실질 admin 전용.** 라우트는 `allowCompanyAdmin`으로 통과만 허용하되, 화면 내부에서 `isCompanyAdmin`이면 관리 UI 대신 "전사 관리자 전용" 안내를 렌더한다(사이드바 메뉴는 companyAdmin에게 비노출).

### 역할별 UI 노출

- **AdminSidebar** (`src/components/AdminSidebar.tsx`): `ADMIN_NAV` 각 항목에 `companyAdmin: boolean` 플래그. `isCompanyAdmin`이면 `companyAdmin: true`인 4개(대시보드·등록 신청 검토·프로젝트 관리·통계)만 노출하고, 사이드바 라벨을 **"관계사 관리자 메뉴"**로(그 외 "관리자 메뉴") 표시. `/admin/review` 항목엔 `pendingCount` 뱃지. **admin 단독 메뉴**: 분류체계·부서/조직·사용자·자동화·AI 도구·**공지·업데이트 관리**(`/admin/notices`, `companyAdmin: false`).
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

### 승인 타입 (`src/types/categoryTypes.ts`)

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
- **`SlotCard`** — 상세 패널의 슬롯별 병렬 카드 2장(`display: flex`). 각 카드는 `APPROVAL_SLOT_LABEL` + 상태 배지(승인 완료/대기) + `이 슬롯 승인` 버튼 또는 비활성 사유(`disabledReason`)를 렌더. **승인된 슬롯 + 본인 권한 + 게시 전(부분 승인)** 이면 `승인 취소` 버튼(confirm 1단계 → 슬롯 대기 복귀)을 추가로 렌더한다.
- **`OwnerCompanyBadge`**(모듈 레벨) — 목록 행·상세 메타의 **등록 관계사 배지**. `ownerCompany` 표시명(`orgCompanyName`, 조직 SSOT 파생)을 TONE 토큰 칩으로 렌더. 관리자 화면 전용(사용자 화면 노출 금지, 0.5). AdminProjectManage에도 동명 컴포넌트로 동일 배치.
- **승인 취소(`cancelSlot`)** — 게시 전(부분 승인) 한정. 자격 predicate는 승인과 동일(`canActCompanySlot`/`canActGlobalSlot`). 슬롯을 `{approved:false}`로 되돌리고 `deriveStage` 재판정(부분 승인 → 승인 대기), `approvalHistory`에 `action: "취소"` 기록. 게시 완료(2/2·종결) 건은 슬롯 영역(`!isTerminal`) 자체가 비노출이라 도달 불가(정정은 "중지" 경로). `ApprovalRecord.action`은 3종(`승인`/`반려`/`취소`).
- **가시성 필터(판정 축 = `ownerCompany`)** — companyAdmin은 신청 등록 주체(`ownerCompany`)가 본인 `managedCompanies`에 포함된 건만 본다(노출 범위 `company`가 아니라 등록 주체가 판정 축 — 관계사 슬롯은 신청자 소속 관계사 관리자의 몫). admin은 전체. `visibleToUser`가 산출하는 `baseItems`에 요약 스트립·목록·카운트가 모두 정합. 빈 상태 문구도 companyAdmin이면 "담당 관계사의 승인 대기 신청이 없습니다".
- **슬롯 행동 자격**:
  - `ownsByOwnerCompany(i) = managedCompanies.includes(i.ownerCompany)`
  - `canActCompanySlot(i) = isAdmin || (isCompanyAdmin && ownsByOwnerCompany(i))`
  - `canActGlobalSlot(i) = isAdmin`
  - 가시성과 관계사 슬롯 자격이 같은 축(`ownerCompany`) — companyAdmin에게 보이는 건은 관계사 슬롯 승인 가능, 전사 슬롯은 비활성. 노출 범위 편집 UI는 폐기(`companyScope === "unset"` 방어 가드는 코드에 잔존).
- **`pendingCount` (사이드바)** — 사용자가 처리 가능한 **미승인 슬롯 잔여 항목 수**. admin: 미종결(`게시됨/반려/중지` 아님) 전체. companyAdmin: `ownsByOwnerCompany(i) && !i.approvalSlots.company.approved`. 전체 `items` 기준(요약 스트립 카운트는 사용자 가시 `baseItems` 기준).
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

## 아이콘 체계 (`types/categoryTypes.ts`)

- **`ICON_PRESETS`** — `Record<string, { label: string; path: string }>` 아이콘 레지스트리. 기존 6종(`automation`·`assistant`·`orchestration`·`pa`·`ml`·`vibe`, path·키 변경 금지) + 신규 14종(`bot`·`document`·`barChart`·`lineChart`·`branch`·`database`·`settings`·`chat`·`search`·`calendar`·`mail`·`cloud`·`shield`·`puzzle`) + `etc`(AI 프로젝트) = **21종**(§공용 타입과 일치).
- **`IconKey = keyof typeof ICON_PRESETS`** — `Record<string, …>` 기반이라 사실상 `string`. 리터럴 유니온이 아닌 이유는 기존 `CATEGORY_ICON_PATH`(`Record<Category["icon"], string>` = `Record<string, string>`)의 6개 매핑 호환을 유지하기 위함(추가 키 요구 없음).
- **AdminCategories `IconPicker`** — `AdminScopeSelect`와 동일 패턴의 그리드 선택 패널(`repeat(3, 1fr)`). `ICON_OPTION_KEYS = Object.keys(ICON_PRESETS)`를 순회하므로 신규 프리셋이 자동 노출. 트리거는 미리보기 + `iconLabelOf(value)` + 회전 셰브론.
- **`iconPreset(icon)` 폴백** — 미등록 키는 `console.warn` 후 `ICON_PRESETS.automation`으로 대체(서버 비정상 값 방어). `CategoryIcon`이 `iconPreset(icon).path`로 SVG 렌더.

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
- **Teams 버튼 비활성** — LandingPage `CtaBoxes`의 "문의 채널" 박스가 공유 모드에서 실제 Teams 열기 대신 `showNotice()`를 호출(비공유 모드에서는 `window.open(TEAMS_CHANNEL_URL)`).
- **산출물**: `ax-landing-preview.html` — **현재 삭제됨.** 랜딩(`/`)이 외부 제작 콘텐츠로 **교체 완료**(Next.js 원본 포팅). 이제 `npm run build:share`로 재생성 가능. 새 랜딩은 로컬 에셋·로컬 폰트·CSS 애니메이션만 사용해 자기완결(외부 CDN 이미지/라이브러리 의존 없음 — 단 앱 전역 `index.html`의 Google Fonts CDN은 기존 유지). 공유 빌드 체계(`VITE_SHARE_MODE`·`vite-plugin-singlefile`·`ShareRedirect`·`SharePreviewBanner`)는 그대로 유지한다.

---

## 항목 노출 정책

### 관계사 범위 (`company: string[]`)

| 값 | 의미 |
|----|------|
| `[]`(비움/생략) | 전사 공용. 모든 관계사 사용자에게 노출. |
| `["KKM", …]` | 명시된 관계사 사용자에게만 노출. |

- 관계사 지정 편집 UI는 폐기 — 신규 항목은 전사 공용으로 생성된다. `company`/`companyScope`는 승인 슬롯 자격·companyAdmin 조회 범위 판정 데이터로만 사용.

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
axplatform/
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
        │   ├── api.ts        # 백엔드 연동 대비 스텁 (현재 미사용)
        │   └── dataSource.ts # 데이터 접근 계층(동기, DEMO) — 페이지·훅↔mocks 유일 경유 지점
        ├── config/
        │   ├── shareMode.ts  # IS_SHARE_MODE 단일 참조점
        │   └── operations.ts # TEAMS_CHANNEL_URL 단일 상수 (운영 설정 참조점)
        ├── context/
        │   ├── AuthContext.tsx
        │   ├── useAuth.ts
        │   └── ShareNoticeContext.tsx  # 공유 모드 안내(3초)
        ├── styles/
        │   └── layout.ts     # CONTENT_MAX_WIDTH=1400 / FORM_MAX_WIDTH=760
        ├── types/
        │   ├── categoryTypes.ts        # 타입·CATEGORIES·ICON_PRESETS·승인 슬롯·detailPathForItemId
        │   ├── noticeTypes.ts          # Notice(공지·업데이트) 타입
        │   └── notificationTypes.ts    # AxNotification·NotificationKind(7종)·배지 스타일
        ├── hooks/                       # 개인화 공용 훅 (useSyncExternalStore + localStorage)
        │   ├── useScraps.ts            # ax_scraps
        │   ├── useInterests.ts         # ax_user_interests
        │   └── useNotifications.ts     # ax_notifications_read (+ 알림 목업 병합)
        ├── mocks/                       # 목업 SSOT 모듈군 — 페이지·훅은 직접 import 금지(lib/dataSource 경유)
        │   ├── assetItemMockData.ts    # 자산 항목 SSOT(목록·상세·후기·게시글·n8n 폴백, 게시 항목 관리 파생 원천) — M1
        │   ├── adminReviewMockData.ts  # 검토 대기 큐(INITIAL_ITEMS)
        │   ├── myStatusMockData.ts     # 내 신청(INITIAL_ITEMS)·내 후기(MOCK_MY_REVIEWS)
        │   ├── adminDashboardMockData.ts # 대시보드 화면 고유(승인 대기·최근 승인·게시 도구 수·후기 수)
        │   ├── adminUsersMockData.ts   # 사용자·권한·활동 로그(⚠️ 감사 로그 소급 수정 금지)
        │   ├── adminOrgMockData.ts     # 조직(관계사·부서·자산 관계사 투영·Teams 동기화 원천)
        │   ├── adminTaxonomyMockData.ts # 분류체계·자유 태그
        │   ├── statsMockData.ts        # 통계 공용 더미 + AdminStatistics 화면 고유 통계(M2 합류)
        │   ├── companyAdminMockData.ts # 관계사 관리자 지정 공용 목업
        │   ├── noticeMockData.ts       # 공지·업데이트 소식 단일 소스(SSOT)
        │   └── notificationMockData.ts # 알림 단일 소스(SSOT)
        ├── components/
        │   ├── Navbar.tsx
        │   ├── AdminNavbar.tsx
        │   ├── NotificationBell.tsx     # 공용 알림 벨 (Navbar·AdminNavbar 공유)
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
            ├── GuidePage.tsx
            │   # /guide 이용 가이드 (구 AboutPage/USR-02 폐지·결번, /about→/guide 리다이렉트)
            ├── NoticesPage.tsx
            │   # /notices 공지·업데이트 목록
            ├── ProjectListPage.tsx
            ├── AssetItemDetailPage.tsx
            ├── ProjectRegisterPage.tsx
            ├── MyStatusPage.tsx
            ├── SettingsPage.tsx         # /settings 관심사(카테고리·도메인) 설정
            ├── EditRequestPage.tsx
            └── admin/
                ├── AdminDashboard.tsx
                ├── AdminReview.tsx
                ├── AdminProjectManage.tsx
                ├── AdminTaxonomy.tsx
                ├── AdminOrg.tsx
                ├── AdminUsers.tsx
                ├── AdminStatistics.tsx
                ├── AdminCategories.tsx
                └── AdminNotices.tsx      # /admin/notices 공지·업데이트 관리 (admin 전용)
```

---

## 라우트 & 페이지 요약

### 공개 페이지 (인증 불필요)

#### `LandingPage.tsx` — `/`

외부 제작 Next.js 랜딩(`_incoming-landing/`)을 Vite SPA로 **포팅 + 신 체계 정합화**해 전면 교체한 버전. flex column 루트의 세로 섹션 구성:

| 섹션 | 설명 | 주요 요소 |
|------|------|----------|
| **[1] 프로모션 + 개인화** | 카테고리 배너 슬라이더(5s 자동전환) + 개인화 패널(인사·지표·퀵액션) | `PromoAndPanel`, `BannerScene` |
| **[2] 아이콘 히어로** | 회전 헤드라인 + 검색 폼 + 카테고리 7타일 | `IconHero`, `RotatingHeadline` |
| **[3] 플랫폼 현황** | 총 항목 카운터 + 카테고리별 막대그래프 | `PlatformStatus`, `NumberTicker` |
| **[4] 인기 항목** | 카테고리 필터 + 항목 카드 6종 | `PopularItems`, `ItemCard` |
| **[5] 최신소식 + 실시간 인기** | 공지/업데이트 탭(`noticeMockData` 참조) + 인기 항목 랭킹 | `LatestNewsAndTrending` |
| **[6] 업무별 항목** | 도메인(`BUSINESS_DOMAINS`) 필터 + 항목 카드 | `ItemsByDomain` |
| **[7] 시작 도우미 CTA** | 4-박스 진입(둘러보기·AI Model·가이드·문의) | `CtaBoxes` |

- **애니메이션(외부 라이브러리 0 — 전부 CSS 키프레임 + rAF/IntersectionObserver)**: `RotatingHeadline`(세로 롤 + 폭 전환), `NumberTicker`(스크롤 진입 시 rAF 카운트업), 카테고리 막대(IntersectionObserver → CSS `width` 전환, 100ms stagger), 배너 슬라이더(5s 자동전환 + prev/next), `BannerScene`(카테고리별 CSS 씬: `beam`/`orbit`/`list`/`terminal` — 원본 `category-backgrounds`의 경량 재현, 마스크 뒤 은은한 플러시).
- **서체**: 헤더 `SB Aggro`(`--font-heading`) · 본문 `SCoreDream`(`--font-landing`) — `index.css`의 로컬 `@font-face`(외부 CDN 의존 없음, `public/fonts/`).
- **에셋**(`_incoming-landing`에서 복사): `public/banner/`(6종) · `public/icons/icon_*·hk.png` · `public/cta/cta_kolling.png`. 카테고리→에셋 매핑은 `CAT_MEDIA`(구 6종 에셋 → 신 7 `CategoryId`, `etc`는 SVG 폴백).
- **정합화**: **[M2] `LANDING_ITEMS`는 데이터 사본을 보유하지 않는다** — 노출할 항목 ID·순서만 `LANDING_ITEM_IDS`(표시 전용 큐레이션)로 남기고, 제목·요약·부서·좋아요·조회수·수정일·도메인 등 데이터 필드는 `dataSource.getAssetItem(id)`에서 파생한다(자산 SSOT와의 사본 드리프트 제거). 표시 전용 원본 에셋 매핑(`CAT_MEDIA` 등)은 프레젠테이션 정보로 페이지 잔류 / 운영 상태 표시·실행 URL·**항목 단위 관계사(그룹사) 표시 없음**(company 표시 제거) / **참여 관계사 로고 마퀴(`PartnerMarquee`)는 그룹 브랜딩 요소로 관계사 표시 폐기(0.5)의 대상이 아니며, 원본 소실(`_incoming-landing` 저장소 부재)로 원본 컴포넌트·로고 에셋 재확보가 필요해 별도 담당자가 복원 예정**(임의 창작 금지) / 링크는 실제 라우트(`/projects`·`?platform=`·`?domain=`·상세 경로)로 재연결 / **최신소식은 `noticeMockData`(단일 소스)를 `dataSource.getNotices` 경유로 참조**(옛 정적 `LATEST_NEWS` 제거, "더보기"·각 행 클릭은 `/notices?kind=`로 연결). **개인화 패널은 F2r에서 실연동**(스크랩 카운트·관심사 매칭 추천·알림 현황 블록·설정 퀵메뉴 — 위 [개인화 — 스크랩·관심사·알림] 참조).
- **공유 모드**: `CtaBoxes`의 "문의 채널" 박스가 공유 모드에서 Teams 열기 대신 `showNotice()`로 대체(`IS_SHARE_MODE`).
- **아이콘**: lucide/tabler 미사용 — 인라인 SVG 컴포넌트(`ArrowRight`·`SearchIco`·`HeartIco` 등).
- **내부 컴포넌트**(모듈 레벨): `NumberTicker`, `RotatingHeadline`, `BannerScene`, `CatIcon`, `PromoAndPanel`, `QuickAction`, `IconHero`, `PlatformStatus`, `ItemCard`, `PopularItems`, `ItemsByDomain`, `LatestNewsAndTrending`, `CtaBoxes` + 인라인 SVG 아이콘 세트.

#### `LoginPage.tsx` — `/login`

- Microsoft SSO 로그인 화면. `?redirect=` 쿼리로 복귀 경로 수신(`redirectTo`). SSO 버튼(`handleSsoLogin`)은 데모 스텁(`DEMO_ACCOUNTS[0]` 로그인).
- **데모 계정 프리셋** (`DEMO_ACCOUNTS`, 총 **6종** = admin 1 + user 3 + companyAdmin 2):
  - `admin` — 김관리 (`admin.kim@…`, isGroupViewer)
  - `user` — 박직원 / `user-finance` — 이재무 / `user-production` — 박생산 (일반 3종)
  - `companyAdmin` — 최관리 (`cadmin.choi@…`, 단일 담당) — `managedCompaniesOf(email)`로 담당 구성
  - `companyAdmin-multi` — 정담당 (`cadmin.jung@…`, KBH·HC 복수 담당)
- **로그인 후 이동**(`handleDemoLogin`): `admin` **및** `companyAdmin` → `/admin`, 그 외 → `redirectTo`.
- `mocks/companyAdminMockData.ts`에서 `managedCompaniesOf`만 import(SSOT 연동). 공유 모드 분기 없음.

#### `GuidePage.tsx` — `/guide`

정적 이용 가이드 페이지. 섹션 구성: **인트로 — 왜 AX Platform인가**(Problem→Solution 4조, 구 AboutPage에서 흡수) → **① 시작하기**(로그인→탐색→상세→문의) → **② 등록 가이드**(3단계 + 유형별 팁) → **③ 승인 절차**(병렬 2슬롯) → **④ FAQ**(문의처 문항 포함).

- **내부 컴포넌트**(모듈 레벨): `SectionHeading`(`index` 옵션) · `WhyIcon` · `WhyCard`(구 AboutPage에서 이식) · `StepCard` · `FaqRow`.
- **인트로 부제(확정 문구)**: "현장의 문제를, 한곳에 모으고, 찾고, 질문에 답하고, 좋은 사례를 전파하여 해결합니다".

> **구 `AboutPage.tsx` — `/about` 폐지(2026-07, USR-02 결번)**: 소개 화면은 가이드와 역할이 중복되어 삭제(`git rm`)했다. "왜 AX Platform" 섹션과 FAQ 고유 문항("문의는 어디로 하나요?")만 GuidePage로 이관했다. `/about`는 `<Navigate to="/guide" replace />`로 리다이렉트하며(App.tsx, 구 링크 안전용 1줄), 푸터 "서비스 소개" 링크·가이드 내 About 진입 링크는 제거했다.

#### `NoticesPage.tsx` — `/notices`

공지사항·업데이트 소식 목록(공개 페이지, 인증 불필요). 랜딩 최신소식 **"더보기"의 연결 대상**.

- **종류 탭 2종**(`NOTICE_KINDS`: 공지사항/업데이트) + 항목 클릭 시 **본문 펼침**(`expanded` 단일 아코디언).
- **표시 규칙**: `visibleNoticesByKind(kind)` — `visible=true`만, **pinned 우선 + 게시일 최신순**. (랜딩과 동일 헬퍼·동일 규칙, 랜딩은 추가로 `slice(0, 5)`.)
- **URL 파라미터** `?kind=`: 진입 탭 결정(공지사항이 기본, 탭 전환 시 `setParams(replace)`로 동기화). `Navbar` + `Footer` 셸.

#### `ProjectListPage.tsx` — `/projects`

AX 플랫폼 탐색. 상단 **sticky 2행 필터 바**(좌측 사이드바 아님) + 본문 헤더 정렬.

- **필터 바 2행**: 1행 = `카테고리`(`source`) + `도메인`(`domainFilter`, `BUSINESS_DOMAINS`), 2행 = 인기 태그 칩 + `초기화`. (별도의 usage 필터·관계사 필터·상태 필터는 없음 — 운영 상태 폐기.)
- **정렬**: `SORT_OPTIONS` = 최신순/인기순/이름순.
- **URL 파라미터**: `?q=`(검색) · `?platform=` · `?domain=`만 읽는다. 상태 파라미터는 읽지 않는다. `location.state._resetAt`로 필터 리셋.
- **주요 state**: `search`, `source`, `sort`, `domainFilter`, `visibleCount`(24씩 더 보기), `hovered`. (`usage`·`company`·`sidebarOpen` state 없음.)
- **`company` 필드 용도**: 표시 필터가 아니라 **비노출 관계사 접근 게이팅**에만 사용 — 비그룹뷰어에게 비노출 관계사(`visible: false`) 항목을 숨기는 `filtered` 메모 조건. 노출 여부 판정은 조직 SSOT 파생 `VISIBLE_COMPANY_CODES = new Set(getOrgCompanies().filter(c=>c.visible).map(c=>c.code))`로 한다(구 내장 `COMPANIES` 리터럴 제거 — `.code/.visible` 소비 결과 동일).
- **내부 컴포넌트**(모듈 레벨): `HeartIcon` 하나뿐.

#### `AssetItemDetailPage.tsx` — `/n8n/:itemId` 외 6개 경로

AX 항목 상세(총 7경로, `/etc/:itemId` 포함). 플랫폼 종류별 섹션 조건부 렌더링. 좋아요·댓글·복사.

- **탭 구성**: `TABS` = 개요 / 상세(유형별, `vibe`·`etc`는 `hasDetailTab=false`로 숨기고 개요에 통합) / 담당자 / 업데이트·논의(posts).
- **localStorage**: 방문 시 `ax_recent_viewed`에 itemId 추가 (최대 10개).
- **후기 등록**: 별도 탭이 아니라 **개요 탭 내부의 후기 섹션**에서 `AssetReview` 등록.

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

#### `SettingsPage.tsx` — `/settings`

관심사 설정 화면. 관심 카테고리(7종 칩)·관심 업무 도메인(6종 칩) 다중 선택 → `useInterests().save`로 `ax_user_interests` 저장 + 저장 완료 인라인 피드백. "추후 개인 정보 항목 추가" 안내 + 확장 지점 TODO. 진입: 개인화 패널 퀵메뉴 "설정" + Navbar 아바타 드롭다운 "설정". (위 [개인화 — 스크랩·관심사·알림 → PART B] 참조.)

#### `EditRequestPage.tsx` — `/edit-request/:id`

게시된 항목 수정 신청. **등록 폼(ProjectRegisterPage) Step 1 필드 구성과 1:1 대응**한 폼을 현재 값으로 프리필한 뒤, 변경 내용 + 수정 사유를 입력해 제출 → 관리자 검토 후 반영. 상태·관계사·실행 URL·삭제된 유형별 필드의 수정 UI는 없음. 사진은 캐러셀 입력(`ImageCarouselInput`) 모듈 레벨 패턴 공유.

---

### 관리자 전용 페이지

모든 관리자 페이지는 `<AdminNavbar />` + `<AdminSidebar />` 레이아웃 공유.

#### `AdminDashboard.tsx` — `/admin` (admin + companyAdmin)

KPI 5개 (`repeat(5, 1fr)`): `전체 등록물` / `승인 대기`(부분 승인 N건 포함) / `이번 달 신규` / `게시된 도구` / `누적 활용 후기`. (운영 상태 폐기로 `사용 가능 도구` → `게시된 도구`로 변경 — 승인 완료·게시 기준.)

- **조회 범위 선택기** 헤더 노출(위 [조회 범위 선택기] 참조). `pendingCount`는 `baseScope` 기준.
- 승인 대기 · 최근 승인 2열 목록, 월별 등록 추이 스택 바(7유형), 카테고리별 구성, 비즈니스 도메인 분포. 출처 색상·라벨은 `CATEGORIES`에서 파생(etc 포함). 목업 ID는 `{PREFIX}-2026-{NNN}` 형식으로 통일.

#### `AdminReview.tsx` — `/admin/review` (admin + companyAdmin)

AX 항목 병렬 2슬롯 승인 검토. `SummaryStrip`(필터) · `SlotPill`(목록) · `SlotCard`(상세 병렬 카드) · `pendingCount` 산출. (상세는 위 [승인 흐름 → AdminReview 슬롯 UI] 참조.)

- **간소화 검토 필드**: 공통(이미지 캐러셀 표시·제목·요약·상세·도메인·태그·담당자) + 유형별(n8n 다이어그램·예상 효과·난이도 / pa 예상 효과 / assistant 공유 프롬프트·기반 모델 / ai-orch 가용 여부·강점·모델 접속 URL·세부 모델명·글 분량·비용 등급 / ml 모델 유형·학습 데이터·개발 도구 / vibe·etc 공통만). **상태·관계사 지정·삭제된 유형별 필드 검토 UI 없음.**
- **승인 권한 가드는 현행 슬롯 모델 그대로 유지** — 병렬 2슬롯·전사 슬롯 admin 전용은 불변. companyAdmin 가시성·관계사 슬롯 자격은 신청 등록 주체 `ownerCompany` 기준으로 판정(`company`/`companyScope`는 노출 범위 데이터로 존치, 편집 UI 제거).
- **내부 컴포넌트**(모듈 레벨): `SlotPill`, `SlotCard`, `SummaryStrip`, `FieldRow`, `SectionBlock`, `SingleSelectTag`, `TimeSavedInput`, `ImageStripView`.

#### `AdminProjectManage.tsx` — `/admin/projects` (admin + companyAdmin)

게시된 AX 항목 전체 관리. 편집 필드는 등록 폼과 동일한 간소화 7유형 체계(상태·관계사·실행 URL 편집 없음).

- **CompanyAdmin**: `canManageItem`(담당 관계사 + 전사 공용)만 표시. 삭제만 가능.
- **Admin 전용**: 수정, 직접 등록. `expectedTimeSaved` 직렬화/역직렬화(`timeSavedValue`·`timeSavedPeriod`) 유지.
- **데이터 소스**: `getManagedAssetItems()`가 자산 SSOT(`getAssetItems`)에서 `ManagedAssetItem`으로 파생(별도 목업 사본 없음). 편집·삭제 데모는 화면 로컬 state.
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
- 등록 추이(7유형 스택) · 카테고리별 등록 현황(3-col) · 비즈니스 도메인·부서별 현황 · **절감 효과 요약**(`parseTimeSaved` → 연간 환산, `baseScope`/`viewScope`·`AdminScopeSelect` 구조 유지) · 3-column 분석(난이도[**n8n 전용**]/비용 구간[AI Model]/ML 유형) · **후기 많은 항목 TOP 5** · 탐색 키워드 빈도. 출처 색상은 `CATEGORIES`에서 파생.

#### `AdminCategories.tsx` — `/admin/platforms` (admin)

7개 카테고리 메타데이터(이름·설명·경로·색상·아이콘) CRUD. `IconPicker`(ICON_PRESETS 그리드) + `iconPreset()` 폴백 + `CategoryIcon`. (표시 문자열은 "카테고리", 파일·코드 심볼은 category 계열로 rename(`AdminCategories`·`CategoryIcon`), 라우트 `/admin/platforms`는 현행 유지. 위 [아이콘 체계] 참조.)

#### `AdminNotices.tsx` — `/admin/notices` (admin 전용)

공지사항·업데이트 소식 관리. 좌측 목록(**종류 필터** `전체/공지사항/업데이트` 세그먼트) + 우측 상세/편집 패널. **DEMO 전용** — `NOTICE_MOCK_DATA`를 로컬 state로 로드해 작성/수정/삭제·**고정(pinned)·노출(visible) 토글** 재현(AdminCategories와 동일 패턴).

- **접근 제어**: 라우트는 `requireAdmin allowCompanyAdmin`이나 화면 상단에서 `isCompanyAdmin`이면 **"전사 관리자 전용" 안내**만 렌더(관리 UI 비노출). 사이드바 메뉴는 `companyAdmin: false`로 companyAdmin에게 숨김.
- **편집 필드**: 종류(세그먼트) · 제목 · 본문(textarea) · 게시일(`YYYY.MM.DD` 검증) · 고정 · 노출. 신규 ID는 `NOTICE-{YYYY}-{NNN}`(현재 연도 최대 순번 +1, TODO 서버 발급).
- **세그먼트 선택**(`Segmented`) — 2~3개 값은 닫힌 드롭다운 대신 세그먼트 버튼(종류·필터·고정/노출 편집 공용). 비편집 상태의 고정/노출은 `ToggleRow`로 즉시 반영.
- **내부 컴포넌트**(모듈 레벨): `FieldRow`, `SectionBlock`, `KindBadge`, `Segmented`, `ToggleRow`.

---

## 공통 컴포넌트

| 파일 | 역할 |
|------|------|
| `Navbar.tsx` | 일반 사용자용 상단 고정 네비게이션. 관리자 진입은 `isAdmin \|\| isCompanyAdmin`. 역할 배지 2종. 아바타 드롭다운에 "설정"(`/settings`) 항목 + **본인 소속 관계사 표시명 1줄**(`orgCompanyName`, companyAdmin은 담당 병기 — 표시명 우선·코드 폴백). `NotificationBell`(로그인·비공유 모드). 공유 모드에선 SSO 버튼 숨김 + 배너 높이 오프셋. |
| `AdminNavbar.tsx` | 관리자 페이지 상단 네비게이션. `NotificationBell` 포함. |
| `NotificationBell.tsx` | 공용 알림 벨. 미읽음 뱃지 + 드롭다운(최근 5건·전체 읽음·항목 이동). `useNotifications` 소스. Navbar·AdminNavbar 공유. |
| `AdminSidebar.tsx` | 관리자 좌측 사이드바. 역할별 메뉴 노출(companyAdmin 4개, 라벨 "관계사 관리자 메뉴"). `pendingCount` 뱃지. |
| `AdminScopeSelect.tsx` | 조회 범위 선택 드롭다운. `ScopeSelection` / `restrictTo`. |
| `ShareRedirect.tsx` | 공유 모드에서 랜딩 외 경로 가로채 안내 + 랜딩 복귀. |
| `SharePreviewBanner.tsx` | 공유 모드 상단 sticky 안내 바. `SHARE_BANNER_HEIGHT = 32`. |
| `Footer.tsx` | 공통 푸터(하단 고정). |
| `ProtectedRoute.tsx` | 라우트 가드. `requireAdmin` + `allowCompanyAdmin`. |
| `N8nFlowPreview.tsx` | SVG 기반 n8n 워크플로우 시각화. |
| `WorkflowDiagram.tsx` | 워크플로우 다이어그램 시각화. |
| `CardIdTag.tsx` | **항목 ID(0.3 체계) 공용 표시 태그**. 사용자 화면 카드·상세 공용(목록·랜딩·상세 헤더·내 현황). 등록 부서 왼쪽 고정(없으면 메타 줄 선두). TONE 토큰만·신규 hex 금지·선택 가능 텍스트. 단일 정의 — 지점별 개별 스타일 금지. |
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

## 공용 타입 (`types/categoryTypes.ts`)

| 타입/상수 | 설명 |
|---|---|
| `CategoryId` | `"n8n" \| "pa" \| "assistant" \| "ai-orchestration" \| "ml" \| "vibe" \| "etc"` (**7종**, 변경 금지) |
| `ID_PREFIX` / `makeItemId` | 항목 ID 접두어 매핑(`N8N`/`PA`/`AST`/`AIO`/`ML`/`VIBE`/`ETC`) + `{PREFIX}-{YYYY}-{NNN}` 생성기 (아래 [항목 ID 체계] 참조) |
| `ICON_PRESETS` | 아이콘 레지스트리 `Record<string, {label, path}>` (21종, `etc` 포함). AdminCategories 아이콘 선택 SSOT |
| `IconKey` | `keyof typeof ICON_PRESETS` (사실상 string — CATEGORY_ICON_PATH 호환) |
| `Category` | 카테고리 메타 (id, name, shortDesc, path, accessUrl, color, bg, icon) |
| `CATEGORIES` | **7개** 플랫폼 메타 배열. 출처 색상·경로 SSOT (변경 금지) |
| ~~`PlatformItemStatus` / `STATUS_ORDER` / `STATUS_COLOR` / `STATUS_QUERY_KEY` / `LEGACY_STATUS_MAP` / `normalizeStatus` / `countAvailable`~~ | **삭제 완료.** 운영 상태 폐기의 잔존 참조(LandingPage)를 끊은 뒤 타입·상수·헬퍼를 일괄 제거. `AssetItem.status` 필드도 삭제(전 목업에서 제거). |
| `agentAvailability` (AssetItem 필드) | **운영 상태 폐기의 유일한 예외** — AI Model(ai-orchestration) 전용 이용 가능 여부 `"사용 가능" \| "사용 불가"`. 상태 폐기와 별개 축. |
| `BUSINESS_DOMAINS` / `BusinessDomain` | 업무 도메인 축 `["영업","생산","연구","재무","HR","IT"]` |
| `ApprovalSlotKey` / `ApprovalSlot` / `ApprovalSlots` | 병렬 2슬롯 승인 (`company` / `global`) |
| `APPROVAL_SLOT_LABEL` | 슬롯 라벨 (관계사 관리자 승인 / 전사 관리자 승인) |
| `ApprovalStage` | `"승인 대기" \| "부분 승인" \| "게시됨" \| "반려" \| "중지"` |
| `deriveStage` | 슬롯 상태 + 종결 플래그 → stage 파생 |
| `LEGACY_APPROVAL_MAP` | 레거시 stage → 슬롯 초기값 매핑 (이행용) |
| `ApprovalRecord` | `{ slot?, action, at, by, note? }` — 승인/반려 이력 1건 |
| `DeletionRecord` | CompanyAdmin 삭제 이력 |
| `AssetReview` | `{ id, itemId, itemTitle, itemKind, author, dept, text, createdAt, likes }` |
| `EditorsPick` | 금주의 발견 `{ itemId, reason, pickedAt, pickedBy }` |
| `AssetItem` | AX 항목 공용 타입. `company?: string[]`, `ownerCompany?`(등록 주체 관계사 — 노출 범위와 별개 축, 관리자 배지·판정용), `createdAt?`("YYYY.MM.DD", ≤ `updatedAt`), `expectedTimeSaved?`, `domain?`, `usageMode?`, 카테고리별 전용 필드 포함 |
| `CATEGORY_ICON_PATH` | 플랫폼 아이콘 SVG path 매핑 (6키, ICON_PRESETS 기존 6종과 동일 path) |

### 항목 ID 체계 (`ID_PREFIX` / `makeItemId`)

```
형식: {PREFIX}-{YYYY}-{NNN}   예: N8N-2026-001, AIO-2026-012, ETC-2026-001
PREFIX: n8n=N8N / pa=PA / assistant=AST / ai-orchestration=AIO / ml=ML / vibe=VIBE / etc=ETC
```

- **카테고리별·연도별 독립 순번** — 순번(NNN)은 (유형, 연도) 조합마다 1부터 매김.
- **결번 재사용 금지** — 삭제·반려된 순번은 다시 쓰지 않는다.
- **승인 전후 ID 불변** — 신청 시 발급된 ID가 게시 후에도 그대로 유지된다.
- **서버 발급** — 실제 연동 시 PostgreSQL 카테고리·연도별 시퀀스로 INSERT 시점에 원자적 발급. 데모는 `makeItemId(categoryId, seq, year)`로 모사.

### 운영 상태(PlatformItemStatus) 폐기

- **운영 상태 4종(`사용 가능`/`준비 중`/`일부 제한`/`사용 중지`)은 제품에서 전면 폐기.** 등록·검토·관리·상세·통계 어디에도 상태 표시·편집·필터·집계 UI를 두지 않는다.
- **유일한 예외**: AI Model(ai-orchestration)의 `agentAvailability`(`사용 가능`/`사용 불가`) — 운영 상태와 별개 축.
- **승인 수명주기는 유지** — `승인 대기`/`부분 승인`/`게시됨`/`반려`/`중지`는 상태와 별개 개념으로 존치(위 [승인 흐름] 참조).
- **삭제 완료**: 잔존 참조였던 `LandingPage.tsx`가 신 랜딩으로 교체되며 상태 참조가 사라져, `PlatformItemStatus`·`STATUS_ORDER`·`STATUS_COLOR`·`STATUS_QUERY_KEY`·`LEGACY_STATUS_MAP`·`normalizeStatus`·`countAvailable` 및 `AssetItem.status` 필드를 **일괄 삭제**함(전 목업의 `status` 필드 제거 포함). 전수 grep 결과 코드 참조 0. `agentAvailability`(별개 축)·`workflowDef.status`(`Stable`/`Active`/`Error`, 워크플로우 시각화용)는 상태 폐기와 무관하므로 유지.

### 항목 URL·관계사 표시 정책

- **항목 실행/접속 URL 폐기** — 유일한 예외는 AI Model의 **모델 접속 URL**(`specificUrl`). 그 외 유형의 실행 URL·소스 저장소 입력은 제거됨.
- **회사/관계사 표시 폐기** — 항목의 사용 주체는 **담당자 소속 부서(dept) + 업무 도메인(domain)**으로 표현. `company`/`companyScope`는 승인 권한 가드(관계사 슬롯)·companyAdmin 조회 범위 판정용 **데이터로만 존치**(편집 UI 없음, 신규 항목은 전사 공용). 단, 이 폐기는 **항목(자산) 단위** 관계사 귀속 표시에 한정하며, 그룹 브랜딩 요소(랜딩 참여 관계사 로고 마퀴 등)는 적용 대상이 아니다(기획설명서 0.5).

### 예상 절감 시간 모델 (`expectedTimeSaved`)

```
입력: 수치 + 주기(일/주/월/년) → 직렬화: "<주기> N시간" 표준 문자열 (예: "주 3시간")
연간 환산: AdminStatistics.parseTimeSaved() — PERIOD_MULTIPLIER(일 365 / 주 52 / 월 12 / 년 1),
          분 단위는 60으로 나눔. 파싱 불가 값은 null(추정 불가 항목).
```

---

## 데이터 접근 계층 (`lib/dataSource.ts`)

> 목업 → 실서버 전환의 **유일한 교체 지점**. 동기 시그니처(DEMO) — 비동기 전환·로딩 상태 도입은 실제 연동 시로 유보.

- **철칙: 페이지·훅은 `mocks/*`를 직접 import하지 않는다.** 조회 진입점은 오직 `lib/dataSource`를 경유한다. (예외: `components/AdminScopeSelect`가 통계 기준 상수 `STAT_COMPANIES`/`COMPANY_NAME`를 mocks에서 직접 참조 — 컴포넌트 레이어는 규칙 범위 밖. 개인화 훅 3종 중 `useNotifications`만 목업 참조를 갖고, 이를 dataSource로 배선함.)
- 백엔드 연동 시 `mocks` 배열을 삭제하고 각 함수 본문만 실제 API 호출로 교체한다. 집계 헬퍼는 mocks에 단일 정의를 두고 dataSource가 위임/재-export(로직 복제 금지).

### 함수 카탈로그

| 도메인 | 함수 | 반환/역할 |
|--------|------|-----------|
| 자산(M1) | `getAssetItems` · `getAssetItem(id)` · `getReviewsByItem(id)` · `getPostsByItem(id)` · `getFallbackN8nWorkflowJson` | 자산 목록·단건·후기·게시글·n8n 폴백 JSON |
| 검토/신청 | `getReviewQueue` · `getMyApplications` · `getMyReviews` | 검토 대기 큐 · 내 신청 · 내 후기 |
| 대시보드 | `getDashboardData(scope)` | 범위 합성: `{companies, sourceTotal, monthly, domain, pending, recentApproved, activeTools, reviewTotal, partialCount}` |
| 통계 | `getStatsByScope(scope)` | 범위 합성: `{companies, monthSeries, sourceTotal, domain, difficultyCounts, costCounts, mlTypeCounts, dept, keyword, timeSamples, topReviews}` (META 병합·시간 파싱은 화면 프레젠테이션) |
| 관리 | `getManagedAssetItems` · `getAdmins` · `getGroupViewers` · `getRegistrants` · `getAuditLogs` · `getSsoUsers` · `getSelectableCompanies` | 게시 항목·전사 관리자·그룹 뷰어·등록자·활동 로그·SSO 검색·관계사 선택지 |
| 관계사 관리자 | `getCompanyAdmins` · `getManagedCompanies(email)` | 관계사 관리자 목록 · 이메일→담당 관계사(auth/me 모사) |
| 조직 | `getOrgCompanies` · `getOrgDepts` · `getAssetItemRefs` · `getTeamsSyncSource` | 관계사·부서·자산 관계사 투영·Teams 동기화 원천 |
| 분류체계 | `getCategoryTaxonomy` · `getFreeTags` | 분류체계 · 자유 태그 |
| 소식/알림 | `getNotices(kind)` · `getAdminNotices` · `sortNotices`(재-export) · `getNotifications` | 공개 소식 · 관리자 전체 소식 · 정렬 헬퍼 · 알림(벨·훅·패널) |
| 통계 위임 | `monthTotal` · `COMPANY_NAME`(값 재-export) / `SourceKey` · `StatCompany` · `MonthPoint` · `CompanyAdminUser`(타입 재-export) | mocks 단일 정의 위임 — 화면 프레젠테이션 계산용 |

- 타입 흐름: 각 mocks 모듈은 소비처(페이지)의 도메인 타입을 `import type`로만 참조하고(런타임 간선 없음), dataSource는 mocks 배열을 값으로 반환한다. 런타임 그래프는 `page → dataSource → mocks`로 수렴(역방향은 타입 전용, 소거됨).

---

## 공용 Mock 모듈

### `mocks/statsMockData.ts`

> AdminStatistics / AdminDashboard 공유 더미. **DEMO 전용 — 백엔드 연동 시 폐기.**
> **[M2]** 과거 AdminStatistics 화면에 있던 화면 고유 통계(부서·난이도·비용·ML유형·키워드·절감시간·후기 TOP5)와 그 범위 집계 헬퍼(`aggregateIndexed`·`aggregateDept`·`aggregateKeyword`·`aggregateTimeSaved`, `DEPT_BY_COMPANY`·`DIFFICULTY_BY_COMPANY`·`COST_BY_COMPANY`·`ML_TYPE_BY_COMPANY`·`KEYWORD_BY_COMPANY`·`TIME_SAVED_BY_COMPANY`·`TOP5_REVIEWS_ALL`·`TopReview`)를 이 통계 SSOT에 합류시켰다. 소비 화면은 `dataSource.getStatsByScope(scope)`가 합성해 공급한다. (구 "화면 고유 데이터는 각 화면 파일에 둔다" 방침은 M2에서 폐기.)

| 항목 | 설명 |
|---|---|
| `SourceKey` | `CategoryId` — **7종**(etc 포함). 운영 상태 필드 없음 |
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

### `mocks/noticeMockData.ts`

> 공지사항·업데이트 소식 **단일 소스(SSOT)**. **DEMO 전용.** LandingPage 최신소식 · NoticesPage(`/notices`) · AdminNotices(`/admin/notices`) 3곳이 참조. (옛 LandingPage 정적 `LATEST_NEWS` 대체 — 중복 정의 금지.)

| 항목 | 설명 |
|---|---|
| `Notice` / `NoticeKind` / `NOTICE_KINDS` | `types/noticeTypes.ts`. `Notice = { id, kind, title, body, date, pinned, visible }` |
| `NOTICE_MOCK_DATA` | 초기 소식 배열. AdminNotices가 로컬 state 초기값으로 로드 |
| `sortNotices(list)` | **pinned 우선 + 게시일(`YYYY.MM.DD`) 최신순** 정렬 |
| `visibleNoticesByKind(kind)` | `visible=true` + 해당 종류만 정렬 반환 (랜딩·NoticesPage 공용) |

타입 import 주의: `Notice`, `NoticeKind`는 `import type` 분리 필수.

### `mocks/notificationMockData.ts`

> 알림 **단일 소스(SSOT)**. **DEMO 전용.** NotificationBell(벨) · LandingPage 개인화 패널 "알림 현황" 2곳이 참조. (아래 [개인화 — 스크랩·관심사·알림] 참조.)

| 항목 | 설명 |
|---|---|
| `AxNotification` / `NotificationKind` | `types/notificationTypes.ts`. `AxNotification = { id, kind, title, body?, date, read, itemId? }` |
| `NOTIFICATION_KIND_STYLE` | kind → `{ label, bg, fg }` 배지 스타일 (벨·패널 공용) |
| `NOTIFICATION_MOCK_DATA` | 초기 알림 배열. 병렬 슬롯 예시 포함("한국콜마 관리자 승인 완료 — 전사 승인 대기 중") |
| `notificationsByDate()` | 게시일 최신순 정렬 반환 |

타입 import 주의: `AxNotification`, `NotificationKind`는 `import type` 분리 필수.

### M2 이관 모듈 (페이지 내장 목업 → mocks SSOT)

> 아래 모듈은 각 화면에 인라인돼 있던 목업을 **내용 무변경·식별자명 유지**로 이관한 것. 페이지는 `lib/dataSource` 경유로만 참조한다. 각 모듈 헤더에 SSOT 선언·DEMO 폐기 예고·교체 엔드포인트 TODO를 둔다.

| 모듈 | 주요 export | 소비 화면 (dataSource 함수) |
|---|---|---|
| `mocks/adminReviewMockData.ts` | `INITIAL_ITEMS`(6) | AdminReview (`getReviewQueue`) |
| `mocks/myStatusMockData.ts` | `INITIAL_ITEMS`(6)·`MOCK_MY_REVIEWS`(2) | MyStatusPage (`getMyApplications`·`getMyReviews`) |
| `mocks/adminDashboardMockData.ts` | `PENDING_ALL`(5)·`RECENT_APPROVED_ALL`(4)·`ACTIVE_TOOLS_BY_COMPANY`·`REVIEW_COUNT_BY_COMPANY`·`slots`·`PendingItem`·`ApprovedItem` | AdminDashboard (`getDashboardData`) |
| `mocks/adminUsersMockData.ts` | `INITIAL_ADMINS`(2)·`INITIAL_GROUP_VIEWERS`(2)·`REGISTRANTS`(4)·`LOGS`(7)·`SELECTABLE_COMPANIES`(12)·`MOCK_SSO_USERS`(4) | AdminUsers (`getAdmins`·`getGroupViewers`·`getRegistrants`·`getAuditLogs`·`getSelectableCompanies`·`getSsoUsers`) |
| `mocks/adminOrgMockData.ts` | `INITIAL_COMPANIES`(29)·`INITIAL_DEPTS`(15)·`ASSET_ITEM_REFS`(12)·`TEAMS_SYNC_SOURCE`(3)·`orgCompanyName`(코드→표시명, SSOT 파생) | AdminOrg (`getOrgCompanies`·`getOrgDepts`·`getAssetItemRefs`·`getTeamsSyncSource`) · 관리자 배지·Navbar 소속(`orgCompanyName` 재-export) |
| `mocks/adminTaxonomyMockData.ts` | `INITIAL_CATEGORY_TAXONOMY`·`INITIAL_FREE_TAGS`(7) | AdminTaxonomy (`getCategoryTaxonomy`·`getFreeTags`) |

- **⚠️ 감사 로그 소급 수정 금지**: `adminUsersMockData.LOGS`는 과거 표기(`AGENT-2025-007`·`HKGPT-2025-018`·`N8N-2025-031` 등)를 **바이트 동일**하게 보존한다.
- **표시 전용 메타는 페이지 잔류**(이관 대상 아님): 옵션 열거(`DIFFICULTY_LEVELS`·`COST_TIERS`·`ML_TYPES`·`ASSISTANT_MODEL_HINTS`·`CONTEXT_SIZE_OPTIONS`·`AGENT_AVAILABILITY`·`TIME_PERIODS` 등)·스타일 객체(`*_STYLE`·`*_META`·`*_COLOR`·`DOMAIN_CHIP`·`CAT_MEDIA`·`PROMO_COPY`)·`CATEGORIES` 파생 배열(`SOURCES`·`INITIAL_CATEGORIES`)·정적 안내 콘텐츠(GuidePage의 FAQ·스텝·팩트·Problem→Solution 배열). `EditRequestPage.MOCK_CURRENT`는 단건 폼 프리필 픽스처(배열 아님, 타입이 페이지 폼 모델에 결합)로 페이지 잔류.

---

## 개인화 — 스크랩·관심사·알림

개인 상태(스크랩·관심사·알림 읽음)는 **localStorage 3종**을 단일 소스로 두고, 공용 훅이 `useSyncExternalStore`로
같은 탭 내 모든 소비자(상세 헤더·목록/랜딩 카드·개인화 패널·벨)를 즉시 동기화한다. 목업 데이터(알림)와
localStorage 상태를 병합해 파생값을 만든다. **DEMO 전용** — 백엔드 연동 지점은 각 훅·발송부 TODO 주석에 명시.

### localStorage 키 (개인화 3종 + 기존 1종)

| 키 | 형태 | 소유 훅 | 용도 |
|----|------|---------|------|
| `ax_scraps` | `string[]` (itemId) | `hooks/useScraps` | 스크랩(북마크) 항목 목록 |
| `ax_user_interests` | `{ categories: CategoryId[]; domains: BusinessDomain[] }` | `hooks/useInterests` | 관심 카테고리·업무 도메인 |
| `ax_notifications_read` | `string[]` (알림 id) | `hooks/useNotifications` | 읽음 처리한 알림 id 집합 |
| `ax_recent_viewed` | `string[]` (itemId, 최대 10) | (AssetItemDetailPage) | 최근 조회 |

### 공용 훅 (`hooks/`)

- **`useScraps()`** → `{ scraps, count, isScrapped(id), toggle(id) }`. 모듈 레벨 `toggleScrap`·`isScrapped`도 export(컴포넌트 밖 호출용). `window "storage"` 이벤트로 타 탭 반영.
- **`useInterests()`** → `{ interests, hasInterests, save(next) }`. `save`는 localStorage 기록 + 구독자 통지 → 패널 추천 즉시 갱신.
- **`useNotifications()`** → `{ notifications, unreadCount, markRead(id), markAllRead() }`. 알림 = 목업(`notificationsByDate`) + `read`(목업 시드 `||` 읽음 집합) 병합 파생.

### 항목 경로 파생 (`types/categoryTypes.ts`)

- **`PREFIX_TO_CATEGORY`** / **`categoryIdFromItemId(itemId)`** / **`detailPathForItemId(itemId)`** — itemId 접두어만으로 상세 경로(`{category.path}/{itemId}`)를 파생. 알림·벨이 목업 배열 import 없이 항목 이동 가능.

### PART A — 스크랩(북마크)

- **토글 지점 3곳**: 상세 헤더(`AssetItemDetailPage`, 좋아요 옆 "스크랩" 버튼) · 목록 카드(`ProjectListPage`, 조회수·좋아요 옆 북마크 아이콘, 카드 클릭과 분리 위해 `stopPropagation`) · 랜딩 카드(`LandingPage` `ItemCard` 우상단 북마크).
- **개인화 패널 실연동**: "내가 스크랩한 항목 N개" 행이 `useScraps().count`를 표시, 클릭 시 **`/projects?scrap=1`**(전용 목록 대신 목록 재사용 — 단순한 쪽 선택, 코드 주석 명시). ProjectListPage는 `scrapOnly` 상태(초기값만 URL `?scrap=1`에서 읽음, 이후 로컬 유지)로 필터하고 2행 필터바에 "스크랩 N" 토글 칩 + 스크랩 0건 빈 상태 안내를 둔다.
- **TODO(백엔드)**: `scraps` 테이블(`user_id`·`item_id`), 멱등 **PUT/DELETE `/api/v1/scraps/:itemId`**.

### PART B — 설정(관심사) `SettingsPage.tsx` (`/settings`, ProtectedRoute)

- **① 관심 카테고리**(`CATEGORIES` 7종 칩 다중 선택) + **② 관심 업무 도메인**(`BUSINESS_DOMAINS` 6종 칩 다중 선택). 폼 로컬 상태 → **저장 버튼**으로 `useInterests().save` 호출 → **저장 완료 인라인 피드백**.
- **안내 문구**: "추후 개인 정보 항목이 추가될 수 있습니다. (프로필·알림 수신 설정 등)" + 파일 상단 **확장 지점 TODO**(프로필·알림 수신 설정·표시 환경).
- **진입 경로**: 개인화 패널 퀵메뉴 "설정"(부활) + **Navbar 아바타 드롭다운 "설정"** 항목.
- **추천 실연동**(패널): "나에게 추천하는 항목"을 **관심사 매칭**(관심 카테고리 **또는** 도메인 일치 항목을 `views`→`likes` 순 상위 `RECOMMEND_N=12`, `LandingPage.recommendItems`)으로 전환. **관심사 미설정 시** 기존 placeholder 대신 "관심사를 설정하면 맞춤 추천을 받아요" 문구 + `/settings` 유도.
- **TODO(백엔드)**: **PUT `/api/v1/me/interests`** 저장 + 추천 API(`GET /api/v1/me/recommendations`).

### PART C — 알림

- **kind 7종**(`NotificationKind`): `신청접수` / `관계사승인`(관계사 슬롯 1/2) / `전사승인`(전사 슬롯 1/2 또는 두 슬롯 완료 2/2 게시 — title/body 문구로 구분) / `반려`(사유 `body` 포함) / `후기등록` / `게시판글` / `수정요청처리`. **공지 알림 없음(확정)** — 알림은 "내 활동" 개인 통지만.
- **`NotificationBell`**(공용): 미읽음 뱃지 + 드롭다운(최근 5건 · 전체 읽음 · 항목 이동). **`Navbar` + `AdminNavbar` 양쪽** 배치(Navbar는 로그인·비공유 모드에서만). 읽음 상태 `ax_notifications_read`.
- **개인화 패널 "알림 현황" 블록**: 스크랩·추천 아래, 최근 3건·미읽음 강조, **벨과 동일 소스**(`useNotifications`).
- **발송 지점 TODO 주석만**(로직 변경 없음): `AdminReview.approveSlot`(kind `관계사승인`/`전사승인`, 게시 시 2/2 문구) · `AdminReview.handleReject`(kind `반려`) · `EditRequestPage.handleSubmit`(kind `수정요청처리`).
- **TODO(백엔드)**: **GET/PATCH `/api/v1/notifications`**(목록·읽음 처리).

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
| `GET` | `/api/v1/platforms/:platformId/items/:itemId` | AssetItemDetailPage |
| `POST` | `/api/v1/platform-items/:id/reviews` | AssetItemDetailPage (후기 등록) |
| `GET` | `/api/v1/my/platform-items` / `/api/v1/my/reviews` | MyStatusPage |
| `GET` | `/api/v1/admin/review-queue` | AdminReview |
| `PATCH` | `/api/v1/admin/platform-items/:id/approve-slot` | AdminReview (슬롯별 승인) |
| `PATCH` | `/api/v1/admin/platform-items/:id/reject` | AdminReview |
| `GET` / `PUT` | `/api/v1/admin/platform-items(/:id)` | AdminProjectManage |
| `GET` | `/api/v1/admin/companies` | AdminOrg / AdminScopeSelect |
| `GET` / `PUT` | `/api/v1/admin/company-admins` | AdminUsers (관리자 지정) |
| `GET` | `/api/v1/admin/users` | AdminUsers |
| `GET` | `/api/v1/admin/stats/*` | AdminStatistics, AdminDashboard |
| `GET` / `POST` / `PUT` | `/api/v1/admin/platforms(/:id)` | AdminCategories |
| `GET` | `/api/v1/notices` | LandingPage(최신소식), NoticesPage (공개, visible만) |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/admin/notices(/:id)` | AdminNotices (관리, 비노출 포함) |
| `GET` | `/api/v1/admin/settings` | AdminOrg (문의 채널 등) |
| `PUT` / `DELETE` | `/api/v1/scraps/:itemId` | 스크랩 토글 (멱등) — 상세 헤더·목록/랜딩 카드·패널 |
| `PUT` | `/api/v1/me/interests` | SettingsPage (관심 카테고리·도메인 저장) |
| `GET` | `/api/v1/me/recommendations` | 개인화 패널 추천 (관심사 매칭) |
| `GET` / `PATCH` | `/api/v1/notifications` | NotificationBell·패널 알림 현황 (목록·읽음 처리) |
| `GET` | `/api/v1/auth/me` | AuthContext (role·managedCompanies) |
| `POST` | `/api/v1/auth/logout` | AuthContext |

> **개편 반영 사항**
> - **`PATCH /platform-items/:id/status` 삭제** — 운영 상태 폐기로 상태 변경 엔드포인트 없음.
> - **승인(`approve-slot`)·수정 요청(`edit-requests`) body에서 `company`·`companyScope` 제거** — 전 항목 전사 공용, 관계사 지정 흐름 폐기. 두 필드는 승인 권한 가드 데이터로만 잔존.
> - **등록·수정 body에 `images: string[]`(최대 10장, 데모는 data URL) 추가.** AI Model만 `agentAvailability`·모델 접속 `specificUrl` 유지.

---

## 플랫폼 포지셔닝

Kolmar AX Platform은 그룹 전체 AX(AI 전환) 확산 활동의 산출물을 모으는 저장소입니다.

- **7대 AX 플랫폼 유형**: n8n(업무 자동화), Power Automate(플로우 자동화·RPA), 나만의 비서(HK GPT 커스텀), AI Model(AI 오케스트레이션·HK GPT 게이트웨이), ML 모델, Vibe Coding, AI 프로젝트(팀에서 구축한 AI 시스템·서비스 사례를 블로그 형식으로 소개)
- **`etc` 표시 라벨 = "AI 프로젝트"**: 내부 식별자(`CategoryId` 값 `"etc"`, ID 접두어 `ETC`, 라우트 `/etc`)는 **불변**. 사용자 노출 라벨만 "기타" → "AI 프로젝트"로 변경(`CATEGORIES`의 name이 단일 소스이며 파생 라벨은 자동 반영).
- **`ai-orchestration` 표시 라벨 = "AI Model"**: 내부 식별자(`CategoryId` 값 `"ai-orchestration"`, ID 접두어 `AIO`, 라우트 `/ai-orchestration`, `agentAvailability` 필드명)는 **불변**. 사용자 노출 라벨만 "AI Agent" → "AI Model"로 변경(`CATEGORIES`의 name이 단일 소스이며 파생 라벨은 자동 반영). 외부 실행 환경 실명 "HK GPT"는 유지.
- **표시 용어·코드 심볼 모두 카테고리/자산(Asset) 체계로 통일**: 7개 자산 유형을 가리키는 **사용자 노출 문구는 "카테고리"**(예: "카테고리별 등록 현황"). **코드 내부 식별자도 category/asset 계열로 rename 완료**(`AssetItem`·`categoryId`·`companyScope`·`CATEGORIES`·`CategoryId`·`AssetReview`·`AssetItemDetailPage`·`AdminCategories`·`CATEGORY_ICON_PATH`·`categoryTypes.ts` 등, 동작 변경 없는 순수 rename). **단, 다음은 현행 유지**: 라우트 `/admin/platforms`, TODO API 경로(`/api/v1/platforms/...`·`/api/v1/platform-items`), URL 쿼리 키 `?platform=`, ID 접두어(`ID_PREFIX`)·카테고리 값 문자열(`"n8n"`…`"etc"`), 제품명 "AX Platform / AX 플랫폼"과 외부 실행 환경(n8n 서버·HK GPT) 지칭. (`PlatformItemStatus` 계열은 rename이 아니라 **삭제 완료** — 위 [운영 상태 폐기] 참조.) 로컬 헬퍼 심볼도 asset/category 체계로 rename 완료(`CategoryIcon`·`AssetItemRef`·`categoryPathOf`·`ManagedAssetItem`·`ReviewAssetItem` 등).
- **AI Model 표기 규칙**: 항목 **제목은 모델명 단독**(예: `Claude Opus 4.8`) — 제공사 괄호 병기 없음. 제공사는 상세 설명/세부 모델명 등 자유 텍스트에 기재.
- **빌더-카탈로그 계층 분리**: 도구를 만드는 빌더 활동과 발견·재사용하는 카탈로그 계층을 구분.
- **정량적 성과 가시화**: 예상 절감 시간 등 정량 지표를 표면화하여 도구의 실효 가치를 드러냄.
