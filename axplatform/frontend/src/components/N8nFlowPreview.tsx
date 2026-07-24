// N8nFlowPreview.tsx — n8n JSON에서 SVG 흐름 다이어그램 렌더링
import { useState, useRef } from "react";
import { COLOR } from "../styles/tokens";

// n8n 노드 타입별 시각 정의 (12종)
const N8N_NODE_VISUALS: Record<string, { bg: string; border: string; label: string; icon: string }> = {
  "n8n-nodes-base.manualTrigger":     { bg: "#FFF7ED", border: "#EA580C", label: "Manual Trigger",    icon: "▶" },
  "n8n-nodes-base.scheduleTrigger":   { bg: "#F0FDF4", border: "#16A34A", label: "Schedule Trigger",  icon: "🕐" },
  "n8n-nodes-base.webhook":           { bg: "#EFF6FF", border: "#2563EB", label: "Webhook",            icon: "⚡" },
  "n8n-nodes-base.if":                { bg: "#FEF3C7", border: "#D97706", label: "IF",                 icon: "?" },
  "n8n-nodes-base.switch":            { bg: "#FEF3C7", border: "#B45309", label: "Switch",             icon: "⇄" },
  "n8n-nodes-base.set":               { bg: "#F5F3FF", border: "#7C3AED", label: "Set",                icon: "✏" },
  "n8n-nodes-base.code":              { bg: "#1E1E1E", border: "#6B7280", label: "Code",               icon: "</>" },
  "n8n-nodes-base.merge":             { bg: "#ECFEFF", border: "#0891B2", label: "Merge",              icon: "⊕" },
  "n8n-nodes-base.emailSend":         { bg: "#FDF2F8", border: "#A21CAF", label: "Send Email",         icon: "✉" },
  "n8n-nodes-base.httpRequest":       { bg: "#F0FDFA", border: "#0D9488", label: "HTTP Request",       icon: "🌐" },
  "n8n-nodes-base.microsoftTeams":    { bg: "#EFF6FF", border: "#1D4ED8", label: "Teams",              icon: "T" },
  "n8n-nodes-base.microsoftOutlook":  { bg: "#EFF6FF", border: "#0078D4", label: "Outlook",            icon: "O" },
};

const DEFAULT_VISUAL = { bg: "#F8FAFC", border: "#94A3B8", label: "Node", icon: "◉" };

function getVisual(type: string) {
  return N8N_NODE_VISUALS[type] ?? DEFAULT_VISUAL;
}

type N8nNode = {
  id: string;
  name: string;
  type: string;
  position?: [number, number];
  parameters?: Record<string, unknown>;
};

type N8nConnection = {
  node: string;
  type: string;
  index: number;
};

type N8nJson = {
  name?: string;
  nodes?: N8nNode[];
  connections?: Record<string, { main?: N8nConnection[][] }>;
};

const NODE_W = 120;
const NODE_H = 54;
const COL_GAP = 160;
const ROW_GAP = 80;

function layoutNodes(nodes: N8nNode[]): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  // Try to use n8n's own position data first
  const hasPos = nodes.every(n => Array.isArray(n.position));
  if (hasPos) {
    let minX = Infinity, minY = Infinity;
    nodes.forEach(n => {
      const [x, y] = n.position!;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
    });
    nodes.forEach(n => {
      const [x, y] = n.position!;
      pos.set(n.id, { x: x - minX + 20, y: y - minY + 20 });
    });
    return pos;
  }
  // Fallback: left-to-right linear layout
  nodes.forEach((n, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    pos.set(n.id, { x: 20 + col * COL_GAP, y: 20 + row * ROW_GAP });
  });
  return pos;
}

type EdgeDef = { from: string; to: string };

