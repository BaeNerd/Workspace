import { useState } from "react";

// ============================================================
// PresentationDeck.tsx — Kolmar Tech Hub 대중 발표용 덱
// ------------------------------------------------------------
// - 레이아웃: 좌 75% 슬라이드 비주얼 / 우 25% 발표 스크립트
// - 독립 실행 컴포넌트. App.tsx에 아래 한 줄만 추가하면 동작:
//     <Route path="/deck" element={<PresentationDeck />} />
// - 모든 서브컴포넌트·스타일·데이터는 모듈 레벨 정의
// ============================================================

const FONT = "'Inter', 'Pretendard', -apple-system, sans-serif";

// 출처 색상 — platformTypes.ts의 PLATFORMS 계열과 동일 톤
const C = {
  project: "#2563EB", projectBg: "#EFF6FF",
  n8n: "#DB2777", n8nBg: "#FDF2F8",
  assistant: "#059669", assistantBg: "#ECFDF5",
  agent: "#7C3AED", agentBg: "#F5F3FF",
  ink: "#0F172A", sub: "#475569", faint: "#94A3B8",
  line: "#E2E8F0", soft: "#F8FAFC",
};

// ===== 공통 서브컴포넌트 (모듈 레벨) =====

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 12, fontWeight: 800, color: C.faint, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
    {children}
  </div>
);

const Chip = ({ text, color, bg }: { text: string; color: string; bg: string }) => (
  <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
    {text}
  </span>
);

const FlowArrow = () => (
  <span style={{ color: "#CBD5E1", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>→</span>
);

const StepCircle = ({ n, color }: { n: number; color: string }) => (
  <div style={{
    width: 30, height: 30, borderRadius: "50%", background: color, color: "#fff",
    fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }}>{n}</div>
);

const StatCard = ({ value, unit, caption }: { value: string; unit?: string; caption: string }) => (
  <div style={{ flex: 1, background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "24px 22px" }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 30, fontWeight: 900, color: C.ink, letterSpacing: "-0.02em" }}>{value}</span>
      {unit && <span style={{ fontSize: 13, color: C.faint, fontWeight: 600 }}>{unit}</span>}
    </div>
    <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.7 }}>{caption}</div>
  </div>
);

// ===== 슬라이드 1 — 타이틀 & 네이밍 스토리 =====

const NAME_PARTS = [
  { word: "Kolmar", desc: "29개 관계사가 함께 쓰는\n그룹 공동의 이름이자 공간" },
  { word: "Tech", desc: "IT 프로젝트부터 자동화·AI 도구까지\n우리가 직접 만든 모든 기술 자산" },
  { word: "Hub", desc: "바퀴살이 허브에 모여 하나의 바퀴가 되듯\n흩어진 기술이 모여 함께 굴러가는 중심축" },
];

const VisualTitle = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
    <div style={{ fontSize: 13, fontWeight: 800, color: C.project, letterSpacing: "0.22em", marginBottom: 20 }}>
      KOLMAR GROUP · AX PLATFORM
    </div>
    <h1 style={{ fontSize: 56, fontWeight: 900, color: C.ink, letterSpacing: "-0.03em", margin: "0 0 14px" }}>
      Kolmar Tech Hub
    </h1>
    <div style={{ fontSize: 16, color: C.sub, marginBottom: 48 }}>
      그룹의 기술이 모이고, 다시 흘러나가는 중심
    </div>
    <div style={{ display: "flex", gap: 16 }}>
      {NAME_PARTS.map(x => (
        <div key={x.word} style={{ width: 230, background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "24px 20px" }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{x.word}</div>
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.75, whiteSpace: "pre-line" }}>{x.desc}</div>
        </div>
      ))}
    </div>
  </div>
);

// ===== 슬라이드 2 — 배경(문제) =====

const SCATTERED = [
  { name: "정산 자동화", co: "한국콜마", rot: -3 },
  { name: "문의 분류 모델", co: "콜마비앤에이치", rot: 2 },
  { name: "입사자 계정 생성", co: "콜마글로벌", rot: -1 },
  { name: "보고서 요약 비서", co: "무석콜마", rot: 3 },
  { name: "재고 알림 봇", co: "미국콜마", rot: -2 },
];

