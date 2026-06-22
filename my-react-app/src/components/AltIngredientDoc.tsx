import { useState } from "react";

const TABS = [
  { id: "overview", label: "1. 개요 및 목적" },
  { id: "process", label: "2. 핵심 로직 프로세스" },
  { id: "db", label: "3. DB 설계" },
  { id: "logic", label: "4. 추천 로직 상세" },
  { id: "api", label: "5. API 명세" },
  { id: "kpi", label: "6. KPI / 인수 기준" },
  { id: "stage", label: "7. Stage 로드맵" },
];

const badge = (text, color) => {
  const map = {
    blue: { bg: "#E6F1FB", text: "#0C447C", border: "#B5D4F4" },
    teal: { bg: "#E1F5EE", text: "#085041", border: "#9FE1CB" },
    amber: { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
    red: { bg: "#FCEBEB", text: "#791F1F", border: "#F7C1C1" },
    purple: { bg: "#EEEDFE", text: "#3C3489", border: "#CECBF6" },
    gray: { bg: "#F1EFE8", text: "#444441", border: "#D3D1C7" },
    green: { bg: "#EAF3DE", text: "#27500A", border: "#C0DD97" },
    coral: { bg: "#FAECE7", text: "#712B13", border: "#F5C4B3" },
  };
  const c = map[color] || map.gray;
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, fontSize: 11, fontWeight: 500, padding: "2px 8px", display: "inline-block", whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border-tertiary)", paddingBottom: 8, marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);

const InfoBox = ({ color = "blue", children }) => {
  const map = { blue: "#E6F1FB", amber: "#FAEEDA", teal: "#E1F5EE", red: "#FCEBEB", purple: "#EEEDFE" };
  const tc = { blue: "#185FA5", amber: "#854F0B", teal: "#0F6E56", red: "#A32D2D", purple: "#534AB7" };
  return (
    <div style={{ background: map[color], border: `1px solid ${tc[color]}33`, borderRadius: 8, padding: "12px 16px", marginBottom: 12, fontSize: 13, color: tc[color], lineHeight: 1.6 }}>
      {children}
    </div>
  );
};

const Table = ({ headers, rows }) => (
  <div style={{ overflowX: "auto", marginBottom: 16 }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
      <thead>
        <tr style={{ background: "var(--color-background-secondary)" }}>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "1px solid var(--color-border-tertiary)", whiteSpace: "nowrap" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>
            {r.map((c, ci) => (
              <td key={ci} style={{ padding: "8px 10px", color: "var(--color-text-primary)", verticalAlign: "top", lineHeight: 1.5 }}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FlowStep = ({ num, title, sub, color = "blue", arrow = true }) => {
  const map = { blue: ["#E6F1FB", "#0C447C", "#B5D4F4"], teal: ["#E1F5EE", "#085041", "#9FE1CB"], amber: ["#FAEEDA", "#633806", "#FAC775"], purple: ["#EEEDFE", "#3C3489", "#CECBF6"], green: ["#EAF3DE", "#27500A", "#C0DD97"] };
  const [bg, tc, bd] = map[color] || map.blue;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: arrow ? 0 : 0 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: bg, border: `1px solid ${bd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, color: tc, flexShrink: 0 }}>{num}</div>
        {arrow && <div style={{ width: 1, height: 32, background: "var(--color-border-tertiary)", marginTop: 4 }} />}
      </div>
      <div style={{ paddingTop: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2, lineHeight: 1.5 }}>{sub}</div>
      </div>
    </div>
  );
};

const DBTable = ({ name, fields, badge: bdg, color }) => (
  <div style={{ background: "var(--color-background-primary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
    <div style={{ padding: "10px 14px", background: "var(--color-background-secondary)", borderBottom: "1px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{name}</span>
      {badge(bdg, color)}
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
      <thead>
        <tr style={{ background: "var(--color-background-secondary)" }}>
          {["필드명", "타입", "설명", "예시"].map((h, i) => (
            <th key={i} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "1px solid var(--color-border-tertiary)" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {fields.map((f, i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>
            <td style={{ padding: "6px 10px", fontFamily: "monospace", fontSize: 11, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>{f[0]}</td>
            <td style={{ padding: "6px 10px", color: "var(--color-text-secondary)" }}>{f[1]}</td>
            <td style={{ padding: "6px 10px", color: "var(--color-text-primary)", lineHeight: 1.4 }}>{f[2]}</td>
            <td style={{ padding: "6px 10px", color: "var(--color-text-secondary)", fontFamily: "monospace", fontSize: 10.5 }}>{f[3]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function AltIngredientDoc() {
  const [tab, setTab] = useState("overview");

  const renderOverview = () => (
    <div>
      <Section title="1-1. 문서 메타데이터">
        <Table
          headers={["항목", "내용"]}
          rows={[
            ["문서명", "대체 원료 추천 AI — 기능 설계 및 개발 명세서"],
            ["적용 팀", "스킨케어1팀"],
            ["연계 시스템", "고객 니즈 기반 처방 지원 시스템 (Project AI Lab)"],
            ["개발 단계", "Stage 3 (Stage 2 기반 자산 의존)"],
            ["수행사", "핑거포인트랩 (FPL)"],
            ["참조 문서", "SoW §2, 요구사항정의서 §2.4·§2.7·§2.8, 인수기준서"],
            ["작성일", "2026-06"],
          ]}
        />
      </Section>

      <Section title="1-2. 개발 목적">
        <InfoBox color="blue">
          연구원이 처방 개발 중 특정 원료를 교체해야 하는 상황에서, 동일 기능을 수행하면서 물성 적합성과 교호작용이 검증된 대체 원료 후보를 자동으로 탐색·순위화하여 제공합니다.
        </InfoBox>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[
            { title: "원료 교체 시간 단축", sub: "수동 탐색 → 자동화 추천", color: "blue" },
            { title: "물성 적합성 사전 검증", sub: "pH·점도 예측 AI 연동", color: "teal" },
            { title: "교호작용 리스크 차단", sub: "룰셋 기반 필터링 (Stage 2)", color: "amber" },
            { title: "GNN 고도화 기반 마련", sub: "Stage 3 unknown interaction 예측", color: "purple" },
          ].map((c, i) => (
            <div key={i} style={{ background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="1-3. 시스템 범위 및 Stage 위치">
        <InfoBox color="amber">
          대체 원료 추천 AI는 Stage 2에서 구축되는 원료-Function DB, 물성 예측 AI, 교호작용 룰셋 등의 기반 자산을 전제로 동작하는 Stage 3 기능입니다. Stage 2 원료-Function DB의 커버리지·정확도가 추천 품질을 직접 결정합니다.
        </InfoBox>
        <Table
          headers={["구분", "Stage 2 (선행 의존)", "Stage 3 (본 기능)","비고"]}
          rows={[
            ["원료-Function DB", "구축·검증", "탐색 공간 정의에 활용", "품질 체크포인트 필요"],
            ["물성 예측 AI (pH·점도)", "모델 개발 완료", "원료 교체 후 물성 시뮬레이션", "정방향 예측 모델"],
            ["교호작용 예측 AI", "룰셋 기반 구현", "GNN 고도화", "Stage 2 룰셋 → Stage 3 학습 데이터"],
            ["금지 성분 DB", "구축 완료", "추천 후보 자동 제외 필터", "100% 차단 요건"],
            ["유사처방 검색 엔진", "Elasticsearch Vector Search", "이력 기반 신뢰도 보정 재활용", "Stage 2 공유"],
          ]}
        />
      </Section>
    </div>
  );

  const renderProcess = () => (
    <div>
      <Section title="2-1. 전체 추천 파이프라인 (3단계)">
        <InfoBox color="teal">
          사용자가 현재 처방과 교체 대상 원료를 입력하면, 세 단계의 파이프라인을 거쳐 우선순위화된 대체 원료 후보가 출력됩니다.
        </InfoBox>

        {[
          { num: "01", color: "blue", title: "1단계 — 후보 탐색 (탐색 공간 정의)", arrow: true,
            sub: "원료-Function DB에서 동일 기능군 후보 원료 전체 추출 → 금지 성분 DB 기반 자동 제외 처리" },
          { num: "02", color: "teal", title: "2단계 — 물성 적합성 검증", arrow: true,
            sub: "후보 원료 교체 후 pH·점도 예측 AI로 물성 시뮬레이션 → 허용 범위 이탈 후보 제거" },
          { num: "03", color: "purple", title: "3단계 — 교호작용 검증 및 순위 산출", arrow: false,
            sub: "기존 처방 성분과 후보 원료 간 교호작용 룰셋 검증 → 처방 이력 기반 신뢰도 보정 → 최종 순위 출력" },
        ].map((s, i) => (
          <FlowStep key={i} num={s.num} title={s.title} sub={s.sub} color={s.color} arrow={s.arrow} />
        ))}
      </Section>

      <Section title="2-2. 단계별 처리 로직 상세">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "var(--color-text-primary)" }}>① 1단계: 후보 탐색</div>
          <Table
            headers={["처리 항목", "로직", "사용 DB / 모델"]}
            rows={[
              ["기능군 매핑", "교체 원료의 function_category 조회 → 동일 카테고리 원료 전체 추출", "원료-기능 매핑 테이블 (②)"],
              ["복수 기능 처리", "교체 원료가 다중 기능 보유 시 모든 기능군 교집합 후보 우선 탐색", "INCI-multi function mapping"],
              ["금지 성분 제외", "is_restricted = Y 원료 자동 필터", "원료 마스터 테이블 (①)"],
              ["후보 규모", "기능군 규모에 따라 수십~수백 건 예상", "-"],
            ]}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "var(--color-text-primary)" }}>② 2단계: 물성 필터링</div>
          <Table
            headers={["처리 항목", "로직", "판정 기준"]}
            rows={[
              ["방향성 사전 필터", "물성 영향도 테이블(③)의 effect_direction으로 명백한 부적합 제거", "상승/하강/중립 방향성 불일치 시 제외"],
              ["AI 시뮬레이션", "물성 예측 AI (pH·점도 정방향 모델)로 교체 후 예상 물성 계산", "요구사항정의서 §2.7.1 연계"],
              ["허용 범위 판정", "pH: 목표범위 ±0.5 이내, 점도: MAPE ≤ 5%", "인수기준서 §2 물성 예측 모델 기준 준용"],
              ["경계값 처리", "허용 범위 근처 후보는 '검증 권장' 경고 태그 부착 후 통과", "UI상 경고 표시 (인수기준 §1 준용)"],
            ]}
          />
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "var(--color-text-primary)" }}>③ 3단계: 교호작용 검증 및 순위화</div>
          <Table
            headers={["처리 항목", "로직", "Stage별 구현"]}
            rows={[
              ["룰셋 기반 교호작용", "교호작용 룰 테이블(④) — 처방 내 기존 성분과 후보 원료 간 길항/시너지 검증", "Stage 2 (요구사항정의서 §2.7.3)"],
              ["GNN 교호작용", "처방 그래프 스냅샷(⑥) 기반 unknown interaction 예측", "Stage 3 고도화"],
              ["이력 신뢰도 보정", "처방-원료 이력(⑤)에서 해당 원료 사용 이력·성공률 확인 → 신뢰도 가중치 반영", "Stage 2~3 공통"],
              ["최종 순위 산출", "교호작용 적합도 + 물성 안전도 + 이력 신뢰도의 가중 합산 점수로 정렬", "착수 보고 시 가중치 정의·승인"],
            ]}
          />
        </div>
      </Section>

      <Section title="2-3. 처리 흐름 요약표">
        <InfoBox color="purple">
          실시간 추천 파이프라인의 2단계는 2A(사전 제거 필터) → 2C(물성 예측 시뮬) 두 스텝입니다. SHAP(2B)는 실시간 흐름에 포함되지 않으며 모델 재학습 시 실행되는 오프라인 배치 프로세스로, 갱신된 ③ 테이블을 2A가 참조합니다.
        </InfoBox>
        <Table
          headers={["단계", "입력", "처리 방식 (실시간)", "출력", "예상 규모"]}
          rows={[
            ["1단계 — 후보 탐색", "교체 대상 원료 + 현재 처방", "기능군 매핑 + 금지 성분 필터 + 임베딩 유사도", "후보 원료 목록", "수백 건"],
            ["2단계 — 물성 적합성 검증", "후보 목록 + 현재 처방 조성", "2A 사전 제거 필터(③ 참조) → 2C 물성 예측 시뮬", "오차 범위 포함 목표 물성 적합 후보", "수십 건"],
            ["[오프라인] SHAP 갱신", "물성 예측 AI (재학습 시)", "SHAP 추출 → ③ 물성 영향도 자동 갱신", "③ 테이블 업데이트 (2A 참조)", "모델 재학습 시"],
            ["3단계 — 교호작용·순위화", "물성 통과 후보 + 처방 전성분", "룰셋(S2) + GNN(S3) + 협업 필터링", "우선순위 대체 원료 목록", "상위 5~10건"],
          ]}
        />
      </Section>
    </div>
  );

  const renderDB = () => (
    <div>
      <InfoBox color="purple">
        아래 9개 테이블은 대체 원료 추천 AI의 데이터 저장소입니다. ①~⑤는 유사처방 검색 시스템과 공유되는 공통 기반이며, ⑥~⑨는 교호작용 예측 AI 전용 확장 테이블입니다.
      </InfoBox>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {[
          { label: "① 공통 기반", color: "blue" }, { label: "⑥~⑨ 교호작용 전용", color: "purple" },
          { label: "PK: 기본키", color: "gray" }, { label: "FK: 외래키", color: "gray" },
        ].map((b, i) => <span key={i}>{badge(b.label, b.color)}</span>)}
      </div>

      <Section title="공통 기반 테이블 (①~⑤)">
        <DBTable
          name="① 원료 마스터 (ingredient_master)"
          bdg="PK 기준"
          color="blue"
          fields={[
            ["ingredient_id", "VARCHAR(20)", "내부 식별 키 (PK)", "ING-0001"],
            ["inci_name", "VARCHAR(200)", "INCI 공식명", "Glycerin"],
            ["korean_name", "VARCHAR(200)", "한국어 원료명", "글리세린"],
            ["cas_number", "VARCHAR(20)", "CAS 번호", "56-81-5"],
            ["supplier", "VARCHAR(100)", "원료사명", "BASF"],
            ["is_restricted", "CHAR(1)", "금지/제한 성분 여부", "Y / N"],
            ["restriction_note", "TEXT", "제한 근거", "파라벤류 사용제한"],
          ]}
        />
        <DBTable
          name="② 원료-기능 매핑 (ingredient_function_map)"
          bdg="1:N 관계"
          color="teal"
          fields={[
            ["ingredient_id", "VARCHAR(20)", "원료 마스터 FK", "ING-0001"],
            ["function_category", "VARCHAR(50)", "기능 대분류", "보습제"],
            ["function_detail", "VARCHAR(100)", "기능 세부 (INCI 기준)", "Humectant"],
            ["is_primary", "CHAR(1)", "주기능 여부", "Y / N"],
            ["source", "VARCHAR(50)", "데이터 출처", "원료사 PDF / ELN"],
          ]}
        />
        <DBTable
          name="③ 물성 영향도 (ingredient_property_effect)"
          bdg="룰 기반"
          color="amber"
          fields={[
            ["ingredient_id", "VARCHAR(20)", "원료 마스터 FK", "ING-0001"],
            ["property_type", "VARCHAR(20)", "물성 종류", "pH / 점도"],
            ["effect_direction", "VARCHAR(10)", "영향 방향", "상승 / 하강 / 중립"],
            ["effect_magnitude", "VARCHAR(5)", "영향 크기", "강 / 중 / 약"],
            ["confidence_level", "VARCHAR(20)", "신뢰도", "실험검증 / 문헌 / 추정"],
            ["note", "TEXT", "현업 코멘트", "1% 이상 투입 시 점도 급상승"],
          ]}
        />
        <DBTable
          name="④ 교호작용 룰 (interaction_rule)"
          bdg="Stage 2 룰 저장소"
          color="coral"
          fields={[
            ["ingredient_id_a", "VARCHAR(20)", "성분 A (FK)", "ING-0001"],
            ["ingredient_id_b", "VARCHAR(20)", "성분 B (FK)", "ING-0042"],
            ["interaction_type", "VARCHAR(10)", "상호작용 유형", "시너지 / 길항 / 중립"],
            ["affected_property", "VARCHAR(20)", "영향 받는 물성", "점도 / pH / 보존력"],
            ["concentration_condition", "VARCHAR(100)", "농도 조건", "A≥2%, B≥1% 동시"],
            ["rule_source", "VARCHAR(30)", "룰 근거", "현업규칙 / 문헌 / ELN실험"],
            ["confidence_level", "VARCHAR(20)", "신뢰도", "검증됨 / 추정"],
          ]}
        />
        <DBTable
          name="⑤ 처방-원료 이력 (formulation_ingredient_history)"
          bdg="이력 기반 신뢰도"
          color="green"
          fields={[
            ["lab_no", "VARCHAR(30)", "ELN Lab 번호 (PK)", "L-2024-0123"],
            ["ingredient_id", "VARCHAR(20)", "원료 마스터 FK", "ING-0001"],
            ["concentration_pct", "DECIMAL(5,2)", "처방 내 함량(%)", "3.5"],
            ["formulation_result", "VARCHAR(10)", "처방 결과", "적합 / 부적합"],
            ["ph_result", "DECIMAL(4,2)", "실측 pH", "6.2"],
            ["viscosity_result", "INT", "실측 점도 (cps)", "12000"],
          ]}
        />
      </Section>

      <Section title="교호작용 예측 전용 테이블 (⑥~⑨)">
        <DBTable
          name="⑥ 처방 그래프 스냅샷 (formulation_graph_snapshot)"
          bdg="GNN 학습 입력"
          color="purple"
          fields={[
            ["graph_id", "VARCHAR(20)", "그래프 식별 키 (PK)", "GR-0001"],
            ["lab_no", "VARCHAR(30)", "원본 처방 FK", "L-2024-0123"],
            ["node_list", "JSON", "원료 노드 목록", '["ING-001","ING-042"]'],
            ["edge_list", "JSON", "교호작용 엣지 목록", '[{"a":"ING-001","b":"ING-042","type":"길항"}]'],
            ["node_feature_version", "VARCHAR(10)", "원료 임베딩 버전", "v1.2"],
            ["created_at", "DATETIME", "생성 시점 (MLflow 연동)", "2026-09-01"],
          ]}
        />
        <DBTable
          name="⑦ 교호작용 예측 결과 로그 (interaction_prediction_log)"
          bdg="재학습 Ground Truth"
          color="blue"
          fields={[
            ["prediction_id", "VARCHAR(20)", "예측 식별 키 (PK)", "PRED-0001"],
            ["ingredient_id_a", "VARCHAR(20)", "성분 A (FK)", "ING-001"],
            ["ingredient_id_b", "VARCHAR(20)", "성분 B (FK)", "ING-042"],
            ["context_lab_no", "VARCHAR(30)", "예측 맥락 처방", "L-2024-0123"],
            ["predicted_type", "VARCHAR(10)", "예측된 교호작용 유형", "길항"],
            ["confidence_score", "DECIMAL(4,3)", "모델 신뢰도", "0.87"],
            ["model_version", "VARCHAR(20)", "사용된 모델 버전", "gnn-v1.0"],
            ["rule_source", "VARCHAR(10)", "룰/GNN 구분", "GNN / Rule"],
            ["verified_result", "VARCHAR(10)", "실험 검증 결과", "적합 / 부적합 / 미검증"],
            ["verified_at", "DATETIME", "검증 일시", "2026-10-15"],
          ]}
        />
        <DBTable
          name="⑧ 원료 임베딩 레지스트리 (ingredient_embedding_registry)"
          bdg="Elasticsearch 연동"
          color="teal"
          fields={[
            ["ingredient_id", "VARCHAR(20)", "원료 마스터 FK", "ING-001"],
            ["embedding_version", "VARCHAR(10)", "임베딩 버전", "v1.2"],
            ["embedding_vector", "TEXT", "벡터값 (ES dense_vector에 실제 저장)", "[0.82, 0.14, ...]"],
            ["feature_schema", "VARCHAR(100)", "피처 구성 정의", "function+property+history"],
            ["model_used", "VARCHAR(50)", "임베딩 생성 모델", "MolBERT / custom"],
            ["created_at", "DATETIME", "생성 시점", "2026-08-01"],
          ]}
        />
        <DBTable
          name="⑨ GNN 모델 성능 추적 (gnn_model_performance_tracker)"
          bdg="인수기준 판단"
          color="amber"
          fields={[
            ["eval_id", "VARCHAR(20)", "평가 식별 키 (PK)", "EVAL-0001"],
            ["model_version", "VARCHAR(20)", "GNN 모델 버전", "gnn-v1.0"],
            ["eval_date", "DATE", "평가 일자", "2027-01-15"],
            ["interaction_f1", "DECIMAL(4,3)", "교호작용 분류 F1 Score", "0.83"],
            ["precision", "DECIMAL(4,3)", "정밀도", "0.86"],
            ["recall", "DECIMAL(4,3)", "재현율", "0.80"],
            ["rule_coverage_rate", "DECIMAL(4,3)", "룰 기반 커버율", "0.65"],
            ["gnn_coverage_rate", "DECIMAL(4,3)", "GNN 추가 발견율", "0.18"],
            ["unknown_interaction_detected", "INT", "신규 교호작용 발견 건수", "12"],
            ["retrain_triggered", "CHAR(1)", "재학습 여부", "Y / N"],
          ]}
        />
      </Section>

      <Section title="테이블 간 관계 (ERD 요약)">
        <Table
          headers={["테이블", "관계", "연결 키", "비고"]}
          rows={[
            ["① ↔ ②", "1:N", "ingredient_id", "원료 1개 → 복수 기능"],
            ["① ↔ ③", "1:N", "ingredient_id", "원료 1개 → 복수 물성 영향"],
            ["④ A·B", "N:N", "ingredient_id_a / b", "성분 쌍 단위 교호작용"],
            ["⑤ ↔ ①", "N:1", "ingredient_id", "처방 이력 → 원료 마스터"],
            ["⑥ ↔ ⑤", "N:1", "lab_no", "그래프 스냅샷 → 원본 처방"],
            ["⑧ ↔ ①", "N:1", "ingredient_id", "임베딩 → 원료 마스터"],
            ["⑦ ↔ ①", "N:1", "ingredient_id_a / b", "예측 로그 → 원료 마스터"],
          ]}
        />
      </Section>
    </div>
  );

  const renderLogic = () => (
    <div>
      <Section title="4-0. 설계 원칙 — Stage 2 자산 최대 재활용 + Stage 3 판단 레이어 추가 (2단계: 물성 적합성 검증)">
        <InfoBox color="teal">
          Stage 3 대체 원료 추천 AI는 Stage 2에서 개발·인수된 자산을 입력 재료로 그대로 활용하고, 그 위에 정확도를 높이는 판단 레이어를 단계적으로 추가하는 구조입니다. Stage 2를 재개발하지 않으며, Stage 3 신규 개발 범위는 ① SHAP 기반 물성 영향도 자동 갱신, ② 원료 임베딩 기반 후보 탐색 고도화, ③ GNN 교호작용 예측 + 협업 필터링 순위화로 한정합니다.
        </InfoBox>
        <Table
          headers={["Stage 2 산출물", "Stage 3 활용 방식", "Stage 3 추가 개발"]}
          rows={[
            ["물성 예측 AI (pH·점도 정방향)", "2단계 시뮬레이션 직접 호출 — 재개발 없음", "SHAP 추출 배치 파이프라인 → ③ 자동 갱신"],
            ["룰 DB (§2.8.1)", "3단계 교호작용 베이스라인으로 그대로 사용", "GNN 학습 edge data로 변환·활용"],
            ["Elasticsearch Vector Search", "1단계 원료 임베딩 코사인 검색 인프라 재활용", "⑧ 원료 임베딩 피처 스키마 설계 추가"],
            ["처방-원료 이력 (⑤)", "3단계 협업 필터링 신호 재활용", "⑦ 예측 결과 로그 축적 → GNN 재학습 루프"],
            ["유사처방 검색 엔진", "후보 원료 실사용 이력 참조 근거로 재활용", "재활용 그대로 — 추가 개발 없음"],
          ]}
        />
      </Section>

      <Section title="4-1. 추천 로직 순서 (단계별 DB·모델 활용)">
        <InfoBox color="blue">
          각 단계의 데이터 소스를 Stage 2 재활용 / Stage 3 신규 개발로 구분하여 표시합니다.
        </InfoBox>
        {[
          {
            step: "STEP 1-A", tag: "Stage 2 재활용", tagColor: "teal",
            title: "기능군 후보 탐색 + 금지 성분 제외",
            desc: "② 원료-기능 매핑에서 function_category 기준 동일 기능군 전체 추출 (is_primary = Y 우선). ① 원료 마스터 is_restricted = Y 자동 필터 — 100% 차단.",
            badges: [{ t: "② 기능 매핑", c: "teal" }, { t: "① 원료 마스터", c: "blue" }],
          },
          {
            step: "STEP 1-B", tag: "Stage 3 신규", tagColor: "purple",
            title: "원료 임베딩 코사인 유사도 병합 (후보 풀 품질 향상)",
            desc: "⑧ 원료 임베딩 레지스트리의 dense_vector를 Elasticsearch에서 코사인 검색. 기능군 분류에는 포함되지 않더라도 원료의 특성(기능, 물성 영향, 사용 이력)을 수치화한 벡터 간 유사도를 계산해 비슷한 특성의 원료를 추가 편입. 피처 스키마: function + property_direction + history_success_rate 종합.",
            badges: [{ t: "⑧ 임베딩 레지스트리", c: "purple" }, { t: "Elasticsearch", c: "gray" }],
          },
          {
            step: "STEP 2-A", tag: "Stage 2 재활용 → Stage 3 강화", tagColor: "amber",
            title: "사전 제거 필터",
            desc: "후보 원료가 처방에 투입됐을 때 목표 pH·점도 범위에서 크게 벗어날 것이 이미 알려진 원료를 AI 시뮬레이션(2C) 전에 미리 제거. 예를 들어 목표 점도 범위를 크게 초과하는 것으로 알려진 점증제, 또는 목표 pH와 방향이 정반대인 원료가 여기서 걸러짐. Stage 3가 진행될수록 SHAP 기반 ③ 테이블 갱신으로 판단 기준이 정교해져 2C 호출 건수가 줄어듦.",
            badges: [{ t: "초기: 룰 DB (권장·주의 성분)", c: "amber" }, { t: "이후: ③ 물성 영향도 기반", c: "amber" }],
          },
          {
            step: "STEP 2-B", tag: "Stage 3 신규 — 오프라인 배치 (실시간 아님)", tagColor: "purple",
            title: "물성 방향성 분석 (SHAP 기반 ③ 자동 갱신) — 모델 재학습 시 실행",
            desc: "추천 요청마다 실행되는 것이 아닌 물성 예측 AI 재학습 시 자동 트리거되는 오프라인 배치 프로세스. SHAP value 배치 추출 → 부호(effect_direction: 상승/하강/중립) · 절대값(effect_magnitude: 강/중/약) 파싱 → ③ 물성 영향도 테이블 자동 갱신. 갱신된 ③ 테이블을 실시간 2A 사전 제거 필터가 참조하는 구조. MLflow 모델 버전과 1:1 연동해 재현성 확보.",
            badges: [{ t: "오프라인 배치", c: "purple" }, { t: "③ 물성 영향도 갱신", c: "amber" }, { t: "2A 사전 필터 참조", c: "amber" }, { t: "MLflow 버전 연동", c: "gray" }],
          },
          {
            step: "STEP 2-C", tag: "Stage 2 재활용", tagColor: "teal",
            title: "물성 예측 시뮬레이션 (정방향 모델 직접 호출)",
            desc: "교체 후 처방 조성으로 pH·점도 정방향 예측 모델 호출 (APIM → AKS). pH 오차 ≤ 0.5, 점도 MAPE ≤ 5% 기준 필터. 경계값 구간(pH 0.3~0.5, 점도 3~5%)은 경고 태그 부착 후 통과.",
            badges: [{ t: "물성 예측 AI", c: "blue" }, { t: "인수기준서 §2 준용", c: "gray" }],
          },
          {
            step: "STEP 3-A", tag: "Stage 2 재활용", tagColor: "teal",
            title: "교호작용 검증 베이스라인 (룰셋)",
            desc: "④ 교호작용 룰 테이블에서 처방 전성분 × 후보 원료 쌍(pair) 길항 관계 확인. Stage 2에서 구축된 known interaction 전체 적용. False Positive 억제 우선.",
            badges: [{ t: "④ 교호작용 룰", c: "coral" }],
          },
          {
            step: "STEP 3-B", tag: "Stage 3 신규", tagColor: "purple",
            title: "GNN 교호작용 예측 (Unknown Interaction 커버)",
            desc: "⑥ 처방 그래프 스냅샷 기반으로 GNN 학습. 룰셋이 정의하지 못한 unknown interaction을 예측해 추가 차단. 룰셋이 베이스라인이고 GNN이 보완하는 구조 — GNN이 룰셋을 대체하지 않음.",
            badges: [{ t: "GNN", c: "purple" }, { t: "⑥ 처방 그래프", c: "purple" }],
          },
          {
            step: "STEP 3-C", tag: "Stage 3 신규", tagColor: "purple",
            title: "협업 필터링 신호 + 최종 순위 산출",
            desc: "⑤ 처방-원료 이력의 '유사 처방 맥락에서 A 대신 B 교체 시 적합률' 패턴을 협업 필터링 신호로 활용. 유사처방 검색 엔진(Stage 2 Elasticsearch)의 결과를 신뢰도 보정 입력으로 재활용. 교호작용 적합도(w₁) + 물성 안전도(w₂) + 이력 신뢰도(w₃) 가중 합산 → 상위 5~10건 출력.",
            badges: [{ t: "⑤ 처방 이력", c: "green" }, { t: "협업 필터링", c: "teal" }, { t: "Score 순 정렬", c: "blue" }],
          },
        ].map((s, i, arr) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < arr.length - 1 ? 4 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 500, color: "var(--color-text-secondary)" }}>{i + 1}</div>
              {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--color-border-tertiary)", minHeight: 24 }} />}
            </div>
            <div style={{ background: "var(--color-background-primary)", border: `1px solid var(--color-border-tertiary)`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, flex: 1, borderLeft: s.tagColor === "purple" ? "3px solid #7F77DD" : "3px solid #1D9E75" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: "var(--color-text-secondary)" }}>{s.step}</span>
                {badge(s.tag, s.tagColor)}
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 6 }}>{s.desc}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {s.badges.map((b, bi) => <span key={bi}>{badge(b.t, b.c)}</span>)}
              </div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="4-2. SHAP 기반 물성 방향성 분석 및 자동 갱신 파이프라인">
        <InfoBox color="amber">
          Stage 3의 핵심 정확도 향상 포인트입니다. 물성 예측 AI 인수 완료(MAPE ≤ 5%, R² ≥ 0.90)를 선행 조건으로 하며, 그 이전에는 룰 DB (권장·주의 성분) 기반 사전 필터(2A)를 사용합니다. SHAP 갱신 이후에는 2A의 데이터 소스가 ③ 테이블로 전환되어 필터 정밀도가 지속 향상됩니다.
        </InfoBox>
        <Table
          headers={["단계", "처리 내용", "출력", "비고"]}
          rows={[
            ["트리거", "MLflow 모델 신규 버전 등록 시 배치 자동 실행", "갱신 작업 큐 생성", "모델 재학습 시마다 실행"],
            ["SHAP 추출", "전체 학습 데이터 대상 SHAP value 배치 계산", "원료별 pH·점도 기여도 벡터", "TreeExplainer / KernelExplainer"],
            ["방향성 파싱", "SHAP value 부호 → effect_direction (상승/하강/중립) 변환. 절대값 크기 → effect_magnitude (강/중/약) 분류", "③ 테이블 갱신 레코드", "중립 임계값 착수 보고 시 정의"],
            ["버전 연동", "갱신된 ③ 레코드에 model_version, updated_at 기록. 이전 버전 레코드 보존 (soft delete)", "버전 이력 관리", "MLflow run_id와 매핑"],
            ["검증", "갱신 전후 방향성 일치율 비교 리포트 생성. 현업 코멘트와 SHAP 결과 불일치 항목 플래그", "검증 리포트", "PMO 검토 후 적용 확정"],
          ]}
        />
        <InfoBox color="purple">
          SHAP 갱신 주기가 달라지면 방향성 필터 결과도 달라집니다. ③ 테이블은 반드시 MLflow 모델 버전과 1:1 매핑하여 관리하고, 추천 결과의 재현성을 위해 추천 시점의 model_version을 ⑦ 예측 결과 로그에 함께 기록합니다.
        </InfoBox>
      </Section>

      <Section title="4-3. GNN 교호작용 예측 — 룰셋 보완 구조">
        <Table
          headers={["구분", "룰셋 (Stage 2 재활용)", "GNN (Stage 3 신규)", "역할 분담"]}
          rows={[
            ["커버 범위", "현업이 정의한 known interaction", "처방 이력에서 학습한 unknown interaction", "GNN이 룰셋을 대체하지 않고 보완"],
            ["False Positive", "낮음 (명시적 정의)", "있을 수 있음 (확률적 예측)", "룰셋 결과를 우선 적용, GNN은 추가 차단"],
            ["학습 데이터", "해당 없음 (규칙 기반)", "⑥ 처방 그래프 스냅샷 + ④ 교호작용 룰 edge", "Stage 2 룰이 GNN 초기 학습 신호"],
            ["재학습 트리거", "현업 룰 업데이트 시 수동 반영", "⑦ 예측 결과 로그 누적 → 분기별 자동 재학습", "verified_result 축적이 핵심"],
            ["신뢰도 표시", "규칙 매칭 여부 (Y/N)", "confidence_score (0~1)", "UI에서 구분 표시"],
          ]}
        />
      </Section>

      <Section title="4-4. 최종 점수 산출 공식 (착수 보고 시 가중치 확정)">
        <div style={{ background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 8, padding: "14px 18px", fontFamily: "monospace", fontSize: 13, lineHeight: 2, marginBottom: 12 }}>
          <div style={{ color: "var(--color-text-primary)" }}>Score(후보 원료 x) =</div>
          <div style={{ paddingLeft: 16, color: "var(--color-text-secondary)" }}>  w₁ × 교호작용_적합도(x)   ← 룰셋 매칭 + GNN confidence 결합</div>
          <div style={{ paddingLeft: 16, color: "var(--color-text-secondary)" }}>+ w₂ × 물성_적합도(x)       ← 예측 pH·점도의 목표범위 내 위치 정규화</div>
          <div style={{ paddingLeft: 16, color: "var(--color-text-secondary)" }}>+ w₃ × 이력_신뢰도(x)      ← 가산형: 기존 조합 적합 이력은 가산, 신규 조합은 중립(감점 없음·UNKNOWN 경고)</div>
        </div>
        <Table
          headers={["가중치", "구성 요소", "산출 방법", "Stage 2 대비 변화"]}
          rows={[
            ["w₁", "교호작용 적합도", "룰셋 이진 결과(1/0) × α + GNN confidence × (1-α)", "Stage 2: 룰셋 단독 → Stage 3: GNN 병합"],
            ["w₂", "물성 안전도", "예측 pH·점도의 목표범위 내 위치 정규화 점수 (SHAP 갱신 후 필터 정확도 향상)", "Stage 2 모델 직접 재활용, 필터 정밀도 향상"],
            ["w₃", "이력 신뢰도", "⑤ 처방 이력 적합률 × 사용 빈도 + 협업 필터링 유사처방 신호", "Stage 2: 단순 이력 집계 → Stage 3: 협업 필터링 추가"],
            ["-", "w₁+w₂+w₃ = 1.0", "정규화. α(룰셋·GNN 혼합 비율)는 별도 파라미터로 관리", "착수 보고 시 FPL 제출·승인 후 고정"],
          ]}
        />
        <InfoBox color="amber">
          ⚠ PMO 주의: 가중치(w₁·w₂·w₃) 및 α(룰셋·GNN 혼합 비율)는 FPL이 착수 보고 시 명세화하여 제출하고 한국콜마 승인을 득한 후 개발에 적용합니다. GNN 도입 이후 α 조정 시에도 동일한 승인 절차를 적용합니다.
        </InfoBox>
      </Section>

      <Section title="4-5. 물성 예측 AI 연동 명세 (Stage 2 직접 재활용)">
        <InfoBox color="amber">
          스킨케어1팀 물성 예측 AI는 처방 전성분 조성 전체를 입력으로 받아 pH·점도를 예측하는 정방향 회귀 모델입니다. 후보 원료 교체 시 입력 벡터 전체가 새로운 처방 조성으로 교체되므로, 후보 건수만큼 모델을 호출해야 합니다. 병렬 배치 호출 설계가 응답 시간 목표(15초) 달성의 핵심 조건입니다.
        </InfoBox>
        <Table
          headers={["항목", "내용", "Stage 3 변경 여부"]}
          rows={[
            ["모델 유형", "정방향 예측 회귀 모델 (처방 전성분 조성 → pH, 점도)", "변경 없음 — Stage 2 인수 모델 그대로"],
            ["입력", "전성분 코드 + 함량(%) 배열 전체 — 후보 원료 교체 시 입력 벡터 전체가 새로 구성됨", "변경 없음"],
            ["출력", "예측 pH 값, 예측 점도 (cps, Log10 내부 연산 후 역변환)", "변경 없음"],
            ["pH 기준", "모델 예측 오차 범위: pH ±0.5 (인수기준서 §2-3 신뢰 전제 — 통과/탈락 판정 기준 아님)", "변경 없음"],
            ["점도 기준", "모델 예측 오차 범위: 점도 MAPE ≤ 5% (PIN×RPM 조합별, 인수기준서 §2-2 신뢰 전제)", "변경 없음"],
            ["경계값 처리", "목표 범위 근접 후보: '실험 검증 권장' 경고 태그 부착 후 통과", "변경 없음"],
            ["호출 방식", "APIM → AKS (MLflow 서빙 엔드포인트), 후보 건수만큼 병렬 배치 호출 — AKS 복수 Pod 구성 필수", "Stage 3 병렬 호출 설계 추가"],
            ["캐시 전략", "동일 처방 조성에 대한 예측 결과는 캐싱 재사용 가능. 단 조성이 조금이라도 다르면 캐시 히트 불가 — 절감 효과 제한적. 병렬 호출이 실질적 병목 해소 수단", "Stage 3 신규 검토"],
            ["SHAP 추출", "Stage 3 한정: 배치 작업으로 SHAP value 추출 → ③ 물성 영향도 테이블 자동 갱신 (추천 요청 응답 시간과 무관한 별도 배치)", "Stage 3 신규 추가"],
          ]}
        />
      </Section>
    </div>
  );

  const renderAPI = () => (
    <div>
      <Section title="5-1. 대체 원료 추천 API">
        <div style={{ background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {badge("POST", "teal")}
            <code style={{ fontSize: 13, color: "var(--color-text-primary)" }}>/api/v1/ingredient/alternative</code>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>현재 처방과 교체 대상 원료를 입력받아 대체 원료 후보 목록을 반환합니다.</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Request Body</div>
        <div style={{ background: "#1e1e2e", borderRadius: 8, padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#cdd6f4", marginBottom: 16, overflowX: "auto" }}>
{`{
  "target_ingredient_id": "ING-0001",   // 교체 대상 원료 ID
  "formulation": [
    { "ingredient_id": "ING-0002", "concentration_pct": 5.0 },
    { "ingredient_id": "ING-0003", "concentration_pct": 2.0 }
  ],
  "target_ph_range": { "min": 5.0, "max": 7.0 },
  "target_viscosity_range": { "min": 5000, "max": 30000 },
  "top_k": 5,
  "include_warning": true
}`}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Response</div>
        <div style={{ background: "#1e1e2e", borderRadius: 8, padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#cdd6f4", marginBottom: 16, overflowX: "auto" }}>
{`{
  "request_id": "REQ-20261001-0042",
  "candidates": [
    {
      "rank": 1,
      "ingredient_id": "ING-0055",
      "inci_name": "Betaine",
      "score": 0.91,
      "predicted_ph": 6.3,
      "predicted_viscosity_cps": 12400,
      "interaction_result": "적합",
      "history_success_rate": 0.87,
      "warning": null
    },
    {
      "rank": 2,
      "ingredient_id": "ING-0072",
      "inci_name": "Panthenol",
      "score": 0.78,
      "predicted_ph": 6.8,
      "predicted_viscosity_cps": 9800,
      "interaction_result": "적합",
      "history_success_rate": 0.74,
      "warning": "경계값 근처: 실험 검증 권장"
    }
  ],
  "model_version": {
    "property_model": "prop-v2.1",
    "interaction_model": "ruleset-v1.0"
  }
}`}
        </div>
      </Section>

      <Section title="5-2. 원료 임베딩 유사도 검색 API">
        <div style={{ background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {badge("GET", "blue")}
            <code style={{ fontSize: 13, color: "var(--color-text-primary)" }}>/api/v1/ingredient/similar?id={"{ingredient_id}"}&top_k=10</code>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Elasticsearch dense_vector 기반 원료 임베딩 코사인 유사도 검색. 대체 후보 탐색 초기 단계에서 활용.</div>
        </div>
      </Section>

      <Section title="5-3. 교호작용 조회 API">
        <div style={{ background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {badge("POST", "amber")}
            <code style={{ fontSize: 13, color: "var(--color-text-primary)" }}>/api/v1/interaction/check</code>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>성분 쌍(pair) 단위 교호작용 룰 조회. 처방 내 모든 성분과 후보 원료의 교호작용을 일괄 조회.</div>
        </div>
      </Section>

      <Section title="5-4. 인프라 연동 구조">
        <Table
          headers={["레이어", "컴포넌트", "역할"]}
          rows={[
            ["API Gateway", "Azure APIM", "요청 라우팅, 인증, Rate Limit"],
            ["추론 서버", "AKS (MLflow 서빙)", "물성 예측 AI, GNN 교호작용 모델 서빙"],
            ["벡터 검색", "Elasticsearch (dense_vector)", "원료 임베딩 코사인 유사도 검색"],
            ["정형 DB", "MSSQL / Fabric Lakehouse", "원료 마스터, 교호작용 룰, 처방 이력 등"],
            ["캐시", "Redis", "자주 조회되는 원료 임베딩 결과 캐싱"],
            ["모델 관리", "MLflow", "모델 버전 관리, 실험 로그, 배포 파이프라인"],
          ]}
        />
      </Section>
    </div>
  );

  const renderKPI = () => (
    <div>
      <InfoBox color="blue">
        대체 원료 추천 AI의 인수 기준은 스킨케어1팀 인수기준서를 준용하되, 추천 기능 특화 KPI를 추가 적용합니다. 교호작용 예측 AI(GNN)의 도메인 특화 성능 지표는 ⑨ GNN 모델 성능 추적 테이블로 별도 관리합니다.
      </InfoBox>

      <Section title="6-1. 기능 요건 (인수 판정 전 필수 충족)">
        <Table
          headers={["요건", "기준", "판정 방식", "참조"]}
          rows={[
            ["금지 성분 차단", "금지/제한 성분 포함 후보 출력 0건 (100% 차단)", "위반 후보 1건이라도 출력 시 결함", "요구사항정의서 §2.8.2"],
            ["NULL 조건 처리", "미입력 조건은 전체 조건으로 간주, 오류 없이 수행", "검색 오류 발생 시 결함", "요구사항정의서 §2.2.8 준용"],
            ["순위 정렬 방향", "Score 기준 내림차순 정렬 100% 준수", "순위 역전 오류 시 결함", "인수기준서 §3-1 준용"],
            ["최소 출력 건수", "조건 충족 후보 존재 시 1건 이상 출력", "결과 0건 또는 오류 시 결함", "-"],
          ]}
        />
      </Section>

      <Section title="6-2. 주 판정 지표 (필수 충족)">
        <Table
          headers={["지표", "인수 기준", "비고"]}
          rows={[
            ["추천 성공률 (Top-3 Hit Rate)", "Top-3 후보 중 연구원이 실제 선택한 원료 포함 비율 ≥ 70%", "연구원 샘플 검증. 기준값 착수 보고 시 확정"],
            ["물성 적합 기준", "예측 pH·점도값이 연구원 설정 목표 물성 범위 내에 있는지 판정. 모델 예측 오차 범위(pH ±0.5, 점도 MAPE ≤ 5%)는 판정 전제 조건으로 신뢰 기준임", "착수 보고 시 FPL 제출·승인"],
            ["병렬 배치 호출", "후보 원료마다 처방 전성분을 새로 구성해 모델에 입력하는 구조. 순차 호출 시 응답 시간 초과 위험이 있으므로 AKS 복수 Pod 병렬 배치 호출 설계 필수. 동일 처방 조성에 대한 결과는 캐싱 재사용 가능하나 조성이 조금이라도 다르면 캐시 히트 불가 — 절감 효과 제한적", "착수 보고 시 FPL 병렬 처리 아키텍처 설계안 제출 요구"],
            ["교호작용 오탐률", "룰셋 기반 교호작용 False Positive ≤ 10%", "Stage 2 기준. Stage 3 GNN 적용 후 재평가"],
            ["응답 시간", "3단계 파이프라인 전체 ≤ 15초", "물성 AI 호출 포함 기준"],
          ]}
        />
      </Section>

      <Section title="6-3. GNN 교호작용 모델 KPI (Stage 3 전용)">
        <Table
          headers={["지표", "기준", "비고"]}
          rows={[
            ["교호작용 분류 F1 Score", "≥ 0.80", "⑨ GNN 성능 추적 테이블 기록"],
            ["정밀도 (Precision)", "≥ 0.83", "길항 관계 오탐 최소화"],
            ["재현율 (Recall)", "≥ 0.78", "미검출 길항 관계 최소화"],
            ["GNN 추가 발견율", "룰셋 대비 ≥ 15% 추가 교호작용 식별", "unknown interaction 커버리지"],
            ["신규 교호작용 발견 건수", "분기별 보고", "재학습 트리거 판단 지표"],
          ]}
        />
      </Section>

      <Section title="6-4. Stage 2 품질 체크포인트">
        <InfoBox color="amber">
          <strong>⚠ 중요:</strong> Stage 3 대체 원료 추천 AI의 품질은 Stage 2 원료-Function DB 커버리지에 강하게 의존합니다. Stage 2 완료 시점에 아래 항목을 별도 체크포인트로 검증하여야 합니다.
        </InfoBox>
        <Table
          headers={["체크 항목", "기준", "미달 시 처리"]}
          rows={[
            ["원료-Function DB 커버리지", "스킨케어 처방에 사용되는 원료 대비 ≥ 90% 매핑 완료", "Stage 3 착수 전 보강 의무"],
            ["교호작용 룰 데이터 밀도", "주요 성분 쌍 대비 룰 보유율 정의 필요 (착수 보고 시 기준 확정)", "GNN 초기 성능에 직접 영향"],
            ["임베딩 벡터 품질", "동일 기능군 원료 간 코사인 유사도 ≥ 0.7 (평균)", "임베딩 모델 재학습"],
          ]}
        />
      </Section>
    </div>
  );

  const renderStage = () => (
    <div>
      <Section title="7-1. Stage별 기능 범위">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { stage: "Stage 2", period: "2026.07 ~ 2026.12", color: "blue", items: [
              "원료-Function DB 구축 (전략소재개발팀)",
              "INCI-multi function mapping 표준화",
              "금지 성분 DB 구성",
              "교호작용 룰 DB 구축 (룰셋 기반)",
              "물성 예측 AI 개발 (pH, 점도 정방향)",
              "유사처방 검색 엔진 (Vector Search)",
              "원료 영향도 제공 기능 (§2.4.1)",
            ]},
            { stage: "Stage 3", period: "2027.01 ~ (예정)", color: "purple", items: [
              "대체 원료 추천 AI 전체 파이프라인",
              "GNN 교호작용 예측 모델",
              "원료 임베딩 벡터 레지스트리",
              "처방 그래프 스냅샷 구축",
              "이력 기반 신뢰도 보정 로직",
              "추천 결과 UI/UX 개발",
              "SHAP 피드백 루프 (물성 영향도 자동 갱신)",
            ]},
          ].map((s, i) => {
            const map = { blue: "#E6F1FB", purple: "#EEEDFE" };
            const tc = { blue: "#0C447C", purple: "#3C3489" };
            return (
              <div key={i} style={{ background: "var(--color-background-primary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: map[s.color], padding: "10px 14px", borderBottom: "1px solid var(--color-border-tertiary)" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: tc[s.color] }}>{s.stage}</div>
                  <div style={{ fontSize: 11, color: tc[s.color], opacity: 0.75 }}>{s.period}</div>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  {s.items.map((item, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: tc[s.color], flexShrink: 0, marginTop: 5 }} />
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="7-2. WBS 주요 마일스톤 (대체 원료 추천 AI 관련)">
        <Table
          headers={["단계", "Task", "담당", "기간", "산출물"]}
          rows={[
            ["Stage 2 선행", "원료-Function DB 구축", "전략소재개발팀", "2026.02~05", "원료-Function DB"],
            ["Stage 2 선행", "INCI multi-function mapping", "스킨케어1팀 + FPL", "2026.06~06", "매핑 표준 테이블"],
            ["Stage 2 선행", "교호작용 룰 DB 구축", "FPL", "2026.07~10", "룰 DB (④ 테이블)"],
            ["Stage 2 선행", "물성 예측 AI 개발", "FPL", "2026.10~11", "pH/점도 모델"],
            ["Stage 2 체크포인트", "원료-Function DB 품질 검증", "한국콜마 + FPL", "2026.12", "품질 검증 보고서"],
            ["Stage 3", "대체 원료 추천 파이프라인 설계", "FPL", "2027.01", "설계 명세서"],
            ["Stage 3", "GNN 모델 개발 및 학습", "FPL", "2027.01~02", "GNN 모델 (gnn-v1.0)"],
            ["Stage 3", "추천 UI 개발 및 연동", "FPL", "2027.02~03", "서비스 배포"],
          ]}
        />
      </Section>

      <Section title="7-3. 리스크 및 경감 방안">
        <Table
          headers={["리스크", "영향", "경감 방안", "담당"]}
          rows={[
            ["원료-Function DB 커버리지 부족", "추천 후보 탐색 공간 협소 → 추천 품질 저하", "Stage 2 완료 시점 체크포인트 설정 + 보강 의무화", "전략소재개발팀"],
            ["교호작용 룰 데이터 밀도 부족", "GNN 초기 학습 품질 저하", "Stage 2 룰 구축 시 GNN 학습 가능 형태 스키마 사전 설계", "FPL"],
            ["물성 예측 AI 정확도 미달", "물성 필터링 오탐 → 추천 신뢰도 저하", "인수기준서 §4 판정 절차 통과 후 연동", "FPL"],
            ["Stage 3 착수 시 역방향 모델 범위 혼입", "WBS·KPI 명세 오류 (반복 확인된 오류 패턴)", "검토 시 Stage 분류 우선 확인", "PMO"],
          ]}
        />
      </Section>
    </div>
  );

  const renderContent = () => {
    switch (tab) {
      case "overview": return renderOverview();
      case "process": return renderProcess();
      case "db": return renderDB();
      case "logic": return renderLogic();
      case "api": return renderAPI();
      case "kpi": return renderKPI();
      case "stage": return renderStage();
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", maxWidth: "100%", padding: "0 0 24px" }}>
      <div style={{ padding: "16px 0 12px", borderBottom: "1px solid var(--color-border-tertiary)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18, fontWeight: 500 }}>대체 원료 추천 AI — 개발 문서</span>
          {badge("스킨케어1팀", "blue")}
          {badge("Stage 3", "purple")}
          {badge("Project AI Lab", "teal")}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>참조: SoW §2 · 요구사항정의서 §2.4·§2.7·§2.8 · 인수기준서 | 수행사: 핑거포인트랩 (FPL)</div>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 24, borderBottom: "1px solid var(--color-border-tertiary)", paddingBottom: 12 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "6px 12px", fontSize: 12, fontWeight: tab === t.id ? 500 : 400,
              background: tab === t.id ? "var(--color-background-secondary)" : "transparent",
              border: tab === t.id ? "1px solid var(--color-border-secondary)" : "1px solid transparent",
              borderRadius: 6, cursor: "pointer", color: tab === t.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>{renderContent()}</div>
    </div>
  );
}