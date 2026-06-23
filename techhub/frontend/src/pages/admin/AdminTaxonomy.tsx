import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";

import AdminSidebar from "../../components/AdminSidebar";

type Category = {
  label: string; desc: string; type: "single" | "multi";
  items?: string[]; groups?: Record<string, string[]>;
};

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

type FreeTag = { tag: string; count: number; proposedBy: string; dept: string; context: string };

// TODO: 실제 연동 시 GET /api/v1/admin/taxonomy/free-tags 응답으로 교체
const INITIAL_FREE_TAGS: FreeTag[] = [
  { tag: "Lab색공간", count: 3, proposedBy: "이수연", dept: "메이크업연구소", context: "조색 예측 ML 모델, 색차 측정 리포트 생성기" },
  { tag: "조색", count: 5, proposedBy: "이수연", dept: "메이크업연구소", context: "조색 예측 ML 모델 외 4건" },
  { tag: "온보딩", count: 6, proposedBy: "박지현", dept: "인사팀", context: "HR 온보딩 자동화 포털 외 5건" },
  { tag: "발주", count: 2, proposedBy: "박성훈", dept: "구매팀", context: "구매 발주 자동화 시스템 외 1건" },
  { tag: "모니터링", count: 7, proposedBy: "강현우", dept: "법무팀", context: "글로벌 규제 모니터링 대시보드 외 6건" },
];

const TABS = [
  { id: "domain", label: "비즈니스 도메인" },
  { id: "systemType", label: "시스템 유형" },
  { id: "status", label: "프로젝트 상태" },
  { id: "audience", label: "사용 대상" },
  { id: "stack", label: "기술 스택" },
  { id: "freeTags", label: "자유 태그" },
] as const;

type TabId = typeof TABS[number]["id"];

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 12px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
  borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;

