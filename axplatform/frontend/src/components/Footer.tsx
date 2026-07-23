import { useNavigate } from "react-router-dom";
import { IS_SHARE_MODE } from "../config/shareMode";

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{
      background: "#0F172A", borderTop: "1px solid #1E293B",
      padding: "20px 32px", marginTop: 40,
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: "#b7b9bd" }}>KOLMAR</span>
        <span style={{ fontSize: 11, color: "#b7b9bd" }}>AX Platform</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* '서비스 소개'(/about)는 푸터 링크로 제공. */}
        {!IS_SHARE_MODE && (
          <span
            onClick={() => navigate("/about")}
            style={{ fontSize: 11, color: "#b7b9bd", cursor: "pointer" }}
          >
            서비스 소개
          </span>
        )}
        <div style={{ fontSize: 11, color: "#b7b9bd" }}>사내 전용 플랫폼 · 외부 접근 불가</div>
      </div>
    </footer>
  );
}
