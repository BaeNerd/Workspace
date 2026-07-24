import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { CATEGORIES } from "../../types/categoryTypes";
import type { CategoryId } from "../../types/categoryTypes";
import { getCategoryTaxonomy, getFreeTags } from "../../lib/dataSource";
import { COLOR } from "../../styles/tokens";
import { useVisibleCount } from "../../hooks/useVisibleCount";
import LoadMoreButton from "../../components/LoadMoreButton";

// ===== 타입 정의 =====
// 분류체계·자유 태그 목업 데이터는 mocks/adminTaxonomyMockData에 있다. 타입은 소비처에 둔다.
export type Category = {
  label: string; desc: string; type: "single" | "multi";
  items?: string[];
};

type SourceKind = CategoryId;
type SourceItem = { id: string; kind: SourceKind; title: string };
export type FreeTag = {
  tag: string; count: number; proposedBy: string; dept: string;
  sourceKind: SourceKind; sourceItems: SourceItem[];
};

const freeTagContext = (t: FreeTag): string => {
  if (t.sourceItems.length === 0) return "—";
  const [first, ...rest] = t.sourceItems;
  return rest.length > 0 ? `${first.title} 외 ${rest.length}건` : first.title;
};

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
  padding: "8px 12px", fontSize: 13, color: COLOR.text,
  background: COLOR.bgSubtle, border: `1.5px solid ${COLOR.border}`,
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
      background: isEditing ? COLOR.primaryWeak : isDeleteTarget ? "#FEF2F2" : "#fff",
      borderRadius: 7, border: `1px solid ${isEditing ? "#BFDBFE" : isDeleteTarget ? "#FECACA" : COLOR.bgSubtle}`, marginBottom: 6,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1", flexShrink: 0 }} />
      {isEditing ? (
        <>
          <input value={editingItem.value} onChange={e => onEditValueChange(e.target.value)} style={{ ...inputStyle, flex: 1, padding: "5px 10px", fontSize: 13 }} autoFocus />
          <button onClick={onEditSave} style={{ background: COLOR.primary, color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>저장</button>
          <button onClick={onEditCancel} style={{ background: "#fff", border: `1px solid ${COLOR.border}`, borderRadius: 5, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>취소</button>
        </>
      ) : isDeleteTarget ? (
        <>
          <span style={{ flex: 1, fontSize: 13, color: "#991B1B", fontWeight: 600 }}>"{label}" 삭제할까요?</span>
          <button onClick={() => onDeleteConfirm(keyName, idx)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>삭제</button>
          <button onClick={onDeleteCancel} style={{ background: "#fff", border: `1px solid ${COLOR.border}`, borderRadius: 5, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>취소</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 13, color: COLOR.text2 }}>{label}</span>
          <button onClick={() => onStartEdit(keyName, idx, label)} style={{ background: "none", border: "none", color: COLOR.text3, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>수정</button>
          <button onClick={() => onStartDelete(keyName, idx)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>삭제</button>
        </>
      )}
    </div>
  );
};

export default function AdminTaxonomy() {
  const [activeTab, setActiveTab] = useState<TabId>("businessDomain");
  const [categoryTaxonomy, setCategoryTaxonomy] = useState(getCategoryTaxonomy());
  const [freeTags, setFreeTags] = useState<FreeTag[]>(getFreeTags());
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
  // 자유 태그 성장형 목록 — 탭·출처 필터가 바뀌면 표시 수 초기화(출처 필터와 병행 동작).
  const { visibleCount, showMore } = useVisibleCount(12, 12, `${activeTab}|${freeTagSourceFilter}`);

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
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text }}>
      <AdminNavbar />
      <div style={{ display: "flex" }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>분류체계 관리</h1>
              <p style={{ fontSize: 13, color: COLOR.text2, marginTop: 4 }}>AX 플랫폼 카드(n8n · PA · 나만의 비서 · AI Model · ML · Vibe · AI 프로젝트)의 표준 분류를 관리합니다.</p>
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
                padding: "8px 16px", borderRadius: 7, border: activeTab === t.id ? "none" : `1px solid ${COLOR.border}`,
                background: activeTab === t.id ? "#0F172A" : "transparent",
                color: activeTab === t.id ? "#fff" : COLOR.text2,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 1.5, background: "#7C3AED", display: "inline-block", opacity: activeTab === t.id ? 1 : 0.5 }} />
                {t.label}
              </button>
            ))}
            <span style={{ width: 1, height: 18, background: COLOR.border, margin: "0 4px" }} />
            <button onClick={() => setActiveTab("freeTags")} style={{
              padding: "8px 16px", borderRadius: 7, border: activeTab === "freeTags" ? "none" : `1px solid ${COLOR.border}`,
              background: activeTab === "freeTags" ? "#0F172A" : "transparent",
              color: activeTab === "freeTags" ? "#fff" : COLOR.text2,
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
                <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${COLOR.bgSubtle}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLOR.text }}>{cat.label}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#F3E8FF", color: "#7E22CE", padding: "2px 8px", borderRadius: 20 }}>AX 플랫폼 카드 전용</span>
                    </div>
                    <div style={{ fontSize: 12, color: COLOR.text2 }}>{cat.desc}</div>
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
                <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${COLOR.bgSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLOR.text, marginBottom: 4 }}>자유 태그 누적 목록</div>
                      <div style={{ fontSize: 12, color: COLOR.text2 }}>사용자가 AX 플랫폼 카드 등록 시 제안한 비표준 태그입니다. 7개 유형(n8n · PA · 나만의 비서 · AI Model · ML · Vibe · AI 프로젝트) 등록에서 수집됩니다.</div>
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
                          background: freeTagSourceFilter === key ? "#0F172A" : COLOR.bgSubtle,
                          color: freeTagSourceFilter === key ? "#fff" : COLOR.text2,
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                          {style && <span style={{ width: 6, height: 6, borderRadius: 1.5, background: freeTagSourceFilter === key ? "#fff" : style.color, display: "inline-block" }} />}
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filteredFreeTags.slice(0, visibleCount).map((t, i) => {
                      const style = SOURCE_STYLE[t.sourceKind];
                      const canPromote = IMPORT_DEST_OPTIONS[t.sourceKind]?.length > 0;
                      return (
                        <div key={i} style={{ borderRadius: 8, border: `1px solid ${selectedFreeTags.includes(t.tag) ? "#BFDBFE" : COLOR.bgSubtle}`, background: selectedFreeTags.includes(t.tag) ? COLOR.primaryWeak : "#fff" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                            <input type="checkbox" checked={selectedFreeTags.includes(t.tag)} onChange={() => toggleFreeTag(t.tag)} style={{ cursor: "pointer", flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, background: style.bg, color: style.color, padding: "1px 7px", borderRadius: 20, flexShrink: 0 }}>{style.label}</span>
                                <span style={{ fontSize: 13, color: COLOR.text2, fontWeight: 600 }}>#{t.tag}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, background: COLOR.bgSubtle, color: COLOR.text2, padding: "1px 7px", borderRadius: 20 }}>사용 {t.count}건</span>
                              </div>
                              <div style={{ fontSize: 11, color: COLOR.text3, lineHeight: 1.6 }}>
                                제안자: <strong style={{ color: COLOR.text2 }}>{t.proposedBy}</strong> ({t.dept}) · 사용 카드: {freeTagContext(t)}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              {canPromote && (
                                <button onClick={() => openImportPanel(t.tag)} style={{ background: COLOR.primaryWeak, border: "1px solid #BFDBFE", borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: COLOR.primary, cursor: "pointer" }}>표준화</button>
                              )}
                              <button onClick={() => handleFreeTagDelete([t.tag])} style={{ background: "none", border: "1px solid #FECACA", borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredFreeTags.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: COLOR.text3, fontSize: 13 }}>누적된 자유 태그가 없습니다.</div>}
                    <LoadMoreButton remaining={filteredFreeTags.length - visibleCount} onClick={showMore} />
                  </div>
                </div>
              )}
            </div>

            {/* 우측 패널 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeTab !== "freeTags" && (
                <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 14 }}>항목 추가</div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLOR.text2, display: "block", marginBottom: 5 }}>항목명</label>
                  <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} placeholder="새 항목 입력 후 Enter 또는 추가" style={inputStyle} />
                  <button onClick={handleAdd} style={{ width: "100%", marginTop: 10, background: COLOR.primary, color: "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>추가</button>
                </div>
              )}

              {importTag && importTagData && (
                <div style={{ background: COLOR.primaryWeak, border: "1.5px solid #BFDBFE", borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 4 }}>표준화 편입</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: SOURCE_STYLE[importTagData.sourceKind].bg, color: SOURCE_STYLE[importTagData.sourceKind].color, padding: "1px 7px", borderRadius: 20 }}>
                      {SOURCE_STYLE[importTagData.sourceKind].label} 출처
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: COLOR.primary, marginBottom: 14 }}><strong>#{importTag}</strong> 를 어느 분류에 편입할지 선택하세요.</div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLOR.text2, display: "block", marginBottom: 5 }}>편입 분류</label>
                  <select value={importDest.key} onChange={e => setImportDest({ key: e.target.value })} style={{ ...selectStyle, marginBottom: 8 }}>
                    {IMPORT_DEST_OPTIONS[importTagData.sourceKind].map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => setImportTag(null)} style={{ flex: 1, background: "#fff", border: "1px solid #BFDBFE", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>취소</button>
                    <button onClick={() => handleImport(importTag)} style={{ flex: 1, background: COLOR.primary, border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>편입 확정</button>
                  </div>
                </div>
              )}

              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>
                <strong>운영 유의사항</strong><br />
                고정 분류 항목(업무 도메인, 구성 난이도, 비용 등급, ML 모델 유형)을 삭제하면 해당 분류가 지정된 기존 카드는 공란으로 처리될 수 있습니다. 삭제 전 사용 중인 카드 수를 확인하세요.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
