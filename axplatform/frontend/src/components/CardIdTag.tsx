// ===== components/CardIdTag.tsx =====
// 항목 ID(0.3 체계, {PREFIX}-{YYYY}-{NNN})를 사용자 화면 카드·상세에 노출하는 공용 태그.
// 배치 규약: 등록 부서(dept)가 있으면 그 왼쪽, 없으면 메타 줄 선두(0.3·USR-03/04).
// 단일 정의 — 지점별 개별 스타일 금지. styles/tokens.ts 토큰만 사용(신규 hex 금지). 텍스트 선택 가능.
import { COLOR } from "../styles/tokens";

export default function CardIdTag({ id }: { id: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        color: COLOR.text3,
        background: COLOR.bgSubtle,
        border: `1px solid ${COLOR.border}`,
        borderRadius: 4,
        padding: "1px 6px",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        flexShrink: 0,
        userSelect: "text",
      }}
    >
      {id}
    </span>
  );
}
