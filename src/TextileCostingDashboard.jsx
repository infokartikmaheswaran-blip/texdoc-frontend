import { useState, useEffect, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
const YARN_TYPES = [
  { value: 1, label: "Single Yarn" },
  { value: 2, label: "Ring Doubled" },
  { value: 3, label: "TFO Doubled" },
  { value: 4, label: "SIRO Yarn" },
  { value: 5, label: "Core (Lycra)" },
  { value: 6, label: "Wrapper Yarn" },
  { value: 7, label: "OE Yarn" },
  { value: 8, label: "Slub Yarn" },
];

const COST_COLORS = {
  material: "#C48B5C",
  labour: "#6993B0",
  power: "#D4A43A",
  packing: "#72A570",
  interest: "#A96B87",
  depreciation: "#8878AC",
  overheads: "#5AA69D",
  yarnWaste: "#A98B6B",
};

// ─── API URL resolution ──────────────────────────────────────────────────────
// Local dev:  frontend :5173 / :3001 → backend :3000
// Production: same origin behind reverse proxy
// Manual:     set window.__TEXDOC_API_BASE = "https://your-api.onrender.com"
function getApiBase() {
  return window.__TEXDOC_API_BASE || "https://texdoc-api.onrender.com";
}

// ─── Animated Number ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "", size = "text-3xl" }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (value === null || value === undefined || isNaN(value)) return;
    const target = parseFloat(value);
    const start = display;
    const dur = 600;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay(start + (target - start) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return (
    <span className={`${size} font-semibold tabular-nums tracking-tight`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {prefix}{display.toFixed(2)}{suffix}
    </span>
  );
}

// ─── Error Banner ────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="rounded-xl p-4 flex items-start gap-3 animate-in" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
      <div className="flex-shrink-0 mt-0.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#991B1B" }}>Calculation Error</p>
        <p className="text-xs mt-0.5 break-words" style={{ color: "#B91C1C" }}>{message}</p>
      </div>
      <button onClick={onDismiss} className="flex-shrink-0 p-0.5 rounded hover:bg-red-100 transition-colors" aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

