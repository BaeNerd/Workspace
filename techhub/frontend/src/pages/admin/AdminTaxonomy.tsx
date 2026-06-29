import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { PLATFORMS } from "../../types/platformTypes";
import type { PlatformId } from "../../types/platformTypes";

// ===== 타입 정의 =====
type Category = {
  label: string; desc: string; type: "single" | "multi";
  items?: string[]; groups?: Record<string, string[]>;
};

type SourceKind = "project" | PlatformId;

type SourceItem = { id: string; kind: SourceKind; title: string };

type FreeTag = {
  tag: string;
  count: number;
  proposedBy: string;
  dept: string;
  sourceKind: SourceKind;
  sourceItems: SourceItem[];
};

// context를 사람이 읽는 문자열로 파생 생성 (sourceItems 기반)
const freeTagContext = (t: FreeTag): string => {
  if (t.sourceItems.length === 0) return "—";
  const [first, ...rest] = t.sourceItems;
  return rest.length > 0 ? `${first.title} 외 ${rest.length}건` : first.title;
};

// ===== Project 분류체계 =====
// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy 응답으로 교체
const INITIAL_TAXONOMY: Record<string, Category> = {
  domain: { label: "비즈니스 도메인", desc: "프로젝트가 속하는 업무 영역. 복수 선택 가능.", type: "multi", items: ["마케팅", "영업/CRM", "HR/인사", "재무/회계", "고객 서비스", "제조/생산", "IT 인프라", "데이터/분석", "보안", "내부 도구", "기타"] },
  systemType: { label: "시스템 유형", desc: "프로젝트의 기술적 형태 분류. 단일 선택.", type: "single", items: ["웹 애플리케이션", "모바일 앱", "API/서비스", "데이터 파이프라인", "ML/AI 모델", "배치/스케줄러", "인프라/DevOps 도구", "라이브러리/SDK", "내부 플랫폼", "내부 도구", "기타"] },
  status: { label: "프로젝트 상태", desc: "현재 프로젝트의 생애주기 단계. 단일 선택.", type: "single", items: ["개발 중", "운영 중", "파일럿", "보류", "종료"] },
  audience: { label: "사용 대상", desc: "이 시스템을 누가 사용하는가. 복수 선택 가능.", type: "multi", items: ["내부 직원 전체", "특정 부서", "외부 고객", "파트너사", "시스템 간 (내부 API)"] },
  stack: {
    label: "기술 스택", desc: "표준 기술 태그. 언어 / 프레임워크 / 인프라 / 데이터 그룹으로 구분.", type: "multi",
    groups: {
      "언어": ["Python", "JavaScript", "TypeScript", "Java", "Go", "Kotlin", "Swift", "C#", "Rust"],
      "프레임워크": ["React", "Next.js", "Vue", "Spring Boot", "FastAPI", "Django", "NestJS", "Flutter", "Three.js"],
      "인프라/클라우드": ["AWS", "GCP", "Azure", "Kubernetes", "Docker", "Terraform", "On-premise"],
      "데이터": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "Airflow", "Spark"],
    },
  },
};

// ===== PlatformItem 분류체계 (n8n / 나만의비서 공용 + AI Agent 전용) =====
// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy?scope=platform 응답으로 교체
const INITIAL_PLATFORM_TAXONOMY: Record<string, Category> = {
  nodeHints: {
    label: "노드 자동완성 힌트", desc: "n8n · 나만의 비서 등록 시 노드 입력란에서 제안되는 힌트 목록. 단순 추천용이라 자유 추가 가능.", type: "multi",
    items: ["Manual Trigger", "Schedule Trigger", "Form Trigger", "Chat Trigger", "Webhook", "Set (Edit Fields)", "Code", "IF", "Switch", "Filter", "Merge", "Aggregate", "Sort", "AI Agent", "Basic LLM Chain"],
  },
  appHints: {
    label: "연동 앱 힌트", desc: "n8n · 나만의 비서 등록 시 연동 앱 입력란에서 제안되는 힌트 목록.", type: "multi",
    items: ["Microsoft Outlook", "Microsoft Teams", "Microsoft One Drive", "Google Sheets", "HTTP Request", "Spreadsheet File", "Respond To Webhook"],
  },
  difficulty: {
    label: "구성 난이도", desc: "n8n · 나만의 비서 등록 시 선택하는 난이도 등급. 단일 선택.", type: "single",
    items: ["쉬움", "보통", "어려움"],
  },
  costTier: {
    label: "비용 등급", desc: "AI Agent 등록 시 선택하는 비용 등급. 단일 선택.", type: "single",
    items: ["낮음", "보통", "높음"],
  },
};

// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy/free-tags 응답으로 교체
const INITIAL_FREE_TAGS: FreeTag[] = [
  {
    tag: "Lab색공간", count: 3, proposedBy: "이수연", dept: "메이크업연구소", sourceKind: "project",
    sourceItems: [
      { id: "PRJ-2025-041", kind: "project", title: "조색 예측 ML 모델" },
      { id: "PRJ-2025-052", kind: "project", title: "색차 측정 리포트 생성기" },
      { id: "PRJ-2025-058", kind: "project", title: "원료 발색 데이터베이스" },
    ],
  },
  {
    tag: "조색", count: 5, proposedBy: "이수연", dept: "메이크업연구소", sourceKind: "project",
    sourceItems: [
      { id: "PRJ-2025-041", kind: "project", title: "조색 예측 ML 모델" },
      { id: "PRJ-2025-052", kind: "project", title: "색차 측정 리포트 생성기" },
      { id: "PRJ-2025-058", kind: "project", title: "원료 발색 데이터베이스" },
      { id: "PRJ-2025-061", kind: "project", title: "배합비 추천 시스템" },
      { id: "PRJ-2025-063", kind: "project", title: "조색 실험 이력 관리" },
    ],
  },
  {
    tag: "온보딩", count: 6, proposedBy: "박지현", dept: "인사팀", sourceKind: "project",
    sourceItems: Array.from({ length: 6 }, (_, i) => ({ id: `PRJ-2025-0${30 + i}`, kind: "project" as const, title: i === 0 ? "HR 온보딩 자동화 포털" : `관련 프로젝트 ${i}` })),
  },
  {
    tag: "발주", count: 2, proposedBy: "박성훈", dept: "구매팀", sourceKind: "project",
    sourceItems: [
      { id: "PRJ-2025-072", kind: "project", title: "구매 발주 자동화 시스템" },
      { id: "PRJ-2025-073", kind: "project", title: "발주 이력 조회 대시보드" },
    ],
  },
  {
    tag: "모니터링", count: 7, proposedBy: "강현우", dept: "법무팀", sourceKind: "project",
    sourceItems: Array.from({ length: 7 }, (_, i) => ({ id: `PRJ-2025-0${80 + i}`, kind: "project" as const, title: i === 0 ? "글로벌 규제 모니터링 대시보드" : `관련 프로젝트 ${i}` })),
  },
  // ★ 신규 — n8n에서 제안된 자유 태그
  {
    tag: "재고관리", count: 2, proposedBy: "김도윤", dept: "생산본부", sourceKind: "n8n",
    sourceItems: [
      { id: "N8N-010", kind: "n8n", title: "재고 임계치 도달 시 Teams 알림" },
      { id: "N8N-011", kind: "n8n", title: "재고 입출고 자동 집계" },
    ],
  },
  // ★ 신규 — 나만의 비서에서 제안된 자유 태그
  {
    tag: "신제품기획", count: 1, proposedBy: "한지민", dept: "마케팅팀", sourceKind: "assistant",
    sourceItems: [{ id: "AST-007", kind: "assistant", title: "신제품 기획서 초안 작성 도우미" }],
  },
  // ★ 신규 — AI Agent에서 제안된 자유 태그
  {
    tag: "온프레미스보안", count: 1, proposedBy: "정태영", dept: "IT개발팀", sourceKind: "ai-orchestration",
    sourceItems: [{ id: "AIO-005", kind: "ai-orchestration", title: "Llama 3 (온프레미스 보안 특화)" }],
  },
];

