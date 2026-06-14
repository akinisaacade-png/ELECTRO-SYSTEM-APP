/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ELECTRO SYSTEM APP - AI-POWERED TROUBLESHOOTING & SOLUTIONS SECTION
 * Complete interactive troubleshooting module centering hardware design,
 * field diagnostics, power grid simulation, tool links, and AI-driven solutions.
 */

import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  Bot, 
  Layers, 
  Terminal, 
  Sliders, 
  Play, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Search, 
  BookOpen, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  Database,
  Compass,
  ArrowRight,
  Check,
  ChevronRight,
  ChevronLeft,
  Download,
  AlertOctagon,
  Info
} from "lucide-react";

import DiagnosticCockpit from "./DiagnosticCockpit";

interface TroubleshootingSectionProps {
  onAskAI: (prompt: string) => void;
  onNavigateToAssistant?: () => void;
}

type TabType = "cockpit" | "wizard" | "resources" | "solutions";

export default function TroubleshootingSection({ onAskAI, onNavigateToAssistant }: TroubleshootingSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("cockpit");
  const [searchQuery, setSearchQuery] = useState("");
  
  // ==========================================
  // STATE FOR THE 7-STEP INTERACTIVE WORKFLOW
  // ==========================================
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [problemDomain, setProblemDomain] = useState<"pcb" | "field" | "grid">("pcb");
  const [symptoms, setSymptoms] = useState("PCB runs hot near voltage regulator under 8A load");
  const [envTemp, setEnvTemp] = useState(25);
  const [envLoad, setEnvLoad] = useState(80);
  const [envHumidity, setEnvHumidity] = useState(45);

  // Step 2: Safety Isolation
  const [safetyLoto, setSafetyLoto] = useState(false);
  const [safetyPowerOff, setSafetyPowerOff] = useState(false);
  const [safetyMultimeter, setSafetyMultimeter] = useState(false);
  const [safetyArcCheck, setSafetyArcCheck] = useState(false);

  // Step 3: PCB Hardware Inspection
  const [pcbChecked, setPcbChecked] = useState({
    continuity: false,
    polarity: false,
    solderBridges: false,
    voltageRails: false,
    groundLoops: false,
  });

  // Step 4: Motors, Wiring & Field Equipment
  const [fieldChecked, setFieldChecked] = useState({
    looseTerminals: false,
    windingResistance: false,
    overloadRelays: false,
    cableRoute: false,
    thermalImaging: false,
  });
  // Motor Current interactive parameters: I = P / (√3 × V × pf × η)
  const [motorPower, setMotorPower] = useState(15000); // 15 kW
  const [motorVoltage, setMotorVoltage] = useState(415); // 415 V
  const [motorPf, setMotorPf] = useState(0.85); // pf
  const [motorEff, setMotorEff] = useState(0.90); // efficiency
  const [calculatedMotorCurrent, setCalculatedMotorCurrent] = useState<number | null>(null);

  // Step 5: Power Grid Simulation
  const [gridChecked, setGridChecked] = useState({
    vectorGroups: false,
    convergence: false,
    relayCoordination: false,
    faultSimulated: false,
    harmonicsChecked: false,
  });
  // Short circuit current interactive parameters: Isc = V / Z
  const [gridVoltage, setGridVoltage] = useState(11000); // 11 kV
  const [gridImpedance, setGridImpedance] = useState(0.45); // Ohms Z
  const [calculatedIsc, setCalculatedIsc] = useState<number | null>(null);

  // Status effects
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Calculate Motor Current
  useEffect(() => {
    if (motorPower && motorVoltage && motorPf && motorEff) {
      const denom = Math.sqrt(3) * motorVoltage * motorPf * motorEff;
      if (denom > 0) {
        setCalculatedMotorCurrent(motorPower / denom);
      }
    }
  }, [motorPower, motorVoltage, motorPf, motorEff]);

  // Calculate Short Circuit Current
  useEffect(() => {
    if (gridVoltage && gridImpedance > 0) {
      setCalculatedIsc(gridVoltage / gridImpedance);
    } else {
      setCalculatedIsc(null);
    }
  }, [gridVoltage, gridImpedance]);

  const togglePcbChecked = (key: keyof typeof pcbChecked) => {
    setPcbChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFieldChecked = (key: keyof typeof fieldChecked) => {
    setFieldChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGridChecked = (key: keyof typeof gridChecked) => {
    setGridChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isSafetyIsolationComplete = safetyLoto && safetyPowerOff && safetyMultimeter && safetyArcCheck;

  // Tool Links Mappings
  const toolCategories = [
    {
      title: "PCB & Circuit Design",
      items: [
        { name: "KiCad", license: "Free", desc: "PCB design & schematic layout simulation", url: "https://www.kicad.org" },
        { name: "LTspice", license: "Free", desc: "High-fidelity analog circuit simulation", url: "https://www.analog.com/en/resources/design-tools-and-calculators/ltspice-simulator.html" },
        { name: "Altium Designer", license: "Enterprise", desc: "Professional PCB layout & CAD package", url: "https://www.altium.com" }
      ]
    },
    {
      title: "Field Troubleshooting & Diagnostics",
      items: [
        { name: "Fluke Troubleshooting Guides", license: "Enterprise Grade Reference", desc: "Professional testing protocols, standards, and guides", url: "https://www.fluke.com" },
        { name: "Megger Testing Equipment", license: "Enterprise Grade Reference", desc: "Insulation, winding resistance & grid testing instrumentation", url: "https://www.megger.com" },
        { name: "Thermal Imaging (FLIR)", license: "Enterprise Grade Reference", desc: "Thermal performance camera guides & diagnostic imaging software", url: "https://www.flir.com" }
      ]
    },
    {
      title: "Power Grid Simulation",
      items: [
        { name: "OpenDSS", license: "Free", desc: "Distribution system simulator by EPRI", url: "https://smartgrid.epri.com/SimulationTool.aspx" },
        { name: "MATPOWER", license: "Free", desc: "MATLAB/Octave package for power flow studies", url: "https://matpower.org" },
        { name: "ETAP", license: "Enterprise", desc: "Industry-standard transient, load flow, and protection analysis", url: "https://etap.com" },
        { name: "DIgSILENT PowerFactory", license: "Enterprise", desc: "Advanced power system modeling & grid code compliance testing", url: "https://www.digsilent.de" }
      ]
    }
  ];

  // Common Problems + Solutions Data
  const commonProblems = [
    {
      id: "prob-1",
      title: "PCB Overheating",
      category: "Hardware",
      cause: "High current traces, poor copper thickness, regulator overload",
      solution: [
        "Increase copper trace width to match current density constraints or transit to 2oz thickness.",
        "Introduce thermal stitch vias linked to dynamic bottom ground planes.",
        "Transition from linear regulators (LDOs) to high-efficiency switching regulators.",
        "Model dynamic thermal profiles using LTspice waveform thermal-coefficients."
      ]
    },
    {
      id: "prob-2",
      title: "Motor Trips on Overload",
      category: "Field",
      cause: "Undersized supply cable, high mechanical starting torque, voltage phase imbalance",
      solution: [
        "Record physical branch currents and verify phase symmetry within 1.5%.",
        "Benchmark PF (power factor) and η (efficiency) under active operating load.",
        "Resize power supply cabling using standard IEC/NEC sizing lookups.",
        "Examine machinery bearings, alignment, and mechanical couplings for seizure."
      ]
    },
    {
      id: "prob-3",
      title: "Voltage Drop in Long Cable Runs",
      category: "Field",
      cause: "Undersized copper or aluminum conductor across distances exceeding 50m",
      solution: [
        "Apply standard calculation: VD = (2 × L × I × R_cable) / 1000.",
        "Upgrade conductor cross-sectional diameter (AWG / mm²) to stay under 3% drop limit.",
        "Utilize a higher distribution nominal voltage and step down locally."
      ]
    },
    {
      id: "prob-4",
      title: "Grid Simulation Not Converging",
      category: "Grid",
      cause: "Incorrect substation transformer vector groupings, impedance metrics, or overloaded load models",
      solution: [
        "Cross-reference and validate per-unit impedance database parameters.",
        "Modify mathematical solver tolerances, maximum iterations, or step sizes.",
        "Coordinate parallel validations using free OpenDSS or MATPOWER solvers."
      ]
    },
    {
      id: "prob-5",
      title: "Breaker Trips During Motor Start",
      category: "Field / Protection",
      cause: "High transient motor inrush current triggering electromagnetic protection loops",
      solution: [
        "Replace short-delay breakers with slow Type D/motor-rated inverse curve units.",
        "Integrate solid-state soft starters or dynamic variable frequency drives (VFD).",
        "Verify motor protection relay coordination parameters against start curves."
      ]
    }
  ];

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Build the detailed prompt for the AI Assistant
  const handleAskAIWithContext = () => {
    let contextString = `I am running the step-by-step diagnostic workflow inside ELECTRO SYSTEM APP. Here's my collected case file:\n`;
    contextString += `1. Problem Domain: ${problemDomain.toUpperCase()}\n`;
    contextString += `2. Documented Symptoms: ${symptoms}\n`;
    contextString += `3. Environment conditions: Temp ${envTemp}°C, Load ${envLoad}%, Humidity ${envHumidity}%\n`;
    contextString += `4. Electrical Safety Isolation: ${isSafetyIsolationComplete ? "COMPLETED AND VERIFIED (Safe)" : "NOT FULLY ISOLATED (Caution Needed)"}\n`;
    
    if (problemDomain === "pcb") {
      contextString += `5. Hardware Check statuses: Polarity=${pcbChecked.polarity}, Solder Bridges=${pcbChecked.solderBridges}, Rails=${pcbChecked.voltageRails}, Ground Loops=${pcbChecked.groundLoops}\n`;
    } else if (problemDomain === "field") {
      contextString += `5. Field metrics: Motor power rating=${motorPower / 1000}kW, Voltage=${motorVoltage}V, pf=${motorPf}, eff=${motorEff}. Calculated Motor Current: ${calculatedMotorCurrent?.toFixed(2)}A.\n`;
      contextString += `   Field checklists: Terminals ok=${fieldChecked.looseTerminals}, Winding isolation verified=${fieldChecked.windingResistance}, VFD/relays=${fieldChecked.overloadRelays}\n`;
    } else {
      contextString += `5. Grid simulation parameters: Nominal Voltage=${gridVoltage}V, System Impedance Z=${gridImpedance} Ohms. Calculated Short-Circuit current Isc: ${calculatedIsc?.toFixed(2)}A.\n`;
      contextString += `   Checklists: Vector groups valid=${gridChecked.vectorGroups}, Convergent solver=${gridChecked.convergence}, Protection coordination gap checked=${gridChecked.relayCoordination}\n`;
    }

    contextString += `\nPlease provide a highly concise professional solution including component ratings, wire sizing, simulation code parameters, and national electrical codes (e.g., NEC, IEC, CEC, BS 7671, or AS/NZS 3000) corresponding to this context.`;
    
    onAskAI(contextString);
    if (onNavigateToAssistant) {
      onNavigateToAssistant();
    }
  };

  // Generate downloadable txt report content
  const handleDownloadReport = () => {
    let report = `AI POWERED ELECTRICAL ENGINEERING TROUBLESHOOTING REPORT\n`;
    report += `========================================================\n`;
    report += `Generated via ELECTRO SYSTEM APP - Diagnostics Suite\n`;
    report += `Timestamp: ${new Date().toISOString()}\n\n`;
    report += `1. IDENTIFY THE PROBLEM DOMAIN\n`;
    report += `------------------------------\n`;
    report += `Domain: ${problemDomain.toUpperCase()}\n`;
    report += `Symptoms: ${symptoms}\n`;
    report += `Environmental Conditions:\n`;
    report += `  - Ambient Temp: ${envTemp} °C\n`;
    report += `  - System Active Load: ${envLoad} %\n`;
    report += `  - Relative Humidity: ${envHumidity} %\n\n`;

    report += `2. ELECTRICAL SAFETY ISOLATION STATUS\n`;
    report += `-------------------------------------\n`;
    report += `  [${safetyPowerOff ? "X" : " "}] Disconnect power at source\n`;
    report += `  [${safetyMultimeter ? "X" : " "}] Verify zero voltage using multimeter\n`;
    report += `  [${safetyLoto ? "X" : " "}] Apply lockout/tagout (LOTO) procedures\n`;
    report += `  [${safetyArcCheck ? "X" : " "}] Inspect for burning smell, discoloration, or arcing marks\n`;
    report += `Status: ${isSafetyIsolationComplete ? "VERIFIED SAFE" : "UNSAFE / INCOMPLETE Isolation"}\n\n`;

    if (problemDomain === "pcb") {
      report += `3. PCB / HARDWARE DESIGN CHECKLIST\n`;
      report += `----------------------------------\n`;
      report += `  Continuity Measured: ${pcbChecked.continuity ? "PASS" : "PENDING/FAIL"}\n`;
      report += `  Polarity Verified: ${pcbChecked.polarity ? "PASS" : "PENDING/FAIL"}\n`;
      report += `  Solder Bridges Inspected: ${pcbChecked.solderBridges ? "PASS" : "PENDING/FAIL"}\n`;
      report += `  Voltage Rails Checked: ${pcbChecked.voltageRails ? "PASS" : "PENDING/FAIL"}\n`;
      report += `  Ground Loops Checked: ${pcbChecked.groundLoops ? "PASS" : "PENDING/FAIL"}\n`;
    } else if (problemDomain === "field") {
      report += `4. MOTORS, WIRING & FIELD EQUIPMENT\n`;
      report += `------------------------------------\n`;
      report += `  Loose Terminals/Burnt Contacts Checked: ${fieldChecked.looseTerminals ? "PASS" : "PENDING"}\n`;
      report += `  Winding Resistance Measured: ${fieldChecked.windingResistance ? "PASS" : "PENDING"}\n`;
      report += `  Overload Relays/Contactors Inspected: ${fieldChecked.overloadRelays ? "PASS" : "PENDING"}\n`;
      report += `  Cable Routing Check: ${fieldChecked.cableRoute ? "PASS" : "PENDING"}\n`;
      report += `  Thermal Imaging/Hotspots Inspected: ${fieldChecked.thermalImaging ? "PASS" : "PENDING"}\n`;
      report += `  Motor Specifications:\n`;
      report += `    - Power P: ${motorPower} W\n`;
      report += `    - Voltage V: ${motorVoltage} V\n`;
      report += `    - Power Factor pf: ${motorPf}\n`;
      report += `    - Efficiency η: ${motorEff}\n`;
      report += `    - Calculated Current I = P / (√3 * V * pf * η): ${calculatedMotorCurrent?.toFixed(3)} Amps\n`;
    } else if (problemDomain === "grid") {
      report += `5. POWER GRID OR SYSTEM SIMULATION STATUS\n`;
      report += `-----------------------------------------\n`;
      report += `  Transformer Vector Groups Validated: ${gridChecked.vectorGroups ? "YES" : "PENDING"}\n`;
      report += `  Load Flow Convergence Debugged: ${gridChecked.convergence ? "YES" : "PENDING"}\n`;
      report += `  Relay Coordination Settings Checked: ${gridChecked.relayCoordination ? "YES" : "PENDING"}\n`;
      report += `  Simulated Fault Scenarios Configured: ${gridChecked.faultSimulated ? "YES" : "PENDING"}\n`;
      report += `  Harmonic Distortion & Voltage Unbalance: ${gridChecked.harmonicsChecked ? "YES" : "PENDING"}\n`;
      report += `  Grid Parameters:\n`;
      report += `    - Line Voltage V: ${gridVoltage} V\n`;
      report += `    - Impedance Z: ${gridImpedance} Ohms\n`;
      report += `    - Calculated Short-Circuit Isc = V / Z: ${calculatedIsc?.toFixed(3)} Amps\n`;
    }

    report += `\n6. AI RECOMMENDED REMEDIATION INSTRUCTIONS\n`;
    report += `-------------------------------------------\n`;
    report += `Submit the case file to ELECTRO SYSTEM APP AI Assistant to compile compliant electrical drawings, code sizing charts (NEC Table 310.16, BS 7671, etc.)\n`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `electro_troubleshoot_report_${problemDomain}.txt`;
    link.click();
  };

  const filteredProblems = commonProblems.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.cause.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="troubleshooting-module">
      {/* Header Panel */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none select-none">
          <Wrench className="w-48 h-48 text-indigo-400 rotate-12" />
        </div>
        <div className="relative max-w-3xl space-y-3 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-xs font-semibold text-amber-300">
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Powered Electrical Engineering Diagnosis Suite</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Diagnostics, Faults &amp; Troubleshooting
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            A universal step-by-step diagnostic roadmap built for power system simulation, 
            hardware PCB routing verification, and field maintenance algorithms.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("cockpit")}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition outline-none cursor-pointer ${
            activeTab === "cockpit"
              ? "border-amber-400 text-amber-500 dark:text-amber-400 font-black"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Multi-Agent Cockpit 🤖</span>
        </button>
        <button
          onClick={() => setActiveTab("wizard")}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition outline-none cursor-pointer ${
            activeTab === "wizard"
              ? "border-amber-400 text-amber-500 dark:text-amber-400 font-black"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>7-Step Diagnostic Workflow</span>
        </button>
        <button
          onClick={() => setActiveTab("resources")}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition outline-none cursor-pointer ${
            activeTab === "resources"
              ? "border-amber-400 text-amber-500 dark:text-amber-400 font-black"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Useful Tools &amp; Solutions</span>
        </button>
        <button
          onClick={() => setActiveTab("solutions")}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition outline-none cursor-pointer ${
            activeTab === "solutions"
              ? "border-amber-400 text-amber-500 dark:text-amber-400 font-black"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>AI Knowledge Base</span>
        </button>
      </div>

      {/* TABS VIEWPORT */}
      {activeTab === "cockpit" && (
        <DiagnosticCockpit 
          onAskAI={onAskAI} 
          onNavigateToAssistant={onNavigateToAssistant} 
        />
      )}

      {activeTab === "wizard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Step Selector Left Rail */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-slate-50 dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider mb-2">
                Universal Diagnostic Roadmap
              </span>
              <div className="space-y-1">
                {[
                  { num: 1, label: "Identify Domain", tag: "Start Here" },
                  { num: 2, label: "Safety Isolation", tag: "Critical" },
                  { num: 3, label: "PCB / Hardware Design", tag: "Circuits" },
                  { num: 4, label: "Motors & Field Equipment", tag: "Field" },
                  { num: 5, label: "Power Grid & System Sim", tag: "Grid Flow" },
                  { num: 6, label: "Generate AI Solutions", tag: "Recommended" },
                  { num: 7, label: "Verify, Test & Document", tag: "Complete" },
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => setCurrentStep(s.num)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition text-xs font-semibold cursor-pointer ${
                      currentStep === s.num
                        ? "bg-slate-900 dark:bg-slate-950 border-slate-800 text-white shadow-sm font-extrabold"
                        : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-3xs font-black ${
                        currentStep === s.num ? "bg-amber-400 text-slate-950" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {s.num}
                      </span>
                      <span>{s.label}</span>
                    </div>
                    <span className="text-4xs uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                      {s.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnostic State Tracker Panel */}
            <div className="bg-gradient-to-br from-indigo-500/5 to-amber-500/5 dark:from-indigo-500/10 dark:to-amber-500/10 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-extrabold text-[11px] uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Case Status Dashboard
                </span>
              </div>
              <div className="space-y-2 text-3xs font-medium text-slate-600 dark:text-slate-350">
                <div className="flex justify-between">
                  <span>Current Scope:</span>
                  <span className="font-bold text-slate-800 dark:text-white uppercase">{problemDomain}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Safety Isolation:</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    isSafetyIsolationComplete 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : "bg-red-500/10 text-red-500 animate-pulse"
                  }`}>
                    {isSafetyIsolationComplete ? "Safe to Touch" : "Safety Alert"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Motor Amps Dynamic Estimate:</span>
                  <span className="font-mono font-bold text-indigo-400">{calculatedMotorCurrent?.toFixed(1) || "0.0"} A</span>
                </div>
                <div className="flex justify-between">
                  <span>Calculated Isc Short Circuit:</span>
                  <span className="font-mono font-bold text-amber-500">{(calculatedIsc ? calculatedIsc / 1000 : 0).toFixed(2)} kA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step Detail Content Panel (7 Steps) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-3xl min-h-[480px] flex flex-col justify-between">
            <div>
              {/* Step 1: Identify Domain */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-sm">
                      1
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 dark:text-white">
                        Identify the Problem Domain
                      </h2>
                      <p className="text-3xs text-slate-500 dark:text-slate-400">
                        Classify the failure parameters before engaging high-voltage circuits.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "pcb", label: "PCB / Circuit Design", desc: "Integrity, voltage rails, solder" },
                      { key: "field", label: "Field / Motors / Wiring", desc: "Coils, insulation, thermal" },
                      { key: "grid", label: "Power Grid / System", desc: "Load flow, transformer vector" }
                    ].map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setProblemDomain(d.key as any)}
                        className={`p-3.5 rounded-xl border text-left transition ${
                          problemDomain === d.key
                            ? "border-amber-400 bg-amber-450/10 dark:bg-amber-450/5 text-amber-900 dark:text-amber-100"
                            : "border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                        }`}
                      >
                        <span className="font-bold text-xs block">{d.label}</span>
                        <span className="text-[10px] text-slate-500 mt-1 block leading-tight">{d.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-3xs font-extrabold uppercase text-slate-500 dark:text-slate-400 block">
                      Gather Symptoms (Tripping, overheating, arcing, incorrect readings)
                    </label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      rows={3}
                      className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                      placeholder="List symptom behaviors..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-3xs font-extrabold text-slate-450 uppercase block">Ambient Temp (°C)</span>
                      <input
                        type="number"
                        value={envTemp}
                        onChange={(e) => setEnvTemp(parseInt(e.target.value) || 25)}
                        className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-850 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-3xs font-extrabold text-slate-450 uppercase block">System Load (%)</span>
                      <input
                        type="number"
                        value={envLoad}
                        onChange={(e) => setEnvLoad(parseInt(e.target.value) || 80)}
                        className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-850 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-3xs font-extrabold text-slate-450 uppercase block">Humidity (%)</span>
                      <input
                        type="number"
                        value={envHumidity}
                        onChange={(e) => setEnvHumidity(parseInt(e.target.value) || 45)}
                        className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-850 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Electrical Safety Isolation */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-sm">
                      2
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                        Critical Electrical Safety Isolation
                      </h2>
                      <p className="text-3xs text-slate-500 dark:text-slate-400">
                        Always isolate power and execute LOTO procedures before physical testing.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl flex items-start gap-3">
                    <AlertOctagon className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs block">MANDATORY ISOLATION CRITERIA</span>
                      <span className="text-[10px] block text-red-700 dark:text-red-300 leading-normal font-semibold">
                        Confirm every safety directive. Touched equipment carries life-threatening voltage hazards. Verify isolate indicators physically.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { checked: safetyPowerOff, setChecked: setSafetyPowerOff, label: "Disconnect electrical power at primary breaker/source." },
                      { checked: safetyMultimeter, setChecked: setSafetyMultimeter, label: "Verify zero voltage physically using dual probes of a certified multimeter." },
                      { checked: safetyLoto, setChecked: setSafetyLoto, label: "Apply Lockout/Tagout (LOTO) structures to protect active switchboards." },
                      { checked: safetyArcCheck, setChecked: setSafetyArcCheck, label: "Inspect enclosure visually for signs of arcing, heat damage, or burnt insulation odors." }
                    ].map((chk, i) => (
                      <label
                        key={i}
                        className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100/70"
                      >
                        <input
                          type="checkbox"
                          checked={chk.checked}
                          onChange={() => chk.setChecked(!chk.checked)}
                          className="h-4 w-4 mt-0.5 rounded accent-red-650"
                        />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{chk.label}</span>
                      </label>
                    ))}
                  </div>

                  {isSafetyIsolationComplete ? (
                    <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 text-[11px] font-black rounded-xl text-center uppercase tracking-wider">
                      ★ Active System Safe for Circuit Diagnostics
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-500/15 border border-amber-500/20 text-amber-600 text-[11px] font-black rounded-xl text-center uppercase tracking-wider">
                      ⚠ Locked - Complete Safe Isolation Parameters
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: PCB Hardware Design Issues */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-sm">
                      3
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 dark:text-white">
                        PCB &amp; Hardware Circuit Design Issues
                      </h2>
                      <p className="text-3xs text-slate-500 dark:text-slate-400">
                        Check continuity, power rail stability, and footprint traces.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <span className="text-3xs font-extrabold uppercase text-slate-500 block">PCB Diagnostic Verification Checklist</span>
                      <div className="space-y-2">
                        {[
                          { key: "continuity", label: "Inspect physical traces for hairline cracks or shorts" },
                          { key: "polarity", label: "Test structural components, diodes, or capacitor polarities" },
                          { key: "solderBridges", label: "Verify solder bridges under microscopes" },
                          { key: "voltageRails", label: "Measure active voltage rails stability (3.3V, 5V, 12V)" },
                          { key: "groundLoops", label: "Audit analog-digital ground pathways for loops" }
                        ].map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-805 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={pcbChecked[item.key as keyof typeof pcbChecked]}
                              onChange={() => togglePcbChecked(item.key as any)}
                              className="accent-indigo-500 h-3.5 w-3.5"
                            />
                            <span className="text-3xs font-bold text-slate-700 dark:text-slate-350">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                      <span className="text-3xs font-extrabold uppercase text-slate-500 block">Actionable Redesign Parameters</span>
                      <p className="text-3xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                        Isolate MOSFETs, low drop regulators, and gate drivers. When highcurrent profiles exceed 4A limits, broaden PCB track routing. Ensure analog components use a separate quiet star ground feed.
                      </p>
                      
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-850 space-y-2">
                        <span className="text-4xs font-bold text-indigo-400 block uppercase font-mono">Suggested Design Toolchains:</span>
                        <div className="flex gap-2">
                          <a href="https://www.kicad.org" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 text-3xs font-black rounded text-indigo-500 hover:bg-slate-100 flex items-center gap-1">
                            KiCad <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <a href="https://www.analog.com/en/resources/design-tools-and-calculators/ltspice-simulator.html" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 text-3xs font-black rounded text-indigo-500 hover:bg-slate-100 flex items-center gap-1">
                            LTspice <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Motors, Wiring & Field Equipment */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-sm">
                      4
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 dark:text-white">
                        Motors, Wiring &amp; Field Equipment
                      </h2>
                      <p className="text-3xs text-slate-500 dark:text-slate-400">
                        Diagnose real mechanical motor drives, VFDs, and branch cabling.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-3xs font-extrabold uppercase text-slate-500 block">Field Electrical Checklist</span>
                      <div className="space-y-1.5">
                        {[
                          { key: "looseTerminals", label: "Check loose screw connections & contact oxide" },
                          { key: "windingResistance", label: "Evaluate insulation & winding phase resistance" },
                          { key: "overloadRelays", label: "Inspect contactors and VFD output parameters" },
                          { key: "cableRoute", label: "Audit physical wiring paths for moisture/arcing stress" },
                          { key: "thermalImaging", label: "Run Thermal imaging tests to locate resistive bottlenecks" },
                        ].map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-801 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={fieldChecked[item.key as keyof typeof fieldChecked]}
                              onChange={() => toggleFieldChecked(item.key as any)}
                              className="accent-indigo-500 h-3.5 w-3.5"
                            />
                            <span className="text-3xs font-bold text-slate-700 dark:text-slate-350">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Integrated Calculator */}
                    <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/25 p-4 rounded-2xl space-y-3">
                      <span className="text-3xs font-black uppercase text-indigo-500 block">
                        Interactive Motor FLA Calculator
                      </span>
                      <div className="text-[10px] font-mono text-slate-400 block bg-slate-950/80 p-1.5 rounded text-center">
                        I = P / (√3 × V × pf × η)
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-4xs font-bold">
                        <div>
                          <span>Active Power (P, Watts)</span>
                          <input
                            type="number"
                            value={motorPower}
                            onChange={(e) => setMotorPower(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded font-mono text-xs text-indigo-400 font-extrabold"
                          />
                        </div>
                        <div>
                          <span>Nominal Volt (V)</span>
                          <input
                            type="number"
                            value={motorVoltage}
                            onChange={(e) => setMotorVoltage(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded font-mono text-xs text-indigo-400 font-extrabold"
                          />
                        </div>
                        <div>
                          <span>Power Factor (pf)</span>
                          <input
                            type="number"
                            step="0.01"
                            value={motorPf}
                            onChange={(e) => setMotorPf(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded font-mono text-xs text-indigo-400 font-extrabold"
                          />
                        </div>
                        <div>
                          <span>Efficiency (η)</span>
                          <input
                            type="number"
                            step="0.01"
                            value={motorEff}
                            onChange={(e) => setMotorEff(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded font-mono text-xs text-indigo-400 font-extrabold"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Estimated current load:</span>
                        <span className="font-mono text-sm font-black text-amber-400">
                          {calculatedMotorCurrent ? `${calculatedMotorCurrent.toFixed(2)} Amps F.L.A` : "Error"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Power Grid Simulation */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-sm">
                      5
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 dark:text-white">
                        Power Grid &amp; System Simulation
                      </h2>
                      <p className="text-3xs text-slate-500 dark:text-slate-400">
                        Coordinate relays, check load flow, and simulate grid short-circuits.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-3xs font-extrabold uppercase text-slate-500 block">Simulation Verification</span>
                      <div className="space-y-1.5">
                        {[
                          { key: "vectorGroups", label: "Validate substation transformer windings & grounding configurations" },
                          { key: "convergence", label: "Debug load flow non-convergence in Newton Raphson loops" },
                          { key: "relayCoordination", label: "Inspect active protection relays coordination limits" },
                          { key: "faultSimulated", label: "Compute balanced & unbalanced short-circuit current faults" },
                          { key: "harmonicsChecked", label: "Verify voltage imbalance & structural aggregate harmonics" },
                        ].map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-801 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={gridChecked[item.key as keyof typeof gridChecked]}
                              onChange={() => toggleGridChecked(item.key as any)}
                              className="accent-indigo-500 h-3.5 w-3.5"
                            />
                            <span className="text-3xs font-bold text-slate-700 dark:text-slate-350">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Short circuit calculator */}
                    <div className="bg-gradient-to-br from-indigo-500/5 to-amber-500/5 border border-indigo-500/25 p-4 rounded-2xl space-y-3">
                      <span className="text-3xs font-black uppercase text-indigo-500 block">
                        Symmetrical Short-Circuit Calculator
                      </span>
                      <div className="text-[10px] font-mono text-slate-400 block bg-slate-950/80 p-1.5 rounded text-center">
                        I_sc = V / Z
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-4xs font-bold">
                        <div>
                          <span>System Voltage (V)</span>
                          <input
                            type="number"
                            value={gridVoltage}
                            onChange={(e) => setGridVoltage(parseInt(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded font-mono text-xs text-indigo-400 font-extrabold"
                          />
                        </div>
                        <div>
                          <span>Loop Impedance Z (Ohms)</span>
                          <input
                            type="number"
                            step="0.01"
                            value={gridImpedance}
                            onChange={(e) => setGridImpedance(parseFloat(e.target.value) || 0.1)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded font-mono text-xs text-indigo-400 font-extrabold"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Short Circuit Current Isc:</span>
                        <span className="font-mono text-xs font-black text-amber-400">
                          {calculatedIsc ? `${(calculatedIsc / 1000).toFixed(3)} kA` : "Error"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Generate AI Powered Solutions */}
              {currentStep === 6 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-sm">
                      6
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 dark:text-white">
                        Generate AI Powered Solution
                      </h2>
                      <p className="text-3xs text-slate-500 dark:text-slate-400">
                        Synthesize interactive engineering prompts and load recommendations directly into our assistant.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">Active Case Data File Draft</span>
                    </div>
                    
                    <p className="text-3xs text-slate-600 dark:text-slate-400 leading-normal font-medium">
                      Pressing the button below loads your diagnostic checklists, ambient temperature levels, calculations, and safely verified states directly to the ELECTRO SYSTEM APP Assistant. This lets the LLM automatically research electrical standards (such as NEC tables, BS 7671 calculations, or IEC protocols) and provide validated corrections.
                    </p>

                    <button
                      type="button"
                      onClick={handleAskAIWithContext}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition"
                    >
                      <Bot className="w-4 h-4 animate-bounce" />
                      <span>Dispatch Checklist Data To AI Companion</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 7: Verify, Test & Document */}
              {currentStep === 7 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
                      7
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Verify, Test &amp; Document Results
                      </h2>
                      <p className="text-3xs text-slate-500 dark:text-slate-400">
                        Perform final commissioning and export the engineering validation log files.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="font-bold text-xs text-slate-800 dark:text-white">Commissioning Steps</span>
                    </div>

                    <div className="text-3xs text-slate-600 dark:text-slate-400 space-y-2 font-medium">
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                        <span>Re-test circuits, active motors, or load models strictly while operating under continuous nominal load.</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                        <span>Validate thermal performance, insulation integrity, and safety enclosure LOTO standards.</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                        <span>Produce official test reports, safety commissioning sheets, and periodic maintenance records.</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadReport}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-amber-400 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Engineering Diagnostic Log (.txt)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Controls */}
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800/80 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 font-bold text-xs uppercase tracking-wider rounded-lg text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Step</span>
              </button>
              
              <span className="text-3xs font-mono font-bold text-slate-405">
                Step {currentStep} of 7
              </span>

              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
                disabled={currentStep === 7}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABS RESOURCE VIEW */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-4">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-xs block text-slate-800 dark:text-white uppercase">Diagnostic Tools Repository</span>
              <p className="text-3xs text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                This database maps essential free, open-source, and industrial-grade software utilities designed specifically 
                to simulate high-speed PCB layouts, compute complex load flows, or conduct insulation resistance tests on physical hardware.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {toolCategories.map((cat, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm">
                <span className="text-[11px] font-black uppercase text-slate-500 dark:text-amber-400 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2 block tracking-wider font-mono">
                  {cat.title}
                </span>

                <div className="space-y-4">
                  {cat.items.map((it, idx) => (
                    <div key={idx} className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">{it.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${
                            it.license === "Free" 
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15" 
                              : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/15"
                          }`}>
                            {it.license}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                          {it.desc}
                        </p>
                      </div>

                      <div className="pt-2">
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-550 dark:text-indigo-400 uppercase tracking-wider hover:underline"
                        >
                          <span>Visit Website</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABS PROBLEMS & AI KNOWLEDGE VIEW */}
      {activeTab === "solutions" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl px-4 py-2 w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none w-full font-semibold"
                placeholder="Search common faults, causes & solutions..."
              />
            </div>
            <span className="text-3xs text-slate-450 font-mono">
              Filtered: {filteredProblems.length} diagnostic solutions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProblems.map((prob) => (
              <div
                key={prob.id}
                className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-450 px-2 py-0.5 rounded uppercase">
                      {prob.category}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {prob.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      let copytext = `PROBLEM: ${prob.title}\nCause: ${prob.cause}\nSolutions:\n` + prob.solution.map(s => `- ${s}`).join("\n");
                      handleCopy(copytext, prob.id);
                    }}
                    className="p-1 px-2 text-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 rounded font-bold cursor-pointer"
                  >
                    {copiedText === prob.id ? "Copied!" : "Copy Details"}
                  </button>
                </div>

                <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] uppercase font-bold text-red-500">Probable Cause:</span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
                    {prob.cause}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-emerald-500">AI Generated Solution Protocol:</span>
                  <div className="text-3xs text-slate-650 dark:text-slate-400 space-y-1.5 pl-1">
                    {prob.solution.map((sol, index) => (
                      <div key={index} className="flex items-start gap-2 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{sol}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-110 dark:border-slate-800">
                  <button
                    onClick={() => {
                      let promptToAsk = `I have encountered the dynamic issue regarding "${prob.title}". Related Cause: ${prob.cause}. Please details all sizing and mitigation guides.`;
                      onAskAI(promptToAsk);
                      if (onNavigateToAssistant) onNavigateToAssistant();
                    }}
                    className="text-[10px] font-extrabold text-indigo-500 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Execute Full AI Study &amp; Code Checks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProblems.length === 0 && (
            <div className="text-center py-10 bg-slate-50 dark:bg-indigo-950/5 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
              <span className="text-slate-400 text-xs italic block font-semibold">
                No indexed solutions match your search terminology.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Global Fail-Safe Core Strategy Banner */}
      <div className="p-5 bg-gradient-to-br from-indigo-500/5 to-indigo-650/15 border border-indigo-500/25 rounded-3xl space-y-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-500" />
          <span className="font-black text-xs uppercase tracking-widest text-indigo-650 dark:text-indigo-400">
            ✅ Universal Diagnostic Core Protocol
          </span>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
          For any complex hardware or field anomalies, proceed step-by-step. Conduct rigorous safe isolation first, 
          verify local circuit behaviors using free toolcharts like LTspice, and compare transient models with MATPOWER or OpenDSS. 
          Combine simulated parameters directly into high-fidelity AI tools to establish total regulatory standard compliance.
        </p>
      </div>
    </div>
  );
}
