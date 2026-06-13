import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import LoadListTable from "./LoadListTable";
import { 
  Zap, 
  Lightbulb, 
  Building, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  Network, 
  Calculator, 
  BookOpen, 
  FileSpreadsheet,
  Search,
  Sparkles,
  Bot,
  HelpCircle,
  CheckCircle2,
  Bookmark,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Globe,
  Plus,
  Trash2,
  FileDown,
  RotateCcw,
  FileText
} from "lucide-react";

interface ServicesMenuProps {
  onNavigate: (page: string, subTab?: string) => void;
  onAskAI: (prompt: string) => void;
}

export default function ServicesMenu({ onNavigate, onAskAI }: ServicesMenuProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(
    "Load Estimation & Demand Analysis"
  );
  
  // Feedback states for copy actions
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);

  // Custom PDF summary generator for service category cards
  const downloadCategoryPDF = (category: any) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const stamp = new Date();
    
    // Draw Header Banner
    doc.setFillColor(15, 23, 42); // slate-900 background
    doc.rect(0, 0, 210, 38, "F"); 

    // Accent Line
    doc.setFillColor(245, 158, 11); // amber-500
    doc.rect(0, 38, 210, 2, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ELECTRO SYSTEM APP", 15, 15);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(245, 158, 11); // amber-500 color
    doc.text(`TECHNICAL REFERENCE SHEET • CATEGORY SUMMARY`, 15, 21);

    // Category Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(category.category.toUpperCase(), 15, 31);

    // Metadata block (Date of Generation)
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated: ${stamp.toLocaleString()}`, 145, 15);
    doc.text(`App Version: 1.1 • Standard ISO Sync`, 145, 20);

    let yOffset = 50;

    // Services section
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("1. INCLUDED DESIGN SERVICES", 15, yOffset);
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(15, yOffset + 2, 195, yOffset + 2);
    
    yOffset += 7;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // slate-700

    category.services.forEach((service: string) => {
      doc.text(`• ${service}`, 18, yOffset);
      yOffset += 5.5;
    });

    yOffset += 4;

    // Section 2: Core Formulas
    if (category.formulas && Object.keys(category.formulas).length > 0) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("2. CORE ENGINEERING EQUATIONS", 15, yOffset);
      doc.line(15, yOffset + 2, 195, yOffset + 2);
      yOffset += 7;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      
      Object.entries(category.formulas).forEach(([key, value]) => {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(15, yOffset - 4, 180, 7.5, "F");

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42); // slate-900
        const keyLabel = key.replace(/_/g, " ").toUpperCase();
        doc.text(`${keyLabel}:`, 18, yOffset + 1);

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(217, 119, 6); // amber-700
        doc.text(`${value}`, 80, yOffset + 1);

        yOffset += 95 === 95 ? 9 : 9;
      });
      yOffset += 2;
    }

    // Section 3: Metric Symbols
    if (category.unit_symbols && Object.keys(category.unit_symbols).length > 0) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("3. UNIT METRIC SYMBOLS GUIDELINES", 15, yOffset);
      doc.line(15, yOffset + 2, 195, yOffset + 2);
      yOffset += 7;

      let colWidth = 90;
      let startX = 15;
      let startY = yOffset;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Variable/Unit Indicator", startX + 3, startY);
      doc.text("Unit Symbol", startX + colWidth + 3, startY);
      
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.line(startX, startY + 2, startX + (colWidth * 2), startY + 2);

      startY += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85); // slate-700

      Object.entries(category.unit_symbols).forEach(([key, symbol]) => {
        const cleanKey = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        doc.text(cleanKey, startX + 3, startY);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(13, 148, 136); // teal-600
        doc.text(`${symbol}`, startX + colWidth + 3, startY);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 65, 85);

        startY += 5.5;
      });

      yOffset = startY + 5;
    }

    // Section 4: Portals
    if (category.useful_links && category.useful_links.length > 0) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("4. APPLICABLE SAFETY & REGULATORY CODES", 15, yOffset);
      doc.line(15, yOffset + 2, 195, yOffset + 2);
      yOffset += 7;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      category.useful_links.forEach((linkStr: string) => {
        const idxColon = linkStr.indexOf(": http");
        const label = idxColon !== -1 ? linkStr.substring(0, idxColon).trim() : linkStr;
        const url = idxColon !== -1 ? linkStr.substring(idxColon + 2).trim() : "";

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`• ${label}`, 18, yOffset);

        if (url) {
          doc.setFont("Helvetica", "normal");
          doc.setTextColor(37, 99, 235); // blue-600
          doc.text(` (${url})`, 95, yOffset);
        }
        yOffset += 5.5;
      });
    }

    // Footer branding
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.line(15, 280, 195, 280);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Electro System App v1.1 © 2026 • Professional Engineering Tool Collection", 15, 284);
    doc.text("Page 1 of 1", 185, 284);

    doc.save(`ElectroSystem_${category.id}_summary.pdf`);
  };

  const servicesData = {
    "services_name": "Services Navigation Menu",
    "version": "1.1",
    "services_navigation_menu": [
      {
        "category": "Power Systems & Distribution",
        "id": "power_systems",
        "icon": <Zap className="w-4 h-4 text-amber-500" />,
        "color": "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-500",
        "bgGradient": "from-amber-600 to-amber-955",
        "services": [
          "Load Estimation & Demand Analysis",
          "Transformer & Generator Sizing",
          "Short-Circuit & Fault Level Calculations",
          "Protection & Coordination",
          "Power Factor Correction",
          "Harmonics & Power Quality",
          "Single-Line Diagram Generator"
        ],
        "useful_links": [
          "IEC 60364 Low-Voltage Installations: https://www.iec.ch",
          "NFPA 70 (NEC - USA): https://www.nfpa.org",
          "CSA C22.1 (Canada Electrical Code): https://www.csagroup.org"
        ],
        "unit_symbols": {
          "voltage": "V",
          "current": "A",
          "power": "W",
          "apparent_power": "VA",
          "frequency": "Hz",
          "impedance": "Ω",
          "short_circuit_rating": "kA"
        },
        "formulas": {
          "three_phase_power_kw": "P = √3 × V × I × pf",
          "apparent_power_kva": "S = √3 × V × I",
          "fault_current": "Isc = V / Z"
        }
      },
      {
        "category": "Lighting & Illumination",
        "id": "lighting",
        "icon": <Lightbulb className="w-4 h-4 text-emerald-500" />,
        "color": "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-500",
        "bgGradient": "from-emerald-600 to-emerald-955",
        "services": [
          "Interior Lighting Design",
          "Exterior & Street Lighting",
          "Emergency & Exit Lighting",
          "Lighting Control Systems",
          "Energy-Efficient Lighting (LED, Smart Systems)",
          "Lighting Load Calculations"
        ],
        "useful_links": [
          "IES Lighting Standards: https://www.ies.org",
          "AS/NZS 1680 Lighting: https://www.standards.govt.nz"
        ],
        "unit_symbols": {
          "luminous_flux": "lm",
          "illuminance": "lux",
          "power": "W",
          "efficacy": "lm/W"
        },
        "formulas": {
          "illuminance": "E = Φ / A",
          "lighting_load": "P_total = Σ (fixture_wattage × quantity)"
        }
      },
      {
        "category": "Building Electrical Installations",
        "id": "building_installations",
        "icon": <Building className="w-4 h-4 text-indigo-500" />,
        "color": "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-505",
        "bgGradient": "from-indigo-600 to-indigo-955",
        "services": [
          "Residential Wiring",
          "Commercial & Institutional Wiring",
          "Distribution Boards & Panel Schedules",
          "Cable Routing & Containment",
          "Earthing & Bonding",
          "Surge Protection",
          "Fire-Stopping & Penetration Planning"
        ],
        "useful_links": [
          "BS 7671 Wiring Regulations (UK): https://www.theiet.org",
          "AS/NZS 3000 Wiring Rules: https://www.standards.org.au"
        ],
        "unit_symbols": {
          "cable_size": "mm²",
          "temperature": "°C",
          "voltage_drop": "%"
        },
        "formulas": {
          "voltage_drop": "VD = (2 × L × I × R_cable) / 1000",
          "earth_fault_loop_impedance": "Zs = Ze + (R1 + R2)"
        }
      },
      {
        "category": "Industrial Electrical Systems",
        "id": "industrial_systems",
        "icon": <Cpu className="w-4 h-4 text-sky-500" />,
        "color": "from-sky-500/10 to-sky-500/5 border-sky-500/20 text-sky-500",
        "bgGradient": "from-sky-600 to-sky-955",
        "services": [
          "Motor Sizing & Protection",
          "MCC & Control Panel Design",
          "VFDs, Soft Starters, PLC Integration",
          "Hazardous Area Classification (ATEX/IECEx)",
          "Industrial Power Distribution",
          "Process Automation Support"
        ],
        "useful_links": [
          "IECEx Hazardous Area Standards: https://www.iecex.com",
          "IEEE Industrial Power Systems: https://www.ieee.org"
        ],
        "unit_symbols": {
          "motor_power": "kW",
          "speed": "RPM",
          "torque": "Nm"
        },
        "formulas": {
          "motor_current": "I = P / (√3 × V × pf × η)",
          "torque": "T = (9550 × P) / RPM"
        }
      },
      {
        "category": "Testing, Inspection & Commissioning",
        "id": "testing_commissioning",
        "icon": <Activity className="w-4 h-4 text-rose-500" />,
        "color": "from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-500",
        "bgGradient": "from-rose-600 to-rose-955",
        "services": [
          "Continuity & Insulation Resistance Testing",
          "Earth Resistance Measurement",
          "Functional Testing of Switchgear",
          "Load Balancing & Power Quality Checks",
          "Commissioning Procedures & Reports",
          "Troubleshooting Assistant"
        ],
        "useful_links": [
          "IEC 60364-6 Testing Requirements: https://www.iec.ch",
          "IEEE Power Quality Resources: https://www.ieee.org"
        ],
        "unit_symbols": {
          "resistance": "Ω",
          "insulation_resistance": "MΩ",
          "earth_resistance": "Ω"
        },
        "formulas": {
          "insulation_resistance": "IR = V_test / I_leakage",
          "earth_resistance": "Re = V / I"
        }
      },
      {
        "category": "Safety, Compliance & Risk Assessment",
        "id": "safety_compliance",
        "icon": <ShieldCheck className="w-4 h-4 text-teal-500" />,
        "color": "from-teal-500/10 to-teal-500/5 border-teal-500/20 text-teal-500",
        "bgGradient": "from-teal-600 to-teal-955",
        "services": [
          "Arc-Flash Analysis",
          "Shock Protection & Fault Clearing",
          "Equipment Labeling",
          "Safety Documentation",
          "Compliance Checklists",
          "Regional Code Guidance (NEC, CEC, IEC, BS 7671, AS/NZS 3000)"
        ],
        "useful_links": [
          "NFPA 70E Electrical Safety: https://www.nfpa.org",
          "OSHA Electrical Safety: https://www.osha.gov"
        ],
        "unit_symbols": {
          "incident_energy": "cal/cm²",
          "fault_current": "kA"
        },
        "formulas": {
          "arc_flash_energy": "E = k × (Isc^1.473) × t",
          "shock_boundary": "D = k × √(V)"
        }
      },
      {
        "category": "Communication & Low-Voltage Systems",
        "id": "low_voltage_systems",
        "icon": <Network className="w-4 h-4 text-purple-500" />,
        "color": "from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-500",
        "bgGradient": "from-purple-600 to-purple-955",
        "services": [
          "Structured Cabling (Cat6/Cat6A)",
          "CCTV & Access Control",
          "Fire Alarm Systems",
          "Data & Communication Risers",
          "Building Automation Integration",
          "LV System Layout Generator"
        ],
        "useful_links": [
          "BICSI Telecommunications Standards: https://www.bicsi.org"
        ],
        "unit_symbols": {
          "bandwidth": "Gbps",
          "cable_category": "Cat6/Cat6A"
        },
        "formulas": {
          "signal_loss": "Loss = Attenuation × Length"
        }
      },
      {
        "category": "Engineering Tools & Calculators",
        "id": "engineering_tools",
        "icon": <Calculator className="w-4 h-4 text-orange-500" />,
        "color": "from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-500",
        "bgGradient": "from-orange-600 to-orange-955",
        "services": [
          "Unit Conversion Engine",
          "Electrical Formula Engine",
          "Cable Sizing Calculator",
          "Voltage Drop Calculator",
          "Fault Current Calculator",
          "Breaker & Fuse Selection Tool",
          "ASCII Diagram Generator"
        ],
        "useful_links": [],
        "unit_symbols": {
          "voltage": "V",
          "current": "A",
          "resistance": "Ω",
          "power": "W",
          "energy": "kWh"
        },
        "formulas": {
          "ohms_law": "V = I × R",
          "power_single_phase": "P = V × I × pf",
          "power_three_phase": "P = √3 × V × I × pf"
        }
      },
      {
        "category": "Standards & Reference Library",
        "id": "standards_library",
        "icon": <BookOpen className="w-4 h-4 text-lime-500" />,
        "color": "from-lime-500/10 to-lime-500/5 border-lime-500/20 text-lime-500",
        "bgGradient": "from-lime-600 to-lime-955",
        "services": [
          "NEC (USA)",
          "CEC (Canada)",
          "IEC 60364 (International)",
          "BS 7671 (UK)",
          "AS/NZS 3000 (Australia/NZ)",
          "IES Lighting Standards",
          "IEEE Power & Industrial Standards"
        ],
        "useful_links": [
          "NEC: https://www.nfpa.org",
          "CEC: https://www.csagroup.org",
          "IEC: https://www.iec.ch",
          "BS 7671: https://www.theiet.org",
          "AS/NZS 3000: https://www.standards.org.au",
          "IEEE Standards: https://www.ieee.org"
        ],
        "unit_symbols": {},
        "formulas": {}
      },
      {
        "category": "Project Documentation & Reports",
        "id": "project_docs",
        "icon": <FileSpreadsheet className="w-4 h-4 text-blue-500" />,
        "color": "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-500",
        "bgGradient": "from-blue-600 to-blue-955",
        "services": [
          "Load Lists",
          "Panel Schedules",
          "Wiring Diagrams",
          "Test Sheets",
          "Commissioning Reports",
          "Maintenance Logs"
        ],
        "useful_links": [],
        "unit_symbols": {
          "load": "kW",
          "current": "A",
          "voltage": "V"
        },
        "formulas": {
          "demand_load": "P_demand = Σ (load × demand_factor)",
          "panel_current": "I_panel = P_total / (√3 × V × pf)"
        }
      }
    ]
  };

  // Find active category item containing selected service
  const activeCategory = servicesData.services_navigation_menu.find(cat =>
    cat.services.includes(selectedService || "")
  );

  // Parse links to get a visual label and standard anchor target URL
  const parseUsefulLink = (linkStr: string): { label: string; url: string } => {
    const colonIdx = linkStr.indexOf(": http");
    if (colonIdx !== -1) {
      return {
        label: linkStr.substring(0, colonIdx).trim(),
        url: linkStr.substring(colonIdx + 2).trim()
      };
    }
    return { label: linkStr, url: linkStr };
  };

  const getServiceActionRoute = (service: string): { page: string; subTab?: string; label: string } | null => {
    const s = service.toLowerCase();
    if (s.includes("voltage drop")) {
      return { page: "calculator", subTab: "vdrop", label: "Open Voltage Drop Calculator" };
    }
    if (s.includes("cable sizing") || s.includes("wire & conduit")) {
      return { page: "calculator", subTab: "cable", label: "Open Cable Sizer" };
    }
    if (s.includes("load estimation") || s.includes("load calculation") || s.includes("demand analysis")) {
      return { page: "calculator", subTab: "load", label: "Open Load Estimator" };
    }
    if (s.includes("unit conversion") || s.includes("converter")) {
      return { page: "converter", label: "Open Unit Converter" };
    }
    if (s.includes("ascii diagram") || s.includes("single-line diagram generator") || s.includes("symbols")) {
      return { page: "symbols", label: "Open Interactive Symbols Workspace" };
    }
    if (s.includes("compliance") || s.includes("regional code") || s.includes("inspections")) {
      return { page: "compliance", label: "Open Code Inspector" };
    }
    if (s.includes("library") || s.includes("nec") || s.includes("cec") || s.includes("iec") || s.includes("bs 7671") || s.includes("as/nzs")) {
      return { page: "library", label: "Open Reference Library" };
    }
    return null;
  };

  const getServiceDescription = (service: string): string => {
    const descMap: { [key: string]: string } = {
      "Load Estimation & Demand Analysis": "Calculates total connected power load versus diversified peak demand of a building, factoring in continuous loads, non-coincident machinery, and electrical codes.",
      "Transformer & Generator Sizing": "Guides engineers in selecting transformer kVA ratings or generator kW capabilities, ensuring starting high-inrush currents do not trigger low-frequency voltage sags.",
      "Short-Circuit & Fault Level Calculations": "Formulates instantaneous maximum fault contributions from utility substations and motor feedback, defining minimum KA Switchgear busbar ratings.",
      "Protection & Coordination": "Maps time-current curves (TCC) to ensure safety relays, MCCBs, and circuit breakers trip selectively in downstream order under overload regimes.",
      "Power Factor Correction": "Pins down reactive power losses (kVAR) to design capacitor bank steps, maximizing efficiency and eliminating heavy power utility penalty tariffs.",
      "Harmonics & Power Quality": "Diagnoses total harmonic distortion (THD) of non-linear active equipment and selects structural passive, active, or hybrid bypass filters.",
      "Single-Line Diagram Generator": "Allows dynamic blueprint design utilizing IEC or ANSI symbol blocks, visually mapping out electrical current downstream generation flows.",
      "Interior Lighting Design": "Computes luminous intensity and uniform average lux distributions using lumen coefficient methods, mapping fixture indexes according to room aspect ratios.",
      "Exterior & Street Lighting": "Delivers lighting profiles mapping glare limit indices and illuminance footprints for outdoor roadways, car parks, and construction layout areas.",
      "Emergency & Exit Lighting": "Validates statutory escape path battery backups, sizing localized emergency light points to secure safety compliance under total power blackout states.",
      "Lighting Control Systems": "Leverages occupancy relays, daylight harvesting light sensors, and digital addressable systems (DALI/KNX) to balance continuous comfort with peak utility conservation.",
      "Energy-Efficient Lighting (LED, Smart Systems)": "Replaces halogen/HID systems with high-efficacy LED solutions, calculating visual lifetime paybacks and green sustainability metrics.",
      "Lighting Load Calculations": "Calculates total continuous volt-ampere demand for illuminated zones, ensuring feeder breakers and panelboards stay well below safety thermal capacities.",
      "Residential Wiring": "Models branch-circuit routing, residential structural receptacle counts, and GFCI/AFCI protection guidelines according to NEC Article 210 provisions.",
      "Commercial & Institutional Wiring": "Lays out heavy commercial conduit racks, high-density receptacle loads, and localized safety isolation disconnect devices.",
      "Distribution Boards & Panel Schedules": "Allocates phases (A, B, C) evenly across local panel schedules, tracking individual circuit breakers and aggregate continuous loads.",
      "Cable Routing & Containment": "Sizes structural cable trays, ladders, and protective conduits, tracking weight limits and electromagnetic spacing separation distances.",
      "Earthing & Bonding": "Models low-impedance grounding grids to divert hazardous fault surges, protecting personnel from high touch-and-step voltage potentials.",
      "Surge Protection": "Integrates Type 1, 2, and 3 Surge Protective Devices (SPDs) to clamp down lightning-induced voltage spikes, shielding delicate microcontrollers.",
      "Fire-Stopping & Penetration Planning": "Plans intumescent fire barriers inside building service shafts, preventing smoke and frame degradation from transferring across compartments.",
      "Motor Sizing & Protection": "Selects appropriate HP/kW values, thermal overload relays, and short-circuit protection curves for high-inrush industrial motor loads.",
      "MCC & Control Panel Design": "Organizes motor control center structures, integrating safety pilot lights, auxiliary relays, master disconnects, and field terminal strips.",
      "VFDs, Soft Starters, PLC Integration": "Regulates variable-torque acceleration sweeps with current-limiting soft starters, establishing Modbus/Profibus telemetry backplanes.",
      "Hazardous Area Classification (ATEX/IECEx)": "Classifies Zone 0, 1, or 2 flammable atmospheres, ensuring certified explosion-proof casings and intrinsically-safe circuit loops.",
      "Industrial Power Distribution": "Lays out robust medium-voltage feeders, busway ducts, and localized step-down switch stations inside factory environments.",
      "Process Automation Support": "Leverages discrete sensors, analog loops (4-20mA), and active PLC logic structures to govern high-throughput industrial machinery.",
      "Continuity & Insulation Resistance Testing": "Injects high DC test volt ranges (typically 500V/1000V Megger) to identify insulation leak points prior to direct breaker energization.",
      "Earth Resistance Measurement": "Implements Fall-of-Potential rod ground methods to record soil grid resistivity, targeting safe ground targets below 5 ohms.",
      "Functional Testing of Switchgear": "Asserts precise timing and mechanically sound operation of vacuum circuit breakers (VCBs) and key mechanical safety interlocks.",
      "Load Balancing & Power Quality Checks": "Pinpoints high-current harmonic anomalies or active phase-imbalance stresses, re-routing branch loads across distribution segments.",
      "Commissioning Procedures & Reports": "Compiles formal, standardized field verification reports confirming design alignment and safety compliance declarations.",
      "Troubleshooting Assistant": "Leverages progressive elimination rules to isolate control circuit grounds, open wire anomalies, and premature thermal trip sources.",
      "Arc-Flash Analysis": "Calculates incident energy levels (cal/cm2) at specific electrical enclosures, defining mandatory PPE boundaries (NEC/NFPA 70E requirements).",
      "Shock Protection & Fault Clearing": "Determines total touch duration parameters and sizes high-speed backup fuses to extinguish dangerous short-circuit faults instantly.",
      "Equipment Labeling": "Drafts high-visibility danger, warning, and cautionary labels indicating absolute shock hazards, voltages, and thermal hazards.",
      "Safety Documentation": "Produces lock-out / tag-out (LOTO) protocols, permits, and protective procedure scripts for active high-voltage substation maintenance.",
      "Compliance Checklists": "Leverages active, standard-aligned safety check structures to eliminate installation errors before municipal inspector sign-offs.",
      "Regional Code Guidance (NEC, CEC, IEC, BS 7671, AS/NZS 3000)": "Synthesizes code variations across international jurisdictions, ensuring correct cable adjustments, continuous loading rules, and safety grounding limits.",
      "Structured Cabling (Cat6/Cat6A)": "Lays out structured backbone frames, telecommunication closets, patch panel nodes, and testing procedures for high-speed fiber or copper networks.",
      "CCTV & Access Control": "Plans camera layouts, motion sensors, biometrics controllers, and uninterruptible battery supplies to protect site perimeters.",
      "Fire Alarm Systems": "Sizes intelligent smoke sensors, heat alarms, manual pull stations, and alarm horns matching strict safety life-preservation standards.",
      "Data & Communication Risers": "Maps heavy horizontal and vertical service rises, shielding low-voltage data cables from nearby high-frequency motor power conduits.",
      "Building Automation Integration": "Synchronizes building services via BACnet, LonWorks, or Modbus protocols to automate heating, cooling, and safety ventilation.",
      "LV System Layout Generator": "Integrates low-current networks into the main architectural layout, calculating overall auxiliary equipment panel battery reserves.",
      "Unit Conversion Engine": "Performs instant conversions of electrical, thermal, and spatial indicators—converting HP, KW, AWG metric area, Celsius, and meters.",
      "Electrical Formula Engine": "Houses critical electrical physics equations—from Ohm's Law and impedance vectors right through to complex three-phase power equations.",
      "Cable Sizing Calculator": "Computes recommended copper or aluminum cross-sectional conductor profiles according to regional heating limits.",
      "Voltage Drop Calculator": "Maps out potential energy lost as heat over continuous electrical line distances, warning of statutory load terminal drops.",
      "Fault Current Calculator": "Calculates infinite bus current levels at secondary distribution lines to select safe circuit breaker interrupting ratings.",
      "Breaker & Fuse Selection Tool": "Profiles protective relays, standard fuse links, and adjustable-trip circuit breakers based on branch load profiles.",
      "ASCII Diagram Generator": "Creates text-based schematic diagrams mapping components, protecting cross-sectional line drawings in low-bandwidth files.",
      "NEC (USA)": "Standard code governs electrical safety in structural habitats, residential sites, and heavy industrial compounds across the United States.",
      "CEC (Canada)": "Standard Canadian regulation, governed by CSA C22.1, setting safety requirements for industrial structures and residential distribution grids.",
      "IEC 60364 (International)": "Global standard detailing installation philosophies across Europe, driving fundamental protection rules against electric shock.",
      "BS 7671 (UK)": "The IET Wiring Regulations in the United Kingdom, governing copper cable installation, ring-mains, and residual-current device (RCD) rules.",
      "AS/NZS 3000 (Australia/NZ)": "The joint Australian/New Zealand Standard (Wiring Rules), detailing requirements for multi-earthed neutral (MEN) networks.",
      "IES Lighting Standards": "The Illuminating Engineering Society's standards defining optimum lux guidelines for commercial offices, warehouses, and campuses.",
      "IEEE Power & Industrial Standards": "Houses rigorous engineering designs for safety substation designs, testing regimens, and generator synchronization guidelines.",
      "Load Lists": "Organizes every motor, lighting fixture, receptacle, and auxiliary equipment node into a centralized, filterable connected-load registry.",
      "Panel Schedules": "Draws automated layout distributions of branch circuits, load amperes, phase balances, and breaker poles within local enclosures.",
      "Wiring Diagrams": "Generates clear schematics mapping physical terminal blocks, auxiliary control relays, transformer taps, and emergency stop interlocks.",
      "Test Sheets": "Standardizes field record logs for continuity verification, insulation resistance values, and protection relay trip timing values.",
      "Commissioning Reports": "Drafts final handover documentation detailing system operational parameters under load and safety bypass validation routines.",
      "Maintenance Logs": "Establishes predictive maintenance calendars, tracking thermal imaging logs, contact resistance, and breaker lubrication schedules."
    };

    return descMap[service] || "Provides professional, code-compliant guidelines and calculations to support electrical design, optimization, and field verification.";
  };

  // Handle copying items to clipboard
  const copyToClipboard = (text: string, id: string, type: "formula" | "symbol") => {
    navigator.clipboard.writeText(text);
    if (type === "formula") {
      setCopiedFormula(id);
      setTimeout(() => setCopiedFormula(null), 1800);
    } else {
      setCopiedSymbol(id);
      setTimeout(() => setCopiedSymbol(null), 1800);
    }
  };

  // Filter categories and services based on search string
  const filteredCategories = servicesData.services_navigation_menu.map(cat => {
    const matchingServices = cat.services.filter(service => 
      service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      ...cat,
      services: matchingServices
    };
  }).filter(cat => cat.services.length > 0);

  // Set the selected service and default active index
  const selectServiceHandler = (service: string) => {
    setSelectedService(service);
  };

  const handleAiPromptSelect = (service: string) => {
    const prompt = `Please provide a detailed, code-compliant engineering guide for setting up and validating: "${service}" in "${activeCategory?.category}". Show standard formulas (such as ${activeCategory ? Object.values(activeCategory.formulas || {}).join(", ") : ""}), typical parameters, and field commissioning steps.`;
    onAskAI(prompt);
  };

  const camelToTitle = (str: string) => {
    return str
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-amber-950 p-6 rounded-3xl border border-amber-500/15 text-white shadow-xl relative overflow-hidden">
        {/* Decorative highlights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-slate-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold uppercase px-2 py-0.5 rounded shadow">
                SERVICES NAVIGATION MATRIX
              </span>
              <span className="text-[10px] bg-white/10 text-amber-300 font-mono font-bold uppercase px-2 py-0.5 rounded border border-white/5">
                VERSION {servicesData.version}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5 font-sans animate-fade-in">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Services Navigation Menu
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              This interactive suite maps essential distribution models, illumination formulas, local field tests, and regional standards. Click on any category service below to explore specific unit guidelines and copyable core formulas.
            </p>
          </div>
          
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services, tools or codes..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-805 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-all font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Categories on Left, Selected details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Categories and Services List */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-4">
          
          {/* Unified dynamic card list representing standard layout or filtered results */}
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCategories.map((cat) => (
                <div 
                  key={cat.id}
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Category Header with dynamic Quick PDF trigger */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shrink-0">
                        {cat.icon}
                      </span>
                      <div className="truncate">
                        <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-tight leading-tight truncate">
                          {cat.category}
                        </h3>
                        <span className="text-[9px] font-mono text-slate-400 font-extrabold uppercase">
                          {cat.services.length} ACTIVE SERVICES
                        </span>
                      </div>
                    </div>
                    {/* Quick PDF button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadCategoryPDF(cat);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-505 hover:text-slate-950 rounded-xl border border-amber-500/20 transition shrink-0 cursor-pointer shadow-sm"
                      title="Download category summary PDF"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>

                  {/* List of services in this category */}
                  <div className="py-3.5 space-y-1.5 flex-1">
                    {cat.services.map((service, sIdx) => {
                      const isSelected = selectedService === service;
                      return (
                        <button
                          key={sIdx}
                          onClick={() => selectServiceHandler(service)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition outline-none cursor-pointer group ${
                            isSelected 
                              ? "bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25" 
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent"
                          }`}
                        >
                          <span className="text-[11px] font-bold group-hover:text-amber-500 dark:group-hover:text-amber-400 truncate pr-2">
                            {service}
                          </span>
                          <ChevronRight className={`w-3 h-3 text-slate-400 group-hover:text-amber-500 transition-transform ${isSelected ? 'text-amber-500 translate-x-0.5' : ''}`} />
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[8px] font-mono font-black text-amber-550 dark:text-amber-400 uppercase tracking-wider">
                      {Object.keys(cat.formulas || {}).length} Formulas Integrated
                    </span>
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      SUITE CAPABILITY
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-850 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
              <span className="text-3xl block">🔍</span>
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 mt-2">No category or service matches</h3>
              <p className="text-xs text-slate-500 mt-1">We couldn't find anything matching "{searchTerm}". Try clearing your search.</p>
              <button 
                onClick={() => setSearchTerm("")} 
                className="mt-4 px-3.5 py-2 bg-amber-500 text-slate-900 text-xs font-black rounded-lg hover:bg-amber-400 uppercase transition cursor-pointer"
              >
                ✕ Reset Search
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Active Service Inspector & Actions Sandbox */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
          <AnimatePresence mode="wait">
            {selectedService && activeCategory ? (
              <motion.div 
                key={selectedService}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-5 sticky top-6"
              >
                {/* Meta details */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-[10px] font-black text-amber-505 uppercase tracking-widest block mb-1">
                    SERVICE OPERATIONS PANEL
                  </span>
                  <div className="flex items-center gap-2">
                    {activeCategory.icon}
                    <h3 className="text-sm font-black text-slate-850 dark:text-white leading-tight">
                      {selectedService}
                    </h3>
                  </div>
                  <span className="inline-block text-[9px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-2 py-0.5 rounded mt-2 uppercase font-extrabold">
                    {activeCategory.category}
                  </span>
                </div>

                {/* Description of Service */}
                <div className="space-y-2 p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/85">
                  <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-amber-500" /> Professional Scope Description
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                    {getServiceDescription(selectedService)}
                  </p>
                </div>

                {selectedService === "Load Lists" ? (
                  <LoadListTable onAskAI={onAskAI} />
                ) : (
                  <>
                    {/* 1. Category Formulations */}
                    {activeCategory.formulas && Object.keys(activeCategory.formulas).length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                          Core Engineering Equations
                        </span>
                        <div className="space-y-2">
                          {Object.entries(activeCategory.formulas).map(([key, value]) => (
                            <div 
                              key={key}
                              className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-1.5"
                            >
                              <div className="truncate">
                                <span className="text-[8px] font-mono font-bold text-slate-450 block uppercase tracking-tight">
                                  {camelToTitle(key)}
                                </span>
                                <span className="text-[11px] font-mono font-extrabold text-amber-600 dark:text-amber-400">
                                  {value}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(value, key, "formula")}
                                title="Copy formula"
                                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-slate-500 hover:text-amber-500 shrink-0"
                              >
                                {copiedFormula === key ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Unit Symbols Reference */}
                    {activeCategory.unit_symbols && Object.keys(activeCategory.unit_symbols).length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                          Unit guidelines & standard metrics
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(activeCategory.unit_symbols).map(([key, symbol]) => (
                            <div
                              key={key}
                              onClick={() => copyToClipboard(symbol, key, "symbol")}
                              className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/60 p-2 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <span className="text-[9px] font-semibold text-slate-500 truncate capitalize">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="text-[10px] font-mono font-black text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 select-all">
                                {symbol}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Useful Regulatory Standard Links */}
                    {activeCategory.useful_links && activeCategory.useful_links.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                          Applicable standard catalogs
                        </span>
                        <div className="space-y-1.5">
                          {activeCategory.useful_links.map((linkStr, idx) => {
                            const parsed = parseUsefulLink(linkStr);
                            return (
                              <a
                                href={parsed.url}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                rel="noopener noreferrer"
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/25 dark:bg-indigo-950/20 border border-indigo-150/30 text-indigo-780 dark:text-indigo-400 text-[10px] font-semibold hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition group"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span className="truncate">{parsed.label}</span>
                                </span>
                                <ExternalLink className="w-3 h-3 text-indigo-450 opacity-60 group-hover:opacity-100 transition-opacity" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Pathways */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block animate-pulse">
                        Fast Access Controls
                      </span>

                      {/* Direct Link to a Calculator/Page if matched */}
                      {(() => {
                        const routing = getServiceActionRoute(selectedService);
                        if (routing) {
                          return (
                            <button
                              type="button"
                              onClick={() => onNavigate(routing.page, routing.subTab)}
                              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-750 hover:to-emerald-900 border border-emerald-700/20 text-white rounded-xl transition cursor-pointer shadow-sm group font-bold text-xs"
                            >
                              <span className="flex items-center gap-2 pr-1 truncate">
                                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="truncate">{routing.label}</span>
                              </span>
                              <div className="flex items-center gap-1 text-amber-400 text-3xs font-black uppercase tracking-wider">
                                LAUNCH <ExternalLink className="w-3 h-3 text-amber-300" />
                              </div>
                            </button>
                          );
                        }
                        return (
                          <div className="p-3 bg-amber-500/10 border border-amber-505/15 rounded-xl text-[11px] text-amber-700 dark:text-amber-400 font-semibold leading-normal flex gap-2">
                            <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>This specialized design service runs complex localized settings. You can request customized parameters using our AI Expert below.</span>
                          </div>
                        );
                      })()}

                      {/* Pre-filled AI Assistant Assistant */}
                      <button
                        type="button"
                        onClick={() => handleAiPromptSelect(selectedService)}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-xl transition cursor-pointer font-bold text-xs shadow-md"
                      >
                        <Bot className="w-4 h-4 text-amber-400 animate-bounce" />
                        <span>Ask AI Expert Guidelines</span>
                      </button>

                    </div>
                  </>
                )}

                {/* Code Standards Meta Box */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1.5 text-3xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                  <div className="flex justify-between">
                    <span>Applicable standard:</span>
                    <span className="text-slate-750 dark:text-slate-350 font-extrabold uppercase text-right">
                      {activeCategory.useful_links && activeCategory.useful_links.length > 0 
                        ? parseUsefulLink(activeCategory.useful_links[0]).label 
                        : "ISO / IEEE / IEC"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validation State:</span>
                    <span className="text-emerald-500 font-extrabold">Live Sync Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operational Scope:</span>
                    <span className="text-slate-700 dark:text-slate-350 font-extrabold">Industrial / Comm</span>
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 select-none">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2.5" />
                <h4 className="text-xs font-black uppercase text-slate-650 dark:text-slate-300">No Service Selected</h4>
                <p className="text-[11px] text-slate-450 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Click on any service card parameter on the left of the dashboard to open parameters.
                </p>
              </div>
            )}
          </AnimatePresence>

          {/* Prompt Guidelines Summary */}
          <div className="bg-gradient-to-br from-amber-400/5 to-amber-400/10 border-2 border-amber-500/15 p-5 rounded-2xl space-y-3.5">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Integrated Engineering Suite
            </h4>
            <ul className="space-y-2.5 text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-500 text-xs shrink-0">•</span>
                <span><strong>Clear Categories:</strong> Organizes the entire system scope ranging from distribution networks to Low Voltage setups.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-500 text-xs shrink-0">•</span>
                <span><strong>Formula Reference:</strong> Quick-copy real equations instantly to speed up your calculation reports.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-505 text-xs shrink-0">•</span>
                <span><strong>Standard Links:</strong> Direct links connect you straight to the corresponding global standard providers with a single click.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
