// ===== AdminProjectManage.tsx =====
import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { CATEGORIES, BUSINESS_DOMAINS, makeItemId } from "../../types/categoryTypes";
import type { CategoryId, BusinessDomain } from "../../types/categoryTypes";
import { WorkflowDiagram, toWorkflowDef } from "../../components/WorkflowDiagram";
import type { WorkflowInput } from "../../components/WorkflowDiagram";
import { useAuth } from "../../context/useAuth";


const DIFFICULTY_LEVELS = ["쉬움", "보통", "어려움"];
const COST_TIERS = ["낮음", "보통", "높음"];
// AI Model 이용 가능 상태 — 운영 상태(폐기)와 별개 축
const AGENT_AVAILABILITY = ["사용 가능", "사용 불가"];

// 나만의 비서 — 기반 모델 힌트
const ASSISTANT_MODEL_HINTS = [
  "웍스 대표 모델", "GPT-5.4", "GPT-5.4 Mini", "Claude Opus 4.8", "Claude Sonnet 5",
  "Gemini", "xAI", "LG AI", "Upstage", "Perplexity",
];

// AI Model(HK GPT 게이트웨이) — 처리 가능한 글 분량(쉬운 표현)
const CONTEXT_SIZE_OPTIONS = ["일반 대화 수준", "문서 여러 장 (수십 페이지)", "매우 긴 문서 (책 한 권 분량)"];

const ML_TYPES = [
  "분류 (Classification)", "회귀 (Regression)", "클러스터링",
  "NLP / 텍스트", "이미지 인식", "시계열 예측", "추천 시스템", "이상 탐지", "강화학습", "멀티모달",
];

// 인라인 SVG 플레이스홀더 (네트워크 비의존)
const placeholderImage = (label: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='640' height='360' fill='#F1F5F9'/><rect x='1' y='1' width='638' height='358' fill='none' stroke='${color}' stroke-width='2'/><text x='320' y='188' font-family='sans-serif' font-size='24' fill='${color}' text-anchor='middle'>${label}</text></svg>`
  )}`;

// ===== 예상 절감 시간 정규화 (n8n / pa 전용) =====
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

// ===== 타입 정의 =====
type Contact = { name: string; dept: string; role: string; email: string };

// 간소화된 7유형 필드 체계 — 운영 상태·관계사 편집·실행 URL·삭제된 유형별 필드는 미보유.
// company/companyScope는 companyAdmin 조회 범위 판정용 데이터로만 존치 (편집 UI 없음, 전 항목 전사 공용).
type ManagedAssetItem = {
  kind: CategoryId;
  id: string; title: string; dept: string;
  summary: string; description: string; contacts: Contact[];
  updatedAt: string;
  createdByEmail: string;
  tags: string;
  images?: string[];
  domain?: BusinessDomain;
  company: string[];
  companyScope: "unset" | "company-wide" | "specific";
  // n8n / pa 전용
  expectedTimeSaved?: string; difficulty?: string;
  workflowInput?: WorkflowInput;
  workflowJson?: string;
  // assistant 전용
  sharedPrompt?: string; basedModel?: string;
  // ai-orchestration 전용 (모델 접속 URL은 specificUrl)
  agentAvailability?: string; strengthsDetail?: string; specificUrl?: string;
  modelName?: string; contextWindow?: string; costTier?: string;
  // ml 전용
  mlType?: string; trainingDataDesc?: string; devTool?: string;
  // Admin 전용
  isHighlighted?: boolean;
  isWeeklyDiscover?: boolean;
};

type ManagedItem = ManagedAssetItem;

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = Object.fromEntries(
  CATEGORIES.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])
);

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

// 이미지 캐러셀 (표시 전용)
const ImageStripView = ({ images }: { images: string[] }) => {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;
  const safe = Math.min(idx, images.length - 1);
  const go = (d: number) => setIdx(() => (safe + d + images.length) % images.length);
  return (
    <div>
      <div style={{ position: "relative", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, minHeight: 160 }}>
        {images.length > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="이전 사진" style={{ position: "absolute", left: 10, width: 30, height: 30, borderRadius: "50%", background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 15, color: "#475569" }}>‹</button>
        )}
        <img src={images[safe]} alt={`첨부 사진 ${safe + 1}`} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 6 }} />
        {images.length > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="다음 사진" style={{ position: "absolute", right: 10, width: 30, height: 30, borderRadius: "50%", background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 15, color: "#475569" }}>›</button>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, textAlign: "right" }}>{safe + 1} / {images.length}</div>
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

