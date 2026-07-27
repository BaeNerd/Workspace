import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import {
  getAdmins, getGroupViewers, getRegistrants, getAuditLogs, getSsoUsers,
  getSelectableCompanies, getCompanyAdmins,
} from "../../lib/dataSource";
import { COLOR } from "../../styles/tokens";
import { ADMIN_CONTENT_MAX, ADMIN_PAD } from "../../styles/layout";
import { useVisibleCount } from "../../hooks/useVisibleCount";
import LoadMoreButton from "../../components/LoadMoreButton";
import type { CompanyAdminUser } from "../../lib/dataSource";

export type Admin = { id: number; name: string; email: string; dept: string; title: string; grantedAt: string; grantedBy: string };
export type GroupViewer = { id: number; name: string; email: string; dept: string; title: string; grantedAt: string; grantedBy: string; reason: string };
export type SsoUser = { name: string; email: string; dept: string; title: string };
type LogSource = "n8n" | "PA" | "나만의비서" | "AI Model" | "ML" | "Vibe";
export type LogEntry = { id: number; datetime: string; actor: string; action: string; target: string; category: "등록물" | "권한" | "분류체계" | "조직"; source?: LogSource };
export type Registrant = { name: string; email: string; dept: string; title: string; count: number; lastSubmit: string; approved: number; pending: number; rejected: number };

const LOG_CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  "등록물": { bg: "#DBEAFE", color: "#1E40AF" },
  "권한": { bg: "#FEF3C7", color: "#92400E" },
  "분류체계": { bg: "#F3E8FF", color: "#7E22CE" },
  "조직": { bg: "#D1FAE5", color: "#065F46" },
};
const LOG_CATEGORY_FALLBACK = { bg: "#F1F5F9", color: "#475569" };

const LOG_SOURCE_STYLE: Record<LogSource, { bg: string; color: string }> = {
  "n8n": { bg: "#FCE7F3", color: "#9D174D" },
  "PA": { bg: "#DBEAFE", color: "#1D4ED8" },
  "나만의비서": { bg: "#DCFCE7", color: "#166534" },
  "AI Model": { bg: "#EDE9FE", color: "#5B21B6" },
  "ML": { bg: "#ECFEFF", color: "#155E75" },
  "Vibe": { bg: "#FAF5FF", color: "#7E22CE" },
};

const TABS = ["관리자 권한", "그룹 전체보기", "등록자 관리", "활동 로그"] as const;
const LOG_CATEGORIES = ["전체", "등록물", "권한", "분류체계", "조직"] as const;

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: 13, color: COLOR.text,
  background: COLOR.bgSubtle, border: `1.5px solid ${COLOR.border}`, borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const companyName = (code: string) => getSelectableCompanies().find(c => c.code === code)?.name ?? code;

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLOR.text3} strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 8 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// 부여 플로우용 담당 관계사 멀티셀렉트 (닫힌 트리거 = inputStyle + cursor: pointer)
function CompanyMultiSelect({ selected, onChange }: { selected: string[]; onChange: (codes: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = getSelectableCompanies().filter(c => q === "" || c.name.includes(q) || c.code.includes(q.toUpperCase()));
  const toggle = (code: string) => onChange(selected.includes(code) ? selected.filter(x => x !== code) : [...selected, code]);
  const label = selected.length === 0 ? "담당 관계사 선택"
    : selected.length <= 2 ? selected.map(companyName).join(", ")
    : `${selected.slice(0, 2).map(companyName).join(", ")} 외 ${selected.length - 2}곳`;
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: selected.length ? COLOR.text : COLOR.text3, fontWeight: 600 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 30, background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: "10px 10px 6px", maxHeight: 300, display: "flex", flexDirection: "column" }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="관계사명 또는 코드 검색" style={{ ...inputStyle, fontSize: 12, padding: "7px 10px", marginBottom: 6 }} />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.map(c => (
              <label key={c.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", background: selected.includes(c.code) ? COLOR.primaryWeak : "transparent" }}>
                <input type="checkbox" checked={selected.includes(c.code)} onChange={() => toggle(c.code)} style={{ cursor: "pointer" }} />
                <span style={{ fontSize: 12, color: COLOR.text2 }}>{c.name}</span>
                <span style={{ fontSize: 10, color: COLOR.text3, fontFamily: "var(--font-mono)", marginLeft: "auto" }}>{c.code}</span>
              </label>
            ))}
            {filtered.length === 0 && <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: COLOR.text3 }}>검색 결과가 없습니다.</div>}
          </div>
          <button type="button" onClick={() => setOpen(false)} style={{ marginTop: 8, background: "#0F172A", color: "#fff", border: "none", borderRadius: 6, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>완료</button>
        </div>
      )}
    </div>
  );
}

