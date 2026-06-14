/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ELECTRO SYSTEM APP - DIAGNOSTIC COCKPIT
 * High-fidelity, engineering-grade multi-agent cockpit implementing:
 * 1. Problem Intake and Classifier (Left Pane)
 * 2. Specialized Agent Timeline / Chat (Center Pane)
 * 3. Tools Panel & Formula Simulator (Right Pane)
 * 4. High-fidelity PDF report generation incorporating all calculations, formulas, and checklists.
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
  Compass, 
  ArrowRight, 
  Check, 
  ChevronRight, 
  Download, 
  AlertOctagon, 
  Info,
  Activity,
  Printer,
  RotateCcw,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  HelpCircle
} from "lucide-react";
import { jsPDF } from "jspdf";
import { ElectroOrchestrator, AgentType, RoutingOutput } from "../utils/ElectroOrchestrator";

interface DiagnosticCockpitProps {
  onAskAI: (prompt: string) => void;
  onNavigateToAssistant?: () => void;
}

interface Message {
  id: string;
  sender: "user" | "orchestrator" | "agent";
  agentName?: string;
  text: string;
  timestamp: string;
  formulasUsed?: string[];
  complianceNotes?: string;
  classificationScores?: {
    hardware: number;
    field: number;
    grid: number;
  };
}