// TODO: 실제 연동 시 GET /api/v1/admin/platform-items 응답으로 교체
const INITIAL_ASSET_ITEMS: ManagedAssetItem[] = [
  {
    kind: "n8n",
    id: "N8N-2026-032", title: "Outlook 긴급 메일 자동 전달", dept: "IT인프라팀",
    summary: "긴급 메일 수신 시 제목 키워드를 확인하여 팀장님께 즉시 자동 전달",
    description: "Outlook에서 메일을 수신하면 제목에 '긴급' 키워드 포함 여부를 자동으로 판별합니다.\n\n긴급 메일로 확인될 경우 팀장님 메일 주소로 즉시 전달하여 빠른 의사결정이 가능하도록 지원합니다.",
    contacts: [{ name: "이서현", dept: "IT인프라팀", role: "주담당자", email: "seohyun.lee@kolmar.co.kr" }],
    updatedAt: "2026.07.03", createdByEmail: "seohyun.lee@kolmar.co.kr",
    tags: "Outlook, 긴급메일, 자동전달",
    images: [placeholderImage("워크플로우 개요", "#EA580C")],
    domain: "IT",
    company: [], companyScope: "company-wide",
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
    id: "PA-2026-013", title: "구매 결재 자동 승인 플로우", dept: "구매팀",
    summary: "SharePoint 양식 기반 구매 결재 자동 처리",
    description: "구매팀이 SharePoint에 제출한 결재 요청을 Power Automate가 ERP 데이터와 대조 후 자동 승인·반려합니다.",
    contacts: [{ name: "최유진", dept: "구매팀", role: "주담당자", email: "yujin.choi@kolmar.co.kr" }],
    updatedAt: "2026.06.25", createdByEmail: "yujin.choi@kolmar.co.kr",
    tags: "결재, 구매자동화",
    domain: "재무",
    company: [], companyScope: "company-wide",
    expectedTimeSaved: "주 3시간",
  },
  {
    kind: "assistant",
    id: "AST-2026-019", title: "해외법인 계약서 1차 검토 비서", dept: "법무팀",
    summary: "해외법인向 영문 계약서의 주요 리스크 조항을 1차 스크리닝",
    description: "미국콜마·북경콜마 등 해외법인에서 체결하는 영문 계약서의 주요 조항을 1차로 스크리닝하여 법무팀 검토 시간을 단축합니다.",
    contacts: [{ name: "강현우", dept: "법무팀", role: "주담당자", email: "hyunwoo.kang@kolmar.co.kr" }],
    updatedAt: "2026.06.22", createdByEmail: "hyunwoo.kang@kolmar.co.kr",
    tags: "계약서, 법무, 해외법인",
    domain: "IT",
    company: [], companyScope: "company-wide",
    sharedPrompt: "당신은 해외법인 계약서를 검토하는 법무 담당자입니다. 업로드된 영문 계약서에서 위험 조항을 찾아 한국어로 요약해 주세요.",
    basedModel: "Claude Opus 4.8",
  },
  {
    kind: "ai-orchestration",
    id: "AIO-2026-014", title: "Claude Opus 4.8", dept: "IT개발팀",
    summary: "긴 문서 분석과 정밀한 추론에 강한 모델",
    description: "긴 컨텍스트가 필요한 계약서 검토, 보고서 분석, 복잡한 추론 작업에 적합합니다. 제공사는 Anthropic입니다.",
    contacts: [{ name: "정태영", dept: "IT개발팀", role: "주담당자", email: "taeyoung.jung@kolmar.co.kr" }],
    updatedAt: "2026.06.12", createdByEmail: "taeyoung.jung@kolmar.co.kr",
    tags: "문서분석, 긴컨텍스트, 법무",
    company: [], companyScope: "company-wide",
    agentAvailability: "사용 가능",
    strengthsDetail: "긴 문서를 한 번에 읽고 핵심을 요약하는 데 강합니다. 계약서 검토나 보고서 분석에 활용해보세요.",
    specificUrl: "https://ai-gateway.kolmar.co.kr/models/claude",
    modelName: "Claude Opus 4.8", contextWindow: "매우 긴 문서 (책 한 권 분량)", costTier: "보통",
  },
  {
    kind: "ml",
    id: "ML-2026-007", title: "성분 이미지 품질 분류 모델", dept: "IT개발팀",
    summary: "원료 이미지 기반 품질 합격/불합격 자동 판정",
    description: "YOLOv8 기반 이미지 분류 모델로 생산 라인에서 촬영한 원료 이미지를 실시간 분석합니다.",
    contacts: [{ name: "오승현", dept: "IT개발팀", role: "주담당자", email: "seunghyun.oh@kolmar.co.kr" }],
    updatedAt: "2026.06.26", createdByEmail: "seunghyun.oh@kolmar.co.kr",
    tags: "품질관리, 이미지분류",
    domain: "생산",
    company: [], companyScope: "company-wide",
    mlType: "이미지 인식", trainingDataDesc: "내부 품질 검사 이미지 1만장", devTool: "PyTorch",
  },
  {
    kind: "vibe",
    id: "VIBE-2026-008", title: "원가 계산 자동화 스크립트", dept: "재무팀",
    summary: "Cursor로 작성한 원가 자동 계산 내부 도구",
    description: "Cursor AI를 활용해 Python으로 제작한 원가 계산 자동화 스크립트입니다. 기존 Excel 수작업을 대체하여 처리 시간을 줄였습니다.",
    contacts: [{ name: "박소희", dept: "재무팀", role: "주담당자", email: "sohee.park@kolmar.co.kr" }],
    updatedAt: "2026.07.01", createdByEmail: "sohee.park@kolmar.co.kr",
    tags: "원가, 재무자동화",
    domain: "재무",
    company: [], companyScope: "company-wide",
  },
  {
    kind: "etc",
    id: "ETC-2026-002", title: "사내 AI 뉴스 주간 요약 미니 프로젝트", dept: "DX추진팀",
    summary: "매주 사내에 공유되는 AI 트렌드 뉴스레터를 블로그 형식으로 소개",
    description: "사내 구성원이 AI 동향을 쉽게 접할 수 있도록 매주 주요 뉴스와 활용 사례를 정리해 공유하는 소규모 프로젝트입니다.",
    contacts: [{ name: "한지민", dept: "DX추진팀", role: "주담당자", email: "jimin.han@kolmar.co.kr" }],
    updatedAt: "2026.06.28", createdByEmail: "jimin.han@kolmar.co.kr",
    tags: "뉴스레터, AI트렌드",
    domain: "IT",
    company: [], companyScope: "company-wide",
  },
];

