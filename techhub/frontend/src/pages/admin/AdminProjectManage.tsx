import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { PLATFORMS } from "../../types/platformTypes";
import type { PlatformId } from "../../types/platformTypes";
// ★ 신규 — 권한 판정 헬퍼 재사용 (canManageItem / isGlobalAdmin / managedCompanies)
import { useAuth } from "../../context/useAuth";

// ===== 공통 상수 (Project 전용) =====
const STATUSES = ["개발 중", "운영 중", "파일럿", "보류", "종료"];
const SYSTEM_TYPES = ["웹 애플리케이션", "모바일 앱", "API/서비스", "데이터 파이프라인", "ML/AI 모델", "배치/스케줄러", "인프라/DevOps 도구", "라이브러리/SDK", "내부 플랫폼", "내부 도구", "기타"];
const DOMAINS = ["마케팅", "영업/CRM", "HR/인사", "재무/회계", "고객 서비스", "제조/생산", "IT 인프라", "데이터/분석", "보안", "내부 도구", "기타"];
const AUDIENCES = ["내부 직원 전체", "특정 부서", "외부 고객", "파트너사", "시스템 간 (내부 API)"];
const STACK_GROUPS: Record<string, string[]> = {
  "언어": ["Python", "JavaScript", "TypeScript", "Java", "Go", "Kotlin", "Swift", "C#", "Rust"],
  "프레임워크": ["React", "Next.js", "Vue", "Spring Boot", "FastAPI", "Django", "NestJS", "Flutter", "Three.js"],
  "인프라/클라우드": ["AWS", "GCP", "Azure", "Kubernetes", "Docker", "Terraform", "On-premise"],
  "데이터": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "Airflow", "Spark"],
};

// ===== PlatformItem(n8n/나만의비서/AI Agent) 전용 상수 =====
const PLATFORM_STATUSES = ["운영 중", "개발 중", "파일럿", "보류", "종료"];
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

// TODO: 실제 연동 시 GET /api/v1/admin/departments?company=:code 응답으로 교체 (orgEntries용, Project 전용)
const COMPANIES = [
  { code: "KMH", name: "콜마홀딩스" }, { code: "KKM", name: "한국콜마" },
  { code: "KBH", name: "콜마비앤에이치" }, { code: "HC", name: "콜마생활건강" },
  { code: "KMG", name: "콜마글로벌" }, { code: "KMW", name: "무석콜마" },
  { code: "KUS", name: "미국콜마" },
];

const PARENTS_BY_COMPANY: Record<string, string[]> = {
  KKM: ["연구개발본부", "IT본부", "경영지원본부", "영업마케팅본부", "생산본부"],
  KBH: ["연구개발본부", "경영지원본부"],
  KMG: ["영업마케팅본부", "경영지원본부"],
  KMW: ["생산본부"],
};

const DEPTS_BY_PARENT: Record<string, string[]> = {
  "연구개발본부": ["메이크업연구소", "스킨케어연구소", "헬스케어연구소"],
  "IT본부": ["IT개발팀", "IT인프라팀"],
  "경영지원본부": ["재무팀", "인사팀", "사업기획팀", "구매팀", "법무팀"],
  "영업마케팅본부": ["마케팅팀", "영업팀", "글로벌사업팀"],
  "생산본부": ["품질관리팀", "제조기술팀", "생산관리팀"],
};

const NO_PARENT = "본부 없음 (관계사 직속)";

// ★ 신규 — PlatformItem.company 선택용 29개 전체 관계사 (AdminOrg.tsx/ProjectRegisterPage.tsx/AdminReview.tsx와 동일 소스)
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

// ===== 타입 정의 =====
type Contact = { name: string; dept: string; role: string; email: string };
type LinkItem = { label: string; url: string };
type OrgEntry = { id: number; company: string; parent: string | null; dept: string | null };

type ManagedProjectItem = {
  kind: "project";
  id: string; title: string; dept: string; status: string;
  domain: string[]; domainOther: string; type: string; typeOther: string;
  stack: string[]; audience: string[];
  orgEntries: OrgEntry[]; integrations: string; freeTags: string;
  summary: string; description: string; contacts: Contact[];
  links: LinkItem[]; updatedAt: string;
  createdByEmail: string;
};

type ManagedPlatformItem = {
  kind: PlatformId;
  id: string; title: string; dept: string; status: string;
  summary: string; description: string; contacts: Contact[];
  links: LinkItem[]; updatedAt: string;
  createdByEmail: string;
  tags: string; specificUrl: string;
  // ★ 신규 — 소속/대상 관계사
  company: string[];
  platformScope: "unset" | "company-wide" | "specific";
  // n8n / 나만의 비서 전용
  nodes?: string[]; connectedApps?: string[];
  expectedTimeSaved?: string; difficulty?: string;
  // AI Agent 전용
  provider?: string; contextWindow?: string; strengths?: string; costTier?: string;
};

type ManagedItem = ManagedProjectItem | ManagedPlatformItem;
const isProjectKind = (i: ManagedItem): i is ManagedProjectItem => i.kind === "project";

// ★ 신규 — 권한 판정용: 항목에서 관계사 집합·전사공용 여부 도출 (AdminReview.tsx와 동일 규칙)
const itemCompaniesOf = (item: ManagedItem): string[] =>
  isProjectKind(item) ? item.orgEntries.map(e => e.company) : item.company;
const itemIsCompanyWideOf = (item: ManagedItem): boolean =>
  isProjectKind(item) ? false : item.platformScope === "company-wide";

let orgEntryIdSeq = 2000;

