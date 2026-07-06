import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";

type Admin = { id: number; name: string; email: string; dept: string; title: string; grantedAt: string; grantedBy: string };
type GroupViewer = { id: number; name: string; email: string; dept: string; title: string; grantedAt: string; grantedBy: string; reason: string };
type SsoUser = { name: string; email: string; dept: string; title: string };
type LogSource = "n8n" | "PA" | "나만의비서" | "AI Agent" | "ML" | "Vibe";
type LogEntry = { id: number; datetime: string; actor: string; action: string; target: string; category: "등록물" | "권한" | "분류체계" | "조직"; source?: LogSource };
type Registrant = { name: string; email: string; dept: string; title: string; count: number; lastSubmit: string; approved: number; pending: number; rejected: number };

// TODO: 실제 연동 시 GET /api/v1/admin/users?role=admin 응답으로 교체
const INITIAL_ADMINS: Admin[] = [
  { id: 1, name: "김관리", email: "admin.kim@kolmar.co.kr", dept: "IT개발팀", title: "팀장", grantedAt: "2025.01.10", grantedBy: "시스템 초기화" },
  { id: 2, name: "이서현", email: "seohyun.lee@kolmar.co.kr", dept: "IT인프라팀", title: "선임", grantedAt: "2025.03.05", grantedBy: "김관리" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/users?permission=group_viewer 응답으로 교체
const INITIAL_GROUP_VIEWERS: GroupViewer[] = [
  { id: 1, name: "최지훈", email: "jihoon.choi@kolmar.co.kr", dept: "그룹IT전략팀", title: "팀장", grantedAt: "2025.02.14", grantedBy: "김관리", reason: "그룹 IT 거버넌스 총괄" },
  { id: 2, name: "한서윤", email: "seoyoon.han@kolmar.co.kr", dept: "콜마홀딩스 경영기획팀", title: "차장", grantedAt: "2025.04.02", grantedBy: "김관리", reason: "지주사 관계사 현황 보고용" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/registrants 응답으로 교체
const REGISTRANTS: Registrant[] = [
  { name: "이수연", email: "suyeon.lee@kolmar.co.kr", dept: "메이크업연구소", title: "책임연구원", count: 3, lastSubmit: "2025.06.01", approved: 2, pending: 1, rejected: 0 },
  { name: "정태영", email: "taeyoung.jung@kolmar.co.kr", dept: "IT개발팀", title: "선임", count: 3, lastSubmit: "2025.06.10", approved: 2, pending: 1, rejected: 0 },
  { name: "박성훈", email: "sunghoon.park@kolmar.co.kr", dept: "구매팀", title: "대리", count: 1, lastSubmit: "2025.06.02", approved: 1, pending: 0, rejected: 0 },
  { name: "이민호", email: "minho.lee@kolmar.co.kr", dept: "품질관리팀", title: "선임", count: 1, lastSubmit: "2025.05.09", approved: 0, pending: 0, rejected: 1 },
];

// TODO: 실제 연동 시 GET /api/v1/admin/logs 응답으로 교체
const LOGS: LogEntry[] = [
  { id: 8, datetime: "2025.06.06 09:05", actor: "김관리", action: "승인", target: "원료 추천 에이전트 (AGENT-2025-007)", category: "등록물", source: "AI Agent" },
  { id: 7, datetime: "2025.06.05 14:20", actor: "이서현", action: "반려", target: "계약서 요약 비서 (HKGPT-2025-018)", category: "등록물", source: "나만의비서" },
  { id: 6, datetime: "2025.06.05 10:12", actor: "김관리", action: "승인", target: "재고 알림 자동화 워크플로우 (N8N-2025-031)", category: "등록물", source: "n8n" },
  { id: 2, datetime: "2025.06.03 16:44", actor: "김관리", action: "권한 부여", target: "박준서 → 관리자", category: "권한" },
  { id: 3, datetime: "2025.05.28 13:45", actor: "김관리", action: "분류 수정", target: "n8n 노드 힌트 — Schedule Trigger 추가", category: "분류체계" },
  { id: 4, datetime: "2025.05.20 09:30", actor: "김관리", action: "부서 추가", target: "데이터분석팀 (IT본부)", category: "조직" },
  { id: 5, datetime: "2025.04.02 11:15", actor: "김관리", action: "그룹 전체보기 부여", target: "한서윤 → 그룹 전체보기", category: "권한" },
];

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
  "AI Agent": { bg: "#EDE9FE", color: "#5B21B6" },
  "ML": { bg: "#ECFEFF", color: "#155E75" },
  "Vibe": { bg: "#FAF5FF", color: "#7E22CE" },
};

const TABS = ["관리자 권한", "그룹 전체보기", "등록자 관리", "활동 로그"] as const;
const LOG_CATEGORIES = ["전체", "등록물", "권한", "분류체계", "조직"] as const;

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 7, outline: "none", fontFamily: "inherit",
};

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("관리자 권한");
  const [admins, setAdmins] = useState<Admin[]>(INITIAL_ADMINS);
  const [groupViewers, setGroupViewers] = useState<GroupViewer[]>(INITIAL_GROUP_VIEWERS);
  const [savedMsg, setSavedMsg] = useState("");
  const [revokeConfirm, setRevokeConfirm] = useState<number | null>(null);
  const [grantConfirm, setGrantConfirm] = useState<SsoUser | null>(null);
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
  const groupViewerEmails = groupViewers.map(g => g.email);

  const MOCK_SSO_USERS: SsoUser[] = [
    { name: "이수연", email: "suyeon.lee@kolmar.co.kr", dept: "메이크업연구소", title: "책임연구원" },
    { name: "정태영", email: "taeyoung.jung@kolmar.co.kr", dept: "IT개발팀", title: "선임" },
    { name: "오세훈", email: "sehoon.oh@kolmar.co.kr", dept: "마케팅팀", title: "사원" },
    { name: "장미경", email: "mikyung.jang@kolmar.co.kr", dept: "콜마글로벌 경영지원팀", title: "부장" },
  ];

  const handleSsoSearch = () => {
    if (!ssoSearch.trim()) return;
    setSearching(true);
    // TODO: 실제 연동 시 GET /api/v1/admin/sso-search?q=:ssoSearch
    setTimeout(() => {
      const q = ssoSearch.toLowerCase();
      const found = MOCK_SSO_USERS.find(u => u.name.includes(ssoSearch) || u.email.toLowerCase().includes(q) || u.dept.includes(ssoSearch));
      setSsoResult(found || "notfound");
      setSearching(false);
    }, 800);
  };

  const handleGroupSsoSearch = () => {
    if (!groupSsoSearch.trim()) return;
    setGroupSearching(true);
    setTimeout(() => {
      const q = groupSsoSearch.toLowerCase();
      const found = MOCK_SSO_USERS.find(u => u.name.includes(groupSsoSearch) || u.email.toLowerCase().includes(q) || u.dept.includes(groupSsoSearch));
      setGroupSsoResult(found || "notfound");
      setGroupSearching(false);
    }, 800);
  };

  const handleGrant = (user: SsoUser) => {
    // TODO: 실제 연동 시 POST /api/v1/admin/users/grant-admin
    setAdmins(p => [...p, { id: Date.now(), name: user.name, email: user.email, dept: user.dept, title: user.title, grantedAt: "2025.06.30", grantedBy: "김관리" }]);
    setGrantConfirm(null); setSsoSearch(""); setSsoResult(null);
    showSaved(`${user.name}에게 관리자 권한이 부여되었습니다.`);
  };

  const handleRevoke = (id: number) => {
    // TODO: 실제 연동 시 POST /api/v1/admin/users/:id/revoke-admin
    setAdmins(p => p.filter(a => a.id !== id));
    setRevokeConfirm(null);
    showSaved("관리자 권한이 회수되었습니다.");
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
  const filteredGroupViewers = groupViewers.filter(g => groupSearch === "" || g.name.includes(groupSearch) || g.dept.includes(groupSearch));
  const filteredReg = REGISTRANTS.filter(r => regSearch === "" || r.name.includes(regSearch) || r.dept.includes(regSearch));
  const filteredLogs = LOGS.filter(l => (logCategory === "전체" || l.category === logCategory) && (logSearch === "" || l.actor.includes(logSearch) || l.target.includes(logSearch) || l.action.includes(logSearch)));

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>사용자 / 권한 / 로그 관리</h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>사용자 계정은 SSO로 자동 관리됩니다. 관리자 권한 부여 및 그룹 전체보기 권한을 이 화면에서 관리합니다.</p>
          </div>

          {savedMsg && <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#065F46" }}>{savedMsg}</div>}

          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563EB", flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: "#1E40AF", lineHeight: 1.6 }}>
              <strong>Microsoft SSO 연동 중</strong> — 신규 임직원은 첫 로그인 시 자동 등록, 퇴직자는 SSO 계정 비활성화와 동시에 자동 차단됩니다.
            </div>
          </div>

          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: "10px 24px",
                borderTop: "none", borderBottom: "none", borderLeft: "none",
                borderRight: i < TABS.length - 1 ? "1px solid #E2E8F0" : "none",
                background: activeTab === t ? "#0F172A" : "transparent",
                color: activeTab === t ? "#fff" : "#64748B",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>{t}</button>
            ))}
          </div>

          {/* ===== 탭 1: 관리자 권한 ===== */}
          {activeTab === "관리자 권한" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>현재 관리자 <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>{admins.length}명</span></div>
                  <input value={adminSearch} onChange={e => setAdminSearch(e.target.value)} placeholder="이름, 부서 검색" style={{ ...inputStyle, width: 200, fontSize: 12 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredAdmins.map(admin => {
                    const isRevoke = revokeConfirm === admin.id;
                    const isSelf = admin.id === 1;
                    return (
                      <div key={admin.id} style={{ background: "#fff", border: `1.5px solid ${isRevoke ? "#FECACA" : "#E2E8F0"}`, borderRadius: 10, padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{admin.name[0]}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 14, fontWeight: 700 }}>{admin.name}</span>
                              {isSelf && <span style={{ fontSize: 10, fontWeight: 700, background: "#E2E8F0", color: "#475569", padding: "1px 7px", borderRadius: 20 }}>본인</span>}
                              <span style={{ fontSize: 10, fontWeight: 700, background: "#0F172A", color: "#fff", padding: "1px 7px", borderRadius: 20 }}>관리자</span>
                              {groupViewerEmails.includes(admin.email) && (
                                <span style={{ fontSize: 10, fontWeight: 700, background: "#EDE9FE", color: "#6D28D9", padding: "1px 7px", borderRadius: 20 }}>그룹 전체보기</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>{admin.title} · {admin.dept}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 8, lineHeight: 1.7 }}>{admin.grantedAt} 부여<br />{admin.grantedBy}</div>
                            {!isSelf && !isRevoke && <button onClick={() => setRevokeConfirm(admin.id)} style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#EF4444", cursor: "pointer" }}>권한 회수</button>}
                            {isSelf && <span style={{ fontSize: 11, color: "#CBD5E1" }}>회수 불가</span>}
                          </div>
                        </div>
                        {isRevoke && (
                          <div style={{ marginTop: 12, background: "#FEF2F2", borderRadius: 7, padding: "12px 14px" }}>
                            <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, marginBottom: 8 }}>{admin.name}의 관리자 권한을 회수하시겠습니까?</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setRevokeConfirm(null)} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                              <button onClick={() => handleRevoke(admin.id)} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>회수 확인</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>관리자 권한 부여</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 1.6 }}>사내 SSO 계정을 검색하여 관리자로 등록합니다. 관리자는 모든 AX 플랫폼 항목을 승인·관리할 수 있습니다.</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <input value={ssoSearch} onChange={e => { setSsoSearch(e.target.value); setSsoResult(null); setGrantConfirm(null); }} onKeyDown={e => e.key === "Enter" && handleSsoSearch()} placeholder="이름, 이메일, 부서 검색" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={handleSsoSearch} style={{ background: "#0F172A", color: "#fff", border: "none", borderRadius: 7, padding: "0 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>{searching ? "..." : "검색"}</button>
                  </div>

                  {ssoResult === "notfound" && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#991B1B" }}>SSO에서 해당 사용자를 찾을 수 없습니다.</div>}
                  {ssoResult && ssoResult !== "notfound" && (
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: adminEmails.includes(ssoResult.email) ? 0 : 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{ssoResult.name[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{ssoResult.name}</div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>{ssoResult.title} · {ssoResult.dept}</div>
                        </div>
                      </div>

                      {adminEmails.includes(ssoResult.email) ? (
                        <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600, marginTop: 8, background: "#FEF3C7", padding: "6px 10px", borderRadius: 6 }}>이미 관리자로 지정된 사용자입니다.</div>
                      ) : grantConfirm ? (
                        <div style={{ background: "#EFF6FF", borderRadius: 7, padding: "10px 12px" }}>
                          <div style={{ fontSize: 12, color: "#1E40AF", fontWeight: 600, marginBottom: 8 }}>{ssoResult.name}에게 관리자 권한을 부여하시겠습니까?</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setGrantConfirm(null)} style={{ flex: 1, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 0", fontSize: 11, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                            <button onClick={() => handleGrant(ssoResult)} style={{ flex: 1, background: "#2563EB", border: "none", borderRadius: 6, padding: "6px 0", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer" }}>부여 확인</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setGrantConfirm(ssoResult)} style={{ width: "100%", background: "#2563EB", color: "#fff", border: "none", borderRadius: 7, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>관리자로 지정</button>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>
                  <strong>운영 유의사항</strong><br />본인 계정의 권한은 스스로 회수할 수 없습니다. 관리자는 전체 AX 플랫폼 항목에 대한 승인·관리 권한을 가집니다.
                </div>
              </div>
            </div>
          )}

          {/* ===== 탭 2: 그룹 전체보기 ===== */}
          {activeTab === "그룹 전체보기" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
              <div>
                <div style={{ background: "#F3E8FF", border: "1px solid #E9D5FF", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#6D28D9", lineHeight: 1.7 }}>
                  이 권한을 가진 사용자는 비노출 관계사의 항목도 AX 플랫폼 전 영역에서 조회할 수 있습니다. 관리자 권한과는 별개이며, 일반 사용자에게도 부여할 수 있습니다.
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                    그룹 전체보기 권한자 <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>{groupViewers.length}명</span>
                  </div>
                  <input value={groupSearch} onChange={e => setGroupSearch(e.target.value)} placeholder="이름, 부서 검색" style={{ ...inputStyle, width: 200, fontSize: 12 }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredGroupViewers.map(g => {
                    const isRevoke = groupRevokeConfirm === g.id;
                    return (
                      <div key={g.id} style={{ background: "#fff", border: `1.5px solid ${isRevoke ? "#FECACA" : "#E2E8F0"}`, borderRadius: 10, padding: "16px 20px" }}>
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
                            <div style={{ fontSize: 12, color: "#64748B" }}>{g.title} · {g.dept}</div>
                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>부여 사유: {g.reason}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 8, lineHeight: 1.7 }}>{g.grantedAt} 부여<br />{g.grantedBy}</div>
                            {!isRevoke && (
                              <button onClick={() => setGroupRevokeConfirm(g.id)} style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#EF4444", cursor: "pointer" }}>권한 회수</button>
                            )}
                          </div>
                        </div>
                        {isRevoke && (
                          <div style={{ marginTop: 12, background: "#FEF2F2", borderRadius: 7, padding: "12px 14px" }}>
                            <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, marginBottom: 8 }}>{g.name}의 그룹 전체보기 권한을 회수하시겠습니까?</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setGroupRevokeConfirm(null)} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                              <button onClick={() => handleGroupRevoke(g.id)} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>회수 확인</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredGroupViewers.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>등록된 그룹 전체보기 권한자가 없습니다.</div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>그룹 전체보기 권한 부여</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 1.6 }}>사내 SSO 계정을 검색하여 권한을 부여할 수 있습니다. 부여 사유 입력이 필수입니다.</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <input value={groupSsoSearch} onChange={e => { setGroupSsoSearch(e.target.value); setGroupSsoResult(null); setGroupGrantConfirm(null); setGroupGrantReason(""); }} onKeyDown={e => e.key === "Enter" && handleGroupSsoSearch()} placeholder="이름, 이메일, 부서 검색" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={handleGroupSsoSearch} style={{ background: "#0F172A", color: "#fff", border: "none", borderRadius: 7, padding: "0 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>{groupSearching ? "..." : "검색"}</button>
                  </div>

                  {groupSsoResult === "notfound" && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#991B1B" }}>SSO에서 해당 사용자를 찾을 수 없습니다.</div>}
                  {groupSsoResult && groupSsoResult !== "notfound" && (
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#6D28D9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{groupSsoResult.name[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{groupSsoResult.name}</div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>{groupSsoResult.title} · {groupSsoResult.dept}</div>
                        </div>
                      </div>

                      {groupViewerEmails.includes(groupSsoResult.email) ? (
                        <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600, background: "#FEF3C7", padding: "6px 10px", borderRadius: 6 }}>이미 그룹 전체보기 권한이 부여된 사용자입니다.</div>
                      ) : (
                        <>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>부여 사유 <span style={{ color: "#EF4444" }}>*필수</span></label>
                          <textarea value={groupGrantReason} onChange={e => setGroupGrantReason(e.target.value)}
                            placeholder="예: 그룹 IT 거버넌스 총괄 업무 수행을 위해 필요"
                            style={{ ...inputStyle, minHeight: 60, resize: "vertical", lineHeight: 1.5, marginBottom: 10, fontFamily: "inherit" }} />

                          {groupGrantConfirm ? (
                            <div style={{ background: "#F3E8FF", borderRadius: 7, padding: "10px 12px" }}>
                              <div style={{ fontSize: 12, color: "#6D28D9", fontWeight: 600, marginBottom: 8 }}>{groupSsoResult.name}에게 그룹 전체보기 권한을 부여하시겠습니까?</div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => setGroupGrantConfirm(null)} style={{ flex: 1, background: "#fff", border: "1px solid #E9D5FF", borderRadius: 6, padding: "6px 0", fontSize: 11, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                                <button onClick={() => handleGroupGrant(groupSsoResult)} disabled={!groupGrantReason.trim()} style={{
                                  flex: 1, background: groupGrantReason.trim() ? "#7C3AED" : "#D1D5DB", border: "none", borderRadius: 6,
                                  padding: "6px 0", fontSize: 11, fontWeight: 700, color: "#fff", cursor: groupGrantReason.trim() ? "pointer" : "not-allowed",
                                }}>부여 확인</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setGroupGrantConfirm(groupSsoResult)} disabled={!groupGrantReason.trim()} style={{
                              width: "100%", background: groupGrantReason.trim() ? "#7C3AED" : "#D1D5DB", color: "#fff", border: "none", borderRadius: 7,
                              padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: groupGrantReason.trim() ? "pointer" : "not-allowed",
                            }}>그룹 전체보기 권한 부여</button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>
                  <strong>운영 유의사항</strong><br />그룹 전체보기는 조회 전용 권한입니다. 항목 승인·관리 권한은 별도로 관리자 권한을 부여해야 합니다.
                </div>
              </div>
            </div>
          )}

          {/* ===== 탭 3: 등록자 관리 ===== */}
          {activeTab === "등록자 관리" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>등록 이력자 <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>{REGISTRANTS.length}명</span></div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>AX 플랫폼 항목(n8n · PA · 나만의비서 · AI Agent · ML · Vibe) 등록 이력을 통합 집계합니다.</div>
                </div>
                <input value={regSearch} onChange={e => setRegSearch(e.target.value)} placeholder="이름, 부서 검색" style={{ ...inputStyle, width: 220, fontSize: 12 }} />
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 80px 70px 90px 90px", padding: "10px 18px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["이름 / 부서", "이메일", "등록 수", "승인", "대기/반려", "최근 신청"].map((h, i) => <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>{h}</div>)}
                </div>
                {filteredReg.map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 150px 80px 70px 90px 90px", padding: "12px 18px", borderBottom: "1px solid #F8FAFC", alignItems: "center", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>{r.title} · {r.dept}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{r.count}건</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{r.approved}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: r.pending + r.rejected > 0 ? "#D97706" : "#94A3B8" }}>{r.pending + r.rejected}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{r.lastSubmit}</div>
                  </div>
                ))}
                {filteredReg.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>검색 결과가 없습니다.</div>
                )}
              </div>
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
                      borderColor: logCategory === c ? "#2563EB" : "#E2E8F0",
                      background: logCategory === c ? "#EFF6FF" : "#fff",
                      color: logCategory === c ? "#2563EB" : "#475569",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 80px 100px 1fr", padding: "10px 18px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["일시", "사용자", "액션", "대상"].map((h, i) => <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>{h}</div>)}
                </div>
                {filteredLogs.map((log, i) => {
                  const catStyle = LOG_CATEGORY_STYLE[log.category] || LOG_CATEGORY_FALLBACK;
                  const srcStyle = log.source ? LOG_SOURCE_STYLE[log.source] : null;
                  return (
                    <div key={log.id} style={{ display: "grid", gridTemplateColumns: "140px 80px 100px 1fr", padding: "11px 18px", borderBottom: "1px solid #F8FAFC", alignItems: "center", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>{log.datetime}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{log.actor}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>{log.action}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: catStyle.bg, color: catStyle.color, flexShrink: 0 }}>{log.category}</span>
                        {srcStyle && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: srcStyle.bg, color: srcStyle.color, flexShrink: 0 }}>{log.source}</span>
                        )}
                        <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.target}</span>
                      </div>
                    </div>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>해당 조건의 로그가 없습니다.</div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