const emptyAssetItem = (kind: CategoryId): ManagedAssetItem => ({
  kind,
  id: "", title: "", summary: "", description: "", dept: "",
  contacts: [{ name: "", dept: "", role: "주담당자", email: "" }], updatedAt: "",
  createdByEmail: "",
  tags: "", images: [],
  company: [], companyScope: "company-wide",
  expectedTimeSaved: (kind === "n8n" || kind === "pa") ? "" : undefined,
  difficulty: kind === "n8n" ? "보통" : undefined,
  sharedPrompt: kind === "assistant" ? "" : undefined,
  basedModel: kind === "assistant" ? "" : undefined,
  agentAvailability: kind === "ai-orchestration" ? "" : undefined,
  strengthsDetail: kind === "ai-orchestration" ? "" : undefined,
  specificUrl: kind === "ai-orchestration" ? "" : undefined,
  modelName: kind === "ai-orchestration" ? "" : undefined,
  contextWindow: kind === "ai-orchestration" ? "" : undefined,
  costTier: kind === "ai-orchestration" ? "보통" : undefined,
  mlType: kind === "ml" ? "" : undefined,
  trainingDataDesc: kind === "ml" ? "" : undefined,
  devTool: kind === "ml" ? "" : undefined,
});

// 예상 절감 시간·워크플로우 다이어그램 대상은 n8n / pa로 한정.
const isWorkflowKind = (item: ManagedAssetItem): boolean =>
  item.kind === "n8n" || item.kind === "pa";

