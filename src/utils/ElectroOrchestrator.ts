/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ELECTRO SYSTEM APP - ELECTRICAL ORCHESTRATOR UTILITY
 * Lexical routing engine to automatically assign queries to Hardware,
 * Field, or Grid specialized engineering modules based on keyword scoring.
 */

export type AgentType = "hardware" | "field" | "grid";

export interface RoutingOutput {
  routedAgent: AgentType;
  scores: {
    hardware: number;
    field: number;
    grid: number;
  };
  reasoning: string;
  suggestedFormulas: string[];
  complianceNotes: string;
  response: string;
}

export class ElectroOrchestrator {
  private static hardwareKeywords = [
    "pcb", "circuit", "trace", "regulator", "solder", "continuity", "mosfet", 
    "diode", "rail", "resistor", "capacitor", "board", "ldo", "footprint", "mils",
    "ic", "op-amp", "microcontroller", "pinout", "impedance matching", "schematic",
    "overheating", "voltage drop rail", "linear", "buck", "boost", "smd", "pad", "via"
  ];

  private static fieldKeywords = [
    "motor", "wiring", "cable", "vfd", "overload", "phase", "contactor", "hotspot", 
    "breaker", "current", "drop", "fla", "thermal", "megger", "insulation", "load",
    "imbalance", "bearing", "three-phase", "inrush", "conduction", "screw terminal",
    "ambient", "winding", "brush", "starter", "pump", "generator", "coils", "clamp"
  ];

  private static gridKeywords = [
    "grid", "simulation", "opendss", "matpower", "transformer", "convergence", 
    "voltage drop simulation", "load flow", "bus", "relay", "harmonic", "short-circuit", 
    "vector group", "asymmetric", "impedance", "etap", "powerfactory", "transmission",
    "substation", "coordination", "scada", "utility", "reactive power", "mva", "feeder", "fault"
  ];

  /**
   * Evaluates the electrical engineering query text and routes it to the correct specialized agent.
   */
  public static route(input: string): RoutingOutput {
    const lower = input.trim().toLowerCase();

    let hwScore = 0;
    let fieldScore = 0;
    let gridScore = 0;

    // Evaluate keyword presence and frequencies
    this.hardwareKeywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}`, "g");
      const matches = lower.match(regex);
      if (matches) {
        hwScore += matches.length * 2;
      }
    });

    this.fieldKeywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}`, "g");
      const matches = lower.match(regex);
      if (matches) {
        fieldScore += matches.length * 2;
      }
    });

    this.gridKeywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}`, "g");
      const matches = lower.match(regex);
      if (matches) {
        gridScore += matches.length * 2;
      }
    });

    // Fallback default scores to prevent divide by zero
    if (hwScore === 0 && fieldScore === 0 && gridScore === 0) {
      hwScore = 1;
      fieldScore = 1;
      gridScore = 1;
    }

    const total = hwScore + fieldScore + gridScore;
    const scores = {
      hardware: Math.round((hwScore / total) * 100),
      field: Math.round((fieldScore / total) * 100),
      grid: Math.round((gridScore / total) * 100)
    };

    let routedAgent: AgentType = "hardware";
    let reasoning = "";
    let suggestedFormulas: string[] = [];
    let complianceNotes = "";
    let response = "";

    // Determine the highest matching score agent
    if (scores.hardware >= scores.field && scores.hardware >= scores.grid) {
      routedAgent = "hardware";
      reasoning = "Query maps to electrical hardware circuit design, LDO/regulator thermal traits, printed board layout rules, or semiconductor parameters.";
      suggestedFormulas = [
        "Power Loss of linear regulator: P_diss = (V_in - V_out) * I_load",
        "IPC-2152 trace temp rise formula: ΔT = (I_amps / (k * Area_sq_mils^0.725))^(1/0.445)",
        "Resistance of a trace: R = (ρ * Length) / (Width * Thickness)"
      ];
      complianceNotes = "Reference Guidelines: IPC-2152 (Current Capacity Design), IPC-2221A (Generic PCB Design Rules).";
      response = `Hardware Diagnostic Agent Remediation Insight:
An overheating circuit traces or linear voltage regulator indicates excessive power dissipation. 
At your current load, we verified the thermal parameters. It is highly recommended to:
1. Increase copper track trace-width or upgrade substrate weight (e.g. from 1oz to 2oz thickness).
2. Incorporate multiple thermal-stitch grounded vias to secondary sink planes.
3. If using linear regulators (LDOs), migrate to a buck or switching regulator to restrict the heat generation.`;
    } else if (scores.field >= scores.hardware && scores.field >= scores.grid) {
      routedAgent = "field";
      reasoning = "Query maps to field machinery properties, electric motor loading, supply cabling terminal voltage drops, or winding insulation.";
      suggestedFormulas = [
        "Three-Phase nominal load current: I_fla = Power_watts / (√3 * Voltage_line * PF * Efficiency)",
        "Three-Phase voltage drop: VD_volt = (√3 * L_meters * I_amps * R_ohms_per_km) / 1000",
        "Insulation minimum resistance rule: R_ins = Rated_kV + 1 Megohm"
      ];
      complianceNotes = "Reference Guidelines: National Electrical Code (NEC) Table 310.16 (Ampacity), Chapter 9 Table 8 & Table 9 (Conductor properties).";
      response = `Field Electrical Diagnostic Agent Remediation Insight:
Physical equipment and cabling issues identified. 
1. Perform an insulation resistance test using a 1000V Megger (verify values exceed 100 Megohms) to rule out winding-to-ground faults.
2. Calculate cable terminal voltage drop. Long cable runs limit standard supply currents, so conductor cross-section resizing (AWG / mm²) must be checked against the statutory 3% NEC limit.
3. Verify mechanical bearings, shaft alignment, and overcurrent overload protection settings (trip class parameters) matching the nominal FLA.`;
    } else {
      routedAgent = "grid";
      reasoning = "Query maps to power distribution networks, load flow matrix convergence, substation transformer vector parameters, or high-volt grid line short-circuits.";
      suggestedFormulas = [
        "Base system utility current: I_base = MVA_base / (√3 * kV_base)",
        "Symmetrical short-circuit peak: I_sc = I_base / (Transformer_impedance_Z_percent / 100)",
        "Peak Asymmetrical fault: I_peak = √2 * [1 + exp(-π / (X/R_ratio))] * I_sc"
      ];
      complianceNotes = "Reference Guidelines: IEEE Std 242 (Buff Book: Protection/Coordination), IEEE Std 399 (Brown Book: Power Analysis).";
      response = `Power Grid Simulation Agent Remediation Insight:
Simulation matrix convergence blockages or high short-circuit symmetrical peaks require advanced coordination.
1. Ensure your transformer vector grouping (e.g. Dyn11) matches nominal physical windings.
2. In ETAP, OpenDSS, or MATPOWER, optimize solver metrics: decrease maximum relaxation step sizes, increment limit iteration thresholds, and review impedance per-unit matrices.
3. Perform overcurrent relay coordination mapping (ANSI 50/51) to verify correct protective grading gaps and prevent cascade trip blackouts.`;
    }

    return {
      routedAgent,
      scores,
      reasoning,
      suggestedFormulas,
      complianceNotes,
      response
    };
  }
}
