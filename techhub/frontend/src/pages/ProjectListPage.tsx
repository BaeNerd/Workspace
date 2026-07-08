import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { PLATFORMS, STATUS_ORDER, STATUS_COLOR, STATUS_QUERY_KEY } from "../types/platformTypes";
import type { PlatformItem, PlatformId, PlatformItemStatus } from "../types/platformTypes";


const COMPANIES = [
  { code: "KMH", name: "콜마홀딩스", visible: true },
  { code: "KKM", name: "한국콜마", visible: true },
  { code: "KBH", name: "콜마비앤에이치", visible: true },
  { code: "HC", name: "콜마생활건강", visible: true },
  { code: "KMG", name: "콜마글로벌", visible: true },
  { code: "KMSK", name: "콜마스크", visible: true },
  { code: "KMW", name: "무석콜마", visible: true },
  { code: "KMB", name: "북경콜마", visible: true },
  { code: "KUS", name: "미국콜마", visible: true },
  { code: "KBT", name: "콜마바이오텍", visible: true },
  { code: "KAF", name: "근오농림", visible: false },
  { code: "NAB", name: "넥스트앤바이오", visible: false },
  { code: "HNG", name: "에치엔지", visible: false },
];

// TODO: 실제 연동 시 GET /api/v1/platform-items 응답으로 교체
const MOCK_PLATFORM_ITEMS: PlatformItem[] = [
  { id: "N8N-001", platformId: "n8n", title: "신규 입사자 계정 자동 생성", summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성", description: "", status: "사용 가능", dept: "IT인프라팀", company: ["KKM"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr", tags: ["HR", "계정자동화", "온보딩"], specificUrl: "https://n8n.kolmar.co.kr/workflow/001", updatedAt: "2025.06.05", likes: 19 },
  { id: "N8N-002", platformId: "n8n", title: "발주 승인 알림 자동화", summary: "구매 시스템의 발주 승인 요청을 Teams로 즉시 알림", description: "", status: "사용 가능", dept: "구매팀", company: ["KKM"], owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["구매", "승인알림", "ERP연동"], specificUrl: "https://n8n.kolmar.co.kr/workflow/002", updatedAt: "2025.06.08", likes: 7 },
  { id: "N8N-003", platformId: "n8n", title: "일일 매출 리포트 자동 발송", summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송", description: "", status: "사용 가능", dept: "재무팀", company: ["KKM", "KMG"], owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr", tags: ["매출리포트", "ERP", "자동발송"], specificUrl: "https://n8n.kolmar.co.kr/workflow/003", updatedAt: "2025.06.12", likes: 12 },
  { id: "N8N-004", platformId: "n8n", title: "품질 이슈 발생 시 즉시 에스컬레이션", summary: "품질관리 시스템 이상 감지 시 관련 부서에 즉시 알림", description: "", status: "준비 중", dept: "품질관리팀", company: ["KMW"], owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr", tags: ["품질관리", "에스컬레이션", "생산"], specificUrl: "https://n8n.kolmar.co.kr/workflow/004", updatedAt: "2025.06.18", likes: 3 },
  { id: "PA-001", platformId: "pa", title: "결재 문서 SharePoint 자동 저장", summary: "전자결재 완료 시 문서를 SharePoint 지정 폴더에 자동으로 보관", description: "", status: "사용 가능", dept: "경영지원팀", company: ["KKM"], owner: "최유진", ownerEmail: "yujin.choi@kolmar.co.kr", tags: ["SharePoint", "전자결재", "문서관리"], specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-001", updatedAt: "2025.07.01", likes: 12 },
  { id: "PA-002", platformId: "pa", title: "양식 제출 → Teams 알림 플로우", summary: "Microsoft Forms 제출 시 담당자에게 Teams 메시지 및 이메일 동시 발송", description: "", status: "사용 가능", dept: "인사팀", company: [], owner: "김민지", ownerEmail: "minji.kim@kolmar.co.kr", tags: ["Forms", "Teams", "알림"], specificUrl: "", updatedAt: "2025.06.15", likes: 8 },
  { id: "AST-001", platformId: "assistant", title: "법무 검토 보조 봇", summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", description: "", status: "사용 가능", dept: "법무팀", company: [], owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr", tags: ["법무", "계약서검토", "위험분석"], specificUrl: "https://assistant.kolmar.co.kr/agents/legal-review", updatedAt: "2025.06.10", likes: 25 },
  { id: "AST-002", platformId: "assistant", title: "회의록 요약 봇", summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리", description: "", status: "사용 가능", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["회의록", "요약", "Teams연동"], specificUrl: "https://assistant.kolmar.co.kr/agents/meeting-summary", updatedAt: "2025.06.14", likes: 18 },
  { id: "AST-003", platformId: "assistant", title: "코드 리뷰 어시스턴트", summary: "GitHub PR에 자동으로 코드 리뷰 코멘트를 남기는 봇", description: "", status: "준비 중", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["코드리뷰", "GitHub", "개발도구"], specificUrl: "https://assistant.kolmar.co.kr/agents/code-review", updatedAt: "2025.06.19", likes: 10 },
  { id: "AST-004", platformId: "assistant", title: "원료 안전성 문의 봇", summary: "원료의 MSDS·규제 정보를 빠르게 조회하는 연구원용 봇", description: "", status: "준비 중", dept: "메이크업연구소", company: ["KKM"], owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr", tags: ["원료", "MSDS", "규제정보"], specificUrl: "https://assistant.kolmar.co.kr/agents/ingredient-safety", updatedAt: "2025.06.20", likes: 5 },
  // AI Agent 카탈로그 (10건) — DeepSeek: 도입 확정 시 추가 (중국어 업무 대응, status 일부 제한으로 등록 예정)
  { id: "AIO-001", platformId: "ai-orchestration", title: "GPT-5.4 (OpenAI)", summary: "범용 업무 전반에 무난한 기본 선택지입니다.", description: "", status: "사용 가능", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["범용", "빠른 응답", "문서 작성"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 38, modelMeta: { provider: "OpenAI", contextWindow: "매우 긴 문서 (책 한 권 분량)", strengths: ["범용", "빠른 응답", "문서 작성"], costTier: "보통" } },
  { id: "AIO-002", platformId: "ai-orchestration", title: "GPT-5.4 Mini (OpenAI)", summary: "단순하고 반복적인 작업을 빠르고 저렴하게 처리합니다.", description: "", status: "사용 가능", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["저비용", "반복 작업", "코딩 보조"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 22, modelMeta: { provider: "OpenAI", contextWindow: "문서 여러 장 (수십 페이지)", strengths: ["저비용", "반복 작업", "코딩 보조"], costTier: "낮음" } },
  { id: "AIO-003", platformId: "ai-orchestration", title: "Claude Opus 4.8 (Anthropic)", summary: "가장 어려운 문제를 끝까지 푸는 데 강한 최상위 모델입니다.", description: "", status: "사용 가능", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["복잡한 추론", "에이전트 코딩", "다단계 분석"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 29, modelMeta: { provider: "Anthropic", contextWindow: "매우 긴 문서 (책 한 권 분량)", strengths: ["복잡한 추론", "에이전트 코딩", "다단계 분석"], costTier: "높음" } },
  { id: "AIO-004", platformId: "ai-orchestration", title: "Claude Sonnet 4.6 (Anthropic)", summary: "일상 업무의 기본기가 가장 균형 잡힌 모델입니다.", description: "", status: "사용 가능", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["문서 분석", "균형", "긴 문서"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 35, modelMeta: { provider: "Anthropic", contextWindow: "매우 긴 문서 (책 한 권 분량)", strengths: ["문서 분석", "균형", "긴 문서"], costTier: "보통" } },
  { id: "AIO-005", platformId: "ai-orchestration", title: "Claude Haiku 4.5 (Anthropic)", summary: "가장 빠른 응답이 필요할 때 선택합니다.", description: "", status: "사용 가능", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["최고 속도", "분류·추출", "대량 처리"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 18, modelMeta: { provider: "Anthropic", contextWindow: "문서 여러 장 (수십 페이지)", strengths: ["최고 속도", "분류·추출", "대량 처리"], costTier: "낮음" } },
  { id: "AIO-006", platformId: "ai-orchestration", title: "Gemini 3.1 Pro (Google)", summary: "아주 긴 문서에서 필요한 내용을 찾아내는 검색형 작업에 강합니다.", description: "", status: "사용 가능", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["긴 문서 검색", "이미지 분석", "비용 효율"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 15, modelMeta: { provider: "Google", contextWindow: "매우 긴 문서 (책 한 권 분량)", strengths: ["긴 문서 검색", "이미지 분석", "비용 효율"], costTier: "보통" } },
  { id: "AIO-007", platformId: "ai-orchestration", title: "Gemini 3.5 Flash (Google)", summary: "도구 연동이 필요한 에이전트 작업을 빠르고 저렴하게 처리합니다.", description: "", status: "사용 가능", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["도구 연동", "멀티모달", "빠른 처리"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 11, modelMeta: { provider: "Google", contextWindow: "매우 긴 문서 (책 한 권 분량)", strengths: ["도구 연동", "멀티모달", "빠른 처리"], costTier: "낮음" } },
  { id: "AIO-008", platformId: "ai-orchestration", title: "EXAONE 4.5 (LG AI)", summary: "계약서, 도면, 재무제표 등 산업 현장 문서를 시각적으로 이해하는 데 특화되어 있습니다.", description: "", status: "사용 가능", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["산업 문서", "시각적 이해", "한국어"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 8, modelMeta: { provider: "LG AI", contextWindow: "문서 여러 장 (수십 페이지)", strengths: ["산업 문서", "시각적 이해", "한국어"], costTier: "낮음" } },
  { id: "AIO-009", platformId: "ai-orchestration", title: "Solar Pro 3 (Upstage)", summary: "한국어 업무 문서 처리와 에이전트 작업에 강한 국산 모델입니다.", description: "", status: "사용 가능", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["한국어 문서", "빠른 응답", "저비용"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 7, modelMeta: { provider: "Upstage", contextWindow: "문서 여러 장 (수십 페이지)", strengths: ["한국어 문서", "빠른 응답", "저비용"], costTier: "낮음" } },
  { id: "AIO-010", platformId: "ai-orchestration", title: "웍스 대표 모델", summary: "무엇을 골라야 할지 모를 때 쓰는 사내 기본 모델입니다.", description: "", status: "사용 가능", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["사내 기본", "최신 유지", "고민 불필요"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.07.01", likes: 44, modelMeta: { provider: "웍스 대표 모델", contextWindow: "매우 긴 문서 (책 한 권 분량)", strengths: ["사내 기본", "최신 유지", "고민 불필요"], costTier: "보통" } },
  {
    id: "ML-001", platformId: "ml", title: "조색 예측 ML 모델", summary: "원료 배합 비율로 최종 색상을 예측하는 회귀 모델", description: "",
    status: "준비 중", dept: "메이크업연구소", company: ["KKM"], owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr",
    tags: ["TensorFlow", "회귀모델", "색상예측"], specificUrl: "", updatedAt: "2025.06.01", likes: 21,
    mlType: "회귀 (Regression)", performanceSummary: "평균 오차 3% 이내",
  },
  {
    id: "ML-002", platformId: "ml", title: "원료 수요 예측 모델", summary: "과거 생산·판매 데이터를 기반으로 월별 원료 수요를 예측", description: "",
    status: "준비 중", dept: "구매팀", company: ["KKM", "KBH"], owner: "이재훈", ownerEmail: "jaehoon.lee@kolmar.co.kr",
    tags: ["수요예측", "시계열", "구매"], specificUrl: "", updatedAt: "2025.06.20", likes: 9,
    mlType: "시계열 예측", performanceSummary: "RMSE 12.4 (검증셋 기준)",
  },
  {
    id: "VIBE-001", platformId: "vibe", title: "일일 판매 리포트 자동 생성기", summary: "ERP 데이터를 읽어 매일 아침 판매 실적 요약을 Slack으로 발송", description: "",
    status: "사용 가능", dept: "영업기획팀", company: ["KKM"], owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr",
    tags: ["ERP", "Slack", "리포트자동화"], specificUrl: "", updatedAt: "2025.07.05", likes: 8,
    devTool: "Cursor, Claude", outputType: "Python 스크립트 + Slack 알림",
  },
  {
    id: "VIBE-002", platformId: "vibe", title: "원가 분석 자동화 스크립트", summary: "ChatGPT로 작성한 Python 스크립트로 ERP 원가 데이터 자동 분석 및 리포트 생성", description: "",
    status: "준비 중", dept: "재무팀", company: ["KMG"], owner: "오현진", ownerEmail: "hyunjin.oh@kolmar.co.kr",
    tags: ["원가분석", "Python", "ERP"], specificUrl: "", updatedAt: "2025.06.21", likes: 6,
    devTool: "ChatGPT", outputType: "Python 스크립트",
  },
  // 추가 n8n
  { id: "N8N-005", platformId: "n8n", title: "Outlook 긴급 메일 자동 전달", summary: "긴급 키워드 메일 수신 시 팀장에게 즉시 자동 전달", description: "", status: "사용 가능", dept: "IT인프라팀", company: ["KKM"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr", tags: ["Outlook", "긴급메일", "알림"], specificUrl: "https://n8n.kolmar.co.kr/workflow/005", updatedAt: "2025.07.03", likes: 22 },
  { id: "N8N-006", platformId: "n8n", title: "주간 재고 현황 자동 취합", summary: "매주 월요일 각 창고의 재고 데이터를 취합해 경영진에게 요약 메일 발송", description: "", status: "사용 가능", dept: "구매팀", company: ["KKM", "KBH"], owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["재고관리", "ERP", "자동발송"], specificUrl: "https://n8n.kolmar.co.kr/workflow/006", updatedAt: "2025.07.02", likes: 8 },
  { id: "N8N-007", platformId: "n8n", title: "연구원 출장 신청 자동 처리", summary: "출장 신청서 제출 시 결재 라인을 자동으로 설정하고 일정·항공편 조회 링크 발송", description: "", status: "준비 중", dept: "메이크업연구소", company: ["KKM"], owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr", tags: ["출장관리", "HR", "일정"], specificUrl: "", updatedAt: "2025.06.25", likes: 5 },
  { id: "N8N-008", platformId: "n8n", title: "생산 실적 KPI 일일 집계", summary: "생산 시스템에서 라인별 실적을 자동 집계해 품질·생산팀에 공유", description: "", status: "사용 가능", dept: "품질관리팀", company: ["KKM", "KMW"], owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr", tags: ["생산실적", "KPI", "집계"], specificUrl: "https://n8n.kolmar.co.kr/workflow/008", updatedAt: "2025.07.05", likes: 10 },
  // 추가 Power Automate
  { id: "PA-003", platformId: "pa", title: "팀 주간 보고서 Teams 자동 게시", summary: "SharePoint에 업로드된 주간 보고서를 매주 월요일 Teams 채널에 자동 게시", description: "", status: "사용 가능", dept: "기획팀", company: [], owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr", tags: ["Teams", "SharePoint", "보고서"], specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-003", updatedAt: "2025.07.04", likes: 14 },
  { id: "PA-004", platformId: "pa", title: "재고 부족 알림 자동화", summary: "ERP 재고 수준이 기준치 이하로 내려가면 구매 담당자에게 즉시 Teams 알림 발송", description: "", status: "준비 중", dept: "구매팀", company: ["KKM"], owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["재고관리", "ERP", "알림"], specificUrl: "", updatedAt: "2025.06.22", likes: 7 },
  { id: "PA-005", platformId: "pa", title: "계약 만료 사전 알림 플로우", summary: "계약 만료 30일·7일 전 계약 담당자에게 자동으로 갱신 알림 이메일 발송", description: "", status: "사용 가능", dept: "법무팀", company: [], owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr", tags: ["계약관리", "알림", "법무"], specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-005", updatedAt: "2025.07.06", likes: 11 },
  { id: "PA-006", platformId: "pa", title: "신규 공급사 등록 승인 워크플로우", summary: "신규 공급사 등록 요청 시 구매·재무·법무 순서로 단계별 승인 자동 진행", description: "", status: "준비 중", dept: "구매팀", company: ["KKM", "KBH", "HC"], owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["공급사관리", "승인워크플로우", "ERP"], specificUrl: "", updatedAt: "2025.06.28", likes: 6 },
  // 추가 나만의 비서
  { id: "AST-005", platformId: "assistant", title: "영업 제안서 초안 봇", summary: "고객사 정보와 요구사항을 입력하면 맞춤형 제안서 초안을 자동 생성", description: "", status: "사용 가능", dept: "영업기획팀", company: [], owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr", tags: ["제안서", "영업지원", "문서작성"], specificUrl: "https://assistant.kolmar.co.kr/agents/proposal-draft", updatedAt: "2025.07.02", likes: 15 },
  { id: "AST-006", platformId: "assistant", title: "HR 정책 문답 봇", summary: "복리후생·휴가·규정 등 HR 정책 질문에 즉시 답변하는 직원용 Q&A 봇", description: "", status: "사용 가능", dept: "인사팀", company: [], owner: "김민지", ownerEmail: "minji.kim@kolmar.co.kr", tags: ["HR정책", "복리후생", "Q&A"], specificUrl: "https://assistant.kolmar.co.kr/agents/hr-policy", updatedAt: "2025.07.01", likes: 20 },
  { id: "AST-007", platformId: "assistant", title: "원자재 가격 동향 요약 봇", summary: "원자재 뉴스와 공시 데이터를 분석해 구매팀에 주요 가격 변동 동향 요약 제공", description: "", status: "준비 중", dept: "구매팀", company: ["KKM", "KBH"], owner: "이재훈", ownerEmail: "jaehoon.lee@kolmar.co.kr", tags: ["원자재", "가격분석", "구매"], specificUrl: "", updatedAt: "2025.06.30", likes: 8 },
  // 추가 ML 모델
  {
    id: "ML-003", platformId: "ml", title: "불량품 이미지 분류 모델", summary: "생산 라인 카메라 이미지로 불량품을 실시간 자동 판별하는 CNN 모델", description: "",
    status: "일부 제한", dept: "품질관리팀", company: ["KKM", "KMW"], owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr",
    tags: ["이미지분류", "불량검출", "CNN"], specificUrl: "", updatedAt: "2025.07.06", likes: 16,
    mlType: "분류 (Classification)", performanceSummary: "정확도 96.2% (테스트셋 기준)",
  },
  {
    id: "ML-004", platformId: "ml", title: "처방 성분 상호작용 예측 모델", summary: "의약품 성분 조합의 부작용 가능성을 예측하는 분류 모델", description: "",
    status: "준비 중", dept: "건강기능식품연구소", company: ["KBH"], owner: "최유진", ownerEmail: "yujin.choi@kolmar.co.kr",
    tags: ["의약품", "성분분석", "분류모델"], specificUrl: "", updatedAt: "2025.06.15", likes: 12,
    mlType: "분류 (Classification)", performanceSummary: "F1-score 0.89 (검증셋 기준)",
  },
  {
    id: "ML-005", platformId: "ml", title: "판매 채널별 수요 예측 모델", summary: "온라인·오프라인·홈쇼핑 채널별 제품 수요를 동시에 예측하는 다변량 시계열 모델", description: "",
    status: "준비 중", dept: "영업기획팀", company: ["KKM", "HC"], owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr",
    tags: ["수요예측", "채널분석", "시계열"], specificUrl: "", updatedAt: "2025.07.07", likes: 9,
    mlType: "시계열 예측", performanceSummary: "MAPE 8.3% (3개월 예측 기준)",
  },
  // 추가 Vibe Coding
  {
    id: "VIBE-003", platformId: "vibe", title: "부서별 KPI 현황판 자동화", summary: "Excel KPI 데이터를 읽어 자동으로 부서별 성과 대시보드를 그려주는 Python 앱", description: "",
    status: "사용 가능", dept: "경영기획팀", company: ["KKM"], owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr",
    tags: ["KPI", "대시보드", "Python"], specificUrl: "", updatedAt: "2025.07.06", likes: 13,
    devTool: "Cursor", outputType: "Python 앱 (Streamlit)",
  },
  {
    id: "VIBE-004", platformId: "vibe", title: "커피 룰렛 웹앱", summary: "팀원 명단을 업로드하면 커피 당번을 무작위 선정하는 인트라넷 미니앱", description: "",
    status: "사용 가능", dept: "마케팅팀", company: [], owner: "박직원", ownerEmail: "jiik.jung@kolmar.co.kr",
    tags: ["사내앱", "팀문화", "웹앱"], specificUrl: "", updatedAt: "2025.06.20", likes: 31,
    devTool: "바이브 코딩 도구", outputType: "웹앱 (HTML/JS)",
  },
  {
    id: "VIBE-005", platformId: "vibe", title: "ECM 멀티 파일 다운로더", summary: "ECM에서 여러 파일을 한 번에 선택하고 다운로드하는 유틸리티 프로그램", description: "",
    status: "사용 가능", dept: "IT인프라팀", company: ["KKM"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["ECM", "파일관리", "생산성"], specificUrl: "", updatedAt: "2025.07.04", likes: 24,
    devTool: "Claude Code", outputType: "Windows 실행 프로그램",
  },
];

const SORT_OPTIONS = ["최신순", "인기순", "이름순", "부서순"] as const;

const SOURCE_OPTIONS: { key: "전체" | PlatformId; label: string }[] = [
  { key: "전체", label: "전체" },
  ...PLATFORMS.map(p => ({ key: p.id, label: p.name })),
];

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = Object.fromEntries(
  PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])
);

const COST_TIER_BADGE_COLOR: Record<"낮음" | "보통" | "높음", { bg: string; color: string }> = {
  "낮음": { bg: "#DCFCE7", color: "#166534" },
  "보통": { bg: "#DBEAFE", color: "#1E3A8A" },
  "높음": { bg: "#FFEDD5", color: "#9A3412" },
};

const HeartIcon = ({ color = "#94A3B8" }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={color === "#94A3B8" ? "none" : color} stroke={color} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);


export default function ProjectListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isGroupViewer } = useAuth();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [source, setSource] = useState<"전체" | PlatformId>(() => {
    const p = searchParams.get("platform");
    return (p && PLATFORMS.some(pl => pl.id === p)) ? p as PlatformId : "전체";
  });
  const [status, setStatus] = useState<"전체" | PlatformItemStatus>(() => {
    const s = searchParams.get("status");
    const reverseMap = Object.fromEntries(
      Object.entries(STATUS_QUERY_KEY).map(([k, v]) => [v, k as PlatformItemStatus])
    );
    return reverseMap[s ?? ""] ?? "전체";
  });
  const [company, setCompany] = useState<string>(() => (isGroupViewer ? "전체" : (user?.company ?? "전체")));
  const [companySearch, setCompanySearch] = useState("");
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]>("최신순");
  const [hovered, setHovered] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();
  const resetAtRef = useRef<number | null>(null);
  useEffect(() => {
    const _resetAt = (location.state as { _resetAt?: number } | null)?._resetAt ?? null;
    if (_resetAt !== null && _resetAt !== resetAtRef.current) {
      resetAtRef.current = _resetAt;
      setSource("전체");
      setStatus("전체");
      setCompany(isGroupViewer ? "전체" : (user?.company ?? "전체"));
      setSearch("");
      setSort("최신순");
      setSidebarOpen(false);
      setSearchParams({});
    }
  }, [location.state]);

  const handleSourceChange = (newSource: "전체" | PlatformId) => {
    setSource(newSource);
  };

  useEffect(() => {
    if (search) setSearchParams({ q: search });
    else setSearchParams({});
  }, [search]);

  const availableCompanies = useMemo(
    () => isGroupViewer ? COMPANIES : COMPANIES.filter(c => c.visible),
    [isGroupViewer]
  );

  const resetFilters = () => {
    setSource("전체"); setStatus("전체");
    setCompany(isGroupViewer ? "전체" : (user?.company ?? "전체"));
  };

  const activeFilterCount = [
    source !== "전체",
    company !== "전체",
    status !== "전체",
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    const items = MOCK_PLATFORM_ITEMS.filter(item => {
      if (source !== "전체" && item.platformId !== source) return false;

      const itemCompanies = item.company ?? [];
      const isCompanyWide = itemCompanies.length === 0;
      const hasNonVisible = itemCompanies.some(code => !COMPANIES.find(c => c.code === code)?.visible);
      if (!isCompanyWide && hasNonVisible && !isGroupViewer) return false;
      if (company !== "전체" && !isCompanyWide && !itemCompanies.includes(company)) return false;
      if (status !== "전체" && item.status !== status) return false;

      return search === "" ||
        item.title.includes(search) ||
        item.summary.includes(search) ||
        item.tags.some(t => t.includes(search)) ||
        item.dept.includes(search);
    });

    return items.sort((a, b) => {
      if (sort === "최신순") return new Date(b.updatedAt.replace(/\./g, "-")).getTime() - new Date(a.updatedAt.replace(/\./g, "-")).getTime();
      if (sort === "인기순") return b.likes - a.likes;
      if (sort === "이름순") return a.title.localeCompare(b.title, "ko");
      if (sort === "부서순") return a.dept.localeCompare(b.dept, "ko");
      return 0;
    });
  }, [search, status, sort, company, source, isGroupViewer]);

  const filteredCompanyOptions = availableCompanies.filter(c => companySearch === "" || c.name.includes(companySearch));

  const detailPathOf = (item: PlatformItem) => {
    const platform = PLATFORMS.find(p => p.id === item.platformId)!;
    return `${platform.path}/${item.id}`;
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "20px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            AX Platform
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              AX 플랫폼 탐색
            </h1>
            <div style={{ position: "relative", width: 340 }}>
              <input
                type="text"
                placeholder="워크플로우, AI 에이전트, ML 모델 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "9px 40px 9px 14px",
                  fontSize: 13, color: "#0F172A",
                  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                  borderRadius: 8, outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
              <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {isGroupViewer && (
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "#F3E8FF", border: "1px solid #E9D5FF", borderRadius: 20, padding: "4px 12px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>그룹 전체보기 권한으로 모든 관계사 항목을 조회 중입니다</span>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px", display: "flex", gap: 24 }}>

        {/* SIDEBAR */}
        {sidebarOpen && (
          <div style={{ width: 192, flexShrink: 0 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>필터</span>
                <span onClick={resetFilters} style={{ fontSize: 11, color: "#94A3B8", cursor: "pointer", fontWeight: 500 }}>초기화</span>
              </div>

              {/* 플랫폼 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                  플랫폼
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {SOURCE_OPTIONS.map(opt => {
                    const style = opt.key === "전체" ? null : SOURCE_STYLE[opt.key];
                    return (
                      <div key={opt.key} onClick={() => handleSourceChange(opt.key)} style={{
                        padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                        fontSize: 13, fontWeight: source === opt.key ? 600 : 400,
                        color: source === opt.key ? "#2563EB" : "#475569",
                        background: source === opt.key ? "#EFF6FF" : "transparent",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        {style && <span style={{ width: 7, height: 7, borderRadius: 2, background: style.color, display: "inline-block", flexShrink: 0 }} />}
                        {opt.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 상태 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                  상태
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {(["전체", ...STATUS_ORDER] as const).map(opt => (
                    <button key={opt} onClick={() => setStatus(opt as "전체" | PlatformItemStatus)} style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      border: "1.5px solid",
                      borderColor: status === opt ? "#2563EB" : "#E2E8F0",
                      background: status === opt ? "#EFF6FF" : "#fff",
                      color: status === opt ? "#2563EB" : "#475569",
                    }}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* 관계사 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                  관계사
                </div>
                <input
                  value={companySearch}
                  onChange={e => setCompanySearch(e.target.value)}
                  placeholder="관계사 검색"
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "6px 10px", fontSize: 12,
                    border: "1.5px solid #E2E8F0", borderRadius: 6, outline: "none", marginBottom: 6,
                  }}
                />
                <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                  <div onClick={() => setCompany("전체")} style={{
                    padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13,
                    fontWeight: company === "전체" ? 600 : 400,
                    color: company === "전체" ? "#2563EB" : "#475569",
                    background: company === "전체" ? "#EFF6FF" : "transparent",
                  }}>전체</div>
                  {filteredCompanyOptions.map(c => (
                    <div key={c.code} onClick={() => setCompany(c.code)} style={{
                      padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13,
                      display: "flex", alignItems: "center", gap: 6,
                      fontWeight: company === c.code ? 600 : 400,
                      color: company === c.code ? "#2563EB" : "#475569",
                      background: company === c.code ? "#EFF6FF" : "transparent",
                    }}>
                      {c.name}
                      {!c.visible && <span style={{ fontSize: 9, fontWeight: 700, background: "#F3E8FF", color: "#6D28D9", padding: "1px 5px", borderRadius: 20 }}>전체보기</span>}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 6, lineHeight: 1.5 }}>
                  전사 공용 항목은 관계사를 선택해도 항상 함께 표시됩니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setSidebarOpen(v => !v)} style={{
                background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6,
                padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#475569",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                {sidebarOpen ? "필터 닫기" : "필터 열기"}
                {!sidebarOpen && activeFilterCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, background: "#2563EB", color: "#fff", padding: "1px 7px", borderRadius: 20 }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <span style={{ fontSize: 13, color: "#64748B" }}>
                <strong style={{ color: "#0F172A" }}>{filtered.length}</strong>개 항목
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt} onClick={() => setSort(opt)} style={{
                  padding: "5px 12px", borderRadius: 6,
                  borderWidth: 1.5, borderStyle: "solid",
                  borderColor: sort === opt ? "#2563EB" : "#E2E8F0",
                  background: sort === opt ? "#EFF6FF" : "#fff",
                  color: sort === opt ? "#2563EB" : "#475569",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {(source !== "전체" || status !== "전체" || company !== "전체") && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[
                source !== "전체" && SOURCE_OPTIONS.find(o => o.key === source)?.label,
                company !== "전체" && COMPANIES.find(c => c.code === company)?.name,
                status !== "전체" && status,
              ].filter(Boolean).map((f, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 600, background: "#DBEAFE", color: "#1E40AF",
                  padding: "3px 10px", borderRadius: 20, border: "1px solid #BFDBFE",
                }}>
                  {f}
                </span>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 14 }}>
              검색 결과가 없습니다.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {filtered.map((item, i) => {
                const sourceStyle = SOURCE_STYLE[item.platformId];
                const sideColor = hovered === i ? sourceStyle.color : "#E2E8F0";
                const statusStyle = STATUS_COLOR[item.status] ?? { bg: "#F1F5F9", fg: "#475569" };
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(detailPathOf(item))}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      background: "#fff",
                      borderTop: `3px solid ${sourceStyle.color}`,
                      borderRight: `1.5px solid ${sideColor}`,
                      borderBottom: `1.5px solid ${sideColor}`,
                      borderLeft: `1.5px solid ${sideColor}`,
                      borderRadius: 10, padding: "15px 17px",
                      cursor: "pointer",
                      transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s",
                      boxShadow: hovered === i ? `0 6px 18px ${sourceStyle.color}1F` : "0 1px 2px rgba(0,0,0,0.02)",
                      transform: hovered === i ? "translateY(-1px)" : "none",
                      display: "flex", flexDirection: "column",
                      minHeight: 172,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: statusStyle.bg, color: statusStyle.fg,
                          padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                        }}>
                          {item.status}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: sourceStyle.bg, color: sourceStyle.color,
                          padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                        }}>
                          {sourceStyle.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#94A3B8", flexShrink: 0 }}>
                        <HeartIcon />
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{item.likes}</span>
                      </div>
                    </div>

                    <div style={{
                      fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6, lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {item.title}
                    </div>

                    <div style={{
                      fontSize: 12, color: "#64748B", lineHeight: 1.5, marginBottom: 12,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {item.summary}
                    </div>

                    {item.platformId === "ai-orchestration" && item.modelMeta ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                        {item.modelMeta.strengths.slice(0, 3).map((s, si) => (
                          <span key={si} style={{ fontSize: 10, fontWeight: 600, background: "#F5F3FF", color: "#6D28D9", padding: "2px 7px", borderRadius: 4 }}>
                            {s}
                          </span>
                        ))}
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: COST_TIER_BADGE_COLOR[item.modelMeta.costTier].bg,
                          color: COST_TIER_BADGE_COLOR[item.modelMeta.costTier].color,
                          padding: "2px 7px", borderRadius: 4,
                        }}>
                          비용 {item.modelMeta.costTier}
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                        {item.tags.slice(0, 3).map((t, ti) => (
                          <span key={ti} style={{
                            fontSize: 10, fontWeight: 600,
                            background: "#F1F5F9", color: "#475569",
                            padding: "2px 7px", borderRadius: 4,
                          }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginTop: "auto", gap: 8,
                    }}>
                      <span style={{ fontSize: 10, color: "#CBD5E1", flexShrink: 0 }}>
                        업데이트 {item.updatedAt}
                      </span>
                      <span style={{
                        fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110, textAlign: "right",
                      }}>
                        {item.dept}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
