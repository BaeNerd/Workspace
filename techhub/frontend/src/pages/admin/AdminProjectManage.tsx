import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { PLATFORMS } from "../../types/platformTypes";
import type { PlatformId } from "../../types/platformTypes";
import { WorkflowEditor, WorkflowDiagram, toWorkflowDef } from "../../components/WorkflowDiagram";
import type { WorkflowInput } from "../../components/WorkflowDiagram";

// ===== AX 플랫폼 공통 상수 =====
const STATUSES = ["운영 중", "개발 중", "파일럿", "보류", "종료"];
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
const PA_CONNECTOR_SUGGESTIONS = [
  "SharePoint", "Microsoft Teams", "Outlook", "Excel Online", "Power BI",
  "Dataverse", "Forms", "Approvals", "Planner", "OneDrive", "SQL Server",
];
const ML_TYPES = [
  "분류 (Classification)", "회귀 (Regression)", "클러스터링",
  "NLP / 텍스트", "이미지 인식", "시계열 예측", "추천 시스템", "이상 탐지", "강화학습", "멀티모달",
];
const VIBE_TOOL_SUGGESTIONS = [
  "GitHub Copilot", "Cursor", "Claude Code", "Codeium", "Tabnine", "Replit AI", "v0", "Bolt",
];

// ===== 예상 절감 시간 정규화 =====
const TIME_PERIODS = ["일", "주", "월", "년"] as const;
type TimePeriod = typeof TIME_PERIODS[number];
const PERIOD_ANNUAL_FACTOR: Record<TimePeriod, number> = { "일": 365, "주": 52, "월": 12, "년": 1 };

const serializeTimeSaved = (value: string, period: TimePeriod): string => {
  const n = value.trim();
  if (n === "" || Number.isNaN(Number(n))) return "";
  return `${period} ${n}시간`;
};

const deserializeTimeSaved = (raw: string | undefined): { value: string; period: TimePeriod } => {
  if (!raw) return { value: "", period: "주" };
  const standard = raw.match(/^\s*(일|주|월|년)\s*([0-9]+(?:\.[0-9]+)?)\s*시간\s*$/);
  if (standard) return { value: standard[2], period: standard[1] as TimePeriod };
  const numMatch = raw.match(/([0-9]+(?:\.[0-9]+)?)/);
  const periodMatch = raw.match(/(일|주|월|년)/);
  if (numMatch) return { value: numMatch[1], period: (periodMatch?.[1] as TimePeriod) ?? "주" };
  return { value: "", period: "주" };
};

const annualHoursText = (value: string, period: TimePeriod): string | null => {
  const n = Number(value);
  if (value.trim() === "" || Number.isNaN(n)) return null;
  const annual = Math.round(n * PERIOD_ANNUAL_FACTOR[period] * 10) / 10;
  return `연간 약 ${annual}시간 (${n}시간 × ${PERIOD_ANNUAL_FACTOR[period]}${period})`;
};

const timeSavedDisplay = (raw: string | undefined): string => {
  if (!raw) return "—";
  const { value, period } = deserializeTimeSaved(raw);
  if (!value) return raw;
  const annual = annualHoursText(value, period);
  return annual ? `${period}당 ${value}시간 · ${annual}` : `${period}당 ${value}시간`;
};

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

type ManagedPlatformItem = {
  kind: PlatformId;
  id: string; title: string; dept: string; status: string;
  summary: string; description: string; contacts: Contact[];
  links: LinkItem[]; updatedAt: string;
  createdByEmail: string;
  tags: string; specificUrl: string;
  company: string[];
  platformScope: "unset" | "company-wide" | "specific";
  // n8n / pa / assistant 전용
  triggerAction?: string;
  nodes?: string[]; connectedApps?: string[];
  expectedTimeSaved?: string; difficulty?: string;
  workflowInput?: WorkflowInput;
  workflowJson?: string;
  // ai-orchestration 전용
  provider?: string; contextWindow?: string; strengths?: string; costTier?: string;
  // ml 전용
  mlType?: string; trainingDataDesc?: string; performanceSummary?: string;
  // ml / vibe 공용
  devTool?: string; sourceRepo?: string; outputType?: string;
};

