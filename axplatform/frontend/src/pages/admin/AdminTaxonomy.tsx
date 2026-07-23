import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { CATEGORIES, BUSINESS_DOMAINS } from "../../types/categoryTypes";
import type { CategoryId } from "../../types/categoryTypes";

// ===== 타입 정의 =====
type Category = {
  label: string; desc: string; type: "single" | "multi";
  items?: string[];
};

type SourceKind = CategoryId;
type SourceItem = { id: string; kind: SourceKind; title: string };
type FreeTag = {
  tag: string; count: number; proposedBy: string; dept: string;
  sourceKind: SourceKind; sourceItems: SourceItem[];
};

const freeTagContext = (t: FreeTag): string => {
  if (t.sourceItems.length === 0) return "—";
  const [first, ...rest] = t.sourceItems;
  return rest.length > 0 ? `${first.title} 외 ${rest.length}건` : first.title;
};

// ===== AX 플랫폼 분류체계 =====
// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy?scope=platform 응답으로 교체
const INITIAL_CATEGORY_TAXONOMY: Record<string, Category> = {
  businessDomain: {
    label: "업무 도메인",
    desc: "AX 플랫폼 항목에 배정되는 업무 도메인 분류. 단일 선택. 등록 시 선택 가능한 값 목록을 관리한다.",
    type: "single",
    items: [...BUSINESS_DOMAINS],
  },
  difficulty: {
    label: "구성 난이도",
    desc: "n8n 등록 시 선택하는 난이도 등급. 단일 선택. n8n 전용. (PA·나만의 비서·AI Model·ML·Vibe·AI 프로젝트 에는 적용되지 않는다)",
    type: "single",
    items: ["쉬움", "보통", "어려움"],
  },
  costTier: {
    label: "비용 등급",
    desc: "AI Model 등록 시 선택하는 비용 등급. 단일 선택. AI Model 전용.",
    type: "single",
    items: ["낮음", "보통", "높음"],
  },
  mlTypes: {
    label: "ML 모델 유형",
    desc: "ML 모델 등록 시 사용하는 모델 유형 분류. 단일 선택. ML 전용.",
    type: "single",
    items: ["분류 (Classification)", "회귀 (Regression)", "클러스터링", "NLP / 텍스트", "이미지 인식", "시계열 예측", "추천 시스템", "이상 탐지", "강화학습", "멀티모달"],
  },
};

// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy/free-tags 응답으로 교체
const INITIAL_FREE_TAGS: FreeTag[] = [
  {
    tag: "재고관리", count: 2, proposedBy: "김도윤", dept: "생산본부", sourceKind: "n8n",
    sourceItems: [
      { id: "N8N-2026-010", kind: "n8n", title: "재고 임계치 도달 시 Teams 알림" },
      { id: "N8N-2026-011", kind: "n8n", title: "재고 입출고 자동 집계" },
    ],
  },
  {
    tag: "결재자동화", count: 1, proposedBy: "최유진", dept: "구매팀", sourceKind: "pa",
    sourceItems: [{ id: "PA-2026-003", kind: "pa", title: "구매 결재 자동 승인 플로우" }],
  },
  {
    tag: "신제품기획", count: 1, proposedBy: "한지민", dept: "마케팅팀", sourceKind: "assistant",
    sourceItems: [{ id: "AST-2026-007", kind: "assistant", title: "신제품 기획서 초안 작성 도우미" }],
  },
  {
    tag: "온프레미스보안", count: 1, proposedBy: "정태영", dept: "IT개발팀", sourceKind: "ai-orchestration",
    sourceItems: [{ id: "AIO-2026-005", kind: "ai-orchestration", title: "Llama 3" }],
  },
  {
    tag: "이미지분류", count: 1, proposedBy: "오승현", dept: "연구개발본부", sourceKind: "ml",
    sourceItems: [{ id: "ML-2026-002", kind: "ml", title: "성분 이미지 품질 분류 모델" }],
  },
  {
    tag: "AI페어프로그래밍", count: 1, proposedBy: "이상민", dept: "IT개발팀", sourceKind: "vibe",
    sourceItems: [{ id: "VIBE-2026-001", kind: "vibe", title: "Cursor 기반 내부 API 자동 생성" }],
  },
  {
    tag: "AI뉴스", count: 1, proposedBy: "한지민", dept: "DX추진팀", sourceKind: "etc",
    sourceItems: [{ id: "ETC-2026-001", kind: "etc", title: "사내 AI 뉴스 주간 요약 미니 프로젝트" }],
  },
];