const orgEntryDisplay = (e: OrgEntry) => {
  const companyName = COMPANIES.find(c => c.code === e.company)?.name ?? e.company;
  if (!e.parent) return companyName;
  if (!e.dept) return `${companyName} > ${e.parent}`;
  return `${companyName} > ${e.parent} > ${e.dept}`;
};

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  project: { color: "#475569", bg: "#F1F5F9", label: "프로젝트" },
  ...Object.fromEntries(PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])),
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 7,
  padding: "9px 12px", fontSize: 13, color: "#0F172A",
  background: "#fff", outline: "none", boxSizing: "border-box",
};

const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32 };

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

// ★ 변경 — 관계사 닫힌 멀티셀렉트 드롭다운 (모듈 레벨, AdminReview.tsx와 동일한 권한 제한 패턴)
//   allowedCodes: 토글 허용 관계사 화이트리스트(관계사관리자는 담당 관계사). undefined = 전체 허용(전사관리자).
//   allowCompanyWide: 전사 공용 선택 허용 여부. 관계사관리자는 false(권한 밖 승격 방지).
//   닫힌 버튼은 inputStyle + cursor:pointer (이중 화살표 버그 방지).
function CompanyMultiSelect({ selected, onChange, disabled, allowedCodes, allowCompanyWide = true }: {
  selected: string[]; onChange: (codes: string[]) => void; disabled?: boolean;
  allowedCodes?: string[]; allowCompanyWide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isCompanyWide = selected.length === 0;

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

// ===== 목업 데이터 =====
const INITIAL_PROJECTS: ManagedProjectItem[] = [
  {
    kind: "project",
    id: "PRJ-2025-038", title: "통합 정산 자동화 시스템", dept: "재무팀", status: "운영 중",
    domain: ["재무/회계"], domainOther: "", type: "데이터 파이프라인", typeOther: "",
    stack: ["Python", "Airflow", "PostgreSQL"], audience: ["내부 직원 전체"],
    orgEntries: [{ id: 1, company: "KKM", parent: "경영지원본부", dept: "재무팀" }],
    integrations: "ERP (SAP)", freeTags: "정산, 회계자동화",
    summary: "월 단위 정산 프로세스를 자동화하여 처리 시간을 단축",
    description: "기존 수기 정산 프로세스를 ERP 데이터 기반으로 자동화하여 정산 오류를 줄이고 처리 시간을 단축합니다.",
    contacts: [{ name: "김민재", dept: "재무팀", role: "주담당자", email: "minjae.kim@kolmar.co.kr" }],
    links: [], updatedAt: "2025.05.12",
    createdByEmail: "minjae.kim@kolmar.co.kr",
  },
  {
    kind: "project",
    id: "PRJ-2025-070", title: "고객 문의 분류 ML 모델", dept: "고객서비스팀", status: "개발 중",
    domain: ["고객 서비스"], domainOther: "", type: "ML/AI 모델", typeOther: "",
    stack: ["Python", "FastAPI", "AWS"], audience: ["내부 직원 전체"],
    orgEntries: [{ id: 2, company: "KKM", parent: "경영지원본부", dept: "고객서비스팀" }],
    integrations: "", freeTags: "고객문의, 분류모델",
    summary: "고객 문의 내용을 자동으로 분류하여 담당 부서로 라우팅",
    description: "고객센터로 접수되는 문의를 자연어 처리 모델로 분류하여 적절한 담당 부서에 자동으로 배분합니다.",
    contacts: [{ name: "이하늘", dept: "고객서비스팀", role: "주담당자", email: "haneul.lee@kolmar.co.kr" }],
    links: [], updatedAt: "2025.05.28",
    createdByEmail: "haneul.lee@kolmar.co.kr",
  },
];

// ★ 변경 — company/platformScope 값 채움
const INITIAL_PLATFORM_ITEMS: ManagedPlatformItem[] = [
  {
    kind: "n8n",
    id: "N8N-001", title: "신규 입사자 계정 자동 생성", dept: "IT인프라팀", status: "운영 중",
    summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성",
    description: "HR 시스템에 신규 입사자가 등록되면 Active Directory 계정, Teams 채널 초대, 사내 이메일 계정을 자동으로 생성하고 담당 부서에 알림을 발송합니다.",
    contacts: [{ name: "이서현", dept: "IT인프라팀", role: "주담당자", email: "seohyun.lee@kolmar.co.kr" }],
    links: [], updatedAt: "2025.06.05",
    createdByEmail: "seohyun.lee@kolmar.co.kr",
    tags: "HR, 계정자동화, 온보딩", specificUrl: "https://n8n.kolmar.co.kr/workflow/001",
    company: ["KKM"], platformScope: "specific",
    nodes: ["Webhook", "Set (Edit Fields)", "Microsoft Teams"], connectedApps: ["Microsoft Teams", "Microsoft Outlook"],
    expectedTimeSaved: "주 3시간", difficulty: "보통",
  },
  {
    kind: "ai-orchestration",
    id: "AIO-002", title: "Claude (문서 분석 특화)", dept: "IT개발팀", status: "운영 중",
    summary: "긴 문서 분석과 정밀한 추론에 강한 Anthropic Claude 모델",
    description: "긴 컨텍스트가 필요한 계약서 검토, 보고서 분석, 복잡한 추론 작업에 적합합니다.",
    contacts: [{ name: "정태영", dept: "IT개발팀", role: "주담당자", email: "taeyoung.jung@kolmar.co.kr" }],
    links: [], updatedAt: "2025.06.12",
    createdByEmail: "taeyoung.jung@kolmar.co.kr",
    tags: "문서분석, 긴컨텍스트, 법무", specificUrl: "https://ai-gateway.kolmar.co.kr/models/claude",
    company: [], platformScope: "company-wide",
    provider: "Anthropic", contextWindow: "200K", strengths: "긴 컨텍스트, 정밀 추론, 안전성", costTier: "보통",
  },
];

const EMPTY_PROJECT: ManagedProjectItem = {
  kind: "project",
  id: "", title: "", summary: "", description: "", status: "개발 중",
  type: "웹 애플리케이션", typeOther: "", domain: [], domainOther: "",
  stack: [], audience: [], orgEntries: [], integrations: "", freeTags: "",
  contacts: [{ name: "", dept: "", role: "주담당자", email: "" }], links: [], dept: "", updatedAt: "",
  createdByEmail: "",
};

// ★ 변경 — company/platformScope 초기값 추가 (신규 등록 시 "unset"으로 시작 → 관리자가 직접 등록할 때도 명시적 선택 유도)
const emptyPlatformItem = (kind: PlatformId): ManagedPlatformItem => ({
  kind,
  id: "", title: "", summary: "", description: "", status: "개발 중", dept: "",
  contacts: [{ name: "", dept: "", role: "주담당자", email: "" }], links: [], updatedAt: "",
  createdByEmail: "",
  tags: "", specificUrl: "",
  company: [], platformScope: "unset",
  nodes: kind === "n8n" || kind === "assistant" ? [] : undefined,
  connectedApps: kind === "n8n" || kind === "assistant" ? [] : undefined,
  expectedTimeSaved: kind === "n8n" || kind === "assistant" ? "" : undefined,
  difficulty: kind === "n8n" || kind === "assistant" ? "보통" : undefined,
  provider: kind === "ai-orchestration" ? "" : undefined,
  contextWindow: kind === "ai-orchestration" ? "" : undefined,
  strengths: kind === "ai-orchestration" ? "" : undefined,
  costTier: kind === "ai-orchestration" ? "보통" : undefined,
});

const idPrefixOf = (kind: PlatformId): string =>
  kind === "n8n" ? "N8N" : kind === "assistant" ? "AST" : "AIO";

export default function AdminProjectManage() {
  // ★ 신규 — 현재 관리자 권한 컨텍스트
  const { isGlobalAdmin, managedCompanies, canManageItem } = useAuth();

  const [items, setItems] = useState<ManagedItem[]>([...INITIAL_PROJECTS, ...INITIAL_PLATFORM_ITEMS]);
  const [selected, setSelected] = useState<string>(INITIAL_PROJECTS[0]?.id ?? "");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<ManagedItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [, setNewKind] = useState<"project" | PlatformId>("project");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [sourceFilter, setSourceFilter] = useState<"전체" | "project" | PlatformId>("전체");
  const [saved, setSaved] = useState(false);

  const [draftCompany, setDraftCompany] = useState(COMPANIES[1].code);
  const [draftParent, setDraftParent] = useState(NO_PARENT);
  const [draftDept, setDraftDept] = useState("");

  // ★ 신규 — 권한 판정. 항상 "원본 항목" 기준으로 판정해 편집을 통한 우회를 차단.
  const canManageManagedItem = (item: ManagedItem): boolean =>
    canManageItem(itemCompaniesOf(item), itemIsCompanyWideOf(item));

  // 관계사 편집 허용 범위 — 전사관리자는 전체(undefined), 관계사관리자는 담당 관계사로 제한.
  const companyEditAllowed = isGlobalAdmin ? undefined : managedCompanies;

  // orgEntry 추가용 관계사 선택지 — 관계사관리자는 담당 관계사로 제한 (코드 기준 교집합)
  const orgCompanyChoices = isGlobalAdmin
    ? COMPANIES
    : COMPANIES.filter(c => managedCompanies.includes(c.code));

  const SOURCE_OPTIONS: { key: "전체" | "project" | PlatformId; label: string }[] = [
    { key: "전체", label: "전체" },
    { key: "project", label: "프로젝트" },
    ...PLATFORMS.map(p => ({ key: p.id, label: p.name })),
  ];

  const filtered = items.filter(i =>
    (sourceFilter === "전체" || i.kind === sourceFilter) &&
    (filterStatus === "전체" || i.status === filterStatus) &&
    (search === "" || i.title.includes(search) || i.dept.includes(search))
  );

  const activeItem = isNew ? editData : items.find(i => i.id === selected) ?? null;
  const displayData = editMode || isNew ? editData : activeItem;
  const isEditing = editMode || isNew;

  // ★ 신규 — 현재 선택 항목 관리 가능 여부 (신규 등록은 항상 가능)
  const canManageCurrent = isNew ? true : (activeItem ? canManageManagedItem(activeItem) : false);

  // ★ 신규 — orgEntry 추가 시 기본 선택 관계사를 권한 범위 내로 보정
  const ensureDraftCompanyInScope = () => {
    if (!isGlobalAdmin && orgCompanyChoices.length > 0 && !orgCompanyChoices.some(c => c.code === draftCompany)) {
      setDraftCompany(orgCompanyChoices[0].code);
      setDraftParent(NO_PARENT);
      setDraftDept("");
    }
  };

  const startEdit = () => {
    if (activeItem && canManageManagedItem(activeItem)) {
      setEditData({ ...activeItem });
      setEditMode(true);
      setSaved(false);
      ensureDraftCompanyInScope();
    }
  };

  const startNew = (kind: "project" | PlatformId) => {
    setNewKind(kind);
    if (kind === "project") {
      // 관계사관리자는 담당 관계사로 draft 기본값 보정
      if (!isGlobalAdmin && orgCompanyChoices.length > 0) {
        setDraftCompany(orgCompanyChoices[0].code);
        setDraftParent(NO_PARENT);
        setDraftDept("");
      }
      setEditData({ ...EMPTY_PROJECT, id: `PRJ-2025-0${Math.floor(Math.random() * 90 + 10)}` });
    } else {
      setEditData({ ...emptyPlatformItem(kind), id: `${idPrefixOf(kind)}-2025-0${Math.floor(Math.random() * 90 + 10)}` });
    }
    setIsNew(true); setEditMode(false); setSaved(false);
  };

  const cancelEdit = () => { setEditMode(false); setIsNew(false); setEditData(null); setSaved(false); };

  const setF = (k: keyof ManagedProjectItem | keyof ManagedPlatformItem, v: unknown) =>
    setEditData(p => p ? { ...p, [k]: v } as ManagedItem : p);

  const toggleMulti = (k: "domain" | "stack" | "audience", v: string) =>
    setEditData(p => {
      if (!p || !isProjectKind(p)) return p;
      const cur = p[k];
      return { ...p, [k]: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] };
    });

  // ★ 변경 — 관계사 변경 핸들러. 관계사관리자는 전사 공용(빈 배열) 승격 차단.
  const setPlatformCompanies = (codes: string[]) => {
    if (!isGlobalAdmin && codes.length === 0) return;
    setEditData(p => {
      if (!p || isProjectKind(p)) return p;
      return { ...p, company: codes, platformScope: codes.length === 0 ? "company-wide" : "specific" };
    });
  };

  const addOrgEntry = () => {
    if (!editData || !isProjectKind(editData)) return;
    // 관계사관리자는 담당 관계사만 orgEntry로 추가 가능
    if (!isGlobalAdmin && !managedCompanies.includes(draftCompany)) return;
    const newEntry: OrgEntry = {
      id: orgEntryIdSeq++,
      company: draftCompany,
      parent: draftParent === NO_PARENT ? null : draftParent,
      dept: draftDept || null,
    };
    const isDuplicate = editData.orgEntries.some(e => e.company === newEntry.company && e.parent === newEntry.parent && e.dept === newEntry.dept);
    if (isDuplicate) return;
    setF("orgEntries", [...editData.orgEntries, newEntry]);
    setDraftParent(NO_PARENT);
    setDraftDept("");
  };

  const removeOrgEntry = (id: number) => {
    if (!editData || !isProjectKind(editData)) return;
    setF("orgEntries", editData.orgEntries.filter(e => e.id !== id));
  };

  const availableParents = PARENTS_BY_COMPANY[draftCompany] ?? [];
  const availableDepts = draftParent !== NO_PARENT ? (DEPTS_BY_PARENT[draftParent] ?? []) : [];

  const addNode = (v: string) => {
    if (!editData || isProjectKind(editData)) return;
    const cur = editData.nodes ?? [];
    if (!cur.includes(v)) setF("nodes", [...cur, v]);
  };
  const removeNode = (v: string) => {
    if (!editData || isProjectKind(editData)) return;
    setF("nodes", (editData.nodes ?? []).filter(n => n !== v));
  };
  const addApp = (v: string) => {
    if (!editData || isProjectKind(editData)) return;
    const cur = editData.connectedApps ?? [];
    if (!cur.includes(v)) setF("connectedApps", [...cur, v]);
  };
  const removeApp = (v: string) => {
    if (!editData || isProjectKind(editData)) return;
    setF("connectedApps", (editData.connectedApps ?? []).filter(a => a !== v));
  };

  const addContact = () => {
    if (!editData) return;
    setF("contacts", [...editData.contacts, { name: "", dept: "", role: "공동담당자", email: "" }]);
  };
  const removeContact = (i: number) => {
    if (!editData) return;
    setF("contacts", editData.contacts.filter((_, ci) => ci !== i));
  };
  const setContact = (i: number, k: keyof Contact, v: string) => {
    if (!editData) return;
    setF("contacts", editData.contacts.map((c, ci) => ci === i ? { ...c, [k]: v } : c));
  };

  const handleSave = () => {
    if (!editData) return;
    // ★ 신규 — 신규 등록이 아닌 기존 항목 수정은 권한 범위 내에서만 저장 (이중 안전장치)
    if (!isNew && !canManageManagedItem(editData)) return;
    // 관계사관리자가 플랫폼 항목을 전사 공용으로 저장하려는 경우 차단
    if (!isGlobalAdmin && !isProjectKind(editData) && editData.platformScope === "company-wide") return;
    // TODO: 실제 연동 시
    //   kind === "project" → isNew: POST /api/v1/admin/projects, 아니면 PUT /api/v1/admin/projects/:id
    //   그 외 → isNew: POST /api/v1/admin/platform-items, 아니면 PUT /api/v1/admin/platform-items/:id (body에 company, platformScope 포함)
    if (isNew) {
      setItems(p => [{ ...editData, updatedAt: "2025.06.29" }, ...p]);
      setSelected(editData.id);
    } else {
      setItems(p => p.map(i => i.id === editData.id ? ({ ...editData, updatedAt: "2025.06.29" } as ManagedItem) : i));
    }
    setEditMode(false); setIsNew(false); setEditData(null); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = (id: string) => {
    // ★ 신규 — 삭제도 권한 범위 내에서만 (이중 안전장치)
    const target = items.find(i => i.id === id);
    if (target && !canManageManagedItem(target)) { setDeleteConfirm(null); return; }
    setItems(p => p.filter(i => i.id !== id));
    setDeleteConfirm(null);
    const remaining = items.filter(i => i.id !== id);
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, display: "flex", minWidth: 0, minHeight: "calc(100vh - 56px)" }}>

          {/* ===== 좌측: 통합 목록 ===== */}
          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>전체 항목 <span style={{ color: "#94A3B8", fontWeight: 500 }}>{items.length}</span></span>

                <div style={{ position: "relative" }}>
                  <select
                    value=""
                    onChange={e => { if (e.target.value) startNew(e.target.value as "project" | PlatformId); }}
                    style={{
                      background: "#2563EB", color: "#fff", border: "none", borderRadius: 6,
                      padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      appearance: "none",
                    }}
                  >
                    <option value="" disabled>+ 직접 등록</option>
                    <option value="project">프로젝트</option>
                    {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* ★ 신규 — 관계사관리자 안내 배너 */}
              {!isGlobalAdmin && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, padding: "7px 10px", marginBottom: 8, fontSize: 10.5, color: "#1E40AF", lineHeight: 1.5 }}>
                  담당 관계사 항목만 수정·삭제할 수 있습니다. 범위 밖 항목은 열람만 가능합니다.
                </div>
              )}

              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="항목명, 부서 검색" style={{ ...inputStyle, padding: "7px 12px", fontSize: 12, marginBottom: 8 }} />

              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {SOURCE_OPTIONS.map(opt => {
                  const style = opt.key === "전체" ? null : SOURCE_STYLE[opt.key];
                  return (
                    <button key={opt.key} onClick={() => setSourceFilter(opt.key)} style={{
                      padding: "3px 10px", borderRadius: 20, border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer",
                      background: sourceFilter === opt.key ? "#0F172A" : "#F1F5F9",
                      color: sourceFilter === opt.key ? "#fff" : "#64748B",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {style && <span style={{ width: 6, height: 6, borderRadius: 1.5, background: sourceFilter === opt.key ? "#fff" : style.color, display: "inline-block" }} />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["전체", ...STATUSES].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{
                    padding: "3px 9px", borderRadius: 20, border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer",
                    background: filterStatus === s ? "#0F172A" : "#F1F5F9",
                    color: filterStatus === s ? "#fff" : "#64748B",
                  }}>{s}</button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ padding: "40px 16px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>검색 결과가 없습니다.</div>
              )}
              {filtered.map(item => {
                const style = SOURCE_STYLE[item.kind === "project" ? "project" : item.kind];
                // platformScope가 unset인 항목은 경고 배지 표시
                const needsAttention = !isProjectKind(item) && item.platformScope === "unset";
                // ★ 신규 — 담당 범위 밖 항목은 "권한 범위 외" 배지
                const outOfScopeItem = !canManageManagedItem(item);
                return (
                  <div
                    key={item.id}
                    onClick={() => { setSelected(item.id); setEditMode(false); setIsNew(false); setEditData(null); }}
                    style={{
                      padding: "12px 14px", borderBottom: "1px solid #F8FAFC", cursor: "pointer",
                      background: selected === item.id && !isNew ? "#EFF6FF" : "#fff",
                      borderLeft: `3px solid ${selected === item.id && !isNew ? "#2563EB" : "transparent"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: style.bg, color: style.color, padding: "2px 7px", borderRadius: 10 }}>{style.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: STATUS_COLOR[item.status]?.bg, color: STATUS_COLOR[item.status]?.color, padding: "2px 7px", borderRadius: 10 }}>{item.status}</span>
                      {needsAttention && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626" }}>관계사 미지정</span>
                      )}
                      {outOfScopeItem && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", background: "#E2E8F0", padding: "2px 7px", borderRadius: 10 }}>권한 범위 외</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: outOfScopeItem ? 0.55 : 1 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{item.dept} · {item.updatedAt}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== 우측: 상세/편집 패널 ===== */}
          <div style={{ flex: 1, minWidth: 0, padding: "24px 32px", overflowY: "auto" }}>
            {!displayData ? (
              <div style={{ padding: 60, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>좌측에서 항목을 선택하세요.</div>
            ) : (
              <div style={{ maxWidth: 720, margin: "0 auto" }}>

                {saved && (
                  <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "#065F46", marginBottom: 16 }}>
                    저장되었습니다.
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: SOURCE_STYLE[displayData.kind === "project" ? "project" : displayData.kind].bg,
                        color: SOURCE_STYLE[displayData.kind === "project" ? "project" : displayData.kind].color,
                        padding: "3px 9px", borderRadius: 20,
                      }}>
                        {SOURCE_STYLE[displayData.kind === "project" ? "project" : displayData.kind].label}
                      </span>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>{displayData.id}</span>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0 }}>
                      {isEditing ? (
                        <input value={displayData.title} onChange={e => setF("title", e.target.value)} placeholder="제목 입력"
                          style={{ ...inputStyle, fontSize: 17, fontWeight: 800, padding: "6px 10px" }} />
                      ) : displayData.title}
                    </h2>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {!isEditing ? (
                      // ★ 변경 — 권한 범위 내에서만 수정·삭제 버튼 노출
                      canManageCurrent ? (
                        <>
                          <button onClick={startEdit} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>수정</button>
                          <button onClick={() => setDeleteConfirm(displayData.id)} style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
                        </>
                      ) : null
                    ) : (
                      <>
                        <button onClick={cancelEdit} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>취소</button>
                        <button onClick={handleSave} style={{ background: "#2563EB", border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>저장</button>
                      </>
                    )}
                  </div>
                </div>

                {/* ★ 신규 — 권한 범위 밖 항목 열람 안내 */}
                {!isEditing && !canManageCurrent && (
                  <div style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                    이 항목의 대상 관계사가 담당 관계사 범위에 포함되지 않습니다. 내용은 열람할 수 있으나 수정·삭제는 담당 관리자만 가능합니다.
                    {activeItem && itemIsCompanyWideOf(activeItem) && " 전사 공용 항목은 전사관리자만 관리할 수 있습니다."}
                  </div>
                )}

                {deleteConfirm === displayData.id && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>이 항목을 삭제하시겠습니까?</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>삭제된 항목은 복구할 수 없습니다.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                      <button onClick={() => handleDelete(displayData.id)} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>삭제 확인</button>
                    </div>
                  </div>
                )}

                {/* ===== 공통: 기본 정보 ===== */}
                <SectionBlock title="기본 정보">
                  <FieldRow label="한 줄 요약">
                    {isEditing
                      ? <input value={displayData.summary} onChange={e => setF("summary", e.target.value)} style={inputStyle} />
                      : <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{displayData.summary}</div>}
                  </FieldRow>
                  <FieldRow label="상세 설명">
                    {isEditing
                      ? <textarea value={displayData.description} onChange={e => setF("description", e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.7 }} />
                      : <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.8 }}>{displayData.description}</div>}
                  </FieldRow>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <FieldRow label="상태">
                      {isEditing
                        ? <SingleSelectTag options={isProjectKind(displayData) ? STATUSES : PLATFORM_STATUSES} value={displayData.status} onChange={v => setF("status", v)} />
                        : <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: STATUS_COLOR[displayData.status]?.bg, color: STATUS_COLOR[displayData.status]?.color }}>{displayData.status}</span>}
                    </FieldRow>
                    <FieldRow label="등록 부서">
                      {isEditing
                        ? <input value={displayData.dept} onChange={e => setF("dept", e.target.value)} style={inputStyle} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.dept || "—"}</span>}
                    </FieldRow>
                  </div>
                </SectionBlock>

                {/* ===== 분기: 프로젝트 — 분류 정보 ===== */}
                {isProjectKind(displayData) && (
                  <SectionBlock title="분류 정보">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                      <FieldRow label="시스템 유형">
                        {isEditing
                          ? (
                            <>
                              <select value={displayData.type} onChange={e => setF("type", e.target.value)} style={selectStyle}>{SYSTEM_TYPES.map(s => <option key={s}>{s}</option>)}</select>
                              {displayData.type === "기타" && (
                                <input value={displayData.typeOther} onChange={e => setF("typeOther", e.target.value)}
                                  placeholder="기타 시스템 유형 입력" style={{ ...inputStyle, marginTop: 8, borderColor: "#BFDBFE", background: "#EFF6FF" }} />
                              )}
                            </>
                          )
                          : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.type === "기타" && displayData.typeOther ? `기타 (${displayData.typeOther})` : displayData.type}</span>}
                      </FieldRow>
                      <FieldRow label="비즈니스 도메인">
                        {isEditing
                          ? (
                            <>
                              <TagSelect options={DOMAINS} selected={displayData.domain} onChange={v => toggleMulti("domain", v)} />
                              {displayData.domain.includes("기타") && (
                                <input value={displayData.domainOther} onChange={e => setF("domainOther", e.target.value)}
                                  placeholder="기타 비즈니스 도메인 입력" style={{ ...inputStyle, marginTop: 8, borderColor: "#BFDBFE", background: "#EFF6FF" }} />
                              )}
                            </>
                          )
                          : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{displayData.domain.map((d, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{d === "기타" && displayData.domainOther ? `기타 (${displayData.domainOther})` : d}</span>)}</div>}
                      </FieldRow>
                    </div>

                    <FieldRow label="참여 관계사 / 본부 / 부서">
                      {displayData.orgEntries.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: isEditing ? 10 : 0 }}>
                          {displayData.orgEntries.map(e => (
                            isEditing ? (
                              <div key={e.id} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6,
                                padding: "7px 11px",
                              }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#1E40AF" }}>{orgEntryDisplay(e)}</span>
                                <button onClick={() => removeOrgEntry(e.id)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                              </div>
                            ) : (
                              <span key={e.id} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6, display: "inline-block", marginRight: 6, marginBottom: 6 }}>
                                {orgEntryDisplay(e)}
                              </span>
                            )
                          ))}
                        </div>
                      )}

                      {isEditing && (
                        <div style={{ background: "#F8FAFC", border: "1.5px dashed #CBD5E1", borderRadius: 7, padding: "12px 14px" }}>
                          {/* ★ 변경 — 관계사관리자는 담당 관계사만 선택 가능 */}
                          {!isGlobalAdmin && orgCompanyChoices.length === 0 ? (
                            <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", padding: "6px 0" }}>
                              담당 관계사가 등록되어 있지 않아 조직을 추가할 수 없습니다.
                            </div>
                          ) : (
                            <>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                                <select value={draftCompany} onChange={e => { setDraftCompany(e.target.value); setDraftParent(NO_PARENT); setDraftDept(""); }} style={{ ...selectStyle, fontSize: 11, padding: "7px 26px 7px 8px" }}>
                                  {orgCompanyChoices.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                </select>
                                <select value={draftParent} onChange={e => { setDraftParent(e.target.value); setDraftDept(""); }} style={{ ...selectStyle, fontSize: 11, padding: "7px 26px 7px 8px" }}>
                                  <option value={NO_PARENT}>본부 없음</option>
                                  {availableParents.map(p => <option key={p}>{p}</option>)}
                                </select>
                                <select value={draftDept} onChange={e => setDraftDept(e.target.value)} disabled={draftParent === NO_PARENT} style={{ ...selectStyle, fontSize: 11, padding: "7px 26px 7px 8px", opacity: draftParent === NO_PARENT ? 0.5 : 1 }}>
                                  <option value="">부서 선택 안 함</option>
                                  {availableDepts.map(d => <option key={d}>{d}</option>)}
                                </select>
                              </div>
                              <button onClick={addOrgEntry} style={{ width: "100%", background: "#2563EB", color: "#fff", border: "none", borderRadius: 5, padding: "6px 0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                + 추가
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {!isEditing && displayData.orgEntries.length === 0 && (
                        <span style={{ fontSize: 13, color: "#94A3B8" }}>—</span>
                      )}
                    </FieldRow>

                    <FieldRow label="사용 대상">
                      {isEditing
                        ? <TagSelect options={AUDIENCES} selected={displayData.audience} onChange={v => toggleMulti("audience", v)} />
                        : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{displayData.audience.map((a, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{a}</span>)}</div>}
                    </FieldRow>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <FieldRow label="연동 시스템">
                        {isEditing
                          ? <input value={displayData.integrations} onChange={e => setF("integrations", e.target.value)} style={inputStyle} />
                          : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.integrations || "—"}</span>}
                      </FieldRow>
                      <FieldRow label="자유 태그">
                        {isEditing
                          ? <input value={displayData.freeTags} onChange={e => setF("freeTags", e.target.value)} style={inputStyle} />
                          : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.freeTags || "—"}</span>}
                      </FieldRow>
                    </div>
                  </SectionBlock>
                )}

                {/* ===== 분기: 프로젝트 — 기술 스택 ===== */}
                {isProjectKind(displayData) && (
                  <SectionBlock title="기술 스택">
                    {isEditing
                      ? Object.entries(STACK_GROUPS).map(([group, stackItems]) => (
                          <FieldRow key={group} label={group}>
                            <TagSelect options={stackItems} selected={displayData.stack} onChange={v => toggleMulti("stack", v)} />
                          </FieldRow>
                        ))
                      : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {displayData.stack.map((s, i) => (
                            <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1E40AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #BFDBFE" }}>{s}</span>
                          ))}
                        </div>}
                  </SectionBlock>
                )}

                {/* ===== 분기: n8n / 나만의 비서 — 동작 정보 ===== */}
                {(displayData.kind === "n8n" || displayData.kind === "assistant") && (
                  <>
                    <SectionBlock title={`${SOURCE_STYLE[displayData.kind].label} 동작 정보`}>
                      {/* 소속/대상 관계사 — 권한 범위 제한 적용 */}
                      <FieldRow label="소속 / 대상 관계사">
                        {isEditing
                          ? (
                            <>
                              <CompanyMultiSelect
                                selected={displayData.company}
                                onChange={setPlatformCompanies}
                                allowedCodes={companyEditAllowed}
                                allowCompanyWide={isGlobalAdmin}
                              />
                              {displayData.platformScope === "unset" && (
                                <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>관계사 범위가 선택되지 않았습니다. 해당 관계사를 선택해주세요.</div>
                              )}
                            </>
                          )
                          : (
                            displayData.platformScope === "unset"
                              ? <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>관계사 미지정</span>
                              : <span style={{ fontSize: 13, color: "#334155" }}>{platformCompanyDisplay(displayData.company)}</span>
                          )}
                      </FieldRow>

                      <FieldRow label="실행 URL">
                        {isEditing
                          ? <input value={displayData.specificUrl} onChange={e => setF("specificUrl", e.target.value)} style={inputStyle} />
                          : <a href={displayData.specificUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>{displayData.specificUrl}</a>}
                      </FieldRow>
                      <FieldRow label="태그">
                        {isEditing
                          ? <input value={displayData.tags} onChange={e => setF("tags", e.target.value)} style={inputStyle} placeholder="쉼표로 구분하여 입력" />
                          : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {displayData.tags.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => (
                                <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{t}</span>
                              ))}
                            </div>}
                      </FieldRow>
                    </SectionBlock>

                    <SectionBlock title="노드 구성">
                      <FieldRow label="사용된 노드">
                        {isEditing
                          ? <ChipEditor items={displayData.nodes ?? []} onAdd={addNode} onRemove={removeNode} suggestions={NODE_SUGGESTIONS} placeholder="노드명 입력 후 Enter" />
                          : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {(displayData.nodes ?? []).map((n, i) => (
                                <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1E40AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #BFDBFE" }}>{n}</span>
                              ))}
                            </div>}
                      </FieldRow>
                      <FieldRow label="연동 앱·서비스">
                        {isEditing
                          ? <ChipEditor items={displayData.connectedApps ?? []} onAdd={addApp} onRemove={removeApp} suggestions={APP_SUGGESTIONS} placeholder="연동 앱명 입력 후 Enter" />
                          : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {(displayData.connectedApps ?? []).map((a, i) => (
                                <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{a}</span>
                              ))}
                            </div>}
                      </FieldRow>
                    </SectionBlock>

                    <SectionBlock title="예상 효과">
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <FieldRow label="예상 절감 시간">
                          {isEditing
                            ? <input value={displayData.expectedTimeSaved ?? ""} onChange={e => setF("expectedTimeSaved", e.target.value)} style={inputStyle} placeholder="예: 주 1시간" />
                            : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.expectedTimeSaved || "—"}</span>}
                        </FieldRow>
                        <FieldRow label="구성 난이도">
                          {isEditing
                            ? <SingleSelectTag options={DIFFICULTY_LEVELS} value={displayData.difficulty ?? "보통"} onChange={v => setF("difficulty", v)} />
                            : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.difficulty || "—"}</span>}
                        </FieldRow>
                      </div>
                    </SectionBlock>
                  </>
                )}

                {/* ===== 분기: AI Agent — 모델 사양 ===== */}
                {displayData.kind === "ai-orchestration" && (
                  <SectionBlock title="모델 사양">
                    {/* 소속/대상 관계사 — 권한 범위 제한 적용 */}
                    <FieldRow label="소속 / 대상 관계사">
                      {isEditing
                        ? (
                          <>
                            <CompanyMultiSelect
                              selected={displayData.company}
                              onChange={setPlatformCompanies}
                              allowedCodes={companyEditAllowed}
                              allowCompanyWide={isGlobalAdmin}
                            />
                            {displayData.platformScope === "unset" && (
                              <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>관계사 범위가 선택되지 않았습니다. 해당 관계사를 선택해주세요.</div>
                            )}
                          </>
                        )
                        : (
                          displayData.platformScope === "unset"
                            ? <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>관계사 미지정</span>
                            : <span style={{ fontSize: 13, color: "#334155" }}>{platformCompanyDisplay(displayData.company)}</span>
                        )}
                    </FieldRow>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <FieldRow label="제공사">
                        {isEditing
                          ? <input value={displayData.provider ?? ""} onChange={e => setF("provider", e.target.value)} style={inputStyle} />
                          : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.provider || "—"}</span>}
                      </FieldRow>
                      <FieldRow label="컨텍스트 윈도우">
                        {isEditing
                          ? <input value={displayData.contextWindow ?? ""} onChange={e => setF("contextWindow", e.target.value)} style={inputStyle} />
                          : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.contextWindow || "—"}</span>}
                      </FieldRow>
                    </div>
                    <FieldRow label="비용 등급">
                      {isEditing
                        ? <SingleSelectTag options={COST_TIERS} value={displayData.costTier ?? "보통"} onChange={v => setF("costTier", v)} />
                        : <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#F1F5F9", color: "#475569" }}>{displayData.costTier || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="강점">
                      {isEditing
                        ? <input value={displayData.strengths ?? ""} onChange={e => setF("strengths", e.target.value)} style={inputStyle} placeholder="쉼표로 구분하여 입력" />
                        : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {(displayData.strengths ?? "").split(",").map(s => s.trim()).filter(Boolean).map((s, i) => (
                              <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{s}</span>
                            ))}
                          </div>}
                    </FieldRow>
                    <FieldRow label="모델 접속 URL">
                      {isEditing
                        ? <input value={displayData.specificUrl} onChange={e => setF("specificUrl", e.target.value)} style={inputStyle} />
                        : <a href={displayData.specificUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>{displayData.specificUrl}</a>}
                    </FieldRow>
                    <FieldRow label="태그">
                      {isEditing
                        ? <input value={displayData.tags} onChange={e => setF("tags", e.target.value)} style={inputStyle} placeholder="쉼표로 구분하여 입력" />
                        : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {displayData.tags.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => (
                              <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{t}</span>
                            ))}
                          </div>}
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 공통: 등록 신청자 정보 ===== */}
                <SectionBlock title="등록 신청자 정보">
                  {!isEditing && (
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 11, color: "#64748B" }}>
                      퇴사·인사이동 등으로 신청자 계정 정보가 바뀐 경우 여기서 직접 수정하세요. 최초 신청 시점의 원본 정보와 다를 수 있습니다.
                    </div>
                  )}
                  <FieldRow label="신청자 이메일 (createdByEmail)">
                    {isEditing
                      ? <input value={displayData.createdByEmail} onChange={e => setF("createdByEmail", e.target.value)} style={inputStyle} placeholder="name@kolmar.co.kr" />
                      : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.createdByEmail || "—"}</span>}
                  </FieldRow>
                </SectionBlock>

                {/* ===== 공통: 담당자 (승인 후에도 관리자가 직접 수정 가능) ===== */}
                <SectionBlock title="담당자">
                  {!isEditing && (
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 11, color: "#64748B" }}>
                      퇴사·인사이동 등으로 담당자 정보가 바뀐 경우 여기서 직접 수정하세요. 신청자가 입력한 원본 정보와 다를 수 있습니다.
                    </div>
                  )}

                  {displayData.contacts.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, marginBottom: 8 }}>
                      {!isEditing ? (
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
                          <input value={c.name} onChange={e => setContact(i, "name", e.target.value)} placeholder="이름" style={{ ...inputStyle, fontSize: 12, padding: "6px 9px" }} />
                          <input value={c.dept} onChange={e => setContact(i, "dept", e.target.value)} placeholder="부서" style={{ ...inputStyle, fontSize: 12, padding: "6px 9px" }} />
                          <input value={c.email} onChange={e => setContact(i, "email", e.target.value)} placeholder="이메일" style={{ ...inputStyle, fontSize: 12, padding: "6px 9px" }} />
                          <select value={c.role} onChange={e => setContact(i, "role", e.target.value)} style={{ ...selectStyle, fontSize: 12, padding: "6px 22px 6px 9px" }}>
                            <option value="주담당자">주담당자</option>
                            <option value="공동담당자">공동담당자</option>
                          </select>
                          {displayData.contacts.length > 1 && (
                            <button onClick={() => removeContact(i)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {isEditing && (
                    <button onClick={addContact} style={{ background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 7, padding: "8px 0", width: "100%", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                      + 담당자 추가
                    </button>
                  )}
                </SectionBlock>

                {/* ===== 공통: 외부 링크 ===== */}
                <SectionBlock title="외부 링크">
                  {displayData.links.length === 0 && !isEditing && (
                    <span style={{ fontSize: 13, color: "#94A3B8" }}>등록된 링크가 없습니다.</span>
                  )}
                  {displayData.links.map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      {isEditing ? (
                        <>
                          <input value={l.label} onChange={e => setF("links", displayData.links.map((ll, li) => li === i ? { ...ll, label: e.target.value } : ll))} placeholder="링크 이름" style={{ ...inputStyle, flex: "0 0 140px", fontSize: 12, padding: "7px 10px" }} />
                          <input value={l.url} onChange={e => setF("links", displayData.links.map((ll, li) => li === i ? { ...ll, url: e.target.value } : ll))} placeholder="https://" style={{ ...inputStyle, flex: 1, fontSize: 12, padding: "7px 10px" }} />
                          <button onClick={() => setF("links", displayData.links.filter((_, li) => li !== i))} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                        </>
                      ) : (
                        <a href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>{l.label || l.url}</a>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button onClick={() => setF("links", [...displayData.links, { label: "", url: "" }])} style={{ background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 7, padding: "8px 0", width: "100%", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                      + 링크 추가
                    </button>
                  )}
                </SectionBlock>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}