export default function DiagnosticCockpit({ onAskAI, onNavigateToAssistant }: DiagnosticCockpitProps) {
  // Primary State
  const [userInput, setUserInput] = useState("");
  const [isRouting, setIsRouting] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentType>("hardware");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [chatLog, setChatLog] = useState<Message[]>([
    {
      id: "init",
      sender: "orchestrator",
      text: "ELECTRO SYSTEM APP Routing Core initialized. Submit hardware component, field machinery, or distribution grid simulator inquiries to automate diagnostic analysis.",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);

  // Scores state
  const [scores, setScores] = useState({ hardware: 0, field: 0, grid: 0 });
  const [routingReason, setRoutingReason] = useState("");

  // Tools Pane Active Calculator State
  const [activeTool, setActiveTool] = useState<"voltage" | "fault" | "test">("voltage");

  // ==========================================
  // REAL-TIME TOOL 1: VOLTAGE DROP CALCULATOR
  // ==========================================
  const [vdPhase, setVdPhase] = useState<"single" | "three">("three");
  const [vdCableLen, setVdCableLen] = useState(150); // meters
  const [vdAmps, setVdAmps] = useState(30); // load current
  const [vdResistance, setVdResistance] = useState(0.85); // resistance Ohms/km
  const [vdNominalV, setVdNominalV] = useState(415); // standard line-line V
  const [vdResultV, setVdResultV] = useState(0); // dropped Volts
  const [vdResultP, setVdResultP] = useState(0); // dropped %

  useEffect(() => {
    // Single Phase: VD = (2 * L * I * R) / 1000
    // Three Phase: VD = (√3 * L * I * R) / 1000
    const factor = vdPhase === "three" ? Math.sqrt(3) : 2.0;
    const drop = (factor * vdCableLen * vdAmps * vdResistance) / 1000;
    setVdResultV(drop);
    const pct = (drop / vdNominalV) * 100;
    setVdResultP(isNaN(pct) ? 0 : Math.min(100, pct));
  }, [vdPhase, vdCableLen, vdAmps, vdResistance, vdNominalV]);


  // ==========================================
  // REAL-TIME TOOL 2: FAULT CURRENT CALCULATOR
  // ==========================================
  const [fcCapacityMVA, setFcCapacityMVA] = useState(15); // Base MVA
  const [fcNominalKV, setFcNominalKV] = useState(11.0); // Base kV
  const [fcImpedancePct, setFcImpedancePct] = useState(5.5); // Z% of transformer
  const [fcXR, setFcXR] = useState(7.0); // X/R ratio
  const [fcIscSymmetrical, setFcIscSymmetrical] = useState(0); // kA
  const [fcIscAsymmetrical, setFcIscAsymmetrical] = useState(0); // kA peak

  useEffect(() => {
    // I_base = MVA * 10^3 / (√3 * kV_base) [Amps] -> divider is kA
    const deno = Math.sqrt(3) * fcNominalKV;
    if (deno > 0) {
      const baseKA = fcCapacityMVA / deno;
      // Symmetrical Short Circuit: I_sc = I_base / (Z% / 100)
      const symKA = baseKA / (fcImpedancePct / 100);
      setFcIscSymmetrical(isNaN(symKA) ? 0 : symKA);

      // Asymmetrical Multiplier (k_peak) = √2 * [1 + exp(-π / (X/R))]
      const mult = Math.sqrt(2) * (1 + Math.exp(-Math.PI / fcXR));
      setFcIscAsymmetrical(isNaN(symKA) ? 0 : symKA * mult);
    }
  }, [fcCapacityMVA, fcNominalKV, fcImpedancePct, fcXR]);


  // ==========================================
  // REAL-TIME TOOL 3: AUTOMATED TEST PROCEDURE GENERATOR
  // ==========================================
  const [testDomain, setTestDomain] = useState<AgentType>("hardware");
  const [testEquipment, setTestEquipment] = useState("High-Power MOSFET Converter Board V2");
  const [testProcedureList, setTestProcedureList] = useState<string[]>([]);

  useEffect(() => {
    const generateSteps = () => {
      let checklist: string[] = [];
      if (testDomain === "hardware") {
        checklist = [
          `SAFETY COMPLIANCE: De-energize ${testEquipment}. Configure ground strap rings and static wristband protectors.`,
          "PCB AUDIT: Place board under microscope. Inspect trace junctions for copper corrosion, visual micro-bridges, and dry solder voids.",
          `CONTINUITY CHECK: Probe critical LDO linear voltage rails to ground (minimum resistance boundary > 10 kΩ).`,
          "COLD PROBE: Test bypass capacitor networks with LCR bridge; confirm low Equivalent Series Resistance (ESR).",
          "STEP POWER UP: Switch laboratory power supply to current-limit (2.0 A threshold cutoff) and slowly increment main rail voltage.",
          "THERMOGRAPHY STAGE: Capture active thermal-imaging metrics of the board regulators, highlighting localized hotspots above 65°C."
        ];
      } else if (testDomain === "field") {
        checklist = [
          `SAFETY COMPLIANCE: Apply Lock-out / Tag-out (LOTO) key locks on core upstream breaker switchgear matching ${testEquipment}.`,
          "INSULATION RESISTANCE: Connect standard 1000V DC Megger across motor windings; verify winding-to-case insulation exceeds 100 Megohms.",
          "PHASE WINDING SYMMETRY: Utilize low-resistance digital micro-ohmmeter to record internal winding balanced resistances; tolerance limit < 1.0%.",
          "VOLTAGE SUPPLY AUDIT: Check cable screw terminals torque values to prevent localized hotspots and micro-arcing energy.",
          "NO-LOAD TEST RUN: Verify rotational mechanical bearings alignment, shaft vibration ratios, and startup current peak duration."
        ];
      } else {
        checklist = [
          `SYSTEM DATA INGESTION: Compile vector configurations and bus nominal impedances mapping to ${testEquipment}.`,
          "SIMULATOR ALIGNMENT: Model transformer Dyn11 group vector connections inside local OpenDSS or MATPOWER script databases.",
          "POWER RESOLUTIONS RUN: Execute high-fidelity Newton-Raphson load-flow convergence iterations to confirm solver convergence.",
          "FAULT COORDINATION MODELING: Simulate symmetrical three-phase substation feed short-circuits to determine safe grading margins.",
          "PROTECTION TRIP TIMING: Audit active overcurrent relay inverse curves (ANSI 50/51) to prevent cascading blackout events."
        ];
      }
      setTestProcedureList(checklist);
    };
    generateSteps();
  }, [testDomain, testEquipment]);


  // ==========================================
  // REAL-TIME ACTIONS: QUICK SIMULATORS
  // ==========================================
  const triggerVoltageDropCalculation = () => {
    const factor = vdPhase === "three" ? Math.sqrt(3) : 2.0;
    const drop = (factor * vdCableLen * vdAmps * vdResistance) / 1000;
    const pct = (drop / vdNominalV) * 100;
    const isCompliant = pct <= 3.0;

    const calcId = `calc-vd-${Date.now()}`;
    setChatLog(prev => [
      ...prev,
      {
        id: calcId,
        sender: "orchestrator",
        text: `📊 VOLTAGE DROP CALCULATION TRIGGERED\n\nApparatus/System: Single/Three-Phase Branch Feeder Link\nPhase Mode: ${vdPhase.toUpperCase()}-Phase Configuration\nNominal Supply: ${vdNominalV} V AC\nConductor Length: ${vdCableLen} m\nLoad Current: ${vdAmps} A\nCable Resistivity: ${vdResistance} Ω/km\n\nResulting Voltage Drop: ${drop.toFixed(3)} V\nPercentage Drop: ${pct.toFixed(2)}%\nCompliance Status: ${isCompliant ? "PASSED (Within 3.0% limit)" : "FAILED (Exceeds NEC 3.0% threshold)"}`,
        timestamp: new Date().toLocaleTimeString(),
        formulasUsed: [
          `VD = (${factor.toFixed(3)} * ${vdCableLen}m * ${vdAmps}A * ${vdResistance}Ω/km) / 1000 = ${drop.toFixed(3)} V`,
          `Drop Ratio = (${drop.toFixed(3)} V / ${vdNominalV} V) * 100 = ${pct.toFixed(3)}%`
        ],
        complianceNotes: isCompliant 
          ? "System matches NEC Section 210.19(A) branch specifications." 
          : "WARNING: Excessive voltage drop ratio. Conductor gauge must be enlarged to maintain line voltage."
      }
    ]);
    setActiveTool("voltage");
  };

  const triggerFaultCurrentCalculation = () => {
    const deno = Math.sqrt(3) * fcNominalKV;
    if (deno > 0) {
      const baseKA = fcCapacityMVA / deno;
      const symKA = baseKA / (fcImpedancePct / 100);
      const mult = Math.sqrt(2) * (1 + Math.exp(-Math.PI / fcXR));
      const asymKA = symKA * mult;

      const calcId = `calc-fc-${Date.now()}`;
      setChatLog(prev => [
        ...prev,
        {
          id: calcId,
          sender: "orchestrator",
          text: `⚡ TRANSFORMER FAULT CALCULATION TRIGGERED\n\nTransformer Capacity: ${fcCapacityMVA} MVA\nNominal Feed Voltage: ${fcNominalKV} kV\nSubtransient Impedance: ${fcImpedancePct}%\nX/R Inductive Ratio: ${fcXR}\n\nFault Current Symmetrical Peak: ${symKA.toFixed(3)} kA\nPeak Asymmetrical Fault Current: ${asymKA.toFixed(3)} kA`,
          timestamp: new Date().toLocaleTimeString(),
          formulasUsed: [
            `I_base = ${fcCapacityMVA} MVA / (√3 * ${fcNominalKV} kV) = ${baseKA.toFixed(3)} kA`,
            `I_sc = ${baseKA.toFixed(3)} kA / (${fcImpedancePct}% / 100) = ${symKA.toFixed(3)} kA`,
            `Asymmetrical Multiplier = √2 * [1 + e^(-π / ${fcXR})] = ${mult.toFixed(3)}`,
            `Asymmetrical Peak (I_peak) = ${symKA.toFixed(3)} * ${mult.toFixed(3)} = ${asymKA.toFixed(3)} kA`
          ],
          complianceNotes: "IEEE Std 242 (Buff Book) symmetrical fault specifications matched."
        }
      ]);
    }
    setActiveTool("fault");
  };

  const triggerAutomatedTestProcedure = () => {
    const calcId = `calc-proc-${Date.now()}`;
    const procedureListStr = testProcedureList.map((step, idx) => `${idx + 1}. [ ] ${step}`).join("\n");
    setChatLog(prev => [
      ...prev,
      {
        id: calcId,
        sender: "orchestrator",
        text: `📋 AUTOMATED TEST PROCEDURES GENERATED\n\nTarget Apparatus: ${testEquipment}\nClassification Mode: ${testDomain.toUpperCase()} STANDARDS\nTotal Checklist Steps: ${testProcedureList.length}`,
        timestamp: new Date().toLocaleTimeString(),
        formulasUsed: [
          `Procedure Template: ISO 9001 quality audit & testing sequence`
        ],
        complianceNotes: testDomain === "hardware" 
          ? "Guidelines: IPC-2152, IPC-2221A." 
          : testDomain === "field" 
          ? "Guidelines: NEC Table 310.16, OSHA LOTO standard." 
          : "Guidelines: IEEE Std 242 System protection curves."
      },
      {
        id: `proc-list-${Date.now()}`,
        sender: "agent",
        agentName: testDomain === "hardware" ? "Circuit Hardware Agent" : testDomain === "field" ? "Field Electrical Agent" : "Utility Grid Agent",
        text: `Deploying custom test inspection sequence for "${testEquipment}":\n\n${procedureListStr}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    setActiveTool("test");
  };


  // ==========================================
  // EXECUTE INTEGRATED MULTI-AGENT ROUTING
  // ==========================================
  const handleRouteQuery = (textToRoute: string) => {
    if (!textToRoute.trim()) return;

    setIsRouting(true);

    setTimeout(() => {
      // Execute modular ElectroOrchestrator lexical scoring
      const evaluation: RoutingOutput = ElectroOrchestrator.route(textToRoute);

      setScores(evaluation.scores);
      setRoutingReason(evaluation.reasoning);
      setActiveAgent(evaluation.routedAgent);

      const userMsgId = `msg-user-${Date.now()}`;
      const orchMsgId = `msg-orch-${Date.now()}`;
      const agentMsgId = `msg-agent-${Date.now()}`;

      setChatLog(prev => [
        ...prev,
        {
          id: userMsgId,
          sender: "user",
          text: textToRoute,
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          id: orchMsgId,
          sender: "orchestrator",
          text: `Lexical analyzer scoring: Hardware: ${evaluation.scores.hardware}% | Field: ${evaluation.scores.field}% | Grid: ${evaluation.scores.grid}%. Routing query to the specialized ${evaluation.routedAgent.toUpperCase()} AGENT.`,
          timestamp: new Date().toLocaleTimeString(),
          classificationScores: evaluation.scores
        },
        {
          id: agentMsgId,
          sender: "agent",
          agentName: evaluation.routedAgent === "hardware" ? "Circuit Hardware Agent" : evaluation.routedAgent === "field" ? "Field Electrical Agent" : "Utility Grid Agent",
          text: evaluation.response,
          timestamp: new Date().toLocaleTimeString(),
          formulasUsed: evaluation.suggestedFormulas,
          complianceNotes: evaluation.complianceNotes
        }
      ]);

      setUserInput("");
      setIsRouting(false);
    }, 750);
  };


  // ==========================================
  // ENGINEERING HIGH-FIDELITY PDF GENERATOR
  // ==========================================
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Color Theme Constants
    const colorPrimary = [15, 23, 42]; // Slate 900
    const colorSecondary = [79, 70, 229]; // Indigo 600
    const colorAccent = [245, 158, 11]; // Amber 500
    const colorGray = [100, 116, 139]; // Slate 500
    const colorLightBg = [248, 250, 252]; // Slate 50

    let currentY = 15;

    // --- PAGE 1: HEADER & SPECIFICATION SHEET ---
    
    // Grid Background Accents (Engineering blueprint look)
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.1);
    for (let x = 0; x < 210; x += 10) {
      doc.line(x, 0, x, 297);
    }
    for (let y = 0; y < 297; y += 10) {
      doc.line(0, y, 210, y);
    }

    // Outer Blueprint Border
    doc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setLineWidth(0.8);
    doc.rect(8, 8, 194, 281);

    // Document Title Banner
    doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.rect(10, 10, 190, 22, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ELECTRO SYSTEM APP - DIAGNOSTIC REPORT", 15, 19);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`VERIFICATION FILE: ESA-${Date.now()}  |  DATE: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 27);

    // Classification Box
    currentY = 40;
    doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2]);
    doc.rect(10, currentY, 190, 25, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(10, currentY, 190, 25);

    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ORCHESTRATOR DIAGNOSTIC CLASSIFICATION SCORING", 15, currentY + 6);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Hardware Circuit Index: ${scores.hardware}%`, 15, currentY + 13);
    doc.text(`Field Electrical Index: ${scores.field}%`, 15, currentY + 19);
    doc.text(`Grid Simulation Index: ${scores.grid}%`, 95, currentY + 13);
    doc.text(`Target Agent Module: ${activeAgent.toUpperCase()}_EXPERT_RULES_V1`, 95, currentY + 19);

    // Active Query & Problem Pattern Section
    currentY = 72;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
    doc.text("IDENTIFIED INQUIRY & PROBLEM PATTERN DESCRIPTION", 10, currentY);
    
    doc.setDrawColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
    doc.setLineWidth(0.3);
    doc.line(10, currentY + 2, 200, currentY + 2);

    // Find last user input
    const lastUserQuery = [...chatLog].reverse().find(m => m.sender === "user")?.text || "No custom dynamic query submitted. Calculated default hardware configurations.";
    doc.setTextColor(51, 65, 85);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    
    // Split text with margins
    const queryTextLines = doc.splitTextToSize(lastUserQuery, 185);
    doc.text(queryTextLines, 12, currentY + 8);
    currentY += 10 + (queryTextLines.length * 4);

    // Agent Remediation Output
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
    doc.text("SPECIALIZED ENGINEERING AGENT RESOLUTIONS", 10, currentY);
    doc.line(10, currentY + 2, 200, currentY + 2);

    const lastAgentResponse = [...chatLog].reverse().find(m => m.sender === "agent")?.text || 
      "Hardware Diagnostic Agent Remediation Insight: Circuit level concerns detected. Trace sizing must support load requirements safely. Keep input-to-output voltage drop across linear regulators minimal to prevent catastrophic thermal runaway. Add stitch ground planes and heat-sink copper-vias beneath high-temp components.";
    
    const agentTextLines = doc.splitTextToSize(lastAgentResponse, 185);
    doc.setTextColor(51, 65, 85);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(agentTextLines, 12, currentY + 8);
    currentY += 10 + (agentTextLines.length * 4);

    // Mathematical Equations Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
    doc.text("VERIFIED TECHNICAL FORMULATIONS", 10, currentY);
    doc.line(10, currentY + 2, 200, currentY + 2);

    const formulasToShow = [...chatLog].reverse().find(m => m.sender === "agent")?.formulasUsed || [
      "Power Loss of linear regulator: P_diss = (V_in - V_out) * I_load",
      "IPC-2152 trace temp rise formula: Delta_T = (I_amps / (k * Area_sq_mils^0.725))^(1/0.445)",
      "Resistance of a trace: R = (rho * Length) / (Width * Thickness)"
    ];

    let formulaY = currentY + 8;
    formulasToShow.forEach((frm) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(10, formulaY - 3, 190, 7, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFont("Courier", "bold");
      doc.setFontSize(8.5);
      doc.text(`[Formula] ${frm}`, 13, formulaY + 1.5);
      formulaY += 8.5;
    });

    currentY = formulaY + 4;

    const complianceUsed = [...chatLog].reverse().find(m => m.sender === "agent")?.complianceNotes || 
      "Reference Guidelines: IPC-2152 (Current Capacity Design), IPC-2221A (Generic PCB Design Rules).";
    
    doc.setFont("Helvetica", "bolditalic");
    doc.setFontSize(8.5);
    doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
    doc.text(`SAFETY / CODE COMPLIANCE METRIC: ${complianceUsed}`, 10, currentY);


    // --- PAGE 2: CORE CALCULATOR METRICS & TEST CHECKLIST ---
    doc.addPage();

    // Blueprint background Page 2
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.1);
    for (let x = 0; x < 210; x += 10) { doc.line(x, 0, x, 297); }
    for (let y = 0; y < 297; y += 10) { doc.line(0, y, 210, y); }
    
    doc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setLineWidth(0.8);
    doc.rect(8, 8, 194, 281);

    // Inner Header
    doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.rect(10, 10, 190, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ENGINEERING CALCULATION MODULES & CRITICAL METRICS", 15, 19);

    // Voltage Drop Params & Results Box
    currentY = 32;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2]);
    doc.rect(10, currentY, 92, 45, "F");
    doc.rect(10, currentY, 92, 45);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.text("Module: Voltage Drop parameters", 14, currentY + 6);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
    doc.text(`System Config: ${vdPhase.toUpperCase()}-PHASE SYSTEM`, 14, currentY + 13);
    doc.text(`Cable nominal length: ${vdCableLen} m`, 14, currentY + 19);
    doc.text(`Load Current: ${vdAmps} A`, 14, currentY + 25);
    doc.text(`Conductor Resistance: ${vdResistance} ohm/km`, 14, currentY + 31);
    doc.text(`Nominal voltage: ${vdNominalV} V`, 14, currentY + 37);

    doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.rect(14, currentY + 39, 84, 0.2, "F");
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
    doc.text(`RESULT drops: ${vdResultV.toFixed(2)} V (${vdResultP.toFixed(2)}%)`, 14, currentY + 43);

    // Fault Current Box
    doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2]);
    doc.rect(108, currentY, 92, 45, "F");
    doc.rect(108, currentY, 92, 45);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.text("Module: Fault Currents parameters", 112, currentY + 6);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
    doc.text(`Transformer base capacity: ${fcCapacityMVA} MVA`, 112, currentY + 13);
    doc.text(`Nominal Feed Voltage: ${fcNominalKV} kV`, 112, currentY + 19);
    doc.text(`Impedance Z percent: ${fcImpedancePct}%`, 112, currentY + 25);
    doc.text(`X/R inductive ratio: ${fcXR}`, 112, currentY + 31);

    doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.rect(112, currentY + 39, 84, 0.2, "F");
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
    doc.text(`Symmetric: ${fcIscSymmetrical.toFixed(2)} kA | Peak: ${fcIscAsymmetrical.toFixed(2)} kA`, 112, currentY + 43);


    // Test Checklist Section
    currentY = 85;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
    doc.text("AUTOMATED DIAGNOSTICS & FIELD VERIFICATION CHECKS", 10, currentY);
    doc.line(10, currentY + 2, 200, currentY + 2);

    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setFont("Helvetica", "bolditalic");
    doc.setFontSize(9);
    doc.text(`Generated Procedure checklist step sequence for: ${testEquipment} (${testDomain.toUpperCase()})`, 10, currentY + 7);

    let stepY = currentY + 13;
    testProcedureList.forEach((step, idx) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(10, stepY - 3.5, 190, 8, "F");
      doc.setDrawColor(241, 245, 249);
      doc.rect(10, stepY - 3.5, 190, 8);

      // Draw standard checkbox box
      doc.setDrawColor(15, 23, 42);
      doc.rect(13, stepY - 1.5, 3, 3);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const splitStep = doc.splitTextToSize(step, 168);
      doc.text(splitStep, 20, stepY + 1);
      stepY += (splitStep.length > 1 ? 12 : 9);
    });


    // Official Sign-Off Blocks
    currentY = 245;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(10, currentY, 200, currentY);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
    doc.text("Verify certificate rules mapping to ANSI, NEC, IEEE and custom safety protocols. Report generated locally via ELECTRO SYSTEM APP Client-Side PDF suite.", 10, currentY + 5);

    // Signatures
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.text("DIAGNOSTIC EXECUTIVE SIGN-OFF / REPORT CERTIFICATION", 10, currentY + 13);

    doc.line(15, currentY + 33, 75, currentY + 33);
    doc.line(115, currentY + 33, 175, currentY + 33);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Field Verification Engineer Signature / Date", 15, currentY + 37);
    doc.text("Engineering Supervisor Approval / Date", 115, currentY + 37);

    // Save report
    doc.save(`Electro_Diagnostic_Report_${Date.now()}.pdf`);
  };


  // Custom Prompt Buttons Helper
  const samplePrompts = [
    { text: "My LDO regulator is overheating (Vin:12V, Vout:5V under 4.5A continuous current draw)", domain: "hardware" },
    { text: "Three-phase motor cabling voltage drop over 150m conductor run at 30 Amps loading", domain: "field" },
    { text: "MATPOWER script or OpenDSS convergence issues under unbalanced transient grid loads", domain: "grid" }
  ];

  return (
    <div className="space-y-6" id="diagnostic-cockpit-pane-root">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Activity className="w-48 h-48 text-indigo-400 animate-pulse" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-3xs font-black uppercase tracking-widest bg-amber-400 text-slate-950">
              <Bot className="w-3.5 h-3.5" /> Multi-Agent Diagnostic Cockpit
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>ELECTRO SYSTEM APP Orchestrator</span>
              <span className="text-xs text-indigo-400 font-mono tracking-normal font-bold">V2.4</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl font-medium">
              A bespoke three-pane workspace routing circuit, field, and simulation queries to specialized experts.
              Modify continuous parameter dials, run inline calculations, and export engineering-grade reports directly to PDF.
            </p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-black rounded-xl flex items-center gap-2 text-white cursor-pointer transition shadow-lg active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export High-Fi PDF Report</span>
            </button>
            <button
              onClick={() => {
                setChatLog([
                  {
                    id: "init",
                    sender: "orchestrator",
                    text: "Workspace cleaned. Multi-Agent telemetry matrices reset.",
                    timestamp: new Date().toLocaleTimeString(),
                  }
                ]);
                setScores({ hardware: 0, field: 0, grid: 0 });
                setRoutingReason("");
              }}
              title="Reset Diagnostic Cockpit"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl cursor-pointer transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* THREE PANE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        
        {/* PANE 1: PROBLEM INTAKE (Left 4 columns) */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4.5 h-4.5 text-indigo-500 animate-spin-slow" />
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                1. Problem Intake
              </span>
            </div>
            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Classifier
            </span>
          </div>

          {/* Intake Textarea */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block tracking-widest">
              State Engineering Query
            </label>
            <div className="relative">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type here to route... e.g., Motor winding insulation fails, or transient bus transformer impedance..."
                rows={3.5}
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-relaxed"
              />
              <button
                onClick={() => handleRouteQuery(userInput)}
                disabled={isRouting || !userInput.trim()}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-100 disabled:dark:bg-slate-850 text-white disabled:text-slate-400 rounded-xl text-3xs font-black uppercase flex items-center gap-1 cursor-pointer transition shadow-sm"
              >
                {isRouting ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Route Input</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Routing Scores Visualizer */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl space-y-3 border border-slate-150 dark:border-slate-850">
            <span className="text-[10px] font-black uppercase text-slate-500 block tracking-widest pb-1 border-b border-slate-150 dark:border-slate-800">
              Live Classifier Scores
            </span>

            <div className="space-y-3 text-3xs font-bold">
              {/* Hardware */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-650 dark:text-slate-350">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Circuit Hardware Agent
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{scores.hardware}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500" 
                    style={{ width: `${scores.hardware}%` }}
                  />
                </div>
              </div>

              {/* Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-650 dark:text-slate-350">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-amber-500" /> Field Machinery Agent
                  </span>
                  <span className="font-mono text-amber-550 dark:text-amber-500 font-extrabold">{scores.field}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500" 
                    style={{ width: `${scores.field}%` }}
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-650 dark:text-slate-350">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" /> Utility Grid Simulator Agent
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{scores.grid}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500" 
                    style={{ width: `${scores.grid}%` }}
                  />
                </div>
              </div>
            </div>

            {routingReason && (
              <div className="text-[10px] text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl font-semibold leading-relaxed">
                ℹ️ {routingReason}
              </div>
            )}
          </div>

          {/* Quick-Fire Templates */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 block tracking-widest">
              Acoustic / Field Core Cases
            </span>
            <div className="space-y-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUserInput(p.text);
                    handleRouteQuery(p.text);
                  }}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-3xs font-bold text-slate-750 dark:text-slate-350 flex items-start gap-2 cursor-pointer transition leading-snug"
                >
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    p.domain === "hardware" ? "bg-indigo-500" : p.domain === "field" ? "bg-amber-400" : "bg-emerald-500"
                  }`} />
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PANE 2: AGENT TIMELINE / CHAT (Center 5 columns) */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between min-h-[580px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className={`w-5 h-5 ${
                  activeAgent === "hardware" ? "text-indigo-500" : activeAgent === "field" ? "text-amber-500" : "text-emerald-500"
                }`} />
                <div>
                  <span className="font-extrabold text-xs uppercase tracking-wider block text-slate-900 dark:text-white">
                    2. Specialized Agent Pane
                  </span>
                  <span className="text-4xs text-slate-500 font-mono font-bold uppercase block">
                    ACTIVE_COMPACTOR: {activeAgent.toUpperCase()}_RULES_V2
                  </span>
                </div>
              </div>

              {/* Manual Switchers */}
              <div className="flex gap-1">
                {(["hardware", "field", "grid"] as AgentType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setActiveAgent(type);
                      setChatLog(prev => [
                        ...prev,
                        {
                          id: `manual-shift-${Date.now()}`,
                          sender: "orchestrator",
                          text: `Overrode current scoring. Telemetry manual context focus shifted to: ${type.toUpperCase()}_AGENT.`,
                          timestamp: new Date().toLocaleTimeString(),
                        }
                      ]);
                    }}
                    className={`px-2 py-0.5 text-4xs uppercase tracking-wider font-extrabold rounded-md cursor-pointer border transition ${
                      activeAgent === type
                        ? "bg-slate-900 text-amber-400 border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-800"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* MESSAGE CONTAINER */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {chatLog.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl space-y-2 border ${
                    msg.sender === "user"
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-150 dark:border-indigo-950/40 text-slate-800 dark:text-slate-200 ml-5"
                      : msg.sender === "orchestrator"
                      ? "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 text-slate-550 dark:text-slate-400 text-3xs font-mono"
                      : "bg-white dark:bg-slate-900 border-[#eaeaea] dark:border-slate-800 text-slate-800 dark:text-slate-100 mr-5 shadow-3xs"
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] border-b border-slate-100 dark:border-slate-850 pb-1 font-black">
                    <span className="text-slate-500 uppercase tracking-wider">
                      {msg.sender === "user" ? "QUERY SUMMARY" : msg.sender === "orchestrator" ? "COCKPIT MULTIPLEXER" : msg.agentName || "EXPERTISE RESOLVER"}
                    </span>
                    <span className="text-4xs font-mono text-slate-400">{msg.timestamp}</span>
                  </div>

                  <p className="text-xs font-semibold leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-250">
                    {msg.text}
                  </p>

                  {/* Highlight math equations */}
                  {msg.formulasUsed && msg.formulasUsed.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl">
                      <span className="text-3xs font-black text-indigo-650 dark:text-indigo-400 block uppercase tracking-wide">
                        🧮 MATH SYSTEM CONCEPTS:
                      </span>
                      {msg.formulasUsed.map((frm, fIdx) => (
                        <div key={fIdx} className="text-3xs text-slate-700 dark:text-slate-350 font-mono font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                          <span>{frm}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Safe Compliance notes */}
                  {msg.complianceNotes && (
                    <div className="text-4xs text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 p-1.5 rounded-lg flex items-center gap-1 uppercase tracking-wide font-bold font-mono">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500 text-slate-600 dark:text-amber-400 shrink-0" />
                      <span>{msg.complianceNotes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Consultation Link Block */}
          <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-500">
            <span className="text-[10px] font-bold leading-relaxed max-w-xs flex gap-1.5">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              Need complex offline analysis? Direct prompt your Gemini model for deep reasoning study.
            </span>
            <button
              onClick={() => {
                const queryText = [...chatLog].reverse().find(m => m.sender === "user")?.text || "Compile full transient load analysis for standard distribution boards.";
                onAskAI(queryText);
                onNavigateToAssistant?.();
              }}
              className="px-3 py-1.5 bg-amber-400 text-slate-950 text-3xs uppercase font-black tracking-wider rounded-xl hover:bg-amber-500 transition shadow-sm cursor-pointer inline-flex items-center gap-1 text-center shrink-0 justify-center"
            >
              <span>Consult Gemini Applet</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* PANE 3: TOOLS PANEL & REGULATORS (Right 3 columns) */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4.5 h-4.5 text-indigo-500 animate-spin-slow" />
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                3. Tools Panel
              </span>
            </div>
            <span className="text-4xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-slate-500 font-mono">
              REAL-TIME
            </span>
          </div>

          {/* Tool Tab selectors */}
          <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-150 dark:border-slate-850">
            <button
              onClick={() => setActiveTool("voltage")}
              className={`py-1.5 text-4xs font-black uppercase rounded-lg transition cursor-pointer text-center ${
                activeTool === "voltage"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Voltage Drop
            </button>
            <button
              onClick={() => setActiveTool("fault")}
              className={`py-1.5 text-4xs font-black uppercase rounded-lg transition cursor-pointer text-center ${
                activeTool === "fault"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Fault I
            </button>
            <button
              onClick={() => setActiveTool("test")}
              className={`py-1.5 text-4xs font-black uppercase rounded-lg transition cursor-pointer text-center ${
                activeTool === "test"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Checklist
            </button>
          </div>

          {/* QUICK-TRIGGER ACTIONS GRID */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-850 p-3 rounded-2xl space-y-2.5 bg-indigo-50/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500 block tracking-widest">
                ⚡ Quick Calculator Triggers
              </span>
              <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 px-1.5 py-0.2 rounded font-extrabold uppercase font-mono">
                Direct Run
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-left">
              <button
                onClick={triggerVoltageDropCalculation}
                className="py-2 px-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-3xs font-black uppercase text-indigo-650 dark:text-indigo-400 flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 shrink-0" /> Cable Voltage Drop
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={triggerFaultCurrentCalculation}
                className="py-2 px-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-3xs font-black uppercase text-amber-550 dark:text-amber-450 flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-500" /> Transformer Fault I
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={triggerAutomatedTestProcedure}
                className="py-2 px-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-3xs font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> Test Workflows
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* RENDER ACTIVE CALC */}
          {activeTool === "voltage" && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-550 dark:text-indigo-400 block tracking-wider">
                  Cabling Voltage Drop
                </span>
                <span className="text-4xs font-mono font-bold text-slate-500 dark:text-slate-400 block">
                  NEC Chapter 9 Branch Threshold: &lt; 3.0%
                </span>
              </div>

              {/* Config selector single vs three phase */}
              <div className="space-y-1">
                <span className="text-3xs text-slate-500 dark:text-slate-400 font-bold block">Phase Configuration</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setVdPhase("single")}
                    className={`py-1 text-3xs font-black rounded border cursor-pointer ${
                      vdPhase === "single"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800"
                    }`}
                  >
                    1-Phase
                  </button>
                  <button
                    onClick={() => setVdPhase("three")}
                    className={`py-1 text-3xs font-black rounded border cursor-pointer ${
                      vdPhase === "three"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800"
                    }`}
                  >
                    3-Phase
                  </button>
                </div>
              </div>

              {/* Cable Length */}
              <div className="space-y-1">
                <div className="flex justify-between text-3xs font-bold text-slate-650 dark:text-slate-350">
                  <span>Conductor Length</span>
                  <span className="font-mono text-indigo-400 font-bold">{vdCableLen} m</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={vdCableLen}
                  onChange={(e) => setVdCableLen(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Current Amps */}
              <div className="space-y-1">
                <div className="flex justify-between text-3xs font-bold text-slate-650 dark:text-slate-350">
                  <span>Current Load</span>
                  <span className="font-mono text-indigo-400 font-bold">{vdAmps} A</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={vdAmps}
                  onChange={(e) => setVdAmps(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Conductor Resistance */}
              <div className="space-y-1">
                <div className="flex justify-between text-3xs font-bold text-slate-650 dark:text-slate-350">
                  <span>Cable Resistance</span>
                  <span className="font-mono text-indigo-400 font-bold">{vdResistance} Ω/km</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="4.0"
                  step="0.05"
                  value={vdResistance}
                  onChange={(e) => setVdResistance(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Base Voltage */}
              <div className="space-y-1">
                <div className="flex justify-between text-3xs font-bold text-slate-650 dark:text-slate-350">
                  <span>Nominal Service Voltage</span>
                  <span className="font-mono text-indigo-400 font-bold">{vdNominalV} V</span>
                </div>
                <input
                  type="range"
                  min="110"
                  max="690"
                  step="5"
                  value={vdNominalV}
                  onChange={(e) => setVdNominalV(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* RESULTS DISCLOSURES */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-3.5 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">Drop (V)</span>
                    <span className="font-mono text-xs font-black text-slate-800 dark:text-white">{vdResultV.toFixed(2)} V</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">Drop Ratio</span>
                    <span className={`font-mono text-xs font-black ${vdResultP > 3.0 ? "text-amber-500 animate-pulse" : "text-emerald-500"}`}>
                      {vdResultP.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {vdResultP > 3.0 ? (
                  <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-start gap-1 p-2 bg-amber-500/5 rounded-xl border border-amber-500/10">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Warning: System exceeds standard NEC 3.0% branch circuit voltage drop criteria. Cross-section size cable trace is too high resistance!</span>
                  </div>
                ) : (
                  <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-start gap-1 p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>System is strictly compliant with statutory branch voltage drop margins.</span>
                  </div>
                )}

                {/* Voltage Drop Formula Label */}
                <div className="pt-2 border-t border-slate-150 dark:border-slate-800">
                  <span className="text-4xs font-mono font-bold text-slate-500 block uppercase mb-1">Used Formula:</span>
                  <div className="p-1 px-1.5 bg-white dark:bg-slate-900 rounded font-mono text-[9px] text-slate-600 dark:text-slate-300 font-extrabold border border-slate-100 dark:border-slate-850">
                    VD = ({vdPhase === "three" ? "√3" : "2"} * L * I * R) / 1000
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-150 dark:border-slate-800">
                  <button
                    onClick={triggerVoltageDropCalculation}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 active:scale-98 text-white text-3xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run & Log Calculation</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTool === "fault" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-600 block tracking-wider">
                  MVA Transformer Fault I
                </span>
                <span className="text-4xs font-mono font-bold text-slate-500 dark:text-slate-400 block">
                  IEEE Std 242 Protection Coordination
                </span>
              </div>

              {/* transformer capacity Base MVA */}
              <div className="space-y-1">
                <div className="flex justify-between text-3xs font-bold text-slate-650 dark:text-slate-350">
                  <span>Base Power Capacity</span>
                  <span className="font-mono text-amber-550 font-bold">{fcCapacityMVA} MVA</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="2"
                  value={fcCapacityMVA}
                  onChange={(e) => setFcCapacityMVA(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Feed Voltage KV */}
              <div className="space-y-1">
                <div className="flex justify-between text-3xs font-bold text-slate-650 dark:text-slate-350">
                  <span>Feed Voltage (V_base)</span>
                  <span className="font-mono text-amber-550 font-bold">{fcNominalKV} kV</span>
                </div>
                <input
                  type="range"
                  min="2.4"
                  max="33.0"
                  step="0.2"
                  value={fcNominalKV}
                  onChange={(e) => setFcNominalKV(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Impedance percent */}
              <div className="space-y-1">
                <div className="flex justify-between text-3xs font-bold text-slate-650 dark:text-slate-350">
                  <span>Impedance Percent (Z%)</span>
                  <span className="font-mono text-amber-550 font-bold">{fcImpedancePct}%</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="12.0"
                  step="0.5"
                  value={fcImpedancePct}
                  onChange={(e) => setFcImpedancePct(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* X/R ratio slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-3xs font-bold text-slate-650 dark:text-slate-350">
                  <span>X/R Inductive Ratio</span>
                  <span className="font-mono text-amber-550 font-bold">{fcXR}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="20.0"
                  step="0.5"
                  value={fcXR}
                  onChange={(e) => setFcXR(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* RESULTS DISCLOSURES */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-3.5 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">Symmetric I_sc</span>
                    <span className="font-mono text-xs font-black text-amber-500">{fcIscSymmetrical.toFixed(2)} kA</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">Peak Asym I_sc</span>
                    <span className="font-mono text-xs font-black text-red-500 animate-pulse">{fcIscAsymmetrical.toFixed(2)} kA</span>
                  </div>
                </div>

                {/* Fault Formula Label */}
                <div className="pt-2 border-t border-slate-150 dark:border-slate-800">
                  <span className="text-4xs font-mono font-bold text-slate-500 block uppercase mb-1">Calculation formulas:</span>
                  <div className="space-y-1">
                    <div className="p-1 px-1.5 bg-white dark:bg-slate-900 rounded font-mono text-[8px] text-slate-600 dark:text-slate-350 border border-slate-100 dark:border-slate-850 font-extrabold">
                      I_base = MVA / (√3 * kV)
                    </div>
                    <div className="p-1 px-1.5 bg-white dark:bg-slate-900 rounded font-mono text-[8px] text-slate-600 dark:text-slate-350 border border-slate-100 dark:border-slate-850 font-extrabold">
                      I_sc = I_base / (Z / 100)
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-150 dark:border-slate-800">
                  <button
                    onClick={triggerFaultCurrentCalculation}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-450 active:scale-98 text-slate-950 text-3xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run & Log Simulation</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTool === "test" && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-600 block tracking-wider">
                  Test Procedure Checklist
                </span>
                <span className="text-4xs font-mono font-bold text-slate-500 dark:text-slate-400 block">
                  Automated Engineering Workflows
                </span>
              </div>

              {/* Domain Input */}
              <div className="space-y-1">
                <span className="text-3xs text-slate-500 dark:text-slate-400 font-bold block">Apparatus Domain</span>
                <div className="grid grid-cols-3 gap-1">
                  {(["hardware", "field", "grid"] as AgentType[]).map((dm) => (
                    <button
                      key={dm}
                      onClick={() => setTestDomain(dm)}
                      className={`py-1 text-4xs font-bold uppercase rounded-lg border cursor-pointer ${
                        testDomain === dm
                          ? "bg-slate-900 text-amber-400 border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                          : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800"
                      }`}
                    >
                      {dm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apparatus Name */}
              <div className="space-y-1">
                <span className="text-3xs text-slate-500 dark:text-slate-400 font-bold block">Apparatus / Equipment Name</span>
                <input
                  type="text"
                  value={testEquipment}
                  onChange={(e) => setTestEquipment(e.target.value)}
                  className="w-full text-3xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* STEP INTERACTIVE CHECKLIST RENDERING */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1">
                  <span>Procedure Steps</span>
                  <button
                    onClick={() => {
                      const allText = testProcedureList.join("\n");
                      navigator.clipboard.writeText(allText);
                      setCopiedId("checklist");
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId === "checklist" ? "Copied" : "Copy Steps"}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {testProcedureList.map((step, sIdx) => (
                    <div 
                      key={sIdx} 
                      className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-[9px] font-bold text-slate-700 dark:text-slate-350 leading-relaxed flex items-start gap-2 text-left"
                    >
                      <input 
                        type="checkbox" 
                        defaultChecked={false} 
                        className="mt-0.5 rounded accent-emerald-500 border-slate-300 dark:border-slate-800 cursor-pointer"
                      />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-150 dark:border-slate-800">
                <button
                  onClick={triggerAutomatedTestProcedure}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-550 active:scale-98 text-white text-3xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Generate & Register Checklist</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
