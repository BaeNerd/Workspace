import { useState } from "react";

const WORKFLOW = [
  {
    step: "1단계",
    title: "수행사로부터 받을 것",
    icon: "📦",
    color: "#6366f1",
    bg: "#eef2ff",
    items: [
      { label: "학습 데이터 Lab* 좌표", desc: "배합비(처방)는 제외하고 Lab* 값만 — 정보 누출 없이 분포 파악 가능" },
      { label: "축별 기술통계", desc: "L*/a*/b* 각각의 min·max·mean·std·백분위수(5/25/50/75/95)" },
      { label: "Group 레이블", desc: "동일 색소 조합 계열 클러스터 ID — Group-aware split 검증용" },
      { label: "이상치 플래그", desc: "단축 지배(기여 ≥85%) 여부 사전 표시 요청" },
    ],
    note: "⚠️ 배합비(처방 수치)는 요청 불필요. Lab* 좌표만으로 충분.",
  },
  {
    step: "2단계",
    title: "분포 분석",
    icon: "🔬",
    color: "#0891b2",
    bg: "#ecfeff",
    items: [
      { label: "Python + Jupyter Notebook", desc: "주력 도구. 분포 시각화 → 존 획정 → 샘플링 계획 전 과정 처리" },
      { label: "pandas / numpy", desc: "기술통계, 축별 히스토그램, 백분위수 산출" },
      { label: "plotly", desc: "3D 대화형 Lab* 산점도 — 색공간 커버리지 직관적 확인에 최적" },
      { label: "scikit-learn (KDE)", desc: "KernelDensity로 고밀도/저밀도 존 경계 수치화. 클러스터링(KMeans)으로 존 자동 획정 보조" },
    ],
    note: "💡 colour-science 라이브러리 추가 시 ΔE 계산 및 Lab↔XYZ 변환 내장 지원",
  },
  {
    step: "3단계",
    title: "테스트 데이터 설계",
    icon: "🎯",
    color: "#059669",
    bg: "#ecfdf5",
    items: [
      { label: "샘플링 스크립트 (Python)", desc: "존별 비중(A 40%, B 30%, C 20%, D 10%) 기반 후보 좌표 자동 생성" },
      { label: "Excel / Google Sheets", desc: "최종 테스트 배합비 목록 정리 및 연구원 공유용. 복잡한 분석은 Python으로" },
      { label: "중복 검사 스크립트", desc: "제안된 테스트 Lab*가 학습 데이터와 너무 유사한지 ΔE 기반 거리 검사 (최소 ΔE > 1.0 권장)" },
    ],
    note: "📋 출력물: 테스트 조색 지시서 (목표 Lab*, 우선순위 존, 특수 케이스 여부)",
  },
  {
    step: "4단계",
    title: "실험 및 인수 판정",
    icon: "🧪",
    color: "#d97706",
    bg: "#fffbeb",
    items: [
      { label: "측색기 결과 → Python 자동 집계", desc: "실측 Lab* 입력 시 ΔE 자동 산출, Hit Rate·RMSE·MAE·R² 일괄 계산" },
      { label: "인수기준서 판정 리포트 자동 생성", desc: "제7조/제15조 필수 문장 포맷에 맞춰 수치 자동 삽입 출력" },
      { label: "Excel 대시보드 (선택)", desc: "연구원·PMO 공유용 시각화. Python 집계 결과를 Excel로 내보내기" },
    ],
    note: "🔒 Test 데이터 원본은 한국콜마 별도 보관, 수행사 비공개 유지",
  },
];

