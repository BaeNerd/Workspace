import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { PLATFORMS } from "../../types/platformTypes";
import type { PlatformId } from "../../types/platformTypes";
// 권한 판정 헬퍼 사용. canManageItem / isGlobalAdmin / managedCompanies 재사용.
import { useAuth } from "../../context/useAuth";

const STATUSES = ["개발 중", "운영 중", "파일럿", "종료", "보류"];
const SYSTEM_TYPES = ["웹 애플리케이션", "API/서비스", "ML/AI 모델", "데이터 파이프라인", "내부 도구", "기타"];
const DOMAINS = ["재무/회계", "고객 서비스", "제조/생산", "HR/인사", "IT 인프라", "영업/CRM", "마케팅", "데이터/분석", "기타"];
const AUDIENCES = ["전사", "특정 부서", "특정 관계사", "관리자만", "내부 직원 전체"];
const STACK_OPTIONS = ["Python", "TypeScript", "React", "FastAPI", "Node.js", "PostgreSQL", "AWS", "Docker", "Kubernetes", "NestJS", "TensorFlow"];
const DIFFICULTY_LEVELS = ["쉬움", "보통", "어려움"];
const COST_TIERS = ["낮음", "보통", "높음"];

const NODE_SUGGESTIONS = [
  "Manual Trigger", "Schedule Trigger", "Form Trigger", "Chat Trigger", "Webhook",
  "Set (Edit Fields)", "Code", "IF", "Switch", "Filter", "Merge", "Aggregate", "Sort",
  "AI Agent", "Basic LLM Chain",
];
const APP_SUGGESTIONS = [
  "Microsoft Outlook", "Microsoft Teams", "Microsoft One Drive", "Google Sheets",
  "HTTP Request", "Spreadsheet File", "Respond To Webhook",
];

// 예상 절감 시간 — 수치 + 주기 조합으로 입력받아 표준 문자열로 직렬화한다.
// 주기별 연간 환산 계수는 AdminStatistics의 parseTimeSaved / PERIOD_MULTIPLIER와 동일하게 유지.
// ProjectRegisterPage와 동일한 규격을 사용해 전 구간 정합을 맞춘다.
type SavedPeriod = "일" | "주" | "월" | "년";
const SAVED_PERIODS: SavedPeriod[] = ["일", "주", "월", "년"];
const PERIOD_ANNUAL_FACTOR: Record<SavedPeriod, number> = { "일": 365, "주": 52, "월": 12, "년": 1 };
const PERIOD_FULL_LABEL: Record<SavedPeriod, string> = { "일": "매일", "주": "주당", "월": "월당", "년": "연간" };

// 저장용 직렬화 — parseTimeSaved(AdminStatistics)가 파싱 가능한 "<주기> N시간" 형식
const serializeTimeSaved = (value: number | "", period: SavedPeriod): string =>
  value === "" || value <= 0 ? "" : `${period} ${value}시간`;

// 기존 문자열 → 수치·주기 역직렬화. 파싱 불가 시 value는 ""로 두어 관리자가 새로 입력하게 한다.
// 지원 패턴: "주 3시간", "월 4시간", "하루 30분", "연 40시간" 등
const deserializeTimeSaved = (raw: string | undefined | null): { value: number | ""; period: SavedPeriod } => {
  if (!raw) return { value: "", period: "주" };
  const text = raw.trim();
  if (!text) return { value: "", period: "주" };

  // 주기 토큰 매핑 (하루→일, 개월→월, 연→년, 주일→주)
  const periodMatch = text.match(/(일|하루|주일|주|개월|월|년|연)/);
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*시간/);
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*분/);

  let period: SavedPeriod = "주";
  if (periodMatch) {
    const token = periodMatch[1];
    if (token === "일" || token === "하루") period = "일";
    else if (token === "주" || token === "주일") period = "주";
    else if (token === "월" || token === "개월") period = "월";
    else if (token === "년" || token === "연") period = "년";
  }

  if (hourMatch) {
    const n = parseFloat(hourMatch[1]);
    if (!Number.isNaN(n)) return { value: n, period };
  }
  if (minMatch) {
    const n = parseFloat(minMatch[1]);
    if (!Number.isNaN(n)) return { value: Math.round((n / 60) * 100) / 100, period };
  }
  // 파싱 불가 (예: "측정 어려움", "미정")
  return { value: "", period };
};

// 연간 환산 시간 계산
const annualHours = (value: number | "", period: SavedPeriod): number =>
  value === "" || value <= 0 ? 0 : Number(value) * PERIOD_ANNUAL_FACTOR[period];

const COMPANIES = [
  { code: "KMH", name: "콜마홀딩스" }, { code: "KKM", name: "한국콜마" },
  { code: "KBH", name: "콜마비앤에이치" }, { code: "HC", name: "콜마생활건강" },
  { code: "KMG", name: "콜마글로벌" }, { code: "KMSK", name: "콜마스크" },
  { code: "KMW", name: "무석콜마" }, { code: "KMB", name: "북경콜마" },
  { code: "KUS", name: "미국콜마" }, { code: "KBT", name: "콜마바이오텍" },
];
const NO_PARENT = "본부 없음 (관계사 직속)";
const PARENTS_BY_COMPANY: Record<string, string[]> = {
  KKM: ["경영지원본부", "영업마케팅본부", "연구개발본부", "생산본부", "IT본부"],
  KMG: ["영업마케팅본부", "생산본부"],
};
const DEPTS_BY_PARENT: Record<string, string[]> = {
  "경영지원본부": ["재무팀", "인사팀", "법무팀", "구매팀"],
  "영업마케팅본부": ["영업팀", "마케팅팀", "고객서비스팀"],
  "연구개발본부": ["메이크업연구소", "디자인팀"],
  "생산본부": ["제조기술팀", "품질관리팀"],
  "IT본부": ["IT인프라팀", "IT개발팀"],
};

// PlatformItem.company 선택용 29개 전체 관계사 (AdminOrg.tsx, ProjectRegisterPage.tsx와 동일 소스)
// TODO: 실제 연동 시 GET /api/v1/admin/companies?visible=true 응답으로 교체
const FULL_COMPANIES = [
  { code: "KMH", name: "콜마홀딩스", visible: true },
  { code: "KKM", name: "한국콜마", visible: true },
  { code: "KBH", name: "콜마비앤에이치", visible: true },
  { code: "HKN", name: "에이치케이이노엔", visible: true },
  { code: "YWK", name: "연우", visible: true },
  { code: "KAF", name: "근오농림", visible: false },
  { code: "NAB", name: "넥스트앤바이오", visible: false },
  { code: "HC", name: "콜마생활건강", visible: true },
  { code: "HNG", name: "에치엔지", visible: false },
  { code: "MOD", name: "엠오디머티리얼즈", visible: false },
  { code: "KMG", name: "콜마글로벌", visible: true },
  { code: "KMSK", name: "콜마스크", visible: true },
  { code: "KUX", name: "콜마유엑스", visible: false },
  { code: "KMW", name: "무석콜마", visible: true },
  { code: "KMB", name: "북경콜마", visible: true },
  { code: "KBJ", name: "강소콜마", visible: false },
  { code: "KAY", name: "연태콜마", visible: false },
  { code: "HKV", name: "한국헬스케어베너", visible: false },
  { code: "PLT", name: "플래닛147", visible: false },
  { code: "LSL", name: "레스리", visible: false },
  { code: "LOD", name: "라우드랩스", visible: false },
  { code: "KMP", name: "콜마헬스케어필리핀", visible: false },
  { code: "KMS", name: "에이치케이콜마싱가포르", visible: false },
  { code: "KML", name: "콜마랩스", visible: false },
  { code: "KUS", name: "미국콜마", visible: true },
  { code: "KCA", name: "캐나다콜마", visible: false },
  { code: "HKJ", name: "에이치케이글로벌퍼팩", visible: false },
  { code: "KMM", name: "에이치케이콜마말레이시아", visible: false },
  { code: "KBT", name: "콜마바이오텍", visible: true },
];
const SELECTABLE_COMPANIES = FULL_COMPANIES.filter(c => c.visible);

