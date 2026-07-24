import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { useAuth } from "../../context/useAuth";
import { NOTICE_KINDS } from "../../types/noticeTypes";
import type { Notice, NoticeKind } from "../../types/noticeTypes";
import { getAdminNotices, sortNotices } from "../../lib/dataSource";
import { COLOR } from "../../styles/tokens";
import { useVisibleCount } from "../../hooks/useVisibleCount";
import LoadMoreButton from "../../components/LoadMoreButton";

// ============================================================
// ADM-09 공지사항·업데이트 소식 관리 화면 (/admin/notices)
// 전사 관리자(admin) 전용 — companyAdmin 접근 시 안내만 표시.
// DEMO 전용 — 로컬 상태로 작성/수정/삭제·고정·노출 토글 흐름만 재현.
// TODO: 실제 연동 시
//   GET/POST/PUT/DELETE /api/v1/admin/notices 로 교체.
// ============================================================

// ===== 공통 스타일 (모듈 레벨) =====
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", fontSize: 13, color: COLOR.text,
  background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: COLOR.text2, display: "block", marginBottom: 6,
};

// ===== 재사용 서브컴포넌트 (모듈 레벨) =====
const FieldRow = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={labelStyle}>{label}{hint && <span style={{ fontWeight: 500, color: COLOR.text3, marginLeft: 6 }}>{hint}</span>}</label>
    {children}
  </div>
);

const SectionBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "18px 20px", marginBottom: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: COLOR.text, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${COLOR.bgSubtle}` }}>{title}</div>
    {children}
  </div>
);

// 종류 배지 — 공지사항(블루)/업데이트(그린)
const KIND_STYLE: Record<NoticeKind, { color: string; bg: string }> = {
  "공지사항": { color: "#2563EB", bg: "#EFF6FF" },
  "업데이트": { color: "#059669", bg: "#ECFDF5" },
};
const KindBadge = ({ kind }: { kind: NoticeKind }) => (
  <span style={{
    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
    color: KIND_STYLE[kind].color, background: KIND_STYLE[kind].bg,
  }}>{kind}</span>
);

// 세그먼트 선택 — 2~3개 값용(닫힌 드롭다운 대신 세그먼트 버튼). 종류 선택·목록 필터 공용.
const Segmented = <T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) => (
  <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
    {options.map(opt => {
      const on = opt === value;
      return (
        <button key={opt} type="button" onClick={() => onChange(opt)} style={{
          padding: "7px 14px", fontSize: 12, fontWeight: 700, borderRadius: 7, cursor: "pointer",
          border: `1.5px solid ${on ? COLOR.primary : COLOR.border}`,
          background: on ? COLOR.primaryWeak : "#fff", color: on ? COLOR.primary : COLOR.text2,
        }}>{opt}</button>
      );
    })}
  </div>
);

// 목록 필터 값(전체 포함)
const FILTER_OPTIONS = ["전체", ...NOTICE_KINDS] as const;
type FilterKey = typeof FILTER_OPTIONS[number];

// "YYYY.MM.DD" 형식 검증
const DATE_RE = /^\d{4}\.\d{2}\.\d{2}$/;

// 오늘 날짜를 "YYYY.MM.DD"로 — 신규 초안 기본값
const todayStr = (): string => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd}`;
};

