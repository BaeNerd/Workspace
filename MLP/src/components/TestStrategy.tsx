import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";

const ZONES = [
  { id: "A", label: "Core Zone", color: "#3b82f6", bg: "rgba(59,130,246,0.15)", desc: "고밀도 학습 영역 — 핵심 성능 검증", sample: "40%" },
  { id: "B", label: "Transitional Zone", color: "#10b981", bg: "rgba(16,185,129,0.15)", desc: "중간 밀도 영역 — 보간 성능 검증", sample: "30%" },
  { id: "C", label: "Peripheral Zone", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", desc: "저밀도·경계 근방 — 일반화 성능 검증", sample: "20%" },
  { id: "D", label: "ΔE Boundary Zone", color: "#ef4444", bg: "rgba(239,68,68,0.15)", desc: "임계값 ±0.5 경계 구간 — 판정 경계 안정성 검증", sample: "10%" },
];

const SPECIAL_CASES = [
  { category: "극단 명도", items: ["L* 1–10 (초암색)", "L* 75–84 (고명도)", "L* 40–55 (중간 명도 스킨톤)"] },
  { category: "극단 채도", items: ["a* ≤ -5 (녹색계)", "a* ≥ 45 (강채 적색)", "b* ≤ 0 (청색 근방)", "b* ≥ 80 (강채 황색)"] },
  { category: "단축 지배 검증", items: ["ΔL 기여 ≥ 85% (인수 기준서 제외 대상 확인)", "Δa 기여 ≥ 85%", "Δb 기여 ≥ 85%"] },
  { category: "실무 색상 카테고리", items: ["파운데이션/스킨톤 (L 55–80, a 5–20, b 10–30)", "립 레드·핑크 (high a, mid L)", "아이섀도 다크 (low L)", "블러셔 피치·코럴"] },
];

const STEPS = [
  {
    step: "01", title: "학습 데이터 분포 분석",
    items: [
      "L*, a*, b* 각 축 히스토그램 및 백분위수(5·25·50·75·95%) 산출",
      "2D 산점도: a*-b*, L*-a*, L*-b* 평면 밀도 시각화 (KDE 권장)",
      "단축 지배 데이터 비율 사전 집계 (기여 ≥ 85% 기준)",
      "Group-aware split 후 Train·Val 분포 일치 여부 확인",
    ],
    color: "#6366f1",
  },
  {
    step: "02", title: "존 경계 획정",
    items: [
      "밀도 임계값(예: 상위 50% 밀도 → Core) 기반 A/B/C 존 경계 확정",
      "ΔE 임계값 ±0.5 경계 구간(Zone D) 별도 지정",
      "색공간 전체 범위(L 1–84, a -10–50, b -3–86) 내 미커버 영역 식별",
    ],
    color: "#0891b2",
  },
  {
    step: "03", title: "계층적 샘플링 (Stratified Sampling)",
    items: [
      "Zone A (Core, 40%) : 고빈도 실무 색상 중심 — Hit Rate·RMSE 주검증",
      "Zone B (Transitional, 30%) : 중간 밀도 보간 능력 검증",
      "Zone C (Peripheral, 20%) : 희소 구간 및 색 경계 일반화 검증",
      "Zone D (ΔE Boundary, 10%) : 임계값 ±0.5 경계 예측 안정성 전용",
      "특수 케이스 (극단값, 단축 지배 후보) 별도 추가 확보",
    ],
    color: "#059669",
  },
  {
    step: "04", title: "Group-aware 누출 차단",
    items: [
      "동일 색소 조합 계열(배합비 소폭 변형 포함)은 동일 분할에 집속",
      "테스트 셋에 Train/Val 배합비와 유사도 ≥ 임계값인 샘플 포함 금지",
      "색소 조합 ID별 클러스터 단위로 분할 — 단순 랜덤 분할 사용 금지",
    ],
    color: "#d97706",
  },
  {
    step: "05", title: "이상치·도메인 외 처리",
    items: [
      "단축 지배 데이터(단일 축 기여 ≥ 85%) → 판정 집계 전 제외 처리",
      "도메인 외 색공간 샘플 → 인수 판정 집계 분리, 별도 참고 보고",
      "제외 전/후 건수·비율 현황표 필수 작성 (인수기준서 7조 필수 산출물)",
    ],
    color: "#dc2626",
  },
];

const demoScatter = Array.from({ length: 120 }, (_, i) => {
  const cluster = i % 4;
  if (cluster === 0) return { a: 5 + Math.random() * 20, b: 10 + Math.random() * 25, zone: "Core" };
  if (cluster === 1) return { a: 25 + Math.random() * 20, b: 15 + Math.random() * 35, zone: "Transitional" };
  if (cluster === 2) return { a: -8 + Math.random() * 10, b: 60 + Math.random() * 25, zone: "Peripheral" };
  return { a: 35 + Math.random() * 12, b: -2 + Math.random() * 8, zone: "Peripheral" };
});

const zoneColor: Record<string, string> = { Core: "#3b82f6", Transitional: "#10b981", Peripheral: "#f59e0b" };

type Tab = "overview" | "zones" | "steps" | "special";

export default function TestStrategy() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div style={{ fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif", background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, color: "#fff" }}>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "#94a3b8", marginBottom: 8 }}>ML MODEL ACCEPTANCE</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>색상 예측 모델 테스트 데이터 전략</div>
          <div style={{ fontSize: 13, color: "#cbd5e1" }}>
            평가 도메인: L* 1–84 &nbsp;/&nbsp; a* −10–50 &nbsp;/&nbsp; b* −3–86 &nbsp;&nbsp;|&nbsp;&nbsp; 정방향(배합비→Lab) + 역방향(Lab→배합비)
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {([
            { id: "overview", label: "전략 개요" },
            { id: "zones", label: "색공간 존 분할" },
            { id: "steps", label: "단계별 절차" },
            { id: "special", label: "특수 케이스" },
          ] as { id: Tab; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: activeTab === t.id ? "#1e293b" : "#fff",
              color: activeTab === t.id ? "#fff" : "#64748b",
              boxShadow: activeTab === t.id ? "0 2px 8px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.08)",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {/* Zone Summary */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 14 }}>존별 샘플 비중 (권장)</div>
                {ZONES.map(z => (
                  <div key={z.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: z.color }}>Zone {z.id} — {z.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: z.color }}>{z.sample}</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: z.sample, background: z.color, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{z.desc}</div>
                  </div>
                ))}
              </div>

              {/* 핵심 설계 원칙 */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 14 }}>핵심 설계 원칙</div>
                {[
                  { icon: "🎯", title: "계층 샘플링 (Stratified)", body: "학습 데이터 밀도 기반 4개 존으로 분할 후 비례+과대추출 혼합 전략 적용" },
                  { icon: "🔒", title: "정보 누출 차단", body: "Group-aware split: 동일 색소 조합 계열은 반드시 동일 분할(Train 또는 Test)에 집속" },
                  { icon: "📋", title: "인수기준서 직결 설계", body: "Hit Rate, RMSE, ΔE 경계 구간 RMSE, ΔE>5.0 비율 등 모든 지표가 측정 가능하도록 구성" },
                  { icon: "⚠️", title: "이상치 사전 분리", body: "단축 지배(기여≥85%) 데이터는 판정 집계 전 제외. 도메인 외 샘플은 별도 보고" },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, padding: "10px 12px", background: "#f8fafc", borderRadius: 8 }}>
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{p.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coverage matrix */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 14 }}>검증 커버리지 매트릭스</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      {["테스트 목적", "대상 존", "주요 인수기준서 지표", "최소 샘플 수 (권장)"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#475569", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["핵심 성능 검증", "Zone A", "Hit Rate, RMSE, MAE, R²", "≥ 40건"],
                      ["보간 성능 검증", "Zone B", "RMSE, Hit Rate", "≥ 30건"],
                      ["일반화 검증", "Zone C", "ΔE > 3.0 비율, Hit Rate", "≥ 20건"],
                      ["경계 안정성 검증", "Zone D", "경계 구간 RMSE (보고 의무 임계 > 0.35)", "≥ 10건"],
                      ["극단값 검증", "전 존 극단부", "ΔE > 5.0 비율 (보고 의무 임계 > 1%)", "≥ 10건"],
                      ["단축 지배 제외 검증", "이상치 후보", "제외 전/후 건수 현황표", "≥ 5건"],
                    ].map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        {r.map((c, j) => <td key={j} style={{ padding: "8px 12px", color: "#334155" }}>{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Zones ── */}
        {activeTab === "zones" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>a*-b* 평면 분포 예시</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>※ 실제 학습 데이터 분포 분석 후 존 경계 재획정 필요</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="a" name="a*" domain={[-10, 50]} label={{ value: "a* (적 →)", position: "insideBottom", offset: -10, fontSize: 11 }} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="b" name="b*" domain={[-3, 86]} label={{ value: "b*", angle: -90, position: "insideLeft", fontSize: 11 }} tick={{ fontSize: 10 }} />
                  <ReferenceArea x1={0} x2={30} y1={5} y2={55} fill="rgba(59,130,246,0.10)" stroke="#3b82f6" strokeDasharray="4 2" label={{ value: "Core", position: "insideTopLeft", fontSize: 10, fill: "#3b82f6" }} />
                  <ReferenceArea x1={5} x2={20} y1={10} y2={30} fill="rgba(245,158,11,0.18)" stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "Skin", position: "center", fontSize: 9, fill: "#b45309" }} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 11 }} />
                  {["Core", "Transitional", "Peripheral"].map(z => (
                    <Scatter key={z} name={z} data={demoScatter.filter(d => d.zone === z)} fill={zoneColor[z]} opacity={0.7} r={3} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* L* range bands */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 12 }}>L* 구간별 샘플링 밴드</div>
                {[
                  { range: "L* 1–15", label: "초암색", color: "#1e293b", text: "#fff", note: "극단 검증" },
                  { range: "L* 15–35", label: "암색", color: "#475569", text: "#fff", note: "Zone C 포함" },
                  { range: "L* 35–55", label: "중간 명도", color: "#94a3b8", text: "#fff", note: "Zone A 핵심" },
                  { range: "L* 55–70", label: "스킨톤 메인", color: "#fbbf24", text: "#1e293b", note: "Zone A 핵심" },
                  { range: "L* 70–84", label: "고명도", color: "#fef9c3", text: "#92400e", note: "극단 검증" },
                ].map(b => (
                  <div key={b.range} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 90, background: b.color, color: b.text, fontSize: 10, fontWeight: 600, padding: "3px 7px", borderRadius: 4, textAlign: "center" }}>{b.range}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#334155", width: 80 }}>{b.label}</span>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{b.note}</span>
                  </div>
                ))}
              </div>

              {/* Zone D detail */}
              <div style={{ background: "#fff7ed", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: "4px solid #ef4444" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c", marginBottom: 8 }}>Zone D — ΔE 경계 구간 전용</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
                  인수기준서 제1조: ΔE 경계값 <strong>±0.5 이내</strong> 구간에서<br />
                  경계 구간 RMSE &gt; 0.35 시 보고 의무 발생.<br /><br />
                  → 모델이 경계 근방에서 "Acceptable/Unacceptable"을<br />
                  얼마나 안정적으로 판정하는지 집중 검증 필요.<br /><br />
                  <strong>전략:</strong> 정방향 모델 예측 후 ΔE 임계값 근방<br />
                  (확정 임계 ± 0.8 이내) 에 해당하는 샘플을 추가 확보.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Steps ── */}
        {activeTab === "steps" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: `4px solid ${s.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                    {s.step}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{s.title}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {s.items.map((item, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, marginTop: 5, flexShrink: 0 }} />
                      <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Special Cases ── */}
        {activeTab === "special" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              {SPECIAL_CASES.map((sc, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>{sc.category}</div>
                  {sc.items.map((item, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>▸</span>
                      <span style={{ fontSize: 12, color: "#475569" }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Checklist for reverse model */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: "4px solid #7c3aed" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", marginBottom: 12 }}>역방향 모델 추가 테스트 포인트</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  "동일 Lab 목표에 대해 유효 배합비 ≥ 2개 존재하는 케이스",
                  "제안 후보(Top-1~3) 간 배합비 편차 ≥ 5% 다양성 검증",
                  "필수 색소 / 제외 색소 제약 조건 반영 여부 확인",
                  "배합비 합산 100% ± 1.0% 이내 비율 검증 (인수 판정 기준)",
                  "Best of 3 Hit Rate 경계 구간: 60%–75% 구간 집중 검증",
                  "Top-1 vs Best of 3 성능 괴리가 큰 색 영역 식별",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, background: "#f5f3ff", borderRadius: 7, padding: "8px 10px" }}>
                    <span style={{ fontSize: 14 }}>□</span>
                    <span style={{ fontSize: 11, color: "#4c1d95" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
          ※ 존 경계 및 샘플 비중은 학습 데이터 실측 분포 분석 후 양사 합의하여 조정. 인수기준서 제2-0조 기준 확정 절차 병행 진행 권장.
        </div>
      </div>
    </div>
  );
}
