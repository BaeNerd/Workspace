
import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";

import AdminSidebar from "../../components/AdminSidebar";

const PERIODS = ["이번 달", "최근 3개월", "최근 6개월", "올해 전체"] as const;
type Period = typeof PERIODS[number];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/monthly?period=:period 응답으로 교체
const MONTHLY_DATA: Record<Period, { m: string; v: number }[]> = {
  "이번 달": [{ m: "6월", v: 15 }],
  "최근 3개월": [{ m: "4월", v: 12 }, { m: "5월", v: 15 }, { m: "6월", v: 4 }],
  "최근 6개월": [{ m: "1월", v: 6 }, { m: "2월", v: 9 }, { m: "3월", v: 7 }, { m: "4월", v: 12 }, { m: "5월", v: 15 }, { m: "6월", v: 4 }],
  "올해 전체": [{ m: "1월", v: 6 }, { m: "2월", v: 9 }, { m: "3월", v: 7 }, { m: "4월", v: 12 }, { m: "5월", v: 15 }, { m: "6월", v: 4 }],
};

// TODO: 실제 연동 시 GET /api/v1/admin/stats/domain 응답으로 교체
const DOMAIN_DATA = [
  { label: "제조/생산", count: 28 }, { label: "IT 인프라", count: 22 }, { label: "재무/회계", count: 18 },
  { label: "데이터/분석", count: 15 }, { label: "HR/인사", count: 12 }, { label: "마케팅", count: 11 },
  { label: "영업/CRM", count: 10 }, { label: "기타", count: 8 },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/status 응답으로 교체
const STATUS_DATA = [
  { label: "운영 중", count: 54, color: "#059669" }, { label: "개발 중", count: 41, color: "#2563EB" },
  { label: "파일럿", count: 18, color: "#D97706" }, { label: "보류", count: 7, color: "#EF4444" },
  { label: "종료", count: 4, color: "#475569" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/stack 응답으로 교체
const STACK_DATA = [
  { label: "Python", count: 38, color: "#2563EB" }, { label: "React", count: 27, color: "#7C3AED" },
  { label: "AWS", count: 24, color: "#D97706" }, { label: "TypeScript", count: 19, color: "#059669" },
  { label: "PostgreSQL", count: 17, color: "#0891B2" }, { label: "Docker", count: 14, color: "#475569" },
  { label: "FastAPI", count: 11, color: "#DB2777" }, { label: "Kubernetes", count: 8, color: "#EA580C" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/department 응답으로 교체
const DEPT_DATA = [
  { dept: "IT개발팀", count: 14 }, { dept: "메이크업연구소", count: 8 }, { dept: "IT인프라팀", count: 6 },
  { dept: "재무팀", count: 5 }, { dept: "제조기술팀", count: 5 }, { dept: "마케팅팀", count: 5 },
  { dept: "품질관리팀", count: 4 }, { dept: "영업팀", count: 3 },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/system-type 응답으로 교체
const TYPE_DATA = [
  { label: "웹 애플리케이션", count: 38 }, { label: "데이터 파이프라인", count: 22 },
  { label: "ML/AI 모델", count: 20 }, { label: "API/서비스", count: 18 },
  { label: "내부 플랫폼", count: 12 }, { label: "내부 도구", count: 10 }, { label: "기타", count: 4 },
];

// TODO: 실제 연동 시 GET /api/v1/admin/stats/search-keywords 응답으로 교체
const SEARCH_KEYWORDS = [
  { keyword: "Python", count: 42 }, { keyword: "ML", count: 35 }, { keyword: "자동화", count: 28 },
  { keyword: "AWS", count: 24 }, { keyword: "데이터", count: 22 }, { keyword: "React", count: 19 },
  { keyword: "API", count: 17 }, { keyword: "대시보드", count: 14 },
];

const totalProjects = STATUS_DATA.reduce((s, d) => s + d.count, 0);
const totalDomain = DOMAIN_DATA.reduce((s, d) => s + d.count, 0);
const maxStack = Math.max(...STACK_DATA.map(s => s.count));
const maxDept = Math.max(...DEPT_DATA.map(d => d.count));
const maxKeyword = Math.max(...SEARCH_KEYWORDS.map(k => k.count));

export default function AdminStatistics() {

  const [period, setPeriod] = useState<Period>("최근 6개월");
  const monthly = MONTHLY_DATA[period];
  const maxMonthly = Math.max(...monthly.map(m => m.v));

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />

      <div style={{ display: "flex" }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>관리자</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>통계 대시보드</h1>
              <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>기술 스택, 도메인, 부서별 프로젝트 현황을 분석합니다.</p>
            </div>
            <div style={{ display: "flex", gap: 4, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: 4 }}>
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: period === p ? "#0F172A" : "transparent",
                  color: period === p ? "#fff" : "#64748B",
                }}>{p}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "전체 프로젝트", value: totalProjects, sub: "누적 등록", color: "#0F172A" },
              { label: "이번 달 신규", value: 15, sub: "전월 대비 +3건", color: "#2563EB" },
              { label: "활성 프로젝트", value: 54 + 41 + 18, sub: "운영 중 + 개발 중 + 파일럿", color: "#059669" },
              { label: "참여 부서", value: 38, sub: "전체 부서 82%", color: "#7C3AED" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: "-0.03em", marginBottom: 4 }}>{k.value}</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 24px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 20 }}>등록 추이 <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 8 }}>{period}</span></div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: monthly.length === 1 ? 0 : 10, height: 120, justifyContent: monthly.length === 1 ? "center" : "flex-start" }}>
                {monthly.map((m, i) => (
                  <div key={i} style={{ flex: monthly.length === 1 ? "0 0 80px" : 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#2563EB" }}>{m.v}</div>
                    <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: i === monthly.length - 1 ? "#BFDBFE" : "#2563EB", height: `${Math.max((m.v / maxMonthly) * 96, 8)}px` }} />
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{m.m}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>프로젝트 상태</div>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 16 }}>
                {STATUS_DATA.map((s, i) => <div key={i} title={`${s.label}: ${s.count}건`} style={{ flex: s.count, background: s.color }} />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {STATUS_DATA.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{s.count}</span>
                    <span style={{ fontSize: 11, color: "#94A3B8", width: 32, textAlign: "right" }}>{Math.round(s.count / totalProjects * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>비즈니스 도메인 분포</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {DOMAIN_DATA.map((d, i) => {
                  const pct = Math.round(d.count / totalDomain * 100);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: "#475569", width: 80, flexShrink: 0 }}>{d.label}</span>
                      <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 7, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#2563EB", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#94A3B8", width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>시스템 유형 분포</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {TYPE_DATA.map((t, i) => {
                  const total = TYPE_DATA.reduce((s, d) => s + d.count, 0);
                  const pct = Math.round(t.count / total * 100);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: "#475569", width: 110, flexShrink: 0 }}>{t.label}</span>
                      <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 7, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#7C3AED", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#94A3B8", width: 28, textAlign: "right", flexShrink: 0 }}>{t.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>기술 스택 TOP 8</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {STACK_DATA.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", width: 80, flexShrink: 0 }}>{s.label}</span>
                    <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 7, overflow: "hidden" }}>
                      <div style={{ width: `${(s.count / maxStack) * 100}%`, height: "100%", background: s.color, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#94A3B8", width: 28, textAlign: "right", flexShrink: 0 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>부서별 프로젝트 현황</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {DEPT_DATA.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: "#475569", width: 100, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.dept}</span>
                    <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 7, overflow: "hidden" }}>
                      <div style={{ width: `${(d.count / maxDept) * 100}%`, height: "100%", background: "#059669", borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#94A3B8", width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>탐색 키워드 빈도 <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginLeft: 8 }}>사용자가 검색한 상위 키워드</span></div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 100 }}>
              {SEARCH_KEYWORDS.map((k, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>{k.count}</div>
                  <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: `hsl(${220 + i * 12}, 70%, ${55 + i * 3}%)`, height: `${(k.count / maxKeyword) * 76}px` }} />
                  <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textAlign: "center" }}>{k.keyword}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}