// ─── Cost Breakdown Chart ────────────────────────────────────────────────────
function CostBreakdownChart({ breakdowns, total }) {
  if (!breakdowns || total <= 0) return null;
  const items = [
    { key: "material", label: "Material", value: breakdowns.materialCost || 0 },
    { key: "labour", label: "Labour", value: breakdowns.labourCost || 0 },
    { key: "power", label: "Power", value: breakdowns.powerCost || 0 },
    { key: "packing", label: "Packing", value: breakdowns.packingCost || 0 },
    { key: "interest", label: "Interest", value: breakdowns.interestCost || 0 },
    { key: "depreciation", label: "Depreciation", value: breakdowns.depreciationCost || 0 },
    { key: "overheads", label: "Overheads", value: breakdowns.fixedOverheadCost || 0 },
    { key: "yarnWaste", label: "Yarn Waste", value: breakdowns.yarnWasteCost || 0 },
  ].filter((i) => i.value > 0);
  return (
    <div className="space-y-2">
      <div className="flex h-9 rounded-lg overflow-hidden" style={{ gap: "2px" }}>
        {items.map((item) => (
          <div key={item.key} className="relative group transition-all duration-500 ease-out" style={{ width: `${(item.value / total) * 100}%`, backgroundColor: COST_COLORS[item.key] }}>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap pointer-events-none z-20" style={{ backgroundColor: "#1E293B", color: "#F1F5F9", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
              {item.label}: ₹{item.value.toFixed(2)}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1E293B" }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COST_COLORS[item.key] }} />
            <span className="text-xs" style={{ color: "#6B7A8D" }}>{item.label}</span>
            <span className="text-xs font-medium" style={{ color: "#3D4B5C", fontFamily: "'JetBrains Mono', monospace" }}>{((item.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({ breakdowns, total }) {
  if (!breakdowns || total <= 0) return null;
  const items = [
    { key: "material", value: breakdowns.materialCost || 0 },
    { key: "labour", value: breakdowns.labourCost || 0 },
    { key: "power", value: breakdowns.powerCost || 0 },
    { key: "packing", value: breakdowns.packingCost || 0 },
    { key: "interest", value: breakdowns.interestCost || 0 },
    { key: "depreciation", value: breakdowns.depreciationCost || 0 },
    { key: "overheads", value: breakdowns.fixedOverheadCost || 0 },
  ].filter((i) => i.value > 0);
  const R = 58, C = 2 * Math.PI * R;
  let cum = 0;
  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[170px] mx-auto">
      <circle cx="80" cy="80" r={R} fill="none" stroke="#E8ECF1" strokeWidth="16" />
      {items.map((item) => {
        const pct = item.value / total, dl = pct * C, off = -cum * C;
        cum += pct;
        return <circle key={item.key} cx="80" cy="80" r={R} fill="none" stroke={COST_COLORS[item.key]} strokeWidth="16" strokeDasharray={`${dl} ${C - dl}`} strokeDashoffset={off} className="transition-all duration-700 ease-out" style={{ transformOrigin: "center", transform: "rotate(-90deg)" }} />;
      })}
      <text x="80" y="73" textAnchor="middle" fill="#6B7A8D" fontSize="10" fontFamily="Source Sans 3, sans-serif">Cost/Kg</text>
      <text x="80" y="93" textAnchor="middle" fill="#1E293B" fontSize="16" fontWeight="600" fontFamily="JetBrains Mono, monospace">₹{total.toFixed(0)}</text>
    </svg>
  );
}

// ─── Input Section ───────────────────────────────────────────────────────────
function InputSection({ title, icon, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50">
        <div className="flex items-center gap-2.5">
          <span className="text-sm" style={{ color: "#94A3B8" }}>{icon}</span>
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#475569", letterSpacing: "0.06em" }}>{title}</span>
          {badge && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#FEF3C7", color: "#92400E", fontSize: "10px" }}>{badge}</span>}
        </div>
        <svg className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: "1px solid #F1F5F9" }}>{children}</div>}
    </div>
  );
}

// ─── Field / Toggle / MetricCard ─────────────────────────────────────────────
function Field({ label, name, value, onChange, type = "number", suffix, placeholder, half = false, options, helpText }) {
  const base = { backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", color: "#1E293B", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" };
  const fc = "focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400";
  return (
    <div className={half ? "flex-1 min-w-[120px]" : "w-full"}>
      <label className="block text-xs mb-1 font-medium" style={{ color: "#64748B" }}>{label}</label>
      <div className="relative">
        {options ? (
          <select name={name} value={value} onChange={onChange} className={`w-full rounded-lg px-3 py-2.5 appearance-none ${fc}`} style={base}>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} step="any" className={`w-full rounded-lg px-3 py-2.5 ${fc}`} style={base} />
        )}
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "#94A3B8" }}>{suffix}</span>}
      </div>
      {helpText && <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{helpText}</p>}
    </div>
  );
}

function ToggleField({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
      <div className="relative w-9 h-5 rounded-full transition-colors duration-200" style={{ backgroundColor: checked ? "#D97706" : "#CBD5E1" }}
        onClick={() => onChange({ target: { name, type: "checkbox", checked: !checked } })}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200" style={{ backgroundColor: "#FFF", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transform: checked ? "translateX(18px)" : "translateX(2px)" }} />
      </div>
      <span className="text-xs font-medium" style={{ color: "#64748B" }}>{label}</span>
    </label>
  );
}

function MetricCard({ label, value, prefix = "₹", suffix = "", accent = false, sublabel, negative }) {
  const bg = accent ? "#FFFBEB" : negative ? "#FEF2F2" : "#FFFFFF";
  const bdr = accent ? "1px solid #FDE68A" : negative ? "1px solid #FECACA" : "1px solid #E2E8F0";
  const vc = accent ? "#B45309" : negative ? "#DC2626" : "#1E293B";
  return (
    <div className="rounded-xl p-4" style={{ background: bg, border: bdr, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#94A3B8", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ color: vc }}><AnimatedNumber value={value} prefix={prefix} suffix={suffix} size="text-2xl" /></div>
      {sublabel && <div className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>{sublabel}</div>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function TextileCostingDashboard() {

  const [inputs, setInputs] = useState({
    yarnType: 1, countNe: 40, cottonPricePerCandy: 75000, yarnRealisationPct: 70,
    wasteValue: 20, spinningUtilisation: 98, electricityCostPerUnit: 8, packingCostPerKg: 8,
    spindleSpeedRPM: 16500, yarnTM: 4.2, sellingPricePerKg: 380,
    isCompact: true, isBlend: false, isBlend1Cotton: true,
    blend1Pct: 0.35, blend2CostPerKg: 112, blend2WastePct: 0.05,
    blend1CostPerKg: 195, blend1WastePct: 0.08,
    numberOfPly: 2, pliedYarnTPI: 37, tfoSpindleSpeed: 10000,
    yarnWastePct: 0.005, additionalPackingCost: 1,
    lycraDenier: 70, lycraPricePerKg: 20, lycraContentPct: 0.2,
  });

  const [master, setMaster] = useState({
    ringFrames: 14, spindlesPerFrame: 1200, spindleLift: 7, ringDia: 38,
    simplexFrames: 4, simplexSpindlesPerFrame: 120,
    comberMachines: 7, lapFormerMachines: 1, cardingMachines: 7, blowRoomLines: 1,
    windingMachines: 14, drumsPerMachine: 26,
    tfoTotalSpindles: 4176, ringDoublingTotalSpindles: 4800,
    overheadsLakhsSpinning: 240, interestLakhsSpinning: 225, depreciationLakhsSpinning: 200,
    overheadsLakhsTFO: 10, interestLakhsTFO: 40, depreciationLakhsTFO: 25,
    avgLabourWagesPerDay: 300, avgStaffSalaryPerMonth: 30000, totalStaff: 17,
    workingDaysPerYear: 362,
  });

  const [results, setResults] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputs((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value === "" ? "" : parseFloat(value) || value }));
  };
  const handleMasterChange = (e) => {
    const { name, value } = e.target;
    setMaster((prev) => ({ ...prev, [name]: value === "" ? "" : parseFloat(value) }));
  };

  // ── Client-side validation ─────────────────────────────────────────────────
  const validateInputs = () => {
    const req = [
      ["countNe", "Count (Ne)"], ["cottonPricePerCandy", "Cotton Price per Candy"],
      ["yarnRealisationPct", "Yarn Realisation %"], ["wasteValue", "Waste Value"],
      ["spinningUtilisation", "Spinning Utilisation %"], ["electricityCostPerUnit", "Electricity Cost"],
      ["packingCostPerKg", "Packing Cost"], ["spindleSpeedRPM", "Spindle Speed"],
      ["yarnTM", "Yarn TM"],
    ];
    for (const [k, lbl] of req) {
      const v = inputs[k];
      if (v === "" || v === null || v === undefined || isNaN(Number(v)))
        return `"${lbl}" is required and must be a valid number.`;
    }
    if (inputs.isBlend) {
      if (!inputs.blend1Pct || isNaN(inputs.blend1Pct)) return "Blend 1 Proportion is required when blending is on.";
      if (!inputs.blend2CostPerKg || isNaN(inputs.blend2CostPerKg)) return "Blend 2 Cost/Kg is required when blending is on.";
      if (inputs.blend2WastePct === "" || isNaN(inputs.blend2WastePct)) return "Blend 2 Waste % is required when blending is on.";
    }
    const yt = Number(inputs.yarnType);
    if (yt === 2 || yt === 3) {
      if (!inputs.numberOfPly) return "Number of Plies is required for doubled yarn.";
      if (!inputs.pliedYarnTPI) return "Plied Yarn TPI is required for doubled yarn.";
      if (!inputs.tfoSpindleSpeed) return "TFO / Doubling Speed is required for doubled yarn.";
    }
    return null;
  };

  // ── Build payload matching backend POST /api/calculate-cost ────────────────
  const buildPayload = () => {
    const p = {
      yarnType: Number(inputs.yarnType), countNe: Number(inputs.countNe),
      cottonPricePerCandy: Number(inputs.cottonPricePerCandy),
      yarnRealisationPct: Number(inputs.yarnRealisationPct),
      wasteValue: Number(inputs.wasteValue),
      spinningUtilisation: Number(inputs.spinningUtilisation),
      electricityCostPerUnit: Number(inputs.electricityCostPerUnit),
      packingCostPerKg: Number(inputs.packingCostPerKg),
      spindleSpeedRPM: Number(inputs.spindleSpeedRPM),
      yarnTM: Number(inputs.yarnTM), isCompact: inputs.isCompact, isBlend: inputs.isBlend,
    };
    if (inputs.sellingPricePerKg !== "" && !isNaN(Number(inputs.sellingPricePerKg)))
      p.sellingPricePerKg = Number(inputs.sellingPricePerKg);
    if (inputs.isBlend) {
      p.isBlend1Cotton = inputs.isBlend1Cotton;
      p.blend1Pct = Number(inputs.blend1Pct);
      p.blend2CostPerKg = Number(inputs.blend2CostPerKg);
      p.blend2WastePct = Number(inputs.blend2WastePct);
      if (!inputs.isBlend1Cotton) {
        p.blend1CostPerKg = Number(inputs.blend1CostPerKg);
        p.blend1WastePct = Number(inputs.blend1WastePct);
      }
    }
    const yt = Number(inputs.yarnType);
    if (yt === 2 || yt === 3) {
      p.numberOfPly = Number(inputs.numberOfPly);
      p.pliedYarnTPI = Number(inputs.pliedYarnTPI);
      p.tfoSpindleSpeed = Number(inputs.tfoSpindleSpeed);
      p.yarnWastePct = Number(inputs.yarnWastePct);
      p.additionalPackingCost = Number(inputs.additionalPackingCost);
    }
    if (yt === 5) {
      p.lycraDenier = Number(inputs.lycraDenier);
      p.lycraPricePerKg = Number(inputs.lycraPricePerKg);
      p.lycraContentPct = Number(inputs.lycraContentPct);
    }
    p.masterOverrides = { ...master };
    return p;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SUBMIT — Real API call to POST /api/calculate-cost
  // ══════════════════════════════════════════════════════════════════════════
  const handleCalculate = async () => {
    setError(null);
    const ve = validateInputs();
    if (ve) { setError(ve); return; }

    setCalculating(true);
    setResults(null);
    const apiBase = getApiBase();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${apiBase}/api/calculate-cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`);
      if (!data.success) throw new Error(data.error || "Calculation returned an unsuccessful result.");

      setResults(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out (15 s). Please verify the backend is running and responsive.");
      } else if (err instanceof TypeError && /fetch|network/i.test(err.message)) {
        setError(`Cannot reach the costing server at "${apiBase || window.location.origin}". Ensure the backend is running.`);
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setCalculating(false);
    }
  };

  const isTFO = inputs.yarnType === 2 || inputs.yarnType === 3;
  const isLycra = inputs.yarnType === 5;

  // Safe result accessors
  const r = results || {};
  const prod = r.production || {};
  const cb = r.costBreakdowns || {};
  const pp = r.profitPercentages || {};

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="min-h-screen" style={{ background: "#F1F4F8", fontFamily: "'Source Sans 3', sans-serif" }}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <header style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D97706, #B45309)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /><circle cx="7" cy="6" r="1.5" fill="white" /><circle cx="17" cy="12" r="1.5" fill="white" /><circle cx="12" cy="18" r="1.5" fill="white" /></svg>
              </div>
              <div>
                <div className="text-sm font-bold tracking-wide" style={{ color: "#1E293B", letterSpacing: "0.04em" }}>TEXDOC</div>
                <div className="text-xs" style={{ color: "#94A3B8" }}>Yarn Costing Engine</div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>KM Associates</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}>KM</div>
            </div>
          </div>
        </header>

        {/* ── Main Grid ──────────────────────────────────────────── */}
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ═══════ LEFT: INPUT PANEL 40% ═══════════════════════ */}
            <div className="w-full lg:w-[40%] space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold" style={{ color: "#334155" }}>Configuration</h2>
                <span className="text-xs" style={{ color: "#94A3B8" }}>All values in ₹ / Ne / RPM</span>
              </div>

              <InputSection title="Yarn Configuration" icon="◈">
                <Field label="Yarn Type" name="yarnType" value={inputs.yarnType} onChange={handleChange} options={YARN_TYPES} />
                <div className="flex gap-3"><Field label="Count (Ne)" name="countNe" value={inputs.countNe} onChange={handleChange} half placeholder="40" /><Field label="Yarn TM" name="yarnTM" value={inputs.yarnTM} onChange={handleChange} half placeholder="4.2" /></div>
                <div className="flex gap-3"><Field label="Spindle Speed" name="spindleSpeedRPM" value={inputs.spindleSpeedRPM} onChange={handleChange} suffix="RPM" half /><Field label="Utilisation" name="spinningUtilisation" value={inputs.spinningUtilisation} onChange={handleChange} suffix="%" half /></div>
                <div className="flex gap-4"><ToggleField label="Compact Spinning" name="isCompact" checked={inputs.isCompact} onChange={handleChange} /><ToggleField label="Fibre Blend" name="isBlend" checked={inputs.isBlend} onChange={handleChange} /></div>
              </InputSection>

              {inputs.isBlend && (
                <InputSection title="Blend Details" icon="◆">
                  <ToggleField label="Blend 1 is Cotton" name="isBlend1Cotton" checked={inputs.isBlend1Cotton} onChange={handleChange} />
                  <div className="flex gap-3"><Field label="Blend 1 Proportion" name="blend1Pct" value={inputs.blend1Pct} onChange={handleChange} half placeholder="0.35" helpText="Fraction, e.g. 0.35 = 35%" /><Field label="Blend 2 Cost/Kg" name="blend2CostPerKg" value={inputs.blend2CostPerKg} onChange={handleChange} suffix="₹" half /></div>
                  <div className="flex gap-3"><Field label="Blend 2 Waste %" name="blend2WastePct" value={inputs.blend2WastePct} onChange={handleChange} half placeholder="0.05" />{!inputs.isBlend1Cotton && <Field label="Blend 1 Cost/Kg" name="blend1CostPerKg" value={inputs.blend1CostPerKg} onChange={handleChange} suffix="₹" half />}</div>
                </InputSection>
              )}

              {isTFO && (
                <InputSection title="Doubling Parameters" icon="⊞">
                  <div className="flex gap-3"><Field label="Number of Plies" name="numberOfPly" value={inputs.numberOfPly} onChange={handleChange} half /><Field label="Plied Yarn TPI" name="pliedYarnTPI" value={inputs.pliedYarnTPI} onChange={handleChange} half /></div>
                  <div className="flex gap-3"><Field label={inputs.yarnType === 3 ? "TFO Speed" : "Doubling Speed"} name="tfoSpindleSpeed" value={inputs.tfoSpindleSpeed} onChange={handleChange} suffix="RPM" half /><Field label="Yarn Waste %" name="yarnWastePct" value={inputs.yarnWastePct} onChange={handleChange} half placeholder="0.005" /></div>
                  <Field label="Additional Packing Cost" name="additionalPackingCost" value={inputs.additionalPackingCost} onChange={handleChange} suffix="₹/Kg" />
                </InputSection>
              )}

              {isLycra && (
                <InputSection title="Lycra / Spandex" icon="◎">
                  <div className="flex gap-3"><Field label="Denier" name="lycraDenier" value={inputs.lycraDenier} onChange={handleChange} half /><Field label="Lycra Price" name="lycraPricePerKg" value={inputs.lycraPricePerKg} onChange={handleChange} suffix="₹/Kg" half /></div>
                  <Field label="Lycra Content" name="lycraContentPct" value={inputs.lycraContentPct} onChange={handleChange} placeholder="0.2" helpText="As fraction, e.g. 0.2 = 20%" />
                </InputSection>
              )}

              <InputSection title="Material & Rates" icon="◇">
                <div className="flex gap-3"><Field label="Cotton Price / Candy" name="cottonPricePerCandy" value={inputs.cottonPricePerCandy} onChange={handleChange} suffix="₹" half helpText="1 candy = 356 Kg" /><Field label="Yarn Realisation" name="yarnRealisationPct" value={inputs.yarnRealisationPct} onChange={handleChange} suffix="%" half /></div>
                <div className="flex gap-3"><Field label="Waste Value" name="wasteValue" value={inputs.wasteValue} onChange={handleChange} suffix="₹/Kg" half /><Field label="Packing Cost" name="packingCostPerKg" value={inputs.packingCostPerKg} onChange={handleChange} suffix="₹/Kg" half /></div>
                <Field label="Electricity Cost" name="electricityCostPerUnit" value={inputs.electricityCostPerUnit} onChange={handleChange} suffix="₹/kWh" />
              </InputSection>

              <InputSection title="Pricing" icon="◉">
                <Field label="Selling Price (Ex-Mill)" name="sellingPricePerKg" value={inputs.sellingPricePerKg} onChange={handleChange} suffix="₹/Kg" placeholder="380" />
              </InputSection>

              <InputSection title="Mill Master Data" icon="⚙" defaultOpen={false} badge="Advanced">
                <p className="text-xs font-semibold uppercase tracking-wider pt-1 pb-0.5" style={{ color: "#94A3B8", letterSpacing: "0.06em" }}>Ring Frame</p>
                <div className="flex gap-3"><Field label="No. of Frames" name="ringFrames" value={master.ringFrames} onChange={handleMasterChange} half /><Field label="Spindles / Frame" name="spindlesPerFrame" value={master.spindlesPerFrame} onChange={handleMasterChange} half /></div>
                <div className="flex gap-3"><Field label="Spindle Lift (in)" name="spindleLift" value={master.spindleLift} onChange={handleMasterChange} half /><Field label="Ring Dia (mm)" name="ringDia" value={master.ringDia} onChange={handleMasterChange} half /></div>
                <p className="text-xs font-semibold uppercase tracking-wider pt-3 pb-0.5" style={{ color: "#94A3B8", letterSpacing: "0.06em" }}>Preparatory</p>
                <div className="flex gap-3"><Field label="Simplex Frames" name="simplexFrames" value={master.simplexFrames} onChange={handleMasterChange} half /><Field label="Simplex Spls/Frame" name="simplexSpindlesPerFrame" value={master.simplexSpindlesPerFrame} onChange={handleMasterChange} half /></div>
                <div className="flex gap-3"><Field label="Comber Machines" name="comberMachines" value={master.comberMachines} onChange={handleMasterChange} half /><Field label="Lap Former M/C" name="lapFormerMachines" value={master.lapFormerMachines} onChange={handleMasterChange} half /></div>
                <div className="flex gap-3"><Field label="Carding Machines" name="cardingMachines" value={master.cardingMachines} onChange={handleMasterChange} half /><Field label="Blow Room Lines" name="blowRoomLines" value={master.blowRoomLines} onChange={handleMasterChange} half /></div>
                <p className="text-xs font-semibold uppercase tracking-wider pt-3 pb-0.5" style={{ color: "#94A3B8", letterSpacing: "0.06em" }}>Winding & TFO</p>
                <div className="flex gap-3"><Field label="Winding Machines" name="windingMachines" value={master.windingMachines} onChange={handleMasterChange} half /><Field label="Drums / Machine" name="drumsPerMachine" value={master.drumsPerMachine} onChange={handleMasterChange} half /></div>
                <div className="flex gap-3"><Field label="TFO Total Spindles" name="tfoTotalSpindles" value={master.tfoTotalSpindles} onChange={handleMasterChange} half /><Field label="Ring Dbl Spindles" name="ringDoublingTotalSpindles" value={master.ringDoublingTotalSpindles} onChange={handleMasterChange} half /></div>
                <p className="text-xs font-semibold uppercase tracking-wider pt-3 pb-0.5" style={{ color: "#94A3B8", letterSpacing: "0.06em" }}>Financial (Lakhs/Year)</p>
                <div className="flex gap-3"><Field label="Overheads" name="overheadsLakhsSpinning" value={master.overheadsLakhsSpinning} onChange={handleMasterChange} suffix="L" half /><Field label="Interest" name="interestLakhsSpinning" value={master.interestLakhsSpinning} onChange={handleMasterChange} suffix="L" half /></div>
                <div className="flex gap-3"><Field label="Depreciation" name="depreciationLakhsSpinning" value={master.depreciationLakhsSpinning} onChange={handleMasterChange} suffix="L" half /><Field label="Working Days/Yr" name="workingDaysPerYear" value={master.workingDaysPerYear} onChange={handleMasterChange} half /></div>
                <p className="text-xs font-semibold uppercase tracking-wider pt-3 pb-0.5" style={{ color: "#94A3B8", letterSpacing: "0.06em" }}>TFO Financials (Lakhs/Year)</p>
                <div className="flex gap-3"><Field label="TFO Overheads" name="overheadsLakhsTFO" value={master.overheadsLakhsTFO} onChange={handleMasterChange} suffix="L" half /><Field label="TFO Interest" name="interestLakhsTFO" value={master.interestLakhsTFO} onChange={handleMasterChange} suffix="L" half /></div>
                <Field label="TFO Depreciation" name="depreciationLakhsTFO" value={master.depreciationLakhsTFO} onChange={handleMasterChange} suffix="L" />
                <p className="text-xs font-semibold uppercase tracking-wider pt-3 pb-0.5" style={{ color: "#94A3B8", letterSpacing: "0.06em" }}>Labour & Staff</p>
                <div className="flex gap-3"><Field label="Avg Wages/Day" name="avgLabourWagesPerDay" value={master.avgLabourWagesPerDay} onChange={handleMasterChange} suffix="₹" half /><Field label="Staff Salary/Mo" name="avgStaffSalaryPerMonth" value={master.avgStaffSalaryPerMonth} onChange={handleMasterChange} suffix="₹" half /></div>
                <Field label="Total Staff Count" name="totalStaff" value={master.totalStaff} onChange={handleMasterChange} />
              </InputSection>

              {/* Error above button for immediate visibility */}
              {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

              {/* Calculate Button */}
              <button onClick={handleCalculate} disabled={calculating}
                className="w-full py-4 rounded-xl font-semibold text-sm tracking-wider transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: calculating ? "#CBD5E1" : "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
                  color: calculating ? "#94A3B8" : "#FFF",
                  boxShadow: calculating ? "none" : "0 4px 20px rgba(180,83,9,0.3), 0 1px 3px rgba(0,0,0,0.1)",
                  letterSpacing: "0.08em", cursor: calculating ? "wait" : "pointer",
                }}>
                {calculating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg>
                    CALCULATING…
                  </span>
                ) : "CALCULATE COST"}
              </button>
            </div>

            {/* ═══════ RIGHT: RESULTS DASHBOARD 60% ═══════════════ */}
            <div ref={resultsRef} className="w-full lg:w-[60%] space-y-5">

              {/* Error in results area for desktop visibility */}
              {error && !results && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

              {/* Loading skeleton */}
              {calculating && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="rounded-xl p-4 h-24 animate-pulse" style={{ backgroundColor: "#E2E8F0" }} />)}</div>
                  <div className="rounded-2xl p-5 h-32 animate-pulse" style={{ backgroundColor: "#E2E8F0" }} />
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-5"><div className="sm:col-span-2 rounded-2xl h-48 animate-pulse" style={{ backgroundColor: "#E2E8F0" }} /><div className="sm:col-span-3 rounded-2xl h-48 animate-pulse" style={{ backgroundColor: "#E2E8F0" }} /></div>
                </div>
              )}

              {/* Empty state */}
              {!results && !calculating && !error && (
                <div className="flex flex-col items-center justify-center py-32 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px dashed #D1D9E6" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: "#F8FAFC" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" /><circle cx="20" cy="17" r="2" /></svg>
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#64748B" }}>No results yet</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>Configure your parameters and click Calculate</p>
                </div>
              )}

              {/* ── Live Results ────────────────────────────────── */}
              {results && (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10B981" }} />
                    <span className="text-xs font-medium" style={{ color: "#64748B" }}>
                      Results for {r.yarnType || "—"} · {r.countNe || "—"} Ne
                      {r.pliedCount ? ` · Plied ${r.pliedCount} Ne` : ""}
                    </span>
                  </div>

                  {/* Hero metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard label="Cost per Kg" value={r.costPerKg} accent sublabel={r.yarnType} />
                    <MetricCard
                      label={r.profitOrLoss === "PROFIT" ? "Profit / Kg" : "Loss / Kg"}
                      value={Math.abs(r.profitLossPerKg || 0)}
                      prefix={r.profitOrLoss === "PROFIT" ? "+₹" : "−₹"}
                      negative={r.profitOrLoss === "LOSS"}
                      sublabel={`at ₹${r.sellingPricePerKg}/Kg selling`}
                    />
                    <MetricCard label="Selling Price" value={r.sellingPricePerKg} sublabel={pp.netProfitOnSellingPrice != null ? `Net: ${(pp.netProfitOnSellingPrice * 100).toFixed(1)}% on price` : ""} />
                  </div>

                  {/* TFO extra row */}
                  {cb.tfoConversionCost != null && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <MetricCard label="Single Yarn Cost" value={cb.singleYarnCost} sublabel="Before doubling" />
                      <MetricCard label="TFO Conversion" value={cb.tfoConversionCost} sublabel="Labour + Power + Fixed" />
                      <MetricCard label="Plied Yarn Cost" value={cb.pliedYarnCost} accent sublabel="Final doubled cost" />
                    </div>
                  )}

                  {/* Cost composition */}
                  <div className="rounded-2xl p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#475569", letterSpacing: "0.06em" }}>Cost Composition</h3>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}>₹/Kg</span>
                    </div>
                    <CostBreakdownChart breakdowns={cb} total={r.costPerKg} />
                  </div>

                  {/* Donut + detail */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-5">
                    <div className="sm:col-span-2 rounded-2xl p-5 flex flex-col items-center justify-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <DonutChart breakdowns={cb} total={r.costPerKg} />
                    </div>
                    <div className="sm:col-span-3 rounded-2xl p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#475569", letterSpacing: "0.06em" }}>Detailed Breakdown</h3>
                      <div className="space-y-1">
                        {[
                          { label: "Material", value: cb.materialCost, color: COST_COLORS.material },
                          { label: "Power", value: cb.powerCost, color: COST_COLORS.power },
                          { label: "Interest", value: cb.interestCost, color: COST_COLORS.interest },
                          { label: "Depreciation", value: cb.depreciationCost, color: COST_COLORS.depreciation },
                          { label: "Labour", value: cb.labourCost, color: COST_COLORS.labour },
                          { label: "Overheads", value: cb.fixedOverheadCost, color: COST_COLORS.overheads },
                          { label: "Packing", value: cb.packingCost, color: COST_COLORS.packing },
                          { label: "Yarn Waste", value: cb.yarnWasteCost, color: COST_COLORS.yarnWaste },
                        ].filter(i => i.value > 0).map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-xs font-medium" style={{ color: "#475569" }}>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 rounded-full" style={{ width: `${Math.max((item.value / r.costPerKg) * 100, 4)}px`, backgroundColor: item.color, opacity: 0.5 }} />
                              <span className="text-xs font-semibold tabular-nums w-16 text-right" style={{ color: "#1E293B", fontFamily: "'JetBrains Mono', monospace" }}>₹{item.value.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Production stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Gms/Spl/8hrs", value: prod.gmsPerSpindlePer8Hrs, prefix: "", suffix: " g" },
                      { label: "Daily Output", value: prod.yarnProductionKgPerDay, prefix: "", suffix: " Kg" },
                      { label: "UKG", value: prod.UKG, prefix: "", suffix: "" },
                      { label: "Staff Cost/Kg", value: r.staffSalaryPerKg, prefix: "₹", suffix: "" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl p-3.5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                        <div className="text-xs mb-1.5 font-medium" style={{ color: "#94A3B8" }}>{item.label}</div>
                        <div className="text-lg font-semibold tabular-nums" style={{ color: "#1E293B", fontFamily: "'JetBrains Mono', monospace" }}>
                          {item.prefix}{typeof item.value === "number" ? item.value.toFixed(2) : "—"}{item.suffix}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Profitability */}
                  <div className="rounded-2xl p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#475569", letterSpacing: "0.06em" }}>Profitability</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: "Operating Profit", value: pp.operatingProfitOnSellingPrice, desc: "Net + Dep + Interest" },
                        { label: "Cash Profit", value: pp.cashProfitOnSellingPrice, desc: "Net + Depreciation" },
                        { label: "Net Profit", value: pp.netProfitOnSellingPrice, desc: "On Selling Price" },
                      ].map((item) => (
                        <div key={item.label} className="text-center py-3.5 rounded-xl" style={{ backgroundColor: "#F8FAFC" }}>
                          <div className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>{item.label}</div>
                          <div className="text-xl font-bold tabular-nums" style={{ color: item.value >= 0 ? "#059669" : "#DC2626", fontFamily: "'JetBrains Mono', monospace" }}>
                            {typeof item.value === "number" ? `${(item.value * 100).toFixed(1)}%` : "—"}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mill info footer */}
                  <div className="rounded-xl p-3 flex flex-wrap items-center justify-between gap-2" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>Spindles: <strong style={{ color: "#475569" }}>{prod.totalSpindles?.toLocaleString() || "—"}</strong></span>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>Units/Day: <strong style={{ color: "#475569" }}>{prod.totalUnitsPerDay?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "—"}</strong></span>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>Labour+Staff: <strong style={{ color: "#475569" }}>{r.labourAndStaffPctOnCost ? `${(r.labourAndStaffPctOnCost * 100).toFixed(1)}%` : "—"}</strong></span>
                  </div>
                </>
              )}

              <div className="text-center pt-2 pb-4">
                <p className="text-xs" style={{ color: "#94A3B8" }}>TEXDOC Yarn Costing Engine v1.0 · Confidential · KM Associates</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
