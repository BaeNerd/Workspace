export default function Footer() {
  return (
    <footer style={{
      background: "#0F172A", borderTop: "1px solid #1E293B",
      padding: "20px 32px", marginTop: 40,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: "#b7b9bd" }}>KOLMAR</span>
        <span style={{ fontSize: 11, color: "#b7b9bd" }}>Tech Hub</span>
      </div>
      <div style={{ fontSize: 11, color: "#b7b9bd" }}>사내 전용 플랫폼 · 외부 접근 불가</div>
    </footer>
  );
}
