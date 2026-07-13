import { useState, useRef, useEffect } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { PLATFORMS, ICON_PRESETS } from "../../types/platformTypes";
import type { Platform, PlatformId, IconKey } from "../../types/platformTypes";

// ============================================================
// AD-09 자동화·AI 도구(플랫폼) 관리 화면
// DEMO 전용 — 로컬 상태로 편집 흐름만 재현.
// TODO: 실제 연동 시 GET/POST/PUT/PATCH /api/v1/admin/platforms 로 교체.
// ============================================================

// 관리 화면 내부에서만 쓰는 확장 타입 — active(노출 여부) 플래그 추가.
// TODO: 백엔드 Platform 스키마에 active(또는 visible) 필드 반영 필요.
type ManagedPlatform = Platform & { active: boolean };

// 아이콘 선택지 — ICON_PRESETS 레지스트리 전체를 참조 (프리셋 추가 시 자동 반영)
const ICON_OPTION_KEYS: IconKey[] = Object.keys(ICON_PRESETS);
const iconLabelOf = (icon: IconKey) => ICON_PRESETS[icon]?.label ?? icon;

// 색상 프리셋 — 출처 색상/배경 쌍. 자유 입력도 허용하되 대표 조합을 빠르게 고를 수 있게 제공.
const COLOR_PRESETS: { label: string; color: string; bg: string }[] = [
  { label: "오렌지", color: "#EA580C", bg: "#FFF7ED" },
  { label: "블루", color: "#2563EB", bg: "#EFF6FF" },
  { label: "퍼플", color: "#7C3AED", bg: "#F5F3FF" },
  { label: "그린", color: "#059669", bg: "#ECFDF5" },
  { label: "핑크", color: "#DB2777", bg: "#FDF2F8" },
  { label: "슬레이트", color: "#475569", bg: "#F1F5F9" },
  { label: "스카이", color: "#0891B2", bg: "#ECFEFF" },
  { label: "바이올렛", color: "#9333EA", bg: "#FAF5FF" },
];

// 초기 목업 — PLATFORMS를 관리 화면용으로 로드. 전부 active=true로 시작.
// TODO: 실제 연동 시 GET /api/v1/admin/platforms 응답으로 교체.
const INITIAL_PLATFORMS: ManagedPlatform[] = PLATFORMS.map(p => ({ ...p, active: true }));

const emptyDraft = (): ManagedPlatform => ({
  id: "" as PlatformId,
  name: "",
  shortDesc: "",
  path: "",
  accessUrl: null,
  color: COLOR_PRESETS[0].color,
  bg: COLOR_PRESETS[0].bg,
  icon: "automation",
  active: true,
});

// ===== 공통 스타일 (모듈 레벨) =====
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", fontSize: 13, color: "#0F172A",
  background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6,
};

// ===== 재사용 서브컴포넌트 (모듈 레벨) =====
const FieldRow = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={labelStyle}>{label}{hint && <span style={{ fontWeight: 500, color: "#94A3B8", marginLeft: 6 }}>{hint}</span>}</label>
    {children}
  </div>
);

const SectionBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 20px", marginBottom: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #F1F5F9" }}>{title}</div>
    {children}
  </div>
);

// 아이콘 키 → 프리셋 조회 (미등록 키는 기본 아이콘으로 폴백 — 서버 비정상 값 방어)
const iconPreset = (icon: IconKey) => {
  const preset = ICON_PRESETS[icon];
  if (preset) return preset;
  console.warn(`[AdminPlatforms] 알 수 없는 아이콘 키 "${icon}" — 기본 아이콘으로 대체합니다.`);
  return ICON_PRESETS.automation;
};