const PROBLEMS = [
  { title: "중복 개발", desc: "같은 도구를 관계사마다 처음부터 다시 만듭니다." },
  { title: "발견 불가", desc: "누가 무엇을 만들었는지 찾을 방법이 없습니다." },
  { title: "성과 비가시화", desc: "자동화·AI의 효과를 숫자로 말하기 어렵습니다." },
];

const VisualProblem = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <Label>배경 — 29개 관계사, 흩어진 기술</Label>
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr auto 1fr", gap: 32, alignItems: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
        {SCATTERED.map(s => (
          <div key={s.name} style={{
            background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 10,
            padding: "14px 16px", transform: `rotate(${s.rot}deg)`, width: 180,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: C.faint }}>{s.co}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 26, color: "#CBD5E1", fontWeight: 700 }}>→</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PROBLEMS.map(p => (
          <div key={p.title} style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#991B1B", marginBottom: 4 }}>{p.title}</div>
            <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ===== 슬라이드 3 — 무엇을 모으나 =====

const CONTENT_TYPES = [
  { name: "IT 프로젝트", color: C.project, bg: C.projectBg, desc: "관계사에서 개발·운영 중인 시스템과 서비스" },
  { name: "n8n 자동화 워크플로우", color: C.n8n, bg: C.n8nBg, desc: "반복 업무를 대신 처리하는 노코드 자동화 흐름" },
  { name: "나만의 비서", color: C.assistant, bg: C.assistantBg, desc: "HK GPT 기반으로 직접 만든 맞춤형 업무 비서" },
  { name: "AI Agent", color: C.agent, bg: C.agentBg, desc: "업무에 바로 투입할 수 있는 AI 에이전트·모델" },
];

const VisualContents = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <Label>무엇을 모으나 — 자동화·AI 도구 카탈로그</Label>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      {CONTENT_TYPES.map(t => (
        <div key={t.name} style={{ background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "26px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{t.name}</span>
          </div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>{t.desc}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 22, textAlign: "center", fontSize: 13, color: C.faint }}>
      네 가지 유형 모두 하나의 카탈로그에서 검색·비교·재사용
    </div>
  </div>
);

// ===== 슬라이드 4 — 기능 컨셉 (파이프라인 + 목록 화면 목업) =====

const PIPELINE = ["등록", "검토·승인", "게시", "탐색·재사용", "성과 집계"];

const MOCK_ROWS = [
  { chip: "n8n", color: C.n8n, bg: C.n8nBg, title: "신규 입사자 계정 자동 생성", saved: "주 3시간 절감" },
  { chip: "나만의 비서", color: C.assistant, bg: C.assistantBg, title: "주간 보고서 요약 비서", saved: "주 1시간 절감" },
  { chip: "프로젝트", color: C.project, bg: C.projectBg, title: "통합 정산 자동화 시스템", saved: "운영 중" },
];

const VisualConcept = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <Label>기능 컨셉 — 하나의 파이프라인</Label>
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 34 }}>
      {PIPELINE.map((step, i) => (
        <div key={step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: i === 3 ? C.ink : "#fff", color: i === 3 ? "#fff" : C.ink,
            border: `1.5px solid ${i === 3 ? C.ink : C.line}`, borderRadius: 10,
            padding: "12px 20px", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap",
          }}>{step}</div>
          {i < PIPELINE.length - 1 && <FlowArrow />}
        </div>
      ))}
    </div>
    <div style={{ maxWidth: 620, width: "100%", margin: "0 auto", background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ background: C.soft, borderBottom: `1px solid ${C.line}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FCA5A5" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FCD34D" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#86EFAC" }} />
        <span style={{ marginLeft: 10, fontSize: 11, color: C.faint }}>Kolmar Tech Hub — 도구 탐색</span>
      </div>
      <div style={{ padding: "14px 18px" }}>
        <div style={{ background: C.soft, border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "9px 14px", fontSize: 12.5, color: C.faint, marginBottom: 12 }}>
          "정산", "보고서 요약" … 키워드로 검색
        </div>
        {MOCK_ROWS.map(r => (
          <div key={r.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 4px", borderBottom: `1px solid #F1F5F9` }}>
            <Chip text={r.chip} color={r.color} bg={r.bg} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, flex: 1 }}>{r.title}</span>
            <span style={{ fontSize: 11.5, color: C.assistant, fontWeight: 700 }}>{r.saved}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ===== 슬라이드 5 — 유저 플로우 (두 개의 여정) =====

const FLOW_FINDER = ["로그인", "키워드 탐색·검색", "상세 확인", "담당자 연결 · 바로 사용"];
const FLOW_MAKER = ["내 도구 등록", "관리자 승인 대기", "카탈로그 게시", "성과 집계에 반영"];

const FlowLane = ({ title, color, steps }: { title: string; color: string; steps: string[] }) => (
  <div style={{ background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "22px 26px" }}>
    <div style={{ fontSize: 14, fontWeight: 800, color, marginBottom: 18 }}>{title}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StepCircle n={i + 1} color={color} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{s}</span>
          </div>
          {i < steps.length - 1 && <FlowArrow />}
        </div>
      ))}
    </div>
  </div>
);

