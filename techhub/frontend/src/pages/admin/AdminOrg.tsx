/*
import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";

import AdminSidebar from "../../components/AdminSidebar";

type Dept = { id: number; name: string; parent: string; projectCount: number; source: "manual" | "teams" };

// TODO: 실제 연동 시 GET /api/v1/admin/departments 응답으로 교체
const INITIAL_DEPTS: Dept[] = [
  { id: 1, name: "메이크업연구소", parent: "연구개발본부", projectCount: 8, source: "manual" },
  { id: 2, name: "스킨케어연구소", parent: "연구개발본부", projectCount: 5, source: "manual" },
  { id: 3, name: "IT개발팀", parent: "IT본부", projectCount: 14, source: "manual" },
  { id: 4, name: "IT인프라팀", parent: "IT본부", projectCount: 6, source: "manual" },
  { id: 5, name: "재무팀", parent: "경영지원본부", projectCount: 4, source: "manual" },
  { id: 6, name: "인사팀", parent: "경영지원본부", projectCount: 3, source: "manual" },
  { id: 7, name: "마케팅팀", parent: "영업마케팅본부", projectCount: 5, source: "manual" },
  { id: 8, name: "영업팀", parent: "영업마케팅본부", projectCount: 3, source: "manual" },
  { id: 9, name: "품질관리팀", parent: "생산본부", projectCount: 4, source: "manual" },
  { id: 10, name: "제조기술팀", parent: "생산본부", projectCount: 5, source: "manual" },
];

const PARENTS = ["연구개발본부", "IT본부", "경영지원본부", "영업마케팅본부", "생산본부"];

const SYNC_PREVIEW = [
  { name: "디지털마케팅팀", parent: "영업마케팅본부", action: "추가" },
  { name: "데이터분석팀", parent: "IT본부", action: "추가" },
  { name: "고객서비스팀", parent: "영업마케팅본부", action: "이름변경", newName: "CS팀" },
];

const ACTION_STYLE: Record<string, { bg: string; color: string }> = {
  "추가": { bg: "#D1FAE5", color: "#065F46" },
  "이름변경": { bg: "#FEF3C7", color: "#92400E" },
  "유지": { bg: "#F1F5F9", color: "#475569" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32, cursor: "pointer" };

export default function AdminOrg() {

  const [depts, setDepts] = useState<Dept[]>(INITIAL_DEPTS);
  const [search, setSearch] = useState("");
  const [filterParent, setFilterParent] = useState("전체");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Dept>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [newDept, setNewDept] = useState({ name: "", parent: "IT본부" });
  const [savedMsg, setSavedMsg] = useState("");

  const [apiTab, setApiTab] = useState<"status" | "config" | "sync">("status");
  const [apiConnected, setApiConnected] = useState(false);
  const [apiConfig, setApiConfig] = useState({ tenantId: "", clientId: "", clientSecret: "", syncInterval: "매일 자정" });
  const [autoSync, setAutoSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const showSaved = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(""), 2200); };

  const filtered = depts.filter(d => (filterParent === "전체" || d.parent === filterParent) && (search === "" || d.name.includes(search) || d.parent.includes(search)));
  const grouped = PARENTS.reduce((acc, p) => { const items = filtered.filter(d => d.parent === p); if (items.length > 0) acc[p] = items; return acc; }, {} as Record<string, Dept[]>);

  const handleSaveEdit = (id: number) => {
    // TODO: 실제 연동 시 PUT /api/v1/admin/departments/:id
    setDepts(p => p.map(d => d.id === id ? { ...d, ...editData } : d));
    setEditingId(null); setEditData({});
    showSaved("부서 정보가 수정되었습니다.");
  };

  const handleDelete = (id: number) => {
    // TODO: 실제 연동 시 DELETE /api/v1/admin/departments/:id
    setDepts(p => p.filter(d => d.id !== id));
    setDeleteConfirm(null);
    showSaved("부서가 삭제되었습니다.");
  };

  const handleAddDept = () => {
    if (!newDept.name.trim()) return;
    // TODO: 실제 연동 시 POST /api/v1/admin/departments
    setDepts(p => [...p, { id: Date.now(), name: newDept.name.trim(), parent: newDept.parent, projectCount: 0, source: "manual" }]);
    setNewDept({ name: "", parent: "IT본부" });
    showSaved("부서가 추가되었습니다.");
  };

  const handleSync = () => {
    setSyncing(true); setShowPreview(false);
    // TODO: 실제 연동 시 POST /api/v1/admin/departments/sync (Microsoft Graph API 호출)
    setTimeout(() => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setSyncing(false); setSyncDone(true); setApiConnected(true);
      setLastSyncTime(`2025.06.05 ${pad(now.getHours())}:${pad(now.getMinutes())}`);
      setDepts(p => {
        const next = [...p,
          { id: 100, name: "디지털마케팅팀", parent: "영업마케팅본부", projectCount: 0, source: "teams" as const },
          { id: 101, name: "데이터분석팀", parent: "IT본부", projectCount: 0, source: "teams" as const },
        ];
        return next.filter((d, i, arr) => arr.findIndex(x => x.name === d.name) === i);
      });
      showSaved("Microsoft Teams 조직도 동기화가 완료되었습니다.");
    }, 2000);
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>부서 / 조직 관리</h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>참여 부서 목록을 관리합니다. 수동 입력 또는 Microsoft Teams 조직도 API 연동으로 동기화할 수 있습니다.</p>
          </div>

          {savedMsg && <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#065F46" }}>{savedMsg}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="부서명 검색" style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
                <select value={filterParent} onChange={e => setFilterParent(e.target.value)} style={{ ...selectStyle, width: 160 }}>
                  <option>전체</option>
                  {PARENTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>
                전체 <strong style={{ color: "#0F172A" }}>{depts.length}</strong>개 부서 ·
                수동 <strong style={{ color: "#0F172A" }}>{depts.filter(d => d.source === "manual").length}</strong>개 ·
                Teams 연동 <strong style={{ color: "#2563EB" }}>{depts.filter(d => d.source === "teams").length}</strong>개
              </div>

              {Object.entries(grouped).map(([parent, items]) => (
                <div key={parent} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{parent}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.map(dept => {
                      const isEditing = editingId === dept.id;
                      const isDelete = deleteConfirm === dept.id;
                      return (
                        <div key={dept.id} style={{ background: "#fff", borderRadius: 8, border: `1.5px solid ${isEditing ? "#BFDBFE" : isDelete ? "#FECACA" : "#E2E8F0"}`, padding: "12px 16px" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <input value={editData.name ?? dept.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, flex: 1, minWidth: 120, padding: "6px 10px" }} />
                              <select value={editData.parent ?? dept.parent} onChange={e => setEditData(p => ({ ...p, parent: e.target.value }))} style={{ ...selectStyle, width: 160, padding: "6px 32px 6px 10px" }}>
                                {PARENTS.map(p => <option key={p}>{p}</option>)}
                              </select>
                              <button onClick={() => handleSaveEdit(dept.id)} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>저장</button>
                              <button onClick={() => { setEditingId(null); setEditData({}); }} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                            </div>
                          ) : isDelete ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ flex: 1, fontSize: 13, color: "#991B1B", fontWeight: 600 }}>{dept.name} — 삭제하시겠습니까?</span>
                              <button onClick={() => handleDelete(dept.id)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>삭제</button>
                              <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{dept.name}</span>
                                  {dept.source === "teams" && <span style={{ fontSize: 10, fontWeight: 700, background: "#EFF6FF", color: "#2563EB", padding: "1px 7px", borderRadius: 20 }}>Teams</span>}
                                </div>
                                <span style={{ fontSize: 11, color: "#94A3B8" }}>프로젝트 {dept.projectCount}건</span>
                              </div>
                              <button onClick={() => { setEditingId(dept.id); setEditData({}); }} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}>수정</button>
                              <button onClick={() => setDeleteConfirm(dept.id)} style={{ background: "#fff", border: "1px solid #FECACA", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>부서 수동 추가</div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>부서명</label>
                  <input value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleAddDept()} placeholder="신규 부서명 입력" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>상위 본부</label>
                  <select value={newDept.parent} onChange={e => setNewDept(p => ({ ...p, parent: e.target.value }))} style={selectStyle}>
                    {PARENTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <button onClick={handleAddDept} style={{ width: "100%", background: "#0F172A", color: "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>추가</button>
              </div>

              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: apiConnected ? "#059669" : "#CBD5E1" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Microsoft Teams 연동</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: apiConnected ? "#D1FAE5" : "#F1F5F9", color: apiConnected ? "#065F46" : "#94A3B8" }}>{apiConnected ? "연결됨" : "미연결"}</span>
                </div>
                <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
                  {([["status", "현황"], ["config", "설정"], ["sync", "동기화"]] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setApiTab(id)} style={{
                      flex: 1, padding: "9px 0", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: apiTab === id ? "#F8FAFC" : "transparent",
                      color: apiTab === id ? "#2563EB" : "#64748B",
                      borderBottom: apiTab === id ? "2px solid #2563EB" : "2px solid transparent",
                    }}>{label}</button>
                  ))}
                </div>

                <div style={{ padding: "16px 18px" }}>
                  {apiTab === "status" && (
                    <div>
                      {[
                        { label: "연동 방식", value: "Microsoft Graph API" },
                        { label: "마지막 동기화", value: lastSyncTime ?? (apiConnected ? "2025.06.04 00:00" : "—") },
                        { label: "동기화 주기", value: autoSync ? apiConfig.syncInterval : "수동" },
                        { label: "Teams 동기화 부서", value: `${depts.filter(d => d.source === "teams").length}개` },
                      ].map((r, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F8FAFC", fontSize: 12 }}>
                          <span style={{ color: "#94A3B8", fontWeight: 600 }}>{r.label}</span>
                          <span style={{ color: "#334155", fontWeight: 500 }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {apiTab === "config" && (
                    <div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, lineHeight: 1.6 }}>Azure AD에서 발급한 자격증명을 입력하세요.</div>
                      {[
                        { label: "Tenant ID", key: "tenantId" as const, placeholder: "xxxxxxxx-xxxx-xxxx" },
                        { label: "Client ID", key: "clientId" as const, placeholder: "앱 등록 클라이언트 ID" },
                        { label: "Client Secret", key: "clientSecret" as const, placeholder: "••••••••••••••••", type: "password" },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 4 }}>{f.label}</label>
                          <input type={f.type || "text"} value={apiConfig[f.key]} onChange={e => setApiConfig(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ ...inputStyle, fontSize: 12 }} />
                        </div>
                      ))}
                      <div style={{ marginBottom: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: autoSync ? 12 : 0 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>자동 동기화</div>
                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{autoSync ? "설정된 주기마다 자동 실행" : "비활성 — 수동 동기화만 가능"}</div>
                          </div>
                          <div onClick={() => setAutoSync(v => !v)} style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", background: autoSync ? "#2563EB" : "#CBD5E1", position: "relative" }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: autoSync ? 23 : 3, transition: "left 0.2s" }} />
                          </div>
                        </div>
                        {autoSync && (
                          <>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>동기화 주기</label>
                            <select value={apiConfig.syncInterval} onChange={e => setApiConfig(p => ({ ...p, syncInterval: e.target.value }))} style={{ ...selectStyle, fontSize: 12 }}>
                              {["매일 자정", "매일 오전 6시", "매주 월요일", "매주 금요일"].map(v => <option key={v}>{v}</option>)}
                            </select>
                          </>
                        )}
                      </div>
                      <button onClick={() => showSaved("API 설정이 저장되었습니다.")} style={{ width: "100%", background: "#0F172A", color: "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>설정 저장</button>
                    </div>
                  )}

                  {apiTab === "sync" && (
                    <div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 1.6 }}>Teams 조직도를 즉시 동기화합니다.</div>
                      {!showPreview && !syncDone && (
                        <button onClick={() => setShowPreview(true)} style={{ width: "100%", background: "#EFF6FF", border: "1.5px solid #BFDBFE", color: "#2563EB", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>변경사항 미리보기</button>
                      )}
                      {showPreview && !syncDone && (
                        <div style={{ marginBottom: 12 }}>
                          {SYNC_PREVIEW.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#F8FAFC", borderRadius: 6, marginBottom: 5 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: ACTION_STYLE[item.action].bg, color: ACTION_STYLE[item.action].color, flexShrink: 0 }}>{item.action}</span>
                              <span style={{ fontSize: 12, color: "#334155", flex: 1 }}>{item.action === "이름변경" ? `${item.name} → ${item.newName}` : item.name}</span>
                              <span style={{ fontSize: 11, color: "#94A3B8" }}>{item.parent}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {syncDone ? (
                        <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 7, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#065F46", textAlign: "center" }}>동기화 완료</div>
                      ) : (
                        <button onClick={handleSync} disabled={syncing} style={{ width: "100%", background: syncing ? "#E2E8F0" : "#059669", color: syncing ? "#94A3B8" : "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: syncing ? "not-allowed" : "pointer" }}>
                          {syncing ? "동기화 중..." : "지금 동기화"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
  */
 /* ============================================================
   파일: src/pages/admin/AdminOrg.tsx
   경로: /admin/org
   ============================================================ */

