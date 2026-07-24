import { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import { STAT_COMPANIES, COMPANY_NAME } from "../mocks/statsMockData";
import { COLOR } from "../styles/tokens";

// 조회 범위 선택 — 전체(합산) 또는 개별 관계자 드릴다운
export type ScopeSelection = { kind: "all" } | { kind: "company"; code: string };

type Props = {
  value: ScopeSelection;
  onChange: (v: ScopeSelection) => void;
  /** admin이면 null(전사 드릴다운), companyAdmin이면 담당 관계사 코드 배열 */
  restrictTo: string[] | null;
};

const companyLabel = (code: string) => COMPANY_NAME[code] ?? code;

// 범위 배지 색 체계: 전체=파랑, 개별 관계사=파스텔 오렌지
const ALL_TONE = { dot: "#2563C9", bg: "#E8F0FE", fg: "#2563C9" };
const CO_TONE = { dot: "#B4602E", bg: "#FBEEE4", fg: "#B4602E" };

// 닫힌 드롭다운 트리거 기준 스타일 (규칙 3: inputStyle + cursor: pointer)
const inputStyle: CSSProperties = {
  boxSizing: "border-box", padding: "6px 10px", fontSize: 12, color: COLOR.text,
  background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 8, outline: "none", fontFamily: "inherit",
};
const triggerStyle: CSSProperties = {
  ...inputStyle, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
};
const panelStyle: CSSProperties = {
  position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 40, minWidth: 200,
  background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 8,
  boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: 6, maxHeight: 320, overflowY: "auto",
};

export default function AdminScopeSelect({ value, onChange, restrictTo }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // 바깥 클릭 시 닫힘
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // TODO: 실제 연동 시 GET /api/v1/admin/companies 응답의 노출 관계사 목록으로 교체
  const companyCodes = restrictTo === null
    ? [...STAT_COMPANIES]
    : STAT_COMPANIES.filter(c => restrictTo.includes(c));
  const allLabel = restrictTo === null ? "전사 전체" : "담당 전체 (합산)";

  const options: { sel: ScopeSelection; label: string }[] = [
    { sel: { kind: "all" }, label: allLabel },
    ...companyCodes.map(c => ({ sel: { kind: "company", code: c } as ScopeSelection, label: companyLabel(c) })),
  ];

  const isCompany = value.kind === "company";
  const currentLabel = isCompany ? companyLabel(value.code) : allLabel;
  const tone = isCompany ? CO_TONE : ALL_TONE;
  const selected = (o: ScopeSelection) =>
    o.kind === "all" ? value.kind === "all" : (value.kind === "company" && value.code === o.code);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={triggerStyle}>
        <span style={{ fontSize: 11, color: COLOR.text3, fontWeight: 600 }}>조회 범위:</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: tone.bg, color: tone.fg, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: tone.dot, flexShrink: 0 }} />
          {currentLabel}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLOR.text3} strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={panelStyle}>
          {options.map((o, i) => {
            const on = selected(o.sel);
            const optTone = o.sel.kind === "all" ? ALL_TONE : CO_TONE;
            return (
              <div
                key={i}
                onClick={() => { onChange(o.sel); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 6,
                  cursor: "pointer", background: on ? COLOR.primaryWeak : "transparent",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: optTone.dot, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: on ? 700 : 500, color: on ? COLOR.primary : COLOR.text2 }}>{o.label}</span>
                {on && <span style={{ fontSize: 12, fontWeight: 800, color: COLOR.primary }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
