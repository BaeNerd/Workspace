import { useState, useMemo } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";

type Company = { code: string; name: string; visible: boolean };

// TODO: 실제 연동 시 GET /api/v1/admin/companies 응답으로 교체 (Microsoft Teams 조직도 API)
const INITIAL_COMPANIES: Company[] = [
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

// source: manual=수동등록 / teams=Teams동기화 / merged=수동+Teams 양쪽에 존재(병합됨)
type DeptSource = "manual" | "teams" | "merged";
type Dept = { id: number; name: string; parent: string | null; company: string; projectCount: number; source: DeptSource };

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
  { id: 15, name: "전략기획팀", parent: null, company: "KMH", projectCount: 1, source: "manual" },
];

// ★ PlatformItem 관계사 집계용 최소 타입 + 목업 데이터
// TODO: 실제 연동 시 GET /api/v1/admin/platform-items?fields=company 응답으로 교체
type PlatformItemRef = { id: string; company: string[] };

const PLATFORM_ITEM_REFS: PlatformItemRef[] = [
  { id: "N8N-001", company: ["KKM"] },
  { id: "N8N-002", company: ["KKM"] },
  { id: "N8N-003", company: ["KKM", "KMG"] },
  { id: "N8N-004", company: ["KMW"] },
  { id: "AST-001", company: [] },
  { id: "AST-002", company: [] },
  { id: "AST-003", company: [] },
  { id: "AST-004", company: ["KKM"] },
  { id: "AIO-001", company: [] },
  { id: "AIO-002", company: [] },
  { id: "AIO-003", company: ["KKM", "KBH", "KMG"] },
  { id: "AIO-004", company: [] },
];

const companyWidePlatformItemCount = PLATFORM_ITEM_REFS.filter(p => p.company.length === 0).length;
const platformItemCountByCompany = (code: string): number =>
  companyWidePlatformItemCount + PLATFORM_ITEM_REFS.filter(p => p.company.includes(code)).length;

const PARENTS = ["연구개발본부", "IT본부", "경영지원본부", "영업마케팅본부", "생산본부"];
const NO_PARENT = "본부 없음 (관계사 직속)";

// 부서 고유 식별 키 — company + parent + name 조합. 동명이라도 관계사·본부가 다르면 별개로 취급.
const deptKey = (company: string, parent: string | null, name: string) => `${company}::${parent ?? "_"}::${name}`;

// Teams 동기화 시 들어올 원천 데이터(목업). 실제로는 Graph API 조직도 응답.
// TODO: 실제 연동 시 GET /api/v1/admin/teams/org-preview 응답으로 교체
const TEAMS_SYNC_SOURCE: { name: string; parent: string; company: string }[] = [
  { name: "디지털마케팅팀", parent: "영업마케팅본부", company: "KKM" }, // 신규
  { name: "데이터분석팀", parent: "IT본부", company: "KKM" },          // 신규
  { name: "IT개발팀", parent: "IT본부", company: "KKM" },              // 기존 수동 등록과 동일 키 → 병합
];