const PROJECT_TABS = [
  { id: "domain", label: "비즈니스 도메인" },
  { id: "systemType", label: "시스템 유형" },
  { id: "status", label: "프로젝트 상태" },
  { id: "audience", label: "사용 대상" },
  { id: "stack", label: "기술 스택" },
] as const;

const PLATFORM_TABS = [
  { id: "nodeHints", label: "노드 힌트" },
  { id: "appHints", label: "연동 앱 힌트" },
  { id: "difficulty", label: "구성 난이도" },
  { id: "costTier", label: "비용 등급" },
] as const;

const TABS = [
  ...PROJECT_TABS,
  ...PLATFORM_TABS,
  { id: "freeTags", label: "자유 태그" } as const,
];

type TabId = typeof TABS[number]["id"];

const isPlatformTab = (id: TabId): boolean => PLATFORM_TABS.some(t => t.id === id);

// ===== 출처 표시 스타일 (project + PLATFORMS.map 기반) =====
const SOURCE_STYLE: Record<SourceKind, { color: string; bg: string; label: string }> = {
  project: { color: "#475569", bg: "#F1F5F9", label: "프로젝트" },
  ...Object.fromEntries(PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])) as Record<PlatformId, { color: string; bg: string; label: string }>,
};

// 출처별로 편입 가능한 목적지 분류체계 옵션
const IMPORT_DEST_OPTIONS: Record<SourceKind, { key: string; label: string }[]> = {
  project: [
    { key: "domain", label: "비즈니스 도메인" },
    { key: "systemType", label: "시스템 유형" },
    { key: "audience", label: "사용 대상" },
    { key: "stack", label: "기술 스택" },
  ],
  n8n: [
    { key: "nodeHints", label: "노드 자동완성 힌트" },
    { key: "appHints", label: "연동 앱 힌트" },
  ],
  assistant: [
    { key: "nodeHints", label: "노드 자동완성 힌트" },
    { key: "appHints", label: "연동 앱 힌트" },
  ],
  "ai-orchestration": [
    { key: "costTier", label: "비용 등급" },
  ],
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 12px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
  borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32, cursor: "pointer" };

// ===== 재사용 서브컴포넌트 (모듈 레벨 — 컴포넌트 함수 바깥에 정의) =====

type ItemRowProps = {
  label: string;
  keyName: string;
  group: string | null;
  idx: number;
  editingItem: { key: string; group: string | null; idx: number; value: string } | null;
  deleteConfirm: { key: string; group: string | null; idx: number } | null;
  onStartEdit: (key: string, group: string | null, idx: number, value: string) => void;
  onEditValueChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onStartDelete: (key: string, group: string | null, idx: number) => void;
  onDeleteConfirm: (key: string, group: string | null, idx: number) => void;
  onDeleteCancel: () => void;
};

const ItemRow = ({
  label, keyName, group, idx, editingItem, deleteConfirm,
  onStartEdit, onEditValueChange, onEditSave, onEditCancel,
  onStartDelete, onDeleteConfirm, onDeleteCancel,
}: ItemRowProps) => {
  const isEditing = editingItem?.key === keyName && editingItem?.group === group && editingItem?.idx === idx;
  const isDeleteTarget = deleteConfirm?.key === keyName && deleteConfirm?.group === group && deleteConfirm?.idx === idx;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
      background: isEditing ? "#EFF6FF" : isDeleteTarget ? "#FEF2F2" : "#fff",
      borderRadius: 7, border: `1px solid ${isEditing ? "#BFDBFE" : isDeleteTarget ? "#FECACA" : "#F1F5F9"}`, marginBottom: 6,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1", flexShrink: 0 }} />
      {isEditing ? (
        <>
          <input value={editingItem.value} onChange={e => onEditValueChange(e.target.value)} style={{ ...inputStyle, flex: 1, padding: "5px 10px", fontSize: 13 }} autoFocus />
          <button onClick={onEditSave} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>저장</button>
          <button onClick={onEditCancel} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 5, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
        </>
      ) : isDeleteTarget ? (
        <>
          <span style={{ flex: 1, fontSize: 13, color: "#991B1B", fontWeight: 600 }}>"{label}" 삭제할까요?</span>
          <button onClick={() => onDeleteConfirm(keyName, group, idx)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>삭제</button>
          <button onClick={onDeleteCancel} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 5, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 13, color: "#334155" }}>{label}</span>
          <button onClick={() => onStartEdit(keyName, group, idx, label)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>수정</button>
          <button onClick={() => onStartDelete(keyName, group, idx)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>삭제</button>
        </>
      )}
    </div>
  );
};