const CATEGORY_TABS = [
  { id: "businessDomain", label: "업무 도메인" },
  { id: "difficulty", label: "구성 난이도" },
  { id: "costTier", label: "비용 등급" },
  { id: "mlTypes", label: "ML 모델 유형" },
] as const;

const TABS = [
  ...CATEGORY_TABS,
  { id: "freeTags", label: "자유 태그" } as const,
];

type TabId = typeof TABS[number]["id"];

// ===== 출처 표시 스타일 (CATEGORIES 기반) =====
const SOURCE_STYLE: Record<SourceKind, { color: string; bg: string; label: string }> = Object.fromEntries(
  CATEGORIES.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])
) as Record<CategoryId, { color: string; bg: string; label: string }>;

// 출처별로 편입 가능한 목적지 분류체계 옵션.
// assistant: 표준 분류에 편입할 마땅한 카테고리 없음 → 빈 배열 (표준화 버튼 미노출)
const IMPORT_DEST_OPTIONS: Record<SourceKind, { key: string; label: string }[]> = {
  n8n: [], // n8n: 노드 힌트 폐기 후 편입 대상 없음 (표준화 버튼 미노출)
  pa: [], // PA: 표준 분류에 편입할 카테고리 없음 (표준화 버튼 미노출)
  assistant: [],
  "ai-orchestration": [
    { key: "costTier", label: "비용 등급" },
  ],
  ml: [
    { key: "mlTypes", label: "ML 모델 유형" },
  ],
  vibe: [], // Vibe: 표준 분류에 편입할 카테고리 없음 (표준화 버튼 미노출)
  etc: [], // AI 프로젝트: 표준 분류에 편입할 카테고리 없음 (표준화 버튼 미노출)
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 12px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
  borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32, cursor: "pointer" };

// ===== 재사용 서브컴포넌트 (모듈 레벨) =====
type ItemRowProps = {
  label: string; keyName: string; idx: number;
  editingItem: { key: string; idx: number; value: string } | null;
  deleteConfirm: { key: string; idx: number } | null;
  onStartEdit: (key: string, idx: number, value: string) => void;
  onEditValueChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onStartDelete: (key: string, idx: number) => void;
  onDeleteConfirm: (key: string, idx: number) => void;
  onDeleteCancel: () => void;
};

const ItemRow = ({
  label, keyName, idx, editingItem, deleteConfirm,
  onStartEdit, onEditValueChange, onEditSave, onEditCancel,
  onStartDelete, onDeleteConfirm, onDeleteCancel,
}: ItemRowProps) => {
  const isEditing = editingItem?.key === keyName && editingItem?.idx === idx;
  const isDeleteTarget = deleteConfirm?.key === keyName && deleteConfirm?.idx === idx;
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
          <button onClick={() => onDeleteConfirm(keyName, idx)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>삭제</button>
          <button onClick={onDeleteCancel} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 5, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 13, color: "#334155" }}>{label}</span>
          <button onClick={() => onStartEdit(keyName, idx, label)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>수정</button>
          <button onClick={() => onStartDelete(keyName, idx)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>삭제</button>
        </>
      )}
    </div>
  );
};

