/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RegionConfig {
  std: string;
  vd_other: number;
  vd_light: number;
  ref: string;
  unit: string;
  freq: number;
  voltage: number;
  earthing: string;
}

export interface Cable {
  sz: string;
  cap: number;
  r: number; // Resistance in Ohms/km
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isThinking?: boolean;
}

export interface VideoOp {
  name: string;
  prompt: string;
  resolution: string;
  aspectRatio: string;
  done: boolean;
  status: string;
  progress: number;
  videoUrl?: string;
  createdAt: number;
}

export interface Course {
  progress: number;
  quizzesTaken: number;
  avgScore: number;
  completed: boolean;
}

export interface UserAnalytics {
  userId: string;
  userName: string;
  courses: Record<string, Course>;
  overallScore: number;
  calculationsRun: number;
  checksRun: number;
}

export interface CalculationResult {
  base: string;
  design: string;
  derating: string;
  derated: string;
  cable: string;
  breaker: string;
  kva: string;
  ref: string;
}

export const REGIONS: Record<string, RegionConfig> = {
  UK: {
    std: "BS 7671",
    vd_other: 3,
    vd_light: 3,
    ref: "BS 7671 Table 4Ab",
    unit: "mm²",
    freq: 50,
    voltage: 415,
    earthing: "TN-C-S / TN-S",
  },
  US: {
    std: "NEC NFPA 70",
    vd_other: 3,
    vd_light: 3,
    ref: "NEC 210.19(A)(1)",
    unit: "AWG",
    freq: 60,
    voltage: 480,
    earthing: "TN-C-S",
  },
  AU: {
    std: "AS/NZS 3000",
    vd_other: 5,
    vd_light: 3,
    ref: "AS/NZS 3000 Cl.3.6",
    unit: "mm²",
    freq: 50,
    voltage: 400,
    earthing: "TN-C-S / TT",
  },
  CA: {
    std: "CEC CSA C22.1",
    vd_other: 3,
    vd_light: 3,
    ref: "CEC Rule 8-102",
    unit: "AWG",
    freq: 60,
    voltage: 240,
    earthing: "TN-C-S",
  },
  DE: {
    std: "DIN VDE 0100",
    vd_other: 5,
    vd_light: 3,
    ref: "DIN VDE 0100-520",
    unit: "mm²",
    freq: 50,
    voltage: 400,
    earthing: "TN-S / TT",
  },
  NG: {
    std: "IEC 60364",
    vd_other: 5,
    vd_light: 3,
    ref: "IEC 60364 Cl.525",
    unit: "mm²",
    freq: 50,
    voltage: 400,
    earthing: "TN-C-S / TT",
  },
};

export const CABLE_TABLES = {
  metric: [
    { sz: "1.5 mm²", cap: 15, r: 12.1 },
    { sz: "2.5 mm²", cap: 20, r: 7.41 },
    { sz: "4 mm²", cap: 27, r: 4.61 },
    { sz: "6 mm²", cap: 34, r: 3.08 },
    { sz: "10 mm²", cap: 46, r: 1.83 },
    { sz: "16 mm²", cap: 61, r: 1.15 },
    { sz: "25 mm²", cap: 80, r: 0.727 },
    { sz: "35 mm²", cap: 99, r: 0.524 },
    { sz: "50 mm²", cap: 119, r: 0.387 },
    { sz: "70 mm²", cap: 151, r: 0.268 },
    { sz: "95 mm²", cap: 182, r: 0.193 },
    { sz: "120 mm²", cap: 210, r: 0.153 },
  ] as Cable[],
  awg: [
    { sz: "14 AWG", cap: 15, r: 8.286 },
    { sz: "12 AWG", cap: 20, r: 5.211 },
    { sz: "10 AWG", cap: 30, r: 3.277 },
    { sz: "8 AWG", cap: 40, r: 2.060 },
    { sz: "6 AWG", cap: 55, r: 1.296 },
    { sz: "4 AWG", cap: 70, r: 0.815 },
    { sz: "3 AWG", cap: 85, r: 0.647 },
    { sz: "2 AWG", cap: 95, r: 0.513 },
    { sz: "1 AWG", cap: 110, r: 0.407 },
    { sz: "1/0", cap: 125, r: 0.323 },
    { sz: "2/0", cap: 145, r: 0.256 },
    { sz: "3/0", cap: 165, r: 0.203 },
  ] as Cable[],
};

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const COURSE_DETAILS: Record<string, { title: string; desc: string; icon: string; quizzes: QuizQuestion[] }> = {
  "load-design": {
    title: "Multi-Phase Load Calculations",
    desc: "Master calculations for 3-Phase balanced loads, Power Factor offsets, and continuous current multipliers.",
    icon: "Zap",
    quizzes: [
      {
        question: "What is the standard continuous load multiplier specified in NFPA 70 NEC Chapter 2?",
        options: ["100%", "115%", "125%", "150%"],
        correctAnswer: 2,
        explanation: "NEC Article 210.19(A)(1) specifies that conductors must be sized to carry 125% of the continuous load.",
      },
      {
        question: "How is 3-Phase active line current calculated from line-to-line voltage?",
        options: [
          "I = P / (V * PF)",
          "I = P / (sqrt(3) * V * PF)",
          "I = P * sqrt(3) / (V * PF)",
          "I = P * V * PF",
        ],
        correctAnswer: 1,
        explanation: "In balanced three-phase systems, line current (I) equals total active power (P) divided by the product of line-to-line voltage, power factor, and the square root of 3.",
      }
    ]
  },
  "cable-sizing": {
    title: "Cable Ampacity & Installation",
    desc: "Understand sizing constraints based on conduit routing, ambient temperature adjustments, and grouping factors.",
    icon: "Cable",
    quizzes: [
      {
        question: "If ambient temperature rises above standard reference (30°C), how does it affect cable ampacity?",
        options: [
          "Ampacity increases due to lower resistance",
          "Ampacity is derated due to heat dispersion limits",
          "There is no change in ampacity",
          "Voltage drops proportionally instead"
        ],
        correctAnswer: 1,
        explanation: "Elevated ambient temperatures reduce the rate of heat radiation, requiring a derating factor (e.g., 0.87 for 40°C) to prevent insulation degradation.",
      }
    ]
  },
  "conduit-fill": {
    title: "Conduit Fill Ratios & Standards",
    desc: "Calculate area occupancy for cables inside PVC, EMT, and rigid metallic conduits conforming to NEC Chapter 9.",
    icon: "CircleDot",
    quizzes: [
      {
        question: "What is the maximum allowed conduit fill percentage for three or more cables?",
        options: ["31%", "40%", "45%", "53%"],
        correctAnswer: 1,
        explanation: "According to NEC Chapter 9, Table 1, the maximum fill percentage for 3 or more wires in a conduit is 40% to prevent damage during pulls.",
      }
    ]
  },
  "code-compliance": {
    title: "Global Codes & RCD Protections",
    desc: "Navigate RCD requirements under BS 7671, GFCI in USA NEC, and core mechanical protection standards.",
    icon: "ShieldCheck",
    quizzes: [
      {
        question: "What is the typical trip threshold for residual current devices (RCD) on public power socket circuits?",
        options: ["10 mA", "30 mA", "100 mA", "300 mA"],
        correctAnswer: 1,
        explanation: "BS 7671 and standard IEC 60364 require a 30 mA RCD trip threshold for socket-outlets supplying general public appliances.",
      }
    ]
  }
};
