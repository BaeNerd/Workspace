import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceArea, ResponsiveContainer, Area, ComposedChart } from "recharts";

const p1 = [2.371274664,2.390792766,2.406713196,2.3879917,2.39036652,2.404062345,2.400365274,2.426947993,2.416425611,2.438580071,2.418936943,2.407699671,2.404084775,2.396911284,2.43558295,2.427878144,2.408987077,2.404078315,2.414920052,2.410996465,2.426658924,2.39944059,2.40009484,2.372020284,2.361436176,2.33149214,2.307661422,2.30779831,2.268275637,2.246409223,2.224540588,2.189359732,2.149354268,2.103894377,2.062972872,2.012822381,1.95736626,1.902350176,1.841750141,1.77357986,1.704655702,1.636192411,1.570574985,1.506925605,1.444332975,1.383149302,1.329688353,1.280139401,1.23488317,1.193264181,1.15459074,1.120399202,1.092614449,1.067460551,1.044194235,1.024040813,1.008207013,0.993506481,0.979829316,0.968610077,0.959323536,0.951140487,0.943464063,0.937415506,0.931192972,0.925423419,0.921631028,0.916826459,0.91195372,0.906713405,0.901195461,0.895072846,0.88939698,0.879855316,0.869732132,0.85885173,0.845352067,0.829669159,0.810505592,0.785953999,0.757197313,0.725312131,0.69268152,0.655772618,0.614177842,0.571399688,0.532455122,0.496899157,0.465213816,0.438099584,0.414643814,0.396668647,0.38126639,0.367248405,0.35559961,0.346092249,0.337578604,0.329507064,0.322445152,0.315814837,0.30981481,0.304972863,0.300662154,0.295470643,0.291587226,0.288562927,0.284830042,0.281297915,0.278868098,0.276154005,0.27424198,0.271502821,0.269004332,0.267283744,0.265569046,0.263723349,0.261921226,0.26046308,0.258314984,0.256893253,0.255700002,0.254663134,0.252479794,0.25104608,0.249672143,0.24823925,0.247197955,0.245130315,0.243731191,0.243115005,0.240957499,0.239961811,0.239449994,0.237235699,0.235502049,0.235791718,0.234620452,0.23185668,0.231228114,0.229827527,0.228625361,0.22712282,0.224858805,0.224114565,0.224000232,0.221713912,0.219381048,0.218934622,0.217506527,0.215976014,0.215170617,0.213790047,0.21237188,0.210994434,0.209417995,0.207869191,0.20669152,0.206114428,0.205133797,0.20350459,0.202146052];

const p2 = [2.450821633,2.474814148,2.485924041,2.458004309,2.455897282,2.449997491,2.480653293,2.49818623,2.50112411,2.487577294,2.463401876,2.4535066,2.468994397,2.448629811,2.487869057,2.475145665,2.477392475,2.448828818,2.462310818,2.471330977,2.464073672,2.457949583,2.453331961,2.426941263,2.430055619,2.387405019,2.378842409,2.362838377,2.325477739,2.306274453,2.263574077,2.23471486,2.201163563,2.148542769,2.10484424,2.051811367,1.995647238,1.935441581,1.873910785,1.800964643,1.733241338,1.66346726,1.595187521,1.531923181,1.466073767,1.405201745,1.350211867,1.298318079,1.252720001,1.209331485,1.170243413,1.135523684,1.10617938,1.081878464,1.056185181,1.036638337,1.01933969,1.004944167,0.990948132,0.97856463,0.969259228,0.960711822,0.95276368,0.946240135,0.940379188,0.93471174,0.929721523,0.925589262,0.919956312,0.914629501,0.908420229,0.902080224,0.896109078,0.885758116,0.874834936,0.863420626,0.848751934,0.832377037,0.812104622,0.786846147,0.757203154,0.723718484,0.690018361,0.651860545,0.609164204,0.565525316,0.525387918,0.489208587,0.456731631,0.428973817,0.404967369,0.386600025,0.37079793,0.356542445,0.344553571,0.334672813,0.325976554,0.317536106,0.310304622,0.303480455,0.297218649,0.292232697,0.287635592,0.282392897,0.278292292,0.275012787,0.271243174,0.267518208,0.264929922,0.262095258,0.260008817,0.257349073,0.254565523,0.252430936,0.250827656,0.248694444,0.246813832,0.24546841,0.243303442,0.241769298,0.240292909,0.238988233,0.236777422,0.23551151,0.234062015,0.232269721,0.231034973,0.229089293,0.227628685,0.22687222,0.224735832,0.223507817,0.222955467,0.220796636,0.218988335,0.219198961,0.21788995,0.215356651,0.214540078,0.212886201,0.211797287,0.210274637,0.208203934,0.207105505,0.207012459,0.205191609,0.202629248,0.201951546,0.200425982,0.199119598,0.19825148,0.196498921,0.19535696,0.19404559,0.192428157,0.190842724,0.1895991,0.188934105,0.188080246,0.186458972,0.185328504];

