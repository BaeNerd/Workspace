import { useState } from "react";
import AltIngredientDoc from "./components/AltIngredientDoc";
import ToolRec from "./components/ToolRec";

const PAGES = [
  { id: "alt-ingredient", label: "대체 원료 추천 AI 문서", sub: "개발 명세·DB 설계·API·KPI" },
  { id: "tool-rec", label: "테스트 데이터 생성 도구 추천", sub: "워크플로·라이브러리·코드" },
];

type PageId = "alt-ingredient" | "tool-rec";

export default function App() {
  const [page, setPage] = useState<PageId>("alt-ingredient");

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", minHeight: "100vh" }}>
      {/* Top nav */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--color-background-primary)",
        borderBottom: "1px solid var(--color-border-tertiary)",
        padding: "0 24px",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => setPage(p.id as PageId)}
            style={{
              padding: "12px 16px",
              border: "none",
              borderBottom: page === p.id ? "2px solid var(--color-accent, #6366f1)" : "2px solid transparent",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: page === p.id ? 600 : 400,
              color: page === p.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              transition: "all 0.15s",
              textAlign: "left",
            }}
          >
            <div>{p.label}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 1 }}>{p.sub}</div>
          </button>
        ))}
      </div>

      {/* Page content */}
      <div style={{ padding: "0 24px" }}>
        {page === "alt-ingredient" && <AltIngredientDoc />}
        {page === "tool-rec" && <ToolRec />}
      </div>
    </div>
  );
}
