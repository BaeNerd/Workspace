import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

// TODO: 실제 연동 시 GET /api/v1/projects/:id 응답으로 교체
type Contact = { name: string; dept: string; role: string; email: string; teams: string };
type Comment = { author: string; dept: string; date: string; text: string; isPinned: boolean };
type ProjectDetail = {
  id: string;
  title: string;
  status: string;
  domain: string;
  type: string;
  updatedAt: string;
  createdAt: string;
  summary: string;
  description: string;
  departments: string[];
  audience: string[];
  stack: string[];
  freeTags: string[];
  integrations: string[];
  contacts: Contact[];
  links: { label: string; url: string }[];
};

const MOCK_PROJECT: ProjectDetail = {
  id: "PRJ-2025-041",
  title: "조색 예측 ML 모델",
  status: "개발 중",
  domain: "제조/생산",
  type: "ML/AI 모델",
  updatedAt: "2025.06.01",
  createdAt: "2025.02.14",
  summary: "원료 배합 데이터를 기반으로 최종 제품의 색상을 사전 예측하는 ML 모델. 조색 실험 횟수 감소 및 연구 효율 향상을 목표로 합니다.",
  description: `기존 조색 프로세스는 연구원이 수작업으로 원료를 배합하고 색상을 측정하는 반복 실험에 의존하고 있었습니다. 이 프로젝트는 과거 조색 실험 데이터를 학습하여 원료 구성과 배합 비율을 입력하면 예상 색상값(Lab 좌표)을 자동으로 예측하는 ML 모델을 개발합니다.

현재 학습 데이터 전처리 및 초기 모델 검증 단계이며, 2차에서는 실시간 추론 API 서버 구축과 연구원용 UI 연동을 진행할 예정입니다.`,
  departments: ["메이크업연구소", "IT개발팀"],
  audience: ["특정 부서 (메이크업연구소)"],
  stack: ["Python", "TensorFlow", "FastAPI", "AWS SageMaker", "PostgreSQL"],
  freeTags: ["Lab색공간", "조색", "배합예측", "연구자동화"],
  integrations: ["ERP (원료 데이터 연동)", "LIMS"],
  contacts: [
    { name: "이수연", dept: "메이크업연구소", role: "주담당자", email: "suyeon.lee@kolmar.co.kr", teams: "suyeon.lee" },
    { name: "정태영", dept: "IT개발팀", role: "공동담당자", email: "taeyoung.jung@kolmar.co.kr", teams: "taeyoung.jung" },
  ],
  links: [
    { label: "GitHub 레포지토리", url: "https://github.com/kolmar-internal/color-predict" },
    { label: "프로젝트 노션 문서", url: "https://notion.so/kolmar/color-predict" },
    { label: "I/F 정의서", url: "https://confluence.kolmar.co.kr/color-predict-if" },
  ],
};