const LIBS = [
  { name: "pandas", purpose: "데이터 로드·정제·통계", pip: "pip install pandas", star: true },
  { name: "numpy", purpose: "수치 연산·배열 처리", pip: "pip install numpy", star: true },
  { name: "plotly", purpose: "3D 대화형 Lab* 산점도", pip: "pip install plotly", star: true },
  { name: "scikit-learn", purpose: "KDE·KMeans·stratified split", pip: "pip install scikit-learn", star: true },
  { name: "colour-science", purpose: "ΔE 계산, Lab↔XYZ 변환", pip: "pip install colour-science", star: true },
  { name: "matplotlib / seaborn", purpose: "정적 히스토그램·분포도", pip: "pip install matplotlib seaborn", star: false },
  { name: "scipy", purpose: "KDE 고급, 통계 검정", pip: "pip install scipy", star: false },
  { name: "openpyxl", purpose: "Excel 리포트 자동 생성", pip: "pip install openpyxl", star: false },
];

const CODE_SNIPPET = `import pandas as pd
import numpy as np
import plotly.express as px
from sklearn.neighbors import KernelDensity
import colour  # colour-science

# 1. 수행사에서 받은 Lab* 데이터 로드
df = pd.read_csv("train_lab_coords.csv")  # L, a, b 컬럼만

# 2. 기술통계 확인
print(df[["L","a","b"]].describe(percentiles=[.05,.25,.5,.75,.95]))

# 3. 3D 분포 시각화 (plotly)
fig = px.scatter_3d(df, x="a", y="b", z="L",
    color="zone",  # 존 레이블이 있는 경우
    opacity=0.5, title="Lab* 학습 데이터 분포")
fig.show()

# 4. KDE로 밀도 추정 → 존 경계 획정
X = df[["L","a","b"]].values
kde = KernelDensity(bandwidth=2.0).fit(X)
df["log_density"] = kde.score_samples(X)

# 5. ΔE 계산 (colour-science)
def calc_delta_e(lab1, lab2):
    return colour.delta_E(lab1, lab2, method="CIE 1976")

# 6. 테스트 후보 중복 검사
# 제안 테스트 Lab*가 학습 데이터와 너무 가깝지 않은지 확인
from sklearn.metrics import pairwise_distances
test_candidates = np.array([[60, 15, 20], [30, 5, 10]])  # 예시
dists = pairwise_distances(test_candidates, X, metric="euclidean")
min_dists = dists.min(axis=1)
print("최근접 학습 샘플 ΔE:", min_dists)  # > 1.0 권장`;

type Tab = "workflow" | "libs" | "code";

