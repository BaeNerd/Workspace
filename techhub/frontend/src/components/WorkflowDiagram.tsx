import type { PlatformItem } from "../types/platformTypes";

export type WorkflowDef = NonNullable<PlatformItem["workflowDef"]>;
export type WFNode = WorkflowDef["nodes"][number];

// Simplified editor-friendly shape (linear order, auto-generates edges)
export type WorkflowInput = {
  status: "Stable" | "Active" | "Error";
  nodes: { label: string; type: WFNode["type"]; n8nType?: string }[];
};

export const WF_STATUS_OPTIONS = ["Stable", "Active", "Error"] as const;

export const WF_NODE_TYPE_OPTIONS: { value: WFNode["type"]; label: string }[] = [
  { value: "trigger",   label: "트리거" },
  { value: "condition", label: "조건/분기" },
  { value: "action",    label: "액션" },
  { value: "output",    label: "출력" },
];

export function toWorkflowDef(input: WorkflowInput): WorkflowDef | undefined {
  const filled = input.nodes.filter(n => n.label.trim());
  if (filled.length === 0) return undefined;
  return {
    status: input.status,
    nodes: filled.map((n, i) => ({ id: String(i + 1), label: n.label.trim(), type: n.type, n8nType: n.n8nType })),
    edges: filled.slice(0, -1).map((_, i) => ({ from: String(i + 1), to: String(i + 2) })),
  };
}

export function fromWorkflowDef(wf: WorkflowDef | undefined): WorkflowInput {
  if (!wf) return { status: "Stable", nodes: [] };
  return {
    status: wf.status,
    nodes: wf.nodes.map(n => ({ label: n.label, type: n.type, n8nType: n.n8nType })),
  };
}

/* ── n8n JSON 파싱 유틸리티 ────────────────────────────────────── */

const EXCLUDED_N8N_TYPES = new Set([
  "n8n-nodes-base.stickyNote",
  "n8n-nodes-base.noOp",
]);

function n8nTypeToWFType(t: string): WFNode["type"] {
  const base = t.split(".").pop()?.toLowerCase() ?? "";
  if (base.endsWith("trigger") || base === "webhook") return "trigger";
  if (base === "if" || base === "switch" || base === "filter") return "condition";
  return "action";
}

export type ParsedN8nWorkflow = {
  workflowInput: WorkflowInput;
  rawJson: string;
  name: string;
};

export function parseN8nJson(jsonStr: string): ParsedN8nWorkflow | null {
  try {
    const data = JSON.parse(jsonStr) as {
      name?: string;
      nodes?: Array<{ type: string; name: string; position?: [number, number] }>;
    };
    if (!Array.isArray(data.nodes)) return null;
    const active = data.nodes
      .filter(n => !EXCLUDED_N8N_TYPES.has(n.type))
      .sort((a, b) => (a.position?.[0] ?? 0) - (b.position?.[0] ?? 0));
    return {
      workflowInput: {
        status: "Stable",
        nodes: active.map(n => ({
          label: n.name,
          type: n8nTypeToWFType(n.type),
          n8nType: n.type,
        })),
      },
      rawJson: jsonStr,
      name: data.name ?? "",
    };
  } catch {
    return null;
  }
}