const VisualUserFlow = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
    <Label>유저 플로우 — 두 개의 여정</Label>
    <FlowLane title="도구를 찾는 사람" color={C.project} steps={FLOW_FINDER} />
    <FlowLane title="도구를 만든 사람" color={C.assistant} steps={FLOW_MAKER} />
    <div style={{ textAlign: "center", fontSize: 13, color: C.faint }}>
      찾는 사람은 다시 만들지 않고, 만든 사람은 성과를 인정받습니다
    </div>
  </div>
);

// ===== 슬라이드 6 — 운영 플로우 (관리자) =====

const REVIEW_QUEUE = [
  { chip: "n8n", color: C.n8n, bg: C.n8nBg, title: "발주서 자동 발송 워크플로우" },
  { chip: "AI Agent", color: C.agent, bg: C.agentBg, title: "계약서 검토 특화 모델" },
];

const VisualAdminFlow = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <Label>운영 플로우 — 신뢰할 수 있는 카탈로그</Label>
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
      <div style={{ background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "20px 22px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 14 }}>검토 대기 큐</div>
        {REVIEW_QUEUE.map(r => (
          <div key={r.title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
            <Chip text={r.chip} color={r.color} bg={r.bg} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, flex: 1 }}>{r.title}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", background: C.assistant, borderRadius: 6, padding: "5px 12px" }}>승인</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#EF4444", border: "1.5px solid #FECACA", borderRadius: 6, padding: "4px 11px" }}>반려</span>
          </div>
        ))}
        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 12, lineHeight: 1.6 }}>
          검토를 거친 항목만 게시 — 카탈로그 품질을 관리자가 보증
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 10 }}>이중 권한 체계</div>
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.8 }}>
            전사관리자는 그룹 전체를, 관계사관리자는 담당 관계사 항목만 관리합니다.
          </div>
        </div>
        <div style={{ background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 10 }}>성과 통계</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: C.assistant }}>1,240</span>
            <span style={{ fontSize: 12, color: C.faint }}>시간 / 년 (예상 절감, 예시)</span>
          </div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 8, lineHeight: 1.6 }}>
            "주당 3시간 절감 → 연간 약 156시간"처럼 표준 단위로 환산해 집계
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ===== 슬라이드 7 — 기대 효과 =====