export default function AdminProjectManage() {
  const { isAdmin, isCompanyAdmin, managedCompanies } = useAuth();
  const [items, setItems] = useState<ManagedItem[]>(INITIAL_ASSET_ITEMS);
  const [selected, setSelected] = useState<string>(INITIAL_ASSET_ITEMS[0]?.id ?? "");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<ManagedItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"전체" | CategoryId>("전체");
  const [saved, setSaved] = useState(false);

  const [timeSavedValue, setTimeSavedValue] = useState("");
  const [timeSavedPeriod, setTimeSavedPeriod] = useState<TimePeriod>("주");

  const SOURCE_OPTIONS: { key: "전체" | CategoryId; label: string }[] = [
    { key: "전체", label: "전체" },
    ...CATEGORIES.map(p => ({ key: p.id, label: p.name })),
  ];

  // canManageItem 판정 — companyAdmin은 담당 관계사 범위 + 전사 공용만 관리 (원본 판정 구조 유지)
  const canManageItem = (i: ManagedAssetItem): boolean => {
    if (isAdmin) return true;
    if (isCompanyAdmin) return i.company.length === 0 || i.company.some(c => managedCompanies.includes(c));
    return false;
  };

  const filtered = items.filter(i => {
    if (isCompanyAdmin && !canManageItem(i)) return false;
    return (
      (sourceFilter === "전체" || i.kind === sourceFilter) &&
      (search === "" || i.title.includes(search) || i.dept.includes(search))
    );
  });

  const toggleHighlight = (id: string) =>
    setItems(p => p.map(i => i.id === id ? { ...i, isHighlighted: !i.isHighlighted } : i));
  const toggleWeeklyDiscover = (id: string) =>
    setItems(p => p.map(i => i.id === id ? { ...i, isWeeklyDiscover: !i.isWeeklyDiscover } : { ...i, isWeeklyDiscover: false }));

  const activeItem = isNew ? editData : items.find(i => i.id === selected) ?? null;
  const displayData = editMode || isNew ? editData : activeItem;
  const isEditing = editMode || isNew;

  const loadTimeSavedFrom = (item: ManagedAssetItem) => {
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

  const startNew = (kind: CategoryId) => {
    setEditData({ ...emptyAssetItem(kind), id: makeItemId(kind, Math.floor(Math.random() * 900) + 100, 2026) });
    setTimeSavedValue("");
    setTimeSavedPeriod("주");
    setIsNew(true); setEditMode(false); setSaved(false);
  };

  const cancelEdit = () => {
    setEditMode(false); setIsNew(false); setEditData(null); setSaved(false);
    setTimeSavedValue(""); setTimeSavedPeriod("주");
  };

  const setF = (k: keyof ManagedAssetItem, v: unknown) =>
    setEditData(p => p ? { ...p, [k]: v } as ManagedItem : p);

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
      setItems(p => [{ ...toSave, updatedAt: "2026.07.20" }, ...p]);
      setSelected(toSave.id);
    } else {
      setItems(p => p.map(i => i.id === toSave.id ? { ...toSave, updatedAt: "2026.07.20" } : i));
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

  const displayImages = displayData?.images ?? [];

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
                {isAdmin && (
                  <select
                    value=""
                    onChange={e => { if (e.target.value) startNew(e.target.value as CategoryId); }}
                    style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", appearance: "none" }}
                  >
                    <option value="" disabled>+ 직접 등록</option>
                    {CATEGORIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                {isCompanyAdmin && (
                  <span style={{ fontSize: 11, color: "#B4802E", background: "#FBF3E4", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
                    {managedCompanies.length > 0 ? managedCompanies.join("·") : "–"} 담당
                  </span>
                )}
              </div>

              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="항목명, 부서 검색" style={{ ...inputStyle, padding: "7px 12px", fontSize: 12, marginBottom: 8 }} />

              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
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
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ padding: "40px 16px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>검색 결과가 없습니다.</div>
              )}
              {filtered.map(item => {
                const style = SOURCE_STYLE[item.kind];
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
                      <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>{item.id}</span>
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
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                    {isAdmin && !isEditing && (
                      <>
                        <button
                          onClick={() => toggleHighlight(displayData.id)}
                          title={displayData.isHighlighted ? "하이라이트 해제" : "하이라이트 지정"}
                          style={{ background: displayData.isHighlighted ? "#FEF08A" : "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: displayData.isHighlighted ? "#854D0E" : "#64748B", cursor: "pointer" }}
                        >
                          {displayData.isHighlighted ? "★ 하이라이트" : "☆ 하이라이트"}
                        </button>
                        <button
                          onClick={() => toggleWeeklyDiscover(displayData.id)}
                          title={displayData.isWeeklyDiscover ? "금주의 발견 해제" : "금주의 발견 지정"}
                          style={{ background: displayData.isWeeklyDiscover ? "#D1FAE5" : "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: displayData.isWeeklyDiscover ? "#065F46" : "#64748B", cursor: "pointer" }}
                        >
                          {displayData.isWeeklyDiscover ? "✦ 금주의 발견" : "✦ 금주의 발견"}
                        </button>
                      </>
                    )}
                    {!isEditing ? (
                      <>
                        {isAdmin && <button onClick={startEdit} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>수정</button>}
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
                  {displayImages.length > 0 && (
                    <FieldRow label="첨부 사진">
                      <ImageStripView images={displayImages} />
                    </FieldRow>
                  )}
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
                  <FieldRow label="업무 도메인">
                    {isEditing
                      ? <SingleSelectTag options={[...BUSINESS_DOMAINS]} value={displayData.domain ?? ""} onChange={v => setF("domain", v)} />
                      : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.domain || "—"}</span>}
                  </FieldRow>
                  <FieldRow label="등록 부서">
                    {isEditing
                      ? <input value={displayData.dept} onChange={e => setF("dept", e.target.value)} style={inputStyle} />
                      : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.dept || "—"}</span>}
                  </FieldRow>
                  <FieldRow label="태그">
                    {isEditing
                      ? <input value={displayData.tags} onChange={e => setF("tags", e.target.value)} style={inputStyle} placeholder="쉼표로 구분하여 입력" />
                      : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{displayData.tags.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{t}</span>)}</div>}
                  </FieldRow>
                </SectionBlock>

                {/* ===== 분기: n8n / Power Automate ===== */}
                {(displayData.kind === "n8n" || displayData.kind === "pa") && (
                  <SectionBlock title={`${SOURCE_STYLE[displayData.kind].label} 구성 · 효과`}>
                    {displayData.kind === "n8n" && displayData.workflowInput && (() => {
                      const wf = toWorkflowDef(displayData.workflowInput);
                      return wf ? (
                        <FieldRow label="워크플로우 다이어그램">
                          <WorkflowDiagram wf={wf} />
                        </FieldRow>
                      ) : null;
                    })()}
                    <FieldRow label="예상 절감 시간">
                      {isEditing
                        ? <TimeSavedInput value={timeSavedValue} period={timeSavedPeriod} onValueChange={setTimeSavedValue} onPeriodChange={setTimeSavedPeriod} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{timeSavedDisplay(displayData.expectedTimeSaved)}</span>}
                    </FieldRow>
                    {displayData.kind === "n8n" && (
                      <FieldRow label="구성 난이도">
                        {isEditing
                          ? <SingleSelectTag options={DIFFICULTY_LEVELS} value={displayData.difficulty ?? "보통"} onChange={v => setF("difficulty", v)} />
                          : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.difficulty || "—"}</span>}
                      </FieldRow>
                    )}
                  </SectionBlock>
                )}

                {/* ===== 분기: 나만의 비서 ===== */}
                {displayData.kind === "assistant" && (
                  <SectionBlock title="비서 구성">
                    <FieldRow label="공유 프롬프트">
                      {isEditing
                        ? <textarea value={displayData.sharedPrompt ?? ""} onChange={e => setF("sharedPrompt", e.target.value)} style={{ ...inputStyle, minHeight: 110, resize: "vertical", lineHeight: 1.7, fontFamily: "var(--font-mono)" }} />
                        : <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }}>{displayData.sharedPrompt || "—"}</div>}
                    </FieldRow>
                    <FieldRow label="기반 모델">
                      {isEditing ? (
                        <>
                          <input value={displayData.basedModel ?? ""} onChange={e => setF("basedModel", e.target.value)} style={inputStyle} />
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                            {ASSISTANT_MODEL_HINTS.map(m => <span key={m} onClick={() => setF("basedModel", m)} style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", padding: "3px 9px", borderRadius: 14, cursor: "pointer" }}>+ {m}</span>)}
                          </div>
                        </>
                      ) : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.basedModel || "—"}</span>}
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 분기: AI Model — 모델 정보 ===== */}
                {displayData.kind === "ai-orchestration" && (
                  <SectionBlock title="모델 정보">
                    <FieldRow label="이용 가능 여부">
                      {isEditing
                        ? <SingleSelectTag options={AGENT_AVAILABILITY} value={displayData.agentAvailability ?? ""} onChange={v => setF("agentAvailability", v)} />
                        : <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: displayData.agentAvailability === "사용 가능" ? "#D1FAE5" : "#FEE2E2", color: displayData.agentAvailability === "사용 가능" ? "#065F46" : "#991B1B" }}>{displayData.agentAvailability || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="강점 및 활용 방법">
                      {isEditing
                        ? <textarea value={displayData.strengthsDetail ?? ""} onChange={e => setF("strengthsDetail", e.target.value)} style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.7 }} />
                        : <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7 }}>{displayData.strengthsDetail || "—"}</div>}
                    </FieldRow>
                    <FieldRow label="모델 접속 URL">
                      {isEditing
                        ? <input value={displayData.specificUrl ?? ""} onChange={e => setF("specificUrl", e.target.value)} placeholder="https://" style={inputStyle} />
                        : displayData.specificUrl ? <a href={displayData.specificUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>{displayData.specificUrl}</a> : <span style={{ fontSize: 13, color: "#94A3B8" }}>—</span>}
                    </FieldRow>
                    <FieldRow label="세부 모델명">
                      {isEditing ? <input value={displayData.modelName ?? ""} onChange={e => setF("modelName", e.target.value)} placeholder="예: Claude Opus 4.8, GPT-5.4 Mini" style={inputStyle} /> : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.modelName || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="처리 가능한 글 분량">
                      {isEditing
                        ? <SingleSelectTag options={CONTEXT_SIZE_OPTIONS} value={displayData.contextWindow ?? ""} onChange={v => setF("contextWindow", v)} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.contextWindow || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="비용 등급">
                      {isEditing
                        ? <SingleSelectTag options={COST_TIERS} value={displayData.costTier ?? "보통"} onChange={v => setF("costTier", v)} />
                        : <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#F1F5F9", color: "#475569" }}>{displayData.costTier || "—"}</span>}
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 분기: ML 모델 ===== */}
                {displayData.kind === "ml" && (
                  <SectionBlock title="ML 모델 정보">
                    <FieldRow label="모델 유형">
                      {isEditing
                        ? <SingleSelectTag options={ML_TYPES} value={displayData.mlType ?? ""} onChange={v => setF("mlType", v)} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.mlType || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="학습 데이터 개요">
                      {isEditing
                        ? <input value={displayData.trainingDataDesc ?? ""} onChange={e => setF("trainingDataDesc", e.target.value)} style={inputStyle} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.trainingDataDesc || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="개발 도구">
                      {isEditing
                        ? <input value={displayData.devTool ?? ""} onChange={e => setF("devTool", e.target.value)} placeholder="예: PyTorch, TensorFlow" style={inputStyle} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.devTool || "—"}</span>}
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* vibe · etc: 공통 정보만 (별도 유형 섹션 없음) */}

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

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