export default function AdminTaxonomy() {

  const [activeTab, setActiveTab] = useState<TabId>("domain");
  const [taxonomy, setTaxonomy] = useState(INITIAL_TAXONOMY);
  const [freeTags, setFreeTags] = useState<FreeTag[]>(INITIAL_FREE_TAGS);
  const [newItem, setNewItem] = useState("");
  const [newGroup, setNewGroup] = useState("언어");
  const [editingItem, setEditingItem] = useState<{ key: string; group: string | null; idx: number; value: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ key: string; group: string | null; idx: number } | null>(null);
  const [importTag, setImportTag] = useState<string | null>(null);
  const [importDest, setImportDest] = useState({ key: "domain", group: "" });
  const [savedMsg, setSavedMsg] = useState("");
  const [selectedFreeTags, setSelectedFreeTags] = useState<string[]>([]);

  const showSaved = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(""), 2200); };
  const cat = activeTab !== "freeTags" ? taxonomy[activeTab] : null;

  const handleAdd = () => {
    if (!newItem.trim()) return;
    // TODO: 실제 연동 시 POST /api/v1/admin/taxonomy/:category/items
    if (activeTab === "stack") {
      setTaxonomy(p => ({ ...p, stack: { ...p.stack, groups: { ...p.stack.groups!, [newGroup]: [...(p.stack.groups![newGroup] || []), newItem.trim()] } } }));
    } else {
      setTaxonomy(p => ({ ...p, [activeTab]: { ...p[activeTab], items: [...(p[activeTab].items || []), newItem.trim()] } }));
    }
    setNewItem("");
    showSaved("항목이 추가되었습니다.");
  };

  const handleDelete = (key: string, group: string | null, idx: number) => {
    // TODO: 실제 연동 시 DELETE /api/v1/admin/taxonomy/:category/items/:idx
    if (key === "stack" && group) {
      setTaxonomy(p => ({ ...p, stack: { ...p.stack, groups: { ...p.stack.groups!, [group]: p.stack.groups![group].filter((_, i) => i !== idx) } } }));
    } else {
      setTaxonomy(p => ({ ...p, [key]: { ...p[key], items: p[key].items!.filter((_, i) => i !== idx) } }));
    }
    setDeleteConfirm(null);
    showSaved("항목이 삭제되었습니다.");
  };

  const handleEditSave = () => {
    if (!editingItem || !editingItem.value.trim()) return;
    const { key, group, idx, value } = editingItem;
    // TODO: 실제 연동 시 PUT /api/v1/admin/taxonomy/:category/items/:idx
    if (key === "stack" && group) {
      setTaxonomy(p => ({ ...p, stack: { ...p.stack, groups: { ...p.stack.groups!, [group]: p.stack.groups![group].map((v, i) => i === idx ? value : v) } } }));
    } else {
      setTaxonomy(p => ({ ...p, [key]: { ...p[key], items: p[key].items!.map((v, i) => i === idx ? value : v) } }));
    }
    setEditingItem(null);
    showSaved("항목이 수정되었습니다.");
  };

  const handleImport = (tag: string) => {
    // TODO: 실제 연동 시 POST /api/v1/admin/taxonomy/free-tags/:tag/promote
    const { key, group } = importDest;
    if (key === "stack" && group) {
      setTaxonomy(p => ({ ...p, stack: { ...p.stack, groups: { ...p.stack.groups!, [group]: [...(p.stack.groups![group] || []), tag] } } }));
    } else {
      setTaxonomy(p => ({ ...p, [key]: { ...p[key], items: [...(p[key].items || []), tag] } }));
    }
    setFreeTags(p => p.filter(t => t.tag !== tag));
    setImportTag(null);
    showSaved(`"${tag}" 항목이 표준 분류로 편입되었습니다.`);
  };

  const handleFreeTagDelete = (tags: string[]) => {
    // TODO: 실제 연동 시 DELETE /api/v1/admin/taxonomy/free-tags (body: { tags })
    setFreeTags(p => p.filter(t => !tags.includes(t.tag)));
    setSelectedFreeTags([]);
    showSaved("선택한 태그가 삭제되었습니다.");
  };

  const toggleFreeTag = (tag: string) => setSelectedFreeTags(p => p.includes(tag) ? p.filter(x => x !== tag) : [...p, tag]);

  const ItemRow = ({ label, keyName, group, idx }: { label: string; keyName: string; group: string | null; idx: number }) => {
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
            <input value={editingItem.value} onChange={e => setEditingItem(p => p ? { ...p, value: e.target.value } : p)} style={{ ...inputStyle, flex: 1, padding: "5px 10px", fontSize: 13 }} autoFocus />
            <button onClick={handleEditSave} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>저장</button>
            <button onClick={() => setEditingItem(null)} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 5, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
          </>
        ) : isDeleteTarget ? (
          <>
            <span style={{ flex: 1, fontSize: 13, color: "#991B1B", fontWeight: 600 }}>{label} — 삭제하시겠습니까?</span>
            <button onClick={() => handleDelete(keyName, group, idx)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>삭제</button>
            <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 5, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
          </>
        ) : (
          <>
            <span style={{ flex: 1, fontSize: 13, color: "#334155" }}>{label}</span>
            <button onClick={() => setEditingItem({ key: keyName, group, idx, value: label })} style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}>수정</button>
            <button onClick={() => setDeleteConfirm({ key: keyName, group, idx })} style={{ background: "none", border: "1px solid #FECACA", borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>분류체계 관리</h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>고정 분류 항목을 추가·수정·삭제하고, 자유 태그를 표준 분류로 편입합니다.</p>
          </div>

          {savedMsg && (
            <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#065F46" }}>{savedMsg}</div>
          )}

          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
            {TABS.map((t, i) => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setNewItem(""); setEditingItem(null); setDeleteConfirm(null); }} style={{
                flex: 1, padding: "11px 6px", border: "none", borderRight: i < TABS.length - 1 ? "1px solid #E2E8F0" : "none",
                background: activeTab === t.id ? "#0F172A" : "transparent",
                color: activeTab === t.id ? "#fff" : "#475569",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {t.label}
                {t.id === "freeTags" && freeTags.length > 0 && (
                  <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 800, background: activeTab === t.id ? "rgba(255,255,255,0.25)" : "#EF4444", color: "#fff", padding: "1px 5px", borderRadius: 20 }}>{freeTags.length}</span>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
            <div>
              {activeTab !== "freeTags" && cat && (
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{cat.label}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{cat.desc}</div>
                  </div>
                  {activeTab === "stack" && cat.groups ? (
                    Object.entries(cat.groups).map(([group, items]) => (
                      <div key={group} style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{group}</div>
                        {items.map((item, idx) => <ItemRow key={idx} label={item} keyName="stack" group={group} idx={idx} />)}
                      </div>
                    ))
                  ) : (
                    cat.items?.map((item, idx) => <ItemRow key={idx} label={item} keyName={activeTab} group={null} idx={idx} />)
                  )}
                </div>
              )}

              {activeTab === "freeTags" && (
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
                  <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>자유 태그 누적 목록</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>사용자가 프로젝트 등록 시 제안한 태그입니다.</div>
                    </div>
                    {selectedFreeTags.length > 0 && (
                      <button onClick={() => handleFreeTagDelete(selectedFreeTags)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>선택 삭제 ({selectedFreeTags.length})</button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {freeTags.map((t, i) => (
                      <div key={i} style={{ borderRadius: 8, border: `1px solid ${selectedFreeTags.includes(t.tag) ? "#BFDBFE" : "#F1F5F9"}`, background: selectedFreeTags.includes(t.tag) ? "#EFF6FF" : "#fff" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                          <input type="checkbox" checked={selectedFreeTags.includes(t.tag)} onChange={() => toggleFreeTag(t.tag)} style={{ cursor: "pointer", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>#{t.tag}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, background: "#F1F5F9", color: "#475569", padding: "1px 7px", borderRadius: 20 }}>사용 {t.count}건</span>
                            </div>
                            <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>
                              제안자: <strong style={{ color: "#64748B" }}>{t.proposedBy}</strong> ({t.dept}) · 사용 프로젝트: {t.context}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button onClick={() => setImportTag(t.tag)} style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#2563EB", cursor: "pointer" }}>표준화</button>
                            <button onClick={() => handleFreeTagDelete([t.tag])} style={{ background: "none", border: "1px solid #FECACA", borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {freeTags.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8", fontSize: 13 }}>누적된 자유 태그가 없습니다.</div>}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeTab !== "freeTags" && (
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>항목 추가</div>
                  {activeTab === "stack" && (
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>그룹 선택</label>
                      <select value={newGroup} onChange={e => setNewGroup(e.target.value)} style={{ ...inputStyle, appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32 }}>
                        {Object.keys(taxonomy.stack.groups!).map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  )}
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>항목명</label>
                  <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} placeholder="새 항목 입력 후 Enter 또는 추가" style={inputStyle} />
                  <button onClick={handleAdd} style={{ width: "100%", marginTop: 10, background: "#2563EB", color: "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>추가</button>
                </div>
              )}

              {importTag && (
                <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 4 }}>표준화 편입</div>
                  <div style={{ fontSize: 12, color: "#3B82F6", marginBottom: 14 }}><strong>#{importTag}</strong> 를 어느 분류에 편입할지 선택하세요.</div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>편입 분류</label>
                  <select value={importDest.key} onChange={e => setImportDest({ key: e.target.value, group: e.target.value === "stack" ? "언어" : "" })} style={{ ...inputStyle, marginBottom: 8, appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32 }}>
                    <option value="domain">비즈니스 도메인</option>
                    <option value="systemType">시스템 유형</option>
                    <option value="audience">사용 대상</option>
                    <option value="stack">기술 스택</option>
                  </select>
                  {importDest.key === "stack" && (
                    <>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>스택 그룹</label>
                      <select value={importDest.group} onChange={e => setImportDest(p => ({ ...p, group: e.target.value }))} style={{ ...inputStyle, marginBottom: 8, appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32 }}>
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
                고정 분류 항목을 삭제하면 기존 프로젝트에 태깅된 해당 항목이 공란으로 처리될 수 있습니다.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}