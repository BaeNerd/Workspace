import { COLOR } from "../styles/tokens";

// 예상 절감 시간 입력 — 수치 + 주기 조합. 등록 폼(ProjectRegisterPage)·수정 요청(EditRequestPage) 공용(단일 정의).
// 직렬화(serializeTimeSaved)·역파싱(parseTimeSaved)을 여기서 함께 관리해 저장 문자열 형식을 SSOT로 둔다.
export type SavedPeriod = "일" | "주" | "월" | "년";
const SAVED_PERIODS: SavedPeriod[] = ["일", "주", "월", "년"];
const PERIOD_ANNUAL_FACTOR: Record<SavedPeriod, number> = { "일": 365, "주": 52, "월": 12, "년": 1 };
const PERIOD_FULL_LABEL: Record<SavedPeriod, string> = { "일": "매일", "주": "주당", "월": "월당", "년": "연간" };

// 표준 저장 문자열: "주 3시간" (period value시간). 빈 값·0 이하는 빈 문자열.
export const serializeTimeSaved = (value: number | "", period: SavedPeriod): string =>
  value === "" || value <= 0 ? "" : `${period} ${value}시간`;

// 저장 문자열("주 3시간") → { value, period } 역파싱. 미인식·빈 값은 기본값("" · "주")으로 환원(프리필용).
export const parseTimeSaved = (raw?: string): { value: number | ""; period: SavedPeriod } => {
  const m = raw?.match(/^(일|주|월|년)\s*([\d.]+)\s*시간$/);
  if (!m) return { value: "", period: "주" };
  const value = Number(m[2]);
  return { value: Number.isNaN(value) ? "" : value, period: m[1] as SavedPeriod };
};

const annualHours = (value: number | "", period: SavedPeriod): number =>
  value === "" || value <= 0 ? 0 : Number(value) * PERIOD_ANNUAL_FACTOR[period];

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  fontSize: 13, color: COLOR.text, border: `1.5px solid ${COLOR.border}`,
  borderRadius: 8, outline: "none", fontFamily: "inherit",
};

export function TimeSavedInput({
  value, period, onValueChange, onPeriodChange,
}: {
  value: number | ""; period: SavedPeriod;
  onValueChange: (v: number | "") => void; onPeriodChange: (p: SavedPeriod) => void;
}) {
  const annual = annualHours(value, period);
  const hasValue = value !== "" && Number(value) > 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {SAVED_PERIODS.map(p => (
            <span key={p} onClick={() => onPeriodChange(p)} style={{
              fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
              border: `1.5px solid ${period === p ? COLOR.primary : COLOR.border}`,
              background: period === p ? "#E8F0FE" : "#fff",
              color: period === p ? COLOR.primary : COLOR.text2,
              cursor: "pointer", userSelect: "none",
            }}>{p}</span>
          ))}
        </div>
        <input
          type="number" min={0} step={0.5} inputMode="decimal" value={value}
          onChange={e => {
            const raw = e.target.value;
            if (raw === "") { onValueChange(""); return; }
            const n = Number(raw);
            if (Number.isNaN(n) || n < 0) return;
            onValueChange(n);
          }}
          placeholder="예: 3"
          style={{ ...inputStyle, maxWidth: 120 }}
          onFocus={e => (e.target.style.borderColor = COLOR.primary)}
          onBlur={e => (e.target.style.borderColor = COLOR.border)}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: COLOR.text2, whiteSpace: "nowrap" }}>시간</span>
      </div>
      {hasValue && (
        <div style={{
          marginTop: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8,
          padding: "10px 14px", fontSize: 12, color: "#065F46", lineHeight: 1.6,
        }}>
          <strong style={{ fontWeight: 700 }}>{PERIOD_FULL_LABEL[period]} {value}시간</strong> 절감
          {" → "}
          연간 약 <strong style={{ fontWeight: 700 }}>{annual.toLocaleString()}시간</strong>
          <span style={{ color: "#059669", marginLeft: 4 }}>
            ({value}시간 × {PERIOD_ANNUAL_FACTOR[period].toLocaleString()}{period === "년" ? "" : period})
          </span>
        </div>
      )}
    </div>
  );
}