// 플랫폼 아이콘 미리보기 (색상 배경 위에 SVG path) — ICON_PRESETS 레지스트리 참조
const PlatformIcon = ({ icon, color, bg, size = 40 }: { icon: IconKey; color: string; bg: string; size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: 10, background: bg, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={iconPreset(icon).path} />
    </svg>
  </div>
);

// 아이콘 선택 — 닫힌 트리거(inputStyle+cursor) + 그리드 프리셋 패널 (AdminScopeSelect와 동일 패턴)
const iconTriggerStyle: React.CSSProperties = {
  ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, maxWidth: 360,
};
const IconPicker = ({ value, color, bg, onChange }: { value: IconKey; color: string; bg: string; onChange: (k: IconKey) => void }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={rootRef} style={{ position: "relative", maxWidth: 360 }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={iconTriggerStyle}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PlatformIcon icon={value} color={color} bg={bg} size={28} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{iconLabelOf(value)}</span>
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 40, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: 10, maxHeight: 360, overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {ICON_OPTION_KEYS.map(k => {
              const on = k === value;
              return (
                <button key={k} type="button" onClick={() => { onChange(k); setOpen(false); }} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 6px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px solid ${on ? "#2563EB" : "#E2E8F0"}`, background: on ? "#EFF6FF" : "#fff",
                }}>
                  <PlatformIcon icon={k} color={color} bg={bg} size={30} />
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: on ? "#2563EB" : "#475569", textAlign: "center", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{ICON_PRESETS[k].label}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 8, paddingTop: 8, borderTop: "1px solid #F1F5F9" }}>
            프리셋 외 아이콘은 개발 반영이 필요합니다.
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminPlatforms() {
  const [platforms, setPlatforms] = useState<ManagedPlatform[]>(INITIAL_PLATFORMS);
  const [selected, setSelected] = useState<string>(INITIAL_PLATFORMS[0]?.id ?? "");
  const [editMode, setEditMode] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<ManagedPlatform | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>("");

  const activeItem = isNew ? draft : platforms.find(p => p.id === selected) ?? null;
  const displayData = editMode || isNew ? draft : activeItem;
  const isEditing = editMode || isNew;

  const setF = <K extends keyof ManagedPlatform>(k: K, v: ManagedPlatform[K]) =>
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
  const validate = (d: ManagedPlatform): string => {
    if (!d.name.trim()) return "표시명을 입력해주세요.";
    if (!d.shortDesc.trim()) return "짧은 설명을 입력해주세요.";
    if (!d.path.trim()) return "라우트 경로를 입력해주세요.";
    if (!d.path.startsWith("/")) return "라우트 경로는 '/'로 시작해야 합니다.";
    if (isNew) {
      if (!d.id.trim()) return "식별자(ID)를 입력해주세요.";
      if (!/^[a-z0-9-]+$/.test(d.id)) return "식별자는 소문자·숫자·하이픈만 사용할 수 있습니다.";
      if (platforms.some(p => p.id === d.id)) return "이미 존재하는 식별자입니다. 다른 값을 사용해주세요.";
      if (platforms.some(p => p.path === d.path)) return "이미 사용 중인 라우트 경로입니다.";
    } else {
      if (platforms.some(p => p.path === d.path && p.id !== d.id)) return "이미 사용 중인 라우트 경로입니다.";
    }
    return "";
  };

  const handleSave = () => {
    if (!draft) return;
    const msg = validate(draft);
    if (msg) { setError(msg); return; }

    // TODO: 실제 연동 시
    //   isNew  → POST /api/v1/admin/platforms
    //   아니면 → PUT  /api/v1/admin/platforms/:id
    if (isNew) {
      setPlatforms(prev => [...prev, draft]);
      setSelected(draft.id);
    } else {
      setPlatforms(prev => prev.map(p => p.id === draft.id ? draft : p));
    }
    setEditMode(false);
    setIsNew(false);
    setDraft(null);
    setError("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // 비활성화/활성화 토글
  const toggleActive = (id: string) => {
    setPlatforms(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleDelete = (id: string) => {
    setPlatforms(prev => prev.filter(p => p.id !== id));
    setDeleteConfirm(null);
    const remaining = platforms.filter(p => p.id !== id);
    if (remaining.length > 0) setSelected(remaining[0].id);
    else setSelected("");
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, display: "flex", minWidth: 0, minHeight: "calc(100vh - 56px)" }}>

          {/* ===== 좌측: 플랫폼 목록 ===== */}
          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>AX 플랫폼 <span style={{ color: "#94A3B8", fontWeight: 500 }}>{platforms.length}</span></span>
                <button onClick={startNew} style={{
                  background: "#2563EB", color: "#fff", border: "none", borderRadius: 6,
                  padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>+ 추가</button>
              </div>
              <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5, marginTop: 6 }}>
                등록물의 출처가 되는 도구 종류를 관리합니다.
              </p>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {platforms.map(p => {
                const isSelected = selected === p.id && !isNew;
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelected(p.id); setEditMode(false); setIsNew(false); setDraft(null); setError(""); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer",
                      background: isSelected ? "#EFF6FF" : "transparent",
                      borderLeft: `3px solid ${isSelected ? "#2563EB" : "transparent"}`,
                    }}
                  >
                    <PlatformIcon icon={p.icon} color={p.color} bg={p.bg} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        {!p.active && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", background: "#F1F5F9", padding: "1px 6px", borderRadius: 10, flexShrink: 0 }}>비활성</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>{p.id}</div>
                    </div>
                  </div>
                );
              })}
              {platforms.length === 0 && (
                <div style={{ padding: "30px 16px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>등록된 도구가 없습니다.</div>
              )}
            </div>
          </div>

          {/* ===== 우측: 상세/편집 패널 ===== */}
          <div style={{ flex: 1, minWidth: 0, padding: "24px 32px", overflowY: "auto" }}>
            {!displayData ? (
              <div style={{ padding: 60, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>좌측에서 도구를 선택하세요.</div>
            ) : (
              <div style={{ maxWidth: 640, margin: "0 auto" }}>

                {saved && (
                  <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "#065F46", marginBottom: 16 }}>
                    저장되었습니다.
                  </div>
                )}

                {/* 헤더 — 미리보기 + 액션 버튼 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                    <PlatformIcon icon={displayData.icon} color={displayData.color} bg={displayData.bg} size={48} />
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {displayData.name || "(이름 없음)"}
                      </h2>
                      <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "var(--font-mono)", marginTop: 2 }}>{displayData.id || "(신규)"}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {!isEditing ? (
                      <>
                        <button onClick={() => toggleActive(displayData.id)} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                          {displayData.active ? "비활성화" : "활성화"}
                        </button>
                        <button onClick={startEdit} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>수정</button>
                        <button onClick={() => setDeleteConfirm(displayData.id)} style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
                      </>
                    ) : (
                      <>
                        <button onClick={cancelEdit} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>취소</button>
                        <button onClick={handleSave} style={{ background: "#2563EB", border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>저장</button>
                      </>
                    )}
                  </div>
                </div>

                {/* 삭제 확인 */}
                {deleteConfirm === displayData.id && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>이 도구를 삭제하시겠습니까?</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, lineHeight: 1.6 }}>
                      이미 이 도구로 등록된 항목이 있으면 출처 표시가 깨질 수 있습니다. 삭제 대신 비활성화를 권장합니다.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                      <button onClick={() => handleDelete(displayData.id)} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>삭제 확인</button>
                    </div>
                  </div>
                )}

                {/* 신규 추가 시 경고 */}
                {isNew && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                    새 도구의 식별자(ID)를 추가하면 라우팅과 타입 정의에 반영이 별도로 필요합니다. 백엔드 연동 전까지는 기존 화면의 출처 목록·경로에 자동 반영되지 않습니다.
                  </div>
                )}

                {/* 편집 오류 */}
                {error && isEditing && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "9px 14px", marginBottom: 16, fontSize: 12, color: "#991B1B" }}>
                    {error}
                  </div>
                )}

                {/* ===== 기본 정보 ===== */}
                <SectionBlock title="기본 정보">
                  <FieldRow label="식별자 (ID)" hint={isNew ? "소문자·숫자·하이픈, 저장 후 변경 불가" : "변경 불가"}>
                    {isNew ? (
                      <input value={displayData.id} onChange={e => setF("id", e.target.value as PlatformId)} placeholder="예: my-tool" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
                    ) : (
                      <div style={{ ...inputStyle, background: "#F8FAFC", color: "#64748B", fontFamily: "var(--font-mono)" }}>{displayData.id}</div>
                    )}
                  </FieldRow>

                  <FieldRow label="표시명">
                    {isEditing
                      ? <input value={displayData.name} onChange={e => setF("name", e.target.value)} placeholder="예: n8n" style={inputStyle} />
                      : <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{displayData.name}</div>}
                  </FieldRow>

                  <FieldRow label="짧은 설명" hint="목록·카드에 표시되는 한 줄 소개">
                    {isEditing
                      ? <input value={displayData.shortDesc} onChange={e => setF("shortDesc", e.target.value)} placeholder="예: 업무 자동화 워크플로우 플랫폼" style={inputStyle} />
                      : <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{displayData.shortDesc}</div>}
                  </FieldRow>
                </SectionBlock>

                {/* ===== 경로·연결 ===== */}
                <SectionBlock title="경로 · 연결">
                  <FieldRow label="라우트 경로" hint="'/'로 시작. 항목 상세 페이지 경로의 접두사로 사용">
                    {isEditing
                      ? <input value={displayData.path} onChange={e => setF("path", e.target.value)} placeholder="예: /n8n" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
                      : <div style={{ fontSize: 13, color: "#334155", fontFamily: "var(--font-mono)" }}>{displayData.path}</div>}
                  </FieldRow>

                  <FieldRow label="접속 URL" hint="외부 도구로 이동하는 실제 주소 (없으면 비워두세요)">
                    {isEditing
                      ? <input
                          value={displayData.accessUrl ?? ""}
                          onChange={e => setF("accessUrl", e.target.value === "" ? null : e.target.value)}
                          placeholder="예: https://n8n.kolmar.co.kr (없으면 빈칸)"
                          style={inputStyle}
                        />
                      : displayData.accessUrl
                          ? <a href={displayData.accessUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>{displayData.accessUrl}</a>
                          : <span style={{ fontSize: 13, color: "#94A3B8" }}>미정 (준비 중)</span>}
                  </FieldRow>
                </SectionBlock>

                {/* ===== 표시 스타일 ===== */}
                <SectionBlock title="표시 스타일">
                  <FieldRow label="아이콘">
                    {isEditing ? (
                      <IconPicker value={displayData.icon} color={displayData.color} bg={displayData.bg} onChange={k => setF("icon", k)} />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <PlatformIcon icon={displayData.icon} color={displayData.color} bg={displayData.bg} size={28} />
                        <span style={{ fontSize: 13, color: "#334155" }}>{iconLabelOf(displayData.icon)}</span>
                      </div>
                    )}
                  </FieldRow>

                  <FieldRow label="출처 색상" hint="목록·배지·통계 차트에 쓰이는 대표 색">
                    {isEditing ? (
                      <>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                          {COLOR_PRESETS.map(preset => {
                            const isSel = displayData.color === preset.color && displayData.bg === preset.bg;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => { setF("color", preset.color); setF("bg", preset.bg); }}
                                title={preset.label}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6,
                                  padding: "5px 10px", borderRadius: 20, cursor: "pointer",
                                  border: `1.5px solid ${isSel ? preset.color : "#E2E8F0"}`,
                                  background: isSel ? preset.bg : "#fff",
                                }}
                              >
                                <span style={{ width: 12, height: 12, borderRadius: "50%", background: preset.color }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: isSel ? preset.color : "#64748B" }}>{preset.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <label style={labelStyle}>전경색 (color)</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 28, height: 28, borderRadius: 6, background: displayData.color, border: "1px solid #E2E8F0", flexShrink: 0 }} />
                              <input value={displayData.color} onChange={e => setF("color", e.target.value)} placeholder="#EA580C" style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: 12 }} />
                            </div>
                          </div>
                          <div>
                            <label style={labelStyle}>배경색 (bg)</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 28, height: 28, borderRadius: 6, background: displayData.bg, border: "1px solid #E2E8F0", flexShrink: 0 }} />
                              <input value={displayData.bg} onChange={e => setF("bg", e.target.value)} placeholder="#FFF7ED" style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: 12 }} />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: displayData.color, background: displayData.bg, padding: "4px 12px", borderRadius: 20 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: displayData.color }} />
                          {displayData.name}
                        </span>
                        <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>{displayData.color} / {displayData.bg}</span>
                      </div>
                    )}
                  </FieldRow>
                </SectionBlock>

                {/* ===== 노출 상태 ===== */}
                <SectionBlock title="노출 상태">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3 }}>
                        {displayData.active ? "활성 (노출 중)" : "비활성 (숨김)"}
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
                        비활성 도구는 등록·탐색 화면의 출처 선택지에서 숨겨집니다. 기존 등록 항목은 유지됩니다.
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, flexShrink: 0,
                      background: displayData.active ? "#D1FAE5" : "#F1F5F9",
                      color: displayData.active ? "#065F46" : "#64748B",
                    }}>
                      {displayData.active ? "ON" : "OFF"}
                    </span>
                  </div>
                </SectionBlock>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
