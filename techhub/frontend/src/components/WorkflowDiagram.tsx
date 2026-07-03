import type { PlatformItem } from "../types/platformTypes";

export type WorkflowDef = NonNullable<PlatformItem["workflowDef"]>;
export type WFNode = WorkflowDef["nodes"][number];

// Simplified editor-friendly shape (linear order, auto-generates edges)
export type WorkflowInput = {
  status: "Stable" | "Active" | "Error";
  nodes: { label: string; type: WFNode["type"] }[];
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
    nodes: filled.map((n, i) => ({ id: String(i + 1), label: n.label.trim(), type: n.type })),
    edges: filled.slice(0, -1).map((_, i) => ({ from: String(i + 1), to: String(i + 2) })),
  };
}

export function fromWorkflowDef(wf: WorkflowDef | undefined): WorkflowInput {
  if (!wf) return { status: "Stable", nodes: [] };
  return {
    status: wf.status,
    nodes: wf.nodes.map(n => ({ label: n.label, type: n.type })),
  };
}

/* ── 다이어그램 표시 컴포넌트 ───────────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  Stable: "#16A34A",
  Active: "#2563EB",
  Error:  "#DC2626",
};

function NodeIcon({ type }: { type: WFNode["type"] }) {
  if (type === "trigger" || type === "output") {
    return (
      <svg width="38" height="38" viewBox="0 0 38 38">
        <rect width="38" height="38" rx="8" fill="#0078D4" />
        <rect x="8" y="11" width="22" height="16" rx="2" fill="white" opacity="0.95" />
        <polyline points="8,11 19,20 30,11" fill="none" stroke="#0078D4" strokeWidth="1.8" />
      </svg>
    );
  }
  if (type === "condition") {
    return (
      <svg width="38" height="38" viewBox="0 0 38 38">
        <rect width="38" height="38" rx="8" fill="#F1F5F9" />
        <path d="M10 28 L10 17 L21 17" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M17 12 L22 17 L17 22" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 17 L28 17 L28 28" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="38" height="38" viewBox="0 0 38 38">
      <rect width="38" height="38" rx="8" fill="#7C3AED" />
      <circle cx="19" cy="19" r="9" fill="none" stroke="white" strokeWidth="2" opacity="0.9" />
      <path d="M19 14 L19 24 M14 19 L24 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

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
                  <NodeIcon type={node.type} />
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

/* ── 워크플로우 에디터 컴포넌트 ─────────────────────────────── */

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
    const type: WFNode["type"] = value.nodes.length === 0 ? "trigger"
      : value.nodes.length === value.nodes.length - 1 ? "output"
      : "action";
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
              placeholder="노드명 (예: Outlook Trigger)"
              style={{ ...inputStyle, opacity: disabled ? 0.6 : 1 }}
            />
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