const platformCompanyDisplay = (codes: string[]): string => {
  if (codes.length === 0) return "전사 공용";
  const names = codes.map(c => FULL_COMPANIES.find(co => co.code === c)?.name ?? c);
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} 외 ${names.length - 2}곳`;
};

type OrgEntry = { id: number; company: string; parent: string | null; dept: string | null };
let orgEntryIdSeq = 1000;
const orgEntryDisplay = (e: OrgEntry) => {
  const companyName = COMPANIES.find(c => c.code === e.company)?.name ?? e.company;
  if (!e.parent) return companyName;
  if (!e.dept) return `${companyName} > ${e.parent}`;
  return `${companyName} > ${e.parent} > ${e.dept}`;
};

type Contact = { name: string; dept: string; role: string; email: string };
type LinkItem = { label: string; url: string };
type Approval = "대기" | "승인" | "반려";

// ===== 통합 유니온 타입 =====
type ReviewProjectItem = {
  kind: "project";
  id: string; title: string; summary: string; description: string;
  dept: string; submittedBy: string; submittedAt: string;
  status: string; domain: string[]; domainOther: string; type: string; typeOther: string;
  stack: string[]; audience: string[]; orgEntries: OrgEntry[];
  integrations: string; freeTags: string;
  contacts: Contact[]; links: LinkItem[]; approval: Approval; rejectionReason?: string;
};

type ReviewPlatformItem = {
  kind: PlatformId; // "n8n" | "assistant" | "ai-orchestration"
  id: string; title: string; summary: string; description: string;
  dept: string; submittedBy: string; submittedAt: string;
  status: string;
  // 워크플로우/에이전트형 (n8n, assistant)
  triggerAction?: string; nodes?: string[]; connectedApps?: string[];
  expectedTimeSaved?: string; difficulty?: string; specificUrl?: string; itemTags?: string;
  // 모델형 (ai-orchestration)
  provider?: string; contextWindow?: string; strengths?: string; costTier?: string;
  // 소속/대상 관계사 (복수선택, 빈배열=전사공용) + 선택 여부 추적
  company: string[];
  platformScope: "unset" | "company-wide" | "specific";
  contacts: Contact[]; links: LinkItem[]; approval: Approval; rejectionReason?: string;
};

type ReviewItem = ReviewProjectItem | ReviewPlatformItem;
const isProjectKind = (i: ReviewItem): i is ReviewProjectItem => i.kind === "project";

// 권한 판정용: 항목이 속한 관계사 코드 집합과 전사공용 여부를 도출.
//   프로젝트는 orgEntries의 company, 플랫폼은 company 필드. canManageItem(useAuth)이 이 값을 소비.
const itemCompaniesOf = (item: ReviewItem): string[] =>
  isProjectKind(item) ? item.orgEntries.map(e => e.company) : item.company;
const itemIsCompanyWideOf = (item: ReviewItem): boolean =>
  isProjectKind(item) ? false : item.platformScope === "company-wide";

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  project: { color: "#475569", bg: "#F1F5F9", label: "프로젝트" },
  ...Object.fromEntries(PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])),
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", fontSize: 13, color: "#0F172A",
  background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, outline: "none", fontFamily: "inherit",
};
const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32, cursor: "pointer" };

// ===== 재사용 서브컴포넌트 (모듈 레벨) =====
const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const SectionBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 20px", marginBottom: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #F1F5F9" }}>{title}</div>
    {children}
  </div>
);

const TagSelect = ({ options, selected, onChange, disabled }: { options: string[]; selected: string[]; onChange: (v: string) => void; disabled?: boolean }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    {options.map(opt => {
      const isSel = selected.includes(opt);
      return (
        <span key={opt} onClick={() => !disabled && onChange(opt)} style={{
          fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
          border: `1.5px solid ${isSel ? "#2563EB" : "#E2E8F0"}`,
          background: isSel ? "#EFF6FF" : "#fff",
          color: isSel ? "#2563EB" : "#475569",
          cursor: disabled ? "not-allowed" : "pointer", userSelect: "none",
          opacity: disabled ? 0.6 : 1,
        }}>{opt}</span>
      );
    })}
  </div>
);

const SingleSelectTag = ({ options, value, onChange, disabled }: { options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    {options.map(opt => {
      const isSel = value === opt;
      return (
        <span key={opt} onClick={() => !disabled && onChange(opt)} style={{
          fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
          border: `1.5px solid ${isSel ? "#2563EB" : "#E2E8F0"}`,
          background: isSel ? "#EFF6FF" : "#fff",
          color: isSel ? "#2563EB" : "#475569",
          cursor: disabled ? "not-allowed" : "pointer", userSelect: "none",
          opacity: disabled ? 0.6 : 1,
        }}>{opt}</span>
      );
    })}
  </div>
);

// 예상 절감 시간 입력 (모듈 레벨) — 수치 + 주기 선택 + 연간 환산 안내.
// ProjectRegisterPage의 TimeSavedInput과 동일 규격. disabled 시 값만 표시.
const TimeSavedInput = ({
  value, period, onValueChange, onPeriodChange, disabled,
}: {
  value: number | ""; period: SavedPeriod;
  onValueChange: (v: number | "") => void; onPeriodChange: (p: SavedPeriod) => void;
  disabled?: boolean;
}) => {
  const annual = annualHours(value, period);
  const hasValue = value !== "" && Number(value) > 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {SAVED_PERIODS.map(p => (
            <span
              key={p}
              onClick={() => !disabled && onPeriodChange(p)}
              style={{
                fontSize: 12, fontWeight: 600, padding: "7px 13px", borderRadius: 7,
                border: `1.5px solid ${period === p ? "#2563EB" : "#E2E8F0"}`,
                background: period === p ? "#EFF6FF" : "#fff",
                color: period === p ? "#2563EB" : "#475569",
                cursor: disabled ? "not-allowed" : "pointer", userSelect: "none",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {p}
            </span>
          ))}
        </div>
        <input
          type="number"
          min={0}
          step={0.5}
          inputMode="decimal"
          value={value}
          disabled={disabled}
          onChange={e => {
            const raw = e.target.value;
            if (raw === "") { onValueChange(""); return; }
            const n = Number(raw);
            if (Number.isNaN(n) || n < 0) return;
            onValueChange(n);
          }}
          placeholder="예: 3"
          style={{ ...inputStyle, maxWidth: 110, opacity: disabled ? 0.6 : 1 }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>시간</span>
      </div>

      {hasValue && (
        <div style={{
          marginTop: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8,
          padding: "9px 13px", fontSize: 12, color: "#065F46", lineHeight: 1.6,
        }}>
          <strong style={{ fontWeight: 700 }}>{PERIOD_FULL_LABEL[period]} {value}시간</strong> 절감
          {" → "}
          연간 약 <strong style={{ fontWeight: 700 }}>{annual.toLocaleString()}시간</strong>
          <span style={{ color: "#059669", marginLeft: 4 }}>
            ({value}시간 × {PERIOD_ANNUAL_FACTOR[period].toLocaleString()}{period === "년" ? "" : period})
          </span>
        </div>
      )}
    </div>
  );
};

const ChipEditor = ({ items, onAdd, onRemove, suggestions, placeholder, disabled }: {
  items: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void;
  suggestions: string[]; placeholder: string; disabled?: boolean;
}) => {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: items.length > 0 ? 8 : 0 }}>
        {items.map(item => (
          <span key={item} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1E40AF",
            padding: "4px 6px 4px 10px", borderRadius: 6, border: "1px solid #BFDBFE",
          }}>
            {item}
            {!disabled && (
              <button onClick={() => onRemove(item)} style={{ background: "none", border: "none", color: "#1E40AF", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
            placeholder={placeholder}
            style={{ ...inputStyle, fontSize: 12, padding: "7px 10px" }}
          />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
            {suggestions.filter(s => !items.includes(s)).slice(0, 8).map(s => (
              <span key={s} onClick={() => onAdd(s)} style={{
                fontSize: 11, color: "#64748B", background: "#F1F5F9",
                padding: "3px 9px", borderRadius: 14, cursor: "pointer",
              }}>+ {s}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// 관계사 닫힌 멀티셀렉트 드롭다운 (모듈 레벨, ProjectRegisterPage.tsx와 동일 패턴)
//   권한체계 enforcement 반영:
//   - allowedCodes: 토글 가능한 관계사 코드 화이트리스트. 관계사관리자는 담당 관계사만 전달.
//                   미지정(undefined) 시 전체(SELECTABLE_COMPANIES) 허용 = 전사관리자.
//   - allowCompanyWide: 전사 공용 선택 허용 여부. 관계사관리자는 false(자기 권한 밖으로 승격 방지).
//   selected에는 있으나 allowedCodes에 없는 관계사(타 관계사 공동 소속)는 잠금 상태로 표시.
function CompanyMultiSelect({ selected, onChange, disabled, allowedCodes, allowCompanyWide = true }: {
  selected: string[]; onChange: (codes: string[]) => void; disabled?: boolean;
  allowedCodes?: string[]; allowCompanyWide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isCompanyWide = selected.length === 0;

  // 토글 가능한 후보 목록
  const baseList = allowedCodes
    ? SELECTABLE_COMPANIES.filter(c => allowedCodes.includes(c.code))
    : SELECTABLE_COMPANIES;
  const filteredCompanies = baseList.filter(c =>
    search === "" || c.name.includes(search) || c.code.includes(search.toUpperCase())
  );

  // 선택돼 있으나 토글 불가한 관계사(담당 외 공동 소속) — 잠금 표시용
  const lockedSelected = allowedCodes
    ? SELECTABLE_COMPANIES.filter(c => selected.includes(c.code) && !allowedCodes.includes(c.code))
        .filter(c => search === "" || c.name.includes(search) || c.code.includes(search.toUpperCase()))
    : [];

  const toggleCompany = (code: string) => {
    onChange(selected.includes(code) ? selected.filter(c => c !== code) : [...selected, code]);
  };
  const selectCompanyWide = () => onChange([]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => !disabled && setOpen(v => !v)}
        type="button"
        disabled={disabled}
        style={{
          ...inputStyle, textAlign: "left", width: "100%",
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          color: "#0F172A", fontWeight: 600,
        }}
      >
        <span>{platformCompanyDisplay(selected)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 8 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
          background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: "10px 10px 6px",
          maxHeight: 340, display: "flex", flexDirection: "column",
        }}>
          {/* 전사 공용 — 전사관리자만 노출. 관계사관리자는 승격 불가하므로 숨김. */}
          {allowCompanyWide ? (
            <label style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 8px",
              borderRadius: 6, cursor: "pointer", background: isCompanyWide ? "#EFF6FF" : "transparent",
              marginBottom: 6, borderBottom: "1px solid #F1F5F9",
            }}>
              <input type="checkbox" checked={isCompanyWide} onChange={selectCompanyWide} style={{ cursor: "pointer" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: isCompanyWide ? "#2563EB" : "#334155" }}>전사 공용 (특정 관계사 한정 없음)</span>
            </label>
          ) : (
            <div style={{
              padding: "8px 8px", marginBottom: 6, borderBottom: "1px solid #F1F5F9",
              fontSize: 11, color: "#94A3B8",
            }}>
              담당 관계사만 지정할 수 있습니다. 전사 공용 전환은 전사관리자 권한입니다.
            </div>
          )}

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="관계사명 또는 코드로 검색"
            style={{ ...inputStyle, fontSize: 12, padding: "7px 10px", marginBottom: 6 }}
          />

          <div style={{ overflowY: "auto", flex: 1 }}>
            {/* 잠금: 담당 외 공동 소속 관계사 (해제 불가) */}
            {lockedSelected.map(c => (
              <label key={c.code} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 8px",
                borderRadius: 6, cursor: "not-allowed", background: "#F8FAFC", opacity: 0.85,
              }}>
                <input type="checkbox" checked disabled style={{ cursor: "not-allowed" }} />
                <span style={{ fontSize: 12, color: "#64748B" }}>{c.name}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", background: "#E2E8F0", padding: "1px 6px", borderRadius: 10, marginLeft: "auto" }}>담당 외</span>
              </label>
            ))}

            {filteredCompanies.map(c => (
              <label key={c.code} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 8px",
                borderRadius: 6, cursor: "pointer",
                background: selected.includes(c.code) ? "#EFF6FF" : "transparent",
              }}>
                <input type="checkbox" checked={selected.includes(c.code)} onChange={() => toggleCompany(c.code)} style={{ cursor: "pointer" }} />
                <span style={{ fontSize: 12, color: "#334155" }}>{c.name}</span>
                <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace", marginLeft: "auto" }}>{c.code}</span>
              </label>
            ))}

            {filteredCompanies.length === 0 && lockedSelected.length === 0 && (
              <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>검색 결과가 없습니다.</div>
            )}
          </div>

          <button onClick={() => setOpen(false)} type="button" style={{
            marginTop: 8, background: "#0F172A", color: "#fff", border: "none", borderRadius: 6,
            padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            완료
          </button>
        </div>
      )}
    </div>
  );
}

// TODO: 실제 연동 시 GET /api/v1/admin/review-queue 응답으로 교체
// (Project 신청 + PlatformItem 신청을 백엔드에서 합쳐 같은 대기열로 응답해야 함)
const INITIAL_ITEMS: ReviewItem[] = [
  {
    kind: "project",
    id: "PRJ-2025-071", title: "연구 실험 데이터 통합 플랫폼",
    summary: "메이크업연구소 실험 기록을 통합 관리하는 내부 플랫폼",
    description: "현재 메이크업연구소의 실험 데이터는 개인 PC 엑셀 파일에 분산 저장되어 있어 데이터 유실 위험과 협업 어려움이 있습니다.",
    dept: "메이크업연구소", submittedBy: "이수연", submittedAt: "2025.06.01",
    status: "개발 중", domain: ["데이터/분석"], domainOther: "", type: "내부 플랫폼", typeOther: "",
    stack: ["React", "FastAPI", "PostgreSQL", "AWS"],
    audience: ["특정 부서"],
    orgEntries: [
      { id: 1, company: "KKM", parent: "연구개발본부", dept: "메이크업연구소" },
      { id: 2, company: "KKM", parent: "IT본부", dept: "IT개발팀" },
    ],
    integrations: "LIMS", freeTags: "실험데이터, 버전관리, 연구자동화",
    contacts: [{ name: "이수연", dept: "메이크업연구소", role: "주담당자", email: "suyeon.lee@kolmar.co.kr" }],
    links: [{ label: "노션 문서", url: "https://notion.so/kolmar/exp-platform" }],
    approval: "대기",
  },
  {
    kind: "project",
    id: "PRJ-2025-072", title: "구매 발주 자동화 시스템",
    summary: "ERP 연동 기반 구매 발주 프로세스 자동화",
    description: "기존 수기 발주 프로세스를 ERP 데이터 기반으로 자동화하여 발주 오류를 줄이고 처리 시간을 단축합니다.",
    dept: "구매팀", submittedBy: "박성훈", submittedAt: "2025.06.02",
    status: "개발 중", domain: ["재무/회계"], domainOther: "", type: "웹 애플리케이션", typeOther: "",
    stack: ["TypeScript", "NestJS", "PostgreSQL"],
    audience: ["내부 직원 전체"],
    orgEntries: [
      { id: 3, company: "KKM", parent: "경영지원본부", dept: "구매팀" },
      { id: 4, company: "KKM", parent: "경영지원본부", dept: "재무팀" },
      { id: 5, company: "KKM", parent: "IT본부", dept: "IT개발팀" },
    ],
    integrations: "ERP (SAP)", freeTags: "발주, 구매자동화",
    contacts: [{ name: "박성훈", dept: "구매팀", role: "주담당자", email: "sunghoon.park@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
  {
    kind: "project",
    id: "PRJ-2025-075", title: "현장 안전 점검 체크리스트 앱",
    summary: "생산 현장 안전 점검을 위한 모바일 체크리스트 도구",
    description: "기존 종이 점검표를 대체하여 사진 첨부, 즉시 보고가 가능한 점검 도구를 개발합니다.",
    dept: "품질관리팀", submittedBy: "정유진", submittedAt: "2025.06.03",
    status: "개발 중", domain: ["제조/생산"], domainOther: "", type: "기타", typeOther: "모바일 PWA",
    stack: ["React", "FastAPI"],
    audience: ["특정 부서"],
    orgEntries: [{ id: 6, company: "KMW", parent: "생산본부", dept: "품질관리팀" }],
    integrations: "", freeTags: "안전점검, 현장관리",
    contacts: [{ name: "정유진", dept: "품질관리팀", role: "주담당자", email: "yujin.jung@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
  // n8n 등록 신청 (관계사 미지정 상태 시뮬레이션: platformScope "unset")
  {
    kind: "n8n",
    id: "N8N-014", title: "협력사 정산서 자동 검증",
    summary: "협력사가 제출한 정산서를 ERP 데이터와 자동 대조",
    description: "매월 말 협력사로부터 수신되는 정산서를 ERP 발주 데이터와 자동으로 대조하여 불일치 항목을 표시합니다.",
    dept: "구매팀", submittedBy: "박성훈", submittedAt: "2025.06.20",
    status: "개발 중",
    triggerAction: "Schedule Trigger(매월 말일) → ERP API 조회 → 정산서 파싱 → 대조 → 불일치 시 Teams 알림",
    nodes: ["Schedule Trigger", "HTTP Request", "Code", "IF"], connectedApps: ["Microsoft Teams"],
    expectedTimeSaved: "월 4시간", difficulty: "보통", specificUrl: "https://n8n.kolmar.co.kr/workflow/014",
    itemTags: "정산, 구매자동화",
    company: [], platformScope: "unset",
    contacts: [{ name: "박성훈", dept: "구매팀", role: "주담당자", email: "sunghoon.park@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
  // 나만의 비서 등록 신청 (특정 관계사 한정)
  {
    kind: "assistant",
    id: "AST-011", title: "해외법인 계약서 1차 검토 비서",
    summary: "해외법인向 영문 계약서의 주요 리스크 조항을 1차 스크리닝",
    description: "미국콜마·북경콜마 등 해외법인에서 체결하는 영문 계약서의 주요 조항을 1차로 스크리닝하여 법무팀 검토 시간을 단축합니다.",
    dept: "법무팀", submittedBy: "강현우", submittedAt: "2025.06.22",
    status: "파일럿",
    triggerAction: "Chat Trigger → 계약서 업로드 → 조항 추출 → 리스크 스크리닝 → 요약 리포트",
    nodes: ["Chat Trigger", "AI Agent"], connectedApps: ["Microsoft One Drive"],
    expectedTimeSaved: "주 5시간", difficulty: "어려움",
    specificUrl: "https://assistant.kolmar.co.kr/agents/global-contract-review",
    itemTags: "계약서, 법무, 해외법인",
    company: ["KUS", "KMB"], platformScope: "specific",
    contacts: [{ name: "강현우", dept: "법무팀", role: "주담당자", email: "hyunwoo.kang@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
  // AI Agent 등록 신청 (전사 공용)
  {
    kind: "ai-orchestration",
    id: "AIO-006", title: "GPT-4o (범용 업무 보조)",
    summary: "전사 직원 누구나 사용할 수 있는 범용 업무 보조 모델",
    description: "이메일 작성, 보고서 초안, 데이터 요약 등 범용 업무에 적합합니다.",
    dept: "IT개발팀", submittedBy: "정태영", submittedAt: "2025.06.24",
    status: "개발 중",
    provider: "OpenAI", contextWindow: "128K", strengths: "범용성, 빠른 응답속도", costTier: "보통",
    specificUrl: "https://ai-gateway.kolmar.co.kr/models/gpt-4o",
    itemTags: "범용, 업무보조",
    company: [], platformScope: "company-wide",
    contacts: [{ name: "정태영", dept: "IT개발팀", role: "주담당자", email: "taeyoung.jung@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
];

export default function AdminReview() {
  // 현재 관리자 권한 컨텍스트
  const { isGlobalAdmin, managedCompanies, canManageItem } = useAuth();

  const [items, setItems] = useState<ReviewItem[]>(INITIAL_ITEMS);
  const [selected, setSelected] = useState<string>(INITIAL_ITEMS[0]?.id ?? "");
  const [done, setDone] = useState<string[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<ReviewItem>>>({});
  const [filter, setFilter] = useState<"전체" | "대기" | "처리완료">("대기");
  const [sourceFilter, setSourceFilter] = useState<"전체" | "project" | PlatformId>("전체");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [draftCompany, setDraftCompany] = useState(COMPANIES[1].code);
  const [draftParent, setDraftParent] = useState(NO_PARENT);
  const [draftDept, setDraftDept] = useState("");

  const activeItem = items.find(i => i.id === selected) ?? null;
  const edit = edits[selected] ?? {};
  const merged = activeItem ? ({ ...activeItem, ...edit } as ReviewItem) : null;
  const isDisabled = done.includes(selected);

  // 권한 판정. 항상 "원본 항목" 기준으로 판정해 편집을 통한 권한 우회를 차단.
  const canManageReviewItem = (item: ReviewItem): boolean =>
    canManageItem(itemCompaniesOf(item), itemIsCompanyWideOf(item));

  // 관계사 편집 허용 범위 — 전사관리자는 전체(undefined), 관계사관리자는 담당 관계사로 제한.
  const companyEditAllowed = isGlobalAdmin ? undefined : managedCompanies;

  const setEdit = <K extends keyof ReviewItem>(k: K, v: any) =>
    setEdits(p => ({ ...p, [selected]: { ...(p[selected] || {}), [k]: v } }));

  const toggleMulti = (k: "domain" | "audience" | "stack", v: string) => {
    if (!merged || !isProjectKind(merged)) return;
    const cur = ((edit as any)[k] ?? (merged as any)[k] ?? []) as string[];
    setEdit(k as any, cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
  };

  // 관계사 변경 핸들러.
  //   관계사관리자는 전사 공용(빈 배열)으로 승격할 수 없음(권한 범위 밖으로 이동 방지).
  const setPlatformCompanies = (codes: string[]) => {
    if (!isGlobalAdmin && codes.length === 0) return;
    setEdit("company" as any, codes);
    setEdit("platformScope" as any, codes.length === 0 ? "company-wide" : "specific");
  };

  // 예상 절감 시간 — 원본 문자열을 역직렬화한 값을 기준으로, 편집분(edits)을 덮어쓴다.
  // edits에는 수치(timeSavedValue)와 주기(timeSavedPeriod)를 임시 보관하고,
  // 저장 시 serializeTimeSaved로 expectedTimeSaved 문자열로 합성한다.
  const baseTimeSaved = merged && !isProjectKind(merged)
    ? deserializeTimeSaved((merged as ReviewPlatformItem).expectedTimeSaved)
    : { value: "" as number | "", period: "주" as SavedPeriod };
  const currentTimeSavedValue = ((edit as any).timeSavedValue !== undefined
    ? (edit as any).timeSavedValue
    : baseTimeSaved.value) as number | "";
  const currentTimeSavedPeriod = ((edit as any).timeSavedPeriod !== undefined
    ? (edit as any).timeSavedPeriod
    : baseTimeSaved.period) as SavedPeriod;

  const setTimeSavedValue = (v: number | "") => {
    setEdit("timeSavedValue" as any, v);
    setEdit("expectedTimeSaved" as any, serializeTimeSaved(v, currentTimeSavedPeriod));
  };
  const setTimeSavedPeriod = (p: SavedPeriod) => {
    setEdit("timeSavedPeriod" as any, p);
    setEdit("expectedTimeSaved" as any, serializeTimeSaved(currentTimeSavedValue, p));
  };

  const currentOrgEntries = (((edit as any).orgEntries ?? (merged && isProjectKind(merged) ? merged.orgEntries : [])) ?? []) as OrgEntry[];

  const addOrgEntry = () => {
    const newEntry: OrgEntry = {
      id: orgEntryIdSeq++,
      company: draftCompany,
      parent: draftParent === NO_PARENT ? null : draftParent,
      dept: draftDept || null,
    };
    const isDuplicate = currentOrgEntries.some(e => e.company === newEntry.company && e.parent === newEntry.parent && e.dept === newEntry.dept);
    if (isDuplicate) return;
    setEdit("orgEntries" as any, [...currentOrgEntries, newEntry]);
    setDraftParent(NO_PARENT);
    setDraftDept("");
  };
  const removeOrgEntry = (id: number) => setEdit("orgEntries" as any, currentOrgEntries.filter(e => e.id !== id));

  // 노드/연동앱 칩 (n8n, assistant 전용)
  const currentNodes = (((edit as any).nodes ?? (merged as any)?.nodes) ?? []) as string[];
  const currentApps = (((edit as any).connectedApps ?? (merged as any)?.connectedApps) ?? []) as string[];
  const addNode = (v: string) => { if (!currentNodes.includes(v)) setEdit("nodes" as any, [...currentNodes, v]); };
  const removeNode = (v: string) => setEdit("nodes" as any, currentNodes.filter(n => n !== v));
  const addApp = (v: string) => { if (!currentApps.includes(v)) setEdit("connectedApps" as any, [...currentApps, v]); };
  const removeApp = (v: string) => setEdit("connectedApps" as any, currentApps.filter(a => a !== v));

  const availableParents = PARENTS_BY_COMPANY[draftCompany] ?? [];
  const availableDepts = draftParent !== NO_PARENT ? (DEPTS_BY_PARENT[draftParent] ?? []) : [];

  const handleApprove = () => {
    if (!activeItem) return;
    // 권한 범위 밖 항목은 승인 차단(원본 기준)
    if (!canManageReviewItem(activeItem)) return;
    // PlatformItem이고 platformScope가 "unset"이면 승인 차단(등록자가 미선택으로 둔 채 신청이 들어온 예외 상황 방지)
    if (merged && !isProjectKind(merged)) {
      const scope = (edit as any).platformScope ?? merged.platformScope;
      if (scope === "unset") return;
    }
    // 저장 시 임시 편집키(timeSavedValue/timeSavedPeriod)는 제거하고 expectedTimeSaved만 반영.
    // TODO: 실제 연동 시
    //   kind === "project" → PATCH /api/v1/admin/projects/:id/approve
    //   그 외 → PATCH /api/v1/admin/platform-items/:id/approve (body에 company, platformScope, expectedTimeSaved 포함)
    setItems(p => p.map(i => {
      if (i.id !== selected) return i;
      const { timeSavedValue, timeSavedPeriod, ...cleanEdit } = edit as any;
      return { ...i, ...cleanEdit, approval: "승인" } as ReviewItem;
    }));
    setDone(p => [...p, selected]);
    const remaining = items.filter(i => !done.includes(i.id) && i.id !== selected);
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  const handleReject = () => {
    if (!activeItem) return;
    // 권한 범위 밖 항목은 반려도 차단(원본 기준)
    if (!canManageReviewItem(activeItem)) return;
    if (!rejectReason.trim()) return;
    // TODO: 실제 연동 시 kind에 따라 /admin/projects/:id/reject 또는 /admin/platform-items/:id/reject
    setItems(p => p.map(i => i.id === selected ? ({ ...i, approval: "반려", rejectionReason: rejectReason } as ReviewItem) : i));
    setDone(p => [...p, selected]);
    setRejectOpen(false);
    setRejectReason("");
    const remaining = items.filter(i => !done.includes(i.id) && i.id !== selected);
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  const pendingItems = items.filter(i => !done.includes(i.id));

  const filteredList = items
    .filter(i => filter === "전체" ? true : filter === "처리완료" ? done.includes(i.id) : !done.includes(i.id))
    .filter(i => sourceFilter === "전체" ? true : i.kind === sourceFilter);

  const SOURCE_OPTIONS: { key: "전체" | "project" | PlatformId; label: string }[] = [
    { key: "전체", label: "전체" },
    { key: "project", label: "프로젝트" },
    ...PLATFORMS.map(p => ({ key: p.id, label: p.name })),
  ];

  // 승인/반려 차단 조건 계산
  //   outOfScope: 담당 관계사 범위 밖(전사공용은 global만) → 승인·반려 모두 불가
  //   unsetScope: PlatformItem 관계사 미지정 → 승인 불가(반려는 가능)
  const outOfScope = !!activeItem && !canManageReviewItem(activeItem);
  const unsetScope = !!(merged && !isProjectKind(merged) && (((edit as any).platformScope ?? merged.platformScope) === "unset"));
  const approveBlocked = unsetScope;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <AdminNavbar />

      <div style={{ display: "flex" }}>

        <AdminSidebar pendingCount={pendingItems.length} />

        <main style={{ flex: 1, display: "flex", minWidth: 0, minHeight: "calc(100vh - 56px)" }}>

          {/* ===== 좌측: 통합 대기 목록 ===== */}
          <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>등록 신청 목록</div>

              {/* 관계사관리자 안내 배너 */}
              {!isGlobalAdmin && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, padding: "7px 10px", marginBottom: 8, fontSize: 10.5, color: "#1E40AF", lineHeight: 1.5 }}>
                  담당 관계사 신청 건만 승인·반려할 수 있습니다. 범위 밖 항목은 열람만 가능합니다.
                </div>
              )}

              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {(["전체", "대기", "처리완료"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    flex: 1, padding: "5px 0", borderRadius: 6, border: "none",
                    background: filter === f ? "#0F172A" : "#F1F5F9",
                    color: filter === f ? "#fff" : "#64748B",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>{f}</button>
                ))}
              </div>

              {/* 출처 필터 — 유형별로 통합 대기열을 좁혀볼 수 있게 */}
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as any)} style={{ ...selectStyle, fontSize: 11, padding: "6px 28px 6px 10px" }}>
                {SOURCE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredList.map(item => {
                const isDone = done.includes(item.id);
                const isSelected = selected === item.id;
                const sourceStyle = SOURCE_STYLE[item.kind];
                // platformScope가 unset인 신청 건은 목록에서 경고 배지 표시
                const needsAttention = !isProjectKind(item) && item.platformScope === "unset" && !isDone;
                // 담당 범위 밖 신청 건은 "권한 범위 외" 배지
                const outOfScopeItem = !isDone && !canManageReviewItem(item);
                return (
                  <div key={item.id} onClick={() => setSelected(item.id)} style={{
                    padding: "12px 14px", cursor: "pointer",
                    background: isSelected ? "#EFF6FF" : "transparent",
                    borderBottom: "1px solid #F8FAFC",
                    borderLeft: isSelected ? "3px solid #2563EB" : "3px solid transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, background: sourceStyle.bg, color: sourceStyle.color,
                        padding: "1px 7px", borderRadius: 20,
                      }}>{sourceStyle.label}</span>
                      {isDone && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8" }}>처리완료</span>
                      )}
                      {/* 권한 범위 밖이면 그것을 우선 표기, 아니면 미지정 표기 */}
                      {outOfScopeItem ? (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#64748B", background: "#E2E8F0", padding: "1px 7px", borderRadius: 20 }}>권한 범위 외</span>
                      ) : needsAttention ? (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#DC2626" }}>관계사 미지정</span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 2, opacity: isDone || outOfScopeItem ? 0.5 : 1 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{item.dept} · {item.submittedBy}</div>
                  </div>
                );
              })}
              {filteredList.length === 0 && (
                <div style={{ padding: "30px 14px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>해당하는 신청 건이 없습니다.</div>
              )}
            </div>
          </div>

          {/* ===== 우측: 상세 검토 패널 ===== */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {!merged ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>검토할 항목을 선택하세요.</div>
            ) : (
              <div style={{ maxWidth: 720 }}>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, background: SOURCE_STYLE[merged.kind].bg, color: SOURCE_STYLE[merged.kind].color,
                    padding: "3px 10px", borderRadius: 20,
                  }}>{SOURCE_STYLE[merged.kind].label}</span>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{merged.id} · 신청 {merged.submittedAt} · 신청자 {merged.submittedBy}</span>
                </div>

                {merged.approval !== "대기" && (
                  <div style={{
                    background: merged.approval === "승인" ? "#D1FAE5" : "#FEE2E2",
                    border: `1px solid ${merged.approval === "승인" ? "#6EE7B7" : "#FECACA"}`,
                    borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                    fontSize: 12, fontWeight: 600,
                    color: merged.approval === "승인" ? "#065F46" : "#991B1B",
                  }}>
                    이 항목은 {merged.approval} 처리되었습니다.
                    {merged.approval === "반려" && merged.rejectionReason && ` (사유: ${merged.rejectionReason})`}
                  </div>
                )}

                {/* 권한 범위 밖 항목 열람 안내 (처리 전이지만 담당 아님) */}
                {!isDisabled && outOfScope && (
                  <div style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#475569" }}>
                    이 신청 건의 대상 관계사가 담당 관계사 범위에 포함되지 않습니다. 내용은 열람할 수 있으나 승인·반려 처리는 담당 관리자만 가능합니다.
                  </div>
                )}

                {!isDisabled && !outOfScope && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "9px 14px", marginBottom: 16, fontSize: 12, color: "#92400E" }}>
                    내용을 직접 수정한 후 승인할 수 있습니다. 수정된 내용이 최종 게시됩니다.
                  </div>
                )}

                {/* ===== 공통: 기본 정보 ===== */}
                <SectionBlock title="기본 정보">
                  <FieldRow label="제목">
                    <input value={(edit as any).title ?? merged.title} onChange={e => setEdit("title" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                  </FieldRow>
                  <FieldRow label="한 줄 요약">
                    <input value={(edit as any).summary ?? merged.summary} onChange={e => setEdit("summary" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                  </FieldRow>
                  <FieldRow label="상세 설명">
                    <textarea value={(edit as any).description ?? merged.description} onChange={e => setEdit("description" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.7, opacity: isDisabled ? 0.6 : 1 }} />
                  </FieldRow>
                </SectionBlock>

                {/* ===== 분기: 일반 프로젝트 분류 정보 ===== */}
                {isProjectKind(merged) && (
                  <SectionBlock title="분류 정보">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <FieldRow label="프로젝트 상태">
                        <select value={(edit as any).status ?? merged.status} onChange={e => setEdit("status" as any, e.target.value)} disabled={isDisabled} style={{ ...selectStyle, opacity: isDisabled ? 0.6 : 1 }}>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </FieldRow>
                      <FieldRow label="시스템 유형">
                        <select value={(edit as any).type ?? merged.type} onChange={e => setEdit("type" as any, e.target.value)} disabled={isDisabled} style={{ ...selectStyle, opacity: isDisabled ? 0.6 : 1 }}>
                          {SYSTEM_TYPES.map(s => <option key={s}>{s}</option>)}
                        </select>
                        {((edit as any).type ?? merged.type) === "기타" && (
                          <input
                            value={(edit as any).typeOther ?? merged.typeOther}
                            onChange={e => setEdit("typeOther" as any, e.target.value)}
                            disabled={isDisabled}
                            placeholder="신청자가 입력한 기타 시스템 유형"
                            style={{ ...inputStyle, marginTop: 8, opacity: isDisabled ? 0.6 : 1, borderColor: "#BFDBFE", background: "#EFF6FF" }}
                          />
                        )}
                      </FieldRow>
                    </div>

                    <FieldRow label="비즈니스 도메인">
                      <TagSelect options={DOMAINS} selected={(edit as any).domain ?? merged.domain} onChange={v => toggleMulti("domain", v)} disabled={isDisabled} />
                      {((edit as any).domain ?? merged.domain).includes("기타") && (
                        <input
                          value={(edit as any).domainOther ?? merged.domainOther}
                          onChange={e => setEdit("domainOther" as any, e.target.value)}
                          disabled={isDisabled}
                          placeholder="신청자가 입력한 기타 도메인"
                          style={{ ...inputStyle, marginTop: 8, opacity: isDisabled ? 0.6 : 1, borderColor: "#BFDBFE", background: "#EFF6FF" }}
                        />
                      )}
                    </FieldRow>

                    <FieldRow label="참여 관계사 / 본부 / 부서">
                      {currentOrgEntries.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: isDisabled ? 0 : 10 }}>
                          {currentOrgEntries.map(e => (
                            isDisabled ? (
                              <span key={e.id} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6, display: "inline-block", marginRight: 6, marginBottom: 6 }}>
                                {orgEntryDisplay(e)}
                              </span>
                            ) : (
                              <div key={e.id} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, padding: "7px 11px",
                              }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#1E40AF" }}>{orgEntryDisplay(e)}</span>
                                <button onClick={() => removeOrgEntry(e.id)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                      {!isDisabled && (
                        <div style={{ background: "#F8FAFC", border: "1.5px dashed #CBD5E1", borderRadius: 7, padding: "12px 14px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                            <select value={draftCompany} onChange={e => { setDraftCompany(e.target.value); setDraftParent(NO_PARENT); setDraftDept(""); }} style={{ ...selectStyle, fontSize: 11, padding: "7px 26px 7px 8px" }}>
                              {COMPANIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                            <select value={draftParent} onChange={e => { setDraftParent(e.target.value); setDraftDept(""); }} style={{ ...selectStyle, fontSize: 11, padding: "7px 26px 7px 8px" }}>
                              <option value={NO_PARENT}>본부 없음</option>
                              {availableParents.map(p => <option key={p}>{p}</option>)}
                            </select>
                            <select value={draftDept} onChange={e => setDraftDept(e.target.value)} disabled={draftParent === NO_PARENT} style={{ ...selectStyle, fontSize: 11, padding: "7px 26px 7px 8px", opacity: draftParent === NO_PARENT ? 0.5 : 1 }}>
                              <option value="">부서 없음</option>
                              {availableDepts.map(d => <option key={d}>{d}</option>)}
                            </select>
                          </div>
                          <button onClick={addOrgEntry} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ 추가</button>
                        </div>
                      )}
                    </FieldRow>

                    <FieldRow label="사용 대상">
                      <TagSelect options={AUDIENCES} selected={(edit as any).audience ?? merged.audience} onChange={v => toggleMulti("audience", v)} disabled={isDisabled} />
                    </FieldRow>
                    <FieldRow label="기술 스택">
                      <TagSelect options={STACK_OPTIONS} selected={(edit as any).stack ?? merged.stack} onChange={v => toggleMulti("stack", v)} disabled={isDisabled} />
                    </FieldRow>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <FieldRow label="연동 시스템">
                        <input value={(edit as any).integrations ?? merged.integrations} onChange={e => setEdit("integrations" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                      </FieldRow>
                      <FieldRow label="자유 태그">
                        <input value={(edit as any).freeTags ?? merged.freeTags} onChange={e => setEdit("freeTags" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                      </FieldRow>
                    </div>
                  </SectionBlock>
                )}

                {/* ===== 분기: 워크플로우/에이전트형(n8n, assistant) ===== */}
                {!isProjectKind(merged) && (merged.kind === "n8n" || merged.kind === "assistant") && (
                  <>
                    <SectionBlock title={`${SOURCE_STYLE[merged.kind].label} 동작 정보`}>
                      <FieldRow label="상태">
                        <SingleSelectTag options={STATUSES} value={(edit as any).status ?? merged.status} onChange={v => setEdit("status" as any, v)} disabled={isDisabled} />
                      </FieldRow>

                      {/* 소속/대상 관계사 — 권한 범위 제한 적용 */}
                      <FieldRow label="소속 / 대상 관계사">
                        <CompanyMultiSelect
                          selected={(edit as any).company ?? merged.company}
                          onChange={setPlatformCompanies}
                          disabled={isDisabled}
                          allowedCodes={companyEditAllowed}
                          allowCompanyWide={isGlobalAdmin}
                        />
                        {!isDisabled && (((edit as any).platformScope ?? merged.platformScope) === "unset") && (
                          <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>
                            신청자가 관계사 범위를 선택하지 않았습니다. 승인 전 직접 확인하여 선택해주세요.
                          </div>
                        )}
                      </FieldRow>

                      <FieldRow label="트리거 · 동작 설명">
                        <textarea value={(edit as any).triggerAction ?? (merged as ReviewPlatformItem).triggerAction ?? ""} onChange={e => setEdit("triggerAction" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, minHeight: 70, resize: "vertical", lineHeight: 1.7, opacity: isDisabled ? 0.6 : 1 }} />
                      </FieldRow>
                      <FieldRow label="실행 URL">
                        <input value={(edit as any).specificUrl ?? (merged as ReviewPlatformItem).specificUrl ?? ""} onChange={e => setEdit("specificUrl" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                      </FieldRow>
                      <FieldRow label="태그">
                        <input value={(edit as any).itemTags ?? (merged as ReviewPlatformItem).itemTags ?? ""} onChange={e => setEdit("itemTags" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                      </FieldRow>
                    </SectionBlock>

                    <SectionBlock title="노드 구성">
                      <FieldRow label="사용된 노드">
                        <ChipEditor items={currentNodes} onAdd={addNode} onRemove={removeNode} suggestions={NODE_SUGGESTIONS} placeholder="노드명 입력 후 Enter" disabled={isDisabled} />
                      </FieldRow>
                      <FieldRow label="연동 앱·서비스">
                        <ChipEditor items={currentApps} onAdd={addApp} onRemove={removeApp} suggestions={APP_SUGGESTIONS} placeholder="연동 앱명 입력 후 Enter" disabled={isDisabled} />
                      </FieldRow>
                    </SectionBlock>

                    <SectionBlock title="예상 효과">
                      <FieldRow label="예상 절감 시간">
                        <TimeSavedInput
                          value={currentTimeSavedValue}
                          period={currentTimeSavedPeriod}
                          onValueChange={setTimeSavedValue}
                          onPeriodChange={setTimeSavedPeriod}
                          disabled={isDisabled}
                        />
                      </FieldRow>
                      <FieldRow label="구성 난이도">
                        <SingleSelectTag options={DIFFICULTY_LEVELS} value={(edit as any).difficulty ?? (merged as ReviewPlatformItem).difficulty ?? "보통"} onChange={v => setEdit("difficulty" as any, v)} disabled={isDisabled} />
                      </FieldRow>
                    </SectionBlock>
                  </>
                )}

                {/* ===== 분기: AI Agent — 모델 사양 ===== */}
                {merged.kind === "ai-orchestration" && (
                  <SectionBlock title="모델 사양">
                    <FieldRow label="상태">
                      <SingleSelectTag options={STATUSES} value={(edit as any).status ?? merged.status} onChange={v => setEdit("status" as any, v)} disabled={isDisabled} />
                    </FieldRow>

                    {/* 소속/대상 관계사 — 권한 범위 제한 적용 */}
                    <FieldRow label="소속 / 대상 관계사">
                      <CompanyMultiSelect
                        selected={(edit as any).company ?? merged.company}
                        onChange={setPlatformCompanies}
                        disabled={isDisabled}
                        allowedCodes={companyEditAllowed}
                        allowCompanyWide={isGlobalAdmin}
                      />
                      {!isDisabled && (((edit as any).platformScope ?? merged.platformScope) === "unset") && (
                        <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>
                          신청자가 관계사 범위를 선택하지 않았습니다. 승인 전 직접 확인하여 선택해주세요.
                        </div>
                      )}
                    </FieldRow>

                    <FieldRow label="제공사">
                      <input value={(edit as any).provider ?? (merged as ReviewPlatformItem).provider ?? ""} onChange={e => setEdit("provider" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="컨텍스트 윈도우">
                      <input value={(edit as any).contextWindow ?? (merged as ReviewPlatformItem).contextWindow ?? ""} onChange={e => setEdit("contextWindow" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="비용 등급">
                      <SingleSelectTag options={COST_TIERS} value={(edit as any).costTier ?? (merged as ReviewPlatformItem).costTier ?? "보통"} onChange={v => setEdit("costTier" as any, v)} disabled={isDisabled} />
                    </FieldRow>
                    <FieldRow label="강점">
                      <input value={(edit as any).strengths ?? (merged as ReviewPlatformItem).strengths ?? ""} onChange={e => setEdit("strengths" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="모델 접속 URL">
                      <input value={(edit as any).specificUrl ?? (merged as ReviewPlatformItem).specificUrl ?? ""} onChange={e => setEdit("specificUrl" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="태그">
                      <input value={(edit as any).itemTags ?? (merged as ReviewPlatformItem).itemTags ?? ""} onChange={e => setEdit("itemTags" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 공통: 담당자 (관리자가 직접 수정 가능하도록 변경) ===== */}
                <SectionBlock title="담당자">
                  {!isDisabled && (
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 11, color: "#64748B" }}>
                      퇴사·인사이동 등으로 담당자 정보가 바뀐 경우 여기서 직접 수정하세요. 신청자가 입력한 원본 정보와 다를 수 있습니다.
                    </div>
                  )}

                  {((edit as any).contacts ?? merged.contacts).map((c: Contact, i: number) => {
                    const contacts = (edit as any).contacts ?? merged.contacts;
                    const setContact = (k: keyof Contact, v: string) => {
                      const next = contacts.map((cc: Contact, ci: number) => ci === i ? { ...cc, [k]: v } : cc);
                      setEdit("contacts" as any, next);
                    };
                    const removeContact = () => setEdit("contacts" as any, contacts.filter((_: Contact, ci: number) => ci !== i));

                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, marginBottom: 8 }}>
                        {isDisabled ? (
                          <>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                              {c.name ? c.name[0] : "?"}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{c.name} <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 400 }}>· {c.dept}</span></div>
                              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{c.email}</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, background: "#0F172A", color: "#fff", padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>{c.role}</span>
                          </>
                        ) : (
                          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                            <input value={c.name} onChange={e => setContact("name", e.target.value)} placeholder="이름" style={{ ...inputStyle, fontSize: 12, padding: "6px 9px" }} />
                            <input value={c.dept} onChange={e => setContact("dept", e.target.value)} placeholder="부서" style={{ ...inputStyle, fontSize: 12, padding: "6px 9px" }} />
                            <input value={c.email} onChange={e => setContact("email", e.target.value)} placeholder="이메일" style={{ ...inputStyle, fontSize: 12, padding: "6px 9px" }} />
                            <select value={c.role} onChange={e => setContact("role", e.target.value)} style={{ ...selectStyle, fontSize: 12, padding: "6px 22px 6px 9px" }}>
                              <option value="주담당자">주담당자</option>
                              <option value="공동담당자">공동담당자</option>
                            </select>
                            {contacts.length > 1 && (
                              <button onClick={removeContact} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {!isDisabled && (
                    <button onClick={() => setEdit("contacts" as any, [...((edit as any).contacts ?? merged.contacts), { name: "", dept: "", role: "공동담당자", email: "" }])} style={{ background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 7, padding: "8px 0", width: "100%", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                      + 담당자 추가
                    </button>
                  )}
                </SectionBlock>

                {/* ===== 승인 / 반려 액션 ===== */}
                {!isDisabled && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {outOfScope ? (
                      // 권한 범위 밖: 처리 버튼 미노출, 안내만
                      <div style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, padding: "11px 14px", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                        이 신청 건은 담당 관계사 범위에 속하지 않아 승인·반려할 수 없습니다.
                        {itemIsCompanyWideOf(activeItem!) && " 전사 공용 항목은 전사관리자만 처리할 수 있습니다."}
                      </div>
                    ) : (
                      <>
                        {approveBlocked && (
                          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#991B1B" }}>
                            관계사 범위가 선택되지 않아 승인할 수 없습니다. "소속 / 대상 관계사"에서 해당 관계사를 선택해주세요.
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            onClick={handleApprove}
                            disabled={approveBlocked}
                            style={{
                              flex: 1, background: approveBlocked ? "#CBD5E1" : "#059669", color: "#fff", border: "none",
                              borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 700,
                              cursor: approveBlocked ? "not-allowed" : "pointer",
                            }}
                          >
                            승인
                          </button>
                          <button onClick={() => setRejectOpen(v => !v)} style={{ flex: 1, background: "#fff", border: "1.5px solid #FECACA", color: "#EF4444", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                            반려
                          </button>
                        </div>

                        {rejectOpen && (
                          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "14px 16px" }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", display: "block", marginBottom: 8 }}>반려 사유 (필수)</label>
                            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="반려 사유를 입력하세요. 신청자에게 그대로 전달됩니다."
                              style={{ ...inputStyle, minHeight: 70, resize: "vertical", marginBottom: 10 }} />
                            <button onClick={handleReject} disabled={!rejectReason.trim()} style={{
                              background: rejectReason.trim() ? "#EF4444" : "#CBD5E1", color: "#fff", border: "none",
                              borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 700,
                              cursor: rejectReason.trim() ? "pointer" : "not-allowed",
                            }}>
                              반려 확정
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}