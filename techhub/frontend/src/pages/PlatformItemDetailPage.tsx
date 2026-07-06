// ===== pages/PlatformItemDetailPage.tsx =====
/* ============================================================
   경로: /n8n/:itemId, /pa/:itemId, /assistant/:itemId,
        /ai-orchestration/:itemId, /ml/:itemId, /vibe/:itemId

   이번 변경 사항
   1. 6개 유형 전체를 대상으로 상세 탭 구성을 분기하도록 재설계.
      - n8n: 워크플로우 다이어그램 (기존과 동일)
      - pa: 흐름 정보 (흐름 유형, 트리거·동작, 커넥터, 커넥터 등급)
      - assistant: 비서 구성 (공유 범위, 기반 모델, 비서 소개,
        공유 프롬프트, 연결된 데이터, 예시 질문)
      - ai-orchestration: 모델 사양 (강점 및 활용 방법 우선 노출,
        세부 모델명, 처리 가능한 글 분량, 1회 사용량, 권장 사용 시나리오)
      - ml: 모델 정보 (모델 유형, 핵심 성능, 학습 데이터 개요 등)
      - vibe: 산출물 정보 (사용 도구, 결과물 형태, 소스 저장소)
   2. 유형별 상태값 체계에 맞춰 MOCK_ITEMS의 status를 갱신.
   3. PA-001 / ML-001 / VIBE-001 목업 항목 신규 추가 —
      랜딩 페이지 "최신 AX 항목"에서 연결되는 실제 상세 페이지 확보.
   4. 실행 버튼 라벨을 유형별로 세분화.
   ============================================================ */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformItem, PlatformId } from "../types/platformTypes";
import { WorkflowDiagram } from "../components/WorkflowDiagram";

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "사용 가능": { bg: "#D1FAE5", color: "#065F46" },
  "사용 중": { bg: "#D1FAE5", color: "#065F46" },
  "테스트 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "실험 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "프로토타입": { bg: "#DBEAFE", color: "#1E40AF" },
  "준비 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "일시 중지": { bg: "#FEF3C7", color: "#92400E" },
  "일부 제한": { bg: "#FEF3C7", color: "#92400E" },
  "운영 중지": { bg: "#FEE2E2", color: "#991B1B" },
  "지원 종료 예정": { bg: "#FEE2E2", color: "#991B1B" },
};

const COST_TIER_COLOR: Record<string, { bg: string; color: string }> = {
  "낮음": { bg: "#DCFCE7", color: "#166534" },
  "보통": { bg: "#FEF3C7", color: "#92400E" },
  "높음": { bg: "#FEE2E2", color: "#991B1B" },
};

const POST_TAGS = ["공지", "Q&A", "이슈제보", "건의"] as const;
type PostTag = typeof POST_TAGS[number];

