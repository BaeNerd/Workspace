import { useState, useMemo } from "react";
import {
  ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Legend,
} from "recharts";

const p1 = [2.371274664,2.390792766,2.406713196,2.3879917,2.39036652,2.404062345,2.400365274,2.426947993,2.416425611,2.438580071,2.418936943,2.407699671,2.404084775,2.396911284,2.43558295,2.427878144,2.408987077,2.404078315,2.414920052,2.410996465,2.426658924,2.39944059,2.40009484,2.372020284,2.361436176,2.33149214,2.307661422,2.30779831,2.268275637,2.246409223,2.224540588,2.189359732,2.149354268,2.103894377,2.062972872,2.012822381,1.95736626,1.902350176,1.841750141,1.77357986,1.704655702,1.636192411,1.570574985,1.506925605,1.444332975,1.383149302,1.329688353,1.280139401,1.23488317,1.193264181,1.15459074,1.120399202,1.092614449,1.067460551,1.044194235,1.024040813,1.008207013,0.993506481,0.979829316,0.968610077,0.959323536,0.951140487,0.943464063,0.937415506,0.931192972,0.925423419,0.921631028,0.916826459,0.91195372,0.906713405,0.901195461,0.895072846,0.88939698,0.879855316,0.869732132,0.85885173,0.845352067,0.829669159,0.810505592,0.785953999,0.757197313,0.725312131,0.69268152,0.655772618,0.614177842,0.571399688,0.532455122,0.496899157,0.465213816,0.438099584,0.414643814,0.396668647,0.38126639,0.367248405,0.35559961,0.346092249,0.337578604,0.329507064,0.322445152,0.315814837,0.30981481,0.304972863,0.300662154,0.295470643,0.291587226,0.288562927,0.284830042,0.281297915,0.278868098,0.276154005,0.27424198,0.271502821,0.269004332,0.267283744,0.265569046,0.263723349,0.261921226,0.26046308,0.258314984,0.256893253,0.255700002,0.254663134,0.252479794,0.25104608,0.249672143,0.24823925,0.247197955,0.245130315,0.243731191,0.243115005,0.240957499,0.239961811,0.239449994,0.237235699,0.235502049,0.235791718,0.234620452,0.23185668,0.231228114,0.229827527,0.228625361,0.22712282,0.224858805,0.224114565,0.224000232,0.221713912,0.219381048,0.218934622,0.217506527,0.215976014,0.215170617,0.213790047,0.21237188,0.210994434,0.209417995,0.207869191,0.20669152,0.206114428,0.205133797,0.20350459,0.202146052];
const p2 = [2.450821633,2.474814148,2.485924041,2.458004309,2.455897282,2.449997491,2.480653293,2.49818623,2.50112411,2.487577294,2.463401876,2.4535066,2.468994397,2.448629811,2.487869057,2.475145665,2.477392475,2.448828818,2.462310818,2.471330977,2.464073672,2.457949583,2.453331961,2.426941263,2.430055619,2.387405019,2.378842409,2.362838377,2.325477739,2.306274453,2.263574077,2.23471486,2.201163563,2.148542769,2.10484424,2.051811367,1.995647238,1.935441581,1.873910785,1.800964643,1.733241338,1.66346726,1.595187521,1.531923181,1.466073767,1.405201745,1.350211867,1.298318079,1.252720001,1.209331485,1.170243413,1.135523684,1.10617938,1.081878464,1.056185181,1.036638337,1.01933969,1.004944167,0.990948132,0.97856463,0.969259228,0.960711822,0.95276368,0.946240135,0.940379188,0.93471174,0.929721523,0.925589262,0.919956312,0.914629501,0.908420229,0.902080224,0.896109078,0.885758116,0.874834936,0.863420626,0.848751934,0.832377037,0.812104622,0.786846147,0.757203154,0.723718484,0.690018361,0.651860545,0.609164204,0.565525316,0.525387918,0.489208587,0.456731631,0.428973817,0.404967369,0.386600025,0.37079793,0.356542445,0.344553571,0.334672813,0.325976554,0.317536106,0.310304622,0.303480455,0.297218649,0.292232697,0.287635592,0.282392897,0.278292292,0.275012787,0.271243174,0.267518208,0.264929922,0.262095258,0.260008817,0.257349073,0.254565523,0.252430936,0.250827656,0.248694444,0.246813832,0.24546841,0.243303442,0.241769298,0.240292909,0.238988233,0.236777422,0.23551151,0.234062015,0.232269721,0.231034973,0.229089293,0.227628685,0.22687222,0.224735832,0.223507817,0.222955467,0.220796636,0.218988335,0.219198961,0.21788995,0.215356651,0.214540078,0.212886201,0.211797287,0.210274637,0.208203934,0.207105505,0.207012459,0.205191609,0.202629248,0.201951546,0.200425982,0.199119598,0.19825148,0.196498921,0.19535696,0.19404559,0.192428157,0.190842724,0.1895991,0.188934105,0.188080246,0.186458972,0.185328504];
const p3 = [2.282091928,2.286135116,2.295564223,2.302715503,2.282030641,2.261120215,2.30458989,2.326998216,2.331776781,2.33098568,2.312270265,2.283979293,2.308890293,2.294302206,2.321888732,2.304607216,2.309481801,2.295025551,2.302204838,2.307308035,2.297719906,2.293728747,2.281570456,2.278392888,2.251936208,2.222459,2.206309426,2.184889519,2.158097223,2.133732254,2.096662877,2.066667003,2.023698462,1.97964242,1.932095136,1.883066235,1.825822234,1.767826614,1.70658937,1.637537989,1.570009647,1.502614837,1.43671577,1.373973748,1.312189299,1.253517355,1.200575793,1.152599456,1.109154143,1.06891092,1.032566014,0.999327585,0.972991434,0.949985752,0.927369474,0.908859652,0.893643447,0.880437443,0.868284222,0.857797552,0.848977741,0.841587457,0.83530416,0.829232599,0.824470343,0.819401963,0.81544532,0.811349042,0.807337423,0.802766999,0.797124662,0.791492921,0.786273177,0.777715953,0.768570078,0.757468866,0.74505862,0.730240214,0.712163416,0.689685379,0.663006158,0.632997239,0.602457637,0.569069595,0.531196115,0.492729401,0.45755389,0.425607478,0.397501827,0.373619507,0.35282156,0.336869739,0.323586816,0.311529288,0.301029568,0.292518599,0.285308309,0.278417336,0.271787755,0.266112167,0.260720885,0.255929214,0.252484551,0.248182695,0.244254211,0.241178846,0.238359309,0.235162745,0.232535263,0.229951928,0.227867286,0.225876209,0.223638353,0.221075531,0.219565197,0.21807881,0.216409067,0.215157842,0.213366145,0.211673314,0.20998259,0.209129356,0.207521704,0.206152969,0.204524677,0.202858536,0.201674857,0.200043195,0.198421654,0.197772884,0.196369872,0.194875545,0.194581995,0.193176723,0.190577991,0.190829789,0.19099175,0.188792326,0.187148579,0.185578941,0.184405238,0.183337523,0.181166595,0.179857755,0.180038964,0.179533184,0.176924937,0.175388948,0.174670049,0.172674574,0.172089079,0.171070624,0.170354349,0.168973103,0.167017549,0.165196114,0.164288776,0.164103664,0.163965389,0.162461511,0.160890116];