export default function AdminTaxonomy() {

  const [activeTab, setActiveTab] = useState<TabId>("domain");
  const [taxonomy, setTaxonomy] = useState(INITIAL_TAXONOMY);
  const [platformTaxonomy, setPlatformTaxonomy] = useState(INITIAL_PLATFORM_TAXONOMY);
  const [freeTags, setFreeTags] = useState<FreeTag[]>(INITIAL_FREE_TAGS);
  const [freeTagSourceFilter, setFreeTagSourceFilter] = useState<"전체" | SourceKind>("전체");
  const [newItem, setNewItem] = useState("");
  const [newGroup, setNewGroup] = useState("언어");
  const [editingItem, setEditingItem] = useState<{ key: string; group: string | null; idx: number; value: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ key: string; group: string | null; idx: number } | null>(null);
  const [importTag, setImportTag] = useState<string | null>(null);
  const [importDest, setImportDest] = useState({ key: "domain", group: "" });
  const [savedMsg, setSavedMsg] = useState("");
  const [selectedFreeTags, setSelectedFreeTags] = useState<string[]>([]);

  const showSaved = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(""), 2200); };

  // 현재 활성 탭이 Project/PlatformItem 중 어느 분류체계에 속하는지에 따라 올바른 state를 참조
  const isPlatform = activeTab !== "freeTags" && isPlatformTab(activeTab);
  const cat = activeTab !== "freeTags" ? (isPlatform ? platformTaxonomy[activeTab] : taxonomy[activeTab]) : null;

  // ===== 출처 필터링된 자유 태그 목록 =====
  const filteredFreeTags = freeTags.filter(t => freeTagSourceFilter === "전체" || t.sourceKind === freeTagSourceFilter);

  // ===== 항목 추가 =====
  const handleAdd = () => {
    if (!newItem.trim()) return;
    // TODO: 실제 연동 시 POST /api/v1/admin/taxonomy/:category/items (scope=project 또는 platform)
    if (activeTab === "stack") {
      setTaxonomy(p => ({ ...p, stack: { ...p.stack, groups: { ...p.stack.groups!, [newGroup]: [...(p.stack.groups![newGroup] || []), newItem.trim()] } } }));
    } else if (isPlatform) {
      setPlatformTaxonomy(p => ({ ...p, [activeTab]: { ...p[activeTab], items: [...(p[activeTab].items || []), newItem.trim()] } }));
    } else {
      setTaxonomy(p => ({ ...p, [activeTab]: { ...p[activeTab], items: [...(p[activeTab].items || []), newItem.trim()] } }));
    }
    setNewItem("");
    showSaved("항목이 추가되었습니다.");
  };

  // ===== 항목 삭제 =====
  const handleDelete = (key: string, group: string | null, idx: number) => {
    // TODO: 실제 연동 시 DELETE /api/v1/admin/taxonomy/:category/items/:idx
    if (key === "stack" && group) {
      setTaxonomy(p => ({ ...p, stack: { ...p.stack, groups: { ...p.stack.groups!, [group]: p.stack.groups![group].filter((_, i) => i !== idx) } } }));
    } else if (isPlatformTab(key as TabId)) {
      setPlatformTaxonomy(p => ({ ...p, [key]: { ...p[key], items: p[key].items!.filter((_, i) => i !== idx) } }));
    } else {
      setTaxonomy(p => ({ ...p, [key]: { ...p[key], items: p[key].items!.filter((_, i) => i !== idx) } }));
    }
    setDeleteConfirm(null);
    showSaved("항목이 삭제되었습니다.");
  };

  // ===== 항목 수정 =====
  const handleEditSave = () => {
    if (!editingItem || !editingItem.value.trim()) return;
    const { key, group, idx, value } = editingItem;
    // TODO: 실제 연동 시 PUT /api/v1/admin/taxonomy/:category/items/:idx
    if (key === "stack" && group) {
      setTaxonomy(p => ({ ...p, stack: { ...p.stack, groups: { ...p.stack.groups!, [group]: p.stack.groups![group].map((v, i) => i === idx ? value : v) } } }));
    } else if (isPlatformTab(key as TabId)) {
      setPlatformTaxonomy(p => ({ ...p, [key]: { ...p[key], items: p[key].items!.map((v, i) => i === idx ? value : v) } }));
    } else {
      setTaxonomy(p => ({ ...p, [key]: { ...p[key], items: p[key].items!.map((v, i) => i === idx ? value : v) } }));
    }
    setEditingItem(null);
    showSaved("항목이 수정되었습니다.");
  };

  // ===== 자유 태그 표준화 편입 (출처에 맞는 분류체계로만) =====
  const handleImport = (tag: string) => {
    const target = freeTags.find(t => t.tag === tag);
    if (!target) return;
    // TODO: 실제 연동 시 POST /api/v1/admin/taxonomy/free-tags/:tag/promote
    const { key, group } = importDest;
    if (key === "stack" && group) {
      setTaxonomy(p => ({ ...p, stack: { ...p.stack, groups: { ...p.stack.groups!, [group]: [...(p.stack.groups![group] || []), tag] } } }));
    } else if (isPlatformTab(key as TabId)) {
      setPlatformTaxonomy(p => ({ ...p, [key]: { ...p[key], items: [...(p[key].items || []), tag] } }));
    } else {
      setTaxonomy(p => ({ ...p, [key]: { ...p[key], items: [...(p[key].items || []), tag] } }));
    }
    setFreeTags(p => p.filter(t => t.tag !== tag));
    setImportTag(null);
    showSaved(`"${tag}" 항목이 표준 분류로 편입되었습니다.`);
  };

  // 표준화 패널을 열 때, 해당 태그의 출처에 맞는 첫 번째 목적지를 기본값으로 설정
  const openImportPanel = (tag: string) => {
    const target = freeTags.find(t => t.tag === tag);
    if (!target) return;
    const firstOption = IMPORT_DEST_OPTIONS[target.sourceKind][0];
    setImportDest({ key: firstOption.key, group: firstOption.key === "stack" ? "언어" : "" });
    setImportTag(tag);
  };

  const handleFreeTagDelete = (tags: string[]) => {
    // TODO: 실제 연동 시 DELETE /api/v1/admin/taxonomy/free-tags (body: { tags })
    setFreeTags(p => p.filter(t => !tags.includes(t.tag)));
    setSelectedFreeTags([]);
    showSaved("선택한 태그가 삭제되었습니다.");
  };

  const toggleFreeTag = (tag: string) => setSelectedFreeTags(p => p.includes(tag) ? p.filter(x => x !== tag) : [...p, tag]);

  // ItemRow에 전달할 핸들러 묶음
  const startEdit = (key: string, group: string | null, idx: number, value: string) => setEditingItem({ key, group, idx, value });
  const editValueChange = (value: string) => setEditingItem(p => p ? { ...p, value } : p);
  const startDelete = (key: string, group: string | null, idx: number) => setDeleteConfirm({ key, group, idx });

  const importTagData = importTag ? freeTags.find(t => t.tag === importTag) : null;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>분류체계 관리</h1>
              <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>프로젝트 및 플랫폼 항목(n8n·나만의 비서·AI Agent)의 표준 분류를 관리합니다.</p>
            </div>
            {savedMsg && (
              <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#065F46" }}>
                {savedMsg}
              </div>
            )}
          </div>

          {/* ===== 탭 바 — Project 분류 / 구분선 / Platform 분류 / 자유 태그 ===== */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            {PROJECT_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: "8px 16px", borderRadius: 7, border: activeTab === t.id ? "none" : "1px solid #E2E8F0",
                background: activeTab === t.id ? "#0F172A" : "transparent",
                color: activeTab === t.id ? "#fff" : "#475569",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {t.label}
              </button>
            ))}

            <span style={{ width: 1, height: 18, background: "#E2E8F0", margin: "0 4px" }} />

            {PLATFORM_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: "8px 16px", borderRadius: 7, border: activeTab === t.id ? "none" : "1px solid #E2E8F0",
                background: activeTab === t.id ? "#0F172A" : "transparent",
                color: activeTab === t.id ? "#fff" : "#475569",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 1.5, background: "#7C3AED", display: "inline-block", opacity: activeTab === t.id ? 1 : 0.6 }} />
                {t.label}
              </button>
            ))}

            <span style={{ width: 1, height: 18, background: "#E2E8F0", margin: "0 4px" }} />

            <button onClick={() => setActiveTab("freeTags")} style={{
              padding: "8px 16px", borderRadius: 7, border: activeTab === "freeTags" ? "none" : "1px solid #E2E8F0",
              background: activeTab === "freeTags" ? "#0F172A" : "transparent",
              color: activeTab === "freeTags" ? "#fff" : "#475569",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              자유 태그
              {freeTags.length > 0 && (
                <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 800, background: activeTab === "freeTags" ? "rgba(255,255,255,0.25)" : "#EF4444", color: "#fff", padding: "1px 5px", borderRadius: 20 }}>{freeTags.length}</span>
              )}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
            <div>
              {/* ===== 분류 항목 목록 (Project + Platform 공통 렌더링) ===== */}
              {activeTab !== "freeTags" && cat && (
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{cat.label}</div>
                      {isPlatform && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: "#F3E8FF", color: "#7E22CE", padding: "2px 8px", borderRadius: 20 }}>플랫폼 항목 전용</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{cat.desc}</div>
                  </div>

                  {activeTab === "stack" && cat.groups ? (
                    Object.entries(cat.groups).map(([group, items]) => (
                      <div key={group} style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{group}</div>
                        {items.map((item, idx) => (
                          <ItemRow
                            key={idx} label={item} keyName="stack" group={group} idx={idx}
                            editingItem={editingItem} deleteConfirm={deleteConfirm}
                            onStartEdit={startEdit} onEditValueChange={editValueChange}
                            onEditSave={handleEditSave} onEditCancel={() => setEditingItem(null)}
                            onStartDelete={startDelete} onDeleteConfirm={handleDelete}
                            onDeleteCancel={() => setDeleteConfirm(null)}
                          />
                        ))}
                      </div>
                    ))
                  ) : (
                    cat.items?.map((item, idx) => (
                      <ItemRow
                        key={idx} label={item} keyName={activeTab} group={null} idx={idx}
                        editingItem={editingItem} deleteConfirm={deleteConfirm}
                        onStartEdit={startEdit} onEditValueChange={editValueChange}
                        onEditSave={handleEditSave} onEditCancel={() => setEditingItem(null)}
                        onStartDelete={startDelete} onDeleteConfirm={handleDelete}
                        onDeleteCancel={() => setDeleteConfirm(null)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* ===== 자유 태그 누적 목록 ===== */}
              {activeTab === "freeTags" && (
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>자유 태그 누적 목록</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>사용자가 항목 등록 시 제안한 태그입니다. 프로젝트뿐 아니라 n8n·나만의 비서·AI Agent 등록에서도 수집됩니다.</div>
                    </div>
                    {selectedFreeTags.length > 0 && (
                      <button onClick={() => handleFreeTagDelete(selectedFreeTags)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>선택 삭제 ({selectedFreeTags.length})</button>
                    )}
                  </div>

                  {/* 출처 필터 */}
                  <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
                    {(["전체", "project", ...PLATFORMS.map(p => p.id)] as const).map(key => {
                      const style = key === "전체" ? null : SOURCE_STYLE[key];
                      const label = key === "전체" ? "전체" : SOURCE_STYLE[key].label;
                      return (
                        <button key={key} onClick={() => setFreeTagSourceFilter(key)} style={{
                          padding: "4px 11px", borderRadius: 20, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                          background: freeTagSourceFilter === key ? "#0F172A" : "#F1F5F9",
                          color: freeTagSourceFilter === key ? "#fff" : "#64748B",
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                          {style && <span style={{ width: 6, height: 6, borderRadius: 1.5, background: freeTagSourceFilter === key ? "#fff" : style.color, display: "inline-block" }} />}
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filteredFreeTags.map((t, i) => {
                      const style = SOURCE_STYLE[t.sourceKind];
                      return (
                        <div key={i} style={{ borderRadius: 8, border: `1px solid ${selectedFreeTags.includes(t.tag) ? "#BFDBFE" : "#F1F5F9"}`, background: selectedFreeTags.includes(t.tag) ? "#EFF6FF" : "#fff" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                            <input type="checkbox" checked={selectedFreeTags.includes(t.tag)} onChange={() => toggleFreeTag(t.tag)} style={{ cursor: "pointer", flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, background: style.bg, color: style.color, padding: "1px 7px", borderRadius: 20, flexShrink: 0 }}>{style.label}</span>
                                <span style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>#{t.tag}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, background: "#F1F5F9", color: "#475569", padding: "1px 7px", borderRadius: 20 }}>사용 {t.count}건</span>
                              </div>
                              <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>
                                제안자: <strong style={{ color: "#64748B" }}>{t.proposedBy}</strong> ({t.dept}) · 사용 항목: {freeTagContext(t)}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              <button onClick={() => openImportPanel(t.tag)} style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#2563EB", cursor: "pointer" }}>표준화</button>
                              <button onClick={() => handleFreeTagDelete([t.tag])} style={{ background: "none", border: "1px solid #FECACA", borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredFreeTags.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8", fontSize: 13 }}>누적된 자유 태그가 없습니다.</div>}
                  </div>
                </div>
              )}
            </div>

            {/* ===== 우측 패널: 항목 추가 / 표준화 편입 ===== */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeTab !== "freeTags" && (
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>항목 추가</div>
                  {activeTab === "stack" && (
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>그룹 선택</label>
                      <select value={newGroup} onChange={e => setNewGroup(e.target.value)} style={selectStyle}>
                        {Object.keys(taxonomy.stack.groups!).map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  )}
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>항목명</label>
                  <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} placeholder="새 항목 입력 후 Enter 또는 추가" style={inputStyle} />
                  <button onClick={handleAdd} style={{ width: "100%", marginTop: 10, background: "#2563EB", color: "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>추가</button>
                </div>
              )}

              {importTag && importTagData && (
                <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 4 }}>표준화 편입</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: SOURCE_STYLE[importTagData.sourceKind].bg, color: SOURCE_STYLE[importTagData.sourceKind].color, padding: "1px 7px", borderRadius: 20 }}>
                      {SOURCE_STYLE[importTagData.sourceKind].label} 출처
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#3B82F6", marginBottom: 14 }}><strong>#{importTag}</strong> 를 어느 분류에 편입할지 선택하세요. 출처에 맞는 분류체계만 표시됩니다.</div>

                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>편입 분류</label>
                  <select value={importDest.key} onChange={e => setImportDest({ key: e.target.value, group: e.target.value === "stack" ? "언어" : "" })} style={{ ...selectStyle, marginBottom: 8 }}>
                    {IMPORT_DEST_OPTIONS[importTagData.sourceKind].map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                  </select>

                  {importDest.key === "stack" && (
                    <>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>스택 그룹</label>
                      <select value={importDest.group} onChange={e => setImportDest(p => ({ ...p, group: e.target.value }))} style={{ ...selectStyle, marginBottom: 8 }}>
                        {Object.keys(taxonomy.stack.groups!).map(g => <option key={g}>{g}</option>)}
                      </select>
                    </>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => setImportTag(null)} style={{ flex: 1, background: "#fff", border: "1px solid #BFDBFE", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                    <button onClick={() => handleImport(importTag)} style={{ flex: 1, background: "#2563EB", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>편입 확정</button>
                  </div>
                </div>
              )}

              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>
                <strong>운영 유의사항</strong><br />
                고정 분류 항목을 삭제하면 기존에 태깅된 프로젝트·플랫폼 항목의 해당 분류가 공란으로 처리될 수 있습니다.
                노드·연동앱 힌트는 단순 추천용이므로 삭제해도 기존 항목의 실제 노드 구성에는 영향이 없습니다.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}