const MOCK_COMMENTS: Comment[] = [
  { author: "이수연", dept: "메이크업연구소", date: "2025.05.20", text: "1차 모델 학습 완료. 현재 색상 예측 정확도 Delta E 기준 평균 2.3 수준으로, 목표치(2.0 이하) 달성을 위해 추가 데이터 수집 진행 중입니다.", isPinned: true },
  { author: "정태영", dept: "IT개발팀", date: "2025.06.01", text: "FastAPI 기반 추론 서버 개발 착수. 다음 스프린트 내 내부 테스트 환경 배포 예정입니다.", isPinned: false },
];

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [activeTab, setActiveTab] = useState<"overview" | "tech" | "contacts" | "comments">("overview");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // TODO: 실제 연동 시 id로 프로젝트 상세 조회
  // const [project, setProject] = useState<ProjectDetail | null>(null);
  // useEffect(() => {
  //   setLoading(true);
  //   fetch(`${import.meta.env.VITE_API_URL}/api/v1/projects/${id}`)
  //     .then(res => res.json())
  //     .then(data => { setProject(data); setLoading(false); });
  // }, [id]);
  const project = MOCK_PROJECT;

  const handleComment = () => {
    if (!comment.trim()) return;
    // TODO: 실제 연동 시 POST /api/v1/projects/:id/updates
    setComments(prev => [...prev, {
      author: "김철수", dept: "IT개발팀", date: "2025.06.04", text: comment, isPinned: false,
    }]);
    setComment("");
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  if (!project) {
    return <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>프로젝트를 찾을 수 없습니다. (id: {id})</div>;
  }

  const TABS = [
    { id: "overview" as const, label: "개요" },
    { id: "tech" as const, label: "기술 스택 / 연동" },
    { id: "contacts" as const, label: "담당자" },
    { id: "comments" as const, label: `업데이트 ${comments.length}` },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* BREADCRUMB */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "10px 32px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94A3B8" }}>
          <span onClick={() => navigate("/projects")} style={{ cursor: "pointer", color: "#2563EB", fontWeight: 500 }}>Tech Hub</span>
          <span>/</span>
          <span onClick={() => navigate(`/projects?q=${encodeURIComponent(project.domain)}`)} style={{ cursor: "pointer", color: "#64748B" }}>{project.domain}</span>
          <span>/</span>
          <span style={{ color: "#0F172A", fontWeight: 600 }}>{project.title}</span>
        </div>
      </div>

      {/* PROJECT HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "28px 32px 0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: STATUS_COLOR[project.status].bg,
                  color: STATUS_COLOR[project.status].color,
                  padding: "3px 10px", borderRadius: 20,
                }}>
                  {project.status}
                </span>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{project.type}</span>
                <span style={{ fontSize: 12, color: "#CBD5E1" }}>·</span>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{project.domain}</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.3 }}>
                {project.title}
              </h1>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, maxWidth: 640 }}>
                {project.summary}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => navigate(`/projects/${project.id}/edit-request`)} style={{
                background: "#fff", color: "#475569",
                border: "1.5px solid #E2E8F0", borderRadius: 7,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                수정 요청
              </button>
              <button onClick={() => setActiveTab("contacts")} style={{
                background: "#2563EB", color: "#fff",
                border: "none", borderRadius: 7,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                담당자 연락
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#94A3B8", paddingBottom: 16 }}>
            <span>등록일 {project.createdAt}</span>
            <span>·</span>
            <span>최종 수정 {project.updatedAt}</span>
            <span>·</span>
            <span>참여 부서 {project.departments.join(", ")}</span>
          </div>

          {/* TABS */}
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

      {/* CONTENT */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px" }}>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
            <div>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>프로젝트 상세 설명</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.9, whiteSpace: "pre-line" }}>
                  {project.description}
                </div>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>사용 대상</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {project.audience.map((a, i) => (
                    <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "4px 12px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>문서 및 링크</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {project.links.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{
                      fontSize: 12, color: "#2563EB", fontWeight: 500,
                      textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>

              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>태그</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {project.freeTags.map((t, i) => (
                    <span key={i} style={{ fontSize: 11, background: "#F8FAFC", color: "#64748B", padding: "3px 8px", borderRadius: 4, border: "1px solid #E2E8F0" }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tech" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>기술 스택</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {project.stack.map((s, i) => (
                  <span key={i} style={{
                    fontSize: 13, fontWeight: 600,
                    background: "#EFF6FF", color: "#1E40AF",
                    padding: "6px 14px", borderRadius: 6,
                    border: "1px solid #BFDBFE",
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>연동 시스템</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {project.integrations.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#334155" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB", flexShrink: 0 }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {project.contacts.map((c, i) => (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: i === 0 ? "#0F172A" : "#E2E8F0",
                      color: i === 0 ? "#fff" : "#475569",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 700, flexShrink: 0,
                    }}>
                      {c.name[0]}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{c.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: i === 0 ? "#0F172A" : "#F1F5F9",
                          color: i === 0 ? "#fff" : "#64748B",
                          padding: "2px 7px", borderRadius: 20,
                        }}>
                          {c.role}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>{c.dept}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={`mailto:${c.email}`} style={{ textDecoration: "none" }}>
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
                    <button
                      onClick={() => handleCopy(c.teams, c.name)}
                      style={{
                        background: copied === c.name ? "#059669" : "#2563EB",
                        border: "none", borderRadius: 6,
                        padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#fff",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                        transition: "background 0.2s",
                      }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      {copied === c.name ? "복사됨" : "Teams"}
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9", fontSize: 12, color: "#94A3B8" }}>
                  {c.email}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "comments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#64748B" }}>
              프로젝트 담당자가 작성한 진행 상황 및 공지 사항입니다. 담당자 문의는 담당자 탭을 통해 직접 연락하세요.
            </div>

            {comments.map((c, i) => (
              <div key={i} style={{
                background: "#fff",
                border: `1.5px solid ${c.isPinned ? "#BFDBFE" : "#E2E8F0"}`,
                borderRadius: 10, padding: "18px 22px",
                borderLeft: `3px solid ${c.isPinned ? "#2563EB" : "#94A3B8"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: c.isPinned ? "#2563EB" : "#E2E8F0",
                      color: c.isPinned ? "#fff" : "#475569",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {c.author[0]}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{c.author}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{c.dept}</span>
                        {c.isPinned && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "#DBEAFE", color: "#1E40AF", padding: "1px 8px", borderRadius: 20 }}>
                            주요 업데이트
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#CBD5E1", flexShrink: 0 }}>{c.date}</span>
                </div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.8, paddingLeft: 38 }}>
                  {c.text}
                </div>
              </div>
            ))}

            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 22px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>업데이트 작성</div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="진행 상황, 변경 사항, 공지 내용을 입력하세요. 등록 시 플랫폼 구독자에게 Teams 알림이 발송됩니다."
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 12px", fontSize: 13, color: "#0F172A",
                  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                  borderRadius: 7, outline: "none", resize: "vertical",
                  minHeight: 90, fontFamily: "inherit", lineHeight: 1.6,
                }}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>담당자 및 관리자만 업데이트를 등록할 수 있습니다.</span>
                <button onClick={handleComment} style={{
                  background: "#2563EB", color: "#fff", border: "none",
                  borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
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