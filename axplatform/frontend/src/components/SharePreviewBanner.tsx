import { useShareNotice } from "../context/ShareNoticeContext";

// 미리보기 배너 높이 (Navbar sticky top 오프셋과 동일하게 유지)
export const SHARE_BANNER_HEIGHT = 32;

const BASE_TONE = { bg: "#E8F0FE", fg: "#2563C9" };   // 기본: 차분한 파랑
const ALERT_TONE = { bg: "#FEF3C7", fg: "#92400E" };  // 안내 활성: 파스텔 앰버

const bannerStyle = (active: boolean): React.CSSProperties => ({
  position: "sticky", top: 0, zIndex: 200,
  height: SHARE_BANNER_HEIGHT,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 12, fontWeight: 700,
  background: active ? ALERT_TONE.bg : BASE_TONE.bg,
  color: active ? ALERT_TONE.fg : BASE_TONE.fg,
  transition: "background 0.25s, color 0.25s",
  fontFamily: "var(--font-ui)",
});

// IS_SHARE_MODE 분기에서만 마운트되는 최상단 안내 바.
export default function SharePreviewBanner() {
  const { active } = useShareNotice();
  return (
    <div style={bannerStyle(active)}>
      {active
        ? "이 미리보기에서는 상세 화면으로 이동할 수 없습니다"
        : "AX 플랫폼 랜딩 미리보기 — 화면 이동은 제한되어 있습니다."}
    </div>
  );
}
