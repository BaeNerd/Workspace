import type { CSSProperties } from "react";
import { COLOR } from "../styles/tokens";

// 성장형 목록 공용 "더보기" 버튼 — 남은 건수를 표기하고, 전량 노출(remaining<=0) 시 렌더하지 않는다.
// useVisibleCount와 짝을 이루는 표시 단일 소스. 색은 styles/tokens.ts 토큰만 사용.
type Props = { remaining: number; onClick: () => void };

export default function LoadMoreButton({ remaining, onClick }: Props) {
  if (remaining <= 0) return null;
  return (
    <div style={wrapStyle}>
      <button type="button" onClick={onClick} style={btnStyle}>
        더보기 <span style={{ color: COLOR.text3 }}>(남은 {remaining}건)</span>
      </button>
    </div>
  );
}

const wrapStyle: CSSProperties = { textAlign: "center", marginTop: 16 };
const btnStyle: CSSProperties = {
  background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 8,
  padding: "9px 24px", fontSize: 13, fontWeight: 600, color: COLOR.text2, cursor: "pointer",
};