// 신규 ID 발급 — NOTICE-{YYYY}-{NNN}. 현재 연도 기준 최대 순번 +1.
// TODO: 실제 연동 시 서버 발급 ID로 교체.
const nextNoticeId = (list: Notice[]): string => {
  const year = new Date().getFullYear();
  const prefix = `NOTICE-${year}-`;
  const maxSeq = list.reduce((mx, n) => {
    if (!n.id.startsWith(prefix)) return mx;
    const seq = parseInt(n.id.slice(prefix.length), 10);
    return Number.isNaN(seq) ? mx : Math.max(mx, seq);
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
};

const emptyDraft = (): Notice => ({
  id: "",
  kind: "공지사항",
  title: "",
  body: "",
  date: todayStr(),
  pinned: false,
  visible: true,
});

export default function AdminNotices() {
  const { isCompanyAdmin } = useAuth();

  const [notices, setNotices] = useState<Notice[]>(getAdminNotices());
  const [selected, setSelected] = useState<string>(getAdminNotices()[0]?.id ?? "");
  const [filter, setFilter] = useState<FilterKey>("전체");
  const [editMode, setEditMode] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<Notice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>("");

  const activeItem = isNew ? draft : notices.find(n => n.id === selected) ?? null;
  const displayData = editMode || isNew ? draft : activeItem;
  const isEditing = editMode || isNew;

  const listItems = sortNotices(filter === "전체" ? notices : notices.filter(n => n.kind === filter));
  // 좌측 목록 성장형 — 종류 필터가 바뀌면 표시 수 초기화.
  const { visibleCount, showMore } = useVisibleCount(12, 12, filter);

  const setF = <K extends keyof Notice>(k: K, v: Notice[K]) =>
    setDraft(p => p ? { ...p, [k]: v } : p);

  const startEdit = () => {
    if (!activeItem) return;
    setDraft({ ...activeItem });
    setEditMode(true);
    setIsNew(false);
    setSaved(false);
    setError("");
  };

  const startNew = () => {
    setDraft(emptyDraft());
    setIsNew(true);
    setEditMode(false);
    setSaved(false);
    setError("");
  };

  const cancelEdit = () => {
    setEditMode(false);
    setIsNew(false);
    setDraft(null);
    setError("");
  };

  // 저장 전 유효성 검증
  const validate = (d: Notice): string => {
    if (!d.title.trim()) return "제목을 입력해주세요.";
    if (!d.body.trim()) return "본문을 입력해주세요.";
    if (!d.date.trim()) return "게시일을 입력해주세요.";
    if (!DATE_RE.test(d.date.trim())) return "게시일은 YYYY.MM.DD 형식으로 입력해주세요.";
    return "";
  };

  const handleSave = () => {
    if (!draft) return;
    const msg = validate(draft);
    if (msg) { setError(msg); return; }

    // TODO: 실제 연동 시
    //   isNew  → POST /api/v1/admin/notices
    //   아니면 → PUT  /api/v1/admin/notices/:id
    if (isNew) {
      const id = nextNoticeId(notices);
      const created: Notice = { ...draft, id, title: draft.title.trim(), body: draft.body.trim(), date: draft.date.trim() };
      setNotices(prev => [...prev, created]);
      setSelected(id);
    } else {
      const updated: Notice = { ...draft, title: draft.title.trim(), body: draft.body.trim(), date: draft.date.trim() };
      setNotices(prev => prev.map(n => n.id === updated.id ? updated : n));
    }
    setEditMode(false);
    setIsNew(false);
    setDraft(null);
    setError("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // 고정/노출 토글 — 비편집 상태에서 즉시 반영. TODO: PUT /api/v1/admin/notices/:id
  const togglePinned = (id: string) => setNotices(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const toggleVisible = (id: string) => setNotices(prev => prev.map(n => n.id === id ? { ...n, visible: !n.visible } : n));

  const handleDelete = (id: string) => {
    // TODO: DELETE /api/v1/admin/notices/:id
    const remaining = notices.filter(n => n.id !== id);
    setNotices(remaining);
    setDeleteConfirm(null);
    setSelected(remaining[0]?.id ?? "");
  };

  // ===== companyAdmin 접근 안내 (전사 관리자 전용 화면) =====
  if (isCompanyAdmin) {
    return (
      <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text }}>
        <AdminNavbar />
        <div style={{ display: "flex" }}>
          <AdminSidebar />
          <main style={{ flex: 1, minWidth: 0, minHeight: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
            <div style={{ maxWidth: 460, textAlign: "center", background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 12, padding: "36px 32px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: COLOR.text, marginBottom: 8 }}>전사 관리자 전용 화면입니다</div>
              <div style={{ fontSize: 13, color: COLOR.text2, lineHeight: 1.7 }}>
                공지사항·업데이트 소식 관리는 전사 관리자만 이용할 수 있습니다.<br />
                게시가 필요한 내용이 있으면 전사 관리자에게 문의해 주세요.
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, display: "flex", minWidth: 0, minHeight: "calc(100vh - 56px)" }}>

          {/* ===== 좌측: 소식 목록 ===== */}
          <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${COLOR.border}`, background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${COLOR.bgSubtle}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>소식 <span style={{ color: COLOR.text3, fontWeight: 500 }}>{notices.length}</span></span>
                <button onClick={startNew} style={{
                  background: COLOR.primary, color: "#fff", border: "none", borderRadius: 6,
                  padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>+ 작성</button>
              </div>
              <Segmented options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {listItems.slice(0, visibleCount).map(n => {
                const isSelected = selected === n.id && !isNew;
                return (
                  <div
                    key={n.id}
                    onClick={() => { setSelected(n.id); setEditMode(false); setIsNew(false); setDraft(null); setError(""); }}
                    style={{
                      padding: "12px 16px", cursor: "pointer",
                      background: isSelected ? COLOR.primaryWeak : "transparent",
                      borderLeft: `3px solid ${isSelected ? COLOR.primary : "transparent"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <KindBadge kind={n.kind} />
                      {n.pinned && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "1px 6px", borderRadius: 10, flexShrink: 0 }}>고정</span>
                      )}
                      {!n.visible && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: COLOR.text3, background: COLOR.bgSubtle, padding: "1px 6px", borderRadius: 10, flexShrink: 0 }}>숨김</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: n.visible ? COLOR.text : COLOR.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 10.5, color: COLOR.text3, fontFamily: "var(--font-mono)" }}>{n.date}</div>
                  </div>
                );
              })}
              {listItems.length === 0 && (
                <div style={{ padding: "30px 16px", textAlign: "center", fontSize: 12, color: COLOR.text3 }}>표시할 소식이 없습니다.</div>
              )}
              <LoadMoreButton remaining={listItems.length - visibleCount} onClick={showMore} />
            </div>
          </div>

          {/* ===== 우측: 상세/편집 패널 ===== */}
          <div style={{ flex: 1, minWidth: 0, padding: "24px 32px", overflowY: "auto" }}>
            {!displayData ? (
              <div style={{ padding: 60, textAlign: "center", color: COLOR.text3, fontSize: 13 }}>좌측에서 소식을 선택하거나 새로 작성하세요.</div>
            ) : (
              <div style={{ maxWidth: 640, margin: "0 auto" }}>

                {saved && (
                  <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "#065F46", marginBottom: 16 }}>
                    저장되었습니다.
                  </div>
                )}

                {/* 헤더 — 미리보기 + 액션 버튼 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <KindBadge kind={displayData.kind} />
                      {displayData.pinned && <span style={{ fontSize: 10, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "2px 8px", borderRadius: 12 }}>고정</span>}
                      {!displayData.visible && <span style={{ fontSize: 10, fontWeight: 700, color: COLOR.text3, background: COLOR.bgSubtle, padding: "2px 8px", borderRadius: 12 }}>숨김</span>}
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {displayData.title || "(제목 없음)"}
                    </h2>
                    <div style={{ fontSize: 11, color: COLOR.text3, fontFamily: "var(--font-mono)", marginTop: 3 }}>{displayData.id || "(신규)"} · {displayData.date}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {!isEditing ? (
                      <>
                        <button onClick={startEdit} style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>수정</button>
                        <button onClick={() => setDeleteConfirm(displayData.id)} style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
                      </>
                    ) : (
                      <>
                        <button onClick={cancelEdit} style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>취소</button>
                        <button onClick={handleSave} style={{ background: COLOR.primary, border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>저장</button>
                      </>
                    )}
                  </div>
                </div>

                {/* 삭제 확인 */}
                {deleteConfirm === displayData.id && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>이 소식을 삭제하시겠습니까?</div>
                    <div style={{ fontSize: 12, color: COLOR.text2, marginBottom: 12, lineHeight: 1.6 }}>
                      삭제하면 랜딩 최신소식과 목록에서 즉시 사라집니다. 일시적으로 감추려면 삭제 대신 노출을 꺼주세요.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>취소</button>
                      <button onClick={() => handleDelete(displayData.id)} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>삭제 확인</button>
                    </div>
                  </div>
                )}

                {/* 편집 오류 */}
                {error && isEditing && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "9px 14px", marginBottom: 16, fontSize: 12, color: "#991B1B" }}>
                    {error}
                  </div>
                )}

                {/* ===== 내용 ===== */}
                <SectionBlock title="내용">
                  <FieldRow label="종류">
                    {isEditing
                      ? <Segmented options={NOTICE_KINDS} value={displayData.kind} onChange={k => setF("kind", k)} />
                      : <KindBadge kind={displayData.kind} />}
                  </FieldRow>

                  <FieldRow label="제목">
                    {isEditing
                      ? <input value={displayData.title} onChange={e => setF("title", e.target.value)} placeholder="예: AX 플랫폼 정기 점검 안내" style={inputStyle} />
                      : <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.text }}>{displayData.title}</div>}
                  </FieldRow>

                  <FieldRow label="본문" hint="목록에서 펼치면 표시되는 상세 내용">
                    {isEditing
                      ? <textarea value={displayData.body} onChange={e => setF("body", e.target.value)} placeholder="소식 상세 내용을 입력하세요." rows={5} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
                      : <div style={{ fontSize: 13, color: COLOR.text2, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{displayData.body}</div>}
                  </FieldRow>

                  <FieldRow label="게시일" hint="YYYY.MM.DD">
                    {isEditing
                      ? <input value={displayData.date} onChange={e => setF("date", e.target.value)} placeholder="2026.07.10" style={{ ...inputStyle, fontFamily: "var(--font-mono)", maxWidth: 200 }} />
                      : <div style={{ fontSize: 13, color: COLOR.text2, fontFamily: "var(--font-mono)" }}>{displayData.date}</div>}
                  </FieldRow>
                </SectionBlock>

                {/* ===== 노출 설정 ===== */}
                <SectionBlock title="노출 설정">
                  {isEditing ? (
                    <>
                      <FieldRow label="상단 고정" hint="최신소식·목록 상단에 우선 노출">
                        <Segmented options={["고정", "일반"] as const} value={displayData.pinned ? "고정" : "일반"} onChange={v => setF("pinned", v === "고정")} />
                      </FieldRow>
                      <FieldRow label="노출 여부" hint="끄면 랜딩·목록에서 숨김(데이터는 유지)">
                        <Segmented options={["노출", "숨김"] as const} value={displayData.visible ? "노출" : "숨김"} onChange={v => setF("visible", v === "노출")} />
                      </FieldRow>
                    </>
                  ) : (
                    <>
                      <ToggleRow
                        title={displayData.pinned ? "상단 고정 (ON)" : "상단 고정 (OFF)"}
                        desc="고정된 소식은 최신소식·목록 상단에 우선 노출됩니다."
                        on={displayData.pinned}
                        onLabel="ON" offLabel="OFF"
                        onToggle={() => togglePinned(displayData.id)}
                      />
                      <div style={{ height: 12 }} />
                      <ToggleRow
                        title={displayData.visible ? "노출 (ON)" : "숨김 (OFF)"}
                        desc="숨긴 소식은 랜딩·목록에서 보이지 않습니다. 기존 데이터는 유지됩니다."
                        on={displayData.visible}
                        onLabel="ON" offLabel="OFF"
                        onToggle={() => toggleVisible(displayData.id)}
                      />
                    </>
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

// 비편집 상태 토글 행 (고정/노출) — 클릭 시 즉시 반영
const ToggleRow = ({ title, desc, on, onLabel, offLabel, onToggle }: {
  title: string; desc: string; on: boolean; onLabel: string; offLabel: string; onToggle: () => void;
}) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLOR.text, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 11, color: COLOR.text3, lineHeight: 1.5 }}>{desc}</div>
    </div>
    <button onClick={onToggle} style={{
      flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "6px 16px", borderRadius: 20, cursor: "pointer",
      border: `1.5px solid ${on ? "#6EE7B7" : COLOR.border}`,
      background: on ? "#D1FAE5" : COLOR.bgSubtle,
      color: on ? "#065F46" : COLOR.text2,
    }}>{on ? onLabel : offLabel}</button>
  </div>
);