/* ── NodeIcon — n8n 노드 유형별 아이콘 ─────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  Stable: "#16A34A",
  Active: "#2563EB",
  Error:  "#DC2626",
};

type IconCfg = { bg: string; path: string; viewBox?: string; fill?: string; stroke?: string };

const N8N_ICON_MAP: Record<string, IconCfg> = {
  scheduletrigger: {
    bg: "#16A34A",
    path: "M12 3a9 9 0 100 18A9 9 0 0012 3zM12 7v5l3.5 3.5",
    stroke: "white", fill: "none",
  },
  webhook: {
    bg: "#EA580C",
    path: "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3",
    stroke: "white", fill: "none",
  },
  formtrigger: {
    bg: "#EA580C",
    path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4",
    stroke: "white", fill: "none",
  },
  chattrigger: {
    bg: "#7C3AED",
    path: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    stroke: "white", fill: "none",
  },
  manualtrigger: {
    bg: "#16A34A",
    path: "M5 3l14 9-14 9V3z",
    fill: "white", stroke: "none",
  },
  if: {
    bg: "#D97706",
    path: "M12 3v5M12 8l-4 5M12 8l4 5M8 13v5M16 13v5",
    stroke: "white", fill: "none",
  },
  switch: {
    bg: "#D97706",
    path: "M4 12h16M12 4l-4 8h8L12 4zM8 16l-4 4M12 16v4M16 16l4 4",
    stroke: "white", fill: "none",
  },
  filter: {
    bg: "#D97706",
    path: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    stroke: "white", fill: "none",
  },
  code: {
    bg: "#4F46E5",
    path: "M16 18l6-6-6-6M8 6l-6 6 6 6",
    stroke: "white", fill: "none",
  },
  splitinbatches: {
    bg: "#059669",
    path: "M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3",
    stroke: "white", fill: "none",
  },
  splitout: {
    bg: "#0D9488",
    path: "M12 3v8M8 7l4 4 4-4M5 19h14M9 19v-4h6v4",
    stroke: "white", fill: "none",
  },
  merge: {
    bg: "#0D9488",
    path: "M8 5v6l4 3 4-3V5M12 14v6M5 19h14",
    stroke: "white", fill: "none",
  },
  aggregate: {
    bg: "#0D9488",
    path: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    stroke: "white", fill: "none",
  },
  sort: {
    bg: "#0D9488",
    path: "M3 6h18M6 12h12M9 18h6",
    stroke: "white", fill: "none",
  },
  googlesheets: {
    bg: "#16A34A",
    path: "M3 3h18v18H3V3zM3 9h18M3 15h18M9 3v18M15 3v18",
    stroke: "white", fill: "none",
  },
  telegram: {
    bg: "#0088CC",
    path: "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
    stroke: "white", fill: "none",
  },
  microsoftteams: {
    bg: "#6264A7",
    path: "M17 8a3 3 0 100-6 3 3 0 000 6zM20 10h-1a3 3 0 00-3 3v5h4V10zM3 10h11v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10zM8.5 5a3 3 0 100 6 3 3 0 000-6z",
    stroke: "white", fill: "none",
  },
  microsoftoutlook: {
    bg: "#0078D4",
    path: "M3 7l9 6 9-6M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1z",
    stroke: "white", fill: "none",
  },
  slack: {
    bg: "#4A154B",
    path: "M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5zM20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5zM3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14zM14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5zM15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5zM8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z",
    fill: "white", stroke: "none",
  },
  httprequest: {
    bg: "#2563EB",
    path: "M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20",
    stroke: "white", fill: "none",
  },
  airtop: {
    bg: "#0D9488",
    path: "M2 4a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V4zM2 8h20M8 20v-8M6 12h4",
    stroke: "white", fill: "none",
  },
  respondtowebhook: {
    bg: "#EA580C",
    path: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    fill: "white", stroke: "none",
  },
  set: {
    bg: "#64748B",
    path: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
    stroke: "white", fill: "none",
  },
  editfields: {
    bg: "#64748B",
    path: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
    stroke: "white", fill: "none",
  },
  openai: {
    bg: "#10A37F",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8 12l2-2 2 2 4-4",
    stroke: "white", fill: "none",
  },
  agent: {
    bg: "#7C3AED",
    path: "M12 2a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5zM3 21v-1a9 9 0 0118 0v1",
    stroke: "white", fill: "none",
  },
  basicllmchain: {
    bg: "#7C3AED",
    path: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    stroke: "white", fill: "none",
  },
};

const TYPE_ICON_MAP: Record<WFNode["type"], IconCfg> = {
  trigger: {
    bg: "#16A34A",
    path: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
    stroke: "white", fill: "none",
  },
  condition: {
    bg: "#D97706",
    path: "M4 12h16M12 4l-4 8h8L12 4z",
    stroke: "white", fill: "none",
  },
  action: {
    bg: "#7C3AED",
    path: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
    stroke: "white", fill: "none",
  },
  output: {
    bg: "#2563EB",
    path: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    fill: "white", stroke: "none",
  },
};

function NodeIcon({ type, n8nType }: { type: WFNode["type"]; n8nType?: string }) {
  const key = n8nType?.split(".").pop()?.toLowerCase();
  const cfg = (key && N8N_ICON_MAP[key]) || TYPE_ICON_MAP[type];
  const strokeW = cfg.stroke ? "2" : undefined;
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 9, background: cfg.bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill={cfg.fill ?? "none"} stroke={cfg.stroke ?? "none"} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round">
        <path d={cfg.path} />
      </svg>
    </div>
  );
}

/* ── 다이어그램 표시 컴포넌트 ───────────────────────────────────── */

