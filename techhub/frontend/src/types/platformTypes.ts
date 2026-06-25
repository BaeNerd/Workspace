/* ============================================================
   파일: src/types/platform.ts
   플랫폼(n8n / 나만의 비서 / AI Orchestration) 공통 타입.

   설계 원칙:
   - Project와 별개 엔티티. Project 데이터 모델은 건드리지 않음.
   - PlatformItem은 MK-01 검색 결과에 Project와 함께 섞여 나타남
     (사용자 입장에서는 "검색되는 항목"이라는 점에서 동일하게 취급).
   - 각 플랫폼 전용 페이지(/n8n, /assistant, /ai-orchestration)는
     PlatformItem 중 platformId가 일치하는 것만 필터링해서 보여주는
     전용 카탈로그 뷰.
   ============================================================ */

export type PlatformId = "n8n" | "assistant" | "ai-orchestration";

export type Platform = {
  id: PlatformId;
  name: string;
  shortDesc: string;
  path: string;        // Tech Hub 내부 카탈로그 페이지 경로
  accessUrl: string;   // 실제 플랫폼 진입 URL (외부 또는 사내 인스턴스)
  color: string;        // 배지/강조 색상
  bg: string;
  icon: "automation" | "assistant" | "orchestration";
};

// TODO: 실제 연동 시 GET /api/v1/platforms 응답으로 교체
export const PLATFORMS: Platform[] = [
  {
    id: "n8n",
    name: "n8n",
    shortDesc: "업무 자동화 워크플로우 플랫폼",
    path: "/n8n",
    accessUrl: "https://n8n.kolmar.co.kr",
    color: "#EA580C",
    bg: "#FFF7ED",
    icon: "automation",
  },
  {
    id: "assistant",
    name: "나만의 비서",
    shortDesc: "업무별 맞춤 LLM 에이전트 모음",
    path: "/assistant",
    accessUrl: "https://assistant.kolmar.co.kr",
    color: "#2563EB",
    bg: "#EFF6FF",
    icon: "assistant",
  },
  {
    id: "ai-orchestration",
    name: "AI Orchestration",
    shortDesc: "업무에 맞는 AI 모델을 선택하여 연결",
    path: "/ai-orchestration",
    accessUrl: "https://ai-gateway.kolmar.co.kr",
    color: "#7C3AED",
    bg: "#F5F3FF",
    icon: "orchestration",
  },
];

export type PlatformItemStatus = "운영 중" | "개발 중" | "파일럿" | "보류" | "종료";

// PlatformItem: 각 플랫폼 내부의 개별 워크플로우 / 에이전트 / AI 모델 1건
// MK-01 검색 결과 카드와 동일한 정보 밀도를 갖도록 Project와 유사한 필드를 가짐.
export type PlatformItem = {
  id: string;
  platformId: PlatformId;
  title: string;
  summary: string;
  description: string;
  status: PlatformItemStatus;
  dept: string;          // 등록/관리 부서
  owner: string;         // 담당자명
  ownerEmail: string;
  tags: string[];        // 자유 태그 (예: #HR, #회계, #코드리뷰)
  specificUrl: string;   // 이 항목 개별 접근 URL (없으면 플랫폼 accessUrl로 대체)
  updatedAt: string;

  // AI Orchestration 전용 — 모델 선택 카드에만 사용
  modelMeta?: {
    provider: string;     // 예: OpenAI, Anthropic, 사내 파인튜닝
    contextWindow: string; // 예: "128K"
    strengths: string[];  // 예: ["문서 분석", "긴 컨텍스트"]
    costTier: "낮음" | "보통" | "높음";
  };
};

export const PLATFORM_ICON_PATH: Record<Platform["icon"], string> = {
  automation: "M13 2L3 14h7l-1 8 10-12h-7l1-8z", // 워크플로우/자동화 (번개)
  assistant: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01", // 챗봇 (말풍선 느낌의 원+점)
  orchestration: "M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z", // 그리드 (오케스트레이션/모델군)
};