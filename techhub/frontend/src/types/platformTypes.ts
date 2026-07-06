export type PlatformId = "n8n" | "pa" | "assistant" | "ai-orchestration" | "ml" | "vibe";

export type Platform = {
  id: PlatformId;
  name: string;
  shortDesc: string;
  path: string;
  accessUrl: string | null;
  color: string;
  bg: string;
  icon: "automation" | "assistant" | "orchestration" | "pa" | "ml" | "vibe";
};

export const PLATFORMS: Platform[] = [
  { id: "n8n", name: "n8n", shortDesc: "업무 자동화 워크플로우 플랫폼", path: "/n8n", accessUrl: "https://n8n.kolmar.co.kr", color: "#EA580C", bg: "#FFF7ED", icon: "automation" },
  { id: "pa", name: "Power Automate", shortDesc: "Microsoft Power Automate 기반 자동화", path: "/pa", accessUrl: null, color: "#0078D4", bg: "#EFF6FF", icon: "pa" },
  { id: "assistant", name: "나만의 비서", shortDesc: "HK GPT를 업무·개인에 맞게 커스터마이징한 에이전트 모음", path: "/assistant", accessUrl: "https://assistant.kolmar.co.kr", color: "#2563EB", bg: "#DBEAFE", icon: "assistant" },
  { id: "ai-orchestration", name: "AI Agent", shortDesc: "업무에 맞는 AI 모델을 선택하여 연결", path: "/ai-orchestration", accessUrl: "https://ai-gateway.kolmar.co.kr", color: "#7C3AED", bg: "#F5F3FF", icon: "orchestration" },
  { id: "ml", name: "ML 모델", shortDesc: "머신러닝 모델 개발·배포·운영", path: "/ml", accessUrl: null, color: "#0891B2", bg: "#ECFEFF", icon: "ml" },
  { id: "vibe", name: "Vibe Coding", shortDesc: "AI 기반 코드 생성·자동화 개발 도구", path: "/vibe", accessUrl: null, color: "#9333EA", bg: "#FAF5FF", icon: "vibe" },
];

export type PlatformItemStatus = "운영 중" | "개발 중" | "파일럿" | "보류" | "종료";

export type PlatformItem = {
  id: string;
  platformId: PlatformId;
  title: string;
  summary: string;
  description: string;
  status: PlatformItemStatus;
  dept: string;
  owner: string;
  ownerEmail: string;
  tags: string[];
  specificUrl: string;
  updatedAt: string;
  likes: number;

  // 소속/대상 관계사 (복수 선택, 관계사 코드 배열). 비워두거나 생략하면 전사 공용.
  company?: string[];

  // n8n 워크플로우 시각화 정의
  workflowDef?: {
    status: "Stable" | "Active" | "Error";
    nodes: { id: string; label: string; type: "trigger" | "condition" | "action" | "output"; n8nType?: string }[];
    edges: { from: string; to: string }[];
  };

  // n8n 워크플로우 원본 JSON (업로드된 파일 내용)
  workflowJson?: string;

  // n8n / 나만의 비서 전용 — 노드 구성·연동 앱·예상 효과
  nodes?: string[];
  connectedApps?: string[];
  expectedTimeSaved?: string;
  difficulty?: "쉬움" | "보통" | "어려움";

  // AI Agent 전용
  modelMeta?: {
    provider: string;
    contextWindow: string;
    strengths: string[];
    costTier: "낮음" | "보통" | "높음";
  };

  // ML 전용
  mlType?: string;
  trainingDataDesc?: string;
  performanceSummary?: string;
  devTool?: string;
  sourceRepo?: string;
  outputType?: string;
};

export const PLATFORM_ICON_PATH: Record<Platform["icon"], string> = {
  automation: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  assistant: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01",
  orchestration: "M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z",
  pa: "M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4m14 6V17a4 4 0 00-4-4H3",
  ml: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  vibe: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
};
