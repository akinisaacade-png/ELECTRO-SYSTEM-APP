/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ELECTRO SYSTEM APP - ENGINEERING KNOWLEDGE LIBRARY
 * 1.1 Electrical installations module
 * 1.2 Wiring systems module
 * 1.3 Electrical services module
 * 2. Ready-made dynamic prompt templates with interactive parameters
 * 3. Document structure & knowledge packs
 * 4. Useful external links
 */

import React, { useState } from "react";
import { 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  Layers, 
  Link2, 
  Sparkles, 
  Copy, 
  Zap, 
  Cable, 
  Wrench, 
  CheckCircle2, 
  Compass, 
  PenTool, 
  Workflow, 
  ExternalLink,
  Sliders,
  AlertTriangle,
  Lightbulb,
  Building,
  Activity,
  ArrowRight,
  Bot
} from "lucide-react";

interface EngineeringLibraryProps {
  activeRegion: string;
  onApplyPromptSizer: (prompt: string, mode: "parameters" | "text") => void;
  onTrackAction: (actionType: string) => void;
}

export default function EngineeringLibrary({ activeRegion, onApplyPromptSizer, onTrackAction }: EngineeringLibraryProps) {
  const [activeTab, setActiveTab] = useState<"installations" | "wiring" | "services" | "prompts" | "units-symbols" | "references">("installations");
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Sub-tab selection for Units, Symbols & AI Agent
  const [unitsActiveSubTab, setUnitsActiveSubTab] = useState<"playground" | "database" | "formulas" | "spec">("playground");
  
  // Simulated Agent Routing states
  const [routingQuery, setRoutingQuery] = useState("Size a cable for a 12 kW motor, 400 V, 3 phase, 30 m away.");
  const [routingSimulating, setRoutingSimulating] = useState(false);
  const [routingLogs, setRoutingLogs] = useState<string[]>([]);
  const [routingOutput, setRoutingOutput] = useState<any>(null);

  // Unit converter selection
  const [convertFrom, setConvertFrom] = useState("kW");
  const [convertTo, setConvertTo] = useState("kVA");
  const [convertValue, setConvertValue] = useState("15");
  const [convertResult, setConvertResult] = useState<any>(null);

  // Formula sandboxes
  const [ohmsLaw, setOhmsLaw] = useState({ current: 15, resistance: 8 });
  const [phasePower, setPhasePower] = useState({ voltage: 400, current: 25, pf: 0.85 });
  const [vdCalc, setVdCalc] = useState({ length: 45, load: 35, size: 10 }); // mm2 (sizes range e.g. 1.5, 2.5, 4, 6, 10, 16, 25, 35...)

  // Dynamic state for interactive prompt parameter builders
  const [promptParams, setPromptParams] = useState({
    residential: {
      location: activeRegion || "US",
      supply: "single phase, 240V, 60Hz",
      loads: "50A continuous HVAC, five 15A general purpose branch circuits",
      installation: "buried PVC conduit"
    },
    routing: {
      buildingType: "Commercial Office Complex",
      floors: "4 floors",
      equipment: "Main Distribution Frame ground level, three sub-board shafts",
      constraints: "Strict ceiling clearance limitations, dry ceiling plenum rating safety rules"
    },
    services: {
      buildingSize: "Medium Industrial Warehouse, 45,000 sq.ft.",
      incomingSupply: "500 kVA, 480V three-phase sub-grid transformer",
      criticalLoads: "Critical cold-chain vaccine storages, 120HP motor starters"
    }
  });

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(id);
    setTimeout(() => setCopiedPrompt(null), 2000);
    onTrackAction("copy_prompt_template");
  };

  const updateParam = (type: "residential" | "routing" | "services", key: string, value: string) => {
    setPromptParams(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value
      }
    }));
  };

  // Compile the interactive prompts
  const residentialPromptText = `You are an electrical design assistant. Design a residential final circuit for the following load description: – Location: ${promptParams.residential.location} – Supply: ${promptParams.residential.supply} – Loads: ${promptParams.residential.loads} – Cable installation method: ${promptParams.residential.installation}
Tasks:
1. Estimate design current.
2. Select cable size considering current carrying capacity, grouping, and ambient temperature.
3. Check voltage drop against the recommended limit.
4. Propose protective device rating and type.
5. Summarize the design in a clear table.`;

  const routingPromptText = `You are an electrical site engineer. Propose a cable routing and containment solution for the following project: – Building type: ${promptParams.routing.buildingType} – Number of floors: ${promptParams.routing.floors} – Main equipment locations: ${promptParams.routing.equipment} – Constraints: ${promptParams.routing.constraints}
Provide:
1. Recommended containment types (tray, ladder, trunking, conduit).
2. Suggested routing paths (horizontally and vertically).
3. Notes on segregation of power and data.
4. Fire stopping and penetration considerations.`;

  const servicesPromptText = `You are an electrical systems planner. For the following building, outline the LV distribution and key services: – Building type and size: ${promptParams.services.buildingSize} – Incoming supply: ${promptParams.services.incomingSupply} – Critical loads: ${promptParams.services.criticalLoads}
Provide:
1. Single line diagram description (textual).
2. List of main switchboards and distribution boards.
3. Backup power concept (generator/UPS/none).
4. Key services (lighting, small power, HVAC, special systems).
5. Recommended testing and commissioning steps.`;

  const runSimulatedRouting = (queryText: string) => {
    setRoutingSimulating(true);
    setRoutingQuery(queryText);
    setRoutingLogs([]);
    setRoutingOutput(null);

    const logsList: string[] = [];
    const addLog = (msg: string, delay: number) => {
      setTimeout(() => {
        setRoutingLogs(prev => [...prev, msg]);
      }, delay);
    };

    addLog("⚡ [ORCHESTRATOR] Received engineering-grade prompt request.", 200);
    addLog("🔍 [ORCHESTRATOR] Analyzing natural text intent and extracting electrical criteria...", 600);

    const text = queryText.toLowerCase();

    if (text.includes("size a cable") || text.includes("12 kw motor") || text.includes("12kw") || text.includes("motor")) {
      addLog("🎯 [ROUTING] 'Cable Sizing' intent detected. Activating: Cable Sizing Engine.", 1000);
      addLog("🔄 [SUB-ROUTING] Cable Sizing Engine invokes Formula Engine for continuous load parameters.", 1400);
      addLog("📝 [FORMULA] Three-Phase Active Power: P = √3 * V * I * pf\n   Re-arranged FLC equation: I = P / (√3 * V * pf) = 12,000 W / (1.732 * 400 V * 0.85) = 20.38 Amperes.", 1800);
      addLog("🔥 [CABLE SIZING] Applying continuous loading multiplier (1.25x per NEC 215.2) => 20.38 A * 1.25 = 25.48 A design current.", 2205);
      addLog("📊 [STANDARDS] Verifying ampacity tables (IEC 60364-5-52 table / NEC Table 310.15(B)(16)). Copper THHN insulation selected.", 2600);
      addLog("📐 [FORMULA] Estimating Voltage Drop over 30 m distance using R = 4.61 Ω/km for 4 mm² wire...", 3000);
      addLog("🎬 [ROUTING] Invoking Diagram Generator to draft structural single-line diagram.", 3400);
      addLog("✅ [ORCHESTRATOR] Merging sub-engine payloads and outputting engineering-grade design result...", 3800);

      setTimeout(() => {
        setRoutingOutput({
          title: "Complete Cable Sizing & Containment Design",
          toolMatched: "Cable Sizing Engine (Coordinated with Formula Engine & Diagram Generator)",
          description: "Full sizing calculation for a 12 kW dynamic load at 400V three-phase, located 30 meters away.",
          data: [
            { label: "Nominal FLC Current", value: "20.38 A" },
            { label: "Design Guard Current (1.25x)", value: "25.48 A" },
            { label: "Optimal Cable size", value: "4 mm² Copper, THHN insulation rating" },
            { label: "Protective Device", value: "3-Pole 30 Amp trip Overcurrent protection" },
            { label: "Calculated Voltage Drop", value: "0.85 Volts drop (0.21% voltage loss) - Well within 3% limit!" },
            { label: "Conduit Standard Fill", value: "24.6% Fill factor (18mm ID conduit - Safe physical layout)" },
          ],
          formulasUsed: [
            "Current: I = P / (1.732 * V * pf)",
            "Voltage Drop: V_d = 1.732 * I * L * (R / 1000)"
          ],
          diagram: `
+----------------------- GRID UTILITY POWER -----------------------+
                                 │
                               -[ ]- (3-Pole 30A Coordinated Circuit Breaker)
                                 │
                                 │=== [ 4 mm² Copper Conductor - Run Length: 30m ] ===
                                 │
                              +-----+
                              | (M) |  (12 kW inductive 3-Phase induction motor)
                              +-----+
                                 │
                               ===== (Local System Earth ground reference sink)
          `,
          notes: "All parameters satisfy IEC 60364 & NEC regulations and are verified for continuous commercial rating limits. Field installation requires confirmation by a licensed professional engineer."
        });
        setRoutingSimulating(false);
      }, 4000);

    } else if (text.includes("convert") || text.includes("kw to kva") || text.includes("unit")) {
      addLog("🎯 [ROUTING] 'Unit Conversion' intent detected. Activating: Unit Conversion Engine.", 1000);
      addLog("🔄 [SUB-ROUTING] Unit Conversion Engine invokes Formula Engine for power factor scaling.", 1400);
      addLog("📝 [FORMULA] Active Power (P) to Apparent Power (S): S (kVA) = P (kW) / power_factor", 1900);
      addLog("✅ [ORCHESTRATOR] Conversion steps formulated and finalized.", 2400);

      setTimeout(() => {
        setRoutingOutput({
          title: "Standard Power-Factor Conversion Calculations",
          toolMatched: "Unit Conversion Engine (Coordinated with Formula Engine)",
          description: "Stepped conversions between Active (kW), Apparent (kVA), and Reactive (kVAR) electrical loads.",
          data: [
            { label: "Input Active Power", value: "15.0 kW" },
            { label: "Assumed Power Factor", value: "0.85" },
            { label: "Output Apparent Capacity", value: "17.65 kVA" },
            { label: "Calculated Reactive Load", value: "9.3 kVAR" },
          ],
          formulasUsed: [
            "Apparent Power: S (kVA) = P (kW) / cos(φ)",
            "Reactive Power: Q (kVAR) = √[S² - P²]"
          ],
          diagram: `
             ▲ Apparent S = 17.65 kVA
             │        /
             │       /
             │      /
  Reactive   │     / 
  Q=9.3 kVAR │    /   cos φ = 0.85 (Angle = 31.8°)
             │   /
             │  /
             │ /
             └───┴────────────────────────►
                  Active P = 15.0 kW
          `,
          notes: "Apparent power determines the transformer capacity, line conductor ampacity, and circuit breaker sizing thresholds necessary to safeguard system limits."
        });
        setRoutingSimulating(false);
      }, 2700);

    } else if (text.includes("symbol") || text.includes("what is the symbol") || text.includes("contactor")) {
      addLog("🎯 [ROUTING] 'Symbol and description' query detected. Activating: Symbol Engine.", 1000);
      addLog("📂 [DATABASE] Searching IEC 60617 / IEEE 315 component database...", 1600);
      addLog("✅ [ORCHESTRATOR] Schema record retrieved.", 2200);

      setTimeout(() => {
        setRoutingOutput({
          title: "Sub-Station Contactor Component Specifications",
          toolMatched: "Electrical Symbol Engine",
          description: "IEC standard and typical schematic designs for heavy magnetic contact switches.",
          data: [
            { label: "Symbol Category", value: "Switchgear & Starters (IEC 60617)" },
            { label: "Component Type", value: "Electromagnetic Contactor Node" },
            { label: "Standard Designation", value: "K1, K2 etc." },
            { label: "Application Code", value: "AC-3 Duty rating (inductive motor direct-online)" },
          ],
          formulasUsed: [
            "Contactor Sizing: I_contactor ≥ I_motor_FLC * 1.15"
          ],
          diagram: `
    Coil Contacts (Low Voltage control)
             A1 [o]
                 │
               [###] Electromagnetic Coil
                 │
             A2 [o]

    Main Power Contacts (Inductive switching)
             1/L1        3/L2        5/L3
               │           │           │
              ---         ---         ---
              | |         | |         | |  (Main Poles)
               │           │           │
             2/T1        4/T2        6/T3
          `,
          notes: "A contactor utilizes an electromagnetic coil to close spring-loaded contacts, enabling low-voltage automation control over heavy loads."
        });
        setRoutingSimulating(false);
      }, 2400);

    } else if (text.includes("voltage drop") || text.includes("25a") || text.includes("drop")) {
      addLog("🎯 [ROUTING] 'Voltage Drop' query detected. Activating: Formula Engine.", 1000);
      addLog("🔄 [SUB-ROUTING] Formula Engine triggers Cable Sizing Engine to map resistance values.", 1500);
      addLog("📝 [FORMULA] Single-Phase Voltage Drop: V_drop = 2 * I * L * (R / 1000) volts", 2000);
      addLog("📐 [CALCULATION] V_drop = 2 * 25 A * 50 m * (3.08 Ω/km / 1000) = 7.7 Volts (3.35% drop)", 2400);
      addLog("✅ [ORCHESTRATOR] Calculation results compiled.", 2800);

      setTimeout(() => {
        setRoutingOutput({
          title: "Mathematical Voltage Drop Run Calculations",
          toolMatched: "Electrical Formula Engine (Coordinated with Cable Sizing)",
          description: "Evaluating potential losses for a 25A continuous feeder run at 230V single phase over 50 meters of 6 mm² wire.",
          data: [
            { label: "Load Amperes", value: "25.0 A" },
            { label: "Conductor Size", value: "6.0 mm² Copper" },
            { label: "Conductor Resistance", value: "3.08 Ω/km (at 75°C standard run rating)" },
            { label: "Total Drop (V)", value: "7.7 Volts" },
            { label: "Percentage Loss (%)", value: "3.35%" },
            { label: "Standard Status", value: "WARNING! Exceeds standard recommended 3% limit for branch runs! Upsize conductor to 10mm² suggested." },
          ],
          formulasUsed: [
            "1-Phase Drop: V_d = 2 * I * L * (R/1000)",
            "Percentage Loss: Drop (%) = (V_d / V_supply) * 100"
          ],
          diagram: `
[ SOURCE: 230V ] ════════════════════════════ [ LOAD: 222.3V ]
                      Conductor impedance
                      R_loop = 0.308 Ohms
                      Current = 25 Amps
                 ════════════════════════════
                 Line Loss = 7.7 Volts (3.35%)
          `,
          notes: "Excessive voltage drop decreases industrial machinery efficiency and causes overheating in distribution segments. Always maintain layouts within code thresholds."
        });
        setRoutingSimulating(false);
      }, 3000);

    } else if (text.includes("diagram") || text.includes("sld") || text.includes("line diagram")) {
      addLog("🎯 [ROUTING] 'Draw diagram' intent detected. Activating: Diagram Generator.", 1000);
      addLog("🔄 [SUB-ROUTING] Diagram Generator pulls standard symbols to construct single-line visualizer.", 1500);
      addLog("✅ [ORCHESTRATOR] Finished ASCII block diagram construction.", 2200);

      setTimeout(() => {
        setRoutingOutput({
          title: "Asset Single Line Diagram (SLD) Schema",
          toolMatched: "Diagram Generator",
          description: "Direct graphical illustration outlining primary low voltage distribution lines, protective trip switches, and motor control starters.",
          data: [
            { label: "Primary Grid", value: "11 kV Utility High Tension overhead lines" },
            { label: "Step Down", value: "11kV/400V Delta-Y Dyn11 substation transformer" },
            { label: "Bus rating", value: "630A Primary copper distribution bus" },
            { label: "Feeder rating", value: "Coordinated motor line Protection (MCC)" },
          ],
          formulasUsed: [
            "Bus capacity design: I_bus ≥ Total Continuous + 1.25 * Largest single load"
          ],
          diagram: `
  [ 11 kV Grid supply ]
          │
        ( T1 ) Step Down Dyn11 delta-star Substation transformer (11kV / 400V)
          │
        -[ ]- (630A Air Circuit Breaker - Primary Main Protection switch)
          │
  ========┴======== Main distribution copper busbar (400V, 630A capacity)
      │          │
    -[ ]-      -[ ]-  Coordinated protection branch circuit breakers
    (63A)      (100A)
      │          │
    -|-|-(KM)  -|-|-(KM) Electromagnetic safety contactors
      │          │
    -===-(OL)  -===-(OL) Thermal overload protection modules
      │          │
   +-----+    +-----+
   | (M) |    | (M) |    Inductive load drives (Motor starters & continuous pumps)
   +-----+    +-----+
          `,
          notes: "Diagram outline satisfies IEC symbols standards. Single line sheets are vital legal requirements for low-voltage maintenance panels."
        });
        setRoutingSimulating(false);
      }, 2400);

    } else {
      addLog("🎯 [ROUTING] General 'Code explain/Standards reference' detected. Activating: Standards & Code Reference Engine.", 1000);
      addLog("📚 [STANDARDS] Loading digital NEC / IEC guideline clauses database...", 1500);
      addLog("📐 [ROUTING] Coordinated with Cable Sizing rules.", 2000);
      addLog("✅ [ORCHESTRATOR] Standards briefing ready.", 2500);

      setTimeout(() => {
        setRoutingOutput({
          title: "National Electrical Code (NEC) Sizing Regulations Briefing",
          toolMatched: "Standards & Code Reference Engine (Coordinated with Cable Sizing)",
          description: "General compliance guidelines regarding conduit fill and cable sizing under standard conditions.",
          data: [
            { label: "Theme", value: "General LV Circuit Cable Containment and Ampacity limits" },
            { label: "NEC Rule", value: "Article 310.15 (Conductor ampacities) & Chapter 9 Table 8" },
            { label: "IEC Standard", value: "IEC 60364-5-52 selection & erection of electrical equipment" },
            { label: "Limit Factor", value: "Conduit fill factor max 40% for three or more conductors in a raceway" },
          ],
          formulasUsed: [
            "Total Cable Area percentage fill: Fill (%) = (Sum of Conductor Areas / Conduit Inner cross section) * 100"
          ],
          diagram: `
     +-----------------------+
   /   o     o     o     o    \\  ◄ Raceway Conduit ID
  |  ( )   ( )   ( )   ( )     |
   \\   o     o     o     o    /  ◄ 18 AWG / THHN conductors
     +-----------------------+
     Total Conductor Area ≤ 40% Inner Area
          `,
          notes: "Maintaining conduit fill limits avoids thermal trapping, prevents wire insulation damage, and supports safe expansion operations. Direct citation of copyrighted bodies is restricted; consult NFPA booklets directly."
        });
        setRoutingSimulating(false);
      }, 2700);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-amber-700 rounded-2xl p-6 md:p-8 text-white shadow-lg border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_45%)]" />
        <div className="relative z-10 space-y-3 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/25 border border-amber-300/30 rounded-full text-xs font-black text-amber-200 tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Engineering Knowledge Packs
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Electrical Engineering &amp; Sizing Library
          </h1>
          <p className="text-xs md:text-sm text-teal-100/90 leading-relaxed max-w-2xl font-medium">
            Explore curated knowledge collections, interactive sizing frameworks, and structured prompt engineering templates designed to power up your Google AI Studio deployment.
          </p>
        </div>
      </div>

      {/* Professional Guardrails Panel */}
      <div className="bg-amber-500/5 dark:bg-amber-950/20 border-l-4 border-l-amber-550 border border-amber-200/50 dark:border-amber-900/45 p-4 rounded-xl flex items-start gap-3.5 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide">
            Mandatory Code Sizing Verification Guardrail
          </strong>
          <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
            Always remind the user that final installation designs, cables, and conduit containment frameworks must be critically checked and approved by a qualified electrical engineer and must comply with local code provisions, standards, and regional municipal bylaws.
          </p>
        </div>
      </div>

      {/* Two Column Layout: Navigation tabs left, Content viewport right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Tab selector Menu - 3 Cols wide */}
        <div className="lg:col-span-3 space-y-4">
          <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase block pl-1">
            Library Sections
          </span>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("installations")}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-black rounded-lg text-left transition-all border outline-none cursor-pointer ${
                activeTab === "installations"
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/10"
                  : "bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Zap className="w-4 h-4 shrink-0 transition-transform" />
              <div className="flex-1 truncate">
                <span className="block leading-tight">1.1 Electrical Installations</span>
                <span className="block text-[9px] opacity-75 font-medium mt-0.5">Design, sizing &amp; protective gear</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("wiring")}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-black rounded-lg text-left transition-all border outline-none cursor-pointer ${
                activeTab === "wiring"
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/10"
                  : "bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Cable className="w-4 h-4 shrink-0" />
              <div className="flex-1 truncate">
                <span className="block leading-tight">1.2 Wiring Systems</span>
                <span className="block text-[9px] opacity-75 font-medium mt-0.5">Cables, routing &amp; terminations</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("services")}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-black rounded-lg text-left transition-all border outline-none cursor-pointer ${
                activeTab === "services"
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/10"
                  : "bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Wrench className="w-4 h-4 shrink-0" />
              <div className="flex-1 truncate">
                <span className="block leading-tight">1.3 Electrical Services</span>
                <span className="block text-[9px] opacity-75 font-medium mt-0.5">Lighting, power boards &amp; starters</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("prompts")}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-black rounded-lg text-left transition-all border outline-none cursor-pointer ${
                activeTab === "prompts"
                  ? "bg-amber-500 border-amber-450 text-slate-900 shadow-md shadow-amber-500/15 font-black"
                  : "bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <div className="flex-1 truncate">
                <span className="block leading-tight">2. Prompt Sizing Tools</span>
                <span className="block text-[9px] opacity-80 font-semibold mt-0.5">Interactive generator actions</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("units-symbols")}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-black rounded-lg text-left transition-all border outline-none cursor-pointer ${
                activeTab === "units-symbols"
                  ? "bg-amber-500 border-amber-450 text-slate-900 shadow-md shadow-amber-500/15 font-black"
                  : "bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Workflow className="w-4 h-4 shrink-0 transition-transform" />
              <div className="flex-1 truncate">
                <span className="block leading-tight">3. Units, Symbols &amp; Agent</span>
                <span className="block text-[9px] opacity-80 font-semibold mt-0.5">Electro self-routing details</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("references")}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-black rounded-lg text-left transition-all border outline-none cursor-pointer ${
                activeTab === "references"
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/10"
                  : "bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Link2 className="w-4 h-4 shrink-0" />
              <div className="flex-1 truncate">
                <span className="block leading-tight">4. External References</span>
                <span className="block text-[9px] opacity-75 font-medium mt-0.5">Global standards and links</span>
              </div>
            </button>
          </div>

          <div className="p-4 bg-slate-100/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
            <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5 leading-none">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              AI Studio Knowledge
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
              These knowledge components are perfectly formatted to be exported directly as training guidelines, static documentation, or dynamic instructions in Google AI Studio.
            </p>
          </div>
        </div>

        {/* Right Content viewport - 9 Cols wide */}
        <div className="lg:col-span-9">
          
          {/* TAB 1: ELECTRICAL INSTALLATIONS */}
          {activeTab === "installations" && (
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-6">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">
                  MODULE 1.1 KNOWLEDGE PACK
                </div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">
                  Electrical Installations Engineering Framework
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Comprehensive design guidelines, load evaluation configurations, and code-governed protection setups for Low Voltage (LV) layouts.
                </p>
              </div>

              {/* Bento Grid layout of features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-805 dark:text-slate-100">
                      Residential Load Installations
                    </h4>
                  </div>
                  <p className="text-3xs md:text-2xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                    Configures dedicated layouts for single-phase connections and minor three-phase inputs. Models common household configurations, load balances, meter panel enclosures, service entrances, and distribution subboards.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-805 dark:text-slate-100">
                      Commercial &amp; High-rise Risers
                    </h4>
                  </div>
                  <p className="text-3xs md:text-2xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                    Engineers corporate distribution panels for offices, retail blocks, and high-rise service channels, specifying busduct risers, multi-tier distribution boards, and lighting segregation.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-805 dark:text-slate-100">
                      Industrial Feeders &amp; MCC Panels
                    </h4>
                  </div>
                  <p className="text-3xs md:text-2xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                    Calculates high-current sub-station feeders, motor control centers (MCC), variable industrial machine drives, dedicated continuous pumps, and extreme thermodynamic deratings.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-805 dark:text-slate-100">
                      Load Diversity &amp; Demand Factors
                    </h4>
                  </div>
                  <p className="text-3xs md:text-2xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                    Applies mathematical coincidence demand sizing. Segregates continuous loads (carrying 125% ampacity factors) from interlocked safety systems, air conditioners, and intermittent operations.
                  </p>
                </div>
              </div>

              {/* In-depth content tabs for module */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-emerald-500" />
                  Key Technical Sizing Concepts
                </h4>
                
                <div className="space-y-3.5">
                  <div className="border border-slate-150 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/20">
                    <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 block mb-1">
                      Circuit Design &amp; Voltage Drop Limits
                    </span>
                    <p className="text-2xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                      Final circuits should maintain a ring or radial bus scheme depending on local standard standards. Total voltage drop from the utility service entrance to the furthest branch receptor must never exceed <strong>3%</strong> for branch lines, or <strong>5%</strong> across the combined service riser and branch circuit combined, ensuring electrical equipment efficiency.
                    </p>
                  </div>

                  <div className="border border-slate-150 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/20">
                    <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 block mb-1">
                      Protection Sizing &amp; Selective Coordination
                    </span>
                    <p className="text-2xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                      Select MCB (miniature) and MCCB (molded case) breakers based on peak potential circuit overload currents (Ib ≤ In ≤ Iz) and maximum prospective short-circuit currents. Use time-current trip curves (Type B, C, D) to ensure full selectivity—meaning local downstream branch breakers clear faults before higher-tier subsystem fuses decouple.
                    </p>
                  </div>

                  <div className="border border-slate-150 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/20">
                    <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 block mb-1">
                      System Earthing (TN / TT / IT Networks)
                    </span>
                    <p className="text-2xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                      Integrates structural grounding configurations. TN-S separates neutral and earth paths; TN-C-S combines them at incoming service blocks; TT connects load-frame grounding directly to separate earth rods; IT isolates neutrals from system earths. Standard bonding cables maintain potential equalization of critical steel frameworks and extraneous water pipes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggested Doc Export Box */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest">Recommended AI Studio Doc 1</span>
                  <span className="block text-xs font-black text-slate-800 dark:text-slate-205">Electrical_Installations_Basics.md</span>
                </div>
                <button 
                  onClick={() => handleCopyText(`## Electrical Installations Basics\n- Load estimations under NEC & IEC guidelines\n- MCB/MCCB coordination principles\n- Grounding earthing (TN-S, TN-C-S, TT)\n- Diversity ampacity selection factors`, "install_doc")}
                  className="bg-white hover:bg-slate-5 w-fit px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-3xs rounded-lg font-black text-slate-750 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  {copiedPrompt === "install_doc" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Copy Doc Skeleton
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: WIRING SYSTEMS */}
          {activeTab === "wiring" && (
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-6">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">
                  MODULE 1.2 KNOWLEDGE PACK
                </div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">
                  Wiring Containment &amp; Cable Systems
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Detailed structures for conductors, grouping factors, rigid PVC conduits, EMT, cable trays, and correct phase/neutral identification schemas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-1.5">
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Conductor Thermal Derating</h4>
                  <p className="text-3xs md:text-2xs text-slate-650 dark:text-slate-400 leading-relaxed font-semibold">
                    Cables like THHN copper have base ampacity constraints at 30°C. If ambient temperatures exceed 30°C or more than 3 current-carrying conductors crowd in a raceway, derating multipliers (e.g. 0.82) must discount carrying limits.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-1.5">
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">PVC, EMT &amp; Trunking fill</h4>
                  <p className="text-3xs md:text-2xs text-slate-655 dark:text-slate-400 leading-relaxed font-semibold">
                    Conduit occupancy rules restrict fills to <strong>53%</strong> for single wire strings, <strong>31%</strong> for duo layouts, and strictly <strong>40%</strong> max loading for three or more conductors. Keeps heat low and allows cable pull forces.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-1.5">
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Termination Protocols</h4>
                  <p className="text-3xs md:text-2xs text-slate-655 dark:text-slate-400 leading-relaxed font-semibold">
                    Standard electrical terminations require certified compression lugs, crimped ferrules, and torque-calibrated tightening. Avoid thermal hotspots at main terminal screws by ensuring correct conductor alignment.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-1.5">
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Special Sizing Locations</h4>
                  <p className="text-3xs md:text-2xs text-slate-655 dark:text-slate-400 leading-relaxed font-semibold">
                    Bathrooms, commercial grease kitchens, extreme industrial Zone 0/1 petrochemical divisions. Ground fault circuit interrupters (GFCI/RCD) and fully explosion-proof steel conduits are mandatory here.
                  </p>
                </div>
              </div>

              {/* Color Coding segment */}
              <div className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3 bg-slate-50/20 dark:bg-slate-900/10">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Regional Cable Identification Conventions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-3xs font-semibold leading-relaxed text-slate-600 dark:text-slate-350">
                  <div className="space-y-1 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800">
                    <span className="block text-emerald-600 dark:text-emerald-400 font-extrabold uppercase text-[10px] tracking-wider">US/Canada System (NEC)</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Line 1: Black (125V/240V/480V)</li>
                      <li>Line 2: Red</li>
                      <li>Line 3 (3-Phase): Blue or Orange</li>
                      <li>Neutral Conductor: White or Grey</li>
                      <li>Equipment Earth: Bare / Green</li>
                    </ul>
                  </div>
                  <div className="space-y-1 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800">
                    <span className="block text-emerald-600 dark:text-emerald-400 font-extrabold uppercase text-[10px] tracking-wider">UK/EU System (BS 7671 / IEC)</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Phase L1: Brown</li>
                      <li>Phase L2: Black</li>
                      <li>Phase L3: Grey</li>
                      <li>Neutral Conductor: Blue</li>
                      <li>Equipment Earth: Green-Yellow stripes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Suggested Doc Export Box */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">Recommended AI Studio Doc 2</span>
                  <span className="block text-xs font-black text-slate-800 dark:text-slate-205">Wiring_Methods_and_Cables.md</span>
                </div>
                <button 
                  onClick={() => handleCopyText(`## Wiring Methods and Cables\n- Conductor sizing ampacity derating formulas\n- OCCUPANCY fill factors for PVC/EMT conduit (40% rule)\n- Regional color wiring codes (USA vs Europe)\n- Hazardous locations dry/wet cable specifications`, "wire_doc")}
                  className="bg-white hover:bg-slate-5 w-fit px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-3xs rounded-lg font-black text-slate-750 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  {copiedPrompt === "wire_doc" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Copy Doc Skeleton
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: ELECTRICAL SERVICES */}
          {activeTab === "services" && (
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-6">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">
                  MODULE 1.3 KNOWLEDGE PACK
                </div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">
                  Electrical Services &amp; Subsystem Auxiliary
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  General lighting layouts, active motor start drives, backup generator configurations, testing methodologies, and commissioning steps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Power Distribution Boards</h4>
                  </div>
                  <p className="text-3xs md:text-2xs text-slate-655 dark:text-slate-400 leading-relaxed font-semibold">
                    Outlines physical topologies of main LV boards down to sub-distribution panels. Ensures continuous isolation paths, busways, surge protection devices (SPDs), and standard locking safety enclosures.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Motors, drives &amp; DOL</h4>
                  </div>
                  <p className="text-3xs md:text-2xs text-slate-655 dark:text-slate-400 leading-relaxed font-semibold">
                    Sizes motor feeders. Differentiates Direct-On-Line (DOL) spike startup currents from Star-Delta transition sequences, soft starters, and power-factor corrective Variable Frequency Drives (VFDs).
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Emergency &amp; General Lights</h4>
                  </div>
                  <p className="text-3xs md:text-2xs text-slate-655 dark:text-slate-400 leading-relaxed font-semibold">
                    Engineers active industrial lighting designs. Sets emergency central backing batteries, exit sign locations, occupancy motion sensors, and dimmers mapping local building illuminance lux requirements.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850/80 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Backup Generators &amp; UPS</h4>
                  </div>
                  <p className="text-3xs md:text-2xs text-slate-655 dark:text-slate-400 leading-relaxed font-semibold">
                    Integrates standby supply configurations. Coordinates Automatic Transfer Switches (ATS) with uninterruptible power systems (UPS), shedding non-critical loads to prioritize HVAC air systems and computing hubs.
                  </p>
                </div>
              </div>

              {/* Commissioning check details */}
              <div className="p-4 border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-emerald-500" />
                  Testing, Verification &amp; Commissioning Steps
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-3xs font-semibold leading-relaxed text-slate-600 dark:text-slate-350">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/55 dark:border-slate-800 space-y-1">
                    <span className="block font-black text-emerald-600 dark:text-emerald-400">1. Isolation &amp; Conductor Continuity</span>
                    <p>Conduct active insulation testing with Mega-Ohm meters between active phases and ground (safe reference minimum is &gt; 1MΩ).</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/55 dark:border-slate-800 space-y-1">
                    <span className="block font-black text-emerald-600 dark:text-emerald-400">2. Earth Resistivity Checks</span>
                    <p>Measure soil and earth electrode path resistance using the fall-of-potential test method to secure low ground impedance paths (&lt; 25Ω standard).</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/55 dark:border-slate-800 space-y-1">
                    <span className="block font-black text-emerald-600 dark:text-emerald-400">3. RCD Disconnect Verification</span>
                    <p>Simulate residual leakage faults to verify instant branch RCD/GFCI disconnection speeds under threshold milliseconds limits.</p>
                  </div>
                </div>
              </div>

              {/* Suggested Doc Export Box */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-805 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">Recommended AI Studio Doc 3</span>
                  <span className="block text-xs font-black text-slate-800 dark:text-slate-205">Electrical_Services_and_Systems.md</span>
                </div>
                <button 
                  onClick={() => handleCopyText(`## Electrical Services and Systems\n- Emergency battery lighting controls\n- Motor DOL soft-start sizing matrices\n- Automatic transfer switch ATS logics\n- Continuity insulation testing guidelines`, "services_doc")}
                  className="bg-white hover:bg-slate-5 w-fit px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-3xs rounded-lg font-black text-slate-750 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  {copiedPrompt === "services_doc" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Copy Doc Skeleton
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* TAB 4: INTERACTIVE PROMPT TOOLS */}
          {activeTab === "prompts" && (
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-8">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none mb-1">
                  INTERACTIVE PROMPT GENERATORS
                </div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">
                  Ready-Made AI prompt Snippets for Sizing
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Modify parameters inside each template dynamically. Pre-load your configured prompt instantly into the Gemini Wire &amp; Conduit Sizer Calculation tool.
                </p>
              </div>

              {/* TEMPLATE A: RESIDENTIAL CIRCUIT DESIGN */}
              <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-0">
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">A</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 uppercase tracking-tight">Residential Circuit Sizing Tool</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-none">For final electrical installations layout</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 uppercase font-bold tracking-wider">
                    Design &amp; Sizing
                  </span>
                </div>
                
                <div className="p-5 space-y-4">
                  {/* Interactive form sliders/fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">Region Location</label>
                      <input 
                        type="text" 
                        value={promptParams.residential.location}
                        onChange={(e) => updateParam("residential", "location", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">Supply Phase &amp; Frequency</label>
                      <input 
                        type="text" 
                        value={promptParams.residential.supply}
                        onChange={(e) => updateParam("residential", "supply", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">Connected Loads Description</label>
                      <input 
                        type="text" 
                        value={promptParams.residential.loads}
                        onChange={(e) => updateParam("residential", "loads", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">Cable Containment installation method</label>
                      <input 
                        type="text" 
                        value={promptParams.residential.installation}
                        onChange={(e) => updateParam("residential", "installation", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Rendered prompt box */}
                  <div className="relative pt-2.5">
                    <pre className="text-[10px] p-4 rounded bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                      {residentialPromptText}
                    </pre>
                    <div className="absolute right-3 top-5 flex items-center gap-1.5 z-10">
                      <button 
                        onClick={() => handleCopyText(residentialPromptText, "prompt_res")}
                        className="bg-white/90 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:bg-slate-100 p-2 rounded shadow-xs cursor-pointer flex items-center justify-center placeholder:"
                        title="Copy Prompt to Clipboard"
                      >
                        {copiedPrompt === "prompt_res" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Immediate run action */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        onApplyPromptSizer(residentialPromptText, "parameters");
                        onTrackAction("apply_templated_prompt");
                      }}
                      className="bg-amber-500 hover:bg-amber-600 border border-amber-450 hover:border-amber-500 text-slate-900 font-black text-[11px] py-2 px-4 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                      Run in AI Calculator Sizer
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* TEMPLATE B: CABLE ROUTING AND CONTAINMENT */}
              <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-0">
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">B</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 uppercase tracking-tight">Cable Routing &amp; Containment Planner</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-none">Propose structural trays, conduit spacing &amp; segregations</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-500/25 uppercase font-bold tracking-wider">
                    Wiring &amp; containment
                  </span>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">Building Category Type</label>
                      <input 
                        type="text" 
                        value={promptParams.routing.buildingType}
                        onChange={(e) => updateParam("routing", "buildingType", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">Number of Floors</label>
                      <input 
                        type="text" 
                        value={promptParams.routing.floors}
                        onChange={(e) => updateParam("routing", "floors", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">Main Substation &amp; Riser Locations</label>
                      <input 
                        type="text" 
                        value={promptParams.routing.equipment}
                        onChange={(e) => updateParam("routing", "equipment", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">Physical Height &amp; Fire Constraints</label>
                      <input 
                        type="text" 
                        value={promptParams.routing.constraints}
                        onChange={(e) => updateParam("routing", "constraints", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="relative pt-2.5">
                    <pre className="text-[10px] p-4 rounded bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                      {routingPromptText}
                    </pre>
                    <div className="absolute right-3 top-5 flex items-center gap-1.5 z-10">
                      <button 
                        onClick={() => handleCopyText(routingPromptText, "prompt_rot")}
                        className="bg-white/90 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:bg-slate-100 p-2 rounded shadow-xs cursor-pointer flex items-center justify-center"
                      >
                        {copiedPrompt === "prompt_rot" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        onApplyPromptSizer(routingPromptText, "text");
                        onTrackAction("apply_templated_routing_prompt");
                      }}
                      className="bg-amber-500 hover:bg-amber-600 border border-amber-450 hover:border-amber-500 text-slate-900 font-black text-[11px] py-2 px-4 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                      Propose Routing via AI (Text Mode)
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* TEMPLATE C: LV DISTRIBUTION OVERVIEW */}
              <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-0">
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">C</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 uppercase tracking-tight">LV Distribution Services Planner</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-none">Outline main transformers, emergency generators &amp; subboards</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-405 border border-blue-500/25 uppercase font-bold tracking-wider">
                    Services &amp; Commissioning
                  </span>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-3xs font-semibold">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 block font-sans">Building Footprint Size &amp; Type</label>
                      <input 
                        type="text" 
                        value={promptParams.services.buildingSize}
                        onChange={(e) => updateParam("services", "buildingSize", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-405 block">Incoming Transformer capacity</label>
                      <input 
                        type="text" 
                        value={promptParams.services.incomingSupply}
                        onChange={(e) => updateParam("services", "incomingSupply", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-405 block">Critical Backup medical/data loads</label>
                      <input 
                        type="text" 
                        value={promptParams.services.criticalLoads}
                        onChange={(e) => updateParam("services", "criticalLoads", e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="relative pt-2.5">
                    <pre className="text-[10px] p-4 rounded bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto font-medium">
                      {servicesPromptText}
                    </pre>
                    <div className="absolute right-3 top-5 flex items-center gap-1.5 z-10">
                      <button 
                        onClick={() => handleCopyText(servicesPromptText, "prompt_srv")}
                        className="bg-white/90 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:bg-slate-100 p-2 rounded shadow-xs cursor-pointer flex items-center justify-center animate-fade-in"
                      >
                        {copiedPrompt === "prompt_srv" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        onApplyPromptSizer(servicesPromptText, "text");
                        onTrackAction("apply_templated_services_prompt");
                      }}
                      className="bg-amber-500 hover:bg-amber-600 border border-amber-450 hover:border-amber-500 text-slate-900 font-black text-[11px] py-2 px-4 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5 animate-fade-in"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                      Plan Systems via AI (Text Mode)
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ELECTRICAL UNITS, SYMBOLS & AI ROUTING AGENT DESIGNS */}
          {activeTab === "units-symbols" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Context Block Header Card */}
              <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest block mb-1">
                    AGENT ORCHESTRATION COMPLIANCE CENTER
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-amber-500" />
                    Autonomous Multi-Tool Self-Routing Agent
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed max-w-4xl">
                    Experience how a high-grade AI agent self-detects, routes, and coordinates distinct specialized engineering tools such as the Unit Conversion Engine, Electrical Symbol Catalog, Formula Engine, and Diagram Generator to formulate code-compliant, engineering-grade designs.
                  </p>
                </div>

                {/* Sub-tab Switch Rail */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {[
                    { id: "playground", label: "Agent Playground", icon: <Bot className="w-3.5 h-3.5" /> },
                    { id: "database", label: "Electrical Units & Symbols", icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: "formulas", label: "Live Formula Sandbox", icon: <Sliders className="w-3.5 h-3.5" /> },
                    { id: "spec", label: "Google AI Studio Spec Sheets", icon: <FileText className="w-3.5 h-3.5" /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setUnitsActiveSubTab(tab.id as any);
                        onTrackAction(`view_units_subtab_${tab.id}`);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 text-2xs font-extrabold rounded-lg border cursor-pointer outline-none transition-all ${
                        unitsActiveSubTab === tab.id
                          ? "bg-amber-500 border-amber-450 text-slate-900 shadow-md shadow-amber-500/10"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* VIEWPORT 1: AGENT INTEGRATED PLAYGROUND SIMULATION */}
              {unitsActiveSubTab === "playground" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Preset triggers */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-md space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                          Auto-Routing Test Scenarios
                        </h4>
                        <p className="text-3xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          Select a complex prompt scenario below to trace how the engineering agent automatically maps inputs to specialized calculation tools in sequence.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {[
                          {
                            title: "Three-Phase Feeder Sizing",
                            desc: "Size a cable for a 12 kW motor, 400 V, 3 phase, 30 m away.",
                            query: "Size a cable for a 12 kW motor, 400 V, 3 phase, 30 m away."
                          },
                          {
                            title: "Active-to-Apparent Conversion",
                            desc: "Convert 15 kW active motor load to kVA generator load at 0.85 PF.",
                            query: "Convert 15 kW model load to kVA with a power factor of 0.85."
                          },
                          {
                            title: "Contactor Symbol & Details",
                            desc: "Show wiring symbols and functional definitions for industrial contactors.",
                            query: "Show IEC symbol and description for magnetic contactor."
                          },
                          {
                            title: "Volt Drop Line Run Assessment",
                            desc: "Analyze voltage drop for 25A on 50m of 6mm² copper lines at 230V.",
                            query: "Calculate voltage drop for 25A load at 230V single phase over 50m length on 6mm2."
                          },
                          {
                            title: "Distribution Single Line Diagram",
                            desc: "Draft a hierarchical ASCII power diagram of a star-point substation feed.",
                            query: "Draft single line diagram of motor feeder board."
                          }
                        ].map((scenario, idx) => (
                          <button
                            key={idx}
                            disabled={routingSimulating}
                            onClick={() => runSimulatedRouting(scenario.query)}
                            className={`p-3 rounded-xl border text-left cursor-pointer outline-none transition transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              routingQuery === scenario.query
                                ? "bg-amber-500/10 border-amber-400 dark:border-amber-500/50"
                                : "bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="block font-black text-xs text-slate-800 dark:text-slate-200">
                              {idx + 1}. {scenario.title}
                            </span>
                            <span className="block text-3xs text-slate-500 dark:text-slate-450 mt-1 font-semibold leading-normal">
                              "{scenario.desc}"
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="pt-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            disabled={routingSimulating}
                            value={routingQuery}
                            onChange={(e) => setRoutingQuery(e.target.value)}
                            placeholder="Type raw engineering prompt here..."
                            className="flex-1 text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-750 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                          />
                          <button
                            disabled={routingSimulating || !routingQuery.trim()}
                            onClick={() => runSimulatedRouting(routingQuery)}
                            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black text-2xs px-4 rounded-lg outline-none cursor-pointer flex items-center justify-center transition"
                          >
                            {routingSimulating ? "Sizing..." : "Trigger AI Agent"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Execution trace & Output */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* Execution Terminal Logger */}
                    <div className="bg-slate-950 text-emerald-400 rounded-2xl p-4 shadow-lg font-mono text-[10px] space-y-1.5 border border-slate-800 relative min-h-[140px] overflow-hidden">
                      <div className="absolute right-3.5 top-3.5 uppercase tracking-widest text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${routingSimulating ? "animate-ping" : ""}`} />
                        AGENT ROUTER TRACE LOG
                      </div>

                      <div className="text-slate-500 font-semibold border-b border-slate-900 pb-1.5 mb-2 flex items-center gap-1 leading-none uppercase tracking-wide text-3xs">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        AI Agent Self-Routing Triggers
                      </div>

                      <div className="space-y-1 max-h-[160px] overflow-y-auto">
                        {routingLogs.map((log, idx) => (
                          <div key={idx} className="animate-fade-in flex items-start gap-1 leading-normal whitespace-pre-wrap">
                            <span className="text-slate-500 select-none">&gt;</span>
                            <span>{log}</span>
                          </div>
                        ))}
                        {routingLogs.length === 0 && (
                          <div className="text-slate-600 italic">
                            Select one of the auto-routing test scenarios on the left menu rail or type a custom prompt to trigger the simulated orchestrator engine.
                          </div>
                        )}
                        {routingSimulating && (
                          <div className="flex items-center gap-1.5 mt-2 font-bold text-amber-400 select-none animate-pulse">
                            <span>●</span>
                            <span>AGENT ROUTING PROCESS UNDERWAY... READYING OUTPUTS</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Output Viewer Card */}
                    {routingOutput && (
                      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 md:p-6 space-y-5 animate-slide-in">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-4xs font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1 leading-none">
                              {routingOutput.toolMatched}
                            </span>
                            <h4 className="text-sm font-black text-slate-850 dark:text-white leading-tight">
                              {routingOutput.title}
                            </h4>
                          </div>
                          <span className="text-3xs font-bold text-slate-400 font-mono">
                            Status: Code-Compliant Ready
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal font-semibold">
                          {routingOutput.description}
                        </p>

                        {/* Numeric Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {routingOutput.data.map((item: any, i: number) => (
                            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-1">
                              <span className="text-4xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                                {item.label}
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-white block font-mono">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Formulas */}
                        <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-1.5">
                          <span className="text-4xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                            Calculated Mathematical Formulas Applied
                          </span>
                          <div className="font-mono text-xs text-slate-700 dark:text-slate-350 space-y-1 font-semibold pl-1">
                            {routingOutput.formulasUsed.map((f: string, idx: number) => (
                              <div key={idx}>({idx + 1}) {f}</div>
                            ))}
                          </div>
                        </div>

                        {/* ASCII Diagram representation */}
                        {routingOutput.diagram && (
                          <div className="space-y-1.5">
                            <span className="text-4xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                              Structure Line Diagram (SLD) ASCII Layout
                            </span>
                            <pre className="text-3xs md:text-2xs p-3 md:p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-emerald-305 font-mono whitespace-pre overflow-x-auto leading-relaxed border border-slate-205 dark:border-slate-800 font-semibold select-all">
                              {routingOutput.diagram.trim()}
                            </pre>
                          </div>
                        )}

                        {/* Compliance notes */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex gap-2.5 items-start">
                          <ShieldCheck className="w-4 h-4 text-emerald-555 mt-0.5 shrink-0" />
                          <p className="text-3xs text-slate-500 dark:text-slate-400 leading-normal font-semibold italic">
                            {routingOutput.notes}
                          </p>
                        </div>

                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* VIEWPORT 2: SYSTEM ELECTRICAL UNITS & SYMBOLS DATA DIRECTORY */}
              {unitsActiveSubTab === "database" && (
                <div className="space-y-6">
                  
                  {/* Grid 1: Units glossary */}
                  <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
                    <div>
                      <div className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">
                        KNOWLEDGE PACKAGE 1.1A
                      </div>
                      <h4 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-tight">
                        Standard Electrical Sizing Units
                      </h4>
                      <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">
                        Standard dimensions of measurements essential to calculations referenced inside safety code registries. Click a unit to view details.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          unit: "Volt (V)",
                          symbol: "V",
                          formula: "V = I × R or V = P / I",
                          desc: "Standard Unit of electronic pressure (potential differential). Represents the electromotive force required to push one ampere of active current through a resistive load.",
                          application: "Main power supplies are calibrated on voltage levels (e.g. 120V household, 240V split phase, 400V/480V 3-phase industrial centers)."
                        },
                        {
                          unit: "Ampere (A)",
                          symbol: "I",
                          formula: "I = V / R or I = P / (V × pf)",
                          desc: "Standard Unit of electric current intensity, representing the speed flow of subatomic charge electrons. Directly determines circuit wire ampacity boundaries.",
                          application: "Directly governs protective fuse sizes, circuit breaker trip settings, and thermal heat factors on layout copper cores."
                        },
                        {
                          unit: "Ohm (Ω)",
                          symbol: "R or Z",
                          formula: "R = V / I or Z = V_drop / I",
                          desc: "Standard Unit of electrical impedance / friction resistance. Measures how strongly a material blocks incoming power stream flow.",
                          application: "Conductor long runs introduce resistance (R) which causes undesired voltage drop losses and heat dissipation."
                        },
                        {
                          unit: "Watt (W)",
                          symbol: "P",
                          formula: "P = V × I × pf (single-phase) or P = √3 × V_line × I × pf (three-phase)",
                          desc: "Standard Unit of active real power. Represents the real mechanical or thermodynamic energy transfer work executed per second.",
                          application: "Used to quantify power drawing specifications for heater elements, lighting grids, and electrical motors."
                        },
                        {
                          unit: "kVA (Apparent)",
                          symbol: "S",
                          formula: "S = V × I / 1000  or S = P_kW / pf",
                          desc: "Standard Unit of apparent complex capacity power. Total vector combination of real active watts (W) and reactive magnetic volt-amps (VAR).",
                          application: "Determines the physical size of incoming distribution transformers, local grid networks, and back-up diesel alternator generators."
                        },
                        {
                          unit: "kWh (Energy Consumption)",
                          symbol: "E",
                          formula: "E = P_kW × Hours_used",
                          desc: "Standard Unit of total electrical energy consumed over a span of operating duration. Equal to one kilowatt of draw working for one hour.",
                          application: "Main baseline tracking unit for commercial utility billing tariffs, power conservation checks, and operational costs audits."
                        }
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-amber-500/30 transition-all space-y-2 group">
                          <div className="flex items-center justify-between border-b border-slate-200/65 dark:border-slate-800 pb-2">
                            <span className="font-extrabold text-xs text-slate-850 dark:text-white group-hover:text-amber-500 transition-colors">
                              {item.unit}
                            </span>
                            <code className="text-3xs font-black text-amber-500 font-mono px-1.5 py-0.5 rounded bg-amber-550/10">
                              {item.formula}
                            </code>
                          </div>
                          <p className="text-3xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                            {item.desc}
                          </p>
                          <div className="bg-slate-100/50 dark:bg-slate-950/40 p-2 rounded text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal">
                            <span className="text-amber-600 dark:text-amber-450 uppercase text-[9px] tracking-wider block font-black mb-0.5">Sizing Context:</span>
                            {item.application}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grid 2: Symbols browser */}
                  <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
                    <div>
                      <div className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">
                        KNOWLEDGE PACKAGE 1.1B
                      </div>
                      <h4 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-tight">
                        Standard General Electrical Symbols database
                      </h4>
                      <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">
                        Standard schematic components used universally in technical blueprints (IEC 60617 / NFPA 79). Hover or check details.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          name: "Substation Transformer",
                          designator: "T1, TX",
                          standards: "IEC 60617",
                          desc: "Converts high-voltage grid lines to safe low-voltage utility levels (e.g., 11kV down to 400V Dyn11 star grid setups).",
                          ascii: `
    (   )
   ( ( ) )   <-- Dual winding coils
    (   )
  Star Neutral Grounded
                          `
                        },
                        {
                          name: "Circuit Breaker (MCCB/MCB)",
                          designator: "Q1, CB",
                          standards: "IEC / ANSI",
                          desc: "Protective switch device capable of auto-tripping to decouple branch wires when continuous thresholds or peak faults are violated.",
                          ascii: `
         /
      --o  o--   <-- Open/trip contact
         
    Thermomagnetic trip mechanism
                          `
                        },
                        {
                          name: "Safety Fuse Link",
                          designator: "F1, FS",
                          standards: "IEC / IEEE",
                          desc: "Thermal sacrificial metal link wire that melts down when current exceeds rated boundaries to halt destructive short circuit pulses.",
                          ascii: `
      --[===]--  <-- Sacrificial element
         
    Disposable high rupturing capacity
                          `
                        },
                        {
                          name: "Earth System Ground",
                          designator: "E, PE",
                          standards: "IEC 60364",
                          desc: "Physical connection trace down to zero-voltage soil pits. Safely drains off fault casing leakages to clear breakers safely.",
                          ascii: `
        │
      =====      <-- Main Earth Bus
       ===
        =        <-- Soil Ground spike line
                          `
                        },
                        {
                          name: "Induction Motor Load",
                          designator: "M1, MOT",
                          standards: "IEC / NEMA",
                          desc: "Mechanical working drive that converts multi-phase currents into torque, introducing magnetic inductive load reactions.",
                          ascii: `
       +-----+
       | (M) |   <-- 3-Phase Rotor
       +-----+
       T1 T2 T3 Inputs
                          `
                        },
                        {
                          name: "Magnetic Contactor Node",
                          designator: "KM1, CON",
                          standards: "Heavy Switchgear",
                          desc: "An automated heavy remote switch closed via electric trigger coil. Core component in Direct-On-Line (DOL) and Star-Delta starter circuits.",
                          ascii: `
       1/L1 Main Line In
         │
        --| |--  <-- Electromagnetic poles
         │
       2/T1 Main Load Out
                          `
                        }
                      ].map((sym, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-slate-800 pb-2 mb-2">
                              <div>
                                <span className="block font-black text-xs text-slate-850 dark:text-white leading-tight">{sym.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 mt-0.5 block font-mono">ID designation: {sym.designator}</span>
                              </div>
                              <span className="text-4xs font-black uppercase text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 leading-none">
                                {sym.standards}
                              </span>
                            </div>
                            <p className="text-3xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed mb-3">
                              {sym.desc}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-4xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Schematic Symbol:</span>
                            <pre className="text-4xs text-emerald-500 dark:text-emerald-305 p-3 rounded bg-slate-100 dark:bg-slate-950/80 font-mono text-center border border-slate-200 dark:border-slate-850 whitespace-pre overflow-x-auto font-black leading-tight">
                              {sym.ascii.trim()}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* VIEWPORT 3: MATHEMATICAL FORMULA SANDBOX AND SLIDERS */}
              {unitsActiveSubTab === "formulas" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                  
                  {/* Left panel: Ohm's Law and 3-Phase power */}
                  <div className="lg:col-span-6 space-y-6">
                    
                    {/* Sandbox A: Ohm's Law */}
                    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-4xs font-black text-amber-505 dark:text-amber-400 uppercase tracking-widest block leading-none mb-1">Interactive Sandbox A</span>
                        <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-tight">Ohm's Physical Solver (V = I × R)</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-2xs font-extrabold text-slate-600 dark:text-slate-300">
                            <span>Target Load Current (I)</span>
                            <span className="font-mono text-amber-500 font-black">{ohmsLaw.current} Amps</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="60" 
                            value={ohmsLaw.current}
                            onChange={(e) => setOhmsLaw(prev => ({ ...prev, current: parseInt(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-2xs font-extrabold text-slate-600 dark:text-slate-300">
                            <span>Conductor Run Resistance (R)</span>
                            <span className="font-mono text-amber-500 font-black">{ohmsLaw.resistance} Ohms</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="25" 
                            step="0.5"
                            value={ohmsLaw.resistance}
                            onChange={(e) => setOhmsLaw(prev => ({ ...prev, resistance: parseFloat(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 text-center space-y-1">
                          <span className="text-4xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">Calculated Voltage Drop Drop-off (V)</span>
                          <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 font-mono block tracking-tight">
                            {(ohmsLaw.current * ohmsLaw.resistance).toFixed(1)} Volts
                          </span>
                          <span className="text-[10px] font-mono text-slate-450 dark:text-slate-400 block font-semibold">
                            Equation Calculation: {ohmsLaw.current} A × {ohmsLaw.resistance} Ω = {(ohmsLaw.current * ohmsLaw.resistance).toFixed(1)} V
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sandbox B: 3-Phase power solver */}
                    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-4xs font-black text-amber-505 dark:text-amber-400 uppercase tracking-widest block leading-none mb-1">Interactive Sandbox B</span>
                        <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-tight">Three-Phase Active Power Matrix</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-2xs font-extrabold text-slate-600 dark:text-slate-300">
                            <span>Line Voltage (V_line)</span>
                            <span className="font-mono text-amber-500 font-black">{phasePower.voltage} Volts AC</span>
                          </div>
                          <input 
                            type="range" 
                            min="208" 
                            max="600" 
                            step="4"
                            value={phasePower.voltage}
                            onChange={(e) => setPhasePower(prev => ({ ...prev, voltage: parseInt(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-2xs font-extrabold text-slate-600 dark:text-slate-300">
                            <span>Continuous Load Current (I)</span>
                            <span className="font-mono text-amber-500 font-black">{phasePower.current} Amps</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="120" 
                            value={phasePower.current}
                            onChange={(e) => setPhasePower(prev => ({ ...prev, current: parseInt(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-2xs font-extrabold text-slate-600 dark:text-slate-300">
                            <span>Power Factor (cos φ)</span>
                            <span className="font-mono text-amber-500 font-black">{phasePower.pf}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.4" 
                            max="1.0" 
                            step="0.05"
                            value={phasePower.pf}
                            onChange={(e) => setPhasePower(prev => ({ ...prev, pf: parseFloat(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 grid grid-cols-2 gap-2 text-center divide-x divide-slate-200 dark:divide-slate-805">
                          <div className="space-y-0.5">
                            <span className="text-4xs font-extrabold uppercase text-slate-400 dark:text-slate-550 tracking-wider block">Apparent S (kVA)</span>
                            <span className="text-lg font-black text-slate-800 dark:text-white font-mono">
                              {(1.732 * phasePower.voltage * phasePower.current / 1000).toFixed(2)}
                            </span>
                          </div>
                          <div className="space-y-0.5 pl-2">
                            <span className="text-4xs font-extrabold uppercase text-slate-400 dark:text-slate-550 tracking-wider block">Active Real P (kW)</span>
                            <span className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono">
                              {(1.732 * phasePower.voltage * phasePower.current * phasePower.pf / 1000).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right panel: Line runs voltage drop */}
                  <div className="lg:col-span-6">
                    
                    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4 h-full flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="text-4xs font-black text-amber-505 dark:text-amber-400 uppercase tracking-widest block leading-none mb-1">Interactive Sandbox C</span>
                          <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-tight">Single-Phase Line Run Voltage Drop Solver</h4>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-2xs font-extrabold text-slate-600 dark:text-slate-300">
                            <span>Conductor Cable length (L)</span>
                            <span className="font-mono text-amber-500 font-black">{vdCalc.length} Meters run</span>
                          </div>
                          <input 
                            type="range" 
                            min="5" 
                            max="250" 
                            step="5"
                            value={vdCalc.length}
                            onChange={(e) => setVdCalc(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-2xs font-extrabold text-slate-600 dark:text-slate-300">
                            <span>Load Design Current (Ib)</span>
                            <span className="font-mono text-amber-500 font-black">{vdCalc.load} Amperes</span>
                          </div>
                          <input 
                            type="range" 
                            min="2" 
                            max="80" 
                            value={vdCalc.load}
                            onChange={(e) => setVdCalc(prev => ({ ...prev, load: parseInt(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                            Conductor Size Selector (Cross Section)
                          </label>
                          <select
                            value={vdCalc.size}
                            onChange={(e) => setVdCalc(prev => ({ ...prev, size: parseFloat(e.target.value) }))}
                            className="w-full text-xs p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-805 dark:text-slate-100 font-extrabold focus:ring-1 focus:ring-amber-500 outline-none"
                          >
                            <option value="1.5">1.5 mm² Copper (resistance R = 12.1 Ω/km)</option>
                            <option value="2.5">2.5 mm² Copper (resistance R = 7.41 Ω/km)</option>
                            <option value="4">4.0 mm² Copper (resistance R = 4.61 Ω/km)</option>
                            <option value="6">6.0 mm² Copper (resistance R = 3.08 Ω/km)</option>
                            <option value="10">10.0 mm² Copper (resistance R = 1.83 Ω/km)</option>
                            <option value="16">16.0 mm² Copper (resistance R = 1.15 Ω/km)</option>
                            <option value="25">25.0 mm² Copper (resistance R = 0.727 Ω/km)</option>
                            <option value="35">35.0 mm² Copper (resistance R = 0.524 Ω/km)</option>
                          </select>
                        </div>
                      </div>

                      {/* Calculation results output */}
                      {(() => {
                        // R lookup value
                        const rValues: { [key: number]: number } = {
                          1.5: 12.1, 2.5: 7.41, 4: 4.61, 6: 3.08, 10: 1.83, 16: 1.15, 25: 0.727, 35: 0.524
                        };
                        const R_val = rValues[vdCalc.size] || 3.08;
                        const vDrop = (2 * vdCalc.load * vdCalc.length * R_val / 1000);
                        const vDropPercent = (vDrop / 230) * 100;
                        const ok = vDropPercent <= 3.0;

                        return (
                          <div className="space-y-4 pt-4">
                            <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-800 space-y-1.5 text-center">
                              <span className="text-4xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">Estimated Line drop metrics</span>
                              <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 font-mono block">
                                {vDrop.toFixed(2)} Volts ({vDropPercent.toFixed(2)}%)
                              </span>
                              <span className="text-4xs font-black uppercase text-slate-500 block">
                                Supply Baseline: 230V Single-Phase Standard
                              </span>
                            </div>

                            <div className={`p-3.5 rounded-xl border text-xs font-semibold leading-relaxed flex gap-2.5 items-start ${
                              ok 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                                : "bg-red-500/10 border-red-550/20 text-red-800 dark:text-red-400"
                            }`}>
                              <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${ok ? "text-emerald-555" : "text-red-550"}`} />
                              <div>
                                <span className="block font-black uppercase tracking-wider text-[9px] mb-0.5">
                                  {ok ? "Voltage Drop Compliant" : "VOLTAGE DROP WARNING LIMIT VIOLATED"}
                                </span>
                                <span className="block text-3xs">
                                  {ok 
                                    ? `Total line loss represents ${vDropPercent.toFixed(2)}%, which successfully falls under the standard regulatory max of 3.0% for branch distribution lines.`
                                    : `Total line loss represents ${vDropPercent.toFixed(2)}%, which EXCEEDS the regulatory maximum 3% circuit limit under BS 7671 / NEC rules. It is highly recommended to upsize to a thicker cross-section or decrease run distance.`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </div>
              )}

              {/* VIEWPORT 4: GOOGLE AI STUDIO SYSTEM SPECIFICATIONS SHEET */}
              {unitsActiveSubTab === "spec" && (
                <div className="space-y-6">
                  
                  {/* Cards describing system agent alignment */}
                  <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
                    <div>
                      <div className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider block">
                        COBALT SPECIFICATIONS SHEET
                      </div>
                      <h4 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-tight">
                        AI Studio Agent Configuration Blueprint
                      </h4>
                      <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">
                        Direct text blueprints designed to deploy this multi-step self-routing agent directly inside the Google AI Studio console or your custom SDK integrations.
                      </p>
                    </div>

                    <div className="space-y-5">
                      
                      {/* Configuration A: System Prompt */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-black text-slate-805 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Bot className="w-4 h-4 text-amber-500" />
                            1. Agent Role (System Instructions)
                          </h5>
                          <button
                            onClick={() => handleCopyText(`You are ELECTRO SYSTEM APP, an AI powered electrical engineering assistant. You automatically detect the user’s intent and route the request to the correct internal tool: – Unit Conversion Engine – Electrical Symbol Engine – Electrical Formula Engine – Diagram Generator – Cable Sizing Engine – Load Calculation Engine – Standards & Code Reference Engine.
Always produce engineering grade outputs with formulas, steps, tables, and NEC/IEC aligned reasoning.
When generating diagrams, use ASCII or structured text. When performing calculations, show formulas and intermediate steps. When referencing standards, provide general guidelines and links.`, "ai_sys_prompt")}
                            className="text-4xs font-extrabold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 text-slate-705 dark:text-slate-350 cursor-pointer flex items-center gap-1"
                          >
                            {copiedPrompt === "ai_sys_prompt" ? "Copied!" : "Copy Instructions"}
                          </button>
                        </div>
                        <pre className="text-3xs text-slate-650 dark:text-slate-350 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl font-mono whitespace-pre-wrap leading-relaxed font-semibold max-h-48 overflow-y-auto">
{`You are ELECTRO SYSTEM APP, an AI powered electrical engineering assistant. You automatically detect the user’s intent and route the request to the correct internal tool: – Unit Conversion Engine – Electrical Symbol Engine – Electrical Formula Engine – Diagram Generator – Cable Sizing Engine – Load Calculation Engine – Standards & Code Reference Engine.
Always produce engineering grade outputs with formulas, steps, tables, and NEC/IEC aligned reasoning.
When generating diagrams, use ASCII or structured text. When performing calculations, show formulas and intermediate steps. When referencing standards, provide general guidelines and links.`}
                        </pre>
                      </div>

                      {/* Configuration B: Routing Logic Mapping table */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-black text-slate-805 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-555" />
                          2. Agent Workflow Logic (Triggers Routing Matrix)
                        </h5>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-850">
                          <table className="w-full text-left border-collapse text-3xs font-semibold leading-relaxed">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-extrabold border-b border-slate-200 dark:border-slate-800">
                                <th className="p-2.5 md:p-3">User Input Query Phrasing</th>
                                <th className="p-2.5 md:p-3">Primary Tool Selected</th>
                                <th className="p-2.5 md:p-3">Engineering Output Target Format</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                              <tr>
                                <td className="p-2.5 md:p-3 font-semibold text-slate-800 dark:text-white">"Convert units, kW to kVA, amperes to mm² core..."</td>
                                <td className="p-2.5 md:p-3 font-mono text-amber-600 dark:text-amber-400 font-black">Unit Conversion Engine</td>
                                <td className="p-2.5 md:p-3">Multi-step mathematical factor walkthrough &amp; calculations</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 md:p-3 font-semibold text-slate-800 dark:text-white">"What is the schematic symbol for transformer/contactors..."</td>
                                <td className="p-2.5 md:p-3 font-mono text-amber-600 dark:text-amber-400 font-black">Symbol Engine</td>
                                <td className="p-2.5 md:p-3">Rendering detailed ASCII block symbol with designator IDs</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 md:p-3 font-semibold text-slate-800 dark:text-white">"Size feeders, calculate circuit current, voltage drops..."</td>
                                <td className="p-2.5 md:p-3 font-mono text-amber-600 dark:text-amber-400 font-black">Formula + Sizing Engine</td>
                                <td className="p-2.5 md:p-3">Complete physical reports containing copper gauges, breaker curves &amp; loss %</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 md:p-3 font-semibold text-slate-800 dark:text-white">"Draw single line schematic of main sub-panel feeds..."</td>
                                <td className="p-2.5 md:p-3 font-mono text-amber-600 dark:text-amber-400 font-black">Diagram Generator</td>
                                <td className="p-2.5 md:p-3">Complex ASCII single-wire layout blueprint blocks</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 md:p-3 font-semibold text-slate-800 dark:text-white">"Explain standard NEC conduit fill or IEC ratings rules..."</td>
                                <td className="p-2.5 md:p-3 font-mono text-amber-600 dark:text-amber-400 font-black">Standards &amp; Codes Engine</td>
                                <td className="p-2.5 md:p-3">Citing specific standard clauses, limits and compliance warnings</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Configuration C: Tool Schemas */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Sliders className="w-4 h-4 text-blue-500" />
                            3. AI Studio Function Definitions (JSON Schema blueprint)
                          </h5>
                          <button
                            onClick={() => handleCopyText(`[
  {
    "name": "unit_conversion_engine",
    "description": "Performs electrical unit conversions (e.g. kW to kVA, HP to kW, continuous load ampacity).",
    "parameters": {
      "type": "OBJECT",
      "properties": {
        "from_unit": {"type": "STRING", "description": "Source unit name (e.g., kW, HP)"},
        "to_unit": {"type": "STRING", "description": "Target unit name (e.g., kVA, kW)"},
        "value": {"type": "NUMBER", "description": "Numeric value to convert"},
        "power_factor": {"type": "NUMBER", "description": "Reactive load correction coefficient (typically 0.85)"}
      },
      "required": ["from_unit", "to_unit", "value"]
    }
  },
  {
    "name": "cable_sizing_engine",
    "description": "Calculates safe conductor cross-sections, continuous overcurrent trip switches, and containment drop metrics.",
    "parameters": {
      "type": "OBJECT",
      "properties": {
        "load_kw": {"type": "NUMBER", "description": "Active power of load in Kilowatts"},
        "voltage": {"type": "NUMBER", "description": "Line operational voltage (e.g., 230, 400)"},
        "phases": {"type": "NUMBER", "description": "Supply phase configuration (1 or 3)"},
        "length_meters": {"type": "NUMBER", "description": "Total length run scale in meters"},
        "ambient_temp": {"type": "NUMBER", "description": "Thermal environment temperature in Celsius"}
      },
      "required": ["load_kw", "voltage", "phases", "length_meters"]
    }
  }
]`, "tool_schemas_spec")}
                            className="text-4xs font-extrabold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 text-slate-705 dark:text-slate-350 cursor-pointer flex items-center gap-1"
                          >
                            {copiedPrompt === "tool_schemas_spec" ? "Copied!" : "Copy JSON Specifications"}
                          </button>
                        </div>
                        <pre className="text-3xs text-slate-650 dark:text-slate-350 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl font-mono whitespace-pre-wrap leading-relaxed font-semibold max-h-56 overflow-y-auto">
{`[
  {
    "name": "unit_conversion_engine",
    "description": "Performs electrical unit conversions (e.g. kW to kVA, HP to kW, continuous load ampacity).",
    "parameters": {
      "type": "OBJECT",
      "properties": {
        "from_unit": {"type": "STRING", "description": "Source unit name (e.g., kW, HP)"},
        "to_unit": {"type": "STRING", "description": "Target unit name (e.g., kVA, kW)"},
        "value": {"type": "NUMBER", "description": "Numeric value to convert"},
        "power_factor": {"type": "NUMBER", "description": "Reactive load correction coefficient (typically 0.85)"}
      },
      "required": ["from_unit", "to_unit", "value"]
    }
  },
  {
    "name": "cable_sizing_engine",
    "description": "Calculates safe conductor cross-sections, continuous overcurrent protection ratings, and voltage drops.",
    "parameters": {
      "type": "OBJECT",
      "properties": {
        "load_kw": {"type": "NUMBER", "description": "Active power of load in Kilowatts"},
        "voltage": {"type": "NUMBER", "description": "Line operational voltage (e.g., 230, 400)"},
        "phases": {"type": "NUMBER", "description": "Supply phase configuration (1 or 3)"},
        "length_meters": {"type": "NUMBER", "description": "Total length run scale in meters"},
        "ambient_temp": {"type": "NUMBER", "description": "Thermal environment temperature in Celsius"}
      },
      "required": ["load_kw", "voltage", "phases", "length_meters"]
    }
  }
]`}
                        </pre>
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 5: USEFUL EXTERNAL REFERENCES AND LINKS */}
          {activeTab === "references" && (
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-6">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">
                  EXTERNAL STANDARDS &amp; LEARNING LINKS
                </div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">
                  Engineering Standards &amp; Manufacturer Manuals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Cross-check sizer results directly using globally recognized bodies, standard-governing books, and manufacturer coordination application notes.
                </p>
              </div>

              {/* Grouped Links */}
              <div className="space-y-5">
                
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-505 tracking-wider mb-2.5 block">
                    Global Regulatory Sizing Standards
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a 
                      href="https://www.iec.ch" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-emerald-500/5 hover:border-emerald-500/35 transition cursor-pointer flex justify-between items-center group font-semibold text-2xs text-slate-755 dark:text-slate-200"
                    >
                      <div>
                        <span className="block font-black text-slate-850 dark:text-white group-hover:text-emerald-650 dark:group-hover:text-emerald-405 text-xs">International Electrotechnical Commission</span>
                        <span className="text-[10px] text-slate-450 mt-0.5 block">Official structural global IEC power parameters</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-550 transition-colors shrink-0 ml-2" />
                    </a>

                    <a 
                      href="https://www.nfpa.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-emerald-500/5 hover:border-emerald-500/35 transition cursor-pointer flex justify-between items-center group font-semibold text-2xs text-slate-755 dark:text-slate-200"
                    >
                      <div>
                        <span className="block font-black text-slate-850 dark:text-white group-hover:text-emerald-650 dark:group-hover:text-emerald-405 text-xs">National Electrical Code (NEC)</span>
                        <span className="text-[10px] text-slate-450 mt-0.5 block">Official home of electrical NFPA 70 guidelines</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-550 transition-colors shrink-0 ml-2" />
                    </a>

                    <a 
                      href="https://www.ieee.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-emerald-500/5 hover:border-emerald-500/35 transition cursor-pointer flex justify-between items-center group font-semibold text-2xs text-slate-755 dark:text-slate-200"
                    >
                      <div>
                        <span className="block font-black text-slate-850 dark:text-white group-hover:text-emerald-650 dark:group-hover:text-emerald-405 text-xs">IEEE Engineering Network</span>
                        <span className="text-[10px] text-slate-450 mt-0.5 block">Industrial power sizing reference digests</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-550 transition-colors shrink-0 ml-2" />
                    </a>

                    <a 
                      href="https://webstore.iec.ch" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-slate-155 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-emerald-500/5 hover:border-emerald-500/35 transition cursor-pointer flex justify-between items-center group font-semibold text-2xs text-slate-755 dark:text-slate-200"
                    >
                      <div>
                        <span className="block font-black text-slate-850 dark:text-white group-hover:text-emerald-650 dark:group-hover:text-emerald-405 text-xs">IEC 60364 Sizing standard</span>
                        <span className="text-[10px] text-slate-450 mt-0.5 block">Official webstore entry for low-voltage systems</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-550 transition-colors shrink-0 ml-2" />
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-505 tracking-wider mb-2.5 block">
                    Manufacturer application Notes &amp; Sizing Coordination Guides
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a 
                      href="https://www.se.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-amber-500/5 hover:border-amber-500/35 transition cursor-pointer flex justify-between items-center group font-semibold text-2xs text-slate-755 dark:text-slate-200"
                    >
                      <div>
                        <span className="block font-black text-slate-855 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 text-xs">Schneider Electric Technical Guide</span>
                        <span className="text-[10px] text-slate-455 mt-0.5 block">Low-voltage installation guidelines &amp; coordination</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0 ml-2" />
                    </a>

                    <a 
                      href="https://www.siemens.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-amber-500/5 hover:border-amber-500/35 transition cursor-pointer flex justify-between items-center group font-semibold text-2xs text-slate-755 dark:text-slate-200"
                    >
                      <div>
                        <span className="block font-black text-slate-855 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 text-xs">Siemens Power Sizing Manual</span>
                        <span className="text-[10px] text-slate-455 mt-0.5 block">Medium &amp; low voltage breaker selectivity curve books</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0 ml-2" />
                    </a>

                    <a 
                      href="https://new.abb.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-amber-500/5 hover:border-amber-500/35 transition cursor-pointer flex justify-between items-center group font-semibold text-2xs text-slate-755 dark:text-slate-200"
                    >
                      <div>
                        <span className="block font-black text-slate-855 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 text-xs">ABB Technical Solutions</span>
                        <span className="text-[10px] text-slate-455 mt-0.5 block">Cascade protection schemes and motor sizing tools</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0 ml-2" />
                    </a>

                    <a 
                      href="https://www.eaton.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-amber-500/5 hover:border-amber-500/35 transition cursor-pointer flex justify-between items-center group font-semibold text-2xs text-slate-755 dark:text-slate-200"
                    >
                      <div>
                        <span className="block font-black text-slate-855 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 text-xs">Eaton Power distribution Design Guide</span>
                        <span className="text-[10px] text-slate-455 mt-0.5 block">Overcurrent coordination and feeder ampacity factors</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0 ml-2" />
                    </a>
                  </div>
                </div>

                {/* Open access textbooks, search suggestions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h5 className="text-xs font-black uppercase text-slate-405 dark:text-slate-400 block tracking-tight">Active Online Search Recommendations</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-3xs font-mono text-slate-600 dark:text-slate-350">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
                      <span className="block font-bold text-amber-600 dark:text-amber-400 mb-1">Open Sizing Textbooks</span>
                      <span>Search: <code className="text-emerald-500">"open access power systems textbook"</code> to find downloadable academic books.</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
                      <span className="block font-bold text-amber-600 dark:text-amber-400 mb-1">Calculators &amp; Drop Rules</span>
                      <span>Search: <code className="text-emerald-500">"LV cable sizing calculator"</code> or <code className="text-emerald-500">"voltage drop calculator"</code>.</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
                      <span className="block font-bold text-amber-600 dark:text-amber-400 mb-1">Manufacturer Selector Apps</span>
                      <span>Search: <code className="text-emerald-500">"MCB MCCB selection tool" + manufacturer name</code> to map curves.</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