/* ── 섹션2: 산포도·추이·결론 ───────────────────────── */
const rawData = [
  {wl:290,mean:2.371,sd:0.087},{wl:295,mean:2.404,sd:0.071},{wl:300,mean:2.419,sd:0.077},
  {wl:305,mean:2.428,sd:0.071},{wl:310,mean:2.427,sd:0.065},{wl:315,mean:2.331,sd:0.073},
  {wl:320,mean:2.225,sd:0.078},{wl:325,mean:2.012,sd:0.089},{wl:330,mean:1.704,sd:0.073},
  {wl:335,mean:1.383,sd:0.056},{wl:340,mean:1.155,sd:0.053},{wl:345,mean:1.024,sd:0.060},
  {wl:350,mean:0.959,sd:0.049},{wl:360,mean:0.901,sd:0.044},{wl:370,mean:0.757,sd:0.044},
  {wl:380,mean:0.415,sd:0.025},{wl:390,mean:0.310,sd:0.018},{wl:400,mean:0.274,sd:0.014},
  {wl:410,mean:0.256,sd:0.013},{wl:420,mean:0.241,sd:0.012},{wl:430,mean:0.229,sd:0.011},
  {wl:440,mean:0.215,sd:0.010},{wl:450,mean:0.202,sd:0.010},
].map(d => ({
  ...d,
  cv: parseFloat(((d.sd/d.mean)*100).toFixed(2)),
  zone: d.wl<=320?"UVB":d.wl<=400?"UVA":"Vis"
}));

const zoneColor = {UVB:"#E24B4A", UVA:"#BA7517", Vis:"#534AB7"};

const CustomDot = (props) => {
  const {cx,cy,payload} = props;
  return <circle cx={cx} cy={cy} r={4} fill={zoneColor[payload.zone]} fillOpacity={0.8} stroke="none"/>;
};

