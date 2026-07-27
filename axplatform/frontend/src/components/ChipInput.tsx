import { COLOR } from "../styles/tokens";

// 태그·칩 입력 (모듈 레벨 — 리렌더 시 포커스 손실 방지).
// 등록 폼(ProjectRegisterPage)과 수정 요청(EditRequestPage)이 공유하는 단일 정의.
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  fontSize: 13, color: COLOR.text, border: `1.5px solid ${COLOR.border}`,
  borderRadius: 8, outline: "none", fontFamily: "inherit",
};

export function ChipInput({
  items, onAdd, onRemove, draft, onDraftChange, suggestions, placeholder,
}: {
  items: string[]; onAdd: (value?: string) => void; onRemove: (v: string) => void;
  draft: string; onDraftChange: (v: string) => void; suggestions: string[]; placeholder: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: items.length > 0 ? 10 : 0 }}>
        {items.map(item => (
          <span key={item} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, background: "#E8F0FE", color: "#1E40AF",
            padding: "4px 6px 4px 10px", borderRadius: 6, border: "1px solid #BFDBFE",
          }}>
            {item}
            <button onClick={() => onRemove(item)} style={{ background: "none", border: "none", color: "#1E40AF", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={draft} onChange={e => onDraftChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder} style={{ ...inputStyle, flex: 1 }}
          onFocus={e => (e.target.style.borderColor = COLOR.primary)}
          onBlur={e => (e.target.style.borderColor = COLOR.border)} />
        <button onClick={() => onAdd()} style={{
          background: COLOR.primary, color: "#fff", border: "none", borderRadius: 7,
          padding: "0 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
        }}>추가</button>
      </div>
      {suggestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
          {suggestions.filter(s => !items.includes(s)).slice(0, 8).map(s => (
            <span key={s} onClick={() => onAdd(s)} style={{
              fontSize: 11, color: COLOR.text3, background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`,
              padding: "3px 9px", borderRadius: 20, cursor: "pointer",
            }}>+ {s}</span>
          ))}
        </div>
      )}
    </div>
  );
}
