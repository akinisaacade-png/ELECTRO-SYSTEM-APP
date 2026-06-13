import React from "react";

export interface ElectricalSymbol {
  id: string;
  name: string;
  designator: string;
  category: "Transformers" | "Protections" | "Motors & Loads" | "Controls & Grounding";
  standards: string;
  description: string;
  detailedUsage: string; // NEC / IEC compliant usage for tooltips
  asciiRepresentation: string;
  svgMarkup: string; // raw SVG for reference or custom use
}

export const ELECTRICAL_SYMBOLS: ElectricalSymbol[] = [
  {
    id: "substation-tx",
    name: "Substation Transformer",
    designator: "T1, TX",
    category: "Transformers",
    standards: "IEC 60617 / IEEE 315",
    description: "Converts high-voltage grid transmission power down to safe, usable low-voltage levels.",
    detailedUsage: "NEC Article 450 governs the installation of transformers. They require continuous ventilation, overcurrent protection on both primary and secondary windings, and proper cabinet grounding. When connecting star (Wye) configurations, the neutral point must be solidly connected to the grounding electrode system (NEC 250.30) to stabilize line-to-neutral voltages.",
    asciiRepresentation: `
       (   )
      ( ( ) )   <-- Dual interlocking coils
       (   )
    Star Neutral Grounded
    `,
    svgMarkup: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full stroke-amber-500 dark:stroke-amber-400 stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
      <path d="M12 32H20" />
      <circle cx="28" cy="32" r="10" />
      <circle cx="38" cy="32" r="10" />
      <path d="M46 32H54" />
      <path d="M28 20V12" />
      <path d="M38 44V52" />
    </svg>`
  },
  {
    id: "circuit-breaker",
    name: "Circuit Breaker (MCB/MCCB)",
    designator: "Q1, CB",
    category: "Protections",
    standards: "IEC 60947-2 / ANSI C37",
    description: "Automatic overcurrent protective device designed to open under fault conditions.",
    detailedUsage: "Under NEC 240.4, conductors must be matching with the appropriate overcurrent protective device (OCPD) size. Typical standard sizes are governed by NEC 240.6. Circuit breakers serve dual purposes: thermal protection (against continuous sustained overloads) and electromagnetic protection (against high-energy instantaneous short circuits). Suitable for use as service disconnects when appropriately labeled.",
    asciiRepresentation: `
           /
        --o  o--   <-- Open switch contact
           x       <-- Auto trip element
    `,
    svgMarkup: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full stroke-emerald-500 stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
      <path d="M10 32H22" />
      <circle cx="22" cy="32" r="2" fill="currentColor" />
      <path d="M22 32L38 18" />
      <circle cx="42" cy="32" r="2" fill="currentColor" />
      <path d="M42 32H54" />
      <rect x="27" y="38" width="10" height="10" rx="1" />
      <path d="M27 38L37 48" />
      <path d="M37 38L27 48" />
    </svg>`
  },
  {
    id: "safety-fuse",
    name: "Safety Fuse Link",
    designator: "F1, FS",
    category: "Protections",
    standards: "IEC 60269 / ANSI IEEE",
    description: "Thermal sacrificial overcurrent device that melts to break the circuit in peak currents.",
    detailedUsage: "NEC Article 245 governs requirements for fuses. Fuses are extremely fast-acting and offer high interrupting ratings (often up to 200,000A) to clear short circuits instantly. High-rupturing capacity (HRC) cartridges are used extensively in main switchboards. NEC 240.40 requires a disconnecting means on the supply side of all cartridge fuses where accessible to unqualified persons.",
    asciiRepresentation: `
        --[===]--  <-- Fuse element housing
           ---     <-- Sacrificial link wire
    `,
    svgMarkup: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full stroke-red-500 stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
      <path d="M10 32H20" />
      <rect x="20" y="22" width="24" height="20" rx="1" />
      <path d="M14 32H50" />
      <path d="M44 32H54" />
    </svg>`
  },
  {
    id: "earth-ground",
    name: "Earth System Ground",
    designator: "E, PE, GND",
    category: "Controls & Grounding",
    standards: "IEC 60364 / NEC Section 250",
    description: "Direct connection to the earth grounding electrode for fault current dissipation and voltage reference.",
    detailedUsage: "In accordance with NEC Article 250, grounding provides a secure, low-impedance path back to the utility source to clear overcurrent devices during ground faults. The earth's soil path must NOT be used as the sole equipment grounding conductor. All metallic raceways, switchboards, and non-current-carrying parts must be bonded together to prevent dangerous touch-voltage potentials.",
    asciiRepresentation: `
          │
        =====      <-- Main Grounding Bus
         ===       <-- Earth rods series
          =
    `,
    svgMarkup: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full stroke-sky-500 stroke-[2.5] stroke-linecap-round">
      <path d="M32 12V36" />
      <path d="M16 36H48" />
      <path d="M22 42H42" />
      <path d="M28 48H36" />
    </svg>`
  },
  {
    id: "induction-motor",
    name: "3-Phase Induction Motor",
    designator: "M1, MOT",
    category: "Motors & Loads",
    standards: "IEC 60034 / NEMA MG-1",
    description: "Converts three-phase electrical power to mechanical rotational torque.",
    detailedUsage: "Sizing motor conductors is governed strictly by NEC Article 430. Conductors supplying a single motor must have an ampacity of not less than 125% of the motor full-load current (FLC) rating as specified in NEC Tables 430.247-250. Sizing the motor overload relay protector must also account for the Service Factor (SF) - typically 125% overload for SF >= 1.15.",
    asciiRepresentation: `
         +-----+
         | (M) |   <-- Inductive stator-rotor core
         +-----+
        T1 T2 T3 Phase inputs
    `,
    svgMarkup: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full stroke-teal-500 stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
      <circle cx="32" cy="32" r="18" />
      <path d="M32 14V8" />
      <path d="M24 16L20 10" />
      <path d="M40 16L44 10" />
      <path d="M24 40L21 45" />
      <path d="M32 40L32 46" />
      <path d="M40 40L43 45" />
      <text x="32" y="38" font-family="monospace" font-size="20" font-weight="900" text-anchor="middle" fill="currentColor" stroke="none">M</text>
    </svg>`
  },
  {
    id: "magnetic-contactor",
    name: "Magnetic Contactor",
    designator: "KM1, CON",
    category: "Controls & Grounding",
    standards: "IEC 60947-4 / NEMA ICS-2",
    description: "Electromagnetically operated switch used to remotely open or close heavy power feed lines.",
    detailedUsage: "Magnetic contactor poles are sized according to NEMA starter size classes or IEC utilization categories (e.g. AC-3 for cage motor starter controls). Under NEC 430 Part VII, control circuits must be protected. Contactors require auxiliary feedback paths to construct safety lockouts, interlocking logic, and seal-in paths in industrial control cabinets.",
    asciiRepresentation: `
       1/L1 In
         │
        --| |--  <-- Electromagnetic plunger contacts
         │
       2/T1 Out
    `,
    svgMarkup: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full stroke-purple-500 stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
      <path d="M12 32H18" />
      <path d="M18 18V46" />
      <path d="M46 18V46" />
      <path d="M46 32H52" />
      <path d="M24 32H40" style="stroke-dasharray: 4 2;" />
      <rect x="26" y="24" width="12" height="16" fill="none" />
      <path d="M26 24L38 40" />
    </svg>`
  },
  {
    id: "disconnector-switch",
    name: "Disconnector Isolator Switch",
    designator: "S1, DS",
    category: "Protections",
    standards: "IEC 60947-3 / NEC Article 110",
    description: "Mechanical switch used to completely de-energize and isolate a section of a circuit for personnel safety.",
    detailedUsage: "NEC Article 110.22 requires legible marking of disconnecting means for motors and appliances. Disconnector switches are designed to be operated under no-load conditions only (unless explicitly load-break rated). They must offer a visible physical air gap in the open state and support lock-out/tag-out (LOTO) security lugs under OSHA regulations.",
    asciiRepresentation: `
           /
        --o  o--   <-- Heavy visual air break hinge
    `,
    svgMarkup: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full stroke-orange-500 stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
      <path d="M10 32H20" />
      <circle cx="20" cy="32" r="2" fill="currentColor" />
      <path d="M20 32L40 14" />
      <circle cx="44" cy="32" r="2" fill="currentColor" />
      <path d="M44 32H54" />
    </svg>`
  },
  {
    id: "control-relay",
    name: "Control Relay Coil & Contacts",
    designator: "K1, RY",
    category: "Controls & Grounding",
    standards: "IEC 61810 / IEEE 1547",
    description: "Low-power logical controller that triggers heavier contactors or switches from auxiliary inputs.",
    detailedUsage: "NEC Article 725 covers remote-control and signaling circuits, detailing Class 1, 2, and 3 classifications. Control relays are key in separating high-voltage power networks from safe 24V DC logic panels. They are used extensively for interlocking sequences, emergency stop chains, and PLC output isolation blocks.",
    asciiRepresentation: `
        +------[X]------+
        | MAGNETIC COIL | <-- Solenoid driver contact
        +---------------+
    `,
    svgMarkup: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full stroke-indigo-500 stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
      <rect x="16" y="24" width="32" height="16" />
      <path d="M32 24V40" />
      <path d="M10 32H16" />
      <path d="M48 32H54" />
    </svg>`
  },
  {
    id: "ac-generator",
    name: "Emergency AC Generator",
    designator: "G1, GEN",
    category: "Transformers",
    standards: "NEC Article 700 / 701 / 702",
    description: "Rotary generator source supplying standby or emergency power when utility lines fail.",
    detailedUsage: "Emergency generator installation is strictly regulated by NEC Article 700 (Emergency Systems) and Article 701 (Legally Required Standby Systems). They must supply backup loads within 10 seconds of utility power failure. Isolation via a certified Automatic Transfer Switch (ATS) is required to prevent hazardous back-feeding into the utility grid.",
    asciiRepresentation: `
         +-----+
         | (G) |   <-- Multi-phase generator stator
         +-----+
        Neutral Isolation Transfer ground
    `,
    svgMarkup: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full stroke-amber-500 stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
      <circle cx="32" cy="32" r="18" />
      <path d="M22 32C22 32 24 26 27 26C30 26 31 38 34 38C37 38 39 32 39 32" />
      <path d="M10 32H14" />
      <path d="M50 32H54" />
      <text x="32" y="20" font-family="monospace" font-size="10" font-weight="900" text-anchor="middle" fill="currentColor" stroke="none">GEN</text>
    </svg>`
  }
];