function extractEdges(connections: Record<string, { main?: N8nConnection[][] }>): EdgeDef[] {
  const edges: EdgeDef[] = [];
  for (const [fromName, conn] of Object.entries(connections)) {
    if (!conn.main) continue;
    for (const outputs of conn.main) {
      if (!outputs) continue;
      for (const target of outputs) {
        edges.push({ from: fromName, to: target.node });
      }
    }
  }
  return edges;
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

// ===== 메인 컴포넌트 (모듈 레벨) =====
export default function N8nFlowPreview({ json, compact }: { json: string; compact?: boolean }) {
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  let parsed: N8nJson | null = null;
  let parseError = "";
  try {
    parsed = JSON.parse(json) as N8nJson;
    if (!parsed || typeof parsed !== "object") { parsed = null; parseError = "올바른 JSON 형식이 아닙니다."; }
    else if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) { parsed = null; parseError = "노드 정보가 없습니다."; }
  } catch {
    parseError = "JSON 파싱에 실패했습니다.";
  }

  if (!parsed) {
    return (
      <div style={{ background: COLOR.bgSubtle, border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "24px", textAlign: "center", fontSize: 13, color: COLOR.text3 }}>
        {parseError || "n8n JSON을 입력하면 흐름도가 표시됩니다."}
      </div>
    );
  }

  const nodes = parsed.nodes!;
  const connections = parsed.connections ?? {};
  const posMap = layoutNodes(nodes);
  const edges = extractEdges(connections);

  // nodeId → position
  const idToPos = new Map<string, { x: number; y: number }>();
  const nameToId = new Map<string, string>();
  nodes.forEach(n => {
    const p = posMap.get(n.id);
    if (p) idToPos.set(n.id, p);
    nameToId.set(n.name, n.id);
  });

  // Compute SVG dimensions
  let maxX = 0, maxY = 0;
  idToPos.forEach(p => {
    if (p.x + NODE_W > maxX) maxX = p.x + NODE_W;
    if (p.y + NODE_H > maxY) maxY = p.y + NODE_H;
  });
  const svgW = maxX + 40;
  const svgH = maxY + 40;

  const height = compact ? 220 : 320;

  return (
    <div>
      {/* 줌 컨트롤 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: COLOR.text3, fontWeight: 600 }}>
          {parsed.name && <>{parsed.name} · </>}{nodes.length}개 노드
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${COLOR.border}`, background: "#fff", fontSize: 16, cursor: "pointer", color: COLOR.text2 }}>−</button>
          <button onClick={() => setZoom(1)} style={{ minWidth: 42, height: 26, borderRadius: 6, border: `1.5px solid ${COLOR.border}`, background: "#fff", fontSize: 11, cursor: "pointer", color: COLOR.text2, fontWeight: 600 }}>{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${COLOR.border}`, background: "#fff", fontSize: 16, cursor: "pointer", color: COLOR.text2 }}>+</button>
        </div>
      </div>

      {/* SVG 뷰포트 */}
      <div style={{ border: `1.5px solid ${COLOR.border}`, borderRadius: 10, overflow: "auto", background: COLOR.bgSubtle, height, position: "relative" }}>
        <svg
          ref={svgRef}
          width={svgW * zoom}
          height={svgH * zoom}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display: "block" }}
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={COLOR.text3} />
            </marker>
          </defs>

          {/* 엣지 */}
          {edges.map((e, i) => {
            const fromId = nameToId.get(e.from) ?? e.from;
            const toId = nameToId.get(e.to) ?? e.to;
            const fp = idToPos.get(fromId);
            const tp = idToPos.get(toId);
            if (!fp || !tp) return null;
            const x1 = fp.x + NODE_W;
            const y1 = fp.y + NODE_H / 2;
            const x2 = tp.x;
            const y2 = tp.y + NODE_H / 2;
            return (
              <path key={i} d={bezierPath(x1, y1, x2, y2)}
                fill="none" stroke="#CBD5E1" strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
            );
          })}

          {/* 노드 */}
          {nodes.map(n => {
            const p = idToPos.get(n.id);
            if (!p) return null;
            const v = getVisual(n.type);
            const isCode = n.type === "n8n-nodes-base.code";
            return (
              <g key={n.id}
                onMouseEnter={ev => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) setTooltip({ text: n.name, x: ev.clientX - rect.left, y: ev.clientY - rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: "default" }}
              >
                <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H}
                  rx={8} ry={8}
                  fill={v.bg} stroke={v.border} strokeWidth={1.5}
                />
                <text x={p.x + NODE_W / 2} y={p.y + 18} textAnchor="middle"
                  fontSize={14} fill={isCode ? COLOR.border : v.border} fontWeight={600}>
                  {v.icon}
                </text>
                <text x={p.x + NODE_W / 2} y={p.y + 36} textAnchor="middle"
                  fontSize={10} fill={isCode ? COLOR.border : COLOR.text2} fontWeight={600}>
                  {n.name.length > 14 ? n.name.slice(0, 13) + "…" : n.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 툴팁 */}
        {tooltip && (
          <div style={{
            position: "absolute", left: tooltip.x + 8, top: tooltip.y - 28, pointerEvents: "none",
            background: "#0F172A", color: "#fff", fontSize: 11, padding: "4px 10px", borderRadius: 6,
            fontWeight: 600, whiteSpace: "nowrap", zIndex: 10,
          }}>
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
}