// 행 편집용 "관계사 추가" 드롭다운 — 미배정 관계사만, 클릭 시 추가 (닫힌 트리거 = inputStyle + cursor)
function AddCompanyMenu({ assigned, onAdd }: { assigned: string[]; onAdd: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const options = getSelectableCompanies().filter(c => !assigned.includes(c.code) && (q === "" || c.name.includes(q) || c.code.includes(q.toUpperCase())));
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{ ...inputStyle, width: "auto", cursor: "pointer", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: COLOR.text2, display: "inline-flex", alignItems: "center", gap: 4 }}>
        + 관계사 추가 <Chevron open={open} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30, width: 240, background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: "10px 10px 8px", maxHeight: 280, display: "flex", flexDirection: "column" }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="관계사명 또는 코드 검색" style={{ ...inputStyle, fontSize: 12, padding: "7px 10px", marginBottom: 6 }} />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {options.map(c => (
              <div key={c.code} onClick={() => { onAdd(c.code); setOpen(false); setQ(""); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer" }}>
                <span style={{ fontSize: 12, color: COLOR.text2 }}>{c.name}</span>
                <span style={{ fontSize: 10, color: COLOR.text3, fontFamily: "var(--font-mono)", marginLeft: "auto" }}>{c.code}</span>
              </div>
            ))}
            {options.length === 0 && <div style={{ padding: "14px 0", textAlign: "center", fontSize: 12, color: COLOR.text3 }}>추가할 관계사가 없습니다.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("관리자 권한");
  const [admins, setAdmins] = useState<Admin[]>(getAdmins());
  const [groupViewers, setGroupViewers] = useState<GroupViewer[]>(getGroupViewers());
  const [savedMsg, setSavedMsg] = useState("");
  const [revokeConfirm, setRevokeConfirm] = useState<number | null>(null);
  // 관계사 관리자 — 공유 목업을 초기값으로 하는 로컬 state
  // TODO(demo): 화면 내 편집(부여·회수·담당 변경)은 로컬 상태에만 반영됨.
  //             실제 연동 시 PUT /api/v1/admin/company-admins 및 GET /api/v1/auth/me 반영으로 교체.
  const [companyAdmins, setCompanyAdmins] = useState<CompanyAdminUser[]>(getCompanyAdmins());
  const [caRevokeConfirm, setCaRevokeConfirm] = useState<string | null>(null);
  const [grantRole, setGrantRole] = useState<"admin" | "company">("admin");
  const [grantCompanies, setGrantCompanies] = useState<string[]>([]);
  const [grantErr, setGrantErr] = useState("");
  const [chipErr, setChipErr] = useState<Record<string, string>>({});
  const [groupRevokeConfirm, setGroupRevokeConfirm] = useState<number | null>(null);
  const [groupGrantConfirm, setGroupGrantConfirm] = useState<SsoUser | null>(null);
  const [groupGrantReason, setGroupGrantReason] = useState("");

  const [ssoSearch, setSsoSearch] = useState("");
  const [ssoResult, setSsoResult] = useState<SsoUser | "notfound" | null>(null);
  const [searching, setSearching] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSsoSearch, setGroupSsoSearch] = useState("");
  const [groupSsoResult, setGroupSsoResult] = useState<SsoUser | "notfound" | null>(null);
  const [groupSearching, setGroupSearching] = useState(false);
  const [regSearch, setRegSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [logCategory, setLogCategory] = useState("전체");

  const showSaved = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(""), 2200); };
  const adminEmails = admins.map(a => a.email);
  const companyAdminEmails = companyAdmins.map(a => a.email);
  const groupViewerEmails = groupViewers.map(g => g.email);

  const handleSsoSearch = () => {
    if (!ssoSearch.trim()) return;
    setSearching(true);
    // TODO: 실제 연동 시 GET /api/v1/admin/sso-search?q=:ssoSearch
    setTimeout(() => {
      const q = ssoSearch.toLowerCase();
      const found = getSsoUsers().find(u => u.name.includes(ssoSearch) || u.email.toLowerCase().includes(q) || u.dept.includes(ssoSearch));
      setSsoResult(found || "notfound");
      setSearching(false);
    }, 800);
  };

  const handleGroupSsoSearch = () => {
    if (!groupSsoSearch.trim()) return;
    setGroupSearching(true);
    setTimeout(() => {
      const q = groupSsoSearch.toLowerCase();
      const found = getSsoUsers().find(u => u.name.includes(groupSsoSearch) || u.email.toLowerCase().includes(q) || u.dept.includes(groupSsoSearch));
      setGroupSsoResult(found || "notfound");
      setGroupSearching(false);
    }, 800);
  };

  const resetGrant = () => { setSsoSearch(""); setSsoResult(null); setGrantRole("admin"); setGrantCompanies([]); setGrantErr(""); };

  const handleGrantAdmin = (user: SsoUser) => {
    // TODO: 실제 연동 시 POST /api/v1/admin/users/grant-admin
    setAdmins(p => [...p, { id: Date.now(), name: user.name, email: user.email, dept: user.dept, title: user.title, grantedAt: "2025.06.30", grantedBy: "김관리" }]);
    resetGrant();
    showSaved(`${user.name}에게 전사 관리자 권한이 부여되었습니다.`);
  };

  const handleGrantCompanyAdmin = (user: SsoUser) => {
    if (grantCompanies.length === 0) { setGrantErr("담당 관계사를 1곳 이상 선택하세요."); return; }
    // TODO: 실제 연동 시 PUT /api/v1/admin/company-admins
    setCompanyAdmins(p => [...p, { email: user.email, name: user.name, dept: user.dept, managedCompanies: grantCompanies }]);
    resetGrant();
    showSaved(`${user.name}에게 관계사 관리자 권한이 부여되었습니다.`);
  };

  // 가드: 전사 관리자 최소 1명 유지 (마지막 전사 관리자 회수 차단)
  const handleRevoke = (id: number) => {
    if (admins.length <= 1) return;
    // TODO: 실제 연동 시 POST /api/v1/admin/users/:id/revoke-admin
    setAdmins(p => p.filter(a => a.id !== id));
    setRevokeConfirm(null);
    showSaved("전사 관리자 권한이 회수되었습니다.");
  };

  const handleRevokeCompanyAdmin = (email: string) => {
    setCompanyAdmins(p => p.filter(a => a.email !== email));
    setCaRevokeConfirm(null);
    setChipErr(e => { const n = { ...e }; delete n[email]; return n; });
    showSaved("관계사 관리자 권한이 회수되었습니다.");
  };

  const addManagedCompany = (email: string, code: string) => {
    setChipErr(e => { const n = { ...e }; delete n[email]; return n; });
    setCompanyAdmins(p => p.map(a => a.email === email && !a.managedCompanies.includes(code) ? { ...a, managedCompanies: [...a.managedCompanies, code] } : a));
  };

  // 마지막 1곳 제거는 차단 — 담당을 모두 해제하려면 권한 회수를 사용
  const removeManagedCompany = (email: string, code: string) => {
    setCompanyAdmins(p => p.map(a => {
      if (a.email !== email) return a;
      if (a.managedCompanies.length <= 1) {
        setChipErr(e => ({ ...e, [email]: "담당 관계사는 1곳 이상이어야 합니다. 담당을 모두 해제하려면 권한 회수를 사용하세요." }));
        return a;
      }
      setChipErr(e => { const n = { ...e }; delete n[email]; return n; });
      return { ...a, managedCompanies: a.managedCompanies.filter(c => c !== code) };
    }));
  };

  const handleGroupGrant = (user: SsoUser) => {
    if (!groupGrantReason.trim()) return;
    // TODO: 실제 연동 시 POST /api/v1/admin/users/grant-group-viewer
    setGroupViewers(p => [...p, {
      id: Date.now(), name: user.name, email: user.email, dept: user.dept, title: user.title,
      grantedAt: "2025.06.30", grantedBy: "김관리", reason: groupGrantReason.trim(),
    }]);
    setGroupGrantConfirm(null); setGroupSsoSearch(""); setGroupSsoResult(null); setGroupGrantReason("");
    showSaved(`${user.name}에게 그룹 전체보기 권한이 부여되었습니다.`);
  };

  const handleGroupRevoke = (id: number) => {
    // TODO: 실제 연동 시 POST /api/v1/admin/users/:id/revoke-group-viewer
    setGroupViewers(p => p.filter(g => g.id !== id));
    setGroupRevokeConfirm(null);
    showSaved("그룹 전체보기 권한이 회수되었습니다.");
  };

  const filteredAdmins = admins.filter(a => adminSearch === "" || a.name.includes(adminSearch) || a.dept.includes(adminSearch));
  const filteredCompanyAdmins = companyAdmins.filter(a => adminSearch === "" || a.name.includes(adminSearch) || (a.dept ?? "").includes(adminSearch) || a.email.includes(adminSearch));
  const filteredGroupViewers = groupViewers.filter(g => groupSearch === "" || g.name.includes(groupSearch) || g.dept.includes(groupSearch));
  const filteredReg = getRegistrants().filter(r => regSearch === "" || r.name.includes(regSearch) || r.dept.includes(regSearch));
  const filteredLogs = getAuditLogs().filter(l => (logCategory === "전체" || l.category === logCategory) && (logSearch === "" || l.actor.includes(logSearch) || l.target.includes(logSearch) || l.action.includes(logSearch)));

  // 성장형 목록 — 탭·검색·필터가 바뀌면 표시 수 초기화(탭별 독립 카운트).
  const reg = useVisibleCount(12, 12, `${activeTab}|${regSearch}`);
  const logs = useVisibleCount(20, 20, `${activeTab}|${logCategory}|${logSearch}`);

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: `28px ${ADMIN_PAD}px`, minWidth: 0, maxWidth: ADMIN_CONTENT_MAX }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>사용자 / 권한 / 로그 관리</h1>
            <p style={{ fontSize: 13, color: COLOR.text2, marginTop: 4 }}>사용자 계정은 SSO로 자동 관리됩니다. 관리자 권한 부여 및 그룹 전체보기 권한을 이 화면에서 관리합니다.</p>
          </div>

          {savedMsg && <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#065F46" }}>{savedMsg}</div>}

          <div style={{ background: COLOR.primaryWeak, border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLOR.primary, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: "#1E40AF", lineHeight: 1.6 }}>
              <strong>Microsoft SSO 연동 중</strong> — 신규 임직원은 첫 로그인 시 자동 등록, 퇴직자는 SSO 계정 비활성화와 동시에 자동 차단됩니다.
            </div>
          </div>

          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: "10px 24px",
                borderTop: "none", borderBottom: "none", borderLeft: "none",
                borderRight: i < TABS.length - 1 ? `1px solid ${COLOR.border}` : "none",
                background: activeTab === t ? "#0F172A" : "transparent",
                color: activeTab === t ? "#fff" : COLOR.text2,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>{t}</button>
            ))}
          </div>

          {/* ===== 탭 1: 관리자 권한 ===== */}
          {activeTab === "관리자 권한" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLOR.text }}>
                    관리자 <span style={{ fontSize: 13, color: COLOR.text3, fontWeight: 500 }}>전사 {admins.length} · 관계사 {companyAdmins.length}</span>
                  </div>
                  <input value={adminSearch} onChange={e => setAdminSearch(e.target.value)} placeholder="이름, 부서, 이메일 검색" style={{ ...inputStyle, width: 220, fontSize: 12 }} />
                </div>

                {/* --- 전사 관리자 --- */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: "0.04em", marginBottom: 8 }}>전사 관리자</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                  {filteredAdmins.map(admin => {
                    const isRevoke = revokeConfirm === admin.id;
                    const isSelf = admin.id === 1;
                    const isLast = admins.length <= 1;
                    return (
                      <div key={admin.id} style={{ background: "#fff", border: `1.5px solid ${isRevoke ? "#FECACA" : COLOR.border}`, borderRadius: 10, padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{admin.name[0]}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 14, fontWeight: 700 }}>{admin.name}</span>
                              {isSelf && <span style={{ fontSize: 10, fontWeight: 700, background: COLOR.border, color: COLOR.text2, padding: "1px 7px", borderRadius: 20 }}>본인</span>}
                              <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "1px 7px", borderRadius: 20 }}>전사 관리자</span>
                              {groupViewerEmails.includes(admin.email) && (
                                <span style={{ fontSize: 10, fontWeight: 700, background: "#EDE9FE", color: "#6D28D9", padding: "1px 7px", borderRadius: 20 }}>그룹 전체보기</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: COLOR.text2 }}>{admin.title} · {admin.dept}</div>
                            <div style={{ fontSize: 11, color: COLOR.text3, marginTop: 1 }}>{admin.email}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 10, color: COLOR.text3, marginBottom: 8, lineHeight: 1.7 }}>{admin.grantedAt} 부여<br />{admin.grantedBy}</div>
                            {!isSelf && !isRevoke && <button onClick={() => setRevokeConfirm(admin.id)} style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#EF4444", cursor: "pointer" }}>권한 회수</button>}
                            {isSelf && <span style={{ fontSize: 11, color: "#CBD5E1" }}>회수 불가</span>}
                          </div>
                        </div>
                        {isRevoke && (
                          <div style={{ marginTop: 12, background: "#FEF2F2", borderRadius: 7, padding: "12px 14px" }}>
                            {isLast ? (
                              <>
                                <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, marginBottom: 8 }}>전사 관리자는 최소 1명 유지해야 합니다. 회수할 수 없습니다.</div>
                                <button onClick={() => setRevokeConfirm(null)} style={{ background: "#fff", border: `1px solid ${COLOR.border}`, borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>확인</button>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, marginBottom: 8 }}>{admin.name}의 전사 관리자 권한을 회수하시겠습니까?</div>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button onClick={() => setRevokeConfirm(null)} style={{ background: "#fff", border: `1px solid ${COLOR.border}`, borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>취소</button>
                                  <button onClick={() => handleRevoke(admin.id)} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>회수 확인</button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredAdmins.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: COLOR.text3, fontSize: 13 }}>해당하는 전사 관리자가 없습니다.</div>}
                </div>

                {/* --- 관계사 관리자 --- */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#B4602E", letterSpacing: "0.04em", marginBottom: 8 }}>관계사 관리자</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredCompanyAdmins.map(ca => {
                    const isRevoke = caRevokeConfirm === ca.email;
                    const err = chipErr[ca.email];
                    return (
                      <div key={ca.email} style={{ background: "#fff", border: `1.5px solid ${isRevoke ? "#FECACA" : COLOR.border}`, borderRadius: 10, padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#B4602E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{ca.name[0]}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 14, fontWeight: 700 }}>{ca.name}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, background: "#FBEEE4", color: "#B4602E", padding: "1px 7px", borderRadius: 20 }}>관계사 관리자</span>
                            </div>
                            <div style={{ fontSize: 12, color: COLOR.text2 }}>{ca.dept ?? "부서 미상"} · {ca.email}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
                              {ca.managedCompanies.map(code => (
                                <span key={code} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FBEEE4", color: "#B4602E", borderRadius: 20, padding: "3px 6px 3px 10px", fontSize: 11, fontWeight: 700 }}>
                                  {companyName(code)}
                                  <button onClick={() => removeManagedCompany(ca.email, code)} title="제거" style={{ background: "none", border: "none", color: "#B4602E", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 2px" }}>×</button>
                                </span>
                              ))}
                              <AddCompanyMenu assigned={ca.managedCompanies} onAdd={code => addManagedCompany(ca.email, code)} />
                            </div>
                            {err && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>{err}</div>}
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            {!isRevoke && <button onClick={() => setCaRevokeConfirm(ca.email)} style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#EF4444", cursor: "pointer" }}>권한 회수</button>}
                          </div>
                        </div>
                        {isRevoke && (
                          <div style={{ marginTop: 12, background: "#FEF2F2", borderRadius: 7, padding: "12px 14px" }}>
                            <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, marginBottom: 8 }}>{ca.name}의 관계사 관리자 권한을 회수하시겠습니까? (담당 관계사 전체 해제)</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setCaRevokeConfirm(null)} style={{ background: "#fff", border: `1px solid ${COLOR.border}`, borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>취소</button>
                              <button onClick={() => handleRevokeCompanyAdmin(ca.email)} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>회수 확인</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredCompanyAdmins.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: COLOR.text3, fontSize: 13 }}>지정된 관계사 관리자가 없습니다.</div>}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 4 }}>관리자 권한 부여</div>
                  <div style={{ fontSize: 12, color: COLOR.text2, marginBottom: 14, lineHeight: 1.6 }}>사내 SSO 계정을 검색하여 전사 관리자 또는 관계사 관리자로 지정합니다.</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <input value={ssoSearch} onChange={e => { setSsoSearch(e.target.value); setSsoResult(null); setGrantRole("admin"); setGrantCompanies([]); setGrantErr(""); }} onKeyDown={e => e.key === "Enter" && handleSsoSearch()} placeholder="이름, 이메일, 부서 검색" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={handleSsoSearch} style={{ background: "#0F172A", color: "#fff", border: "none", borderRadius: 7, padding: "0 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>{searching ? "..." : "검색"}</button>
                  </div>

                  {ssoResult === "notfound" && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#991B1B" }}>SSO에서 해당 사용자를 찾을 수 없습니다.</div>}
                  {ssoResult && ssoResult !== "notfound" && (
                    <div style={{ background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{ssoResult.name[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>{ssoResult.name}</div>
                          <div style={{ fontSize: 11, color: COLOR.text2 }}>{ssoResult.title} · {ssoResult.dept}</div>
                        </div>
                      </div>

                      {adminEmails.includes(ssoResult.email) ? (
                        <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600, background: "#FEF3C7", padding: "6px 10px", borderRadius: 6 }}>이미 전사 관리자로 지정된 사용자입니다.</div>
                      ) : companyAdminEmails.includes(ssoResult.email) ? (
                        <div style={{ fontSize: 12, color: "#B4602E", fontWeight: 600, background: "#FBEEE4", padding: "6px 10px", borderRadius: 6 }}>이미 관계사 관리자로 지정된 사용자입니다. 담당 관계사는 좌측 목록에서 편집하세요.</div>
                      ) : (
                        <>
                          <label style={{ fontSize: 11, fontWeight: 700, color: COLOR.text2, display: "block", marginBottom: 6 }}>역할</label>
                          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                            {([["admin", "전사 관리자"], ["company", "관계사 관리자"]] as const).map(([key, label]) => {
                              const on = grantRole === key;
                              return (
                                <button key={key} onClick={() => { setGrantRole(key); setGrantErr(""); }} style={{
                                  flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
                                  border: `1.5px solid ${on ? COLOR.primary : COLOR.border}`, background: on ? COLOR.primaryWeak : "#fff", color: on ? COLOR.primary : COLOR.text2,
                                }}>{label}</button>
                              );
                            })}
                          </div>

                          {grantRole === "company" && (
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: COLOR.text2, display: "block", marginBottom: 6 }}>담당 관계사 <span style={{ color: "#EF4444" }}>*1곳 이상</span></label>
                              <CompanyMultiSelect selected={grantCompanies} onChange={codes => { setGrantCompanies(codes); if (codes.length > 0) setGrantErr(""); }} />
                              {grantErr && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>{grantErr}</div>}
                            </div>
                          )}

                          <button
                            onClick={() => grantRole === "admin" ? handleGrantAdmin(ssoResult) : handleGrantCompanyAdmin(ssoResult)}
                            style={{ width: "100%", background: grantRole === "admin" ? COLOR.primary : "#B4602E", color: "#fff", border: "none", borderRadius: 7, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            {grantRole === "admin" ? "전사 관리자로 지정" : "관계사 관리자로 지정"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>
                  <strong>운영 유의사항</strong><br />전사 관리자는 전체 AX 플랫폼 카드를 승인·관리합니다. 관계사 관리자는 담당 관계사 범위만 승인·관리합니다. 전사 관리자는 최소 1명 유지되어야 하며, 본인 계정은 스스로 회수할 수 없습니다.
                </div>
              </div>
            </div>
          )}

          {/* ===== 탭 2: 그룹 전체보기 ===== */}
          {activeTab === "그룹 전체보기" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
              <div>
                <div style={{ background: "#F3E8FF", border: "1px solid #E9D5FF", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#6D28D9", lineHeight: 1.7 }}>
                  이 권한을 가진 사용자는 비노출 관계사의 카드도 AX 플랫폼 전 영역에서 조회할 수 있습니다. 관리자 권한과는 별개이며, 일반 사용자에게도 부여할 수 있습니다.
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLOR.text }}>
                    그룹 전체보기 권한자 <span style={{ fontSize: 13, color: COLOR.text3, fontWeight: 500 }}>{groupViewers.length}명</span>
                  </div>
                  <input value={groupSearch} onChange={e => setGroupSearch(e.target.value)} placeholder="이름, 부서 검색" style={{ ...inputStyle, width: 200, fontSize: 12 }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredGroupViewers.map(g => {
                    const isRevoke = groupRevokeConfirm === g.id;
                    return (
                      <div key={g.id} style={{ background: "#fff", border: `1.5px solid ${isRevoke ? "#FECACA" : COLOR.border}`, borderRadius: 10, padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#6D28D9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{g.name[0]}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                              <span style={{ fontSize: 14, fontWeight: 700 }}>{g.name}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, background: "#EDE9FE", color: "#6D28D9", padding: "1px 7px", borderRadius: 20 }}>그룹 전체보기</span>
                              {adminEmails.includes(g.email) && (
                                <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "1px 7px", borderRadius: 20 }}>관리자</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: COLOR.text2 }}>{g.title} · {g.dept}</div>
                            <div style={{ fontSize: 11, color: COLOR.text3, marginTop: 3 }}>부여 사유: {g.reason}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 10, color: COLOR.text3, marginBottom: 8, lineHeight: 1.7 }}>{g.grantedAt} 부여<br />{g.grantedBy}</div>
                            {!isRevoke && (
                              <button onClick={() => setGroupRevokeConfirm(g.id)} style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#EF4444", cursor: "pointer" }}>권한 회수</button>
                            )}
                          </div>
                        </div>
                        {isRevoke && (
                          <div style={{ marginTop: 12, background: "#FEF2F2", borderRadius: 7, padding: "12px 14px" }}>
                            <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, marginBottom: 8 }}>{g.name}의 그룹 전체보기 권한을 회수하시겠습니까?</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setGroupRevokeConfirm(null)} style={{ background: "#fff", border: `1px solid ${COLOR.border}`, borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>취소</button>
                              <button onClick={() => handleGroupRevoke(g.id)} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>회수 확인</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredGroupViewers.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: COLOR.text3, fontSize: 13 }}>등록된 그룹 전체보기 권한자가 없습니다.</div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 4 }}>그룹 전체보기 권한 부여</div>
                  <div style={{ fontSize: 12, color: COLOR.text2, marginBottom: 14, lineHeight: 1.6 }}>사내 SSO 계정을 검색하여 권한을 부여할 수 있습니다. 부여 사유 입력이 필수입니다.</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <input value={groupSsoSearch} onChange={e => { setGroupSsoSearch(e.target.value); setGroupSsoResult(null); setGroupGrantConfirm(null); setGroupGrantReason(""); }} onKeyDown={e => e.key === "Enter" && handleGroupSsoSearch()} placeholder="이름, 이메일, 부서 검색" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={handleGroupSsoSearch} style={{ background: "#0F172A", color: "#fff", border: "none", borderRadius: 7, padding: "0 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>{groupSearching ? "..." : "검색"}</button>
                  </div>

                  {groupSsoResult === "notfound" && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#991B1B" }}>SSO에서 해당 사용자를 찾을 수 없습니다.</div>}
                  {groupSsoResult && groupSsoResult !== "notfound" && (
                    <div style={{ background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#6D28D9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{groupSsoResult.name[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>{groupSsoResult.name}</div>
                          <div style={{ fontSize: 11, color: COLOR.text2 }}>{groupSsoResult.title} · {groupSsoResult.dept}</div>
                        </div>
                      </div>

                      {groupViewerEmails.includes(groupSsoResult.email) ? (
                        <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600, background: "#FEF3C7", padding: "6px 10px", borderRadius: 6 }}>이미 그룹 전체보기 권한이 부여된 사용자입니다.</div>
                      ) : (
                        <>
                          <label style={{ fontSize: 11, fontWeight: 700, color: COLOR.text2, display: "block", marginBottom: 5 }}>부여 사유 <span style={{ color: "#EF4444" }}>*필수</span></label>
                          <textarea value={groupGrantReason} onChange={e => setGroupGrantReason(e.target.value)}
                            placeholder="예: 그룹 IT 거버넌스 총괄 업무 수행을 위해 필요"
                            style={{ ...inputStyle, minHeight: 60, resize: "vertical", lineHeight: 1.5, marginBottom: 10, fontFamily: "inherit" }} />

                          {groupGrantConfirm ? (
                            <div style={{ background: "#F3E8FF", borderRadius: 7, padding: "10px 12px" }}>
                              <div style={{ fontSize: 12, color: "#6D28D9", fontWeight: 600, marginBottom: 8 }}>{groupSsoResult.name}에게 그룹 전체보기 권한을 부여하시겠습니까?</div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => setGroupGrantConfirm(null)} style={{ flex: 1, background: "#fff", border: "1px solid #E9D5FF", borderRadius: 6, padding: "6px 0", fontSize: 11, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>취소</button>
                                <button onClick={() => handleGroupGrant(groupSsoResult)} disabled={!groupGrantReason.trim()} style={{
                                  flex: 1, background: groupGrantReason.trim() ? "#7C3AED" : COLOR.border, border: "none", borderRadius: 6,
                                  padding: "6px 0", fontSize: 11, fontWeight: 700, color: "#fff", cursor: groupGrantReason.trim() ? "pointer" : "not-allowed",
                                }}>부여 확인</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setGroupGrantConfirm(groupSsoResult)} disabled={!groupGrantReason.trim()} style={{
                              width: "100%", background: groupGrantReason.trim() ? "#7C3AED" : COLOR.border, color: "#fff", border: "none", borderRadius: 7,
                              padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: groupGrantReason.trim() ? "pointer" : "not-allowed",
                            }}>그룹 전체보기 권한 부여</button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>
                  <strong>운영 유의사항</strong><br />그룹 전체보기는 조회 전용 권한입니다. 카드 승인·관리 권한은 별도로 관리자 권한을 부여해야 합니다.
                </div>
              </div>
            </div>
          )}

          {/* ===== 탭 3: 등록자 관리 ===== */}
          {activeTab === "등록자 관리" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLOR.text }}>등록 이력자 <span style={{ fontSize: 13, color: COLOR.text3, fontWeight: 500 }}>{getRegistrants().length}명</span></div>
                  <div style={{ fontSize: 11, color: COLOR.text3, marginTop: 3 }}>AX 플랫폼 카드(n8n · Power Automate · 나만의 비서 · AI Model · ML · Vibe Coding · AI 프로젝트) 등록 이력을 통합 집계합니다.</div>
                </div>
                <input value={regSearch} onChange={e => setRegSearch(e.target.value)} placeholder="이름, 부서 검색" style={{ ...inputStyle, width: 220, fontSize: 12 }} />
              </div>
              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 80px 70px 90px 90px", padding: "10px 18px", background: COLOR.bgSubtle, borderBottom: `1px solid ${COLOR.border}` }}>
                  {["이름 / 부서", "이메일", "등록 수", "승인", "대기/반려", "최근 신청"].map((h, i) => <div key={i} style={{ fontSize: 11, fontWeight: 700, color: COLOR.text3 }}>{h}</div>)}
                </div>
                {filteredReg.slice(0, reg.visibleCount).map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 150px 80px 70px 90px 90px", padding: "12px 18px", borderBottom: `1px solid ${COLOR.bgSubtle}`, alignItems: "center", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLOR.text }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: COLOR.text3 }}>{r.title} · {r.dept}</div>
                    </div>
                    <div style={{ fontSize: 11, color: COLOR.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>{r.count}건</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{r.approved}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: r.pending + r.rejected > 0 ? "#D97706" : COLOR.text3 }}>{r.pending + r.rejected}</div>
                    <div style={{ fontSize: 11, color: COLOR.text3 }}>{r.lastSubmit}</div>
                  </div>
                ))}
                {filteredReg.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: COLOR.text3, fontSize: 13 }}>검색 결과가 없습니다.</div>
                )}
              </div>
              <LoadMoreButton remaining={filteredReg.length - reg.visibleCount} onClick={reg.showMore} />
            </div>
          )}

          {/* ===== 탭 4: 활동 로그 ===== */}
          {activeTab === "활동 로그" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="사용자, 대상, 액션 검색" style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
                <div style={{ display: "flex", gap: 6 }}>
                  {LOG_CATEGORIES.map(c => (
                    <button key={c} onClick={() => setLogCategory(c)} style={{
                      padding: "7px 14px", borderRadius: 7,
                      borderWidth: 1.5, borderStyle: "solid",
                      borderColor: logCategory === c ? COLOR.primary : COLOR.border,
                      background: logCategory === c ? COLOR.primaryWeak : "#fff",
                      color: logCategory === c ? COLOR.primary : COLOR.text2,
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 80px 100px 1fr", padding: "10px 18px", background: COLOR.bgSubtle, borderBottom: `1px solid ${COLOR.border}` }}>
                  {["일시", "사용자", "액션", "대상"].map((h, i) => <div key={i} style={{ fontSize: 11, fontWeight: 700, color: COLOR.text3 }}>{h}</div>)}
                </div>
                {filteredLogs.slice(0, logs.visibleCount).map((log, i) => {
                  const catStyle = LOG_CATEGORY_STYLE[log.category] || LOG_CATEGORY_FALLBACK;
                  const srcStyle = log.source ? LOG_SOURCE_STYLE[log.source] : null;
                  return (
                    <div key={log.id} style={{ display: "grid", gridTemplateColumns: "140px 80px 100px 1fr", padding: "11px 18px", borderBottom: `1px solid ${COLOR.bgSubtle}`, alignItems: "center", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <div style={{ fontSize: 11, color: COLOR.text3, fontFamily: "var(--font-mono)" }}>{log.datetime}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLOR.text2 }}>{log.actor}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.text2 }}>{log.action}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: catStyle.bg, color: catStyle.color, flexShrink: 0 }}>{log.category}</span>
                        {srcStyle && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: srcStyle.bg, color: srcStyle.color, flexShrink: 0 }}>{log.source}</span>
                        )}
                        <span style={{ fontSize: 12, color: COLOR.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.target}</span>
                      </div>
                    </div>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: COLOR.text3, fontSize: 13 }}>해당 조건의 로그가 없습니다.</div>
                )}
              </div>
              <LoadMoreButton remaining={filteredLogs.length - logs.visibleCount} onClick={logs.showMore} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