const POST_TAG_COLOR: Record<PostTag, { bg: string; color: string }> = {
  "공지": { bg: "#DBEAFE", color: "#1E40AF" },
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

// company 표시용 29개 전체 관계사 (AdminOrg.tsx / ProjectRegisterPage.tsx와 동일 소스)
// TODO: 실제 연동 시 GET /api/v1/admin/companies 응답으로 교체
const FULL_COMPANIES = [
  { code: "KMH", name: "콜마홀딩스" }, { code: "KKM", name: "한국콜마" },
  { code: "KBH", name: "콜마비앤에이치" }, { code: "HKN", name: "에이치케이이노엔" },
  { code: "YWK", name: "연우" }, { code: "KAF", name: "근오농림" },
  { code: "NAB", name: "넥스트앤바이오" }, { code: "HC", name: "콜마생활건강" },
  { code: "HNG", name: "에치엔지" }, { code: "MOD", name: "엠오디머티리얼즈" },
  { code: "KMG", name: "콜마글로벌" }, { code: "KMSK", name: "콜마스크" },
  { code: "KUX", name: "콜마유엑스" }, { code: "KMW", name: "무석콜마" },
  { code: "KMB", name: "북경콜마" }, { code: "KBJ", name: "강소콜마" },
  { code: "KAY", name: "연태콜마" }, { code: "HKV", name: "한국헬스케어베너" },
  { code: "PLT", name: "플래닛147" }, { code: "LSL", name: "레스리" },
  { code: "LOD", name: "라우드랩스" }, { code: "KMP", name: "콜마헬스케어필리핀" },
  { code: "KMS", name: "에이치케이콜마싱가포르" }, { code: "KML", name: "콜마랩스" },
  { code: "KUS", name: "미국콜마" }, { code: "KCA", name: "캐나다콜마" },
  { code: "HKJ", name: "에이치케이글로벌퍼팩" }, { code: "KMM", name: "에이치케이콜마말레이시아" },
  { code: "KBT", name: "콜마바이오텍" },
];

const companyShortDisplay = (codes: string[]): string => {
  if (codes.length === 0) return "전사 공용";
  const names = codes.map(c => FULL_COMPANIES.find(co => co.code === c)?.name ?? c);
  if (names.length <= 2) return names.join(", ");
  return `${names[0]} 외 ${names.length - 1}곳`;
};

const companyFullNames = (codes: string[]): string[] =>
  codes.map(c => FULL_COMPANIES.find(co => co.code === c)?.name ?? c);

// 상세 탭 라벨 — 유형별 실제 성격에 맞게 분리
const detailTabLabelFor = (platformId: PlatformId): string => {
  if (platformId === "ai-orchestration") return "모델 사양";
  if (platformId === "assistant") return "비서 구성";
  if (platformId === "pa") return "플로우 정보";
  if (platformId === "ml") return "모델 정보";
  if (platformId === "vibe") return "산출물 정보";
  return "상세 동작"; // n8n
};

// 실행 버튼 라벨 — 유형별 동작 성격에 맞게 분리
const actionButtonLabelFor = (platformId: PlatformId): string => {
  if (platformId === "n8n") return "워크플로우 실행";
  if (platformId === "pa") return "플로우 실행";
  if (platformId === "assistant") return "에이전트 실행";
  if (platformId === "ai-orchestration") return "모델 사용";
  if (platformId === "ml") return "저장소 열기";
  return "결과물 열기"; // vibe
};

// TODO: 실제 연동 시 GET /api/v1/platform-items/:id 응답으로 교체
const MOCK_ITEMS: PlatformItem[] = [
  {
    id: "N8N-001", platformId: "n8n",
    title: "Outlook 긴급 메일 자동 전달",
    summary: "긴급 메일 수신 시 제목 키워드를 확인하여 팀장님께 즉시 자동 전달",
    description: "Outlook에서 메일을 수신하면 제목에 '긴급' 키워드 포함 여부를 자동으로 판별합니다.\n\n긴급 메일로 확인될 경우 팀장님 메일 주소로 즉시 전달하여 빠른 의사결정이 가능하도록 지원합니다.",
    status: "운영 중", dept: "IT인프라팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["Outlook", "긴급메일", "자동전달"],
    specificUrl: "https://n8n.kolmar.co.kr/workflow/001", updatedAt: "2025.07.03", likes: 19, company: ["KKM"],
    workflowDef: {
      status: "Stable",
      nodes: [
        { id: "1", label: "Outlook Trigger", type: "trigger" },
        { id: "2", label: "긴급 포함 여부 확인", type: "condition" },
        { id: "3", label: "팀장님께 메일 전달", type: "output" },
      ],
      edges: [{ from: "1", to: "2" }, { from: "2", to: "3" }],
    },
  },
  {
    id: "N8N-002", platformId: "n8n",
    title: "발주 승인 알림 자동화",
    summary: "구매 시스템의 발주 승인 요청을 Teams로 즉시 알림",
    description: "구매 시스템에서 발주 요청이 생성되면 승인자에게 Teams 메시지로 즉시 알림을 보내고, 승인/반려 결과를 발주 시스템에 자동 반영합니다.",
    status: "운영 중", dept: "구매팀", owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr",
    tags: ["구매", "승인알림", "ERP연동"], specificUrl: "https://n8n.kolmar.co.kr/workflow/002", updatedAt: "2025.06.08", likes: 7, company: ["KKM"],
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
    id: "N8N-003", platformId: "n8n",
    title: "일일 매출 리포트 자동 발송",
    summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송",
    description: "ERP 매출 데이터를 집계하여 매일 오전 경영진 메일링 리스트에 전일 매출 요약 리포트를 자동으로 발송합니다.",
    status: "운영 중", dept: "재무팀", owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr",
    tags: ["매출리포트", "ERP", "자동발송"], specificUrl: "https://n8n.kolmar.co.kr/workflow/003", updatedAt: "2025.06.12", likes: 12, company: ["KKM", "KMG"],
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
    id: "N8N-004", platformId: "n8n",
    title: "품질 이슈 발생 시 즉시 에스컬레이션",
    summary: "품질관리 시스템 이상 감지 시 관련 부서에 즉시 알림",
    description: "생산 품질관리 시스템에서 기준치 이탈이 감지되면 품질관리팀, 생산본부, 관련 연구소에 동시에 Teams 알림을 발송합니다.",
    status: "테스트 중", dept: "품질관리팀", owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr",
    tags: ["품질관리", "에스컬레이션", "생산"], specificUrl: "https://n8n.kolmar.co.kr/workflow/004", updatedAt: "2025.06.18", likes: 3, company: ["KMW"],
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
    id: "PA-001", platformId: "pa",
    title: "결재 문서 SharePoint 자동 저장",
    summary: "전자결재 완료 시 문서를 SharePoint 지정 폴더에 자동으로 보관",
    description: "전자결재가 완료되면 문서를 SharePoint의 지정된 폴더에 자동으로 업로드하여 별도의 수기 보관 작업 없이 문서를 정리합니다.",
    status: "운영 중", dept: "경영지원팀", owner: "최유진", ownerEmail: "yujin.choi@kolmar.co.kr",
    tags: ["SharePoint", "전자결재", "문서관리"],
    specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-001", updatedAt: "2025.07.01", likes: 12, company: ["KKM"],
    flowType: "이벤트 발생 시 자동 실행", connectorTier: "기본 커넥터만 사용",
    triggerAction: "전자결재 완료 → SharePoint 지정 폴더에 문서 자동 업로드",
    connectedApps: ["SharePoint", "Approvals"],
  },
  {
    id: "ML-001", platformId: "ml",
    title: "조색 예측 ML 모델",
    summary: "원료 배합 비율로 최종 색상을 예측하는 회귀 모델",
    description: "원료 배합 비율을 입력하면 최종 제품의 색상값을 예측하여, 반복적인 시험 조색 작업을 줄여줍니다.",
    status: "실험 중", dept: "메이크업연구소", owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr",
    tags: ["TensorFlow", "회귀모델", "색상예측"],
    specificUrl: "https://gitlab.kolmar.co.kr/ml/color-prediction", updatedAt: "2025.06.01", likes: 21, company: ["KKM"],
    mlType: "회귀 (Regression)",
    trainingDataDesc: "최근 2년 생산 배합 데이터 8,000건",
    performanceSummary: "평균 오차 3% 이내",
    devTool: "TensorFlow",
    outputType: "예측 색상값 (RGB)",
    sourceRepo: "gitlab.kolmar.co.kr/ml/color-prediction",
  },
  {
    id: "VIBE-001", platformId: "vibe",
    title: "일일 판매 리포트 자동 생성기",
    summary: "ERP 데이터를 읽어 매일 아침 판매 실적 요약 리포트를 Slack으로 발송",
    description: "매일 아침 ERP 판매 데이터를 읽어 요약 리포트를 생성하고 영업기획팀 Slack 채널로 자동 발송합니다.",
    status: "사용 중", dept: "영업기획팀", owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr",
    tags: ["ERP", "Slack", "리포트자동화"],
    specificUrl: "", updatedAt: "2025.07.05", likes: 8, company: ["KKM"],
    devTool: "Cursor, Claude",
    outputType: "Python 스크립트 + Slack 알림",
    sourceRepo: "gitlab.kolmar.co.kr/vibe/daily-sales-report",
  },
  {
    id: "AST-001", platformId: "assistant", title: "법무 검토 보조 봇",
    summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시",
    description: "업로드된 계약서 초안에서 표준 계약서와 다른 조항, 위험 요소가 있는 조항을 자동으로 식별하고 검토 포인트를 제시합니다.",
    status: "사용 가능", dept: "법무팀", owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr",
    tags: ["법무", "계약서검토", "위험분석"],
    specificUrl: "https://assistant.kolmar.co.kr/agents/legal-review", updatedAt: "2025.06.10", likes: 25, company: [],
    shareScope: "팀 공유 비서",
    basedModel: "Claude Opus 4.8",
    roleDefinition: "계약서 위험 조항을 빠르게 찾아주는 법무 검토 도우미",
    sharedPrompt: "당신은 계약서를 검토하는 법무 담당자입니다. 업로드된 계약서에서 위험 조항을 찾아 표로 정리해 주세요.",
    connectedData: "표준 계약서 템플릿 및 과거 검토 사례 150건",
    sampleQuestions: ["이 계약서에서 손해배상 조항을 알려줘", "표준 계약서와 다른 부분이 있는지 확인해줘"],
  },
  {
    id: "AST-002", platformId: "assistant", title: "회의록 요약 봇",
    summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리",
    description: "Teams 회의 녹음 파일 또는 자막을 업로드하면 핵심 논의 내용, 결정 사항, 액션 아이템을 구조화하여 정리해줍니다.",
    status: "사용 가능", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["회의록", "요약", "Teams연동"],
    specificUrl: "https://assistant.kolmar.co.kr/agents/meeting-summary", updatedAt: "2025.06.14", likes: 18, company: [],
    shareScope: "회사 공통 비서",
    basedModel: "GPT-5.4",
    roleDefinition: "Teams 회의 녹취록에서 핵심 결정사항을 정리하는 도우미",
    sharedPrompt: "당신은 회의록을 정리하는 비서입니다. 업로드된 녹취록에서 결정사항과 액션 아이템을 표로 정리해 주세요.",
    sampleQuestions: ["오늘 회의의 액션 아이템을 정리해줘"],
  },
  {
    id: "AST-003", platformId: "assistant", title: "코드 리뷰 어시스턴트",
    summary: "GitHub PR에 자동으로 코드 리뷰 코멘트를 남기는 봇",
    description: "Pull Request가 생성되면 코드 스타일, 잠재적 버그, 보안 이슈를 자동으로 분석하여 리뷰 코멘트를 남깁니다.",
    status: "준비 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["코드리뷰", "GitHub", "개발도구"],
    specificUrl: "https://assistant.kolmar.co.kr/agents/code-review", updatedAt: "2025.06.19", likes: 10, company: [],
    shareScope: "팀 공유 비서",
    basedModel: "Claude Sonnet 5",
    roleDefinition: "GitHub PR의 코드 스타일과 잠재적 버그를 검토하는 도우미",
    sharedPrompt: "당신은 시니어 개발자입니다. 변경된 코드에서 버그 가능성과 스타일 이슈를 찾아 코멘트로 남겨주세요.",
    sampleQuestions: ["이 PR에 보안 이슈가 있는지 확인해줘"],
  },
  {
    id: "AST-004", platformId: "assistant", title: "원료 안전성 문의 봇",
    summary: "원료의 MSDS·규제 정보를 빠르게 조회하는 연구원용 봇",
    description: "원료명을 입력하면 MSDS 정보, 국가별 사용 제한 규제, 과거 클레임 이력을 통합 조회하여 답변합니다.",
    status: "준비 중", dept: "메이크업연구소", owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr",
    tags: ["원료", "MSDS", "규제정보"],
    specificUrl: "https://assistant.kolmar.co.kr/agents/ingredient-safety", updatedAt: "2025.06.20", likes: 5, company: ["KKM"],
    shareScope: "회사 공통 비서",
    basedModel: "GPT-5.4",
    roleDefinition: "원료의 MSDS와 규제 정보를 조회해주는 연구원용 도우미",
    sharedPrompt: "당신은 원료 안전성 전문가입니다. 입력된 원료명에 대한 MSDS 정보와 국가별 규제를 요약해 주세요.",
    connectedData: "MSDS 데이터베이스, 국가별 화장품 규제 문서",
    sampleQuestions: ["이 원료가 중국에서 사용 제한이 있는지 알려줘"],
  },
  {
    id: "AIO-001", platformId: "ai-orchestration", title: "GPT-4 (범용)",
    summary: "범용 작업에 적합한 OpenAI GPT-4 모델",
    description: "다양한 업무 전반에 활용 가능한 범용 모델입니다. 코드 생성, 문서 작성, 데이터 분석 보조 등에 적합합니다.",
    status: "사용 가능", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["범용", "코드생성", "문서작성"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/gpt-4", updatedAt: "2025.06.10", likes: 31, company: [],
    modelMeta: {
      provider: "OpenAI", modelName: "GPT-4",
      contextWindow: "문서 여러 장 (수십 페이지)",
      strengths: ["범용성", "코드 생성", "빠른 응답"],
      strengthsDetail: "간단한 이메일 작성, 코드 스니펫 생성, 일반 문의 응대에 빠르고 무난하게 대응합니다.",
      tokenUsageNote: "짧은 대화 1회당 약 1,000토큰 내외 사용",
      costTier: "보통", useCases: ["이메일 작성", "코드 생성"],
    },
  },
  {
    id: "AIO-002", platformId: "ai-orchestration", title: "Claude (문서 분석 특화)",
    summary: "긴 문서 분석과 정밀한 추론에 강한 Anthropic Claude 모델",
    description: "긴 컨텍스트가 필요한 계약서 검토, 보고서 분석, 복잡한 추론 작업에 적합합니다.",
    status: "사용 가능", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["문서분석", "긴컨텍스트", "법무"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/claude", updatedAt: "2025.06.12", likes: 27, company: [],
    modelMeta: {
      provider: "Anthropic", modelName: "Claude Opus 4.8",
      contextWindow: "매우 긴 문서 (책 한 권 분량)",
      strengths: ["긴 컨텍스트", "정밀 추론", "안전성"],
      strengthsDetail: "긴 문서를 한 번에 읽고 핵심을 요약하는 데 강합니다. 계약서 검토나 보고서 분석에 활용해보세요.",
      tokenUsageNote: "문서 10페이지 요약 시 약 5,000토큰 사용",
      costTier: "보통", useCases: ["문서 요약", "법무 검토"],
    },
  },
  {
    id: "AIO-003", platformId: "ai-orchestration", title: "콜마 파인튜닝 모델 (사내 전용 용어 특화)",
    summary: "콜마 사내 용어와 제품 데이터로 파인튜닝된 전용 모델",
    description: "화장품 원료명, 사내 제품 코드, 콜마 그룹 조직 용어 등을 정확히 이해하는 사내 전용 모델입니다.",
    status: "일부 제한", dept: "IT개발팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["사내전용", "화장품용어", "원료데이터"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/kolmar-ft", updatedAt: "2025.06.18", likes: 8, company: ["KKM", "KBH", "KMG"],
    modelMeta: {
      provider: "사내 파인튜닝", modelName: "Kolmar-FT-v1",
      contextWindow: "일반 대화 수준",
      strengths: ["콜마 전용 용어", "원료 데이터 이해"],
      strengthsDetail: "콜마 사내 용어와 제품 코드를 정확히 이해합니다. 원료명이나 사내 코드가 포함된 문의에 활용해보세요.",
      tokenUsageNote: "일반 대화 1회당 약 800토큰 사용",
      costTier: "낮음", useCases: ["사내 문서 검색"],
    },
  },
  {
    id: "AIO-004", platformId: "ai-orchestration", title: "Gemini (멀티모달)",
    summary: "이미지·문서를 함께 분석할 수 있는 Google Gemini 모델",
    description: "용기 디자인 이미지 분석, 도면 검토 등 이미지와 텍스트를 함께 다루는 작업에 적합합니다.",
    status: "사용 가능", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["멀티모달", "이미지분석", "도면검토"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/gemini", updatedAt: "2025.06.15", likes: 14, company: [],
    modelMeta: {
      provider: "Google", modelName: "Gemini 2.5 Pro",
      contextWindow: "매우 긴 문서 (책 한 권 분량)",
      strengths: ["멀티모달", "이미지 분석"],
      strengthsDetail: "이미지와 텍스트를 함께 분석하는 데 강합니다. 용기 디자인 시안이나 도면 검토에 활용해보세요.",
      tokenUsageNote: "이미지 1장 분석 시 약 1,500토큰 사용",
      costTier: "보통", useCases: ["이미지 분석"],
    },
  },
];

// 항목별 mock 게시글 (실 연동 시 GET /api/v1/platform-items/:id/posts)
const MOCK_POSTS_BY_ITEM: Record<string, Post[]> = {
  "N8N-001": [
    { id: 1, author: "이서현", dept: "IT인프라팀", date: "2025.06.05", tag: "공지", text: "워크플로우 운영 시작했습니다. 계정 생성 누락 시 IT인프라팀으로 바로 알려주세요.", likes: 4, likedByMe: false },
  ],
  "AST-001": [
    { id: 1, author: "강현우", dept: "법무팀", date: "2025.06.11", tag: "Q&A", text: "영문 계약서도 검토가 가능한가요?", likes: 2, likedByMe: false },
  ],
  "AIO-002": [
    { id: 1, author: "정태영", dept: "IT개발팀", date: "2025.06.13", tag: "공지", text: "Claude 처리 가능한 글 분량이 늘어났습니다. 장문 계약서 분석 시 분할 업로드 없이 한 번에 처리 가능합니다.", likes: 9, likedByMe: false },
  ],
};

export default function PlatformItemDetailPage() {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const item = MOCK_ITEMS.find(i => i.id === itemId);
  const platform = item ? PLATFORMS.find(p => p.id === item.platformId)! : null;

  const [activeTab, setActiveTab] = useState<"overview" | "detail" | "contact" | "posts">("overview");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item?.likes ?? 0);
  const [posts, setPosts] = useState<Post[]>(item ? (MOCK_POSTS_BY_ITEM[item.id] ?? []) : []);
  const [postText, setPostText] = useState("");
  const [postTag, setPostTag] = useState<PostTag>("Q&A");

  if (!item || !platform) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>
        항목을 찾을 수 없습니다. (id: {itemId})
      </div>
    );
  }

  const isCompanyWide = (item.company ?? []).length === 0;

  const TABS = [
    { id: "overview" as const, label: "개요" },
    { id: "detail" as const, label: detailTabLabelFor(item.platformId) },
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

  const downloadWorkflow = () => {
    const content = item.workflowJson ?? JSON.stringify(item.workflowDef ?? {}, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.id.toLowerCase()}-workflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePost = () => {
    if (!postText.trim()) return;
    setPosts(prev => [{
      id: Date.now(), author: "김철수", dept: "IT개발팀", date: "2025.06.29",
      tag: postTag, text: postText, likes: 0, likedByMe: false,
    }, ...prev]);
    setPostText("");
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <Navbar />

      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "10px 32px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94A3B8" }}>
          <span onClick={() => navigate("/projects")} style={{ cursor: "pointer", color: "#2563EB", fontWeight: 500 }}>AX Platform</span>
          <span>/</span>
          <span onClick={() => navigate(`/projects?q=${encodeURIComponent(platform.name)}`)} style={{ cursor: "pointer", color: "#64748B" }}>{platform.name}</span>
          <span>/</span>
          <span style={{ color: "#0F172A", fontWeight: 600 }}>{item.title}</span>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "28px 32px 0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: STATUS_COLOR[item.status]?.bg, color: STATUS_COLOR[item.status]?.color, padding: "3px 10px", borderRadius: 20 }}>
                  {item.status}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, background: platform.bg, color: platform.color, padding: "3px 10px", borderRadius: 20 }}>
                  {platform.name}
                </span>
                {item.modelMeta && (
                  <>
                    <span style={{ fontSize: 12, color: "#CBD5E1" }}>·</span>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>{item.modelMeta.provider}</span>
                  </>
                )}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.3 }}>
                {item.title}
              </h1>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, maxWidth: 640 }}>
                {item.summary}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              <button onClick={toggleLike} style={{
                background: liked ? "#FEF2F2" : "#fff",
                border: `1.5px solid ${liked ? "#FCA5A5" : "#E2E8F0"}`,
                borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600,
                color: liked ? "#DC2626" : "#475569", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "#DC2626" : "none"} stroke={liked ? "#DC2626" : "#64748B"} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                {likeCount}
              </button>
              <button onClick={() => setActiveTab("contact")} style={{
                background: "#fff", color: "#475569",
                border: "1.5px solid #E2E8F0", borderRadius: 7,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                담당자 연락
              </button>
              {item.specificUrl && (
                <button onClick={() => window.open(item.specificUrl, "_blank")} style={{
                  background: platform.color, color: "#fff",
                  border: "none", borderRadius: 7,
                  padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  {actionButtonLabelFor(item.platformId)} →
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#94A3B8", paddingBottom: 16, flexWrap: "wrap" }}>
            <span>등록 부서 {item.dept}</span>
            <span>·</span>
            <span>최종 수정 {item.updatedAt}</span>
            <span>·</span>
            <span>플랫폼 {platform.name}</span>
            <span>·</span>
            <span>대상 관계사 {companyShortDisplay(item.company ?? [])}</span>
          </div>

          <div style={{ display: "flex", gap: 0, marginTop: 4 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "10px 18px", fontSize: 13, fontWeight: 600,
                background: "transparent", border: "none", cursor: "pointer",
                color: activeTab === tab.id ? "#2563EB" : "#64748B",
                borderBottom: activeTab === tab.id ? "2px solid #2563EB" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px" }}>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
            <div>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>설명</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.9, whiteSpace: "pre-line" }}>
                  {item.description}
                </div>
              </div>

              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>출처</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 12, background: platform.bg, color: platform.color, padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}>
                    {platform.name}
                  </span>
                  <span style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "4px 12px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                    {platform.shortDesc}
                  </span>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>대상 관계사</div>
                {isCompanyWide ? (
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
                    특정 관계사로 한정되지 않은 <strong>전사 공용</strong> 항목입니다.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {companyFullNames(item.company ?? []).map((name, i) => (
                      <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1E40AF", padding: "4px 12px", borderRadius: 6, border: "1px solid #BFDBFE" }}>
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {item.specificUrl && (
                <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>문서 및 링크</div>
                  <a href={item.specificUrl} target="_blank" rel="noreferrer" style={{
                    fontSize: 12, color: "#2563EB", fontWeight: 500,
                    textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {actionButtonLabelFor(item.platformId)}
                  </a>
                </div>
              )}

              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>태그</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {item.tags.map((t, i) => (
                    <span key={i} style={{ fontSize: 11, background: "#F8FAFC", color: "#64748B", padding: "3px 8px", borderRadius: 4, border: "1px solid #E2E8F0" }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "detail" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ===== AI Agent — 모델 사양 ===== */}
            {item.platformId === "ai-orchestration" && item.modelMeta && (
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>강점 및 활용 방법</div>
                <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, marginBottom: 20, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                  {item.modelMeta.strengthsDetail || "등록된 설명이 없습니다."}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>세부 모델명</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.modelMeta.modelName || item.modelMeta.provider}</div>
                  </div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>처리 가능한 글 분량</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.modelMeta.contextWindow}</div>
                  </div>
                </div>

                {item.modelMeta.tokenUsageNote && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>1회 사용량</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{item.modelMeta.tokenUsageNote}</div>
                  </div>
                )}

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

                {item.modelMeta.useCases && item.modelMeta.useCases.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>권장 사용 시나리오</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {item.modelMeta.useCases.map((u, i) => (
                        <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "#F5F3FF", color: "#6D28D9", padding: "5px 12px", borderRadius: 20 }}>
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
                  <span onClick={() => navigate(`/projects?q=${encodeURIComponent(platform.name)}`)} style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, cursor: "pointer" }}>
                    다른 AI 모델과 비교해보기 →
                  </span>
                </div>
              </div>
            )}

            {/* ===== 나만의 비서 — 비서 구성 ===== */}
            {item.platformId === "assistant" && (
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>공유 범위</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.shareScope || "—"}</div>
                  </div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>기반 모델</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.basedModel || "—"}</div>
                  </div>
                </div>

                {item.roleDefinition && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>비서 소개</div>
                    <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>{item.roleDefinition}</div>
                  </div>
                )}

                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>공유 프롬프트</div>
                  <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    {item.sharedPrompt || "등록된 프롬프트가 없습니다."}
                  </div>
                </div>

                {item.connectedData && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>연결된 데이터·문서</div>
                    <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{item.connectedData}</div>
                  </div>
                )}

                {item.sampleQuestions && item.sampleQuestions.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>예시 질문</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {item.sampleQuestions.map((q, i) => (
                        <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1E40AF", padding: "5px 12px", borderRadius: 20 }}>
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== Power Automate — 플로우 정보 ===== */}
            {item.platformId === "pa" && (
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>흐름 유형</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.flowType || "—"}</div>
                  </div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>커넥터 등급</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.connectorTier || "—"}</div>
                  </div>
                </div>

                {item.triggerAction && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>트리거 · 동작 설명</div>
                    <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{item.triggerAction}</div>
                  </div>
                )}

                {item.connectedApps && item.connectedApps.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>사용된 커넥터</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {item.connectedApps.map((a, i) => (
                        <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1E40AF", padding: "5px 12px", borderRadius: 20 }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== ML — 모델 정보 ===== */}
            {item.platformId === "ml" && (
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>모델 유형</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.mlType || "—"}</div>
                  </div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>핵심 성능</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.performanceSummary || "—"}</div>
                  </div>
                </div>

                {item.trainingDataDesc && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>학습 데이터 개요</div>
                    <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{item.trainingDataDesc}</div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>개발 도구</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{item.devTool || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>출력 형태</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{item.outputType || "—"}</div>
                  </div>
                </div>

                {item.sourceRepo && (
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>소스 저장소</div>
                    <div style={{ fontSize: 13, color: "#2563EB" }}>{item.sourceRepo}</div>
                  </div>
                )}
              </div>
            )}

            {/* ===== Vibe Coding — 산출물 정보 ===== */}
            {item.platformId === "vibe" && (
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>사용한 AI 도구</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.devTool || "—"}</div>
                  </div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>결과물 형태</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.outputType || "—"}</div>
                  </div>
                </div>

                {item.sourceRepo && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>소스 저장소</div>
                    <div style={{ fontSize: 13, color: "#2563EB" }}>{item.sourceRepo}</div>
                  </div>
                )}
              </div>
            )}

            {/* ===== n8n — 상세 동작(워크플로우 다이어그램) ===== */}
            {item.platformId === "n8n" && (
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>상세 동작</div>
                  {(item.workflowJson || item.workflowDef) && (
                    <button onClick={downloadWorkflow} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6,
                      padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      JSON 다운로드
                    </button>
                  )}
                </div>
                {item.workflowDef && <WorkflowDiagram wf={item.workflowDef} />}
                <div style={{
                  fontSize: 13, color: "#475569", lineHeight: 1.9, whiteSpace: "pre-line",
                  ...(item.workflowDef ? { marginTop: 20, paddingTop: 16, borderTop: "1px solid #F1F5F9" } : {}),
                }}>
                  {item.description}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "contact" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "#0F172A", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    {item.owner[0]}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{item.owner}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#0F172A", color: "#fff", padding: "2px 7px", borderRadius: 20 }}>
                        담당자
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{item.dept}</div>
                  </div>
                </div>
                <a href={`mailto:${item.ownerEmail}`} style={{ textDecoration: "none" }}>
                  <button style={{
                    background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6,
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
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#64748B" }}>
              공지·질문·이슈제보·건의를 자유롭게 남길 수 있는 공간입니다. 담당자 직접 문의는 담당자 탭을 이용하세요.
            </div>

            {posts.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>
                아직 등록된 글이 없습니다.
              </div>
            )}

            {posts.map(p => (
              <div key={p.id} style={{
                background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 22px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: "#E2E8F0", color: "#475569",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {p.author[0]}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{p.author}</span>
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

            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 22px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>글 작성</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {POST_TAGS.map(tag => (
                  <button key={tag} onClick={() => setPostTag(tag)} style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                    border: `1.5px solid ${postTag === tag ? POST_TAG_COLOR[tag].color : "#E2E8F0"}`,
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
                  padding: "12px 14px", fontSize: 13, color: "#0F172A",
                  border: "1.5px solid #E2E8F0", borderRadius: 8, outline: "none",
                  resize: "vertical", fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={handlePost} style={{
                  background: "#2563EB", color: "#fff", border: "none", borderRadius: 7,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  등록
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}