const VisualImpact = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <Label>기대 효과 — 그룹 AX 확산의 저장소</Label>
    <div style={{ display: "flex", gap: 18, marginBottom: 34 }}>
      <StatCard value="중복 개발" unit="감소" caption="이미 있는 도구는 검색해서 재사용 — 같은 것을 두 번 만들지 않습니다." />
      <StatCard value="절감 시간" unit="가시화" caption="모든 도구의 예상 절감 시간을 연간 환산 기준으로 집계해 성과를 숫자로 보여줍니다." />
      <StatCard value="29개 관계사" unit="연결" caption="해커톤 등 확산 활동의 산출물이 자연스럽게 모이는 그룹 공동 카탈로그가 됩니다." />
    </div>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: "-0.02em", marginBottom: 8 }}>
        만드는 사람은 인정받고, 찾는 사람은 다시 만들지 않습니다.
      </div>
      <div style={{ fontSize: 14, color: C.sub }}>Kolmar Tech Hub — 콜마의 기술이 모이는 곳</div>
    </div>
  </div>
);

// ===== 슬라이드 정의 =====

type Slide = { title: string; script: string[]; Visual: () => React.ReactElement };

const SLIDES: Slide[] = [
  {
    title: "1. 이름에 담은 이야기",
    Visual: VisualTitle,
    script: [
      "안녕하십니까. 오늘 소개해 드릴 플랫폼의 이름은 '콜마 테크 허브'입니다.",
      "이름은 단순합니다. 콜마의 기술(Tech)이 모이는 중심(Hub). 바퀴를 떠올려 보시면 좋습니다. 바퀴살이 아무리 많아도, 가운데 허브가 없으면 바퀴는 굴러가지 않습니다.",
      "29개 관계사라는 바퀴살을 하나의 바퀴로 굴리는 중심축 — 그것이 이 플랫폼에 '허브'라는 이름을 붙인 이유입니다.",
    ],
  },
  {
    title: "2. 왜 만들었나",
    Visual: VisualProblem,
    script: [
      "콜마 그룹의 각 관계사는 이미 좋은 도구들을 만들고 있었습니다. 정산 자동화, 문의 분류 모델, 보고서 요약 비서까지요.",
      "문제는 서로 모른다는 것이었습니다. 옆 관계사에 이미 있는 도구를 처음부터 다시 만들고, 누가 무엇을 만들었는지 찾을 방법이 없고, 그 효과를 숫자로 말하기도 어려웠습니다.",
      "이 세 가지 문제를 한 번에 풀기 위해 테크 허브가 시작되었습니다.",
    ],
  },
  {
    title: "3. 무엇을 모으나",
    Visual: VisualContents,
    script: [
      "테크 허브에는 네 가지 유형의 기술 자산이 모입니다.",
      "관계사의 IT 프로젝트, 반복 업무를 대신하는 n8n 자동화 워크플로우, HK GPT로 직접 만든 '나만의 비서', 그리고 업무에 바로 투입 가능한 AI Agent입니다.",
      "유형은 달라도 한 곳에서 검색하고, 비교하고, 재사용할 수 있습니다. 저희는 이를 통틀어 '자동화·AI 도구'라고 부릅니다.",
    ],
  },
  {
    title: "4. 기능 컨셉",
    Visual: VisualConcept,
    script: [
      "동작 원리는 하나의 파이프라인입니다. 누구나 자신이 만든 도구를 등록하면, 관리자 검토를 거쳐 카탈로그에 게시됩니다.",
      "게시된 도구는 화면에서 보시는 것처럼 키워드로 검색할 수 있고, 각 도구 옆에는 '주 3시간 절감' 같은 실효 가치가 함께 표시됩니다.",
      "핵심은 네 번째 단계, '탐색과 재사용'입니다. 여기서 중복 개발이 사라집니다.",
    ],
  },
  {
    title: "5. 유저 플로우",
    Visual: VisualUserFlow,
    script: [
      "사용자 여정은 두 갈래입니다. 먼저 '찾는 사람'은 로그인 후 키워드로 검색하고, 상세 내용을 확인한 뒤 담당자에게 바로 연결하거나 즉시 사용합니다.",
      "'만든 사람'은 자신의 도구를 등록하고, 승인을 거쳐 게시되면 그 성과가 그룹 통계에 반영됩니다.",
      "찾는 사람은 다시 만들지 않고, 만든 사람은 성과를 인정받는 구조입니다.",
    ],
  },
  {
    title: "6. 운영 플로우",
    Visual: VisualAdminFlow,
    script: [
      "카탈로그의 신뢰는 운영에서 나옵니다. 등록된 항목은 검토 큐에서 관리자의 승인 또는 반려를 거쳐야 게시됩니다.",
      "권한도 이중으로 설계했습니다. 전사관리자는 그룹 전체를, 관계사관리자는 자기 담당 관계사 항목만 관리합니다.",
      "그리고 모든 도구의 절감 시간은 '주당 3시간이면 연간 약 156시간'처럼 표준 단위로 환산되어 그룹 성과 리포트로 집계됩니다.",
    ],
  },
  {
    title: "7. 기대 효과",
    Visual: VisualImpact,
    script: [
      "정리하겠습니다. 테크 허브는 중복 개발을 줄이고, 절감 효과를 숫자로 보여주며, 29개 관계사를 하나의 카탈로그로 연결합니다.",
      "해커톤 같은 AX 확산 활동의 산출물도 자연스럽게 이곳으로 모입니다. 단순한 등록 사이트가 아니라, 그룹 AI 전환의 저장소입니다.",
      "만드는 사람은 인정받고, 찾는 사람은 다시 만들지 않는다 — 이것이 콜마 테크 허브입니다. 감사합니다.",
    ],
  },
];