type ManagedItem = ManagedPlatformItem;

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = Object.fromEntries(
  PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])
);

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
  const commit = () => { const v = draft.trim(); if (!v) return; onAdd(v); setDraft(""); };
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
            {!disabled && <button onClick={() => onRemove(item)} style={{ background: "none", border: "none", color: "#1E40AF", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>}
          </span>
        ))}
      </div>
      {!disabled && (
        <>
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } }} placeholder={placeholder} style={{ ...inputStyle, fontSize: 12, padding: "7px 10px" }} />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
            {suggestions.filter(s => !items.includes(s)).slice(0, 8).map(s => (
              <span key={s} onClick={() => onAdd(s)} style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", padding: "3px 9px", borderRadius: 14, cursor: "pointer" }}>+ {s}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TimeSavedInput = ({ value, period, onValueChange, onPeriodChange, disabled }: {
  value: string; period: TimePeriod;
  onValueChange: (v: string) => void; onPeriodChange: (p: TimePeriod) => void;
  disabled?: boolean;
}) => {
  const annual = annualHoursText(value, period);
  return (
    <div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <select value={period} onChange={e => onPeriodChange(e.target.value as TimePeriod)} disabled={disabled} style={{ ...selectStyle, width: 96, flexShrink: 0, fontSize: 12, padding: "9px 26px 9px 10px" }}>
          {TIME_PERIODS.map(p => <option key={p} value={p}>{p}당</option>)}
        </select>
        <input type="number" min="0" step="0.5" value={value} onChange={e => onValueChange(e.target.value)} disabled={disabled} placeholder="예: 3" style={{ ...inputStyle, flex: 1 }} />
        <span style={{ fontSize: 13, color: "#64748B", flexShrink: 0 }}>시간</span>
      </div>
      {annual
        ? <div style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", marginTop: 6 }}>{annual}</div>
        : <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>주기와 수치를 입력하면 연간 환산값이 표시됩니다.</div>}
    </div>
  );
};

// 관계사 닫힌 멀티셀렉트 드롭다운 (모듈 레벨)
// 모든 관리자가 전체 관계사를 편집 가능
function CompanyMultiSelect({ selected, onChange, disabled }: {
  selected: string[]; onChange: (codes: string[]) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isCompanyWide = selected.length === 0;
  const filteredCompanies = SELECTABLE_COMPANIES.filter(c =>
    search === "" || c.name.includes(search) || c.code.includes(search.toUpperCase())
  );
  const toggleCompany = (code: string) =>
    onChange(selected.includes(code) ? selected.filter(c => c !== code) : [...selected, code]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => !disabled && setOpen(v => !v)}
        type="button"
        disabled={disabled}
        style={{ ...inputStyle, textAlign: "left", width: "100%", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "space-between", color: "#0F172A", fontWeight: 600 }}
      >
        <span>{platformCompanyDisplay(selected)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 8 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: "10px 10px 6px", maxHeight: 340, display: "flex", flexDirection: "column" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", borderRadius: 6, cursor: "pointer", background: isCompanyWide ? "#EFF6FF" : "transparent", marginBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
            <input type="checkbox" checked={isCompanyWide} onChange={() => onChange([])} style={{ cursor: "pointer" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: isCompanyWide ? "#2563EB" : "#334155" }}>전사 공용 (특정 관계사 한정 없음)</span>
          </label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="관계사명 또는 코드로 검색" style={{ ...inputStyle, fontSize: 12, padding: "7px 10px", marginBottom: 6 }} />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filteredCompanies.map(c => (
              <label key={c.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", background: selected.includes(c.code) ? "#EFF6FF" : "transparent" }}>
                <input type="checkbox" checked={selected.includes(c.code)} onChange={() => toggleCompany(c.code)} style={{ cursor: "pointer" }} />
                <span style={{ fontSize: 12, color: "#334155" }}>{c.name}</span>
                <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace", marginLeft: "auto" }}>{c.code}</span>
              </label>
            ))}
            {filteredCompanies.length === 0 && <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>검색 결과가 없습니다.</div>}
          </div>
          <button onClick={() => setOpen(false)} type="button" style={{ marginTop: 8, background: "#0F172A", color: "#fff", border: "none", borderRadius: 6, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>완료</button>
        </div>
      )}
    </div>
  );
}

// TODO: 실제 연동 시 GET /api/v1/admin/platform-items 응답으로 교체
const INITIAL_PLATFORM_ITEMS: ManagedPlatformItem[] = [
  {
    kind: "n8n",
    id: "N8N-001", title: "Outlook 긴급 메일 자동 전달", dept: "IT인프라팀", status: "운영 중",
    summary: "긴급 메일 수신 시 제목 키워드를 확인하여 팀장님께 즉시 자동 전달",
    description: "Outlook에서 메일을 수신하면 제목에 '긴급' 키워드 포함 여부를 자동으로 판별합니다.\n\n긴급 메일로 확인될 경우 팀장님 메일 주소로 즉시 전달하여 빠른 의사결정이 가능하도록 지원합니다.",
    contacts: [{ name: "이서현", dept: "IT인프라팀", role: "주담당자", email: "seohyun.lee@kolmar.co.kr" }],
    links: [], updatedAt: "2025.07.03", createdByEmail: "seohyun.lee@kolmar.co.kr",
    tags: "Outlook, 긴급메일, 자동전달", specificUrl: "https://n8n.kolmar.co.kr/workflow/001",
    company: ["KKM"], platformScope: "specific",
    nodes: ["Outlook Trigger", "IF", "Microsoft Outlook"], connectedApps: ["Microsoft Outlook"],
    triggerAction: "Outlook Trigger → IF(긴급 포함) → Microsoft Outlook 전달",
    expectedTimeSaved: "주 2시간", difficulty: "쉬움",
    workflowInput: {
      status: "Stable",
      nodes: [
        { label: "Outlook Trigger", type: "trigger" },
        { label: "긴급 포함 여부 확인", type: "condition" },
        { label: "팀장님께 메일 전달", type: "output" },
      ],
    },
  },
  {
    kind: "pa",
    id: "PA-001", title: "구매 결재 자동 승인 플로우", dept: "구매팀", status: "개발 중",
    summary: "SharePoint 양식 기반 구매 결재 자동 처리",
    description: "구매팀이 SharePoint에 제출한 결재 요청을 Power Automate가 ERP 데이터와 대조 후 자동 승인·반려합니다.",
    contacts: [{ name: "최유진", dept: "구매팀", role: "주담당자", email: "yujin.choi@kolmar.co.kr" }],
    links: [], updatedAt: "2025.06.25", createdByEmail: "yujin.choi@kolmar.co.kr",
    tags: "결재, 구매자동화", specificUrl: "",
    company: ["KKM"], platformScope: "specific",
    triggerAction: "Form 제출 → Dataverse 조회 → 조건 분기 → 결재 처리",
    connectedApps: ["SharePoint", "Dataverse", "Approvals"],
    expectedTimeSaved: "주 3시간", difficulty: "보통",
  },
  {
    kind: "assistant",
    id: "AST-001", title: "해외법인 계약서 1차 검토 비서", dept: "법무팀", status: "파일럿",
    summary: "해외법인向 영문 계약서의 주요 리스크 조항을 1차 스크리닝",
    description: "미국콜마·북경콜마 등 해외법인에서 체결하는 영문 계약서의 주요 조항을 1차로 스크리닝하여 법무팀 검토 시간을 단축합니다.",
    contacts: [{ name: "강현우", dept: "법무팀", role: "주담당자", email: "hyunwoo.kang@kolmar.co.kr" }],
    links: [], updatedAt: "2025.06.22", createdByEmail: "hyunwoo.kang@kolmar.co.kr",
    tags: "계약서, 법무, 해외법인", specificUrl: "https://assistant.kolmar.co.kr/agents/global-contract-review",
    company: ["KUS", "KMB"], platformScope: "specific",
    nodes: ["Chat Trigger", "AI Agent"], connectedApps: ["Microsoft One Drive"],
    triggerAction: "Chat Trigger → 계약서 업로드 → AI Agent 분석 → 리스크 리포트 출력",
    expectedTimeSaved: "주 5시간", difficulty: "어려움",
  },
  {
    kind: "ai-orchestration",
    id: "AIO-002", title: "Claude (문서 분석 특화)", dept: "IT개발팀", status: "운영 중",
    summary: "긴 문서 분석과 정밀한 추론에 강한 Anthropic Claude 모델",
    description: "긴 컨텍스트가 필요한 계약서 검토, 보고서 분석, 복잡한 추론 작업에 적합합니다.",
    contacts: [{ name: "정태영", dept: "IT개발팀", role: "주담당자", email: "taeyoung.jung@kolmar.co.kr" }],
    links: [], updatedAt: "2025.06.12", createdByEmail: "taeyoung.jung@kolmar.co.kr",
    tags: "문서분석, 긴컨텍스트, 법무", specificUrl: "https://ai-gateway.kolmar.co.kr/models/claude",
    company: [], platformScope: "company-wide",
    provider: "Anthropic", contextWindow: "200K", strengths: "긴 컨텍스트, 정밀 추론, 안전성", costTier: "보통",
  },
  {
    kind: "ml",
    id: "ML-001", title: "성분 이미지 품질 분류 모델", dept: "IT개발팀", status: "파일럿",
    summary: "원료 이미지 기반 품질 합격/불합격 자동 판정",
    description: "YOLOv8 기반 이미지 분류 모델로 생산 라인에서 촬영한 원료 이미지를 실시간 분석합니다.",
    contacts: [{ name: "오승현", dept: "IT개발팀", role: "주담당자", email: "seunghyun.oh@kolmar.co.kr" }],
    links: [], updatedAt: "2025.06.26", createdByEmail: "seunghyun.oh@kolmar.co.kr",
    tags: "품질관리, 이미지분류", specificUrl: "",
    company: ["KKM"], platformScope: "specific",
    mlType: "이미지 인식", trainingDataDesc: "내부 품질 검사 이미지 1만장",
    performanceSummary: "정확도 92.3%, 재현율 89.7%",
    devTool: "PyTorch", sourceRepo: "gitlab.kolmar.co.kr/ml/ingredient-classifier",
    outputType: "합격/불합격 바이너리 분류",
  },
  {
    kind: "vibe",
    id: "VIBE-001", title: "원가 계산 자동화 스크립트", dept: "재무팀", status: "운영 중",
    summary: "Cursor로 작성한 원가 자동 계산 내부 도구",
    description: "Cursor AI를 활용해 Python으로 제작한 원가 계산 자동화 스크립트입니다. 기존 Excel 수작업을 대체하여 처리 시간을 줄였습니다.",
    contacts: [{ name: "박소희", dept: "재무팀", role: "주담당자", email: "sohee.park@kolmar.co.kr" }],
    links: [], updatedAt: "2025.07.01", createdByEmail: "sohee.park@kolmar.co.kr",
    tags: "원가, 재무자동화", specificUrl: "",
    company: ["KKM", "KBH"], platformScope: "specific",
    devTool: "Cursor", sourceRepo: "gitlab.kolmar.co.kr/vibe/cost-calc",
    outputType: "Python CLI 스크립트",
  },
];

const emptyPlatformItem = (kind: PlatformId): ManagedPlatformItem => ({
  kind,
  id: "", title: "", summary: "", description: "", status: "개발 중", dept: "",
  contacts: [{ name: "", dept: "", role: "주담당자", email: "" }], links: [], updatedAt: "",
  createdByEmail: "",
  tags: "", specificUrl: "",
  company: [], platformScope: "unset",
  triggerAction: (kind === "n8n" || kind === "pa" || kind === "assistant") ? "" : undefined,
  nodes: (kind === "n8n" || kind === "pa" || kind === "assistant") ? [] : undefined,
  connectedApps: (kind === "n8n" || kind === "pa" || kind === "assistant") ? [] : undefined,
  expectedTimeSaved: (kind === "n8n" || kind === "pa" || kind === "assistant") ? "" : undefined,
  difficulty: (kind === "n8n" || kind === "pa" || kind === "assistant") ? "보통" : undefined,
  provider: kind === "ai-orchestration" ? "" : undefined,
  contextWindow: kind === "ai-orchestration" ? "" : undefined,
  strengths: kind === "ai-orchestration" ? "" : undefined,
  costTier: kind === "ai-orchestration" ? "보통" : undefined,
  mlType: kind === "ml" ? "" : undefined,
  trainingDataDesc: kind === "ml" ? "" : undefined,
  performanceSummary: kind === "ml" ? "" : undefined,
  devTool: (kind === "ml" || kind === "vibe") ? "" : undefined,
  sourceRepo: (kind === "ml" || kind === "vibe") ? "" : undefined,
  outputType: (kind === "ml" || kind === "vibe") ? "" : undefined,
});

const ID_PREFIX: Record<PlatformId, string> = {
  n8n: "N8N", pa: "PA", assistant: "AST", "ai-orchestration": "AIO", ml: "ML", vibe: "VIBE",
};

const isWorkflowKind = (item: ManagedPlatformItem): boolean =>
  item.kind === "n8n" || item.kind === "pa" || item.kind === "assistant";

export default function AdminProjectManage() {
  const [items, setItems] = useState<ManagedItem[]>(INITIAL_PLATFORM_ITEMS);
  const [selected, setSelected] = useState<string>(INITIAL_PLATFORM_ITEMS[0]?.id ?? "");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<ManagedItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [sourceFilter, setSourceFilter] = useState<"전체" | PlatformId>("전체");
  const [saved, setSaved] = useState(false);

  const [timeSavedValue, setTimeSavedValue] = useState("");
  const [timeSavedPeriod, setTimeSavedPeriod] = useState<TimePeriod>("주");

  const SOURCE_OPTIONS: { key: "전체" | PlatformId; label: string }[] = [
    { key: "전체", label: "전체" },
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

  const loadTimeSavedFrom = (item: ManagedPlatformItem) => {
    if (isWorkflowKind(item)) {
      const { value, period } = deserializeTimeSaved(item.expectedTimeSaved);
      setTimeSavedValue(value);
      setTimeSavedPeriod(period);
    } else {
      setTimeSavedValue("");
      setTimeSavedPeriod("주");
    }
  };

  const startEdit = () => {
    if (activeItem) {
      setEditData({ ...activeItem });
      setEditMode(true);
      setSaved(false);
      loadTimeSavedFrom(activeItem);
    }
  };

  const startNew = (kind: PlatformId) => {
    setEditData({ ...emptyPlatformItem(kind), id: `${ID_PREFIX[kind]}-2025-0${Math.floor(Math.random() * 90 + 10)}` });
    setTimeSavedValue("");
    setTimeSavedPeriod("주");
    setIsNew(true); setEditMode(false); setSaved(false);
  };

  const cancelEdit = () => {
    setEditMode(false); setIsNew(false); setEditData(null); setSaved(false);
    setTimeSavedValue(""); setTimeSavedPeriod("주");
  };

  const setF = (k: keyof ManagedPlatformItem, v: unknown) =>
    setEditData(p => p ? { ...p, [k]: v } as ManagedItem : p);

  const setPlatformCompanies = (codes: string[]) => {
    setEditData(p => {
      if (!p) return p;
      return { ...p, company: codes, platformScope: codes.length === 0 ? "company-wide" : "specific" };
    });
  };

  const addNode = (v: string) => { if (!editData) return; const cur = editData.nodes ?? []; if (!cur.includes(v)) setF("nodes", [...cur, v]); };
  const removeNode = (v: string) => { if (!editData) return; setF("nodes", (editData.nodes ?? []).filter(n => n !== v)); };
  const addApp = (v: string) => { if (!editData) return; const cur = editData.connectedApps ?? []; if (!cur.includes(v)) setF("connectedApps", [...cur, v]); };
  const removeApp = (v: string) => { if (!editData) return; setF("connectedApps", (editData.connectedApps ?? []).filter(a => a !== v)); };

  const addContact = () => { if (!editData) return; setF("contacts", [...editData.contacts, { name: "", dept: "", role: "공동담당자", email: "" }]); };
  const removeContact = (i: number) => { if (!editData) return; setF("contacts", editData.contacts.filter((_, ci) => ci !== i)); };
  const setContact = (i: number, k: keyof Contact, v: string) => {
    if (!editData) return;
    setF("contacts", editData.contacts.map((c, ci) => ci === i ? { ...c, [k]: v } : c));
  };

  const handleSave = () => {
    if (!editData) return;
    let toSave: ManagedItem = editData;
    if (isWorkflowKind(editData)) {
      toSave = { ...editData, expectedTimeSaved: serializeTimeSaved(timeSavedValue, timeSavedPeriod) };
    }
    if (isNew) {
      setItems(p => [{ ...toSave, updatedAt: "2025.06.29" }, ...p]);
      setSelected(toSave.id);
    } else {
      setItems(p => p.map(i => i.id === toSave.id ? { ...toSave, updatedAt: "2025.06.29" } : i));
    }
    setEditMode(false); setIsNew(false); setEditData(null); setSaved(true);
    setTimeSavedValue(""); setTimeSavedPeriod("주");
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = (id: string) => {
    setItems(p => p.filter(i => i.id !== id));
    setDeleteConfirm(null);
    const remaining = items.filter(i => i.id !== id);
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />
      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, display: "flex", minWidth: 0, minHeight: "calc(100vh - 56px)" }}>

          {/* ===== 좌측: 통합 목록 ===== */}
          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>전체 항목 <span style={{ color: "#94A3B8", fontWeight: 500 }}>{items.length}</span></span>

                <select
                  value=""
                  onChange={e => { if (e.target.value) startNew(e.target.value as PlatformId); }}
                  style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", appearance: "none" }}
                >
                  <option value="" disabled>+ 직접 등록</option>
                  {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

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
                const style = SOURCE_STYLE[item.kind];
                const needsAttention = item.platformScope === "unset";
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
                      {needsAttention && <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626" }}>관계사 미지정</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
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
                      <span style={{ fontSize: 10, fontWeight: 700, background: SOURCE_STYLE[displayData.kind].bg, color: SOURCE_STYLE[displayData.kind].color, padding: "3px 9px", borderRadius: 20 }}>
                        {SOURCE_STYLE[displayData.kind].label}
                      </span>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>{displayData.id}</span>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0 }}>
                      {isEditing ? (
                        <input value={displayData.title} onChange={e => setF("title", e.target.value)} placeholder="제목 입력" style={{ ...inputStyle, fontSize: 17, fontWeight: 800, padding: "6px 10px" }} />
                      ) : displayData.title}
                    </h2>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {!isEditing ? (
                      <>
                        <button onClick={startEdit} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>수정</button>
                        <button onClick={() => setDeleteConfirm(displayData.id)} style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
                      </>
                    ) : (
                      <>
                        <button onClick={cancelEdit} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>취소</button>
                        <button onClick={handleSave} style={{ background: "#2563EB", border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>저장</button>
                      </>
                    )}
                  </div>
                </div>

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
                      : <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{displayData.description}</div>}
                  </FieldRow>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <FieldRow label="상태">
                      {isEditing
                        ? <SingleSelectTag options={STATUSES} value={displayData.status} onChange={v => setF("status", v)} />
                        : <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: STATUS_COLOR[displayData.status]?.bg, color: STATUS_COLOR[displayData.status]?.color }}>{displayData.status}</span>}
                    </FieldRow>
                    <FieldRow label="등록 부서">
                      {isEditing
                        ? <input value={displayData.dept} onChange={e => setF("dept", e.target.value)} style={inputStyle} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.dept || "—"}</span>}
                    </FieldRow>
                  </div>
                </SectionBlock>

                {/* ===== 분기: n8n / 나만의비서 — 워크플로우형 ===== */}
                {(displayData.kind === "n8n" || displayData.kind === "assistant") && (
                  <>
                    <SectionBlock title={`${SOURCE_STYLE[displayData.kind].label} 동작 정보`}>
                      <FieldRow label="소속 / 대상 관계사">
                        {isEditing
                          ? <>
                              <CompanyMultiSelect selected={displayData.company} onChange={setPlatformCompanies} />
                              {displayData.platformScope === "unset" && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>관계사 범위가 선택되지 않았습니다.</div>}
                            </>
                          : displayData.platformScope === "unset"
                            ? <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>관계사 미지정</span>
                            : <span style={{ fontSize: 13, color: "#334155" }}>{platformCompanyDisplay(displayData.company)}</span>}
                      </FieldRow>
                      <FieldRow label="트리거 · 동작 설명">
                        {isEditing
                          ? <textarea value={displayData.triggerAction ?? ""} onChange={e => setF("triggerAction", e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical", lineHeight: 1.7 }} />
                          : <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{displayData.triggerAction || "—"}</div>}
                      </FieldRow>
                      <FieldRow label="실행 URL">
                        {isEditing
                          ? <input value={displayData.specificUrl} onChange={e => setF("specificUrl", e.target.value)} style={inputStyle} />
                          : displayData.specificUrl ? <a href={displayData.specificUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>{displayData.specificUrl}</a> : <span style={{ fontSize: 13, color: "#94A3B8" }}>—</span>}
                      </FieldRow>
                      <FieldRow label="태그">
                        {isEditing
                          ? <input value={displayData.tags} onChange={e => setF("tags", e.target.value)} style={inputStyle} placeholder="쉼표로 구분하여 입력" />
                          : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{displayData.tags.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{t}</span>)}</div>}
                      </FieldRow>
                    </SectionBlock>

                    <SectionBlock title="노드 구성">
                      <FieldRow label="사용된 노드">
                        {isEditing
                          ? <ChipEditor items={displayData.nodes ?? []} onAdd={addNode} onRemove={removeNode} suggestions={NODE_SUGGESTIONS} placeholder="노드명 입력 후 Enter" />
                          : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{(displayData.nodes ?? []).map((n, i) => <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1E40AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #BFDBFE" }}>{n}</span>)}</div>}
                      </FieldRow>
                      <FieldRow label="연동 앱·서비스">
                        {isEditing
                          ? <ChipEditor items={displayData.connectedApps ?? []} onAdd={addApp} onRemove={removeApp} suggestions={APP_SUGGESTIONS} placeholder="연동 앱명 입력 후 Enter" />
                          : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{(displayData.connectedApps ?? []).map((a, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{a}</span>)}</div>}
                      </FieldRow>
                      {displayData.kind === "n8n" && (
                        <FieldRow label="워크플로우 다이어그램">
                          {isEditing
                            ? <WorkflowEditor value={displayData.workflowInput ?? { status: "Stable", nodes: [] }} onChange={v => setF("workflowInput", v)} />
                            : (() => {
                                const wf = toWorkflowDef(displayData.workflowInput ?? { status: "Stable", nodes: [] });
                                return (
                                  <div>
                                    {wf ? <WorkflowDiagram wf={wf} /> : <span style={{ fontSize: 13, color: "#94A3B8" }}>다이어그램 미등록</span>}
                                    {(displayData.workflowJson || wf) && (
                                      <button onClick={() => { const c = displayData.workflowJson ?? JSON.stringify(wf ?? {}, null, 2); const b = new Blob([c], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `${displayData.id.toLowerCase()}-workflow.json`; a.click(); URL.revokeObjectURL(u); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                        JSON 다운로드
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                        </FieldRow>
                      )}
                    </SectionBlock>

                    <SectionBlock title="예상 효과">
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <FieldRow label="예상 절감 시간">
                          {isEditing
                            ? <TimeSavedInput value={timeSavedValue} period={timeSavedPeriod} onValueChange={setTimeSavedValue} onPeriodChange={setTimeSavedPeriod} />
                            : <span style={{ fontSize: 13, color: "#334155" }}>{timeSavedDisplay(displayData.expectedTimeSaved)}</span>}
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

                {/* ===== 분기: Power Automate — 플로우형 ===== */}
                {displayData.kind === "pa" && (
                  <>
                    <SectionBlock title="Power Automate 플로우 정보">
                      <FieldRow label="소속 / 대상 관계사">
                        {isEditing
                          ? <>
                              <CompanyMultiSelect selected={displayData.company} onChange={setPlatformCompanies} />
                              {displayData.platformScope === "unset" && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>관계사 범위가 선택되지 않았습니다.</div>}
                            </>
                          : displayData.platformScope === "unset"
                            ? <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>관계사 미지정</span>
                            : <span style={{ fontSize: 13, color: "#334155" }}>{platformCompanyDisplay(displayData.company)}</span>}
                      </FieldRow>
                      <FieldRow label="트리거 · 동작 설명">
                        {isEditing
                          ? <textarea value={displayData.triggerAction ?? ""} onChange={e => setF("triggerAction", e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical", lineHeight: 1.7 }} />
                          : <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{displayData.triggerAction || "—"}</div>}
                      </FieldRow>
                      <FieldRow label="사용된 커넥터">
                        {isEditing
                          ? <ChipEditor items={displayData.connectedApps ?? []} onAdd={addApp} onRemove={removeApp} suggestions={PA_CONNECTOR_SUGGESTIONS} placeholder="커넥터명 입력 후 Enter" />
                          : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{(displayData.connectedApps ?? []).map((a, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{a}</span>)}</div>}
                      </FieldRow>
                      <FieldRow label="플로우 URL">
                        {isEditing
                          ? <input value={displayData.specificUrl} onChange={e => setF("specificUrl", e.target.value)} style={inputStyle} />
                          : displayData.specificUrl ? <a href={displayData.specificUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>{displayData.specificUrl}</a> : <span style={{ fontSize: 13, color: "#94A3B8" }}>—</span>}
                      </FieldRow>
                      <FieldRow label="태그">
                        {isEditing
                          ? <input value={displayData.tags} onChange={e => setF("tags", e.target.value)} style={inputStyle} placeholder="쉼표로 구분하여 입력" />
                          : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{displayData.tags.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{t}</span>)}</div>}
                      </FieldRow>
                    </SectionBlock>

                    <SectionBlock title="예상 효과">
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <FieldRow label="예상 절감 시간">
                          {isEditing
                            ? <TimeSavedInput value={timeSavedValue} period={timeSavedPeriod} onValueChange={setTimeSavedValue} onPeriodChange={setTimeSavedPeriod} />
                            : <span style={{ fontSize: 13, color: "#334155" }}>{timeSavedDisplay(displayData.expectedTimeSaved)}</span>}
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
                    <FieldRow label="소속 / 대상 관계사">
                      {isEditing
                        ? <>
                            <CompanyMultiSelect selected={displayData.company} onChange={setPlatformCompanies} />
                            {displayData.platformScope === "unset" && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>관계사 범위가 선택되지 않았습니다.</div>}
                          </>
                        : displayData.platformScope === "unset"
                          ? <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>관계사 미지정</span>
                          : <span style={{ fontSize: 13, color: "#334155" }}>{platformCompanyDisplay(displayData.company)}</span>}
                    </FieldRow>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <FieldRow label="제공사">
                        {isEditing ? <input value={displayData.provider ?? ""} onChange={e => setF("provider", e.target.value)} style={inputStyle} /> : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.provider || "—"}</span>}
                      </FieldRow>
                      <FieldRow label="컨텍스트 윈도우">
                        {isEditing ? <input value={displayData.contextWindow ?? ""} onChange={e => setF("contextWindow", e.target.value)} style={inputStyle} /> : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.contextWindow || "—"}</span>}
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
                        : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{(displayData.strengths ?? "").split(",").map(s => s.trim()).filter(Boolean).map((s, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{s}</span>)}</div>}
                    </FieldRow>
                    <FieldRow label="모델 접속 URL">
                      {isEditing
                        ? <input value={displayData.specificUrl} onChange={e => setF("specificUrl", e.target.value)} style={inputStyle} />
                        : displayData.specificUrl ? <a href={displayData.specificUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>{displayData.specificUrl}</a> : <span style={{ fontSize: 13, color: "#94A3B8" }}>—</span>}
                    </FieldRow>
                    <FieldRow label="태그">
                      {isEditing
                        ? <input value={displayData.tags} onChange={e => setF("tags", e.target.value)} style={inputStyle} placeholder="쉼표로 구분하여 입력" />
                        : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{displayData.tags.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{t}</span>)}</div>}
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 분기: ML 모델 ===== */}
                {displayData.kind === "ml" && (
                  <SectionBlock title="ML 모델 정보">
                    <FieldRow label="소속 / 대상 관계사">
                      {isEditing
                        ? <>
                            <CompanyMultiSelect selected={displayData.company} onChange={setPlatformCompanies} />
                            {displayData.platformScope === "unset" && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>관계사 범위가 선택되지 않았습니다.</div>}
                          </>
                        : displayData.platformScope === "unset"
                          ? <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>관계사 미지정</span>
                          : <span style={{ fontSize: 13, color: "#334155" }}>{platformCompanyDisplay(displayData.company)}</span>}
                    </FieldRow>
                    <FieldRow label="모델 유형">
                      {isEditing
                        ? <SingleSelectTag options={ML_TYPES} value={displayData.mlType ?? ""} onChange={v => setF("mlType", v)} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.mlType || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="학습 데이터 설명">
                      {isEditing
                        ? <textarea value={displayData.trainingDataDesc ?? ""} onChange={e => setF("trainingDataDesc", e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical", lineHeight: 1.7 }} />
                        : <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{displayData.trainingDataDesc || "—"}</div>}
                    </FieldRow>
                    <FieldRow label="성능 요약">
                      {isEditing
                        ? <input value={displayData.performanceSummary ?? ""} onChange={e => setF("performanceSummary", e.target.value)} placeholder="예: 정확도 92.3%, 재현율 89.7%" style={inputStyle} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.performanceSummary || "—"}</span>}
                    </FieldRow>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <FieldRow label="개발 도구">
                        {isEditing
                          ? <input value={displayData.devTool ?? ""} onChange={e => setF("devTool", e.target.value)} placeholder="예: PyTorch, TensorFlow" style={inputStyle} />
                          : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.devTool || "—"}</span>}
                      </FieldRow>
                      <FieldRow label="출력 유형">
                        {isEditing
                          ? <input value={displayData.outputType ?? ""} onChange={e => setF("outputType", e.target.value)} placeholder="예: 합격/불합격 분류" style={inputStyle} />
                          : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.outputType || "—"}</span>}
                      </FieldRow>
                    </div>
                    <FieldRow label="소스 저장소">
                      {isEditing
                        ? <input value={displayData.sourceRepo ?? ""} onChange={e => setF("sourceRepo", e.target.value)} placeholder="예: gitlab.kolmar.co.kr/ml/…" style={inputStyle} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.sourceRepo || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="모델 접속 URL">
                      {isEditing
                        ? <input value={displayData.specificUrl} onChange={e => setF("specificUrl", e.target.value)} style={inputStyle} />
                        : displayData.specificUrl ? <a href={displayData.specificUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>{displayData.specificUrl}</a> : <span style={{ fontSize: 13, color: "#94A3B8" }}>—</span>}
                    </FieldRow>
                    <FieldRow label="태그">
                      {isEditing
                        ? <input value={displayData.tags} onChange={e => setF("tags", e.target.value)} style={inputStyle} placeholder="쉼표로 구분하여 입력" />
                        : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{displayData.tags.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{t}</span>)}</div>}
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 분기: Vibe Coding ===== */}
                {displayData.kind === "vibe" && (
                  <SectionBlock title="Vibe Coding 정보">
                    <FieldRow label="소속 / 대상 관계사">
                      {isEditing
                        ? <>
                            <CompanyMultiSelect selected={displayData.company} onChange={setPlatformCompanies} />
                            {displayData.platformScope === "unset" && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>관계사 범위가 선택되지 않았습니다.</div>}
                          </>
                        : displayData.platformScope === "unset"
                          ? <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>관계사 미지정</span>
                          : <span style={{ fontSize: 13, color: "#334155" }}>{platformCompanyDisplay(displayData.company)}</span>}
                    </FieldRow>
                    <FieldRow label="사용 도구">
                      {isEditing ? (
                        <>
                          <input value={displayData.devTool ?? ""} onChange={e => setF("devTool", e.target.value)} placeholder="예: Cursor, GitHub Copilot" style={inputStyle} />
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                            {VIBE_TOOL_SUGGESTIONS.map(s => <span key={s} onClick={() => setF("devTool", s)} style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", padding: "3px 9px", borderRadius: 14, cursor: "pointer" }}>+ {s}</span>)}
                          </div>
                        </>
                      ) : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.devTool || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="산출물 유형">
                      {isEditing
                        ? <input value={displayData.outputType ?? ""} onChange={e => setF("outputType", e.target.value)} placeholder="예: 내부 API, 대시보드, 스크립트" style={inputStyle} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.outputType || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="소스 저장소">
                      {isEditing
                        ? <input value={displayData.sourceRepo ?? ""} onChange={e => setF("sourceRepo", e.target.value)} placeholder="예: gitlab.kolmar.co.kr/vibe/…" style={inputStyle} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.sourceRepo || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="접속 URL">
                      {isEditing
                        ? <input value={displayData.specificUrl} onChange={e => setF("specificUrl", e.target.value)} style={inputStyle} />
                        : displayData.specificUrl ? <a href={displayData.specificUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>{displayData.specificUrl}</a> : <span style={{ fontSize: 13, color: "#94A3B8" }}>—</span>}
                    </FieldRow>
                    <FieldRow label="태그">
                      {isEditing
                        ? <input value={displayData.tags} onChange={e => setF("tags", e.target.value)} style={inputStyle} placeholder="쉼표로 구분하여 입력" />
                        : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{displayData.tags.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{t}</span>)}</div>}
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 공통: 등록 신청자 정보 ===== */}
                <SectionBlock title="등록 신청자 정보">
                  {!isEditing && (
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 11, color: "#64748B" }}>
                      퇴사·인사이동 등으로 신청자 계정 정보가 바뀐 경우 여기서 직접 수정하세요.
                    </div>
                  )}
                  <FieldRow label="신청자 이메일 (createdByEmail)">
                    {isEditing
                      ? <input value={displayData.createdByEmail} onChange={e => setF("createdByEmail", e.target.value)} style={inputStyle} placeholder="name@kolmar.co.kr" />
                      : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.createdByEmail || "—"}</span>}
                  </FieldRow>
                </SectionBlock>

                {/* ===== 공통: 담당자 ===== */}
                <SectionBlock title="담당자">
                  {!isEditing && (
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 11, color: "#64748B" }}>
                      퇴사·인사이동 등으로 담당자 정보가 바뀐 경우 여기서 직접 수정하세요.
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