const p3 = [2.282091928,2.286135116,2.295564223,2.302715503,2.282030641,2.261120215,2.30458989,2.326998216,2.331776781,2.33098568,2.312270265,2.283979293,2.308890293,2.294302206,2.321888732,2.304607216,2.309481801,2.295025551,2.302204838,2.307308035,2.297719906,2.293728747,2.281570456,2.278392888,2.251936208,2.222459,2.206309426,2.184889519,2.158097223,2.133732254,2.096662877,2.066667003,2.023698462,1.97964242,1.932095136,1.883066235,1.825822234,1.767826614,1.70658937,1.637537989,1.570009647,1.502614837,1.43671577,1.373973748,1.312189299,1.253517355,1.200575793,1.152599456,1.109154143,1.06891092,1.032566014,0.999327585,0.972991434,0.949985752,0.927369474,0.908859652,0.893643447,0.880437443,0.868284222,0.857797552,0.848977741,0.841587457,0.83530416,0.829232599,0.824470343,0.819401963,0.81544532,0.811349042,0.807337423,0.802766999,0.797124662,0.791492921,0.786273177,0.777715953,0.768570078,0.757468866,0.74505862,0.730240214,0.712163416,0.689685379,0.663006158,0.632997239,0.602457637,0.569069595,0.531196115,0.492729401,0.45755389,0.425607478,0.397501827,0.373619507,0.35282156,0.336869739,0.323586816,0.311529288,0.301029568,0.292518599,0.285308309,0.278417336,0.271787755,0.266112167,0.260720885,0.255929214,0.252484551,0.248182695,0.244254211,0.241178846,0.238359309,0.235162745,0.232535263,0.229951928,0.227867286,0.225876209,0.223638353,0.221075531,0.219565197,0.21807881,0.216409067,0.215157842,0.213366145,0.211673314,0.20998259,0.209129356,0.207521704,0.206152969,0.204524677,0.202858536,0.201674857,0.200043195,0.198421654,0.197772884,0.196369872,0.194875545,0.194581995,0.193176723,0.190577991,0.190829789,0.19099175,0.188792326,0.187148579,0.185578941,0.184405238,0.183337523,0.181166595,0.179857755,0.180038964,0.179533184,0.176924937,0.175388948,0.174670049,0.172674574,0.172089079,0.171070624,0.170354349,0.168973103,0.167017549,0.165196114,0.164288776,0.164103664,0.163965389,0.162461511,0.160890116];

