import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { PLATFORMS, STATUS_COLOR } from "../types/platformTypes";
import type { PlatformItem, PlatformId } from "../types/platformTypes";
import { CONTENT_MAX_WIDTH } from "../styles/layout";


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
  { id: "PA-002", platformId: "pa", title: "양식 제출 → Teams 알림 플로우", summary: "Microsoft Forms 제출 시 담당자에게 Teams 메시지 및 이메일 동시 발송", description: "", status: "사용 가능", dept: "인사팀", company: [], owner: "김민지", ownerEmail: "minji.kim@kolmar.co.kr", tags: ["Forms", "Teams", "알림"], specificUrl: "", updatedAt: "2025.06.15", likes: 8, usageMode: "contact" },
  { id: "AST-001", platformId: "assistant", title: "법무 검토 보조 봇", summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", description: "", status: "사용 가능", dept: "법무팀", company: [], owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr", tags: ["법무", "계약서검토", "위험분석"], specificUrl: "https://assistant.kolmar.co.kr/agents/legal-review", updatedAt: "2025.06.10", likes: 25 },
  { id: "AST-002", platformId: "assistant", title: "회의록 요약 봇", summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리", description: "", status: "사용 가능", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["회의록", "요약", "Teams연동"], specificUrl: "https://assistant.kolmar.co.kr/agents/meeting-summary", updatedAt: "2025.06.14", likes: 18 },
  { id: "AST-003", platformId: "assistant", title: "코드 리뷰 어시스턴트", summary: "GitHub PR에 자동으로 코드 리뷰 코멘트를 남기는 봇", description: "", status: "준비 중", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["코드리뷰", "GitHub", "개발도구"], specificUrl: "https://assistant.kolmar.co.kr/agents/code-review", updatedAt: "2025.06.19", likes: 10 },
  { id: "AST-004", platformId: "assistant", title: "원료 안전성 문의 봇", summary: "원료의 MSDS·규제 정보를 빠르게 조회하는 연구원용 봇", description: "", status: "준비 중", dept: "메이크업연구소", company: ["KKM"], owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr", tags: ["원료", "MSDS", "규제정보"], specificUrl: "https://assistant.kolmar.co.kr/agents/ingredient-safety", updatedAt: "2025.06.20", likes: 5 },
  // AI Agent 카탈로그 (11건)
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
  { id: "AIO-011", platformId: "ai-orchestration", title: "DeepSeek R2 (DeepSeek)", summary: "중국어 문서 번역·분석에 최적화된 고성능 오픈소스 모델입니다.", description: "", status: "일부 제한", dept: "DX전략팀", company: [], owner: "DX전략팀", ownerEmail: "dx@kolmar.co.kr", tags: ["중국어", "번역", "오픈소스"], specificUrl: "https://hkgpt.kolmar.co.kr", updatedAt: "2026.06.01", likes: 6, modelMeta: { provider: "DeepSeek", contextWindow: "매우 긴 문서 (책 한 권 분량)", strengths: ["중국어 번역", "저비용", "오픈소스"], costTier: "낮음" }, statusNote: "개인정보·영업비밀 포함 문서 입력 금지. 외부 서버로 데이터가 전송되므로 반드시 비공개 정보 제거 후 사용 (IT보안 정책 2025.05)", usageMode: "contact" },
  {
    id: "ML-001", platformId: "ml", title: "조색 예측 ML 모델", summary: "원료 배합 비율로 최종 색상을 예측하는 회귀 모델", description: "",
    status: "준비 중", dept: "메이크업연구소", company: ["KKM"], owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr",
    tags: ["TensorFlow", "회귀모델", "색상예측"], specificUrl: "", updatedAt: "2025.06.01", likes: 21,
    mlType: "회귀 (Regression)", performanceSummary: "평균 오차 3% 이내",
    usageMode: "contact",
  },
  {
    id: "ML-002", platformId: "ml", title: "원료 수요 예측 모델", summary: "과거 생산·판매 데이터를 기반으로 월별 원료 수요를 예측", description: "",
    status: "준비 중", dept: "구매팀", company: ["KKM", "KBH"], owner: "이재훈", ownerEmail: "jaehoon.lee@kolmar.co.kr",
    tags: ["수요예측", "시계열", "구매"], specificUrl: "", updatedAt: "2025.06.20", likes: 9,
    mlType: "시계열 예측", performanceSummary: "RMSE 12.4 (검증셋 기준)",
    usageMode: "contact",
  },
  {
    id: "VIBE-001", platformId: "vibe", title: "일일 판매 리포트 자동 생성기", summary: "ERP 데이터를 읽어 매일 아침 판매 실적 요약을 Slack으로 발송", description: "",
    status: "사용 가능", dept: "영업기획팀", company: ["KKM"], owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr",
    tags: ["ERP", "Slack", "리포트자동화"], specificUrl: "", updatedAt: "2025.07.05", likes: 8,
    devTool: "Cursor, Claude", outputType: "Python 스크립트 + Slack 알림",
    usageMode: "contact",
  },
  {
    id: "VIBE-002", platformId: "vibe", title: "원가 분석 자동화 스크립트", summary: "ChatGPT로 작성한 Python 스크립트로 ERP 원가 데이터 자동 분석 및 리포트 생성", description: "",
    status: "준비 중", dept: "재무팀", company: ["KMG"], owner: "오현진", ownerEmail: "hyunjin.oh@kolmar.co.kr",
    tags: ["원가분석", "Python", "ERP"], specificUrl: "", updatedAt: "2025.06.21", likes: 6,
    devTool: "ChatGPT", outputType: "Python 스크립트",
    usageMode: "contact",
  },
  // 추가 n8n
  { id: "N8N-005", platformId: "n8n", title: "Outlook 긴급 메일 자동 전달", summary: "긴급 키워드 메일 수신 시 팀장에게 즉시 자동 전달", description: "", status: "사용 가능", dept: "IT인프라팀", company: ["KKM"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr", tags: ["Outlook", "긴급메일", "알림"], specificUrl: "https://n8n.kolmar.co.kr/workflow/005", updatedAt: "2025.07.03", likes: 22 },
  { id: "N8N-006", platformId: "n8n", title: "주간 재고 현황 자동 취합", summary: "매주 월요일 각 창고의 재고 데이터를 취합해 경영진에게 요약 메일 발송", description: "", status: "사용 가능", dept: "구매팀", company: ["KKM", "KBH"], owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["재고관리", "ERP", "자동발송"], specificUrl: "https://n8n.kolmar.co.kr/workflow/006", updatedAt: "2025.07.02", likes: 8 },
  { id: "N8N-007", platformId: "n8n", title: "연구원 출장 신청 자동 처리", summary: "출장 신청서 제출 시 결재 라인을 자동으로 설정하고 일정·항공편 조회 링크 발송", description: "", status: "준비 중", dept: "메이크업연구소", company: ["KKM"], owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr", tags: ["출장관리", "HR", "일정"], specificUrl: "", updatedAt: "2025.06.25", likes: 5, usageMode: "contact" },
  { id: "N8N-008", platformId: "n8n", title: "생산 실적 KPI 일일 집계", summary: "생산 시스템에서 라인별 실적을 자동 집계해 품질·생산팀에 공유", description: "", status: "사용 가능", dept: "품질관리팀", company: ["KKM", "KMW"], owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr", tags: ["생산실적", "KPI", "집계"], specificUrl: "https://n8n.kolmar.co.kr/workflow/008", updatedAt: "2025.07.05", likes: 10 },
  // 추가 Power Automate
  { id: "PA-003", platformId: "pa", title: "팀 주간 보고서 Teams 자동 게시", summary: "SharePoint에 업로드된 주간 보고서를 매주 월요일 Teams 채널에 자동 게시", description: "", status: "사용 가능", dept: "기획팀", company: [], owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr", tags: ["Teams", "SharePoint", "보고서"], specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-003", updatedAt: "2025.07.04", likes: 14 },
  { id: "PA-004", platformId: "pa", title: "재고 부족 알림 자동화", summary: "ERP 재고 수준이 기준치 이하로 내려가면 구매 담당자에게 즉시 Teams 알림 발송", description: "", status: "준비 중", dept: "구매팀", company: ["KKM"], owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["재고관리", "ERP", "알림"], specificUrl: "", updatedAt: "2025.06.22", likes: 7, usageMode: "contact" },
  { id: "PA-005", platformId: "pa", title: "계약 만료 사전 알림 플로우", summary: "계약 만료 30일·7일 전 계약 담당자에게 자동으로 갱신 알림 이메일 발송", description: "", status: "사용 가능", dept: "법무팀", company: [], owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr", tags: ["계약관리", "알림", "법무"], specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-005", updatedAt: "2025.07.06", likes: 11 },
  { id: "PA-006", platformId: "pa", title: "신규 공급사 등록 승인 워크플로우", summary: "신규 공급사 등록 요청 시 구매·재무·법무 순서로 단계별 승인 자동 진행", description: "", status: "준비 중", dept: "구매팀", company: ["KKM", "KBH", "HC"], owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["공급사관리", "승인워크플로우", "ERP"], specificUrl: "", updatedAt: "2025.06.28", likes: 6, usageMode: "contact" },
  // 추가 나만의 비서
  { id: "AST-005", platformId: "assistant", title: "영업 제안서 초안 봇", summary: "고객사 정보와 요구사항을 입력하면 맞춤형 제안서 초안을 자동 생성", description: "", status: "사용 가능", dept: "영업기획팀", company: [], owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr", tags: ["제안서", "영업지원", "문서작성"], specificUrl: "https://assistant.kolmar.co.kr/agents/proposal-draft", updatedAt: "2025.07.02", likes: 15 },
  { id: "AST-006", platformId: "assistant", title: "HR 정책 문답 봇", summary: "복리후생·휴가·규정 등 HR 정책 질문에 즉시 답변하는 직원용 Q&A 봇", description: "", status: "사용 가능", dept: "인사팀", company: [], owner: "김민지", ownerEmail: "minji.kim@kolmar.co.kr", tags: ["HR정책", "복리후생", "Q&A"], specificUrl: "https://assistant.kolmar.co.kr/agents/hr-policy", updatedAt: "2025.07.01", likes: 20 },
  { id: "AST-007", platformId: "assistant", title: "원자재 가격 동향 요약 봇", summary: "원자재 뉴스와 공시 데이터를 분석해 구매팀에 주요 가격 변동 동향 요약 제공", description: "", status: "준비 중", dept: "구매팀", company: ["KKM", "KBH"], owner: "이재훈", ownerEmail: "jaehoon.lee@kolmar.co.kr", tags: ["원자재", "가격분석", "구매"], specificUrl: "", updatedAt: "2025.06.30", likes: 8, usageMode: "contact" },
  // 추가 ML 모델
  {
    id: "ML-003", platformId: "ml", title: "불량품 이미지 분류 모델", summary: "생산 라인 카메라 이미지로 불량품을 실시간 자동 판별하는 CNN 모델", description: "",
    status: "일부 제한", dept: "품질관리팀", company: ["KKM", "KMW"], owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr",
    tags: ["이미지분류", "불량검출", "CNN"], specificUrl: "", updatedAt: "2025.07.06", likes: 16,
    mlType: "분류 (Classification)", performanceSummary: "정확도 96.2% (테스트셋 기준)",
    statusNote: "KKM·KMW 생산 라인 카메라에만 연동됨. 신규 라인 적용 전 카메라 스펙 검증 필요 (품질팀 요청)",
    usageMode: "contact",
  },
  {
    id: "ML-004", platformId: "ml", title: "처방 성분 상호작용 예측 모델", summary: "의약품 성분 조합의 부작용 가능성을 예측하는 분류 모델", description: "",
    status: "준비 중", dept: "건강기능식품연구소", company: ["KBH"], owner: "최유진", ownerEmail: "yujin.choi@kolmar.co.kr",
    tags: ["의약품", "성분분석", "분류모델"], specificUrl: "", updatedAt: "2025.06.15", likes: 12,
    mlType: "분류 (Classification)", performanceSummary: "F1-score 0.89 (검증셋 기준)",
    usageMode: "contact",
  },
  {
    id: "ML-005", platformId: "ml", title: "판매 채널별 수요 예측 모델", summary: "온라인·오프라인·홈쇼핑 채널별 제품 수요를 동시에 예측하는 다변량 시계열 모델", description: "",
    status: "준비 중", dept: "영업기획팀", company: ["KKM", "HC"], owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr",
    tags: ["수요예측", "채널분석", "시계열"], specificUrl: "", updatedAt: "2025.07.07", likes: 9,
    mlType: "시계열 예측", performanceSummary: "MAPE 8.3% (3개월 예측 기준)",
    usageMode: "contact",
  },
  // 추가 Vibe Coding
  {
    id: "VIBE-003", platformId: "vibe", title: "부서별 KPI 현황판 자동화", summary: "Excel KPI 데이터를 읽어 자동으로 부서별 성과 대시보드를 그려주는 Python 앱", description: "",
    status: "사용 가능", dept: "경영기획팀", company: ["KKM"], owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr",
    tags: ["KPI", "대시보드", "Python"], specificUrl: "", updatedAt: "2025.07.06", likes: 13,
    devTool: "Cursor", outputType: "Python 앱 (Streamlit)",
    usageMode: "contact",
  },
  {
    id: "VIBE-004", platformId: "vibe", title: "커피 룰렛 웹앱", summary: "팀원 명단을 업로드하면 커피 당번을 무작위 선정하는 인트라넷 미니앱", description: "",
    status: "사용 가능", dept: "마케팅팀", company: [], owner: "박직원", ownerEmail: "jiik.jung@kolmar.co.kr",
    tags: ["사내앱", "팀문화", "웹앱"], specificUrl: "", updatedAt: "2025.06.20", likes: 31,
    devTool: "바이브 코딩 도구", outputType: "웹앱 (HTML/JS)",
    usageMode: "contact",
  },
  {
    id: "VIBE-005", platformId: "vibe", title: "ECM 멀티 파일 다운로더", summary: "ECM에서 여러 파일을 한 번에 선택하고 다운로드하는 유틸리티 프로그램", description: "",
    status: "사용 가능", dept: "IT인프라팀", company: ["KKM"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["ECM", "파일관리", "생산성"], specificUrl: "", updatedAt: "2025.07.04", likes: 24,
    devTool: "Claude Code", outputType: "Windows 실행 프로그램",
    usageMode: "contact",
  },
  // 일부 제한 항목
  { id: "N8N-009", platformId: "n8n", title: "SAP 전표 오류 실시간 알림", summary: "SAP 전표 처리 중 오류 감지 시 담당자에게 즉시 Teams 알림 발송", description: "", status: "일부 제한", dept: "재무팀", company: ["KKM"], owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr", tags: ["SAP", "ERP오류", "Teams알림"], specificUrl: "https://n8n.kolmar.co.kr/workflow/009", updatedAt: "2025.05.20", likes: 4, statusNote: "SAP 연동 권한이 KKM 법인에만 허용됨. 타 계열사 확장은 SAP 관리자 권한 신청 및 IT 심사 후 지원 예정", usageMode: "contact" },
  { id: "PA-007", platformId: "pa", title: "임직원 경비 청구 자동 검증", summary: "제출된 경비 청구서의 항목·금액을 사규 기준으로 자동 검증하고 이상 건 재무팀에 알림", description: "", status: "일부 제한", dept: "재무팀", company: [], owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr", tags: ["경비청구", "내부통제", "자동검증"], specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-007", updatedAt: "2025.06.10", likes: 9, statusNote: "5만 원 초과 건 및 해외 출장비는 수동 검토 필수. 전면 자동화 승인은 내부 감사팀 검토 진행 중", usageMode: "contact" },
  { id: "AST-008", platformId: "assistant", title: "구매 단가 협상 전략 봇", summary: "공급사 견적서를 입력하면 과거 단가 이력과 비교해 협상 포인트와 전략을 제안", description: "", status: "일부 제한", dept: "구매팀", company: ["KKM", "KBH"], owner: "이재훈", ownerEmail: "jaehoon.lee@kolmar.co.kr", tags: ["구매협상", "단가분석", "공급사관리"], specificUrl: "https://assistant.kolmar.co.kr/agents/purchase-strategy", updatedAt: "2025.06.28", likes: 7, statusNote: "시장 단가 기준 데이터가 월 1회 갱신되어 최근 시황 반영이 늦을 수 있음. 고액 협상 건은 구매팀 확인 권장", usageMode: "contact" },
  // 사용 중지 항목
  { id: "N8N-010", platformId: "n8n", title: "구 Slack 장애 알림 자동화", summary: "시스템 장애 감지 시 Slack 채널에 자동 알림을 발송하던 워크플로우", description: "", status: "사용 중지", dept: "IT인프라팀", company: ["KKM"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr", tags: ["Slack", "장애알림", "레거시"], specificUrl: "", updatedAt: "2024.09.01", likes: 2, statusNote: "2024년 9월 사내 협업 도구 Teams 전환 이후 운영 중단. 동일 기능의 Teams 버전(N8N-001)으로 이전 완료" },
  { id: "PA-008", platformId: "pa", title: "수기 설비 점검 기록 디지털화", summary: "종이 설비 점검 체크리스트를 스캔해 SharePoint 지정 폴더에 자동으로 저장하던 플로우", description: "", status: "사용 중지", dept: "IT인프라팀", company: ["KMW"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr", tags: ["설비점검", "SharePoint", "레거시"], specificUrl: "", updatedAt: "2025.03.15", likes: 1, statusNote: "설비관리 전용 모바일 점검 앱 도입(2025.03)으로 대체 완료. 기존 스캔 데이터는 SharePoint 아카이브에 보관" },
  { id: "AST-009", platformId: "assistant", title: "초기 법무 계약 검토 봇 (v1)", summary: "계약서 위험 조항을 식별하던 초기 법무 보조 봇 (현 AST-001의 전신)", description: "", status: "사용 중지", dept: "법무팀", company: [], owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr", tags: ["계약서검토", "법무", "레거시"], specificUrl: "", updatedAt: "2025.12.01", likes: 3, statusNote: "최신 모델 기반 법무 검토 보조 봇(AST-001)으로 완전 대체. 2025년 12월 서비스 종료 및 데이터 이관 완료" },
  {
    id: "VIBE-006", platformId: "vibe", title: "Excel VBA 주간 원가 정산 도구", summary: "ChatGPT가 작성한 VBA 매크로로 주간 원가 데이터를 자동 집계하던 도구", description: "",
    status: "사용 중지", dept: "재무팀", company: ["KMG"], owner: "오현진", ownerEmail: "hyunjin.oh@kolmar.co.kr",
    tags: ["원가정산", "VBA", "레거시"], specificUrl: "", updatedAt: "2025.10.01", likes: 2,
    devTool: "ChatGPT", outputType: "Excel VBA 매크로",
    statusNote: "보안팀 매크로 실행 정책 강화(2025.10)로 사용 금지 처리. n8n 기반 원가 자동화 워크플로우(VIBE-002 후속)로 이관",
  },
];

const SORT_OPTIONS = ["최신순", "인기순", "이름순"] as const;

const SOURCE_OPTIONS: { key: "전체" | PlatformId; label: string }[] = [
  { key: "전체", label: "전체" },
  ...PLATFORMS.map(p => ({ key: p.id, label: p.name })),
];

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = Object.fromEntries(
  PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])
);

const COST_TIER_BADGE_COLOR: Record<"낮음" | "보통" | "높음", { bg: string; color: string }> = {
  "낮음": { bg: "#DCFCE7", color: "#166534" },
  "보통": { bg: "#E8F0FE", color: "#1E3A8A" },
  "높음": { bg: "#FFEDD5", color: "#9A3412" },
};

const HeartIcon = ({ color = "#94A3B8" }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={color === "#94A3B8" ? "none" : color} stroke={color} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

type UsageFilter = "전체" | "바로 사용" | "담당자 문의" | "사용 중지" | "준비 중";

const matchUsage = (item: PlatformItem, f: UsageFilter): boolean => {
  if (f === "전체") return true;
  if (f === "사용 중지") return item.status === "사용 중지";
  if (f === "준비 중") return item.status === "준비 중";
  const isContact = item.usageMode === "contact" || item.status === "일부 제한";
  if (f === "담당자 문의") return item.status !== "사용 중지" && isContact;
  return item.status === "사용 가능" && !isContact;
};

function CompanyFilterDropdown({
  company, setCompany, availableCompanies,
}: {
  company: string;
  setCompany: (v: string) => void;
  availableCompanies: { code: string; name: string; visible: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const filteredList = availableCompanies.filter(c => search === "" || c.name.includes(search));
  const label = company === "전체"
    ? "전체 관계사"
    : availableCompanies.find(c => c.code === company)?.name ?? company;

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: company !== "전체" ? "#E8F0FE" : "#fff",
          color: company !== "전체" ? "#1C6BFF" : "#475569",
          borderTop: `1.5px solid ${company !== "전체" ? "#1C6BFF" : "#EBEEF3"}`,
          borderRight: `1.5px solid ${company !== "전체" ? "#1C6BFF" : "#EBEEF3"}`,
          borderBottom: `1.5px solid ${company !== "전체" ? "#1C6BFF" : "#EBEEF3"}`,
          borderLeft: `1.5px solid ${company !== "전체" ? "#1C6BFF" : "#EBEEF3"}`,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          background: "#fff",
          borderTop: "1.5px solid #EBEEF3",
          borderRight: "1.5px solid #EBEEF3",
          borderBottom: "1.5px solid #EBEEF3",
          borderLeft: "1.5px solid #EBEEF3",
          borderRadius: 8, minWidth: 180,
          boxShadow: "0 4px 16px rgba(26,31,39,0.10)",
          padding: "10px 0",
        }}>
          <div style={{ padding: "0 10px 8px" }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="관계사 검색"
              style={{
                width: "100%", boxSizing: "border-box", padding: "5px 8px", fontSize: 12,
                borderTop: "1.5px solid #EBEEF3",
                borderRight: "1.5px solid #EBEEF3",
                borderBottom: "1.5px solid #EBEEF3",
                borderLeft: "1.5px solid #EBEEF3",
                borderRadius: 5, outline: "none",
              }}
            />
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            <div
              onClick={() => { setCompany("전체"); setOpen(false); }}
              style={{
                padding: "6px 14px", cursor: "pointer", fontSize: 13,
                fontWeight: company === "전체" ? 600 : 400,
                color: company === "전체" ? "#1C6BFF" : "#475569",
                background: company === "전체" ? "#E8F0FE" : "transparent",
              }}
            >전체</div>
            {filteredList.map(c => (
              <div
                key={c.code}
                onClick={() => { setCompany(c.code); setOpen(false); }}
                style={{
                  padding: "6px 14px", cursor: "pointer", fontSize: 13,
                  display: "flex", alignItems: "center", gap: 6,
                  fontWeight: company === c.code ? 600 : 400,
                  color: company === c.code ? "#1C6BFF" : "#475569",
                  background: company === c.code ? "#E8F0FE" : "transparent",
                }}
              >
                {c.name}
                {!c.visible && (
                  <span style={{ fontSize: 9, fontWeight: 700, background: "#F3E8FF", color: "#6D28D9", padding: "1px 5px", borderRadius: 20 }}>
                    권한 조회
                  </span>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 6, lineHeight: 1.5, padding: "0 14px" }}>
            전사 공용 항목은 관계사를 선택해도 항상 함께 표시됩니다.
          </div>
        </div>
      )}
    </div>
  );
}


export default function ProjectListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isGroupViewer, isAdmin, isCompanyAdmin } = useAuth();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [source, setSource] = useState<"전체" | PlatformId>(() => {
    const p = searchParams.get("platform");
    return (p && PLATFORMS.some(pl => pl.id === p)) ? p as PlatformId : "전체";
  });
  const [usage, setUsage] = useState<UsageFilter>(() => {
    const s = searchParams.get("status");
    if (s === "available") return "바로 사용";
    if (s === "restricted") return "담당자 문의";
    if (s === "stopped") return "사용 중지";
    if (s === "preparing") return "준비 중";
    return "전체";
  });
  const [company, setCompany] = useState<string>(() => (isGroupViewer ? "전체" : (user?.company ?? "전체")));
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]>("최신순");
  const [hovered, setHovered] = useState<number | null>(null);

  const location = useLocation();
  const resetAtRef = useRef<number | null>(null);
  useEffect(() => {
    const _resetAt = (location.state as { _resetAt?: number } | null)?._resetAt ?? null;
    if (_resetAt !== null && _resetAt !== resetAtRef.current) {
      resetAtRef.current = _resetAt;
      setSource("전체");
      setUsage("전체");
      setCompany(isGroupViewer ? "전체" : (user?.company ?? "전체"));
      setSearch("");
      setSort("최신순");
      setSearchParams({});
    }
  }, [location.state]);

  useEffect(() => {
    if (search) setSearchParams({ q: search });
    else setSearchParams({});
  }, [search]);

  const availableCompanies = useMemo(
    () => isGroupViewer ? COMPANIES : COMPANIES.filter(c => c.visible),
    [isGroupViewer]
  );

  const resetFilters = () => {
    setSource("전체"); setUsage("전체");
    setCompany(isGroupViewer ? "전체" : (user?.company ?? "전체"));
  };

  const canSeePreparing = isAdmin || isCompanyAdmin;

  const filtered = useMemo(() => {
    const items = MOCK_PLATFORM_ITEMS.filter(item => {
      if (source !== "전체" && item.platformId !== source) return false;

      // 준비 중: 관리자·컴퍼니어드민이 아니고 명시적으로 선택하지 않으면 숨김
      if (item.status === "준비 중" && usage !== "준비 중" && !canSeePreparing) return false;

      const itemCompanies = item.company ?? [];
      const isCompanyWide = itemCompanies.length === 0;
      const hasNonVisible = itemCompanies.some(code => !COMPANIES.find(c => c.code === code)?.visible);
      if (!isCompanyWide && hasNonVisible && !isGroupViewer) return false;
      if (company !== "전체" && !isCompanyWide && !itemCompanies.includes(company)) return false;
      if (!matchUsage(item, usage)) return false;

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
      return 0;
    });
  }, [search, usage, sort, company, source, isGroupViewer]);

  const detailPathOf = (item: PlatformItem) => {
    const platform = PLATFORMS.find(p => p.id === item.platformId)!;
    return `${platform.path}/${item.id}`;
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F4F6F9", minHeight: "100vh", color: "#1A1F27" }}>

      <Navbar />

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "20px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1C6BFF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            AX Platform
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1F27", letterSpacing: "-0.02em" }}>
                AX 플랫폼 탐색
              </h1>
              {isGroupViewer && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F3E8FF", border: "1px solid #E9D5FF", borderRadius: 20, padding: "4px 12px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>그룹 관리자 권한으로 모든 관계사 항목을 조회 중입니다</span>
                </div>
              )}
            </div>
            <div style={{ position: "relative", width: 340 }}>
              <input
                type="text"
                placeholder="워크플로우, AI 에이전트, ML 모델 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "9px 40px 9px 14px",
                  fontSize: 13, color: "#1A1F27",
                  background: "#F4F6F9", border: "1.5px solid #EBEEF3",
                  borderRadius: 8, outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")}
              />
              <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "10px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto" }}>
          {/* 1행: 플랫폼 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", flexShrink: 0, minWidth: 52 }}>플랫폼</span>
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {SOURCE_OPTIONS.map(opt => {
                const sStyle = opt.key === "전체" ? null : SOURCE_STYLE[opt.key];
                return (
                  <div key={opt.key} onClick={() => setSource(opt.key)} style={{
                    padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                    fontSize: 12.5, fontWeight: source === opt.key ? 700 : 400,
                    color: source === opt.key ? "#1C6BFF" : "#475569",
                    background: source === opt.key ? "#E8F0FE" : "transparent",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    {sStyle && <span style={{ width: 7, height: 7, borderRadius: 2, background: sStyle.color, display: "inline-block", flexShrink: 0 }} />}
                    {opt.label}
                  </div>
                );
              })}
            </div>
          </div>
          {/* 2행: 이용 구분 + 관계사 + 초기화 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", flexShrink: 0, minWidth: 52 }}>이용 구분</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
              {(["전체", "바로 사용", "담당자 문의", "사용 중지", ...(canSeePreparing ? ["준비 중"] : [])] as UsageFilter[]).map(opt => (
                <button key={opt} onClick={() => setUsage(opt)} style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  borderTop: `1.5px solid ${usage === opt ? "#1C6BFF" : "#EBEEF3"}`,
                  borderRight: `1.5px solid ${usage === opt ? "#1C6BFF" : "#EBEEF3"}`,
                  borderBottom: `1.5px solid ${usage === opt ? "#1C6BFF" : "#EBEEF3"}`,
                  borderLeft: `1.5px solid ${usage === opt ? "#1C6BFF" : "#EBEEF3"}`,
                  background: usage === opt ? "#E8F0FE" : "#fff",
                  color: usage === opt ? "#1C6BFF" : "#475569",
                }}>{opt}</button>
              ))}
            </div>
            <CompanyFilterDropdown
              company={company}
              setCompany={setCompany}
              availableCompanies={availableCompanies}
            />
            <button onClick={resetFilters} style={{ fontSize: 11, color: "#94A3B8", cursor: "pointer", background: "none", border: "none", fontWeight: 500, padding: "4px 6px" }}>
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "24px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "#697386" }}>
            <strong style={{ color: "#1A1F27" }}>{filtered.length}</strong>개 항목
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {SORT_OPTIONS.map(opt => (
              <button key={opt} onClick={() => setSort(opt)} style={{
                padding: "5px 12px", borderRadius: 6,
                borderWidth: 1.5, borderStyle: "solid",
                borderColor: sort === opt ? "#1C6BFF" : "#EBEEF3",
                background: sort === opt ? "#E8F0FE" : "#fff",
                color: sort === opt ? "#1C6BFF" : "#475569",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 14 }}>
            검색 결과가 없습니다.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {filtered.map((item, i) => {
              const sourceStyle = SOURCE_STYLE[item.platformId];
              const sideColor = hovered === i ? sourceStyle.color : "#EBEEF3";
              const statusStyle = STATUS_COLOR[item.status] ?? { bg: "#F1F5F9", fg: "#475569" };
              const isContact = item.usageMode === "contact" || item.status === "일부 제한";
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", minWidth: 0, flexWrap: "wrap" }}>
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
                      {isContact && item.status !== "사용 중지" && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: "#FBF3E4", color: "#B4802E",
                          padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                        }}>
                          담당자 문의
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#94A3B8", flexShrink: 0 }}>
                      <HeartIcon />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{item.likes}</span>
                    </div>
                  </div>

                  <div style={{
                    fontSize: 14, fontWeight: 700, color: "#1A1F27", marginBottom: 6, lineHeight: 1.4,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {item.title}
                  </div>

                  <div style={{
                    fontSize: 12, color: "#697386", lineHeight: 1.5, marginBottom: item.statusNote ? 6 : 12,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {item.summary}
                  </div>

                  {item.statusNote && (
                    <div style={{
                      fontSize: 11, lineHeight: 1.5, marginBottom: 8,
                      padding: "4px 8px", borderRadius: 6,
                      background: item.status === "사용 중지" ? "#F4F6F9" : "#FFFBEB",
                      color: item.status === "사용 중지" ? "#94A3B8" : "#92400E",
                      border: `1px solid ${item.status === "사용 중지" ? "#EBEEF3" : "#FDE68A"}`,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {item.status === "사용 중지" ? "종료 " : "제한 "}{item.statusNote}
                    </div>
                  )}

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

      <Footer />
    </div>
  );
}
