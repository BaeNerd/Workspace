import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { PLATFORMS } from "../../types/platformTypes";
import type { PlatformId } from "../../types/platformTypes";

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
  contacts: Contact[]; links: LinkItem[]; approval: Approval; rejectionReason?: string;
};

type ReviewItem = ReviewProjectItem | ReviewPlatformItem;
const isProjectKind = (i: ReviewItem): i is ReviewProjectItem => i.kind === "project";

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
    description: "기존 종이 점검표를 대체하여 사진 첨부, 즉시 보고가 가능한 점검 도구를 개발합니다. 시스템 유형과 도메인 모두 표준 분류 외 항목으로 신청됨.",
    dept: "제조기술팀", submittedBy: "윤성민", submittedAt: "2025.06.05",
    status: "개발 중", domain: ["제조/생산", "기타"], domainOther: "현장 안전관리", type: "기타", typeOther: "PWA(프로그레시브 웹 앱)",
    stack: ["React", "Node.js"],
    audience: ["특정 부서"],
    orgEntries: [{ id: 6, company: "KKM", parent: "생산본부", dept: "제조기술팀" }],
    integrations: "", freeTags: "안전점검, 모바일체크리스트",
    contacts: [{ name: "윤성민", dept: "제조기술팀", role: "주담당자", email: "seongmin.yoon@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
  // ★ 신규 — n8n 워크플로우 신청
  {
    kind: "n8n",
    id: "N8N-2025-010", title: "재고 임계치 도달 시 Teams 알림",
    summary: "재고관리 시스템의 재고가 임계치 이하로 떨어지면 담당자에게 즉시 알림",
    description: "재고관리 시스템 API를 주기적으로 조회하여 임계치 이하 품목을 감지하면 담당 부서 Teams 채널에 알림을 발송합니다.",
    dept: "생산본부", submittedBy: "김도윤", submittedAt: "2025.06.08",
    status: "파일럿",
    triggerAction: "Schedule Trigger(매일 오전 8시) → 재고 API 조회 → IF(임계치 이하) → Teams 알림",
    nodes: ["Schedule Trigger", "HTTP Request", "IF", "Microsoft Teams"],
    connectedApps: ["Microsoft Teams"],
    expectedTimeSaved: "주 2시간", difficulty: "보통",
    specificUrl: "https://n8n.kolmar.co.kr/workflow/010",
    itemTags: "재고관리, 알림자동화",
    contacts: [{ name: "김도윤", dept: "생산본부", role: "주담당자", email: "doyoon.kim@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
  // ★ 신규 — 나만의 비서(HK GPT 커스텀) 신청
  {
    kind: "assistant",
    id: "AST-2025-007", title: "신제품 기획서 초안 작성 도우미",
    summary: "HK GPT를 신제품 기획서 양식에 맞게 커스터마이징한 에이전트",
    description: "제품 컨셉과 타겟 고객층을 입력하면 사내 표준 기획서 양식에 맞춰 초안을 자동 생성합니다.",
    dept: "마케팅팀", submittedBy: "한지민", submittedAt: "2025.06.10",
    status: "개발 중",
    triggerAction: "사용자가 제품 컨셉·타겟 고객층 입력 → 사내 표준 기획서 양식으로 초안 생성",
    nodes: [], connectedApps: ["HK GPT"],
    expectedTimeSaved: "건당 1.5시간", difficulty: "쉬움",
    specificUrl: "https://assistant.kolmar.co.kr/agents/product-brief",
    itemTags: "기획서, 신제품, 마케팅",
    contacts: [{ name: "한지민", dept: "마케팅팀", role: "주담당자", email: "jimin.han@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
  // ★ 신규 — AI Agent(구 AI Orchestration) 신청
  {
    kind: "ai-orchestration",
    id: "AIO-2025-005", title: "Llama 3 (온프레미스 보안 특화)",
    summary: "외부 전송이 차단된 민감 문서 처리를 위한 온프레미스 모델",
    description: "기밀 등급 문서나 외부 유출이 금지된 자료를 처리할 때 사용하는 온프레미스 모델입니다.",
    dept: "IT개발팀", submittedBy: "정태영", submittedAt: "2025.06.11",
    status: "파일럿",
    provider: "Meta (사내 온프레미스 배포)", contextWindow: "128K", costTier: "낮음",
    strengths: "외부 전송 차단, 기밀문서 처리, 온프레미스",
    specificUrl: "https://ai-gateway.kolmar.co.kr/models/llama3-onprem",
    itemTags: "보안, 온프레미스, 기밀문서",
    contacts: [{ name: "정태영", dept: "IT개발팀", role: "주담당자", email: "taeyoung.jung@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
];

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  project: { color: "#475569", bg: "#F1F5F9", label: "프로젝트" },
  ...Object.fromEntries(PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])),
};

// ===== 모듈 레벨 공용 스타일 / 컴포넌트 =====
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 12px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
  borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
  paddingRight: 32, cursor: "pointer",
};

function TagSelect({ options, selected, onChange, disabled }: { options: string[]; selected: string[]; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(opt => {
        const isSel = selected.includes(opt);
        return (
          <span key={opt} onClick={() => !disabled && onChange(opt)} style={{
            fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 6,
            border: `1.5px solid ${isSel ? "#2563EB" : "#E2E8F0"}`,
            background: isSel ? "#EFF6FF" : "#fff",
            color: isSel ? "#2563EB" : "#475569",
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.6 : 1, userSelect: "none",
          }}>{opt}</span>
        );
      })}
    </div>
  );
}

function SingleSelectTag({ options, value, onChange, disabled }: { options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(opt => {
        const isSel = value === opt;
        return (
          <span key={opt} onClick={() => !disabled && onChange(opt)} style={{
            fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 6,
            border: `1.5px solid ${isSel ? "#2563EB" : "#E2E8F0"}`,
            background: isSel ? "#EFF6FF" : "#fff",
            color: isSel ? "#2563EB" : "#475569",
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.6 : 1, userSelect: "none",
          }}>{opt}</span>
        );
      })}
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 20px", marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #F1F5F9" }}>{title}</div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

// 노드/연동앱 칩 — 검토 화면에서도 관리자가 직접 추가/삭제 가능
function ChipEditor({ items, onAdd, onRemove, suggestions, placeholder, disabled }: {
  items: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void;
  suggestions: string[]; placeholder: string; disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      {items.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {items.map((v, i) => (
            <span key={i} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600, background: "#EEF2FF", color: "#4338CA",
              padding: "4px 6px 4px 10px", borderRadius: 20,
            }}>
              {v}
              {!disabled && (
                <button onClick={() => onRemove(v)} style={{ background: "none", border: "none", color: "#4338CA", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 3px", opacity: 0.7 }}>×</button>
              )}
            </span>
          ))}
        </div>
      )}
      {!disabled && (
        <>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (draft.trim()) { onAdd(draft.trim()); setDraft(""); } } }}
              placeholder={placeholder} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => { if (draft.trim()) { onAdd(draft.trim()); setDraft(""); } }} style={{
              background: "#2563EB", color: "#fff", border: "none", borderRadius: 7,
              padding: "0 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}>추가</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
            {suggestions.filter(s => !items.includes(s)).slice(0, 6).map(s => (
              <span key={s} onClick={() => onAdd(s)} style={{
                fontSize: 10, color: "#94A3B8", background: "#F8FAFC", border: "1px solid #E2E8F0",
                padding: "2px 8px", borderRadius: 20, cursor: "pointer",
              }}>+ {s}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminReview() {
  const [items, setItems] = useState<ReviewItem[]>(INITIAL_ITEMS);
  const [selected, setSelected] = useState(INITIAL_ITEMS[0]?.id ?? "");
  const [edits, setEdits] = useState<Record<string, Partial<ReviewItem>>>({});
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [filter, setFilter] = useState<"전체" | "대기" | "처리완료">("전체");
  const [sourceFilter, setSourceFilter] = useState<"전체" | "project" | PlatformId>("전체");
  const [done, setDone] = useState<string[]>([]);

  const [draftCompany, setDraftCompany] = useState(COMPANIES[1].code);
  const [draftParent, setDraftParent] = useState(NO_PARENT);
  const [draftDept, setDraftDept] = useState("");

  const activeItem = items.find(i => i.id === selected);
  const edit = (edits[selected] || {}) as Partial<ReviewItem>;
  const merged = activeItem ? ({ ...activeItem, ...edit } as ReviewItem) : null;
  const isDisabled = done.includes(selected);

  const setEdit = <K extends keyof ReviewItem>(k: K, v: any) =>
    setEdits(p => ({ ...p, [selected]: { ...(p[selected] || {}), [k]: v } }));

  const toggleMulti = (k: "domain" | "audience" | "stack", v: string) => {
    if (!merged || !isProjectKind(merged)) return;
    const cur = ((edit as any)[k] ?? (merged as any)[k] ?? []) as string[];
    setEdit(k as any, cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
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
    // TODO: 실제 연동 시
    //   kind === "project" → PATCH /api/v1/admin/projects/:id/approve
    //   그 외 → PATCH /api/v1/admin/platform-items/:id/approve
    setItems(p => p.map(i => i.id === selected ? ({ ...i, ...edit, approval: "승인" } as ReviewItem) : i));
    setDone(p => [...p, selected]);
    const remaining = items.filter(i => !done.includes(i.id) && i.id !== selected);
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  const handleReject = () => {
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

              {/* ★ 출처 필터 — 유형별로 통합 대기열을 좁혀볼 수 있게 */}
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as any)} style={{ ...selectStyle, fontSize: 11, padding: "6px 28px 6px 10px" }}>
                {SOURCE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredList.map(item => {
                const isDone = done.includes(item.id);
                const isSelected = selected === item.id;
                const sourceStyle = SOURCE_STYLE[item.kind];
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
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 2, opacity: isDone ? 0.5 : 1 }}>{item.title}</div>
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

                {!isDisabled && (
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
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                          {currentOrgEntries.map(e => (
                            <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 7, padding: "7px 11px" }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#1E40AF" }}>{orgEntryDisplay(e)}</span>
                              {!isDisabled && <button onClick={() => removeOrgEntry(e.id)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16 }}>×</button>}
                            </div>
                          ))}
                        </div>
                      )}
                      {!isDisabled && (
                        <div style={{ background: "#F8FAFC", border: "1.5px dashed #CBD5E1", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                            <select value={draftCompany} onChange={e => { setDraftCompany(e.target.value); setDraftParent(NO_PARENT); setDraftDept(""); }} style={{ ...selectStyle, fontSize: 11, padding: "6px 24px 6px 8px" }}>
                              {COMPANIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                            <select value={draftParent} onChange={e => { setDraftParent(e.target.value); setDraftDept(""); }} style={{ ...selectStyle, fontSize: 11, padding: "6px 24px 6px 8px" }}>
                              <option value={NO_PARENT}>{NO_PARENT}</option>
                              {availableParents.map(p => <option key={p}>{p}</option>)}
                            </select>
                            <select value={draftDept} onChange={e => setDraftDept(e.target.value)} disabled={draftParent === NO_PARENT} style={{ ...selectStyle, fontSize: 11, padding: "6px 24px 6px 8px", opacity: draftParent === NO_PARENT ? 0.5 : 1 }}>
                              <option value="">부서 없음</option>
                              {availableDepts.map(d => <option key={d}>{d}</option>)}
                            </select>
                          </div>
                          <button onClick={addOrgEntry} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ 추가</button>
                        </div>
                      )}
                    </FieldRow>

                    <FieldRow label="사용 대상">
                      <TagSelect options={AUDIENCES} selected={(edit as any).audience ?? merged.audience} onChange={v => toggleMulti("audience", v)} disabled={isDisabled} />
                    </FieldRow>
                    <FieldRow label="기술 스택">
                      <TagSelect options={STACK_OPTIONS} selected={(edit as any).stack ?? merged.stack} onChange={v => toggleMulti("stack", v)} disabled={isDisabled} />
                    </FieldRow>
                    <FieldRow label="연동 시스템">
                      <input value={(edit as any).integrations ?? merged.integrations} onChange={e => setEdit("integrations" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="자유 태그">
                      <input value={(edit as any).freeTags ?? merged.freeTags} onChange={e => setEdit("freeTags" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 분기: n8n / 나만의 비서 — 동작 정보 ===== */}
                {(merged.kind === "n8n" || merged.kind === "assistant") && (
                  <>
                    <SectionBlock title={`${SOURCE_STYLE[merged.kind].label} 동작 정보`}>
                      <FieldRow label="상태">
                        <SingleSelectTag options={STATUSES} value={(edit as any).status ?? merged.status} onChange={v => setEdit("status" as any, v)} disabled={isDisabled} />
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
                        <input value={(edit as any).expectedTimeSaved ?? (merged as ReviewPlatformItem).expectedTimeSaved ?? ""} onChange={e => setEdit("expectedTimeSaved" as any, e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} placeholder="예: 주 1시간" />
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
                    const removeContact = () => {
                      setEdit("contacts" as any, contacts.filter((_: Contact, ci: number) => ci !== i));
                    };

                    return (
                      <div key={i} style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8,
                        marginBottom: 8, alignItems: "center",
                      }}>
                        <input value={c.name} onChange={e => setContact("name", e.target.value)} disabled={isDisabled} placeholder="이름" style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                        <input value={c.dept} onChange={e => setContact("dept", e.target.value)} disabled={isDisabled} placeholder="부서" style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                        <input value={c.role} onChange={e => setContact("role", e.target.value)} disabled={isDisabled} placeholder="역할" style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                        <input value={c.email} onChange={e => setContact("email", e.target.value)} disabled={isDisabled} placeholder="이메일" style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                        {!isDisabled && contacts.length > 1 && (
                          <button onClick={removeContact} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                        )}
                      </div>
                    );
                  })}

                  {!isDisabled && (
                    <button
                      onClick={() => {
                        const contacts = (edit as any).contacts ?? merged.contacts;
                        setEdit("contacts" as any, [...contacts, { name: "", dept: "", role: "공동담당자", email: "" }]);
                      }}
                      style={{
                        background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 6,
                        padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer", marginTop: 4,
                      }}
                    >
                      + 담당자 추가
                    </button>
                  )}
                </SectionBlock>

                {/* ===== 승인/반려 액션 ===== */}
                {!isDisabled && (
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button onClick={handleApprove} style={{
                      flex: 1, background: "#059669", border: "none", borderRadius: 8,
                      padding: "11px 0", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
                    }}>승인</button>
                    <button onClick={() => setRejectOpen(v => !v)} style={{
                      flex: 1, background: "#fff", border: "1.5px solid #FECACA", borderRadius: 8,
                      padding: "11px 0", fontSize: 14, fontWeight: 700, color: "#EF4444", cursor: "pointer",
                    }}>반려</button>
                  </div>
                )}

                {rejectOpen && !isDisabled && (
                  <div style={{ marginTop: 12, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "14px 16px" }}>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="반려 사유를 입력하세요 (필수)"
                      style={{ ...inputStyle, minHeight: 70, resize: "vertical", marginBottom: 10 }} />
                    <button onClick={handleReject} disabled={!rejectReason.trim()} style={{
                      background: "#EF4444", border: "none", borderRadius: 7, padding: "8px 18px",
                      fontSize: 13, fontWeight: 700, color: "#fff",
                      cursor: rejectReason.trim() ? "pointer" : "not-allowed",
                      opacity: rejectReason.trim() ? 1 : 0.4,
                    }}>반려 확정</button>
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