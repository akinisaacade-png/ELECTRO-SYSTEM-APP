import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  RefreshCw, 
  Copy, 
  Check, 
  Zap, 
  Thermometer, 
  Ruler, 
  Cpu, 
  BookOpen, 
  Sparkles,
  Info
} from "lucide-react";

export default function UnitConverter() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Power state: HP <-> kW
  const [hpVal, setHpVal] = useState<string>("10");
  const [kwVal, setKwVal] = useState<string>((10 * 0.745699872).toFixed(3));

  // Temperature state: C <-> F
  const [celVal, setCelVal] = useState<string>("25");
  const [fahVal, setFahVal] = useState<string>((25 * 1.8 + 32).toFixed(1));

  // Length state: ft <-> m
  const [ftVal, setFtVal] = useState<string>("100");
  const [mVal, setMVal] = useState<string>((100 * 0.3048).toFixed(3));

  // Conductor state: AWG <-> mm2
  const [awgInput, setAwgInput] = useState<string>("10");
  const [mm2Output, setMm2Output] = useState<string>("5.26");

  // Helper trigger copy response
  const triggerCopy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Convert HP to kW
  const handleHpChange = (value: string) => {
    setHpVal(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setKwVal((num * 0.745699872).toFixed(3));
    } else {
      setKwVal("");
    }
  };

  // Convert kW to HP
  const handleKwChange = (value: string) => {
    setKwVal(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setHpVal((num * 1.341022).toFixed(3));
    } else {
      setHpVal("");
    }
  };

  // Convert Celsius to Fahrenheit
  const handleCelChange = (value: string) => {
    setCelVal(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setFahVal((num * 1.8 + 32).toFixed(1));
    } else {
      setFahVal("");
    }
  };

  // Convert Fahrenheit to Celsius
  const handleFahChange = (value: string) => {
    setFahVal(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setCelVal(((num - 32) / 1.8).toFixed(1));
    } else {
      setCelVal("");
    }
  };

  // Convert feet to meters
  const handleFtChange = (value: string) => {
    setFtVal(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setMVal((num * 0.3048).toFixed(3));
    } else {
      setMVal("");
    }
  };

  // Convert meters to feet
  const handleMChange = (value: string) => {
    setMVal(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setFtVal((num * 3.28084).toFixed(3));
    } else {
      setFtVal("");
    }
  };

  // Standard index helper AWG to mm2
  const convertAwg = (awg: number): number => {
    switch (awg) {
      case 14: return 2.08;
      case 12: return 3.31;
      case 10: return 5.26;
      case 8: return 8.37;
      case 6: return 13.3;
      case 4: return 21.15;
      case 3: return 26.67;
      case 2: return 33.62;
      case 1: return 42.41;
      case 0: return 53.49; // 1/0
      default: return 0;
    }
  };

  const handleAwgChange = (val: string) => {
    setAwgInput(val);
    const num = parseInt(val);
    if (!isNaN(num)) {
      const converted = convertAwg(num);
      if (converted > 0) {
        setMm2Output(converted.toString());
      } else {
        setMm2Output("N/A");
      }
    } else {
      setMm2Output("");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 rounded-3xl border border-emerald-700/30 text-white shadow-xl relative overflow-hidden">
        {/* Abstract grids and subtle decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold uppercase px-2 py-0.5 rounded shadow">
              OFFLINE-READY TOOL
            </span>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-200 font-bold uppercase px-2 py-0.5 rounded border border-emerald-500/20">
              FIELD ENGINEERING
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5 font-sans">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin-slow" />
            Quick Unit Converter
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Fast, high-precision conversion utility optimized for electrical engineers and project managers handling field surveys, motor submittals, temperature corrections, and cable runs.
          </p>
        </div>
      </div>

      {/* Converter Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Motor Power Conversion Card */}
        <motion.div 
          className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2 font-sans">
              <Zap className="w-4 h-4 text-amber-500" />
              Power Conversion (HP ⇄ kW)
            </h3>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              1 HP = 0.746 kW
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Horsepower (HP)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={hpVal}
                  onChange={(e) => handleHpChange(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full text-xs p-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold font-mono text-slate-800 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => triggerCopy(hpVal, "hp")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition cursor-pointer"
                >
                  {copiedId === "hp" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Kilowatts (kW)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={kwVal}
                  onChange={(e) => handleKwChange(e.target.value)}
                  placeholder="e.g. 11"
                  className="w-full text-xs p-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold font-mono text-slate-800 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => triggerCopy(kwVal, "kw")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition cursor-pointer"
                >
                  {copiedId === "kw" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-2">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-[10px] text-slate-550 leading-relaxed font-medium">
              <strong>Quick Rule:</strong> Power values are rounded to 3 decimal places. Useful for estimating full load amperes (FLA) of motor starters and circuit calculations.
            </span>
          </div>
        </motion.div>

        {/* Temperature Correction Conversion Card */}
        <motion.div 
          className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2 font-sans">
              <Thermometer className="w-4 h-4 text-emerald-500" />
              Temperature Correction (°C ⇄ °F)
            </h3>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              Field Ampacity Modifiers
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Celsius (°C)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={celVal}
                  onChange={(e) => handleCelChange(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full text-xs p-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold font-mono text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => triggerCopy(celVal, "cel")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                >
                  {copiedId === "cel" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Fahrenheit (°F)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={fahVal}
                  onChange={(e) => handleFahChange(e.target.value)}
                  placeholder="e.g. 86"
                  className="w-full text-xs p-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold font-mono text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => triggerCopy(fahVal, "fah")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                >
                  {copiedId === "fah" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-2">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="text-[10px] text-slate-550 leading-relaxed font-medium">
              <strong>Quick Rule:</strong> Used to compute ambient correction factors for cables. In the NEC or BS standards, rating factors drop significantly above 30°C (86°F).
            </span>
          </div>
        </motion.div>

        {/* Raceway and Cable Lengths Conversion Card */}
        <motion.div 
          className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2 font-sans">
              <Ruler className="w-4 h-4 text-rose-500" />
              Raceway / Run Length (Ft ⇄ Meters)
            </h3>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              1 meter = 3.2808 feet
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Feet (ft)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={ftVal}
                  onChange={(e) => handleFtChange(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full text-xs p-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold font-mono text-slate-800 dark:text-slate-100 focus:border-rose-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => triggerCopy(ftVal, "ft")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                >
                  {copiedId === "ft" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Meters (m)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={mVal}
                  onChange={(e) => handleMChange(e.target.value)}
                  placeholder="e.g. 60"
                  className="w-full text-xs p-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold font-mono text-slate-800 dark:text-slate-100 focus:border-rose-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => triggerCopy(mVal, "m")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                >
                  {copiedId === "m" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-2">
            <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="text-[10px] text-slate-550 leading-relaxed font-medium">
              <strong>Quick Rule:</strong> Used extensively to map bill-of-materials and convert project specification sheets between metric and US-customary projects.
            </span>
          </div>
        </motion.div>

        {/* Conductor Cross-Sectional Area Quick Guide Card */}
        <motion.div 
          className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2 font-sans">
              <Cpu className="w-4 h-4 text-sky-500" />
              Gauge Helper (AWG ⇄ metric mm²)
            </h3>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              Cross Sectional Area
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Select AWG Size (14 to 1/0)
              </label>
              <select
                value={awgInput}
                onChange={(e) => handleAwgChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold font-mono text-slate-800 dark:text-slate-100 cursor-pointer focus:border-sky-500 focus:outline-none"
              >
                <option value="14">14 AWG</option>
                <option value="12">12 AWG</option>
                <option value="10">10 AWG</option>
                <option value="8">8 AWG</option>
                <option value="6">6 AWG</option>
                <option value="4">4 AWG</option>
                <option value="3">3 AWG</option>
                <option value="2">2 AWG</option>
                <option value="1">1 AWG</option>
                <option value="0">1/0 AWG</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Equivalent Area (mm²)
              </label>
              <div className="relative">
                <input 
                  type="text"
                  readOnly
                  value={mm2Output}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-150 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 font-bold font-mono text-slate-500 dark:text-slate-450 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => triggerCopy(mm2Output, "awg")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition cursor-pointer"
                >
                  {copiedId === "awg" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-2">
            <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <span className="text-[10px] text-slate-550 leading-relaxed font-medium">
              <strong>Quick Rule:</strong> American Wire Gauge (AWG) uses solid indices where smaller numbers mean thicker copper wires, while British &amp; European systems specify absolute physical cross-section in square millimeters.
            </span>
          </div>
        </motion.div>

      </div>

      {/* Quick reference card list */}
      <div className="bg-amber-400/5 border border-amber-400/25 p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-amber-500" />
          Field Formulas Quick Sheet Reference
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-650 dark:text-slate-350">
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
            <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">DC Power Formula</span>
            <code className="text-xs font-bold text-amber-500 font-mono">P (W) = V (V) × I (I)</code>
          </div>
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
            <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">Single Phase AC Formula</span>
            <code className="text-xs font-bold text-emerald-500 font-mono">P (kW) = V × I × PF / 1000</code>
          </div>
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
            <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">Three Phase AC Formula</span>
            <code className="text-xs font-bold text-rose-500 font-mono">P (kW) = √3 × V × I × PF / 1000</code>
          </div>
        </div>
      </div>
      
    </div>
  );
}