export function WorkflowDiagram({ wf }: { wf: WorkflowDef }) {
  const order: string[] = [];
  const visited = new Set<string>();
  const hasIncoming = new Set(wf.edges.map(e => e.to));
  const starts = wf.nodes.filter(n => !hasIncoming.has(n.id));
  const dfs = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    order.push(id);
    wf.edges.filter(e => e.from === id).forEach(e => dfs(e.to));
  };
  starts.forEach(s => dfs(s.id));
  wf.nodes.filter(n => !visited.has(n.id)).forEach(n => order.push(n.id));
  const nodeMap = Object.fromEntries(wf.nodes.map(n => [n.id, n]));

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #F1F5F9",
      }}>
        <span style={{ fontSize: 12, color: "#64748B" }}>
          노드 <strong style={{ color: "#0F172A" }}>{wf.nodes.length}개</strong>
          {" · "}연결 <strong style={{ color: "#0F172A" }}>{wf.edges.length}개</strong>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: STATUS_COLOR[wf.status] ?? "#94A3B8" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[wf.status] ?? "#94A3B8", display: "inline-block" }} />
          {wf.status}
        </span>
      </div>
      <div style={{
        background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12,
        padding: "32px 28px", overflowX: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, minWidth: "max-content", margin: "0 auto" }}>
          {order.map((id, i) => {
            const node = nodeMap[id];
            return (
              <div key={id} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12,
                  padding: "16px 14px", textAlign: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  minWidth: 110, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                }}>
                  <NodeIcon type={node.type} n8nType={node.n8nType} />
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", lineHeight: 1.4, maxWidth: 90 }}>
                    {node.label}
                  </div>
                </div>
                {i < order.length - 1 && (
                  <div style={{ display: "flex", alignItems: "center", width: 56, flexShrink: 0 }}>
                    <div style={{ flex: 1, height: 2, background: "#CBD5E1" }} />
                    <svg width="8" height="8" viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
                      <path d="M1 4h6M4 1l3 3-3 3" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── 워크플로우 에디터 컴포넌트 ──────────────────────────────────── */

const selectStyle: React.CSSProperties = {
  fontSize: 12, padding: "5px 8px", borderRadius: 6,
  border: "1.5px solid #E2E8F0", background: "#fff", color: "#334155", outline: "none",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  flex: 1, fontSize: 12, padding: "6px 10px", borderRadius: 6,
  border: "1.5px solid #E2E8F0", background: "#fff", color: "#0F172A", outline: "none",
};

export function WorkflowEditor({
  value,
  onChange,
  disabled,
}: {
  value: WorkflowInput;
  onChange: (v: WorkflowInput) => void;
  disabled?: boolean;
}) {
  const addNode = () => {
    if (disabled) return;
    const type: WFNode["type"] = value.nodes.length === 0 ? "trigger" : "action";
    onChange({ ...value, nodes: [...value.nodes, { label: "", type }] });
  };
  const removeNode = (i: number) => {
    if (disabled) return;
    onChange({ ...value, nodes: value.nodes.filter((_, idx) => idx !== i) });
  };
  const setField = (i: number, field: "label" | "type", v: string) => {
    if (disabled) return;
    onChange({
      ...value,
      nodes: value.nodes.map((n, idx) => idx === i ? { ...n, [field]: v } : n),
    });
  };

  const preview = toWorkflowDef(value);

  return (
    <div>
      {/* 상태 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", minWidth: 28 }}>상태</span>
        <select
          value={value.status}
          onChange={e => !disabled && onChange({ ...value, status: e.target.value as WorkflowInput["status"] })}
          disabled={disabled}
          style={{ ...selectStyle, opacity: disabled ? 0.6 : 1 }}
        >
          {WF_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* 노드 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
        {value.nodes.map((node, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              background: "#2563EB", color: "#fff",
              fontSize: 11, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{i + 1}</div>
            <select
              value={node.type}
              onChange={e => setField(i, "type", e.target.value)}
              disabled={disabled}
              style={{ ...selectStyle, opacity: disabled ? 0.6 : 1 }}
            >
              {WF_NODE_TYPE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              value={node.label}
              onChange={e => setField(i, "label", e.target.value)}
              disabled={disabled}
              placeholder="노드명 (예: Schedule Trigger)"
              style={{ ...inputStyle, opacity: disabled ? 0.6 : 1 }}
            />
            {node.n8nType && !disabled && (
              <NodeIcon type={node.type} n8nType={node.n8nType} />
            )}
            {!disabled && (
              <button
                onClick={() => removeNode(i)}
                style={{
                  width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                  background: "#FEE2E2", color: "#DC2626",
                  border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            )}
          </div>
        ))}
      </div>

      {/* 노드 추가 */}
      {!disabled && (
        <button
          onClick={addNode}
          style={{
            fontSize: 12, fontWeight: 600, color: "#2563EB",
            background: "#EFF6FF", border: "1px solid #BFDBFE",
            borderRadius: 6, padding: "5px 14px", cursor: "pointer", marginBottom: 16,
          }}
        >+ 노드 추가</button>
      )}

      {/* 실시간 미리보기 */}
      {preview && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            미리보기
          </div>
          <WorkflowDiagram wf={preview} />
        </div>
      )}
    </div>
  );
}