export default function App() {
  const [view, setView] = useState("spectrum");

  const data = useMemo(() => {
    return p1.map((_, i) => {
      const wl = 290 + i;
      const vals = [p1[i], p2[i], p3[i]];
      const mean = vals.reduce((a,b) => a+b, 0) / 3;
      const sd = Math.sqrt(vals.reduce((a,b) => a + (b-mean)**2, 0) / 2);
      const cv = (sd / mean) * 100;
      const ci95 = 1.96 * sd / Math.sqrt(3);
      return {
        wl,
        mean: +mean.toFixed(4),
        upper: +(mean + sd).toFixed(4),
        lower: +(mean - sd).toFixed(4),
        sd: +sd.toFixed(4),
        cv: +cv.toFixed(2),
        ci95: +ci95.toFixed(4),
        zone: wl <= 320 ? "UVB" : wl <= 400 ? "UVA" : "Vis"
      };
    });
  }, []);

  const ticks = [290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 410, 420, 430, 440, 450];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <p style={{ fontWeight: 500, margin: "0 0 6px", color: "var(--color-text-primary)" }}>{label}nm ({d?.zone})</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: "2px 0", color: p.color || "var(--color-text-secondary)" }}>
            {p.name}: {typeof p.value === "number" ? p.value.toFixed(4) : p.value}
          </p>
        ))}
      </div>
    );
  };

  const uvbAvgCV = +(data.filter(d => d.wl <= 320).reduce((a,b) => a+b.cv, 0) / data.filter(d => d.wl <= 320).length).toFixed(1);
  const uvaAvgCV = +(data.filter(d => d.wl > 320 && d.wl <= 400).reduce((a,b) => a+b.cv, 0) / data.filter(d => d.wl > 320 && d.wl <= 400).length).toFixed(1);
  const visAvgCV = +(data.filter(d => d.wl > 400).reduce((a,b) => a+b.cv, 0) / data.filter(d => d.wl > 400).length).toFixed(1);

  return (
    <div style={{ padding: "4px 0 16px", fontFamily: "var(--font-sans)" }}>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["spectrum","흡광도 스펙트럼 + CI 밴드"],["cv","파장별 CV% (상대 불확실성)"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "6px 14px", fontSize: 13, borderRadius: 8,
            border: view === v ? "2px solid var(--color-border-info)" : "0.5px solid var(--color-border-secondary)",
            background: view === v ? "var(--color-background-info)" : "transparent",
            color: view === v ? "var(--color-text-info)" : "var(--color-text-secondary)",
            cursor: "pointer", fontWeight: view === v ? 500 : 400
          }}>{label}</button>
        ))}
      </div>

      {view === "spectrum" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "UVB 구간 평균 SD", val: (data.filter(d=>d.wl<=320).reduce((a,b)=>a+b.sd,0)/31).toFixed(4), sub: "290~320nm", color: "var(--color-background-danger)" },
              { label: "UVA 구간 평균 SD", val: (data.filter(d=>d.wl>320&&d.wl<=400).reduce((a,b)=>a+b.sd,0)/80).toFixed(4), sub: "321~400nm", color: "var(--color-background-warning)" },
              { label: "Vis 구간 평균 SD", val: (data.filter(d=>d.wl>400).reduce((a,b)=>a+b.sd,0)/50).toFixed(4), sub: "401~450nm", color: "var(--color-background-success)" },
            ].map(({ label, val, sub, color }) => (
              <div key={label} style={{ background: color, borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 2px", color: "var(--color-text-primary)" }}>{val}</p>
                <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" strokeWidth={0.5} />
              <XAxis dataKey="wl" ticks={ticks} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} label={{ value: "Wavelength (nm)", position: "insideBottom", offset: -2, fontSize: 11, fill: "var(--color-text-secondary)" }} height={36} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} label={{ value: "Absorbance", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--color-text-secondary)" }} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceArea x1={290} x2={320} fill="#E24B4A" fillOpacity={0.06} label={{ value: "UVB", position: "insideTop", fontSize: 10, fill: "#A32D2D" }} />
              <ReferenceArea x1={320} x2={400} fill="#BA7517" fillOpacity={0.05} label={{ value: "UVA", position: "insideTop", fontSize: 10, fill: "#854F0B" }} />
              <ReferenceArea x1={400} x2={450} fill="#639922" fillOpacity={0.05} label={{ value: "Vis", position: "insideTop", fontSize: 10, fill: "#3B6D11" }} />
              <ReferenceLine x={320} stroke="var(--color-border-secondary)" strokeDasharray="4 2" strokeWidth={1} />
              <ReferenceLine x={400} stroke="var(--color-border-secondary)" strokeDasharray="4 2" strokeWidth={1} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="#378ADD" fillOpacity={0.15} name="상한 (mean+SD)" dot={false} />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#fff" fillOpacity={1} name="하한 (mean-SD)" dot={false} />
              <Line type="monotone" dataKey="mean" stroke="#185FA5" strokeWidth={1.5} dot={false} name="평균 흡광도" />
              <Line type="monotone" dataKey="upper" stroke="#378ADD" strokeWidth={0.8} strokeDasharray="3 2" dot={false} name="mean + SD" />
              <Line type="monotone" dataKey="lower" stroke="#378ADD" strokeWidth={0.8} strokeDasharray="3 2" dot={false} name="mean - SD" />
            </ComposedChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center", margin: "6px 0 0" }}>
            음영: ±1 SD 밴드 (플레이트 3개 기준) — 절대 SD는 UVB에서 크고 Vis에서 작음
          </p>
        </>
      )}

      {view === "cv" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "UVB 평균 CV", val: uvbAvgCV + "%", sub: "낮은 상대 불확실성", color: "var(--color-background-success)" },
              { label: "UVA 평균 CV", val: uvaAvgCV + "%", sub: "중간 상대 불확실성", color: "var(--color-background-warning)" },
              { label: "Vis 평균 CV", val: visAvgCV + "%", sub: "높은 상대 불확실성", color: "var(--color-background-danger)" },
            ].map(({ label, val, sub, color }) => (
              <div key={label} style={{ background: color, borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 2px", color: "var(--color-text-primary)" }}>{val}</p>
                <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" strokeWidth={0.5} />
              <XAxis dataKey="wl" ticks={ticks} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} label={{ value: "Wavelength (nm)", position: "insideBottom", offset: -2, fontSize: 11, fill: "var(--color-text-secondary)" }} height={36} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} label={{ value: "CV (%)", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--color-text-secondary)" }} width={44} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceArea x1={290} x2={320} fill="#1D9E75" fillOpacity={0.08} />
              <ReferenceArea x1={320} x2={400} fill="#BA7517" fillOpacity={0.06} />
              <ReferenceArea x1={400} x2={450} fill="#E24B4A" fillOpacity={0.06} />
              <ReferenceLine x={320} stroke="var(--color-border-secondary)" strokeDasharray="4 2" strokeWidth={1} />
              <ReferenceLine x={400} stroke="var(--color-border-secondary)" strokeDasharray="4 2" strokeWidth={1} />
              <Line type="monotone" dataKey="cv" stroke="#D85A30" strokeWidth={1.5} dot={false} name="CV (%)" />
            </ComposedChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center", margin: "6px 0 0" }}>
            CV(상대 불확실성)는 파장이 길어질수록 증가 — ML 모델의 CI도 동일 패턴을 따름
          </p>
        </>
      )}

      <div style={{ marginTop: 16, background: "var(--color-background-secondary)", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>해석:</strong> 절대 SD는 UVB(고흡광)에서 크고 Vis(저흡광)에서 작습니다.
        그러나 CV(상대 불확실성)는 반대로 장파장으로 갈수록 증가합니다.
        ML 모델의 파장별 CI도 이 패턴을 따르며, SPF 수식은 UVB 구간을 더 강하게 반영하므로
        최종 SPF CI는 <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>UVB 구간의 절대 SD에 가장 크게 영향</strong>을 받습니다.
      </div>
    </div>
  );
}