const ACTION_STYLE: Record<string, { bg: string; color: string }> = {
  "추가": { bg: "#D1FAE5", color: "#065F46" },
  "병합": { bg: "#EDE9FE", color: "#6D28D9" },
  "이름변경": { bg: "#FEF3C7", color: "#92400E" },
  "유지": { bg: "#F1F5F9", color: "#475569" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32, cursor: "pointer" };

const DEPT_SOURCE_BADGE: Record<DeptSource, { label: string; bg: string; color: string } | null> = {
  manual: null,
  teams: { label: "Teams", bg: "#EFF6FF", color: "#2563EB" },
  merged: { label: "수동+Teams", bg: "#EDE9FE", color: "#6D28D9" },
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      width: 38, height: 21, borderRadius: 11, cursor: "pointer",
      background: on ? "#2563EB" : "#CBD5E1", position: "relative", flexShrink: 0, transition: "background 0.15s",
    }}>
      <div style={{
        width: 15, height: 15, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: on ? 20 : 3, transition: "left 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

// 체크박스 목록 각 행에 "플랫폼 N" 카운트 배지 — 닫힌 드롭다운 버튼은 inputStyle+cursor 사용(이중 화살표 방지)
function CompanyVisibilityDropdown({ companies, onToggle }: { companies: Company[]; onToggle: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const visibleCompanies = companies.filter(c => c.visible);
  const filteredCompanies = companies.filter(c =>
    search === "" || c.name.includes(search) || c.code.includes(search.toUpperCase())
  );

  const summaryText = () => {
    if (visibleCompanies.length === 0) return "노출 중인 관계사 없음";
    const names = visibleCompanies.map(c => c.name);
    if (names.length <= 2) return `노출 중: ${names.join(", ")}`;
    return `노출 중: ${names.slice(0, 2).join(", ")} 외 ${names.length - 2}곳`;
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        type="button"
        style={{
          ...inputStyle, textAlign: "left", width: "100%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          color: "#0F172A", fontWeight: 600,
        }}
      >
        <span>{summaryText()}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 8 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
          background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: "10px 10px 6px",
          maxHeight: 380, display: "flex", flexDirection: "column",
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="관계사명 또는 코드로 검색"
            style={{ ...inputStyle, fontSize: 12, padding: "7px 10px", marginBottom: 6 }}
          />

          <div style={{ fontSize: 11, color: "#94A3B8", padding: "2px 4px 6px" }}>
            노출 {visibleCompanies.length} / 전체 {companies.length}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {filteredCompanies.map(c => {
              const itemCount = platformItemCountByCompany(c.code);
              return (
                <label key={c.code} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "7px 8px",
                  borderRadius: 6, cursor: "pointer",
                  background: c.visible ? "#EFF6FF" : "transparent",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={c.visible} onChange={() => onToggle(c.code)} style={{ cursor: "pointer" }} />
                    <span style={{ fontSize: 12, color: "#334155" }}>{c.name}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {itemCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF", padding: "1px 6px", borderRadius: 20 }}>
                        플랫폼 {itemCount}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>{c.code}</span>
                  </span>
                </label>
              );
            })}
            {filteredCompanies.length === 0 && (
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

// 부서 한 행 (보기 / 수정 / 삭제확인 상태) — 모듈 레벨
function DeptRow({
  dept, company, isEditing, isDelete, editData,
  companies, onStartEdit, onChangeEdit, onSaveEdit, onCancelEdit,
  onAskDelete, onConfirmDelete, onCancelDelete,
}: {
  dept: Dept; company: Company | undefined;
  isEditing: boolean; isDelete: boolean; editData: Partial<Dept>;
  companies: Company[];
  onStartEdit: () => void; onChangeEdit: (patch: Partial<Dept>) => void;
  onSaveEdit: () => void; onCancelEdit: () => void;
  onAskDelete: () => void; onConfirmDelete: () => void; onCancelDelete: () => void;
}) {
  const badge = DEPT_SOURCE_BADGE[dept.source];

  return (
    <div style={{
      background: "#fff", border: `1px solid ${isEditing ? "#BFDBFE" : isDelete ? "#FECACA" : "#F1F5F9"}`,
      borderRadius: 8, padding: "11px 14px", marginBottom: 6,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      {isEditing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
          <input
            value={editData.name !== undefined ? editData.name : dept.name}
            onChange={e => onChangeEdit({ name: e.target.value })}
            style={{ ...inputStyle, width: 160, padding: "6px 10px" }}
          />
          <select value={editData.company !== undefined ? editData.company : dept.company} onChange={e => onChangeEdit({ company: e.target.value })}
            style={{ ...selectStyle, width: 150, padding: "6px 32px 6px 10px" }}>
            {companies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <select
            value={editData.parent !== undefined ? (editData.parent ?? NO_PARENT) : (dept.parent ?? NO_PARENT)}
            onChange={e => onChangeEdit({ parent: e.target.value === NO_PARENT ? null : e.target.value })}
            style={{ ...selectStyle, width: 160, padding: "6px 32px 6px 10px" }}>
            <option value={NO_PARENT}>{NO_PARENT}</option>
            {PARENTS.map(p => <option key={p}>{p}</option>)}
          </select>
          <button onClick={onSaveEdit} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>저장</button>
          <button onClick={onCancelEdit} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
        </div>
      ) : isDelete ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <span style={{ flex: 1, fontSize: 13, color: "#991B1B", fontWeight: 600 }}>{dept.name} — 삭제하시겠습니까?</span>
          {dept.projectCount > 0 && <span style={{ fontSize: 11, color: "#EF4444" }}>프로젝트 {dept.projectCount}건에 태깅됨</span>}
          <button onClick={onConfirmDelete} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>삭제</button>
          <button onClick={onCancelDelete} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{dept.name}</span>
              {!company?.visible && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#FEE2E2", color: "#991B1B" }}>비노출 관계사</span>
              )}
              {badge && (
                <span style={{ fontSize: 10, fontWeight: 700, background: badge.bg, color: badge.color, padding: "1px 7px", borderRadius: 20 }}>{badge.label}</span>
              )}
            </div>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>프로젝트 {dept.projectCount}건</span>
          </div>
          <button onClick={onStartEdit} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}>수정</button>
          <button onClick={onAskDelete} style={{ background: "#fff", border: "1px solid #FECACA", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
        </div>
      )}
    </div>
  );
}

// 관계사 단위 아코디언 — 관계사 헤더(부서 수·노출 여부) + 펼침 시 본부별 그룹 + 부서 행
function CompanyAccordion({
  company, depts, expanded, onToggleExpand, renderDept,
}: {
  company: Company; depts: Dept[]; expanded: boolean;
  onToggleExpand: () => void; renderDept: (d: Dept) => React.ReactNode;
}) {
  // 본부별 그룹화 (본부 없음은 마지막)
  const grouped = [...PARENTS, NO_PARENT].reduce((acc, p) => {
    const items = p === NO_PARENT ? depts.filter(d => d.parent === null) : depts.filter(d => d.parent === p);
    if (items.length > 0) acc.push([p, items]);
    return acc;
  }, [] as [string, Dept[]][]);

  return (
    <div style={{ border: "1.5px solid #E2E8F0", borderRadius: 10, marginBottom: 10, overflow: "hidden", background: "#fff" }}>
      <div onClick={onToggleExpand} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer",
        background: expanded ? "#F8FAFC" : "#fff",
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"
          style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{company.name}</span>
        <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>{company.code}</span>
        {!company.visible && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#FEE2E2", color: "#991B1B" }}>비노출</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#64748B", background: "#F1F5F9", padding: "2px 9px", borderRadius: 20 }}>
          부서 {depts.length}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: "10px 16px 14px" }}>
          {grouped.map(([parent, items]) => (
            <div key={parent} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: parent === NO_PARENT ? "#94A3B8" : "#2563EB", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                {parent}
              </div>
              {items.map(d => renderDept(d))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrg() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [depts, setDepts] = useState<Dept[]>(INITIAL_DEPTS);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("전체");
  const [filterParent, setFilterParent] = useState("전체");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Dept>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [newDept, setNewDept] = useState<{ name: string; parent: string; company: string }>({ name: "", parent: NO_PARENT, company: "KKM" });
  const [savedMsg, setSavedMsg] = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([]);

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
    (filterParent === "전체" || (filterParent === "null" ? d.parent === null : d.parent === filterParent)) &&
    (search === "" || d.name.includes(search) || (d.parent ?? "").includes(search))
  );
  const companyName = (code: string) => companies.find(c => c.code === code)?.name ?? code;
  const visibleCount = companies.filter(c => c.visible).length;

  // 검색·필터가 활성화되면 결과가 보이도록 자동 펼침. 아니면 사용자가 토글한 상태 유지.
  const isFiltering = search !== "" || filterCompany !== "전체" || filterParent !== "전체";

  // 부서가 1개 이상 있는 관계사만, COMPANIES 순서대로 노출
  const companiesWithDepts = useMemo(() => {
    return companies
      .map(c => ({ company: c, items: filtered.filter(d => d.company === c.code) }))
      .filter(g => g.items.length > 0);
  }, [companies, filtered]);

  const toggleExpand = (code: string) =>
    setExpandedCompanies(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code]);

  const isExpanded = (code: string) => isFiltering || expandedCompanies.includes(code);

  const expandAll = () => setExpandedCompanies(companiesWithDepts.map(g => g.company.code));
  const collapseAll = () => setExpandedCompanies([]);

  const handleToggleCompany = (code: string) => {
    // TODO: 실제 연동 시 PATCH /api/v1/admin/companies/:code { visible }
    setCompanies(p => p.map(c => c.code === code ? { ...c, visible: !c.visible } : c));
    const target = companies.find(c => c.code === code);
    showSaved(`${target?.name}이(가) ${target?.visible ? "비노출" : "노출"} 처리되었습니다.`);
  };

  const handleSaveEdit = (id: number) => {
    setDepts(p => p.map(d => d.id === id ? { ...d, ...editData } as Dept : d));
    setEditingId(null); setEditData({});
    showSaved("부서 정보가 수정되었습니다.");
  };

  const handleDelete = (id: number) => {
    setDepts(p => p.filter(d => d.id !== id));
    setDeleteConfirm(null);
    showSaved("부서가 삭제되었습니다.");
  };

  const handleAddDept = () => {
    if (!newDept.name.trim()) return;
    const targetParent = newDept.parent === NO_PARENT ? null : newDept.parent;
    const key = deptKey(newDept.company, targetParent, newDept.name.trim());
    // 동일 키(관계사+본부+부서명)가 이미 있으면 중복 추가 차단
    if (depts.some(d => deptKey(d.company, d.parent, d.name) === key)) {
      showSaved("이미 동일한 관계사·본부에 같은 이름의 부서가 있습니다.");
      return;
    }
    setDepts(p => [...p, {
      id: Date.now(), name: newDept.name.trim(),
      parent: targetParent, company: newDept.company, projectCount: 0, source: "manual",
    }]);
    setNewDept({ name: "", parent: NO_PARENT, company: "KKM" });
    showSaved("부서가 추가되었습니다.");
  };

  // Teams 동기화 미리보기 — 기존 부서와 company+parent+name 키로 비교해 추가/병합 구분
  const syncPreview = useMemo(() => {
    return TEAMS_SYNC_SOURCE.map(src => {
      const key = deptKey(src.company, src.parent, src.name);
      const existing = depts.find(d => deptKey(d.company, d.parent, d.name) === key);
      return { ...src, action: existing ? "병합" : "추가" as "추가" | "병합", existingId: existing?.id };
    });
  }, [depts]);

  const handleSync = () => {
    setSyncing(true); setShowPreview(false);
    setTimeout(() => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setSyncing(false); setSyncDone(true); setApiConnected(true);
      setLastSyncTime(`2025.06.29 ${pad(now.getHours())}:${pad(now.getMinutes())}`);

      setDepts(prev => {
        let next = [...prev];
        TEAMS_SYNC_SOURCE.forEach(src => {
          const key = deptKey(src.company, src.parent, src.name);
          const idx = next.findIndex(d => deptKey(d.company, d.parent, d.name) === key);
          if (idx >= 0) {
            // 기존(수동 등록 등)과 동일 키 → 중복 생성하지 않고 병합 표시
            const cur = next[idx];
            next[idx] = { ...cur, source: cur.source === "manual" ? "merged" : cur.source };
          } else {
            next.push({ id: Date.now() + Math.random(), name: src.name, parent: src.parent, company: src.company, projectCount: 0, source: "teams" });
          }
        });
        return next;
      });
      showSaved("Microsoft Teams 조직도 동기화가 완료되었습니다.");
    }, 2000);
  };

  const teamsLinkedCount = depts.filter(d => d.source === "teams" || d.source === "merged").length;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>부서 / 조직 관리</h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>관계사 · 본부 · 부서 3단계 조직 구조를 관리합니다. 아래 두 영역은 목적이 다릅니다.</p>
          </div>

          {savedMsg && <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#065F46" }}>{savedMsg}</div>}

          {/* ===== 섹션 1. 관계사 노출 관리 ===== */}
          <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, marginBottom: 24, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: "#0F172A", width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>1</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>관계사 노출 관리</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 14px 28px", lineHeight: 1.6 }}>
              어떤 관계사를 Tech Hub에 노출할지 결정합니다. 이 설정은 사용자에게 보이는 범위(목록·필터·통계)를 좌우하는 접근 게이트입니다.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap", marginLeft: 28 }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: "#DBEAFE", color: "#1E40AF", padding: "2px 9px", borderRadius: 20 }}>
                노출 {visibleCount} / 전체 {companies.length}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, background: "#F5F3FF", color: "#6D28D9", padding: "2px 9px", borderRadius: 20 }}>
                전사 공용 플랫폼 항목 {companyWidePlatformItemCount}건 (모든 관계사 영향)
              </span>
            </div>

            <div style={{ marginLeft: 28, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#1E40AF", lineHeight: 1.6 }}>
              비노출 처리된 관계사는 해당 관계사 소속이 아닌 일반 사용자에게 Tech Hub 목록·필터·통계에서 보이지 않습니다.
              단, <strong>"그룹 전체보기" 권한</strong>을 가진 사용자(AD-06에서 부여)는 비노출 관계사도 모두 조회·필터링할 수 있습니다.
              목록의 <strong>플랫폼 N</strong> 배지는 해당 관계사를 대상으로 하는 n8n·나만의 비서·AI Agent 항목 수입니다(전사 공용 항목 포함).
            </div>

            <div style={{ maxWidth: 420, marginLeft: 28 }}>
              <CompanyVisibilityDropdown companies={companies} onToggle={handleToggleCompany} />
            </div>
          </div>

          {/* ===== 섹션 2. 부서 관리 ===== */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: "#0F172A", width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>2</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>부서 관리</span>
          </div>
          <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 16px 28px", lineHeight: 1.6 }}>
            관계사별 본부·부서 조직 계층을 관리합니다. 부서는 수동 추가하거나 Microsoft Teams 조직도와 동기화할 수 있습니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="부서명 검색"
                    style={{ ...inputStyle, padding: "8px 12px 8px 36px" }}
                    onFocus={e => e.target.style.borderColor = "#2563EB"}
                    onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
                  <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </div>
                <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} style={{ ...selectStyle, width: 200 }}>
                  <option value="전체">관계사 전체</option>
                  {companies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code}){!c.visible ? " · 비노출" : ""}</option>)}
                </select>
                <select value={filterParent} onChange={e => setFilterParent(e.target.value)} style={{ ...selectStyle, width: 180 }}>
                  <option value="전체">본부 전체</option>
                  {PARENTS.map(p => <option key={p}>{p}</option>)}
                  <option value="null">{NO_PARENT}</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>
                  전체 <strong style={{ color: "#0F172A" }}>{depts.length}</strong>개 부서 ·
                  수동 <strong style={{ color: "#0F172A" }}>{depts.filter(d => d.source === "manual").length}</strong>개 ·
                  Teams 연동 <strong style={{ color: "#2563EB" }}>{teamsLinkedCount}</strong>개
                </div>
                {!isFiltering && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={expandAll} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}>모두 펼치기</button>
                    <button onClick={collapseAll} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}>모두 접기</button>
                  </div>
                )}
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>
                각 부서의 "프로젝트 N건" 카운트는 일반 프로젝트만 집계합니다. n8n·나만의 비서·AI Agent는 부서가 아닌 관계사 단위로 집계되며, 위 <strong>섹션 1</strong>의 "플랫폼 N" 배지에서 확인할 수 있습니다.
              </div>

              {companiesWithDepts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>검색 결과가 없습니다.</div>
              ) : (
                companiesWithDepts.map(({ company, items }) => (
                  <CompanyAccordion
                    key={company.code}
                    company={company}
                    depts={items}
                    expanded={isExpanded(company.code)}
                    onToggleExpand={() => toggleExpand(company.code)}
                    renderDept={(dept) => (
                      <DeptRow
                        key={dept.id}
                        dept={dept}
                        company={company}
                        companies={companies}
                        isEditing={editingId === dept.id}
                        isDelete={deleteConfirm === dept.id}
                        editData={editData}
                        onStartEdit={() => { setEditingId(dept.id); setEditData({}); setDeleteConfirm(null); }}
                        onChangeEdit={(patch) => setEditData(p => ({ ...p, ...patch }))}
                        onSaveEdit={() => handleSaveEdit(dept.id)}
                        onCancelEdit={() => { setEditingId(null); setEditData({}); }}
                        onAskDelete={() => { setDeleteConfirm(dept.id); setEditingId(null); }}
                        onConfirmDelete={() => handleDelete(dept.id)}
                        onCancelDelete={() => setDeleteConfirm(null)}
                      />
                    )}
                  />
                ))
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>부서 수동 추가</div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>부서명</label>
                  <input value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleAddDept()}
                    placeholder="신규 부서명 입력"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#2563EB"}
                    onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>관계사 <span style={{ color: "#EF4444" }}>*필수</span></label>
                  <select value={newDept.company} onChange={e => setNewDept(p => ({ ...p, company: e.target.value }))} style={selectStyle}>
                    {companies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>상위 본부 <span style={{ color: "#94A3B8" }}>(선택)</span></label>
                  <select value={newDept.parent} onChange={e => setNewDept(p => ({ ...p, parent: e.target.value }))} style={selectStyle}>
                    <option value={NO_PARENT}>{NO_PARENT}</option>
                    {PARENTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <button onClick={handleAddDept} style={{ width: "100%", background: "#0F172A", color: "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  추가
                </button>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8, lineHeight: 1.5 }}>
                  동일 관계사·본부에 같은 이름의 부서가 이미 있으면 추가되지 않습니다. Teams 동기화 시에도 같은 기준으로 중복을 방지하고 병합합니다.
                </div>
              </div>

              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: apiConnected ? "#059669" : "#CBD5E1" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Microsoft Teams 연동</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: apiConnected ? "#D1FAE5" : "#F1F5F9", color: apiConnected ? "#065F46" : "#94A3B8" }}>
                    {apiConnected ? "연결됨" : "미연결"}
                  </span>
                </div>

                <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
                  {([["status", "현황"], ["config", "설정"], ["sync", "동기화"]] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setApiTab(id)} style={{
                      flex: 1, padding: "9px 0",
                      borderTop: "none", borderLeft: "none", borderRight: "none",
                      borderBottom: apiTab === id ? "2px solid #2563EB" : "2px solid transparent",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: apiTab === id ? "#F8FAFC" : "transparent",
                      color: apiTab === id ? "#2563EB" : "#64748B",
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
                        { label: "Teams 연동 부서", value: `${teamsLinkedCount}개` },
                        { label: "관계사 노출 현황", value: `${visibleCount} / ${companies.length}개 노출` },
                        { label: "플랫폼 항목 총 개수", value: `${PLATFORM_ITEM_REFS.length}건 (전사 공용 ${companyWidePlatformItemCount}건 포함)` },
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
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, lineHeight: 1.6 }}>
                        Azure AD에서 발급한 자격증명을 입력하세요. Microsoft Graph API를 통해 조직도를 가져옵니다.
                      </div>
                      {[
                        { label: "Tenant ID", key: "tenantId" as const, placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
                        { label: "Client ID", key: "clientId" as const, placeholder: "앱 등록 클라이언트 ID" },
                        { label: "Client Secret", key: "clientSecret" as const, placeholder: "••••••••••••••••", type: "password" },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 4 }}>{f.label}</label>
                          <input type={f.type || "text"} value={apiConfig[f.key]} onChange={e => setApiConfig(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            style={{ ...inputStyle, fontSize: 12 }}
                            onFocus={e => e.target.style.borderColor = "#2563EB"}
                            onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
                        </div>
                      ))}
                      <div style={{ marginBottom: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: autoSync ? 12 : 0 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>자동 동기화</div>
                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                              {autoSync ? "설정된 주기마다 자동 실행" : "비활성 — 수동 동기화만 가능"}
                            </div>
                          </div>
                          <Toggle on={autoSync} onClick={() => setAutoSync(v => !v)} />
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
                      <button onClick={() => showSaved("API 설정이 저장되었습니다.")} style={{ width: "100%", background: "#0F172A", color: "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        설정 저장
                      </button>
                    </div>
                  )}

                  {apiTab === "sync" && (
                    <div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 1.6 }}>
                        Teams 조직도를 즉시 동기화합니다. 신규 부서는 추가되고, <strong>관계사·본부·부서명이 모두 같은</strong> 기존 부서는 중복 생성 없이 병합됩니다. 신규 관계사가 발견되면 기본 <strong>비노출</strong>로 추가됩니다.
                      </div>

                      {!showPreview && !syncDone && (
                        <button onClick={() => setShowPreview(true)} style={{ width: "100%", background: "#EFF6FF", border: "1.5px solid #BFDBFE", color: "#2563EB", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
                          변경사항 미리보기
                        </button>
                      )}

                      {showPreview && !syncDone && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>동기화 예정 변경사항</div>
                          {syncPreview.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#F8FAFC", borderRadius: 6, marginBottom: 5 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: ACTION_STYLE[item.action].bg, color: ACTION_STYLE[item.action].color, flexShrink: 0 }}>{item.action}</span>
                              <span style={{ fontSize: 12, color: "#334155", flex: 1 }}>{item.name}</span>
                              <span style={{ fontSize: 11, color: "#94A3B8" }}>{companyName(item.company)} · {item.parent}</span>
                            </div>
                          ))}
                          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 6, lineHeight: 1.5 }}>
                            "병합"은 이미 수동 등록된 부서와 동일하여 새로 추가하지 않고 Teams 연동 표시만 더하는 항목입니다.
                          </div>
                        </div>
                      )}

                      {syncDone ? (
                        <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 7, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#065F46", textAlign: "center" }}>
                          동기화 완료
                        </div>
                      ) : (
                        <button onClick={handleSync} disabled={syncing} style={{
                          width: "100%", background: syncing ? "#E2E8F0" : "#059669",
                          color: syncing ? "#94A3B8" : "#fff", border: "none", borderRadius: 7,
                          padding: "9px 0", fontSize: 13, fontWeight: 700,
                          cursor: syncing ? "not-allowed" : "pointer",
                        }}>
                          {syncing ? "동기화 중..." : "지금 동기화"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 16px", marginTop: 20, fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>
            <strong>운영 유의사항</strong><br />
            관계사를 비노출로 전환해도 기존에 등록된 프로젝트·플랫폼 항목 데이터는 삭제되지 않습니다. 그룹 전체보기 권한자에게는 계속 조회됩니다.
            부서 삭제 시 해당 부서에 태깅된 프로젝트가 있다면 영향 범위를 사전에 확인하세요.
          </div>
        </main>
      </div>
    </div>
  );
}