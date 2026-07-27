import type { CSSProperties } from "react";
import { PERIOD_PRESETS, MAX_RANGE_MONTHS, monthSpan, addMonths, getSelectableMonths } from "../lib/dataSource";
import type { PeriodSelection } from "../lib/dataSource";
import { COLOR } from "../styles/tokens";

// 기간 선택기 — 통계·대시보드 공용. 프리셋 3종 세그먼트(최근 3개월·최근 6개월·올해 전체) + "범위 지정"(시작~종료, 최대 24개월).
// 유효 범위 환원은 dataSource.resolvePeriod가 담당하고, 이 컴포넌트는 선택 상태만 통제한다(controlled).
type Props = {
  value: PeriodSelection;
  onChange: (v: PeriodSelection) => void;
};

// 세그먼트 활성색 — 관리자 화면 공용 다크 네이비(기존 값 유지, 신규 색 도입 아님).
const SEG_ACTIVE_BG = "#0F172A";

const groupStyle: CSSProperties = {
  display: "flex", gap: 4, background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 8, padding: 4,
};
const segBase: CSSProperties = {
  padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
};
const rangeBoxStyle: CSSProperties = {
  display: "flex", gap: 6, alignItems: "center", background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 8, padding: "4px 6px",
};
// 네이티브 select — 규칙 3의 "커스텀 드롭다운 트리거"가 아니므로 select 자체 스타일링 허용(기존 월 지정 관용 계승).
const selectStyle: CSSProperties = {
  padding: "6px 10px", fontSize: 12, fontWeight: 600, color: COLOR.text, background: "#fff",
  border: `1.5px solid ${COLOR.border}`, borderRadius: 6, outline: "none", fontFamily: "inherit", cursor: "pointer",
};
const hintStyle: CSSProperties = { fontSize: 11, color: COLOR.text3, fontWeight: 500, whiteSpace: "nowrap" };

const monthLabel = (key: string) => key.replace("-", "."); // "2025-06" → "2025.06"

export default function AdminPeriodSelect({ value, onChange }: Props) {
  const months = getSelectableMonths();
  const first = months[0];
  const last = months[months.length - 1];
  const isRange = value.kind === "range";

  // 범위 진입 기본값: 말미 6개월(데이터가 짧으면 전 구간).
  const enterRange = () => {
    onChange({ kind: "range", from: months[Math.max(0, months.length - 6)], to: last });
  };

  // 시작 변경: 종료<시작이면 종료=시작, 24개월 초과면 종료를 시작+(MAX-1)로 절단.
  const onFrom = (from: string) => {
    if (!isRange) return;
    let to = value.to;
    if (to < from) to = from;
    if (monthSpan(from, to) > MAX_RANGE_MONTHS) to = addMonths(from, MAX_RANGE_MONTHS - 1);
    onChange({ kind: "range", from, to });
  };
  // 종료 변경: 시작>종료면 시작=종료, 24개월 초과면 시작을 종료-(MAX-1)로 당김(방금 고른 종료 유지).
  const onTo = (to: string) => {
    if (!isRange) return;
    let from = value.from;
    if (to < from) from = to;
    if (monthSpan(from, to) > MAX_RANGE_MONTHS) from = addMonths(to, -(MAX_RANGE_MONTHS - 1));
    onChange({ kind: "range", from, to });
  };

  // 종료 옵션을 [시작, 시작+(MAX-1)] 창으로 제한 — 종료≥시작·최대 24개월을 UI에서 강제(선택 제한).
  const fromKey = isRange ? value.from : first;
  const windowEnd = addMonths(fromKey, MAX_RANGE_MONTHS - 1);
  const toOptions = months.filter(m => m >= fromKey && m <= windowEnd);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
      <div style={groupStyle}>
        {PERIOD_PRESETS.map(p => {
          const active = value.kind === "preset" && value.preset === p;
          return (
            <button key={p} type="button" onClick={() => onChange({ kind: "preset", preset: p })} style={{
              ...segBase, background: active ? SEG_ACTIVE_BG : "transparent", color: active ? "#fff" : COLOR.text2,
            }}>{p}</button>
          );
        })}
        <button type="button" onClick={enterRange} style={{
          ...segBase, background: isRange ? SEG_ACTIVE_BG : "transparent", color: isRange ? "#fff" : COLOR.text2,
        }}>범위 지정</button>
      </div>

      {isRange && (
        <div style={rangeBoxStyle}>
          <select value={value.from} onChange={e => onFrom(e.target.value)} style={selectStyle} aria-label="시작 월">
            {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <span style={{ fontSize: 12, color: COLOR.text3 }}>~</span>
          <select value={value.to} onChange={e => onTo(e.target.value)} style={selectStyle} aria-label="종료 월">
            {toOptions.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <span style={hintStyle}>최대 {MAX_RANGE_MONTHS}개월</span>
        </div>
      )}
    </div>
  );
}
