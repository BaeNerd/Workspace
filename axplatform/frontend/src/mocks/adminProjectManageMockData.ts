// ============================================================
// AdminProjectManage 게시 항목 관리 공용 mock 데이터 (DEMO 전용) — 단일 소스(SSOT)
// ------------------------------------------------------------
// AdminProjectManage(/admin/projects)가 lib/dataSource.ts(getManagedAssetItems)를
// 경유해 이 한 곳을 참조한다. (구 AdminProjectManage.INITIAL_ASSET_ITEMS 이관 —
// 식별자명 유지.)
//
// ⚠️ 백엔드 연동 시 전량 폐기 대상.
//   GET /api/v1/admin/platform-items — INITIAL_ASSET_ITEMS (게시 항목 전체)
// ============================================================

import type { ManagedAssetItem } from "../pages/admin/AdminProjectManage";

// 인라인 SVG 플레이스홀더 (네트워크 비의존)
const placeholderImage = (label: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='640' height='360' fill='#F1F5F9'/><rect x='1' y='1' width='638' height='358' fill='none' stroke='${color}' stroke-width='2'/><text x='320' y='188' font-family='sans-serif' font-size='24' fill='${color}' text-anchor='middle'>${label}</text></svg>`
  )}`;

// TODO: 실제 연동 시 GET /api/v1/admin/platform-items 응답으로 교체
export const INITIAL_ASSET_ITEMS: ManagedAssetItem[] = [
  {
    kind: "n8n",
    id: "N8N-2026-032", title: "Outlook 긴급 메일 자동 전달", dept: "IT인프라팀",
    summary: "긴급 메일 수신 시 제목 키워드를 확인하여 팀장님께 즉시 자동 전달",
    description: "Outlook에서 메일을 수신하면 제목에 '긴급' 키워드 포함 여부를 자동으로 판별합니다.\n\n긴급 메일로 확인될 경우 팀장님 메일 주소로 즉시 전달하여 빠른 의사결정이 가능하도록 지원합니다.",
    contacts: [{ name: "이서현", dept: "IT인프라팀", role: "주담당자", email: "seohyun.lee@kolmar.co.kr" }],
    updatedAt: "2026.07.03", createdByEmail: "seohyun.lee@kolmar.co.kr",
    tags: "Outlook, 긴급메일, 자동전달",
    images: [placeholderImage("워크플로우 개요", "#EA580C")],
    domain: "IT",
    company: [], companyScope: "company-wide",
    expectedTimeSaved: "주 2시간", difficulty: "쉬움",
    workflowInput: {
      status: "Stable",
      nodes: [
        { label: "Outlook Trigger", type: "trigger" },
        { label: "긴급 포함 여부 확인", type: "condition" },
        { label: "팀장님께 메일 전달", type: "output" },
      ],
    },
  },
  {
    kind: "pa",
    id: "PA-2026-013", title: "구매 결재 자동 승인 플로우", dept: "구매팀",
    summary: "SharePoint 양식 기반 구매 결재 자동 처리",
    description: "구매팀이 SharePoint에 제출한 결재 요청을 Power Automate가 ERP 데이터와 대조 후 자동 승인·반려합니다.",
    contacts: [{ name: "최유진", dept: "구매팀", role: "주담당자", email: "yujin.choi@kolmar.co.kr" }],
    updatedAt: "2026.06.25", createdByEmail: "yujin.choi@kolmar.co.kr",
    tags: "결재, 구매자동화",
    domain: "재무",
    company: [], companyScope: "company-wide",
    expectedTimeSaved: "주 3시간",
  },
  {
    kind: "assistant",
    id: "AST-2026-019", title: "해외법인 계약서 1차 검토 비서", dept: "법무팀",
    summary: "해외법인向 영문 계약서의 주요 리스크 조항을 1차 스크리닝",
    description: "미국콜마·북경콜마 등 해외법인에서 체결하는 영문 계약서의 주요 조항을 1차로 스크리닝하여 법무팀 검토 시간을 단축합니다.",
    contacts: [{ name: "강현우", dept: "법무팀", role: "주담당자", email: "hyunwoo.kang@kolmar.co.kr" }],
    updatedAt: "2026.06.22", createdByEmail: "hyunwoo.kang@kolmar.co.kr",
    tags: "계약서, 법무, 해외법인",
    domain: "IT",
    company: [], companyScope: "company-wide",
    sharedPrompt: "당신은 해외법인 계약서를 검토하는 법무 담당자입니다. 업로드된 영문 계약서에서 위험 조항을 찾아 한국어로 요약해 주세요.",
    basedModel: "Claude Opus 4.8",
  },
  {
    kind: "ai-orchestration",
    id: "AIO-2026-014", title: "Claude Opus 4.8", dept: "IT개발팀",
    summary: "긴 문서 분석과 정밀한 추론에 강한 모델",
    description: "긴 컨텍스트가 필요한 계약서 검토, 보고서 분석, 복잡한 추론 작업에 적합합니다. 제공사는 Anthropic입니다.",
    contacts: [{ name: "정태영", dept: "IT개발팀", role: "주담당자", email: "taeyoung.jung@kolmar.co.kr" }],
    updatedAt: "2026.06.12", createdByEmail: "taeyoung.jung@kolmar.co.kr",
    tags: "문서분석, 긴컨텍스트, 법무",
    company: [], companyScope: "company-wide",
    agentAvailability: "사용 가능",
    strengthsDetail: "긴 문서를 한 번에 읽고 핵심을 요약하는 데 강합니다. 계약서 검토나 보고서 분석에 활용해보세요.",
    specificUrl: "https://ai-gateway.kolmar.co.kr/models/claude",
    modelName: "Claude Opus 4.8", contextWindow: "매우 긴 문서 (책 한 권 분량)", costTier: "보통",
  },
  {
    kind: "ml",
    id: "ML-2026-007", title: "성분 이미지 품질 분류 모델", dept: "IT개발팀",
    summary: "원료 이미지 기반 품질 합격/불합격 자동 판정",
    description: "YOLOv8 기반 이미지 분류 모델로 생산 라인에서 촬영한 원료 이미지를 실시간 분석합니다.",
    contacts: [{ name: "오승현", dept: "IT개발팀", role: "주담당자", email: "seunghyun.oh@kolmar.co.kr" }],
    updatedAt: "2026.06.26", createdByEmail: "seunghyun.oh@kolmar.co.kr",
    tags: "품질관리, 이미지분류",
    domain: "생산",
    company: [], companyScope: "company-wide",
    mlType: "이미지 인식", trainingDataDesc: "내부 품질 검사 이미지 1만장", devTool: "PyTorch",
  },
  {
    kind: "vibe",
    id: "VIBE-2026-008", title: "원가 계산 자동화 스크립트", dept: "재무팀",
    summary: "Cursor로 작성한 원가 자동 계산 내부 도구",
    description: "Cursor AI를 활용해 Python으로 제작한 원가 계산 자동화 스크립트입니다. 기존 Excel 수작업을 대체하여 처리 시간을 줄였습니다.",
    contacts: [{ name: "박소희", dept: "재무팀", role: "주담당자", email: "sohee.park@kolmar.co.kr" }],
    updatedAt: "2026.07.01", createdByEmail: "sohee.park@kolmar.co.kr",
    tags: "원가, 재무자동화",
    domain: "재무",
    company: [], companyScope: "company-wide",
  },
  {
    kind: "etc",
    id: "ETC-2026-002", title: "사내 AI 뉴스 주간 요약 미니 프로젝트", dept: "DX추진팀",
    summary: "매주 사내에 공유되는 AI 트렌드 뉴스레터를 블로그 형식으로 소개",
    description: "사내 구성원이 AI 동향을 쉽게 접할 수 있도록 매주 주요 뉴스와 활용 사례를 정리해 공유하는 소규모 프로젝트입니다.",
    contacts: [{ name: "한지민", dept: "DX추진팀", role: "주담당자", email: "jimin.han@kolmar.co.kr" }],
    updatedAt: "2026.06.28", createdByEmail: "jimin.han@kolmar.co.kr",
    tags: "뉴스레터, AI트렌드",
    domain: "IT",
    company: [], companyScope: "company-wide",
  },
];
