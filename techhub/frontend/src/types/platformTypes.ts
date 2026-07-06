// ===== types/platformTypes.ts =====

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
  { id: "pa", name: "Power Automate", shortDesc: "클라우드 플로우와 데스크톱 자동화(RPA)를 아우르는 Microsoft 자동화 도구", path: "/pa", accessUrl: null, color: "#0078D4", bg: "#EFF6FF", icon: "pa" },
  { id: "assistant", name: "나만의 비서", shortDesc: "HK GPT를 프롬프트·역할로 커스터마이징해 동료와 공유하는 개인/팀 에이전트", path: "/assistant", accessUrl: "https://assistant.kolmar.co.kr", color: "#2563EB", bg: "#DBEAFE", icon: "assistant" },
  { id: "ai-orchestration", name: "AI Agent", shortDesc: "업무 니즈에 맞는 AI 모델을 선택해 사용하는 사내 AI 게이트웨이(HK GPT)", path: "/ai-orchestration", accessUrl: "https://ai-gateway.kolmar.co.kr", color: "#7C3AED", bg: "#F5F3FF", icon: "orchestration" },
  { id: "ml", name: "ML 모델", shortDesc: "특정 플랫폼에 속하지 않는 독립 머신러닝 모델", path: "/ml", accessUrl: null, color: "#0891B2", bg: "#ECFEFF", icon: "ml" },
  { id: "vibe", name: "Vibe Coding", shortDesc: "AI 코딩 도구로 직접 개발된 독립 소프트웨어·자동화 스크립트", path: "/vibe", accessUrl: null, color: "#9333EA", bg: "#FAF5FF", icon: "vibe" },
];

// 유형별로 실제 운영 방식이 다르므로 상태 값도 유형별로 다르게 쓰인다.
// 아래는 6개 유형에서 실제 쓰이는 상태 문자열을 모두 모은 통합 타입이다.
export type PlatformItemStatus =
  | "운영 중"        // n8n / pa / ml
  | "테스트 중"      // n8n / pa
  | "일시 중지"      // n8n / pa
  | "사용 가능"      // assistant / ai-orchestration
  | "준비 중"        // assistant
  | "운영 중지"      // assistant / ml / vibe
  | "일부 제한"      // ai-orchestration
  | "지원 종료 예정" // ai-orchestration
  | "실험 중"        // ml
  | "사용 중"        // vibe
  | "프로토타입";    // vibe

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
  workflowJson?: string;

  // n8n / pa 공용 — 노드(커넥터) 구성·연동 앱·트리거 설명·예상 효과
  triggerAction?: string;
  nodes?: string[];
  connectedApps?: string[];
  expectedTimeSaved?: string;
  difficulty?: "쉬움" | "보통" | "어려움";

  // pa 전용
  flowType?: string;
  runMode?: string;
  connectorTier?: string;

  // 나만의 비서(assistant) 전용
  shareScope?: string;
  sharedPrompt?: string;
  basedModel?: string;
  roleDefinition?: string;
  connectedData?: string;
  sampleQuestions?: string[];

  // AI Agent(ai-orchestration) 전용
  modelMeta?: {
    provider: string;
    modelName?: string;
    contextWindow: string; // 쉬운 표현으로 저장 (예: "문서 여러 장 (수십 페이지)")
    strengths: string[];
    strengthsDetail?: string;
    tokenUsageNote?: string;
    costTier: "낮음" | "보통" | "높음";
    useCases?: string[];
  };

  // ML 전용
  mlType?: string;
  trainingDataDesc?: string;
  performanceSummary?: string;

  // ML / Vibe 공용
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