const ScatterTooltip = ({active,payload}) => {
  if(!active||!payload?.length) return null;
  const d = payload[0]?.payload;
  if(!d) return null;
  return (
    <div style={{background:"#ffffff",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 12px",fontSize:12}}>
      <p style={{fontWeight:500,margin:"0 0 4px",color:"#111827"}}>{d.wl}nm ({d.zone})</p>
      <p style={{margin:"2px 0",color:"#6b7280"}}>흡광도: {d.mean}</p>
      <p style={{margin:"2px 0",color:"#6b7280"}}>SD: {d.sd}</p>
      <p style={{margin:"2px 0",color:zoneColor[d.zone]}}>CV: {d.cv}%</p>
    </div>
  );
};

/* ── 교육 섹션 상수 ─────────────────────────────────────────── */
const bgTabs = ["SPF 수식", "CV (변동계수)", "그래프 읽는 법"];

const bgData290to320 = [
  {wl:290,abs:2.37},{wl:292,abs:2.41},{wl:294,abs:2.39},{wl:296,abs:2.40},
  {wl:298,abs:2.42},{wl:300,abs:2.42},{wl:302,abs:2.40},{wl:304,abs:2.44},
  {wl:306,abs:2.41},{wl:308,abs:2.41},{wl:310,abs:2.43},{wl:312,abs:2.40},
  {wl:314,abs:2.36},{wl:316,abs:2.32},{wl:318,abs:2.28},{wl:320,abs:2.22}
];
const bgData320to400 = [
  {wl:320,abs:2.22},{wl:325,abs:2.01},{wl:330,abs:1.70},{wl:335,abs:1.38},
  {wl:340,abs:1.15},{wl:345,abs:1.02},{wl:350,abs:0.96},{wl:360,abs:0.90},
  {wl:370,abs:0.76},{wl:380,abs:0.41},{wl:390,abs:0.31},{wl:400,abs:0.27}
];
const allBgData = [...bgData290to320, ...bgData320to400.slice(1)];

const svgW = 600, svgH = 220, svgPL = 48, svgPR = 16, svgPT = 20, svgPB = 36;
const svgWMin = 290, svgWMax = 450, svgAMax = 2.8;
const toSvgX = wl => svgPL + (wl - svgWMin) / (svgWMax - svgWMin) * (svgW - svgPL - svgPR);
const toSvgY = a  => svgPT + (1 - a / svgAMax) * (svgH - svgPT - svgPB);
const svgPoly = allBgData.map(d => `${toSvgX(d.wl).toFixed(1)},${toSvgY(d.abs).toFixed(1)}`).join(" ");
const svgUvbX = toSvgX(290), svgUvbW = toSvgX(320) - toSvgX(290);
const svgUvaX = toSvgX(320), svgUvaW = toSvgX(400) - toSvgX(320);
const svgWlTicks = [290,300,310,320,330,340,350,360,370,380,390,400,410,420,430,440,450];
const svgAbsYTicks = [0, 0.5, 1.0, 1.5, 2.0, 2.5];

export default function App() {
  const [view, setView] = useState("spectrum");
  const [containerWidth, setContainerWidth] = useState(800);
  const [bgTab, setBgTab] = useState(0);
  const [showSolar, setShowSolar] = useState(true);

  const data = useMemo(() => {
    return p1.map((_, i) => {
      const wl = 290 + i;
      const vals = [p1[i], p2[i], p3[i]];
      const mean = vals.reduce((a, b) => a + b, 0) / 3;
      const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / 2);
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
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <p style={{ fontWeight: 500, margin: "0 0 6px", color: "#111827" }}>{label}nm ({d?.zone})</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: "2px 0", color: p.color || "#6b7280" }}>
            {p.name}: {typeof p.value === "number" ? p.value.toFixed(4) : p.value}
          </p>
        ))}
      </div>
    );
  };

  const uvbAvgCV = +(data.filter(d => d.wl <= 320).reduce((a, b) => a + b.cv, 0) / data.filter(d => d.wl <= 320).length).toFixed(1);
  const uvaAvgCV = +(data.filter(d => d.wl > 320 && d.wl <= 400).reduce((a, b) => a + b.cv, 0) / data.filter(d => d.wl > 320 && d.wl <= 400).length).toFixed(1);
  const visAvgCV = +(data.filter(d => d.wl > 400).reduce((a, b) => a + b.cv, 0) / data.filter(d => d.wl > 400).length).toFixed(1);

  /* SD 밴드 SVG 음영을 직접 그리기 위한 path 생성 */
  const chartH = 400;
  const marginL = 52, marginR = 16, marginT = 8, marginB = 50;
  const innerW = containerWidth - marginL - marginR;
  const innerH = chartH - marginT - marginB;
  const xMin = 290, xMax = 450;
  const yMin = 0, yMax = 2.6;
  const toX = wl => marginL + ((wl - xMin) / (xMax - xMin)) * innerW;
  const toY = v => marginT + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const upperPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(d.wl).toFixed(1)},${toY(d.upper).toFixed(1)}`).join(" ");
  const lowerPathReverse = [...data].reverse().map(d => `L${toX(d.wl).toFixed(1)},${toY(d.lower).toFixed(1)}`).join(" ");
  const bandPath = `${upperPath} ${lowerPathReverse} Z`;

  return (
    <div style={{ padding: "16px", fontFamily: "sans-serif" }}>

      {/* ── 분석 섹션 ─────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          ["spectrum", "흡광도 스펙트럼 + CI 밴드"],
          ["cv", "파장별 CV% (상대 불확실성)"],
          ["scatter", "흡광도 vs SD/CV 산포도"],
          ["line", "파장별 변화 추이"],
          ["insight", "분석 결론"],
        ].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "6px 14px", fontSize: 13, borderRadius: 8,
            border: view === v ? "2px solid #3b82f6" : "1px solid #e5e7eb",
            background: view === v ? "#dbeafe" : "transparent",
            color: view === v ? "#1d4ed8" : "#6b7280",
            cursor: "pointer", fontWeight: view === v ? 500 : 400
          }}>{label}</button>
        ))}
      </div>

      {view === "spectrum" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "UVB 구간 평균 SD", val: (data.filter(d => d.wl <= 320).reduce((a, b) => a + b.sd, 0) / 31).toFixed(4), sub: "290~320nm", color: "#fee2e2" },
              { label: "UVA 구간 평균 SD", val: (data.filter(d => d.wl > 320 && d.wl <= 400).reduce((a, b) => a + b.sd, 0) / 80).toFixed(4), sub: "321~400nm", color: "#fef3c7" },
              { label: "Vis 구간 평균 SD", val: (data.filter(d => d.wl > 400).reduce((a, b) => a + b.sd, 0) / 50).toFixed(4), sub: "401~450nm", color: "#d1fae5" },
            ].map(({ label, val, sub, color }) => (
              <div key={label} style={{ background: color, borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 2px", color: "#111827" }}>{val}</p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>

          <div style={{ position: "relative", width: "100%", height: chartH }}>
            <svg width={containerWidth} height={chartH} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
              <clipPath id="chartClip">
                <rect x={marginL} y={marginT} width={innerW} height={innerH} />
              </clipPath>
              <path d={bandPath} fill="#378ADD" fillOpacity={0.15} stroke="none" clipPath="url(#chartClip)" />
            </svg>

            <ResponsiveContainer width="100%" height={chartH} onResize={(w) => setContainerWidth(w)}>
            <ComposedChart data={data} margin={{ top: marginT, right: marginR, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeWidth={0.5} />
              <XAxis dataKey="wl" ticks={ticks} tick={{ fontSize: 11, fill: "#6b7280" }} label={{ value: "Wavelength (nm)", position: "insideBottom", offset: 10, fontSize: 11, fill: "#6b7280" }} height={marginB} />
              <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: "#6b7280" }} label={{ value: "Absorbance", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b7280" }} width={marginL} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceArea x1={290} x2={320} fill="#E24B4A" fillOpacity={0.06} label={{ value: "UVB", position: "insideTop", fontSize: 10, fill: "#A32D2D" }} />
              <ReferenceArea x1={320} x2={400} fill="#BA7517" fillOpacity={0.05} label={{ value: "UVA", position: "insideTop", fontSize: 10, fill: "#854F0B" }} />
              <ReferenceArea x1={400} x2={450} fill="#639922" fillOpacity={0.05} label={{ value: "Vis", position: "insideTop", fontSize: 10, fill: "#3B6D11" }} />
              <ReferenceLine x={320} stroke="#e5e7eb" strokeDasharray="4 2" strokeWidth={1} />
              <ReferenceLine x={400} stroke="#e5e7eb" strokeDasharray="4 2" strokeWidth={1} />
              <Line type="monotone" dataKey="upper" stroke="#378ADD" strokeWidth={0.8} strokeDasharray="3 2" dot={false} name="mean + SD" />
              <Line type="monotone" dataKey="lower" stroke="#378ADD" strokeWidth={0.8} strokeDasharray="3 2" dot={false} name="mean - SD" />
              <Line type="monotone" dataKey="mean" stroke="#185FA5" strokeWidth={1.5} dot={false} name="평균 흡광도" />
            </ComposedChart>
            </ResponsiveContainer>
          </div>

          <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", margin: "6px 0 0" }}>
            음영: ±1 SD 밴드 (플레이트 3개 기준) — 절대 SD는 UVB에서 크고 Vis에서 작음
          </p>
        </>
      )}

      {view === "cv" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "UVB 평균 CV", val: uvbAvgCV + "%", sub: "낮은 상대 불확실성", color: "#d1fae5" },
              { label: "UVA 평균 CV", val: uvaAvgCV + "%", sub: "중간 상대 불확실성", color: "#fef3c7" },
              { label: "Vis 평균 CV", val: visAvgCV + "%", sub: "높은 상대 불확실성", color: "#fee2e2" },
            ].map(({ label, val, sub, color }) => (
              <div key={label} style={{ background: color, borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 2px", color: "#111827" }}>{val}</p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={chartH}>
            <ComposedChart data={data} margin={{ top: marginT, right: marginR, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeWidth={0.5} />
              <XAxis dataKey="wl" ticks={ticks} tick={{ fontSize: 11, fill: "#6b7280" }} label={{ value: "Wavelength (nm)", position: "insideBottom", offset: 10, fontSize: 11, fill: "#6b7280" }} height={marginB} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} label={{ value: "CV (%)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b7280" }} width={marginL} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceArea x1={290} x2={320} fill="#1D9E75" fillOpacity={0.08} />
              <ReferenceArea x1={320} x2={400} fill="#BA7517" fillOpacity={0.06} />
              <ReferenceArea x1={400} x2={450} fill="#E24B4A" fillOpacity={0.06} />
              <ReferenceLine x={320} stroke="#e5e7eb" strokeDasharray="4 2" strokeWidth={1} />
              <ReferenceLine x={400} stroke="#e5e7eb" strokeDasharray="4 2" strokeWidth={1} />
              <Line type="monotone" dataKey="cv" stroke="#D85A30" strokeWidth={1.5} dot={false} name="CV (%)" />
            </ComposedChart>
          </ResponsiveContainer>

          <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", margin: "6px 0 0" }}>
            CV(상대 불확실성)는 파장이 길어질수록 증가 — ML 모델의 CI도 동일 패턴을 따름
          </p>
        </>
      )}

      {(view === "spectrum" || view === "cv") && (
        <div style={{ marginTop: 16, background: "#f3f4f6", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
          <strong style={{ color: "#111827", fontWeight: 500 }}>해석:</strong> 절대 SD는 UVB(고흡광)에서 크고 Vis(저흡광)에서 작습니다.
          그러나 CV(상대 불확실성)는 반대로 장파장으로 갈수록 증가합니다.
          ML 모델의 파장별 CI도 이 패턴을 따르며, SPF 수식은 UVB 구간을 더 강하게 반영하므로
          최종 SPF CI는 <strong style={{ color: "#111827", fontWeight: 500 }}>UVB 구간의 절대 SD에 가장 크게 영향</strong>을 받습니다.
        </div>
      )}

      {view === "scatter" && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:"#f9fafb",borderRadius:12,padding:"12px 16px"}}>
              <p style={{fontSize:12,fontWeight:500,color:"#111827",margin:"0 0 4px"}}>흡광도 ↔ SD</p>
              <p style={{fontSize:11,color:"#6b7280",margin:"0 0 10px"}}>양의 상관 — 흡광도 높을수록 SD 큼</p>
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart margin={{top:8,right:8,bottom:8,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeWidth={0.5}/>
                  <XAxis dataKey="mean" name="흡광도" tick={{fontSize:10,fill:"#9ca3af"}} label={{value:"흡광도",position:"insideBottom",offset:10,fontSize:10,fill:"#9ca3af"}} height={28}/>
                  <YAxis dataKey="sd" name="SD" tick={{fontSize:10,fill:"#9ca3af"}} width={36}/>
                  <Tooltip content={<ScatterTooltip/>}/>
                  <Scatter data={rawData} shape={<CustomDot/>}/>
                </ScatterChart>
              </ResponsiveContainer>
              <p style={{fontSize:11,color:"#059669",margin:"6px 0 0",textAlign:"center"}}>↑ 비례 관계 확인 (비례 오차 구간)</p>
            </div>
            <div style={{background:"#f9fafb",borderRadius:12,padding:"12px 16px"}}>
              <p style={{fontSize:12,fontWeight:500,color:"#111827",margin:"0 0 4px"}}>흡광도 ↔ CV</p>
              <p style={{fontSize:11,color:"#6b7280",margin:"0 0 10px"}}>역의 상관 — 흡광도 낮을수록 CV 커짐</p>
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart margin={{top:8,right:8,bottom:8,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeWidth={0.5}/>
                  <XAxis dataKey="mean" name="흡광도" tick={{fontSize:10,fill:"#9ca3af"}} label={{value:"흡광도",position:"insideBottom",offset:10,fontSize:10,fill:"#9ca3af"}} height={28}/>
                  <YAxis dataKey="cv" name="CV(%)" tick={{fontSize:10,fill:"#9ca3af"}} width={36}/>
                  <Tooltip content={<ScatterTooltip/>}/>
                  <Scatter data={rawData} shape={<CustomDot/>}/>
                </ScatterChart>
              </ResponsiveContainer>
              <p style={{fontSize:11,color:"#dc2626",margin:"6px 0 0",textAlign:"center"}}>↑ 역 관계 확인 (측정 노이즈 바닥 효과)</p>
            </div>
          </div>
          <div style={{display:"flex",gap:12,marginTop:12,fontSize:12}}>
            {Object.entries(zoneColor).map(([z,c])=>(
              <div key={z} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:c}}/>
                <span style={{color:"#6b7280"}}>{z} 구간</span>
              </div>
            ))}
          </div>
        </>
      )}

      {view === "line" && (
        <div style={{background:"#f9fafb",borderRadius:12,padding:"12px 16px"}}>
          <p style={{fontSize:12,fontWeight:500,color:"#111827",margin:"0 0 10px"}}>파장별 흡광도 / SD / CV 동시 비교</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rawData} margin={{top:8,right:48,bottom:8,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeWidth={0.5}/>
              <XAxis dataKey="wl" tick={{fontSize:10,fill:"#9ca3af"}} label={{value:"파장(nm)",position:"insideBottom",offset:10,fontSize:10,fill:"#9ca3af"}} height={28}/>
              <YAxis yAxisId="abs" tick={{fontSize:10,fill:"#9ca3af"}} domain={[0,2.8]} label={{value:"흡광도/SD",angle:-90,position:"insideLeft",fontSize:10,fill:"#9ca3af"}} width={40}/>
              <YAxis yAxisId="cv" orientation="right" tick={{fontSize:10,fill:"#9ca3af"}} label={{value:"CV(%)",angle:90,position:"insideRight",fontSize:10,fill:"#9ca3af"}} width={40}/>
              <Tooltip content={<ScatterTooltip/>}/>
              <ReferenceLine yAxisId="abs" x={320} stroke="#e5e7eb" strokeDasharray="4 2"/>
              <ReferenceLine yAxisId="abs" x={400} stroke="#e5e7eb" strokeDasharray="4 2"/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Line yAxisId="abs" type="monotone" dataKey="mean" stroke="#185FA5" strokeWidth={2} dot={false} name="흡광도"/>
              <Line yAxisId="abs" type="monotone" dataKey="sd" stroke="#1D9E75" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="SD"/>
              <Line yAxisId="cv" type="monotone" dataKey="cv" stroke="#D85A30" strokeWidth={1.5} dot={false} strokeDasharray="2 2" name="CV(%)"/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:12}}>
            {[
              {label:"흡광도 & SD",desc:"함께 감소 → 비례 관계",bg:"#dbeafe"},
              {label:"흡광도 & CV",desc:"반대 방향 → 역 관계",bg:"#fee2e2"},
              {label:"SD & CV",desc:"장파장 분리 → 노이즈 바닥 존재",bg:"#fef3c7"},
            ].map(({label,desc,bg})=>(
              <div key={label} style={{background:bg,borderRadius:8,padding:"8px 12px"}}>
                <p style={{fontSize:11,fontWeight:500,color:"#111827",margin:"0 0 3px"}}>{label}</p>
                <p style={{fontSize:11,color:"#6b7280",margin:0}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "insight" && (
        <div>
          <div style={{background:"#f9fafb",borderRadius:12,padding:"16px 20px",marginBottom:12}}>
            <p style={{fontSize:13,fontWeight:500,color:"#111827",margin:"0 0 12px"}}>두 가지 오차 체계가 혼재한다</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {title:"비례 오차 구간 (UVB, 고흡광)",bg:"#dbeafe",tc:"#1d4ed8",
                  pts:["SD ∝ 흡광도 (함께 증감)","CV ≈ 일정 (1.5~2%)","도포 균일도 오차가 지배","흡광도가 클수록 균일도 오차도 커짐"]},
                {title:"고정 노이즈 구간 (Vis, 저흡광)",bg:"#fee2e2",tc:"#dc2626",
                  pts:["SD ≈ 일정 (0.010~0.015)","CV 급증 (3~5%)","장비 기저 노이즈가 지배","신호가 작아도 노이즈는 고정"]},
              ].map(({title,bg,tc,pts})=>(
                <div key={title} style={{background:bg,borderRadius:10,padding:"12px 14px"}}>
                  <p style={{fontSize:12,fontWeight:500,color:tc,margin:"0 0 8px"}}>{title}</p>
                  {pts.map((p,i)=><p key={i} style={{fontSize:11,color:"#6b7280",margin:"2px 0",lineHeight:1.5}}>• {p}</p>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"#f9fafb",borderRadius:12,padding:"16px 20px",marginBottom:12}}>
            <p style={{fontSize:13,fontWeight:500,color:"#111827",margin:"0 0 10px"}}>ML 모델 설계에 미치는 영향</p>
            <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:"1px solid #e5e7eb"}}>
                  {["문제","발생 구간","영향","대응"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"4px 8px",fontWeight:500,color:"#6b7280"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {issue:"이분산성",zone:"전 구간",effect:"MSE 손실함수가 고흡광 구간 오차에 과도 집중",fix:"파장별 가중 손실함수 적용 권장"},
                  {issue:"CV 불균형",zone:"Vis 구간",effect:"CV가 높아 상대 오차가 크지만 SPF 기여는 낮음",fix:"SPF 수식 가중치 반영 시 실질 영향 낮음"},
                  {issue:"CI 전파 왜곡",zone:"Vis 구간",effect:"절대 SD는 작지만 CV는 커서 CI 폭 산출 오류 가능",fix:"파장별 잔차 SD로 전파 (측정 SD 혼용 주의)"},
                ].map(row=>(
                  <tr key={row.issue} style={{borderBottom:"1px solid #f3f4f6"}}>
                    <td style={{padding:"5px 8px",fontWeight:500,fontSize:11}}>{row.issue}</td>
                    <td style={{padding:"5px 8px",fontSize:11}}>{row.zone}</td>
                    <td style={{padding:"5px 8px",fontSize:11,color:"#6b7280"}}>{row.effect}</td>
                    <td style={{padding:"5px 8px",fontSize:11,color:"#059669"}}>{row.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 배경 지식 섹션 ─────────────────────────────────── */}
      <div style={{ marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>📖 배경 지식</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {bgTabs.map((t, i) => (
            <button key={i} onClick={() => setBgTab(i)} style={{
              padding: "6px 14px", fontSize: 13, borderRadius: 8, cursor: "pointer",
              fontWeight: bgTab === i ? 500 : 400,
              border: bgTab === i ? "2px solid #3b82f6" : "1px solid #e5e7eb",
              background: bgTab === i ? "#dbeafe" : "transparent",
              color: bgTab === i ? "#1d4ed8" : "#6b7280"
            }}>{t}</button>
          ))}
        </div>

        {bgTab === 0 && (
          <div>
            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", margin: "0 0 10px" }}>COLIPA 2011 In-vitro SPF 수식</p>
              <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", fontFamily: "monospace", fontSize: 13, color: "#111827", lineHeight: 2.2 }}>
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>SPF = </span>
                  <span style={{ borderTop: "1.5px solid #111827", paddingTop: 4, marginLeft: 4 }}>
                    Σ [E(λ) × I(λ) × Δλ]
                  </span>
                  <span style={{ display: "block", fontSize: 12, color: "#6b7280", marginTop: -4, paddingLeft: 60 }}>
                    Σ [E(λ) × I(λ) × 10<sup>-A(λ)</sup> × Δλ]
                  </span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                {[
                  {sym:"E(λ)", bg:"#fee2e2", tc:"#dc2626", desc:"홍반 유발 작용 스펙트럼 (고정 테이블)"},
                  {sym:"I(λ)", bg:"#dbeafe", tc:"#1d4ed8", desc:"태양광 스펙트럼 강도 (2011 기준, 고정)"},
                  {sym:"A(λ)", bg:"#d1fae5", tc:"#059669", desc:"파장별 흡광도 → ML 모델 예측값"},
                  {sym:"Δλ",   bg:"#f9fafb", tc:"#6b7280", desc:"파장 간격 (nm 단위, 보통 1nm)"},
                ].map(({sym,bg,tc,desc}) => (
                  <div key={sym} style={{ background: bg, borderRadius: 8, padding: "8px 12px" }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: tc, margin: "0 0 3px" }}>{sym}</p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", margin: "0 0 10px" }}>A(λ)가 SPF에 미치는 영향</p>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280", lineHeight: 2 }}>
                <p style={{ margin: 0 }}>A(λ) 높을수록 → 10<sup>-A(λ)</sup> 작아짐 → 자외선 투과 적음 → <span style={{ color: "#059669", fontWeight: 500 }}>SPF 높아짐</span></p>
                <p style={{ margin: 0 }}>A(λ) = 0 (차단 없음) → 10<sup>0</sup> = 1 → 자외선 100% 투과</p>
                <p style={{ margin: 0 }}>A(λ) = 2.0 (높은 차단) → 10<sup>-2</sup> = 0.01 → 자외선 1% 투과</p>
              </div>
            </div>

            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", margin: "0 0 10px" }}>C Coefficient란?</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 8px", lineHeight: 1.7 }}>
                플레이트 제조 균일도 지표. 이론적으로 필름 위에 자외선 차단제가 완벽하게 균일하게 도포되었을 때 기대되는 흡광도와 실제 측정값이 얼마나 일치하는지를 나타냅니다.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  {val:"C = 1.0",    label:"완벽한 균일 도포", bg:"#d1fae5", tc:"#059669"},
                  {val:"C = 0.8~0.9",label:"허용 가능 범위",   bg:"#fef3c7", tc:"#92400e"},
                  {val:"C < 0.8",    label:"플레이트 제외",     bg:"#fee2e2", tc:"#dc2626"},
                ].map(({val,label,bg,tc}) => (
                  <div key={val} style={{ background: bg, borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: tc, margin: "0 0 3px" }}>{val}</p>
                    <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {bgTab === 1 && (
          <div>
            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", margin: "0 0 10px" }}>CV (변동계수, Coefficient of Variation)</p>
              <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", textAlign: "center", marginBottom: 12 }}>
                <p style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 500, margin: 0 }}>
                  CV (%) = (SD / Mean) × 100
                </p>
              </div>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.7 }}>
                측정값이 평균 대비 얼마나 퍼져 있는지를 <strong style={{ fontWeight: 500, color: "#111827" }}>상대적 비율</strong>로 표현합니다. 절대 SD는 흡광도가 큰 구간에서 크게 나오지만, CV는 낮은 흡광도 구간(장파장)에서 오히려 높게 나옵니다.
              </p>
            </div>

            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", margin: "0 0 12px" }}>실제 데이터 예시 (Plate 1 기준)</p>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    {["구간","파장","평균 흡광도","SD","CV (%)","의미"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500, color: "#6b7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {zone:"UVB", wl:"310nm", mean:"2.43", sd:"0.037", cv:"1.5%", meaning:"안정적",       bg:"#d1fae5"},
                    {zone:"UVA", wl:"360nm", mean:"0.90", sd:"0.018", cv:"2.0%", meaning:"보통",         bg:"#fef3c7"},
                    {zone:"Vis", wl:"420nm", mean:"0.24", sd:"0.007", cv:"2.9%", meaning:"상대적 불안정", bg:"#fee2e2"},
                  ].map(row => (
                    <tr key={row.wl} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "5px 8px" }}>{row.zone}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "monospace" }}>{row.wl}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "monospace" }}>{row.mean}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "monospace" }}>{row.sd}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "monospace", fontWeight: 500 }}>{row.cv}</td>
                      <td style={{ padding: "5px 8px" }}>
                        <span style={{ background: row.bg, fontSize: 11, padding: "2px 8px", borderRadius: 20, color: "#6b7280" }}>{row.meaning}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", margin: "0 0 8px" }}>COLIPA에서 CV를 쓰는 이유</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.7 }}>
                플레이트 3개의 SPF 결과가 얼마나 일관되는지 판단하는 기준입니다. CV가 높으면 플레이트 간 도포 균일도가 낮다는 신호로, 해당 데이터의 신뢰성이 낮아집니다. 원본 데이터에서 Plate 3의 SPF CV가 12.6%로 낮고 Plate 1이 19.6%로 높은 것을 확인하셨는데, 이 차이가 최종 SPF 산출값에 직접 영향을 줍니다.
              </p>
            </div>
          </div>
        )}

        {bgTab === 2 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", margin: 0 }}>흡광도 스펙트럼 그래프</p>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280", cursor: "pointer" }}>
                <input type="checkbox" checked={showSolar} onChange={e => setShowSolar(e.target.checked)} />
                태양광 가중치 구간 표시
              </label>
            </div>

            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} role="img">
                <title>흡광도 스펙트럼 그래프 (290~450nm)</title>
                <desc>UVB, UVA, Vis 구간의 흡광도 곡선. UVB 구간에서 흡광도가 가장 높고 장파장으로 갈수록 감소함.</desc>
                {showSolar && <>
                  <rect x={svgUvbX} y={svgPT} width={svgUvbW} height={svgH - svgPT - svgPB} fill="#E24B4A" fillOpacity={0.08} rx={2} />
                  <rect x={svgUvaX} y={svgPT} width={svgUvaW} height={svgH - svgPT - svgPB} fill="#BA7517" fillOpacity={0.06} rx={2} />
                  <text x={svgUvbX + svgUvbW / 2} y={svgPT + 14} textAnchor="middle" fontSize={11} fill="#A32D2D" opacity={0.8}>UVB</text>
                  <text x={svgUvaX + svgUvaW / 2} y={svgPT + 14} textAnchor="middle" fontSize={11} fill="#854F0B" opacity={0.8}>UVA</text>
                  <text x={toSvgX(425)} y={svgPT + 14} textAnchor="middle" fontSize={11} fill="#5F5E5A" opacity={0.8}>Vis</text>
                </>}
                <line x1={toSvgX(320)} y1={svgPT} x2={toSvgX(320)} y2={svgH - svgPB} stroke="#e5e7eb" strokeWidth={0.8} strokeDasharray="4 3" />
                <line x1={toSvgX(400)} y1={svgPT} x2={toSvgX(400)} y2={svgH - svgPB} stroke="#e5e7eb" strokeWidth={0.8} strokeDasharray="4 3" />
                {svgAbsYTicks.map(a => (
                  <g key={a}>
                    <line x1={svgPL - 4} y1={toSvgY(a)} x2={svgW - svgPR} y2={toSvgY(a)} stroke="#f3f4f6" strokeWidth={0.4} />
                    <text x={svgPL - 8} y={toSvgY(a) + 4} textAnchor="end" fontSize={10} fill="#9ca3af">{a.toFixed(1)}</text>
                  </g>
                ))}
                {svgWlTicks.filter((_, i) => i % 2 === 0).map(wl => (
                  <text key={wl} x={toSvgX(wl)} y={svgH - svgPB + 14} textAnchor="middle" fontSize={10} fill="#9ca3af">{wl}</text>
                ))}
                <text x={14} y={svgH / 2} textAnchor="middle" fontSize={10} fill="#9ca3af" transform={`rotate(-90,14,${svgH / 2})`}>흡광도</text>
                <text x={svgW / 2} y={svgH - 4} textAnchor="middle" fontSize={10} fill="#9ca3af">파장 (nm)</text>
                <polyline points={svgPoly} fill="none" stroke="#185FA5" strokeWidth={2} strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                {zone:"① UVB 구간 (290~320nm)", bg:"#fee2e2", tc:"#dc2626", pts:[
                  "흡광도 2.3~2.5로 가장 높음",
                  "SPF 수식에서 가중치 가장 큼",
                  "자외선 차단제 흡수 피크 집중 구간",
                  "이 구간 면적이 SPF를 결정"
                ]},
                {zone:"② UVA 구간 (320~400nm)", bg:"#fef3c7", tc:"#92400e", pts:[
                  "흡광도 0.3~2.2로 급격히 감소",
                  "PA 수치에 기여하는 구간",
                  "C.W (Critical Wavelength) 산출 기준",
                  "아보벤존, 징크옥사이드 흡수 영역"
                ]},
                {zone:"③ C.W (Critical Wavelength)", bg:"#dbeafe", tc:"#1d4ed8", pts:[
                  "흡광도 곡선 면적의 90%가 포함되는 파장",
                  "데모 화면에서 372nm로 표시됨",
                  "C.W ≥ 370nm → 광범위차단(Broad Spectrum)",
                  "PA 등급과 함께 UVA 차단 지표로 활용"
                ]},
                {zone:"④ 곡선 면적과 SPF", bg:"#d1fae5", tc:"#059669", pts:[
                  "곡선이 높고 넓을수록 SPF 높음",
                  "UVB 피크가 올라갈수록 SPF 급상승",
                  "처방 비교 시 곡선 겹쳐보기 (Overlay)",
                  "처방1 곡선이 처방2 위에 있으면 더 높은 SPF"
                ]},
              ].map(({zone,bg,tc,pts}) => (
                <div key={zone} style={{ background: bg, borderRadius: 10, padding: "10px 14px" }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: tc, margin: "0 0 8px" }}>{zone}</p>
                  {pts.map((p, i) => (
                    <p key={i} style={{ fontSize: 11, color: "#6b7280", margin: "2px 0", lineHeight: 1.5 }}>• {p}</p>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", margin: "0 0 8px" }}>데모 화면(처방 비교표) 보는 법</p>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    {["지표","처방1","처방2","해석"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500, color: "#6b7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {m:"예측 SPF", v1:"53",   v2:"55 ↑", r:"처방2가 약간 높은 자외선 차단"},
                    {m:"PA 수치",  v1:"77.1", v2:"66.8", r:"처방1이 UVA 차단 더 균형적"},
                    {m:"C.W (nm)",v1:"372",  v2:"370",  r:"둘 다 Broad Spectrum 충족 (≥370)"},
                    {m:"RMSE",    v1:"2.4",  v2:"2.4",  r:"모델 예측 오차 동일"},
                    {m:"MAPE",    v1:"6.1%", v2:"6.1%", r:"Validation 기준 평균 오차"},
                  ].map(row => (
                    <tr key={row.m} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "5px 8px", fontWeight: 500 }}>{row.m}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "monospace" }}>{row.v1}</td>
                      <td style={{ padding: "5px 8px", fontFamily: "monospace" }}>{row.v2}</td>
                      <td style={{ padding: "5px 8px", color: "#6b7280", fontSize: 11 }}>{row.r}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