/* ============================================================
   파일: src/pages/admin/AdminOrg.tsx
   경로: /admin/org
   ============================================================ */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_NAV = [
  { label: "대시보드", path: "/admin" },
  { label: "등록 신청 검토", path: "/admin/review" },
  { label: "프로젝트 관리", path: "/admin/projects" },
  { label: "분류체계 관리", path: "/admin/taxonomy" },
  { label: "부서/조직 관리", path: "/admin/org" },
  { label: "사용자 관리", path: "/admin/users" },
  { label: "통계", path: "/admin/statistics" },
];

type Dept = { id: number; name: string; parent: string; company: string; projectCount: number; source: "manual" | "teams" };

// TODO: 실제 연동 시 GET /api/v1/admin/companies 응답으로 교체 (Microsoft Teams 조직도 API)
const COMPANIES = [
  { code: "KMH", name: "콜마홀딩스" }, { code: "KKM", name: "한국콜마" },
  { code: "KBH", name: "콜마비앤에이치" }, { code: "HKN", name: "에이치케이이노엔" },
  { code: "YWK", name: "연우" }, { code: "KAF", name: "근오농림" },
  { code: "NAB", name: "넥스트앤바이오" }, { code: "HC", name: "콜마생활건강" },
  { code: "HNG", name: "에치엔지" }, { code: "MOD", name: "엠오디머티리얼즈" },
  { code: "KMG", name: "콜마글로벌" }, { code: "KMSK", name: "콜마스크" },
  { code: "KUX", name: "콜마유엑스" }, { code: "KMW", name: "무석콜마" },
  { code: "KMB", name: "북경콜마" }, { code: "KBJ", name: "강소콜마" },
  { code: "KAY", name: "연태콜마" }, { code: "HKV", name: "한국헬스케어베너" },
  { code: "PLT", name: "플래닛147" }, { code: "LSL", name: "레스리" },
  { code: "LOD", name: "라우드랩스" }, { code: "KMP", name: "콜마헬스케어필리핀" },
  { code: "KMS", name: "에이치케이콜마싱가포르" }, { code: "KML", name: "콜마랩스" },
  { code: "KUS", name: "미국콜마" }, { code: "KCA", name: "캐나다콜마" },
  { code: "HKJ", name: "에이치케이글로벌퍼팩" }, { code: "KMM", name: "에이치케이콜마말레이시아" },
  { code: "KBT", name: "콜마바이오텍" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/departments 응답으로 교체
const INITIAL_DEPTS: Dept[] = [
  { id: 1, name: "메이크업연구소", parent: "연구개발본부", company: "KKM", projectCount: 8, source: "manual" },
  { id: 2, name: "스킨케어연구소", parent: "연구개발본부", company: "KKM", projectCount: 5, source: "manual" },
  { id: 3, name: "IT개발팀", parent: "IT본부", company: "KKM", projectCount: 14, source: "manual" },
  { id: 4, name: "IT인프라팀", parent: "IT본부", company: "KKM", projectCount: 6, source: "manual" },
  { id: 5, name: "재무팀", parent: "경영지원본부", company: "KKM", projectCount: 4, source: "manual" },
  { id: 6, name: "인사팀", parent: "경영지원본부", company: "KKM", projectCount: 3, source: "manual" },
  { id: 7, name: "마케팅팀", parent: "영업마케팅본부", company: "KKM", projectCount: 5, source: "manual" },
  { id: 8, name: "영업팀", parent: "영업마케팅본부", company: "KKM", projectCount: 3, source: "manual" },
  { id: 9, name: "품질관리팀", parent: "생산본부", company: "KKM", projectCount: 4, source: "manual" },
  { id: 10, name: "제조기술팀", parent: "생산본부", company: "KKM", projectCount: 5, source: "manual" },
  { id: 11, name: "헬스케어연구소", parent: "연구개발본부", company: "KBH", projectCount: 3, source: "manual" },
  { id: 12, name: "사업기획팀", parent: "경영지원본부", company: "KBH", projectCount: 2, source: "manual" },
  { id: 13, name: "글로벌사업팀", parent: "영업마케팅본부", company: "KMG", projectCount: 2, source: "manual" },
  { id: 14, name: "생산관리팀", parent: "생산본부", company: "KMW", projectCount: 1, source: "manual" },
];

const PARENTS = ["연구개발본부", "IT본부", "경영지원본부", "영업마케팅본부", "생산본부"];

const SYNC_PREVIEW = [
  { name: "디지털마케팅팀", parent: "영업마케팅본부", action: "추가" },
  { name: "데이터분석팀", parent: "IT본부", action: "추가" },
  { name: "고객서비스팀", parent: "영업마케팅본부", action: "이름변경", newName: "CS팀" },
];

const ACTION_STYLE: Record<string, { bg: string; color: string }> = {
  "추가": { bg: "#D1FAE5", color: "#065F46" },
  "이름변경": { bg: "#FEF3C7", color: "#92400E" },
  "유지": { bg: "#F1F5F9", color: "#475569" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32, cursor: "pointer" };

export default function AdminOrg() {
  const navigate = useNavigate();
  const [depts, setDepts] = useState<Dept[]>(INITIAL_DEPTS);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("전체");
  const [filterParent, setFilterParent] = useState("전체");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Dept>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [newDept, setNewDept] = useState({ name: "", parent: "IT본부", company: "KKM" });
  const [savedMsg, setSavedMsg] = useState("");

  const [apiTab, setApiTab] = useState<"status" | "config" | "sync">("status");
  const [apiConnected, setApiConnected] = useState(false);
  const [apiConfig, setApiConfig] = useState({ tenantId: "", clientId: "", clientSecret: "", syncInterval: "매일 자정" });
  const [autoSync, setAutoSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const showSaved = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(""), 2200); };

  const filtered = depts.filter(d =>
    (filterCompany === "전체" || d.company === filterCompany) &&
    (filterParent === "전체" || d.parent === filterParent) &&
    (search === "" || d.name.includes(search) || d.parent.includes(search))
  );
  const companyName = (code: string) => COMPANIES.find(c => c.code === code)?.name ?? code;
  const grouped = PARENTS.reduce((acc, p) => { const items = filtered.filter(d => d.parent === p); if (items.length > 0) acc[p] = items; return acc; }, {} as Record<string, Dept[]>);

  const handleSaveEdit = (id: number) => {
    // TODO: 실제 연동 시 PUT /api/v1/admin/departments/:id
    setDepts(p => p.map(d => d.id === id ? { ...d, ...editData } : d));
    setEditingId(null); setEditData({});
    showSaved("부서 정보가 수정되었습니다.");
  };

  const handleDelete = (id: number) => {
    // TODO: 실제 연동 시 DELETE /api/v1/admin/departments/:id
    setDepts(p => p.filter(d => d.id !== id));
    setDeleteConfirm(null);
    showSaved("부서가 삭제되었습니다.");
  };

  const handleAddDept = () => {
    if (!newDept.name.trim()) return;
    // TODO: 실제 연동 시 POST /api/v1/admin/departments
    setDepts(p => [...p, { id: Date.now(), name: newDept.name.trim(), parent: newDept.parent, company: newDept.company, projectCount: 0, source: "manual" }]);
    setNewDept({ name: "", parent: "IT본부", company: "KKM" });
    showSaved("부서가 추가되었습니다.");
  };

  const handleSync = () => {
    setSyncing(true); setShowPreview(false);
    // TODO: 실제 연동 시 POST /api/v1/admin/departments/sync (Microsoft Graph API 호출)
    setTimeout(() => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setSyncing(false); setSyncDone(true); setApiConnected(true);
      setLastSyncTime(`2025.06.05 ${pad(now.getHours())}:${pad(now.getMinutes())}`);
      setDepts(p => {
        const next = [...p,
          { id: 100, name: "디지털마케팅팀", parent: "영업마케팅본부", company: "KKM", projectCount: 0, source: "teams" as const },
          { id: 101, name: "데이터분석팀", parent: "IT본부", company: "KKM", projectCount: 0, source: "teams" as const },
        ];
        return next.filter((d, i, arr) => arr.findIndex(x => x.name === d.name) === i);
      });
      showSaved("Microsoft Teams 조직도 동기화가 완료되었습니다.");
    }, 2000);
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid #E2E8F0", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.03em" }}>KOLMAR</span>
          <span style={{ fontWeight: 500, fontSize: 12, color: "#94A3B8" }}>Tech Hub</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: 20 }}>관리자</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>김</div>
        </div>
      </nav>

      <div style={{ display: "flex" }}>
        <aside style={{ width: 200, flexShrink: 0, background: "#fff", borderRight: "1px solid #E2E8F0", padding: "20px 12px", position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, padding: "0 8px" }}>관리자 메뉴</div>
          {ADMIN_NAV.map(n => (
            <div key={n.path} onClick={() => navigate(n.path)} style={{
              padding: "8px 10px", borderRadius: 7, cursor: "pointer", marginBottom: 2,
              fontSize: 13, fontWeight: n.path === "/admin/org" ? 700 : 500,
              color: n.path === "/admin/org" ? "#2563EB" : "#475569",
              background: n.path === "/admin/org" ? "#EFF6FF" : "transparent",
            }}>{n.label}</div>
          ))}
        </aside>

        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>부서 / 조직 관리</h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>참여 부서 목록을 관리합니다. 수동 입력 또는 Microsoft Teams 조직도 API 연동으로 동기화할 수 있습니다.</p>
          </div>

          {savedMsg && <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#065F46" }}>{savedMsg}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="부서명 검색" style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
                <select value={filterParent} onChange={e => setFilterParent(e.target.value)} style={{ ...selectStyle, width: 160 }}>
                  <option>전체</option>
                  {PARENTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>
                전체 <strong style={{ color: "#0F172A" }}>{depts.length}</strong>개 부서 ·
                수동 <strong style={{ color: "#0F172A" }}>{depts.filter(d => d.source === "manual").length}</strong>개 ·
                Teams 연동 <strong style={{ color: "#2563EB" }}>{depts.filter(d => d.source === "teams").length}</strong>개
              </div>

              {Object.entries(grouped).map(([parent, items]) => (
                <div key={parent} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{parent}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.map(dept => {
                      const isEditing = editingId === dept.id;
                      const isDelete = deleteConfirm === dept.id;
                      return (
                        <div key={dept.id} style={{ background: "#fff", borderRadius: 8, border: `1.5px solid ${isEditing ? "#BFDBFE" : isDelete ? "#FECACA" : "#E2E8F0"}`, padding: "12px 16px" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <input value={editData.name ?? dept.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, flex: 1, minWidth: 120, padding: "6px 10px" }} />
                              <select value={editData.parent ?? dept.parent} onChange={e => setEditData(p => ({ ...p, parent: e.target.value }))} style={{ ...selectStyle, width: 160, padding: "6px 32px 6px 10px" }}>
                                {PARENTS.map(p => <option key={p}>{p}</option>)}
                              </select>
                              <button onClick={() => handleSaveEdit(dept.id)} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>저장</button>
                              <button onClick={() => { setEditingId(null); setEditData({}); }} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                            </div>
                          ) : isDelete ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ flex: 1, fontSize: 13, color: "#991B1B", fontWeight: 600 }}>{dept.name} — 삭제하시겠습니까?</span>
                              <button onClick={() => handleDelete(dept.id)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>삭제</button>
                              <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{dept.name}</span>
                                  {dept.source === "teams" && <span style={{ fontSize: 10, fontWeight: 700, background: "#EFF6FF", color: "#2563EB", padding: "1px 7px", borderRadius: 20 }}>Teams</span>}
                                </div>
                                <span style={{ fontSize: 11, color: "#94A3B8" }}>프로젝트 {dept.projectCount}건</span>
                              </div>
                              <button onClick={() => { setEditingId(dept.id); setEditData({}); }} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}>수정</button>
                              <button onClick={() => setDeleteConfirm(dept.id)} style={{ background: "#fff", border: "1px solid #FECACA", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>부서 수동 추가</div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>부서명</label>
                  <input value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleAddDept()} placeholder="신규 부서명 입력" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>상위 본부</label>
                  <select value={newDept.parent} onChange={e => setNewDept(p => ({ ...p, parent: e.target.value }))} style={selectStyle}>
                    {PARENTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <button onClick={handleAddDept} style={{ width: "100%", background: "#0F172A", color: "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>추가</button>
              </div>

              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: apiConnected ? "#059669" : "#CBD5E1" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Microsoft Teams 연동</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: apiConnected ? "#D1FAE5" : "#F1F5F9", color: apiConnected ? "#065F46" : "#94A3B8" }}>{apiConnected ? "연결됨" : "미연결"}</span>
                </div>
                <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
                  {([["status", "현황"], ["config", "설정"], ["sync", "동기화"]] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setApiTab(id)} style={{
                      flex: 1, padding: "9px 0", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: apiTab === id ? "#F8FAFC" : "transparent",
                      color: apiTab === id ? "#2563EB" : "#64748B",
                      borderBottom: apiTab === id ? "2px solid #2563EB" : "2px solid transparent",
                    }}>{label}</button>
                  ))}
                </div>

                <div style={{ padding: "16px 18px" }}>
                  {apiTab === "status" && (
                    <div>
                      {[
                        { label: "연동 방식", value: "Microsoft Graph API" },
                        { label: "마지막 동기화", value: lastSyncTime ?? (apiConnected ? "2025.06.04 00:00" : "—") },
                        { label: "동기화 주기", value: autoSync ? apiConfig.syncInterval : "수동" },
                        { label: "Teams 동기화 부서", value: `${depts.filter(d => d.source === "teams").length}개` },
                      ].map((r, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F8FAFC", fontSize: 12 }}>
                          <span style={{ color: "#94A3B8", fontWeight: 600 }}>{r.label}</span>
                          <span style={{ color: "#334155", fontWeight: 500 }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {apiTab === "config" && (
                    <div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, lineHeight: 1.6 }}>Azure AD에서 발급한 자격증명을 입력하세요.</div>
                      {[
                        { label: "Tenant ID", key: "tenantId" as const, placeholder: "xxxxxxxx-xxxx-xxxx" },
                        { label: "Client ID", key: "clientId" as const, placeholder: "앱 등록 클라이언트 ID" },
                        { label: "Client Secret", key: "clientSecret" as const, placeholder: "••••••••••••••••", type: "password" },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 4 }}>{f.label}</label>
                          <input type={f.type || "text"} value={apiConfig[f.key]} onChange={e => setApiConfig(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ ...inputStyle, fontSize: 12 }} />
                        </div>
                      ))}
                      <div style={{ marginBottom: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: autoSync ? 12 : 0 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>자동 동기화</div>
                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{autoSync ? "설정된 주기마다 자동 실행" : "비활성 — 수동 동기화만 가능"}</div>
                          </div>
                          <div onClick={() => setAutoSync(v => !v)} style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", background: autoSync ? "#2563EB" : "#CBD5E1", position: "relative" }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: autoSync ? 23 : 3, transition: "left 0.2s" }} />
                          </div>
                        </div>
                        {autoSync && (
                          <>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>동기화 주기</label>
                            <select value={apiConfig.syncInterval} onChange={e => setApiConfig(p => ({ ...p, syncInterval: e.target.value }))} style={{ ...selectStyle, fontSize: 12 }}>
                              {["매일 자정", "매일 오전 6시", "매주 월요일", "매주 금요일"].map(v => <option key={v}>{v}</option>)}
                            </select>
                          </>
                        )}
                      </div>
                      <button onClick={() => showSaved("API 설정이 저장되었습니다.")} style={{ width: "100%", background: "#0F172A", color: "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>설정 저장</button>
                    </div>
                  )}

                  {apiTab === "sync" && (
                    <div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 1.6 }}>Teams 조직도를 즉시 동기화합니다.</div>
                      {!showPreview && !syncDone && (
                        <button onClick={() => setShowPreview(true)} style={{ width: "100%", background: "#EFF6FF", border: "1.5px solid #BFDBFE", color: "#2563EB", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>변경사항 미리보기</button>
                      )}
                      {showPreview && !syncDone && (
                        <div style={{ marginBottom: 12 }}>
                          {SYNC_PREVIEW.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#F8FAFC", borderRadius: 6, marginBottom: 5 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: ACTION_STYLE[item.action].bg, color: ACTION_STYLE[item.action].color, flexShrink: 0 }}>{item.action}</span>
                              <span style={{ fontSize: 12, color: "#334155", flex: 1 }}>{item.action === "이름변경" ? `${item.name} → ${item.newName}` : item.name}</span>
                              <span style={{ fontSize: 11, color: "#94A3B8" }}>{item.parent}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {syncDone ? (
                        <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 7, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#065F46", textAlign: "center" }}>동기화 완료</div>
                      ) : (
                        <button onClick={handleSync} disabled={syncing} style={{ width: "100%", background: syncing ? "#E2E8F0" : "#059669", color: syncing ? "#94A3B8" : "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: syncing ? "not-allowed" : "pointer" }}>
                          {syncing ? "동기화 중..." : "지금 동기화"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}