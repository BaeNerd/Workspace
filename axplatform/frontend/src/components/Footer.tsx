export default function Footer() {
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
        {/* '서비스 소개' 링크는 가이드(USR-09)로 통합되어 별도 노출 없음. */}
        <div style={{ fontSize: 11, color: "#b7b9bd" }}>사내 전용 플랫폼 · 외부 접근 불가</div>
      </div>
    </footer>
  );
}