export default function AdminTaxonomy() {
  const [activeTab, setActiveTab] = useState<TabId>("businessDomain");
  const [categoryTaxonomy, setCategoryTaxonomy] = useState(INITIAL_CATEGORY_TAXONOMY);
  const [freeTags, setFreeTags] = useState<FreeTag[]>(INITIAL_FREE_TAGS);
  const [freeTagSourceFilter, setFreeTagSourceFilter] = useState<"전체" | SourceKind>("전체");
  const [newItem, setNewItem] = useState("");
  const [editingItem, setEditingItem] = useState<{ key: string; idx: number; value: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ key: string; idx: number } | null>(null);
  const [importTag, setImportTag] = useState<string | null>(null);
  const [importDest, setImportDest] = useState({ key: "costTier" });
  const [savedMsg, setSavedMsg] = useState("");
  const [selectedFreeTags, setSelectedFreeTags] = useState<string[]>([]);

  const showSaved = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(""), 2200); };

  const cat = activeTab !== "freeTags" ? categoryTaxonomy[activeTab] : null;
  const filteredFreeTags = freeTags.filter(t => freeTagSourceFilter === "전체" || t.sourceKind === freeTagSourceFilter);

  const handleAdd = () => {
    if (!newItem.trim() || activeTab === "freeTags") return;
    // TODO: 실제 연동 시 POST /api/v1/admin/taxonomy/:category/items
    setCategoryTaxonomy(p => ({ ...p, [activeTab]: { ...p[activeTab], items: [...(p[activeTab].items || []), newItem.trim()] } }));
    setNewItem("");
    showSaved("항목이 추가되었습니다.");
  };

  const handleDelete = (key: string, idx: number) => {
    // TODO: 실제 연동 시 DELETE /api/v1/admin/taxonomy/:category/items/:idx
    setCategoryTaxonomy(p => ({ ...p, [key]: { ...p[key], items: p[key].items!.filter((_, i) => i !== idx) } }));
    setDeleteConfirm(null);
    showSaved("항목이 삭제되었습니다.");
  };

  const handleEditSave = () => {
    if (!editingItem || !editingItem.value.trim()) return;
    const { key, idx, value } = editingItem;
    // TODO: 실제 연동 시 PUT /api/v1/admin/taxonomy/:category/items/:idx
    setCategoryTaxonomy(p => ({ ...p, [key]: { ...p[key], items: p[key].items!.map((v, i) => i === idx ? value : v) } }));
    setEditingItem(null);
    showSaved("항목이 수정되었습니다.");
  };

  const handleImport = (tag: string) => {
    const target = freeTags.find(t => t.tag === tag);
    if (!target) return;
    // TODO: 실제 연동 시 POST /api/v1/admin/taxonomy/free-tags/:tag/promote
    const { key } = importDest;
    setCategoryTaxonomy(p => ({ ...p, [key]: { ...p[key], items: [...(p[key].items || []), tag] } }));
    setFreeTags(p => p.filter(t => t.tag !== tag));
    setImportTag(null);
    showSaved(`"${tag}" 항목이 표준 분류로 편입되었습니다.`);
  };

  const openImportPanel = (tag: string) => {
    const target = freeTags.find(t => t.tag === tag);
    if (!target) return;
    const options = IMPORT_DEST_OPTIONS[target.sourceKind];
    if (!options || options.length === 0) return;
    setImportDest({ key: options[0].key });
    setImportTag(tag);
  };

  const handleFreeTagDelete = (tags: string[]) => {
    // TODO: 실제 연동 시 DELETE /api/v1/admin/taxonomy/free-tags (body: { tags })
    setFreeTags(p => p.filter(t => !tags.includes(t.tag)));
    setSelectedFreeTags([]);
    showSaved("선택한 태그가 삭제되었습니다.");
  };

  const toggleFreeTag = (tag: string) => setSelectedFreeTags(p => p.includes(tag) ? p.filter(x => x !== tag) : [...p, tag]);
  const startEdit = (key: string, idx: number, value: string) => setEditingItem({ key, idx, value });
  const editValueChange = (value: string) => setEditingItem(p => p ? { ...p, value } : p);
  const startDelete = (key: string, idx: number) => setDeleteConfirm({ key, idx });

  const importTagData = importTag ? freeTags.find(t => t.tag === importTag) : null;

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />
      <div style={{ display: "flex" }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>분류체계 관리</h1>
              <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>AX 플랫폼 항목(n8n · PA · 나만의 비서 · AI Model · ML · Vibe · AI 프로젝트)의 표준 분류를 관리합니다.</p>
            </div>
            {savedMsg && (
              <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#065F46" }}>
                {savedMsg}
              </div>
            )}
          </div>

          {/* 탭 바 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            {CATEGORY_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: "8px 16px", borderRadius: 7, border: activeTab === t.id ? "none" : "1px solid #E2E8F0",
                background: activeTab === t.id ? "#0F172A" : "transparent",
                color: activeTab === t.id ? "#fff" : "#475569",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 1.5, background: "#7C3AED", display: "inline-block", opacity: activeTab === t.id ? 1 : 0.5 }} />
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
              {/* 분류 항목 목록 */}
              {activeTab !== "freeTags" && cat && (
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{cat.label}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#F3E8FF", color: "#7E22CE", padding: "2px 8px", borderRadius: 20 }}>AX 플랫폼 항목 전용</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{cat.desc}</div>
                  </div>
                  {cat.items?.map((item, idx) => (
                    <ItemRow
                      key={idx} label={item} keyName={activeTab} idx={idx}
                      editingItem={editingItem} deleteConfirm={deleteConfirm}
                      onStartEdit={startEdit} onEditValueChange={editValueChange}
                      onEditSave={handleEditSave} onEditCancel={() => setEditingItem(null)}
                      onStartDelete={startDelete} onDeleteConfirm={handleDelete}
                      onDeleteCancel={() => setDeleteConfirm(null)}
                    />
                  ))}
                </div>
              )}

              {/* 자유 태그 누적 목록 */}
              {activeTab === "freeTags" && (
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>자유 태그 누적 목록</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>사용자가 AX 플랫폼 항목 등록 시 제안한 비표준 태그입니다. 7개 유형(n8n · PA · 나만의 비서 · AI Model · ML · Vibe · AI 프로젝트) 등록에서 수집됩니다.</div>
                    </div>
                    {selectedFreeTags.length > 0 && (
                      <button onClick={() => handleFreeTagDelete(selectedFreeTags)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>선택 삭제 ({selectedFreeTags.length})</button>
                    )}
                  </div>

                  {/* 출처 필터 */}
                  <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
                    {(["전체", ...CATEGORIES.map(p => p.id)] as const).map(key => {
                      const style = key === "전체" ? null : SOURCE_STYLE[key as SourceKind];
                      const label = key === "전체" ? "전체" : SOURCE_STYLE[key as SourceKind].label;
                      return (
                        <button key={key} onClick={() => setFreeTagSourceFilter(key as "전체" | SourceKind)} style={{
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
                      const canPromote = IMPORT_DEST_OPTIONS[t.sourceKind]?.length > 0;
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
                              {canPromote && (
                                <button onClick={() => openImportPanel(t.tag)} style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#2563EB", cursor: "pointer" }}>표준화</button>
                              )}
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

            {/* 우측 패널 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeTab !== "freeTags" && (
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>항목 추가</div>
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
                  <div style={{ fontSize: 12, color: "#3B82F6", marginBottom: 14 }}><strong>#{importTag}</strong> 를 어느 분류에 편입할지 선택하세요.</div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>편입 분류</label>
                  <select value={importDest.key} onChange={e => setImportDest({ key: e.target.value })} style={{ ...selectStyle, marginBottom: 8 }}>
                    {IMPORT_DEST_OPTIONS[importTagData.sourceKind].map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => setImportTag(null)} style={{ flex: 1, background: "#fff", border: "1px solid #BFDBFE", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                    <button onClick={() => handleImport(importTag)} style={{ flex: 1, background: "#2563EB", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>편입 확정</button>
                  </div>
                </div>
              )}

              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>
                <strong>운영 유의사항</strong><br />
                고정 분류 항목(업무 도메인, 구성 난이도, 비용 등급, ML 모델 유형)을 삭제하면 해당 분류가 지정된 기존 항목은 공란으로 처리될 수 있습니다. 삭제 전 사용 중인 항목 수를 확인하세요.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
