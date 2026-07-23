// ===== pages/AssetItemDetailPage.tsx =====
/* ============================================================
   경로: /n8n/:itemId, /pa/:itemId, /assistant/:itemId,
        /ai-orchestration/:itemId, /ml/:itemId, /vibe/:itemId, /etc/:itemId
   상태·실행 버튼·관계사 표시 제거 (등록 플로우 개편). 예외: ai-orchestration의
   agentAvailability 뱃지와 모델 접속(specificUrl) 버튼만 유지.
   ============================================================ */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CATEGORIES } from "../types/categoryTypes";
import type { AssetItem, CategoryId, AssetReview } from "../types/categoryTypes";
import N8nFlowPreview from "../components/N8nFlowPreview";
import { CONTENT_MAX_WIDTH } from "../styles/layout";


const COST_TIER_COLOR: Record<string, { bg: string; color: string }> = {
  "낮음": { bg: "#DCFCE7", color: "#166534" },
  "보통": { bg: "#FEF3C7", color: "#92400E" },
  "높음": { bg: "#FEE2E2", color: "#991B1B" },
};

// ai-orchestration 이용 가능 뱃지 색 (상태 체계와 별개 축)
const AGENT_AVAIL_STYLE: Record<string, { bg: string; color: string }> = {
  "사용 가능": { bg: "#DCFCE7", color: "#166534" },
  "사용 불가": { bg: "#F1F5F9", color: "#697386" },
};

// 클립보드 복사 (공유 프롬프트 복사 버튼용)
const copyText = (t: string) => { void navigator.clipboard?.writeText(t); };

const carouselNavStyle = (side: "left" | "right"): React.CSSProperties => ({
  position: "absolute", left: side === "left" ? 10 : undefined, right: side === "right" ? 10 : undefined,
  width: 34, height: 34, borderRadius: "50%", background: "#fff", border: "1.5px solid #EBEEF3",
  cursor: "pointer", fontSize: 18, color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
});

// 이미지 캐러셀 (표시 전용, 모듈 레벨) — 상세 개요 상단. 등록 페이지 입력용과 별개.
function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;
  const safe = Math.min(idx, images.length - 1);
  const go = (d: number) => setIdx((safe + d + images.length) % images.length);
  return (
    <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6F9", borderRadius: 8, minHeight: 200, overflow: "hidden" }}>
        {images.length > 1 && <button type="button" onClick={() => go(-1)} aria-label="이전 이미지" style={carouselNavStyle("left")}>‹</button>}
        <img src={images[safe]} alt={`이미지 ${safe + 1}`} style={{ maxWidth: "100%", maxHeight: 480, objectFit: "contain", borderRadius: 6 }} />
        {images.length > 1 && <button type="button" onClick={() => go(1)} aria-label="다음 이미지" style={carouselNavStyle("right")}>›</button>}
      </div>
      {images.length > 1 && (
        <div style={{ textAlign: "center", fontSize: 12, color: "#697386", marginTop: 8 }}>{safe + 1} / {images.length}</div>
      )}
    </div>
  );
}

const POST_TAGS = ["공지", "Q&A", "이슈제보", "건의"] as const;
type PostTag = typeof POST_TAGS[number];

const POST_TAG_COLOR: Record<PostTag, { bg: string; color: string }> = {
  "공지": { bg: "#E8F0FE", color: "#1E40AF" },
  "Q&A": { bg: "#FEF3C7", color: "#92400E" },
  "이슈제보": { bg: "#FEE2E2", color: "#991B1B" },
  "건의": { bg: "#F5F3FF", color: "#6D28D9" },
};

type Post = {
  id: number;
  author: string;
  dept: string;
  date: string;
  tag: PostTag;
  text: string;
  likes: number;
  likedByMe: boolean;
};

// 상세 탭 라벨 — 유형별 성격에 맞게. vibe/etc는 상세 탭을 숨기므로 개요만 노출(폴백값만 존재).
const detailTabLabelFor = (categoryId: CategoryId): string => {
  if (categoryId === "ai-orchestration") return "모델 사양";
  if (categoryId === "assistant") return "비서 구성";
  if (categoryId === "pa") return "플로우 정보";
  if (categoryId === "ml") return "모델 정보";
  if (categoryId === "vibe") return "제작 이야기";
  if (categoryId === "etc") return "프로젝트 소개";
  return "상세 동작"; // n8n
};

// 데모용 인라인 SVG 플레이스홀더 이미지 (네트워크 의존 금지 — data URL)
const PLACEHOLDER_IMG_1 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23E8F0FE'/%3E%3Crect x='60' y='60' width='680' height='330' rx='16' fill='none' stroke='%231C6BFF' stroke-width='4'/%3E%3Ccircle cx='400' cy='225' r='72' fill='%231C6BFF' opacity='0.25'/%3E%3C/svg%3E";
const PLACEHOLDER_IMG_2 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23DCFCE7'/%3E%3Crect x='120' y='110' width='560' height='230' rx='12' fill='none' stroke='%23166534' stroke-width='4'/%3E%3Cline x1='120' y1='225' x2='680' y2='225' stroke='%23166534' stroke-width='3'/%3E%3C/svg%3E";
const PLACEHOLDER_IMG_3 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23F5F3FF'/%3E%3Crect x='90' y='90' width='300' height='90' rx='14' fill='none' stroke='%236D28D9' stroke-width='4'/%3E%3Crect x='410' y='90' width='300' height='90' rx='14' fill='%236D28D9' opacity='0.18'/%3E%3Crect x='90' y='210' width='620' height='60' rx='12' fill='%236D28D9' opacity='0.10'/%3E%3Crect x='90' y='300' width='420' height='60' rx='12' fill='%236D28D9' opacity='0.10'/%3E%3C/svg%3E";
const PLACEHOLDER_IMG_4 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23FDF2F8'/%3E%3Cpolyline points='120,300 280,180 420,240 560,120 680,190' fill='none' stroke='%23DB2777' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='280' cy='180' r='9' fill='%23DB2777'/%3E%3Ccircle cx='560' cy='120' r='9' fill='%23DB2777'/%3E%3C/svg%3E";

