/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Compass, 
  Zap, 
  Layers, 
  Sliders, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  Cpu, 
  ChevronRight, 
  GitCommit,
  ShieldAlert,
  Info,
  Sparkles
} from "lucide-react";

interface VisualizerCardProps {
  activeTab: "load" | "cable" | "vdrop" | "conduit" | "gemini-sizer";
  activeRegion: string;
  isImperial: boolean;
  // State elements to render dynamically
  loadKw: number;
  loadPf: number;
  loadVolt: number;
  loadPhases: number;
  loadType: string;
  loadResult: any;

  csAmp: number;
  csLen: number;
  csMethod: string;
  csConductor: string;
  csInsulation: string;
  csResult: any;

  vdAmp: number;
  vdLen: number;
  vdSize: number;
  vdVolt: number;
  vdResult: any;

  cfDiam: number;
  cfCableOD: number;
  cfWires: number;
  cfStandard: string;
  cfResult: any;
}

export default function VisualizerCard({
  activeTab,
  activeRegion,
  isImperial,
  loadKw,
  loadPf,
  loadVolt,
  loadPhases,
  loadType,
  loadResult,
  csAmp,
  csLen,
  csMethod,
  csConductor,
  csInsulation,
  csResult,
  vdAmp,
  vdLen,
  vdSize,
  vdVolt,
  vdResult,
  cfDiam,
  cfCableOD,
  cfWires,
  cfStandard,
  cfResult
}: VisualizerCardProps) {

  // Phase color guidelines based on activeRegion selection
  const getPhaseColors = () => {
    const isAWGRegion = ["US", "CA"].includes(activeRegion);
    if (isAWGRegion) {
      return {
        l1: "#1E1B4B", // Black / Dark Navy
        neutral: "#E2E8F0", // White/Slate
        earth: "#22C55E", // Green
        label1: "L1 (Black)",
        labelN: "N (White)"
      };
    } else {
      return {
        l1: "#78350F", // Brown
        neutral: "#3B82F6", // Blue
        earth: "#EAB308", // Yellow-Green
        label1: "L1 (Brown)",
        labelN: "N (Blue)"
      };
    }
  };

  const colors = getPhaseColors();

  // Helper values for display units
  const lengthUnit = isImperial ? "ft" : "m";
  const areaUnit = isImperial ? "AWG" : "mm²";
  const weightUnit = isImperial ? "lbs" : "kg";
  const tempUnit = isImperial ? "°F" : "°C";

  // Display length conversion
  const formatLength = (metersValue: number) => {
    if (isImperial) {
      return `${Math.round(metersValue * 3.28084)} ft`;
    }
    return `${metersValue} m`;
  };

  const formatArea = (metricSizeNum: number, optionalStringSize?: string) => {
    if (isImperial) {
      // Return representative AWG size
      if (optionalStringSize) {
        if (optionalStringSize.includes("AWG") || optionalStringSize.includes("/") || optionalStringSize.match(/^\d+$/)) {
          return optionalStringSize;
        }
      }
      // Simple lookup conversion
      if (metricSizeNum <= 1.5) return "14 AWG";
      if (metricSizeNum <= 2.5) return "12 AWG";
      if (metricSizeNum <= 4) return "10 AWG";
      if (metricSizeNum <= 6) return "8 AWG";
      if (metricSizeNum <= 10) return "6 AWG";
      if (metricSizeNum <= 16) return "4 AWG";
      if (metricSizeNum <= 25) return "2 AWG";
      if (metricSizeNum <= 35) return "1 AWG";
      if (metricSizeNum <= 50) return "1/0";
      if (metricSizeNum <= 70) return "2/0";
      if (metricSizeNum <= 95) return "3/0";
      return "4/0 AWG";
    }
    return optionalStringSize || `${metricSizeNum} mm²`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-white flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800">
      
      {/* Left / Top main preview bay */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        
        {/* Dynamic Widget Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-1.5 leading-none">
              <Compass className="w-3.5 h-3.5 animate-spin-slow text-amber-400" />
              Interactive Circuit Vector Canvas
            </span>
            <h3 className="text-sm font-black text-slate-100 tracking-tight">
              {activeTab === "load" && "LV Distribution Loop Layout"}
              {activeTab === "cable" && "Interactive Conductor Cross-Section"}
              {activeTab === "vdrop" && "Voltage Attenuation Profile"}
              {activeTab === "conduit" && "Conduit Sizing Fill Space Analysis"}
              {activeTab === "gemini-sizer" && "AI-Synthesized Hardware Schematic"}
            </h3>
          </div>
          <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700/50 text-3xs font-bold text-slate-400">
            Unit Standard: <span className="text-amber-400 font-extrabold">{isImperial ? "Imperial (AWG / ft)" : "Metric (mm² / m)"}</span>
          </div>
        </div>

        {/* Dynamic Vector Stage */}
        <div className="flex-1 flex items-center justify-center min-h-[220px] bg-slate-950/80 rounded-xl border border-slate-800/80 relative p-4 overflow-hidden">
          {/* Subtle design matrix background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* TAB A: LOAD VECTOR SCHEMATIC */}
          {activeTab === "load" && (
            <svg viewBox="0 0 450 180" className="w-full max-w-md h-auto">
              {/* Transformer block (Source) */}
              <g id="transformer" transform="translate(15, 30)">
                <rect x="0" y="20" width="70" height="70" rx="8" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" className="transition-all" />
                <path d="M 15 55 Q 25 35, 35 55 T 55 55" fill="none" stroke="#60A5FA" strokeWidth="2.5" />
                <path d="M 15 63 Q 25 43, 35 63 T 55 63" fill="none" stroke="#F43F5E" strokeWidth="1.5" />
                {/* Connection point */}
                <circle cx="70" cy="55" r="4" fill="#60A5FA" />
                <text x="35" y="105" fontSize="9" fontWeight="bold" fill="#94A3B8" textAnchor="middle">
                  {loadVolt}V Transformer
                </text>
                <text x="35" y="117" fontSize="8" fill="#38BDF8" textAnchor="middle" className="font-mono">
                  {loadPhases}Φ {loadPhases === 3 ? "Balanced" : "Single"}
                </text>
              </g>

              {/* Cable connecting lines - Dynamic drop rate indicator color */}
              <line 
                x1="85" y1="85" x2="165" y2="85" 
                stroke={loadResult ? "#34D399" : "#64748B"} 
                strokeWidth="4" 
                strokeDasharray={loadType === "motor" ? "6,4" : "none"} 
              />
              
              {/* Overcurrent Breaker (MCB) */}
              <g id="breaker" transform="translate(170, 50)">
                <rect x="0" y="10" width="35" height="50" rx="4" fill="#334155" stroke="#F59E0B" strokeWidth="2" />
                {/* Toggle Switch lever */}
                <line x1="8" y1="35" x2="27" y2="25" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                <circle cx="27" cy="25" r="3.5" fill="#E2E8F0" />
                <text x="17.5" y="75" fontSize="9" fontWeight="bold" fill="#F59E0B" textAnchor="middle">
                  {loadResult ? `${loadResult.breaker}A MCB` : "MCB Sizing"}
                </text>
              </g>

              {/* Load Cable linking further */}
              <line 
                x1="205" y1="85" x2="350" y2="85" 
                stroke={loadResult ? "#34D399" : "#64748B"} 
                strokeWidth="4" 
              />
              {/* Cable tag / tooltip */}
              {loadResult && (
                <g transform="translate(225, 45)">
                  <rect x="0" y="0" width="110" height="26" rx="4" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
                  <text x="55" y="11" fontSize="8" fontWeight="bold" fill="#34D399" textAnchor="middle" className="font-mono">
                    Conductor: {formatArea(parseFloat(loadResult.cable) || 0, loadResult.cable)}
                  </text>
                  <text x="55" y="21" fontSize="7" fill="#94A3B8" textAnchor="middle" className="font-mono">
                    Derated: {loadResult.deratedCurrent}A
                  </text>
                </g>
              )}

              {/* Connected Load Object */}
              <g id="load-object" transform="translate(355, 30)">
                {loadType === "motor" ? (
                  // Motor Visual
                  <>
                    <circle cx="40" cy="55" r="30" fill="#1E293B" stroke="#A78BFA" strokeWidth="2.5" />
                    <line x1="40" y1="20" x2="40" y2="10" stroke="#A78BFA" strokeWidth="2" />
                    <circle cx="40" cy="55" r="14" fill="none" stroke="#F43F5E" strokeWidth="2" strokeDasharray="4,2" className="animate-spin-slow origin-center" style={{ transformOrigin: "395px 85px" }} />
                    <text x="40" y="59" fontSize="13" fontWeight="black" fill="#A78BFA" textAnchor="middle">M</text>
                    <text x="40" y="105" fontSize="9" fontWeight="bold" fill="#94A3B8" textAnchor="middle">
                      {loadKw} kW Motor
                    </text>
                  </>
                ) : (
                  // Facility Visual
                  <>
                    <polygon points="40,25 10,55 70,55" fill="#1E293B" stroke="#A78BFA" strokeWidth="2" />
                    <rect x="18" y="55" width="44" height="35" fill="#1E293B" stroke="#A78BFA" strokeWidth="2" />
                    <rect x="34" y="68" width="12" height="22" fill="#334155" />
                    {/* Glowing yellow window */}
                    <rect x="23" y="60" width="8" height="8" fill="#FBBF24" opacity="0.8" />
                    <rect x="49" y="60" width="8" height="8" fill="#FBBF24" opacity="0.8" />
                    <text x="40" y="105" fontSize="9" fontWeight="bold" fill="#94A3B8" textAnchor="middle">
                      {loadType === "continuous" ? "Active Continuous" : "General Purpose"}
                    </text>
                  </>
                )}
                <text x="40" y="117" fontSize="8" fill="#A78BFA" textAnchor="middle" className="font-mono">
                  PF: {loadPf} | I: {loadResult ? `${loadResult.base}A` : "--"}
                </text>
              </g>

              {/* Ground Bonding Earth link */}
              <path d="M 50 120 L 50 145 L 80 145" fill="none" stroke={colors.earth} strokeWidth="1.5" strokeDasharray="3,3" />
              <g transform="translate(80, 140)">
                <line x1="0" y1="5" x2="16" y2="5" stroke={colors.earth} strokeWidth="2" />
                <line x1="3" y1="9" x2="13" y2="9" stroke={colors.earth} strokeWidth="1.5" />
                <line x1="6" y1="13" x2="10" y2="13" stroke={colors.earth} strokeWidth="1" />
                <text x="21" y="10" fontSize="7" fill={colors.earth} fontWeight="bold" className="font-mono">Earth Electrode</text>
              </g>
            </svg>
          )}

          {/* TAB B: CABLE CROSS-SECTION VISUAL */}
          {activeTab === "cable" && (
            <svg viewBox="0 0 240 240" className="w-52 h-52">
              {/* Outer conduit envelope circle */}
              <circle cx="120" cy="115" r="95" fill="#111827" stroke="#475569" strokeWidth="4" />
              <text x="120" y="38" fontSize="8" fontWeight="bold" fill="#94A3B8" textAnchor="middle" className="uppercase font-mono">
                Conduit Shell
              </text>

              {/* Cable Outer Jacket / Armor Layer */}
              <circle cx="120" cy="120" r="72" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
              {/* Dynamic armor hatched line border representation */}
              <circle cx="120" cy="120" r="69" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3,2" />

              {/* Inner filler packing insulation */}
              <circle cx="120" cy="120" r="62" fill="#334155" />

              {/* Dynamic Conductor Cores */}
              {/* Core 1 - Active L1 */}
              <g transform="translate(90, 100)">
                <circle cx="0" cy="0" r="21" fill={colors.l1} stroke="#1E293B" strokeWidth="1.5" />
                {/* Inside actual copper/aluminum metal core based on selection */}
                <circle cx="0" cy="0" r="13" fill={csConductor === "copper" ? "#D97706" : "#CCD1D9"} />
                <text x="0" y="3" fontSize="8" fontWeight="black" fill="#111827" textAnchor="middle">L1</text>
              </g>

              {/* Core 2 - Neutral */}
              <g transform="translate(150, 100)">
                <circle cx="0" cy="0" r="21" fill={colors.neutral} stroke="#1E293B" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="13" fill={csConductor === "copper" ? "#D97706" : "#CCD1D9"} />
                <text x="0" y="4" fontSize="8" fontWeight="black" fill="#111827" textAnchor="middle">N</text>
              </g>

              {/* Core 3 - Earth ground bonding */}
              <g transform="translate(120, 150)">
                <circle cx="0" cy="0" r="17" fill={colors.earth} stroke="#1E293B" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="10" fill={csConductor === "copper" ? "#D97706" : "#CCD1D9"} />
                <text x="0" y="3" fontSize="8" fontWeight="black" fill="#111827" textAnchor="middle">PE</text>
              </g>

              {/* Info HUD overlaid on graphic */}
              <g transform="translate(120, 115)">
                <rect x="-35" y="-12" width="70" height="24" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" opacity="0.95" />
                <text x="0" y="-1" fontSize="8" fontWeight="black" fill="#38BDF8" textAnchor="middle" className="font-mono">
                  {csResult ? formatArea(parseFloat(csResult.cable) || 0, csResult.cable) : "10 mm²"}
                </text>
                <text x="0" y="8" fontSize="7" fill="#E2E8F0" textAnchor="middle" className="font-mono uppercase">
                  {csConductor}
                </text>
              </g>

              {/* Cable Outer labels */}
              <text x="120" y="212" fontSize="8" fontWeight="bold" fill="#A78BFA" textAnchor="middle" className="font-mono">
                {csInsulation === "pvc" ? "PVC/PVC Insulation" : "Thermoset XLPE Shell"}
              </text>
            </svg>
          )}

          {/* TAB C: VOLTAGE DROP DECAY CHART */}
          {activeTab === "vdrop" && (
            <svg viewBox="0 0 450 180" className="w-full max-w-md h-auto">
              {/* Grid axes */}
              <line x1="50" y1="20" x2="50" y2="140" stroke="#475569" strokeWidth="2" />
              <line x1="50" y1="140" x2="420" y2="140" stroke="#475569" strokeWidth="2" />

              <text x="40" y="25" fontSize="8" fill="#94A3B8" textAnchor="end" className="font-mono">Source V ({vdVolt}V)</text>
              <text x="40" y="140" fontSize="8" fill="#94A3B8" textAnchor="end" className="font-mono">0V Ground</text>
              <text x="420" y="152" fontSize="8" fill="#94A3B8" textAnchor="middle" className="font-mono">Distance ({formatLength(vdLen)})</text>

              {/* Plot representation path */}
              {/* Drop values percentage calculations */}
              {(() => {
                const dropPercent = vdResult ? parseFloat(vdResult.dropPct) : 1.8;
                const isPassed = vdResult ? vdResult.passed : true;
                const strokeColor = isPassed ? "#10B981" : "#EF4444";
                
                // Calculate drop curve line coordinates
                const startingY = 35;
                const endY = startingY + Math.min(dropPercent * 15, 95); // clamp line decay visual

                return (
                  <>
                    {/* Shadow envelope under curve */}
                    <path 
                      d={`M 50 ${startingY} L 380 ${endY} L 380 140 L 50 140 Z`} 
                      fill={`url(#drop-grad-${isPassed ? 'green' : 'red'})`} 
                      opacity="0.15" 
                    />

                    {/* Voltage Drop line */}
                    <line 
                      x1="50" y1={startingY} 
                      x2="380" y2={endY} 
                      stroke={strokeColor} 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                    />

                    {/* Interactive Source dot */}
                    <circle cx="50" cy={startingY} r="5" fill="#38BDF8" />
                    
                    {/* Terminus terminal dot */}
                    <circle cx="380" cy={endY} r="5.5" fill={strokeColor} />

                    {/* Gradient Definitions */}
                    <defs>
                      <linearGradient id="drop-grad-green" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="drop-grad-red" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Voltage labels above dots */}
                    <text x="65" y={startingY - 5} fontSize="8" fontWeight="bold" fill="#38BDF8">
                      {vdVolt} V
                    </text>
                    <text x="380" y={endY - 10} fontSize="8" fontWeight="extrabold" fill={strokeColor} textAnchor="middle">
                      {vdResult ? `${(vdVolt - parseFloat(vdResult.dropVolts)).toFixed(2)} V` : `${(vdVolt * 0.98).toFixed(1)} V`}
                    </text>
                    
                    {/* Loss Badge HUD */}
                    <g transform="translate(200, 50)">
                      <rect x="-55" y="-14" width="110" height="28" rx="4" fill="#0F172A" stroke={strokeColor} strokeWidth="1" />
                      <text x="0" y="-3" fontSize="8.5" fontWeight="black" fill={strokeColor} textAnchor="middle" className="font-mono">
                        Loss: {dropPercent.toFixed(2)}%
                      </text>
                      <text x="0" y="8" fontSize="7" fill="#94A3B8" textAnchor="middle" className="font-mono">
                        Limit: {vdResult ? `${vdResult.limit}% Max` : "3% Max"}
                      </text>
                    </g>

                    {/* Pass/Fail visual seal */}
                    <g transform="translate(380, 150)">
                      <text x="0" y="0" fontSize="8" fontWeight="black" fill={strokeColor} textAnchor="middle" className="font-mono uppercase">
                        {isPassed ? "● COMPLIANT" : "▲ VOLTAGE OUT-OF-LIMITS"}
                      </text>
                    </g>
                  </>
                );
              })()}
            </svg>
          )}

          {/* TAB D: CONDUIT FILL SPACE */}
          {activeTab === "conduit" && (
            <svg viewBox="0 0 240 240" className="w-52 h-52">
              {/* Outer conduit structure circle */}
              <circle cx="120" cy="115" r="90" fill="#111827" stroke="#475569" strokeWidth="4" />
              
              {/* Calculate conduit size labels */}
              <text x="120" y="42" fontSize="7.5" fontWeight="bold" fill="#94A3B8" textAnchor="middle" className="font-mono uppercase">
                Conduit ID: {cfDiam} mm ({isImperial ? `${(cfDiam / 25.4).toFixed(2)} in` : "Metric"})
              </text>

              {/* Dynamic cable circles inside */}
              {(() => {
                // Determine placement positions based on wire counts to look beautiful
                const listPositions: {x: number, y: number}[] = [];
                if (cfWires === 1) {
                  listPositions.push({ x: 120, y: 115 });
                } else if (cfWires === 2) {
                  listPositions.push({ x: 95, y: 115 });
                  listPositions.push({ x: 145, y: 115 });
                } else if (cfWires === 3) {
                  listPositions.push({ x: 120, y: 95 });
                  listPositions.push({ x: 95, y: 135 });
                  listPositions.push({ x: 145, y: 135 });
                } else if (cfWires === 4) {
                  listPositions.push({ x: 95, y: 95 });
                  listPositions.push({ x: 145, y: 95 });
                  listPositions.push({ x: 95, y: 135 });
                  listPositions.push({ x: 145, y: 135 });
                } else {
                  // Standard clustered layout
                  listPositions.push({ x: 120, y: 115 });
                  listPositions.push({ x: 90, y: 100 });
                  listPositions.push({ x: 150, y: 100 });
                  listPositions.push({ x: 100, y: 140 });
                  listPositions.push({ x: 140, y: 140 });
                }

                // Cap visual size to fit nicely
                const maxFillPctVal = cfResult ? parseFloat(cfResult.fillPct) : 32.5;
                const isPassed = cfResult ? cfResult.passed : true;
                const cableColor = isPassed ? "#38BDF8" : "#EF4444";
                const borderStroke = isPassed ? "#10B981" : "#EF4444";

                // Draw each wire core
                return (
                  <>
                    {listPositions.slice(0, Math.min(cfWires, 10)).map((pos, idx) => (
                      <g key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
                        {/* Cable outer sleeve */}
                        <circle cx="0" cy="0" r={Math.min(cfCableOD * 1.5, 23)} fill="#1F2937" stroke={cableColor} strokeWidth="1.8" />
                        {/* Conductor core wires inside */}
                        <circle cx="-5" cy="-2" r="4.5" fill="#B45309" />
                        <circle cx="5" cy="-2" r="4.5" fill="#3B82F6" />
                        <circle cx="0" cy="6" r="4.5" fill="#EAB308" />
                      </g>
                    ))}

                    {/* Central Fill Indicator HUD */}
                    <g transform="translate(120, 115)">
                      <circle cx="0" cy="0" r="30" fill="#030712" stroke={borderStroke} strokeWidth="1.5" opacity="0.9" />
                      <text x="0" y="-4" fontSize="10" fontWeight="black" fill={borderStroke} textAnchor="middle" className="font-mono">
                        {maxFillPctVal.toFixed(1)}%
                      </text>
                      <text x="0" y="8" fontSize="6.5" fill="#94A3B8" textAnchor="middle" className="font-mono uppercase">
                        {cfResult ? `Limit ${cfResult.maxLimit}%` : "Max 40%"}
                      </text>
                      <text x="0" y="16" fontSize="5" fontWeight="bold" fill={isPassed ? "#10B981" : "#EF4444"} textAnchor="middle" className="font-mono">
                        {isPassed ? "PASS" : "OVERFILL WARNING"}
                      </text>
                    </g>
                  </>
                );
              })()}
              
              <text x="120" y="215" fontSize="8.5" fontWeight="extrabold" fill="#94A3B8" textAnchor="middle" className="font-mono">
                {cfStandard.toUpperCase()} Code Verification
              </text>
            </svg>
          )}

          {/* TAB E: AI SYNTHESIZED HARDWARE SCHEMATIC */}
          {activeTab === "gemini-sizer" && (
            <svg viewBox="0 0 450 180" className="w-full max-w-md h-auto">
              <rect x="10" y="10" width="430" height="160" rx="12" fill="#080B11" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="5,3" />
              
              <g transform="translate(20, 25)">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 inline-block mr-2" />
                <text x="24" y="13" fontSize="10" fontWeight="black" fill="#10B981" className="uppercase tracking-widest font-mono">
                  Gemini AI Structured Sizing
                </text>
              </g>

              {/* Source Node */}
              <circle cx="70" cy="95" r="14" fill="#1E293B" stroke="#10B981" strokeWidth="2" />
              <path d="M 64 95 L 76 95 M 70 89 L 70 101" stroke="#34D399" strokeWidth="2" />
              <text x="70" y="125" fontSize="8.5" fill="#94A3B8" textAnchor="middle" fontWeight="bold" className="font-mono">SYSTEM GAIN</text>

              {/* Connector Link */}
              <line x1="84" y1="95" x2="190" y2="95" stroke="#38BDF8" strokeWidth="3" />
              <path d="M 130 88 L 140 95 L 130 102 Z" fill="#38BDF8" />

              {/* Center Conductor Matrix */}
              <g transform="translate(200, 55)">
                <rect x="0" y="0" width="60" height="75" rx="8" fill="#111827" stroke="#F59E0B" strokeWidth="2" />
                {/* Chip micro routes */}
                <line x1="12" y1="15" x2="48" y2="15" stroke="#FBBF24" strokeWidth="1.5" />
                <line x1="12" y1="35" x2="48" y2="35" stroke="#FBBF24" strokeWidth="1.5" />
                <text x="30" y="65" fontSize="8" fontWeight="bold" fill="#F59E0B" textAnchor="middle" className="font-mono">AI MODEL</text>
                
                {/* Micro pins visual representation */}
                <circle cx="15" cy="15" r="2.5" fill="#1E293B" stroke="#60A5FA" />
                <circle cx="45" cy="15" r="2.5" fill="#1E293B" stroke="#60A5FA" />
                <circle cx="15" cy="35" r="2.5" fill="#1E293B" stroke="#60A5FA" />
                <circle cx="45" cy="35" r="2.5" fill="#1E293B" stroke="#60A5FA" />
              </g>

              {/* Out connector */}
              <line x1="260" y1="95" x2="360" y2="95" stroke="#A78BFA" strokeWidth="3" />
              <path d="M 300 88 L 310 95 L 300 102 Z" fill="#A78BFA" />

              {/* End Node */}
              <circle cx="375" cy="95" r="14" fill="#1E293B" stroke="#A78BFA" strokeWidth="2" />
              <polygon points="370,101 380,101 375,89" fill="#F43F5E" />
              <text x="375" y="125" fontSize="8.5" fill="#94A3B8" textAnchor="middle" fontWeight="bold" className="font-mono">OPTIMAL GAUGE</text>

              {/* Mini Status Ticker */}
              <g transform="translate(225, 152)">
                <text x="0" y="0" fontSize="7" fill="#64748B" textAnchor="middle" className="font-mono uppercase tracking-widest">
                  Neural synthesis active • Handshake established
                </text>
              </g>
            </svg>
          )}

        </div>

        {/* Dynamic Warning Warning Card Base */}
        <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
              Dynamic CAD Visualization Summary
            </span>
            <p className="text-3xs text-slate-400 leading-normal font-semibold">
              {activeTab === "load" && `Visualizing utility distribution delivering current through sizing-regulated conductors towards safety protective MCB units at ${loadVolt} Volts.`}
              {activeTab === "cable" && `Rendering cross-section configuration for selected ${csConductor} wire bundle insulated under protective ${csInsulation} shielding.`}
              {activeTab === "vdrop" && `Illustrating relative voltage decay index over a ${vdLen}${lengthUnit} electrical line circuit run carrying a peak active ${vdAmp} Amps.`}
              {activeTab === "conduit" && `Measuring total cross-sectional surface occupancy of ${cfWires} cables of ${cfCableOD}mm diameter packed inside a ${cfDiam}mm PVC conduit.`}
              {activeTab === "gemini-sizer" && `Rendering system architecture mapped by Gemini LLM based on user requested structural guidelines and specified sizing limits.`}
            </p>
          </div>
        </div>

      </div>

      {/* Right side live status metrics - 1/3 width */}
      <div className="p-6 md:w-80 shrink-0 space-y-6 bg-slate-950/20">
        
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Component HUD Stats
          </span>
          <h4 className="text-xs font-black text-slate-200">Active Handshake telemetry</h4>
        </div>

        {/* Sub-tab variables details list */}
        <div className="space-y-3.5 pt-2">
          {activeTab === "load" && (
            <>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Input Power</span>
                <span className="text-2xs font-extrabold text-amber-400">{loadKw} kW</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Design load</span>
                <span className="text-2xs font-extrabold text-slate-200">{loadResult ? `${loadResult.base} A` : "--"}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Overcurrent limit</span>
                <span className="text-2xs font-extrabold text-emerald-400">{loadResult ? `${loadResult.breaker} A` : "--"}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Conductor Size</span>
                <span className="text-2xs font-extrabold text-amber-400 font-mono">
                  {loadResult ? formatArea(parseFloat(loadResult.cable) || 0, loadResult.cable) : "--"}
                </span>
              </div>
            </>
          )}

          {activeTab === "cable" && (
            <>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Current load</span>
                <span className="text-2xs font-extrabold text-emerald-400">{csAmp} Amps</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Cable Sized</span>
                <span className="text-2xs font-extrabold text-amber-400 font-mono">
                  {csResult ? formatArea(parseFloat(csResult.cable) || 0, csResult.cable) : "--"}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Resistivity (R)</span>
                <span className="text-2xs font-extrabold text-slate-400 font-mono">
                  {csResult ? `${csResult.resistance} Ω/km` : "--"}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Voltage Drop Lost</span>
                <span className={`text-2xs font-extrabold ${csResult?.vdOk ? "text-emerald-405" : "text-rose-450"}`}>
                  {csResult ? `${csResult.lossPct}%` : "--"}
                </span>
              </div>
            </>
          )}

          {activeTab === "vdrop" && (
            <>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Circuit Volts</span>
                <span className="text-2xs font-extrabold text-emerald-400">{vdVolt} V</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Tested Current</span>
                <span className="text-2xs font-extrabold text-slate-200">{vdAmp} A</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Voltage Drop lost</span>
                <span className={`text-2xs font-extrabold ${vdResult?.passed ? "text-emerald-400" : "text-red-400"}`}>
                  {vdResult ? `${vdResult.dropPct}%` : "--"}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Drop Threshold</span>
                <span className="text-2xs font-extrabold text-amber-400 font-mono">
                  {vdResult ? `≤ ${vdResult.limit}%` : "--"}
                </span>
              </div>
            </>
          )}

          {activeTab === "conduit" && (
            <>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Conduit Diam</span>
                <span className="text-2xs font-extrabold text-emerald-400">
                  {cfDiam} mm {isImperial && `(${(cfDiam / 25.4).toFixed(2)}")`}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Cable OD</span>
                <span className="text-2xs font-extrabold text-slate-205">{cfCableOD} mm</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Wire Count</span>
                <span className="text-2xs font-extrabold text-slate-200">{cfWires} Wires</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Result Fill</span>
                <span className={`text-2xs font-extrabold ${cfResult?.passed ? "text-emerald-400" : "text-rose-450"}`}>
                  {cfResult ? `${cfResult.fillPct}%` : "--"}
                </span>
              </div>
            </>
          )}

          {activeTab === "gemini-sizer" && (
            <>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Core AI Agent</span>
                <span className="text-2xs font-extrabold text-indigo-400">Gemini Flash</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Sizing Model</span>
                <span className="text-2xs font-extrabold text-emerald-400 uppercase font-mono">Expert Sizer</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-3xs font-black text-slate-400 uppercase">Prompt state</span>
                <span className="text-2xs font-extrabold text-amber-400">Configured</span>
              </div>
            </>
          )}
        </div>

        {/* Global physical parameters panel */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <span className="text-[10px] font-black text-slate-550 uppercase tracking-widest block leading-none">
            Estimated Mass Index
          </span>
          <div className="space-y-1.5 text-3xs font-semibold leading-relaxed text-slate-400">
            <p>
              Under global sizing regulations, copper weight stands around <strong>8,960 {weightUnit === "kg" ? "kg/m³" : "lbs/yd³"}</strong>, indicating higher mechanical anchoring requirements on vertical wall containment structures.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