// ===== 메인 컴포넌트 =====

export default function PresentationDeck() {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const Visual = slide.Visual;

  return (
    <div style={{ fontFamily: FONT, height: "100vh", display: "flex", flexDirection: "column", background: C.soft, color: C.ink }}>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* ===== 좌측 75% — 슬라이드 비주얼 ===== */}
        <div style={{ flexBasis: "75%", minWidth: 0, background: C.soft, padding: "40px 56px", overflow: "auto" }}>
          <Visual />
        </div>

        {/* ===== 우측 25% — 발표 스크립트 ===== */}
        <div style={{ flexBasis: "25%", minWidth: 260, borderLeft: `1px solid ${C.line}`, background: "#fff", padding: "32px 26px", overflow: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            발표 스크립트
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginBottom: 18, lineHeight: 1.5 }}>
            {slide.title}
          </div>
          {slide.script.map((p, i) => (
            <p key={i} style={{ fontSize: 13, color: C.sub, lineHeight: 1.95, margin: "0 0 14px" }}>{p}</p>
          ))}
        </div>
      </div>

      {/* ===== 하단 내비게이션 ===== */}
      <div style={{ borderTop: `1px solid ${C.line}`, background: "#fff", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          style={{
            background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 7, padding: "7px 16px",
            fontSize: 13, fontWeight: 700, color: idx === 0 ? "#CBD5E1" : C.sub,
            cursor: idx === 0 ? "default" : "pointer", fontFamily: "inherit",
          }}
        >
          ‹ 이전
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 7 }}>
            {SLIDES.map((_, i) => (
              <span
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: 9, height: 9, borderRadius: "50%", cursor: "pointer",
                  background: i === idx ? C.ink : "#CBD5E1",
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 12, color: C.faint, fontWeight: 600 }}>{idx + 1} / {SLIDES.length}</span>
        </div>

        <button
          onClick={() => setIdx(i => Math.min(SLIDES.length - 1, i + 1))}
          disabled={idx === SLIDES.length - 1}
          style={{
            background: idx === SLIDES.length - 1 ? "#fff" : C.ink,
            border: `1.5px solid ${idx === SLIDES.length - 1 ? C.line : C.ink}`, borderRadius: 7, padding: "7px 16px",
            fontSize: 13, fontWeight: 700, color: idx === SLIDES.length - 1 ? "#CBD5E1" : "#fff",
            cursor: idx === SLIDES.length - 1 ? "default" : "pointer", fontFamily: "inherit",
          }}
        >
          다음 ›
        </button>
      </div>
    </div>
  );
}