export default function ToolRec() {
  const [activeTab, setActiveTab] = useState<Tab>("workflow");
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_SNIPPET).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  return (
    <div style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", background: "#f8fafc", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1e293b,#334155)", borderRadius: 16, padding: "24px 28px", marginBottom: 20, color: "#fff" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#94a3b8", marginBottom: 6 }}>TOOL RECOMMENDATION</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>테스트 데이터 생성 도구 추천</div>
          <div style={{ fontSize: 12, color: "#cbd5e1" }}>수행사 분포 데이터 수령 → 분석 → 테스트 설계 전 단계 워크플로</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {([
            { id: "workflow", label: "단계별 워크플로" },
            { id: "libs", label: "라이브러리 목록" },
            { id: "code", label: "빠른 시작 코드" },
          ] as { id: Tab; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: activeTab === t.id ? "#1e293b" : "#fff",
              color: activeTab === t.id ? "#fff" : "#64748b",
              boxShadow: activeTab === t.id ? "0 2px 8px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.08)",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Workflow ── */}
        {activeTab === "workflow" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {WORKFLOW.map((w, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: `5px solid ${w.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ background: w.bg, width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{w.icon}</div>
                  <div>
                    <div style={{ fontSize: 10, color: w.color, fontWeight: 700, letterSpacing: 1 }}>{w.step}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{w.title}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {w.items.map((item, j) => (
                    <div key={j} style={{ background: w.bg, borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: w.color, marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 7, padding: "8px 12px", fontSize: 11, color: "#64748b" }}>{w.note}</div>
              </div>
            ))}

            {/* Bottom summary */}
            <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, color: "#fff" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#94a3b8" }}>한 줄 요약</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { q: "분석 핵심 도구", a: "Python + Jupyter Notebook" },
                  { q: "3D 색공간 시각화", a: "Plotly (대화형)" },
                  { q: "밀도 기반 존 획정", a: "scikit-learn KDE" },
                  { q: "ΔE 계산", a: "colour-science 라이브러리" },
                  { q: "결과 공유·지시서", a: "Excel / Google Sheets" },
                  { q: "인수 판정 리포트", a: "Python 자동 생성 → Excel" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#64748b", minWidth: 110 }}>{s.q}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>→ {s.a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Libraries ── */}
        {activeTab === "libs" && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 14 }}>
              필수 라이브러리 ★ / 선택 라이브러리
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  {["라이브러리", "용도", "설치 명령어", "필수"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", color: "#475569", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LIBS.map((lib, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: lib.star ? "#1e293b" : "#64748b" }}>{lib.name}</td>
                    <td style={{ padding: "9px 12px", color: "#475569" }}>{lib.purpose}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 11, color: "#334155" }}>{lib.pip}</code>
                    </td>
                    <td style={{ padding: "9px 12px", textAlign: "center", fontSize: 16 }}>{lib.star ? "★" : "☆"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 18, background: "#ecfdf5", borderRadius: 10, padding: 16, borderLeft: "4px solid #059669" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#065f46", marginBottom: 6 }}>한 번에 설치</div>
              <code style={{ fontSize: 11, color: "#047857", display: "block", fontFamily: "monospace" }}>
                pip install pandas numpy plotly scikit-learn colour-science matplotlib seaborn scipy openpyxl
              </code>
            </div>

            <div style={{ marginTop: 14, background: "#fef9c3", borderRadius: 10, padding: 16, borderLeft: "4px solid #d97706" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>colour-science 주의사항</div>
              <div style={{ fontSize: 11, color: "#78350f" }}>
                패키지명은 <code>colour-science</code>이지만 import 시에는 <code>import colour</code> 사용.
                ΔE CIE76 계산: <code>colour.delta_E(lab1, lab2, method='CIE 1976')</code>
              </div>
            </div>
          </div>
        )}

        {/* ── Code ── */}
        {activeTab === "code" && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>빠른 시작 코드 (Jupyter Notebook)</div>
              <button onClick={copyCode} style={{
                padding: "6px 14px", borderRadius: 7, border: "1px solid #e2e8f0", background: copiedCode ? "#ecfdf5" : "#f8fafc",
                color: copiedCode ? "#059669" : "#64748b", fontSize: 12, cursor: "pointer", fontWeight: 600,
              }}>{copiedCode ? "✓ 복사됨" : "📋 복사"}</button>
            </div>
            <pre style={{
              background: "#1e293b", color: "#e2e8f0", borderRadius: 10, padding: 18, fontSize: 11,
              lineHeight: 1.7, overflowX: "auto", fontFamily: "'Fira Code','Courier New',monospace",
              whiteSpace: "pre-wrap", margin: 0,
            }}>{CODE_SNIPPET}</pre>

            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { title: "수행사 요청 파일 형식", body: "CSV: 컬럼 L, a, b, group_id, outlier_flag\n배합비(처방) 수치는 포함하지 않음" },
                { title: "테스트 후보 중복 기준", body: "제안 테스트 Lab*와 학습 데이터 간\n최소 ΔE > 1.0 권장 (엄격 기준: > 2.0)" },
                { title: "존 획정 밀도 임계값", body: "KDE log-density 상위 50% → Core\n25~50% → Transitional / 25% 미만 → Peripheral" },
                { title: "출력물 형식", body: "테스트 조색 지시서: 목표 Lab*, 존 분류,\n특수 케이스 여부 → Excel 정리 후 연구원 배포" },
              ].map((tip, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>{tip.title}</div>
                  <pre style={{ fontSize: 11, color: "#64748b", margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 }}>{tip.body}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