// TODO: 실제 연동 시 GET /api/v1/platform-items/:id 응답으로 교체
const MOCK_ITEMS: AssetItem[] = [
  {
    id: "N8N-2026-001", categoryId: "n8n",
    title: "신규 입사자 계정 자동 생성",
    summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성",
    description: "HR 시스템에 신규 입사자 정보가 등록되면 이를 감지해 AD 계정, Teams 계정, 이메일 계정을 자동으로 생성합니다.\n\n온보딩 과정에서 반복되던 수작업 계정 발급을 없애 입사 첫날부터 바로 업무 환경을 이용할 수 있도록 지원합니다.", dept: "IT인프라팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["HR", "계정자동화", "온보딩"],
    specificUrl: "https://n8n.kolmar.co.kr/workflow/001", updatedAt: "2025.06.05", likes: 19, views: 540, company: ["KKM"],
    images: [PLACEHOLDER_IMG_1, PLACEHOLDER_IMG_2],
    workflowDef: {
      status: "Stable",
      nodes: [
        { id: "1", label: "HR 시스템 신규 입사자 등록", type: "trigger" },
        { id: "2", label: "AD 계정 생성", type: "action" },
        { id: "3", label: "Teams·이메일 계정 생성", type: "action" },
        { id: "4", label: "생성 결과 담당자 통보", type: "output" },
      ],
      edges: [{ from: "1", to: "2" }, { from: "2", to: "3" }, { from: "3", to: "4" }],
    },
  },
  {
    id: "N8N-2026-002", categoryId: "n8n",
    title: "발주 승인 알림 자동화",
    summary: "구매 시스템의 발주 승인 요청을 Teams로 즉시 알림",
    description: "구매 시스템에서 발주 요청이 생성되면 승인자에게 Teams 메시지로 즉시 알림을 보내고, 승인/반려 결과를 발주 시스템에 자동 반영합니다.", dept: "구매팀", owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr",
    tags: ["구매", "승인알림", "ERP연동"], specificUrl: "https://n8n.kolmar.co.kr/workflow/002", updatedAt: "2025.06.08", likes: 7, views: 191, company: ["KKM"],
    workflowDef: {
      status: "Stable",
      nodes: [
        { id: "1", label: "발주 요청 Webhook", type: "trigger" },
        { id: "2", label: "승인자 Teams 알림", type: "action" },
        { id: "3", label: "발주 시스템 업데이트", type: "output" },
      ],
      edges: [{ from: "1", to: "2" }, { from: "2", to: "3" }],
    },
  },
  {
    id: "N8N-2026-003", categoryId: "n8n",
    title: "일일 매출 리포트 자동 발송",
    summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송",
    description: "ERP 매출 데이터를 집계하여 매일 오전 경영진 메일링 리스트에 전일 매출 요약 리포트를 자동으로 발송합니다.", dept: "재무팀", owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr",
    tags: ["매출리포트", "ERP", "자동발송"], specificUrl: "https://n8n.kolmar.co.kr/workflow/003", updatedAt: "2025.06.12", likes: 12, views: 387, company: ["KKM", "KMG"],
    workflowDef: {
      status: "Stable",
      nodes: [
        { id: "1", label: "Schedule Trigger", type: "trigger" },
        { id: "2", label: "ERP 매출 데이터 집계", type: "action" },
        { id: "3", label: "리포트 생성", type: "action" },
        { id: "4", label: "경영진 메일 발송", type: "output" },
      ],
      edges: [{ from: "1", to: "2" }, { from: "2", to: "3" }, { from: "3", to: "4" }],
    },
  },
  {
    id: "N8N-2026-004", categoryId: "n8n",
    title: "품질 이슈 발생 시 즉시 에스컬레이션",
    summary: "품질관리 시스템 이상 감지 시 관련 부서에 즉시 알림",
    description: "생산 품질관리 시스템에서 기준치 이탈이 감지되면 품질관리팀, 생산본부, 관련 연구소에 동시에 Teams 알림을 발송합니다.", dept: "품질관리팀", owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr",
    tags: ["품질관리", "에스컬레이션", "생산"], specificUrl: "https://n8n.kolmar.co.kr/workflow/004", updatedAt: "2025.06.18", likes: 3, views: 148, company: ["KMW"],
    workflowDef: {
      status: "Active",
      nodes: [
        { id: "1", label: "이상 감지 Webhook", type: "trigger" },
        { id: "2", label: "이상 수준 판별", type: "condition" },
        { id: "3", label: "관련 부서 Teams 알림", type: "output" },
      ],
      edges: [{ from: "1", to: "2" }, { from: "2", to: "3" }],
    },
  },
  {
    id: "PA-2026-001", categoryId: "pa",
    title: "결재 문서 SharePoint 자동 저장",
    summary: "전자결재 완료 시 문서를 SharePoint 지정 폴더에 자동으로 보관",
    description: "전자결재가 완료되면 문서를 SharePoint의 지정된 폴더에 자동으로 업로드하여 별도의 수기 보관 작업 없이 문서를 정리합니다.", dept: "경영지원팀", owner: "최유진", ownerEmail: "yujin.choi@kolmar.co.kr",
    tags: ["SharePoint", "전자결재", "문서관리"],
    specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-001", updatedAt: "2025.07.01", likes: 12, views: 382, company: ["KKM"],
    images: [PLACEHOLDER_IMG_2, PLACEHOLDER_IMG_1],
    triggerAction: "전자결재 완료 → SharePoint 지정 폴더에 문서 자동 업로드",
  },
  {
    id: "ML-2026-001", categoryId: "ml",
    title: "조색 예측 ML 모델",
    summary: "원료 배합 비율로 최종 색상을 예측하는 회귀 모델",
    description: "원료 배합 비율을 입력하면 최종 제품의 색상값을 예측하여, 반복적인 시험 조색 작업을 줄여줍니다.", dept: "메이크업연구소", owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr",
    tags: ["TensorFlow", "회귀모델", "색상예측"],
    specificUrl: "https://gitlab.kolmar.co.kr/ml/color-prediction", updatedAt: "2025.06.01", likes: 21, views: 723, company: ["KKM"],
    images: [PLACEHOLDER_IMG_2, PLACEHOLDER_IMG_1],
    mlType: "회귀 (Regression)",
    trainingDataDesc: "최근 2년 생산 배합 데이터 8,000건",
    performanceSummary: "평균 오차 3% 이내",
    devTool: "TensorFlow",
    outputType: "예측 색상값 (RGB)",
    sourceRepo: "gitlab.kolmar.co.kr/ml/color-prediction",
  },
  {
    id: "VIBE-2026-001", categoryId: "vibe",
    title: "일일 판매 리포트 자동 생성기",
    summary: "ERP 데이터를 읽어 매일 아침 판매 실적 요약 리포트를 Slack으로 발송",
    description: "매일 아침 ERP 판매 데이터를 읽어 요약 리포트를 생성하고 영업기획팀 Slack 채널로 자동 발송합니다.", dept: "영업기획팀", owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr",
    tags: ["ERP", "Slack", "리포트자동화"],
    specificUrl: "", updatedAt: "2025.07.05", likes: 8, views: 262, company: ["KKM"],
    images: [PLACEHOLDER_IMG_4, PLACEHOLDER_IMG_2],
    devTool: "Cursor, Claude",
    outputType: "Python 스크립트 + Slack 알림",
    sourceRepo: "gitlab.kolmar.co.kr/vibe/daily-sales-report",
  },
  {
    id: "AST-2026-001", categoryId: "assistant", title: "법무 검토 보조 봇",
    summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시",
    description: "업로드된 계약서 초안에서 표준 계약서와 다른 조항, 위험 요소가 있는 조항을 자동으로 식별하고 검토 포인트를 제시합니다.", dept: "법무팀", owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr",
    tags: ["법무", "계약서검토", "위험분석"],
    specificUrl: "https://assistant.kolmar.co.kr/agents/legal-review", updatedAt: "2025.06.10", likes: 25, views: 303, company: [],
    images: [PLACEHOLDER_IMG_3, PLACEHOLDER_IMG_1],
    basedModel: "Claude Opus 4.8",
    sharedPrompt: "당신은 계약서를 검토하는 법무 담당자입니다. 업로드된 계약서에서 위험 조항을 찾아 표로 정리해 주세요.",
  },
  {
    id: "AST-2026-002", categoryId: "assistant", title: "회의록 요약 봇",
    summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리",
    description: "Teams 회의 녹음 파일 또는 자막을 업로드하면 핵심 논의 내용, 결정 사항, 액션 아이템을 구조화하여 정리해줍니다.", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["회의록", "요약", "Teams연동"],
    specificUrl: "https://assistant.kolmar.co.kr/agents/meeting-summary", updatedAt: "2025.06.14", likes: 18, views: 257, company: [],
    basedModel: "GPT-5.4",
    sharedPrompt: "당신은 회의록을 정리하는 비서입니다. 업로드된 녹취록에서 결정사항과 액션 아이템을 표로 정리해 주세요.",
  },
  {
    id: "AST-2026-003", categoryId: "assistant", title: "코드 리뷰 어시스턴트",
    summary: "GitHub PR에 자동으로 코드 리뷰 코멘트를 남기는 봇",
    description: "Pull Request가 생성되면 코드 스타일, 잠재적 버그, 보안 이슈를 자동으로 분석하여 리뷰 코멘트를 남깁니다.", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["코드리뷰", "GitHub", "개발도구"],
    specificUrl: "https://assistant.kolmar.co.kr/agents/code-review", updatedAt: "2025.06.19", likes: 10, views: 187, company: [],
    basedModel: "Claude Sonnet 5",
    sharedPrompt: "당신은 시니어 개발자입니다. 변경된 코드에서 버그 가능성과 스타일 이슈를 찾아 코멘트로 남겨주세요.",
  },
  {
    id: "AST-2026-004", categoryId: "assistant", title: "원료 안전성 문의 봇",
    summary: "원료의 MSDS·규제 정보를 빠르게 조회하는 연구원용 봇",
    description: "원료명을 입력하면 MSDS 정보, 국가별 사용 제한 규제, 과거 클레임 이력을 통합 조회하여 답변합니다.", dept: "메이크업연구소", owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr",
    tags: ["원료", "MSDS", "규제정보"],
    specificUrl: "https://assistant.kolmar.co.kr/agents/ingredient-safety", updatedAt: "2025.06.20", likes: 5, views: 120, company: ["KKM"],
    basedModel: "GPT-5.4",
    sharedPrompt: "당신은 원료 안전성 전문가입니다. 입력된 원료명에 대한 MSDS 정보와 국가별 규제를 요약해 주세요.",
  },
  // AI Model 카탈로그 (11건)
  {
    id: "AIO-2026-001", categoryId: "ai-orchestration", agentAvailability: "사용 가능", title: "GPT-5.4",
    summary: "범용 업무 전반에 무난한 기본 선택지입니다.",
    description: "OpenAI의 범용 대표 모델로, 업무 전반에 무난한 기본 선택지입니다. 최신 지식 반영이 좋고 응답 속도가 빨라 이메일·보고서 초안, 일반 질의응답, 문서 제작·편집에 두루 적합합니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["범용", "빠른 응답", "문서 작성"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 38, views: 685, company: [],
    modelMeta: {
      provider: "OpenAI", modelName: "GPT-5.4",
      contextWindow: "매우 긴 문서 (책 한 권 분량)",
      strengths: ["범용", "빠른 응답", "문서 작성"],
      strengthsDetail: "범용 업무 전반에 무난한 기본 선택지입니다. 최신 지식 반영이 좋고 응답 속도가 빨라 이메일·보고서 초안, 일반 질의응답, 문서 제작·편집에 두루 적합합니다. 어떤 모델을 써야 할지 모르겠다면 이 모델부터 시작하세요.",
      tokenUsageNote: "문서 10페이지 요약 시 약 1.1만~1.3만 토큰",
      costTier: "보통", useCases: ["이메일·보고서 초안", "일반 질의응답", "문서 제작·편집"],
    },
  },
  {
    id: "AIO-2026-002", categoryId: "ai-orchestration", agentAvailability: "사용 가능", title: "GPT-5.4 Mini",
    summary: "단순하고 반복적인 작업을 빠르고 저렴하게 처리합니다.",
    description: "OpenAI의 경량 모델로, 단순하고 반복적인 작업을 빠르고 저렴하게 처리합니다. 본 모델(GPT-5.4) 대비 약 1/3 비용으로, 분류·정리·짧은 요약·코딩 보조처럼 양이 많은 일상 작업에 적합합니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["저비용", "반복 작업", "코딩 보조"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 22, views: 387, company: [],
    modelMeta: {
      provider: "OpenAI", modelName: "GPT-5.4 Mini",
      contextWindow: "문서 여러 장 (수십 페이지)",
      strengths: ["저비용", "반복 작업", "코딩 보조"],
      strengthsDetail: "단순하고 반복적인 작업을 빠르고 저렴하게 처리합니다. 본 모델(GPT-5.4) 대비 약 1/3 비용으로, 분류·정리·짧은 요약·코딩 보조처럼 양이 많은 일상 작업에 적합합니다.",
      tokenUsageNote: "문서 10페이지 요약 시 약 1.1만 토큰",
      costTier: "낮음", useCases: ["대량 텍스트 분류·정리", "짧은 요약", "코드 스니펫 보조"],
    },
  },
  {
    id: "AIO-2026-003", categoryId: "ai-orchestration", agentAvailability: "사용 가능", title: "Claude Opus 4.8",
    summary: "가장 어려운 문제를 끝까지 푸는 데 강한 최상위 모델입니다.",
    description: "Anthropic의 최상위 모델로, 가장 어려운 문제를 끝까지 푸는 데 강합니다. 복잡한 추론, 에이전트형 코딩, 여러 단계를 거치는 심층 분석에 적합합니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["복잡한 추론", "에이전트 코딩", "다단계 분석"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 29, views: 531, company: [],
    modelMeta: {
      provider: "Anthropic", modelName: "Claude Opus 4.8",
      contextWindow: "매우 긴 문서 (책 한 권 분량)",
      strengths: ["복잡한 추론", "에이전트 코딩", "다단계 분석"],
      strengthsDetail: "가장 어려운 문제를 끝까지 푸는 데 강한 최상위 모델입니다. 복잡한 추론, 에이전트형 코딩, 여러 단계를 거치는 심층 분석에 적합합니다. 비용이 높으므로 일상 업무보다는 난도 높은 과제에 선택적으로 사용하세요.",
      tokenUsageNote: "문서 10페이지 요약 시 약 1.2만 토큰",
      costTier: "높음", useCases: ["복잡한 기술 검토", "다단계 데이터 분석", "대규모 코드 작업"],
    },
  },
  {
    id: "AIO-2026-004", categoryId: "ai-orchestration", agentAvailability: "사용 가능", title: "Claude Sonnet 4.6",
    summary: "일상 업무의 기본기가 가장 균형 잡힌 모델입니다.",
    description: "Anthropic의 균형형 모델로, 일상 업무의 기본기가 가장 탄탄합니다. 문서 요약, 회의록 정리, 계약서 검토처럼 긴 글을 읽고 정확하게 정리하는 일에 특히 강합니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["문서 분석", "균형", "긴 문서"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 35, views: 694, company: [],
    images: [PLACEHOLDER_IMG_1],
    modelMeta: {
      provider: "Anthropic", modelName: "Claude Sonnet 4.6",
      contextWindow: "매우 긴 문서 (책 한 권 분량)",
      strengths: ["문서 분석", "균형", "긴 문서"],
      strengthsDetail: "일상 업무의 기본기가 가장 균형 잡힌 모델입니다. 문서 요약, 회의록 정리, 계약서 검토처럼 긴 글을 읽고 정확하게 정리하는 일에 특히 강하며, 대부분의 사무 업무를 안정적으로 처리합니다.",
      tokenUsageNote: "문서 10페이지 요약 시 약 1.2만 토큰",
      costTier: "보통", useCases: ["문서 요약", "회의록 정리", "계약서·규정 검토"],
    },
  },
  {
    id: "AIO-2026-005", categoryId: "ai-orchestration", agentAvailability: "사용 가능", title: "Claude Haiku 4.5",
    summary: "가장 빠른 응답이 필요할 때 선택합니다.",
    description: "Anthropic의 초경량 모델로, 가장 빠른 응답이 필요할 때 선택합니다. 텍스트 분류, 정보 추출, 1차 응대처럼 짧고 많은 요청을 대량으로 처리하는 업무에 적합하며 비용도 낮습니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["최고 속도", "분류·추출", "대량 처리"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 18, views: 336, company: [],
    modelMeta: {
      provider: "Anthropic", modelName: "Claude Haiku 4.5",
      contextWindow: "문서 여러 장 (수십 페이지)",
      strengths: ["최고 속도", "분류·추출", "대량 처리"],
      strengthsDetail: "가장 빠른 응답이 필요할 때 선택합니다. 텍스트 분류, 정보 추출, 1차 응대처럼 짧고 많은 요청을 대량으로 처리하는 업무에 적합하며 비용도 낮습니다.",
      tokenUsageNote: "문서 10페이지 요약 시 약 1.2만 토큰",
      costTier: "낮음", useCases: ["텍스트 분류", "핵심 정보 추출", "정형 데이터 변환"],
    },
  },
  {
    id: "AIO-2026-006", categoryId: "ai-orchestration", agentAvailability: "사용 가능", title: "Gemini 3.1 Pro",
    summary: "아주 긴 문서에서 필요한 내용을 찾아내는 검색형 작업에 강합니다.",
    description: "Google의 대형 모델로, 아주 긴 문서에서 필요한 내용을 찾아내는 검색형 작업과 추상적 추론에 강하며, 같은 급 모델 대비 비용 효율이 좋습니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["긴 문서 검색", "이미지 분석", "비용 효율"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 15, views: 300, company: [],
    modelMeta: {
      provider: "Google", modelName: "Gemini 3.1 Pro",
      contextWindow: "매우 긴 문서 (책 한 권 분량)",
      strengths: ["긴 문서 검색", "이미지 분석", "비용 효율"],
      strengthsDetail: "아주 긴 문서에서 필요한 내용을 찾아내는 검색형 작업과 추상적 추론에 강하며, 같은 급 모델 대비 비용 효율이 좋습니다. 이미지를 함께 넣어 분석할 수 있습니다.",
      tokenUsageNote: "문서 10페이지 요약 시 약 1.1만 토큰",
      costTier: "보통", useCases: ["장문 자료 검색·질의", "이미지 포함 문서 분석"],
    },
  },
  {
    id: "AIO-2026-007", categoryId: "ai-orchestration", agentAvailability: "사용 가능", title: "Gemini 3.5 Flash",
    summary: "도구 연동이 필요한 에이전트 작업을 빠르고 저렴하게 처리합니다.",
    description: "Google의 경량 멀티모달 모델로, 도구 연동이 필요한 에이전트 작업과 이미지·영상을 다루는 작업을 빠르고 저렴하게 처리합니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["도구 연동", "멀티모달", "빠른 처리"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 11, views: 234, company: [],
    modelMeta: {
      provider: "Google", modelName: "Gemini 3.5 Flash",
      contextWindow: "매우 긴 문서 (책 한 권 분량)",
      strengths: ["도구 연동", "멀티모달", "빠른 처리"],
      strengthsDetail: "도구 연동이 필요한 에이전트 작업과 이미지·영상을 다루는 멀티모달 작업을 빠르고 저렴하게 처리합니다. 속도와 비용을 함께 챙겨야 하는 자동화 시나리오에 적합합니다.",
      tokenUsageNote: "문서 10페이지 요약 시 약 1.1만 토큰",
      costTier: "낮음", useCases: ["외부 도구 연동 자동화", "이미지·영상 내용 파악"],
    },
  },
  {
    id: "AIO-2026-008", categoryId: "ai-orchestration", agentAvailability: "사용 가능", title: "EXAONE 4.5",
    summary: "계약서, 도면, 재무제표 등 산업 현장 문서를 시각적으로 이해하는 데 특화되어 있습니다.",
    description: "LG AI의 국산 모델로, 계약서·도면·재무제표·스캔 문서처럼 표와 서식이 섞인 산업 현장 문서를 시각적으로 이해하는 데 특화되어 있으며 한국어 처리가 강합니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["산업 문서", "시각적 이해", "한국어"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 8, views: 206, company: [],
    modelMeta: {
      provider: "LG AI", modelName: "EXAONE 4.5",
      contextWindow: "문서 여러 장 (수십 페이지)",
      strengths: ["산업 문서", "시각적 이해", "한국어"],
      strengthsDetail: "계약서, 도면, 재무제표, 스캔 문서처럼 표와 서식이 섞인 산업 현장 문서를 시각적으로 이해하는 데 특화되어 있으며 한국어 처리가 강합니다. 국내 업무 문서 분석에 우선 검토할 모델입니다.",
      tokenUsageNote: "문서 10페이지(이미지 포함) 분석 시 약 1.5만 토큰",
      costTier: "낮음", useCases: ["스캔 문서·도면 판독", "표 중심 서류 분석"],
    },
  },
  {
    id: "AIO-2026-009", categoryId: "ai-orchestration", agentAvailability: "사용 가능", title: "Solar Pro 3",
    summary: "한국어 업무 문서 처리와 에이전트 작업에 강한 국산 모델입니다.",
    description: "Upstage의 국산 모델로, 한국어 업무 문서 처리와 에이전트 작업에 강합니다. 응답이 빠르고 비용이 낮아 한국어 중심의 일상 문서 업무에 부담 없이 사용할 수 있습니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["한국어 문서", "빠른 응답", "저비용"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 7, views: 168, company: [],
    modelMeta: {
      provider: "Upstage", modelName: "Solar Pro 3",
      contextWindow: "문서 여러 장 (수십 페이지)",
      strengths: ["한국어 문서", "빠른 응답", "저비용"],
      strengthsDetail: "한국어 업무 문서 처리와 에이전트 작업에 강한 국산 모델입니다. 응답이 빠르고 비용이 낮아 한국어 중심의 일상 문서 업무에 부담 없이 사용할 수 있습니다.",
      tokenUsageNote: "문서 10페이지 요약 시 약 1.1만 토큰",
      costTier: "낮음", useCases: ["한국어 문서 요약·작성", "사내 문서 기반 질의응답"],
    },
  },
  {
    id: "AIO-2026-010", categoryId: "ai-orchestration", agentAvailability: "사용 가능", title: "웍스 대표 모델",
    summary: "무엇을 골라야 할지 모를 때 쓰는 사내 기본 모델입니다.",
    description: "무엇을 골라야 할지 모를 때 쓰는 사내 기본 모델입니다. 현재 GPT-5.4를 기반으로 하며, 웍스 정책에 따라 항상 최신 모델로 수시 교체됩니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["사내 기본", "최신 유지", "고민 불필요"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 44, views: 1158, company: [],
    modelMeta: {
      provider: "웍스 대표 모델", modelName: "현재 GPT-5.4 기반",
      contextWindow: "매우 긴 문서 (책 한 권 분량)",
      strengths: ["사내 기본", "최신 유지", "고민 불필요"],
      strengthsDetail: "무엇을 골라야 할지 모를 때 쓰는 사내 기본 모델입니다. 현재 GPT-5.4를 기반으로 하며, 웍스 정책에 따라 항상 최신 모델로 수시 교체됩니다. 세부 특성은 GPT-5.4 카드를 참고하세요.",
      tokenUsageNote: "문서 10페이지 요약 시 약 1.1만~1.3만 토큰",
      costTier: "보통", useCases: ["일반 업무 전반 (기본 선택지)"],
    },
  },
  {
    id: "PA-2026-002", categoryId: "pa",
    title: "양식 제출 → Teams 알림 플로우",
    summary: "Microsoft Forms 제출 시 담당자에게 Teams 메시지 및 이메일 동시 발송",
    description: "Microsoft Forms에서 양식이 제출되면 담당자에게 Teams 메시지와 이메일을 동시에 발송하여 빠른 처리가 가능하도록 지원합니다.", dept: "인사팀", owner: "김민지", ownerEmail: "minji.kim@kolmar.co.kr",
    tags: ["Forms", "Teams", "알림"],
    specificUrl: "", updatedAt: "2025.06.15", likes: 8, views: 180, company: [],
    triggerAction: "Forms 제출 완료 → Teams 메시지 + 이메일 동시 발송",
  },
  {
    id: "PA-2026-003", categoryId: "pa",
    title: "팀 주간 보고서 Teams 자동 게시",
    summary: "SharePoint에 업로드된 주간 보고서를 매주 월요일 Teams 채널에 자동으로 게시",
    description: "매주 월요일 SharePoint 문서 라이브러리를 확인하여 최신 주간 보고서를 Teams 채널에 링크와 요약을 포함해 자동으로 게시합니다.", dept: "기획팀", owner: "이지원", ownerEmail: "jiwon.lee@kolmar.co.kr",
    tags: ["Teams", "SharePoint", "주간보고서"],
    specificUrl: "", updatedAt: "2025.07.04", likes: 15, views: 361, company: [],
    triggerAction: "매주 월요일 → SharePoint 최신 보고서 읽기 → Teams 채널 게시",
  },
  {
    id: "ML-2026-002", categoryId: "ml",
    title: "원료 수요 예측 모델",
    summary: "과거 생산·판매 데이터를 기반으로 월별 원료 수요를 예측하는 시계열 모델",
    description: "과거 생산 및 판매 데이터를 분석하여 향후 월별 원료 수요를 예측합니다. 구매팀의 재고 계획 수립에 활용됩니다.", dept: "구매팀", owner: "이재훈", ownerEmail: "jaehoon.lee@kolmar.co.kr",
    tags: ["수요예측", "시계열", "구매"],
    specificUrl: "", updatedAt: "2025.06.20", likes: 9, views: 273, company: ["KKM", "KBH"],
    mlType: "시계열 예측 (Time-Series)",
    trainingDataDesc: "최근 3년 생산·판매 데이터 15,000건",
    performanceSummary: "RMSE 12.4 (검증셋 기준)",
    devTool: "Python, Prophet",
    outputType: "월별 수요 예측값 (Excel)",
    sourceRepo: "gitlab.kolmar.co.kr/ml/demand-forecast",
  },
  {
    id: "VIBE-2026-002", categoryId: "vibe",
    title: "원가 분석 자동화 스크립트",
    summary: "ERP 원가 데이터를 읽어 제품별 원가 분석 리포트를 자동 생성하는 Python 스크립트",
    description: "ERP에서 원가 데이터를 추출하여 제품별 원가 구조를 분석하고 Excel 리포트를 자동 생성합니다. 재무팀의 월별 원가 검토 업무 시간을 단축합니다.", dept: "재무팀", owner: "오현진", ownerEmail: "hyunjin.oh@kolmar.co.kr",
    tags: ["원가분석", "Python", "ERP"],
    specificUrl: "", updatedAt: "2025.06.21", likes: 6, views: 159, company: ["KMG"],
    devTool: "ChatGPT",
    outputType: "Python 스크립트 + Excel 리포트",
    sourceRepo: "gitlab.kolmar.co.kr/vibe/cost-analysis",
  },
  // ── 추가 n8n ──────────────────────────────────────────────────────────────
  { id: "N8N-2026-005", categoryId: "n8n", title: "Outlook 긴급 메일 자동 전달",
    summary: "긴급 키워드 메일 수신 시 팀장에게 즉시 자동 전달",
    description: "수신 메일 제목·본문에 '긴급', '즉시', 'ASAP' 등 키워드가 포함된 경우 팀장 이메일로 즉시 자동 전달하며 Teams 알림도 함께 발송합니다. 중요 메일 누락을 방지합니다.", dept: "IT인프라팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["Outlook", "긴급메일", "알림"], specificUrl: "https://n8n.kolmar.co.kr/workflow/005", updatedAt: "2025.07.03", likes: 22, views: 633, company: ["KKM"],
    triggerAction: "메일 수신(키워드 감지) → 팀장에게 전달 + Teams 알림",
    expectedTimeSaved: "건당 2~3분 절약", difficulty: "쉬움",
  },
  { id: "N8N-2026-006", categoryId: "n8n", title: "주간 재고 현황 자동 취합",
    summary: "매주 월요일 각 창고의 재고 데이터를 취합해 경영진에게 요약 메일 발송",
    description: "ERP에서 각 창고별 재고 현황을 자동 취합하여 매주 월요일 오전 7시 경영진과 구매팀 담당자에게 요약 메일을 발송합니다. 재고 현황 보고 시간을 없앱니다.", dept: "구매팀", owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr",
    tags: ["재고관리", "ERP", "자동발송"], specificUrl: "https://n8n.kolmar.co.kr/workflow/006", updatedAt: "2025.07.02", likes: 8, views: 219, company: ["KKM", "KBH"],
    triggerAction: "매주 월요일 오전 7시 → ERP 재고 조회 → 요약 메일 발송",
    expectedTimeSaved: "주당 2~3시간 절약", difficulty: "보통",
  },
  { id: "N8N-2026-007", categoryId: "n8n", title: "연구원 출장 신청 자동 처리",
    summary: "출장 신청서 제출 시 결재 라인을 자동으로 설정하고 일정·항공편 조회 링크 발송",
    description: "연구원이 출장 신청서를 제출하면 직위·행선지에 따라 결재 라인을 자동으로 설정하고, 항공편 및 숙박 조회 링크를 자동 발송합니다.", dept: "메이크업연구소", owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr",
    tags: ["출장관리", "HR", "일정"], specificUrl: "", updatedAt: "2025.06.25", likes: 5, views: 160, company: ["KKM"],
    triggerAction: "출장 신청서 제출 → 결재 라인 자동 설정 → 항공·숙박 조회 링크 발송",
    expectedTimeSaved: "건당 15~20분 절약", difficulty: "보통",
  },
  { id: "N8N-2026-008", categoryId: "n8n", title: "생산 실적 KPI 일일 집계",
    summary: "생산 시스템에서 라인별 실적을 자동 집계해 품질·생산팀에 공유",
    description: "매일 오후 6시 생산 시스템에서 라인별 생산량·불량률·가동률 등 KPI를 자동 집계하여 품질관리팀과 생산팀에 이메일·Teams 알림으로 공유합니다.", dept: "품질관리팀", owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr",
    tags: ["생산실적", "KPI", "집계"], specificUrl: "https://n8n.kolmar.co.kr/workflow/008", updatedAt: "2025.07.05", likes: 10, views: 278, company: ["KKM", "KMW"],
    triggerAction: "매일 오후 6시 → 생산 시스템 조회 → KPI 집계 → Teams·이메일 발송",
    expectedTimeSaved: "일 30~40분 절약", difficulty: "보통",
  },
  { id: "N8N-2026-009", categoryId: "n8n", title: "SAP 전표 오류 실시간 알림",
    summary: "SAP 전표 처리 중 오류 감지 시 담당자에게 즉시 Teams 알림 발송",
    description: "SAP ERP 전표 처리 오류 발생 시 실시간으로 담당 재무팀원에게 Teams 알림과 이메일을 동시 발송합니다. 오류 코드와 해결 방법 링크도 함께 제공합니다.", dept: "재무팀", owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr",
    tags: ["SAP", "ERP오류", "Teams알림"], specificUrl: "https://n8n.kolmar.co.kr/workflow/009", updatedAt: "2025.05.20", likes: 4, views: 171, company: ["KKM"],
    triggerAction: "SAP 오류 이벤트 → 담당자 Teams 알림 + 이메일",
    expectedTimeSaved: "오류 인지 시간 평균 30분 단축", difficulty: "어려움",
  },
  { id: "N8N-2026-010", categoryId: "n8n", title: "구 Slack 장애 알림 자동화",
    summary: "시스템 장애 감지 시 Slack 채널에 자동 알림을 발송하던 워크플로우",
    description: "서버·네트워크 장애 감지 시 Slack #incident 채널에 자동 알림을 발송하던 워크플로우입니다. 2024년 9월 Teams 전환 후 N8N-2026-001로 이관 완료했습니다.", dept: "IT인프라팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["Slack", "장애알림", "레거시"], specificUrl: "", updatedAt: "2024.09.01", likes: 2, views: 76, company: ["KKM"],
    triggerAction: "(운영 종료) 서버 장애 감지 → Slack 채널 알림",
    difficulty: "쉬움",
  },
  // ── 추가 Power Automate ────────────────────────────────────────────────────
  { id: "PA-2026-004", categoryId: "pa", title: "재고 부족 알림 자동화",
    summary: "ERP 재고 수준이 기준치 이하로 내려가면 구매 담당자에게 즉시 Teams 알림 발송",
    description: "ERP 재고 수준이 설정한 기준치 이하로 떨어지면 구매 담당자에게 즉시 Teams 알림과 이메일을 발송합니다. 재고 소진 전 선제적 발주를 돕습니다.", dept: "구매팀", owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr",
    tags: ["재고관리", "ERP", "알림"], specificUrl: "", updatedAt: "2025.06.22", likes: 7, views: 278, company: ["KKM"],
    triggerAction: "ERP 재고 임계치 이하 → 구매 담당자 Teams 알림 + 이메일",
  },
  { id: "PA-2026-005", categoryId: "pa", title: "계약 만료 사전 알림 플로우",
    summary: "계약 만료 30일·7일 전 계약 담당자에게 자동으로 갱신 알림 이메일 발송",
    description: "계약 만료 30일·7일 전 계약 담당자에게 자동으로 갱신 알림 이메일을 발송합니다. SharePoint 계약 목록을 매일 스캔하여 만료 예정 건을 조회합니다.", dept: "법무팀", owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr",
    tags: ["계약관리", "알림", "법무"], specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-005", updatedAt: "2025.07.06", likes: 11, views: 375, company: [],
    triggerAction: "매일 자정 → SharePoint 계약 목록 스캔 → 만료 예정 건 알림 이메일 발송",
  },
  { id: "PA-2026-006", categoryId: "pa", title: "신규 공급사 등록 승인 워크플로우",
    summary: "신규 공급사 등록 요청 시 구매·재무·법무 순서로 단계별 승인 자동 진행",
    description: "신규 공급사 등록 요청이 제출되면 구매 → 재무 → 법무 순서로 단계별 전자 승인을 자동 진행합니다. 각 단계 담당자에게 승인 요청 메일이 순차 발송됩니다.", dept: "구매팀", owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr",
    tags: ["공급사관리", "승인워크플로우", "ERP"], specificUrl: "", updatedAt: "2025.06.28", likes: 6, views: 213, company: ["KKM", "KBH", "HC"],
    triggerAction: "공급사 등록 양식 제출 → 구매팀 승인 → 재무팀 승인 → 법무팀 승인 → ERP 등록",
  },
  { id: "PA-2026-007", categoryId: "pa", title: "임직원 경비 청구 자동 검증",
    summary: "제출된 경비 청구서의 항목·금액을 사규 기준으로 자동 검증하고 이상 건 재무팀에 알림",
    description: "임직원이 경비 청구서를 제출하면 사규 기준(항목 적합성, 금액 상한, 증빙 첨부 여부)을 자동으로 검증합니다. 이상 건은 재무팀에 즉시 알림이 발송됩니다.", dept: "재무팀", owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr",
    tags: ["경비청구", "내부통제", "자동검증"], specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-007", updatedAt: "2025.06.10", likes: 9, views: 339, company: [],
    triggerAction: "경비 청구서 제출 → 사규 기준 검증 → 이상 건 재무팀 알림",
  },
  { id: "PA-2026-008", categoryId: "pa", title: "수기 설비 점검 기록 디지털화",
    summary: "종이 설비 점검 체크리스트를 스캔해 SharePoint 지정 폴더에 자동으로 저장하던 플로우",
    description: "현장에서 작성한 종이 점검 체크리스트를 스캔·촬영하여 업로드하면 SharePoint 지정 폴더에 자동으로 저장하고 담당자에게 저장 완료 알림을 발송했던 플로우입니다.", dept: "IT인프라팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["설비점검", "SharePoint", "레거시"], specificUrl: "", updatedAt: "2025.03.15", likes: 1, views: 39, company: ["KMW"],
    triggerAction: "(운영 종료) 이미지 업로드 → SharePoint 저장 → 완료 알림",
  },
  // ── 추가 나만의 비서 ───────────────────────────────────────────────────────
  { id: "AST-2026-005", categoryId: "assistant", title: "영업 제안서 초안 봇",
    summary: "고객사 정보와 요구사항을 입력하면 맞춤형 제안서 초안을 자동 생성",
    description: "고객사명, 업종, 주요 요구사항을 입력하면 제품 소개·가격 조건·기대 효과가 포함된 맞춤형 제안서 초안을 자동으로 생성합니다. 영업팀의 초안 작성 시간을 단축합니다.", dept: "영업기획팀", owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr",
    tags: ["제안서", "영업지원", "문서작성"], specificUrl: "https://assistant.kolmar.co.kr/agents/proposal-draft", updatedAt: "2025.07.02", likes: 15, views: 223, company: [],
    basedModel: "GPT-5.4",
  },
  { id: "AST-2026-006", categoryId: "assistant", title: "HR 정책 문답 봇",
    summary: "복리후생·휴가·규정 등 HR 정책 질문에 즉시 답변하는 직원용 Q&A 봇",
    description: "복리후생, 휴가 규정, 취업 규칙 등 HR 정책 관련 질문을 즉시 답변하는 직원용 Q&A 봇입니다. 사내 규정 문서를 기반으로 정확한 정보를 제공합니다.", dept: "인사팀", owner: "김민지", ownerEmail: "minji.kim@kolmar.co.kr",
    tags: ["HR정책", "복리후생", "Q&A"], specificUrl: "https://assistant.kolmar.co.kr/agents/hr-policy", updatedAt: "2025.07.01", likes: 20, views: 287, company: [],
    basedModel: "Claude Sonnet 4.6",
  },
  { id: "AST-2026-007", categoryId: "assistant", title: "원자재 가격 동향 요약 봇",
    summary: "원자재 뉴스와 공시 데이터를 분석해 구매팀에 주요 가격 변동 동향 요약 제공",
    description: "원자재 관련 뉴스와 공시 데이터를 분석하여 구매팀에 주요 가격 변동 동향을 요약 제공합니다. 매주 수요일 자동 브리핑이 발송됩니다.", dept: "구매팀", owner: "이재훈", ownerEmail: "jaehoon.lee@kolmar.co.kr",
    tags: ["원자재", "가격분석", "구매"], specificUrl: "", updatedAt: "2025.06.30", likes: 8, views: 164, company: ["KKM", "KBH"],
    basedModel: "GPT-5.4",
  },
  { id: "AST-2026-008", categoryId: "assistant", title: "구매 단가 협상 전략 봇",
    summary: "공급사 견적서를 입력하면 과거 단가 이력과 비교해 협상 포인트와 전략을 제안",
    description: "공급사로부터 받은 견적서를 입력하면 과거 단가 이력 및 시장 기준가와 비교 분석하여 협상 가능한 포인트와 구체적인 전략을 제안합니다.", dept: "구매팀", owner: "이재훈", ownerEmail: "jaehoon.lee@kolmar.co.kr",
    tags: ["구매협상", "단가분석", "공급사관리"], specificUrl: "https://assistant.kolmar.co.kr/agents/purchase-strategy", updatedAt: "2025.06.28", likes: 7, views: 123, company: ["KKM", "KBH"],
    basedModel: "Claude Sonnet 4.6",
  },
  { id: "AST-2026-009", categoryId: "assistant", title: "초기 법무 계약 검토 봇 (v1)",
    summary: "계약서 위험 조항을 식별하던 초기 법무 보조 봇 (현 AST-2026-001의 전신)",
    description: "계약서 위험 조항을 식별하던 초기 법무 보조 봇입니다. 현재 운영 중인 AST-2026-001(법무 검토 보조 봇)의 전신이며, 최신 모델 전환 후 종료되었습니다.", dept: "법무팀", owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr",
    tags: ["계약서검토", "법무", "레거시"], specificUrl: "", updatedAt: "2025.12.01", likes: 3, views: 76, company: [],
    basedModel: "GPT-4 Turbo (구버전)",
  },
  // ── 추가 ML 모델 ──────────────────────────────────────────────────────────
  { id: "ML-2026-003", categoryId: "ml", title: "불량품 이미지 분류 모델",
    summary: "생산 라인 카메라 이미지로 불량품을 실시간 자동 판별하는 CNN 모델",
    description: "생산 라인에 설치된 카메라 이미지를 분석하여 불량품을 실시간으로 자동 판별하는 CNN 기반 분류 모델입니다. 육안 검사 대비 판정 속도를 10배 이상 단축합니다.", dept: "품질관리팀", owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr",
    tags: ["이미지분류", "불량검출", "CNN"], specificUrl: "", updatedAt: "2025.07.06", likes: 16, views: 312, company: ["KKM", "KMW"],
    mlType: "분류 (Classification)", trainingDataDesc: "불량품·정상품 이미지 8만 장",
    performanceSummary: "정확도 96.2% (테스트셋 기준)",
    devTool: "Python, TensorFlow, OpenCV", outputType: "실시간 판별 결과 + 불량 이미지 저장",
    sourceRepo: "gitlab.kolmar.co.kr/ml/defect-classifier",
  },
  { id: "ML-2026-004", categoryId: "ml", title: "처방 성분 상호작용 예측 모델",
    summary: "의약품 성분 조합의 부작용 가능성을 예측하는 분류 모델",
    description: "건강기능식품 성분 조합을 입력하면 부작용 가능성과 상호작용 위험도를 예측합니다. 연구원의 처방 설계 단계에서 안전성 사전 검토를 지원합니다.", dept: "건강기능식품연구소", owner: "최유진", ownerEmail: "yujin.choi@kolmar.co.kr",
    tags: ["의약품", "성분분석", "분류모델"], specificUrl: "", updatedAt: "2025.06.15", likes: 12, views: 250, company: ["KBH"],
    mlType: "분류 (Classification)", trainingDataDesc: "성분 상호작용 데이터 3만 건 (공개 논문·특허 기반)",
    performanceSummary: "F1-score 0.89 (검증셋 기준)",
    devTool: "Python, PyTorch, scikit-learn", outputType: "위험도 등급 (낮음/보통/높음) + 근거 성분 목록",
    sourceRepo: "gitlab.kolmar.co.kr/ml/ingredient-interaction",
  },
  { id: "ML-2026-005", categoryId: "ml", title: "판매 채널별 수요 예측 모델",
    summary: "온라인·오프라인·홈쇼핑 채널별 제품 수요를 동시에 예측하는 다변량 시계열 모델",
    description: "온라인·오프라인·홈쇼핑 채널별 제품 수요를 동시에 예측하는 다변량 시계열 모델입니다. 계절성·프로모션 이벤트를 반영하여 3개월 후 수요를 예측합니다.", dept: "영업기획팀", owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr",
    tags: ["수요예측", "채널분석", "시계열"], specificUrl: "", updatedAt: "2025.07.07", likes: 9, views: 226, company: ["KKM", "HC"],
    mlType: "시계열 예측 (Multivariate)", trainingDataDesc: "3개 채널 36개월 판매 데이터",
    performanceSummary: "MAPE 8.3% (3개월 예측 기준)",
    devTool: "Python, Prophet, LightGBM", outputType: "채널별 월별 수요 예측값 (Excel + 대시보드)",
    sourceRepo: "gitlab.kolmar.co.kr/ml/demand-channel",
  },
  // ── AI Model 추가 ──────────────────────────────────────────────────────────
  { id: "AIO-2026-011", categoryId: "ai-orchestration", agentAvailability: "사용 불가", title: "DeepSeek R2",
    summary: "중국어 문서 번역·분석에 최적화된 고성능 오픈소스 모델입니다.",
    description: "중국어 문서 번역 및 분석에 최적화된 고성능 오픈소스 모델입니다. 중국 현지 법인 업무 대응 및 중국어 계약서·보고서 처리에 활용합니다. 단, 보안 정책에 따라 비공개 데이터 입력은 금지됩니다.", dept: "DX전략팀", owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr",
    tags: ["중국어", "번역", "오픈소스"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.06.01", likes: 6, views: 120, company: [],
    modelMeta: {
      provider: "DeepSeek", modelName: "DeepSeek R2",
      contextWindow: "매우 긴 문서 (책 한 권 분량)",
      strengths: ["중국어 번역", "저비용", "오픈소스"],
      strengthsDetail: "중국어 문서 번역·분석에 특화된 오픈소스 모델입니다. 저비용으로 중국어 업무를 처리할 수 있으나, 외부 서버 전송 특성상 보안 데이터 입력이 금지됩니다.",
      tokenUsageNote: "문서 10페이지 요약 시 약 1.0만 토큰",
      costTier: "낮음", useCases: ["중국어 계약서 번역", "중국 현지 보고서 분석", "중국어 이메일 작성"],
    },
  },
  // ── 추가 Vibe Coding ──────────────────────────────────────────────────────
  { id: "VIBE-2026-003", categoryId: "vibe", title: "부서별 KPI 현황판 자동화",
    summary: "Excel KPI 데이터를 읽어 자동으로 부서별 성과 대시보드를 그려주는 Python 앱",
    description: "Excel에 저장된 부서별 KPI 데이터를 자동으로 읽어 Streamlit 대시보드로 시각화합니다. 경영기획팀이 월별 성과 보고 시 활용합니다.", dept: "경영기획팀", owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr",
    tags: ["KPI", "대시보드", "Python"], specificUrl: "", updatedAt: "2025.07.06", likes: 13, views: 276, company: ["KKM"],
    devTool: "Cursor", outputType: "Python 앱 (Streamlit)",
    sourceRepo: "gitlab.kolmar.co.kr/vibe/kpi-dashboard",
  },
  { id: "VIBE-2026-004", categoryId: "vibe", title: "커피 룰렛 웹앱",
    summary: "팀원 명단을 업로드하면 커피 당번을 무작위 선정하는 인트라넷 미니앱",
    description: "팀원 명단 Excel 파일을 업로드하면 커피 당번을 무작위로 선정하고 결과를 화면에 표시합니다. 마케팅팀 내부 팀 문화 개선을 위해 직접 개발한 미니앱입니다.", dept: "마케팅팀", owner: "박직원", ownerEmail: "jiik.jung@kolmar.co.kr",
    tags: ["사내앱", "팀문화", "웹앱"], specificUrl: "", updatedAt: "2025.06.20", likes: 31, views: 730, company: [],
    devTool: "바이브 코딩 도구", outputType: "웹앱 (HTML/JS)",
    sourceRepo: "gitlab.kolmar.co.kr/vibe/coffee-roulette",
  },
  { id: "VIBE-2026-005", categoryId: "vibe", title: "ECM 멀티 파일 다운로더",
    summary: "ECM에서 여러 파일을 한 번에 선택하고 다운로드하는 유틸리티 프로그램",
    description: "ECM 시스템에서 체크박스로 여러 파일을 선택하면 한 번에 일괄 다운로드합니다. 기존 개별 다운로드 방식 대비 처리 시간을 크게 단축합니다.", dept: "IT인프라팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["ECM", "파일관리", "생산성"], specificUrl: "", updatedAt: "2025.07.04", likes: 24, views: 608, company: ["KKM"],
    devTool: "Claude Code", outputType: "Windows 실행 프로그램",
    sourceRepo: "gitlab.kolmar.co.kr/vibe/ecm-downloader",
  },
  { id: "VIBE-2026-006", categoryId: "vibe", title: "Excel VBA 주간 원가 정산 도구",
    summary: "ChatGPT가 작성한 VBA 매크로로 주간 원가 데이터를 자동 집계하던 도구",
    description: "ERP에서 내려받은 원가 데이터를 Excel VBA 매크로로 자동 집계하고 주간 원가 리포트를 생성하던 도구입니다.", dept: "재무팀", owner: "오현진", ownerEmail: "hyunjin.oh@kolmar.co.kr",
    tags: ["원가정산", "VBA", "레거시"], specificUrl: "", updatedAt: "2025.10.01", likes: 2, views: 88, company: ["KMG"],
    devTool: "ChatGPT", outputType: "Excel VBA 매크로",
    sourceRepo: "gitlab.kolmar.co.kr/vibe/legacy-cost-vba",
  },
  // ── 기타 (블로그형 소규모 프로젝트) ──────────────────────────────────────────
  { id: "ETC-2026-001", categoryId: "etc", title: "사내 뉴스 한눈에 요약 미니 프로젝트",
    summary: "매일 아침 사내 공지·업계 뉴스를 한 장으로 요약해 보여주는 개인 사이드 프로젝트 소개",
    description: "매일 아침 사내 포털 공지와 업계 뉴스를 모아 한 장으로 요약해 주는 미니 프로젝트입니다. 블로그 형식으로 제작 과정과 배운 점을 공유합니다.\n\n정식 서비스는 아니며, AI 도구를 활용한 소규모 실험 프로젝트로 소개합니다.", dept: "DX전략팀", owner: "박직원", ownerEmail: "jiik.jung@kolmar.co.kr",
    tags: ["사이드프로젝트", "요약", "블로그"], specificUrl: "", updatedAt: "2026.07.10", likes: 5, views: 179, company: [],
    images: [PLACEHOLDER_IMG_1, PLACEHOLDER_IMG_2],
  },
];

// 항목별 mock 게시글 (실 연동 시 GET /api/v1/platform-items/:id/posts)
const MOCK_POSTS_BY_ITEM: Record<string, Post[]> = {
  "N8N-2026-001": [
    { id: 1, author: "이서현", dept: "IT인프라팀", date: "2025.06.05", tag: "공지", text: "워크플로우 운영 시작했습니다. 계정 생성 누락 시 IT인프라팀으로 바로 알려주세요.", likes: 4, likedByMe: false },
  ],
  "AST-2026-001": [
    { id: 1, author: "강현우", dept: "법무팀", date: "2025.06.11", tag: "Q&A", text: "영문 계약서도 검토가 가능한가요?", likes: 2, likedByMe: false },
  ],
  "AIO-2026-002": [
    { id: 1, author: "정태영", dept: "IT개발팀", date: "2025.06.13", tag: "공지", text: "Claude 처리 가능한 글 분량이 늘어났습니다. 장문 계약서 분석 시 분할 업로드 없이 한 번에 처리 가능합니다.", likes: 9, likedByMe: false },
  ],
};

// 항목별 mock 활용 후기 (실 연동 시 GET /api/v1/platform-items/:id/reviews)
const MOCK_REVIEWS_BY_ITEM: Record<string, AssetReview[]> = {
  "N8N-2026-001": [
    { id: "r1", itemId: "N8N-2026-001", itemTitle: "신규 입사자 계정 자동 생성", itemKind: "n8n", author: "박성민", dept: "IT인프라팀", text: "입사자 계정 생성 시간이 1시간에서 5분으로 줄었습니다. 실수도 없어졌어요.", createdAt: "2025.06.10", likes: 8 },
    { id: "r2", itemId: "N8N-2026-001", itemTitle: "신규 입사자 계정 자동 생성", itemKind: "n8n", author: "김은지", dept: "인사팀", text: "HR 시스템과 연동이 잘 돼서 입사 당일부터 바로 사용 가능합니다.", createdAt: "2025.06.18", likes: 5 },
    { id: "r3", itemId: "N8N-2026-001", itemTitle: "신규 입사자 계정 자동 생성", itemKind: "n8n", author: "이준호", dept: "경영지원팀", text: "팀원 모두가 편리하게 사용 중입니다. 초기 세팅만 잘 되면 완전 자동화!", createdAt: "2025.06.22", likes: 3 },
  ],
  "AST-2026-001": [
    { id: "r4", itemId: "AST-2026-001", itemTitle: "계약서 AI 검토 비서", itemKind: "assistant", author: "강현우", dept: "법무팀", text: "영문 계약서 검토 시간이 반으로 줄었습니다. 주요 조항 누락 여부도 잘 짚어줍니다.", createdAt: "2025.06.12", likes: 11 },
    { id: "r5", itemId: "AST-2026-001", itemTitle: "계약서 AI 검토 비서", itemKind: "assistant", author: "오세은", dept: "구매팀", text: "계약 조건 비교 시 매우 유용합니다. 다만 법적 판단은 직접 확인이 필요합니다.", createdAt: "2025.06.20", likes: 6 },
  ],
};

// n8n 데모용 워크플로우 JSON (item.workflowJson 없는 항목 폴백)
const MOCK_N8N_WORKFLOW = JSON.stringify({
  name: "데모 워크플로우",
  nodes: [
    { id: "1", name: "Manual Trigger", type: "n8n-nodes-base.manualTrigger", position: [100, 120] },
    { id: "2", name: "HTTP Request", type: "n8n-nodes-base.httpRequest", position: [280, 120] },
    { id: "3", name: "IF 조건", type: "n8n-nodes-base.if", position: [460, 120] },
    { id: "4", name: "Teams 알림", type: "n8n-nodes-base.microsoftTeams", position: [640, 60] },
    { id: "5", name: "Set 데이터", type: "n8n-nodes-base.set", position: [640, 180] },
  ],
  connections: {
    "Manual Trigger": { main: [[{ node: "HTTP Request", type: "main", index: 0 }]] },
    "HTTP Request": { main: [[{ node: "IF 조건", type: "main", index: 0 }]] },
    "IF 조건": { main: [
      [{ node: "Teams 알림", type: "main", index: 0 }],
      [{ node: "Set 데이터", type: "main", index: 0 }],
    ]},
  },
});

export default function AssetItemDetailPage() {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const item = MOCK_ITEMS.find(i => i.id === itemId);
  const category = item ? CATEGORIES.find(p => p.id === item.categoryId)! : null;

  const [activeTab, setActiveTab] = useState<"overview" | "detail" | "contact" | "posts">("overview");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item?.likes ?? 0);
  const [posts, setPosts] = useState<Post[]>(item ? (MOCK_POSTS_BY_ITEM[item.id] ?? []) : []);
  const [postText, setPostText] = useState("");
  const [postTag, setPostTag] = useState<PostTag>("Q&A");
  const [reviews, setReviews] = useState<AssetReview[]>(item ? (MOCK_REVIEWS_BY_ITEM[item.id] ?? []) : []);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (!item?.id) return;
    const raw = localStorage.getItem("ax_recent_viewed");
    const arr: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const updated = [item.id, ...arr.filter(id => id !== item.id)].slice(0, 10);
    localStorage.setItem("ax_recent_viewed", JSON.stringify(updated));
  }, [item?.id]);

  if (!item || !category) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>
        항목을 찾을 수 없습니다. (id: {itemId})
      </div>
    );
  }

  // vibe/etc는 유형별 전용 필드가 없어 상세 탭을 숨기고 개요에 통합한다.
  const hasDetailTab = item.categoryId !== "vibe" && item.categoryId !== "etc";

  const TABS = [
    { id: "overview" as const, label: "개요" },
    ...(hasDetailTab ? [{ id: "detail" as const, label: detailTabLabelFor(item.categoryId) }] : []),
    { id: "contact" as const, label: "담당자" },
    { id: "posts" as const, label: `업데이트 & 논의 ${posts.length}` },
  ];

  const toggleLike = () => {
    setLiked(v => !v);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const togglePostLike = (postId: number) => {
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
      : p
    ));
  };

  const handlePost = () => {
    if (!postText.trim()) return;
    setPosts(prev => [{
      id: Date.now(), author: "김철수", dept: "IT개발팀", date: "2025.06.29",
      tag: postTag, text: postText, likes: 0, likedByMe: false,
    }, ...prev]);
    setPostText("");
  };

  const handleReview = () => {
    if (!reviewText.trim()) return;
    const r: AssetReview = {
      id: `local-${Date.now()}`, itemId: item.id, itemTitle: item.title, itemKind: item.categoryId,
      author: "김철수", dept: "IT개발팀", text: reviewText, createdAt: "2026.07.10", likes: 0,
    };
    setReviews(prev => [r, ...prev]);
    setReviewText("");
  };

  const downloadWorkflow = () => {
    const content = item.workflowJson ?? MOCK_N8N_WORKFLOW;
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.id.toLowerCase()}-workflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F4F6F9", minHeight: "100vh", color: "#1A1F27", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "10px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94A3B8" }}>
          <span onClick={() => navigate("/projects")} style={{ cursor: "pointer", color: "#1C6BFF", fontWeight: 500 }}>AX Platform</span>
          <span>/</span>
          <span onClick={() => navigate(`/projects?q=${encodeURIComponent(category.name)}`)} style={{ cursor: "pointer", color: "#697386" }}>{category.name}</span>
          <span>/</span>
          <span style={{ color: "#1A1F27", fontWeight: 600 }}>{item.title}</span>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "28px 32px 0" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: category.bg, color: category.color, padding: "3px 10px", borderRadius: 20 }}>
                  {category.name}
                </span>
                {item.categoryId === "ai-orchestration" && item.agentAvailability && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: AGENT_AVAIL_STYLE[item.agentAvailability].bg, color: AGENT_AVAIL_STYLE[item.agentAvailability].color, padding: "3px 10px", borderRadius: 20 }}>
                    {item.agentAvailability}
                  </span>
                )}
                {item.modelMeta && (
                  <>
                    <span style={{ fontSize: 12, color: "#CBD5E1" }}>·</span>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>{item.modelMeta.provider}</span>
                  </>
                )}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1A1F27", letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.3 }}>
                {item.title}
              </h1>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, maxWidth: 640 }}>
                {item.summary}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              {item.views != null && (
                <span title="조회수" style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
                  fontSize: 13, fontWeight: 600, color: "#697386",
                  background: "#F4F6F9", border: "1.5px solid #EBEEF3", borderRadius: 7,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#697386" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  {item.views.toLocaleString()}
                </span>
              )}
              <button onClick={toggleLike} style={{
                background: liked ? "#FEF2F2" : "#fff",
                border: `1.5px solid ${liked ? "#FCA5A5" : "#EBEEF3"}`,
                borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600,
                color: liked ? "#DC2626" : "#475569", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "#DC2626" : "none"} stroke={liked ? "#DC2626" : "#697386"} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                {likeCount}
              </button>
              <button onClick={() => setActiveTab("contact")} style={{
                background: "#fff", color: "#475569",
                border: "1.5px solid #EBEEF3", borderRadius: 7,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                담당자 연락
              </button>
              {item.categoryId === "ai-orchestration" && item.specificUrl && (
                <button onClick={() => window.open(item.specificUrl, "_blank")} style={{
                  background: category.color, color: "#fff",
                  border: "none", borderRadius: 7,
                  padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  모델 접속 →
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#94A3B8", paddingBottom: 16, flexWrap: "wrap" }}>
            <span>등록 부서 {item.dept}</span>
            <span>·</span>
            <span>최종 수정 {item.updatedAt}</span>
            <span>·</span>
            <span>카테고리 {category.name}</span>
          </div>

          <div style={{ display: "flex", gap: 0, marginTop: 4 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "10px 18px", fontSize: 13, fontWeight: 600,
                background: "transparent", border: "none", cursor: "pointer",
                color: activeTab === tab.id ? "#1C6BFF" : "#697386",
                borderBottom: activeTab === tab.id ? "2px solid #1C6BFF" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "28px 32px", width: "100%", boxSizing: "border-box" }}>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
            <div>
              <ImageCarousel images={item.images ?? []} />
              <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1F27", marginBottom: 14 }}>설명</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.9, whiteSpace: "pre-line" }}>
                  {item.description}
                </div>
              </div>

              <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1F27", marginBottom: 14 }}>출처</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 12, background: category.bg, color: category.color, padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}>
                    {category.name}
                  </span>
                  <span style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "4px 12px", borderRadius: 6, border: "1px solid #EBEEF3" }}>
                    {category.shortDesc}
                  </span>
                </div>
              </div>

              {/* ===== 활용 후기 ===== */}
              <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "24px 26px", marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1F27", marginBottom: 14 }}>
                  활용 후기 <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>{reviews.length}</span>
                </div>
                {reviews.length === 0 && (
                  <div style={{ textAlign: "center", padding: "12px 0 8px", color: "#94A3B8", fontSize: 13 }}>
                    아직 등록된 후기가 없습니다.
                  </div>
                )}
                {reviews.map((r, ri) => (
                  <div key={r.id} style={{ paddingBottom: 14, marginBottom: ri < reviews.length - 1 ? 14 : 0, borderBottom: ri < reviews.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EBEEF3", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {r.author[0]}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1F27" }}>{r.author}</span>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>{r.dept}</span>
                      <span style={{ fontSize: 11, color: "#CBD5E1", marginLeft: "auto" }}>{r.createdAt}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.8, paddingLeft: 32 }}>{r.text}</div>
                  </div>
                ))}
                <div style={{ marginTop: reviews.length > 0 ? 16 : 8, paddingTop: reviews.length > 0 ? 14 : 0, borderTop: reviews.length > 0 ? "1px solid #F1F5F9" : "none" }}>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="이 항목을 활용한 경험을 공유해 주세요."
                    style={{
                      width: "100%", boxSizing: "border-box", minHeight: 68,
                      padding: "10px 12px", fontSize: 13, color: "#1A1F27",
                      border: "1.5px solid #EBEEF3", borderRadius: 8, outline: "none",
                      resize: "vertical", fontFamily: "inherit",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button onClick={handleReview} style={{
                      background: "#1A1F27", color: "#fff", border: "none", borderRadius: 7,
                      padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>
                      후기 등록
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {item.categoryId === "ai-orchestration" && item.specificUrl && (
                <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1F27", marginBottom: 12 }}>모델 접속</div>
                  <a href={item.specificUrl} target="_blank" rel="noreferrer" style={{
                    fontSize: 12, color: "#1C6BFF", fontWeight: 500,
                    textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    모델 접속
                  </a>
                </div>
              )}

              <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "18px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1F27", marginBottom: 10 }}>태그</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {item.tags.map((t, i) => (
                    <span key={i} style={{ fontSize: 11, background: "#F4F6F9", color: "#697386", padding: "3px 8px", borderRadius: 4, border: "1px solid #EBEEF3" }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "detail" && hasDetailTab && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ===== AI Model — 모델 사양 (블로그형: 강점 서술 우선) ===== */}
            {item.categoryId === "ai-orchestration" && item.modelMeta && (
              <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1F27", marginBottom: 14 }}>강점 및 활용 방법</div>
                <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, marginBottom: 20, background: "#F4F6F9", border: "1px solid #EBEEF3", borderRadius: 8, padding: "14px 16px" }}>
                  {item.modelMeta.strengthsDetail || "등록된 설명이 없습니다."}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: "#F4F6F9", border: "1px solid #EBEEF3", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>세부 모델명</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1F27" }}>{item.modelMeta.modelName || "—"}</div>
                  </div>
                  <div style={{ background: "#F4F6F9", border: "1px solid #EBEEF3", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>처리 가능한 글 분량</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1F27" }}>{item.modelMeta.contextWindow}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>비용 등급</div>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    background: COST_TIER_COLOR[item.modelMeta.costTier].bg,
                    color: COST_TIER_COLOR[item.modelMeta.costTier].color,
                    padding: "5px 14px", borderRadius: 20,
                  }}>
                    {item.modelMeta.costTier}
                  </span>
                </div>

                {item.specificUrl && (
                  <button onClick={() => window.open(item.specificUrl, "_blank")} style={{
                    background: category.color, color: "#fff", border: "none", borderRadius: 7,
                    padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>
                    모델 접속 →
                  </button>
                )}

                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                  <span onClick={() => navigate(`/projects?platform=ai-orchestration`)} style={{ fontSize: 12, color: "#1C6BFF", fontWeight: 600, cursor: "pointer" }}>
                    다른 AI 모델과 비교해보기 →
                  </span>
                </div>
              </div>
            )}

            {/* ===== 나만의 비서 — 비서 구성 (공유 프롬프트 + 기반 모델) ===== */}
            {item.categoryId === "assistant" && (
              <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>기반 모델</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1F27" }}>{item.basedModel || "—"}</div>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>공유 프롬프트</div>
                    {item.sharedPrompt && (
                      <button onClick={() => copyText(item.sharedPrompt ?? "")} style={{
                        background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 6,
                        padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
                      }}>복사</button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", background: "#F4F6F9", border: "1px solid #EBEEF3", borderRadius: 8, padding: "14px 16px" }}>
                    {item.sharedPrompt || "등록된 프롬프트가 없습니다."}
                  </div>
                </div>
              </div>
            )}

            {/* ===== Power Automate — 플로우 정보 (예상 효과) ===== */}
            {item.categoryId === "pa" && (
              <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>예상 효과</div>
                <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>
                  {item.expectedTimeSaved || "등록된 예상 효과 정보가 없습니다. 플로우 구성은 상단 이미지와 상세 설명을 참고하세요."}
                </div>
              </div>
            )}

            {/* ===== ML — 모델 정보 (모델 유형 + 학습 데이터 + 개발 도구) ===== */}
            {item.categoryId === "ml" && (
              <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: "#F4F6F9", border: "1px solid #EBEEF3", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>모델 유형</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1F27" }}>{item.mlType || "—"}</div>
                  </div>
                  <div style={{ background: "#F4F6F9", border: "1px solid #EBEEF3", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>개발 도구</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1F27" }}>{item.devTool || "—"}</div>
                  </div>
                </div>

                {item.trainingDataDesc && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>학습 데이터 개요</div>
                    <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{item.trainingDataDesc}</div>
                  </div>
                )}
              </div>
            )}

            {/* ===== n8n — 워크플로우 다이어그램 + 예상 효과 + 난이도 ===== */}
            {item.categoryId === "n8n" && (
              <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1F27" }}>워크플로우 다이어그램</div>
                  <button onClick={downloadWorkflow} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 6,
                    padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    JSON 다운로드
                  </button>
                </div>
                <N8nFlowPreview json={item.workflowJson ?? MOCK_N8N_WORKFLOW} />
                {(item.expectedTimeSaved || item.difficulty) && (
                  <div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
                    {item.expectedTimeSaved && (
                      <div style={{ background: "#F4F6F9", border: "1px solid #EBEEF3", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>예상 효과</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1F27" }}>{item.expectedTimeSaved}</div>
                      </div>
                    )}
                    {item.difficulty && (
                      <div style={{ background: "#F4F6F9", border: "1px solid #EBEEF3", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>구성 난이도</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1F27" }}>{item.difficulty}</div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{
                  fontSize: 13, color: "#475569", lineHeight: 1.9, whiteSpace: "pre-line",
                  marginTop: 20, paddingTop: 16, borderTop: "1px solid #F1F5F9",
                }}>
                  {item.description}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "contact" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "#1A1F27", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    {item.owner[0]}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1F27" }}>{item.owner}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#1A1F27", color: "#fff", padding: "2px 7px", borderRadius: 20 }}>
                        담당자
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#697386" }}>{item.dept}</div>
                  </div>
                </div>
                <a href={`mailto:${item.ownerEmail}`} style={{ textDecoration: "none" }}>
                  <button style={{
                    background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 6,
                    padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#475569",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    이메일
                  </button>
                </a>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9", fontSize: 12, color: "#94A3B8" }}>
                {item.ownerEmail}
              </div>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#F4F6F9", border: "1px solid #EBEEF3", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#697386" }}>
              공지·질문·이슈제보·건의를 자유롭게 남길 수 있는 공간입니다. 담당자 직접 문의는 담당자 탭을 이용하세요.
            </div>

            {posts.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>
                아직 등록된 글이 없습니다.
              </div>
            )}

            {posts.map(p => (
              <div key={p.id} style={{
                background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "18px 22px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: "#EBEEF3", color: "#475569",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {p.author[0]}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1F27" }}>{p.author}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{p.dept}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: POST_TAG_COLOR[p.tag].bg, color: POST_TAG_COLOR[p.tag].color,
                          padding: "1px 8px", borderRadius: 20,
                        }}>
                          {p.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#CBD5E1", flexShrink: 0 }}>{p.date}</span>
                </div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.8, paddingLeft: 38, marginBottom: 10 }}>
                  {p.text}
                </div>
                <div style={{ paddingLeft: 38 }}>
                  <button onClick={() => togglePostLike(p.id)} style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5, padding: "3px 8px",
                    borderRadius: 6, color: p.likedByMe ? "#DC2626" : "#94A3B8",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={p.likedByMe ? "#DC2626" : "none"} stroke={p.likedByMe ? "#DC2626" : "#94A3B8"} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{p.likes}</span>
                  </button>
                </div>
              </div>
            ))}

            <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "18px 22px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1F27", marginBottom: 10 }}>글 작성</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {POST_TAGS.map(tag => (
                  <button key={tag} onClick={() => setPostTag(tag)} style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                    border: `1.5px solid ${postTag === tag ? POST_TAG_COLOR[tag].color : "#EBEEF3"}`,
                    background: postTag === tag ? POST_TAG_COLOR[tag].bg : "#fff",
                    color: postTag === tag ? POST_TAG_COLOR[tag].color : "#94A3B8",
                  }}>
                    {tag}
                  </button>
                ))}
              </div>
              <textarea
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="공지, 질문, 이슈, 건의 등 자유롭게 남겨주세요."
                style={{
                  width: "100%", boxSizing: "border-box", minHeight: 80,
                  padding: "12px 14px", fontSize: 13, color: "#1A1F27",
                  border: "1.5px solid #EBEEF3", borderRadius: 8, outline: "none",
                  resize: "vertical", fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={handlePost} style={{
                  background: "#1C6BFF", color: "#fff", border: "none", borderRadius: 7,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  등록
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  );
}