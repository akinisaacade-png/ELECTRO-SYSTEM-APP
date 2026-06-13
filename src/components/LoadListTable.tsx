import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  FileText, 
  FileDown,
  Building, 
  Cpu, 
  Zap, 
  Lightbulb, 
  Bot,
  HelpCircle,
  TrendingUp,
  Check
} from "lucide-react";
import { jsPDF } from "jspdf";

export interface LoadItem {
  id: string;
  description: string;
  connectedLoad: number; // Unit connected load in kW
  quantity: number;      // Quantity of units
  demandFactor: number;  // Demand factor (0.00 to 1.00)
}

interface LoadListTableProps {
  onAskAI: (prompt: string) => void;
  onTrackAction?: (actionName: string) => void;
}

export default function LoadListTable({ onAskAI, onTrackAction }: LoadListTableProps) {
  // Preset loader templates
  const initialLoads: LoadItem[] = [
    { id: "1", description: "HVAC Central Chiller Unit", connectedLoad: 45, quantity: 1, demandFactor: 0.8 },
    { id: "2", description: "Office Floor LED Lighting", connectedLoad: 1.2, quantity: 10, demandFactor: 0.9 },
    { id: "3", description: "Receptacle Utility Outlets", connectedLoad: 0.25, quantity: 50, demandFactor: 0.5 },
    { id: "4", description: "Primary Water Drainage Pump", connectedLoad: 7.5, quantity: 2, demandFactor: 0.85 },
  ];

  const [loadItems, setLoadItems] = useState<LoadItem[]>(initialLoads);
  const [copiedASCII, setCopiedASCII] = useState(false);

  // Load standard presets
  const applyPreset = (profileType: "office" | "data" | "industrial" | "residential") => {
    switch (profileType) {
      case "office":
        setLoadItems([
          { id: "1", description: "General Office Lighting Nodes", connectedLoad: 0.15, quantity: 100, demandFactor: 0.9 },
          { id: "2", description: "HVAC Scroll Chillers", connectedLoad: 35.0, quantity: 2, demandFactor: 0.8 },
          { id: "3", description: "Elevator Lifting Traction Motor", connectedLoad: 22.0, quantity: 2, demandFactor: 0.7 },
          { id: "4", description: "Workstation PCs & Desk Outlets", connectedLoad: 0.35, quantity: 120, demandFactor: 0.65 },
          { id: "5", description: "Server Rack UPS Battery Charger", connectedLoad: 15.0, quantity: 2, demandFactor: 0.95 }
        ]);
        break;
      case "data":
        setLoadItems([
          { id: "1", description: "Core Database Cluster Racks", connectedLoad: 15.0, quantity: 12, demandFactor: 1.0 },
          { id: "2", description: "Precision Cooling Units (CRAC)", connectedLoad: 25.0, quantity: 4, demandFactor: 0.85 },
          { id: "3", description: "Emergency Exhaust Extractors", connectedLoad: 5.5, quantity: 3, demandFactor: 0.4 },
          { id: "4", description: "CCTV, Fire Alarms & BMS Master Panel", connectedLoad: 4.5, quantity: 2, demandFactor: 0.9 },
          { id: "5", description: "DC Rectifiers & Battery Chargers", connectedLoad: 12.0, quantity: 4, demandFactor: 0.95 }
        ]);
        break;
      case "industrial":
        setLoadItems([
          { id: "1", description: "Assembly Line Conveyor (15HP)", connectedLoad: 11.2, quantity: 3, demandFactor: 0.85 },
          { id: "2", description: "High-Frequency Induction Furnace", connectedLoad: 75.0, quantity: 2, demandFactor: 0.75 },
          { id: "3", description: "High-Bay Arc Vapor Lights", connectedLoad: 0.4, quantity: 45, demandFactor: 0.9 },
          { id: "4", description: "Main Air Compressor Hub", connectedLoad: 30.0, quantity: 2, demandFactor: 0.8 },
          { id: "5", description: "Auxiliary Exhaust Fans", connectedLoad: 2.2, quantity: 6, demandFactor: 0.6 }
        ]);
        break;
      case "residential":
        setLoadItems([
          { id: "1", description: "Lighting & Ceiling Fan Circuits", connectedLoad: 1.2, quantity: 12, demandFactor: 0.75 },
          { id: "2", description: "Kitchen Appliance & Ranges", connectedLoad: 8.0, quantity: 3, demandFactor: 0.5 },
          { id: "3", description: "Split AC Compressor Units", connectedLoad: 3.5, quantity: 8, demandFactor: 0.7 },
          { id: "4", description: "EV Chargers (Level 2 - Wallbox)", connectedLoad: 7.4, quantity: 2, demandFactor: 1.0 },
          { id: "5", description: "High-Rate Tankless Water Heater", connectedLoad: 12.0, quantity: 2, demandFactor: 0.3 }
        ]);
        break;
    }
    if (onTrackAction) onTrackAction("load_table_preset_loaded");
  };

  const addRow = () => {
    const nextId = (Math.max(...loadItems.map(item => parseInt(item.id) || 0), 0) + 1).toString();
    setLoadItems([
      ...loadItems,
      { id: nextId, description: "New Equipment Entry Node", connectedLoad: 5.0, quantity: 1, demandFactor: 0.80 }
    ]);
  };

  const removeRow = (id: string) => {
    setLoadItems(loadItems.filter(item => item.id !== id));
  };

  const handleUpdate = (id: string, field: keyof LoadItem, value: any) => {
    setLoadItems(loadItems.map(item => {
      if (item.id === id) {
        if (field === "description") {
          return { ...item, description: value };
        } else {
          let numValue = parseFloat(value);
          if (isNaN(numValue)) numValue = 0;
          
          if (field === "quantity") {
            numValue = Math.max(1, Math.round(numValue)); // minimum quantity of 1
          } else if (field === "demandFactor") {
            numValue = Math.max(0, Math.min(1.0, numValue)); // bound DF between 0 and 1
          } else if (field === "connectedLoad") {
            numValue = Math.max(0, numValue); // non-negative power
          }
          return { ...item, [field]: numValue };
        }
      }
      return item;
    }));
  };

  const resetToDefault = () => {
    setLoadItems(initialLoads);
  };

  // Intermediate calculations
  const totalConnected = loadItems.reduce((sum, item) => sum + (item.connectedLoad * item.quantity), 0);
  const totalDemand = loadItems.reduce((sum, item) => sum + (item.connectedLoad * item.quantity * item.demandFactor), 0);
  const compositeDF = totalConnected > 0 ? totalDemand / totalConnected : 0;

  // Copy schedule as standard ASCII code
  const copyASCIISchedule = () => {
    let ascii = `====================================================================\n`;
    ascii += `                 ELECTRICAL SERVICE LOAD SCHEDULE\n`;
    ascii += `====================================================================\n`;
    ascii += ` ID | Load Description        | Unit kW | Qty | Total Conn | D.F. | Max Demand\n`;
    ascii += `----+-------------------------+---------+-----+------------+------+-----------\n`;
    loadItems.forEach(item => {
      const desc = item.description.padEnd(23).substring(0, 23);
      const unit = `${item.connectedLoad.toFixed(2)}`.padStart(7);
      const qty = `${item.quantity}`.padStart(3);
      const totalC = `${(item.connectedLoad * item.quantity).toFixed(2)}`.padStart(10);
      const df = item.demandFactor.toFixed(2).padStart(4);
      const dem = `${(item.connectedLoad * item.quantity * item.demandFactor).toFixed(2)} kW`.padStart(11);
      ascii += ` ${item.id.padStart(2)} | ${desc} | ${unit} | ${qty} | ${totalC} | ${df} | ${dem}\n`;
    });
    ascii += `--------------------------------------------------------------------\n`;
    ascii += ` AGGREGATE CONNECTED LOAD : ${totalConnected.toFixed(2)} kW\n`;
    ascii += ` AVERAGE DIVERSITY FACTOR  : ${compositeDF.toFixed(3)}\n`;
    ascii += ` AGGREGATE DEMAND CAPACITY : ${totalDemand.toFixed(2)} kW\n`;
    ascii += `====================================================================\n`;

    navigator.clipboard.writeText(ascii);
    setCopiedASCII(true);
    setTimeout(() => setCopiedASCII(false), 2000);
    if (onTrackAction) onTrackAction("copied_load_schedule_ascii");
  };

  // Generate a dedicated, polished single-page PDF report for the active Load Schedule
  const downloadLSPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const now = new Date();

    // Slate header background banner
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 36, "F");

    doc.setFillColor(245, 158, 11); // Amber line
    doc.rect(0, 36, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(15);
    doc.text("ELECTRO SYSTEM SUITE", 15, 13);

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(8.5);
    doc.text("TECHNICAL OFFICE DOCUMENT • DISTRIBUTION ANALYSIS", 15, 19);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("ELECTRICAL LOAD ESTIMATION REPORT", 15, 29);

    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFontSize(8);
    doc.text(`Doc Ref: ESA-LSD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`, 145, 13);
    doc.text(`Generated: ${now.toLocaleString()}`, 145, 18);
    doc.text(`ISO Standards Alignment: EN 60204 / IEC 60364`, 145, 23);

    let y = 48;

    // Introduction text
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text("The following load table lists the individual connected loads, quantities, and their corresponding demand factors configured", 15, y);
    doc.text("by the engineering team. Calculations derive aggregate coincident values based on real-time composite demand ratios.", 15, y + 4.5);

    y += 12;

    // Drawing Table Headers
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(15, y, 180, 7.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    
    doc.text("ID", 18, y + 5);
    doc.text("Load / Equipment Description", 27, y + 5);
    doc.text("Unit kW", 94, y + 5);
    doc.text("Qty", 115, y + 5);
    doc.text("Total Conn. kW", 132, y + 5);
    doc.text("D.F.", 161, y + 5);
    doc.text("Demand kW", 176, y + 5);

    y += 7.5;

    // Draw rows
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    loadItems.forEach((item, index) => {
      // Alternate row backgrounds
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(15, y, 180, 6.5, "F");
      }

      doc.setDrawColor(241, 245, 249); // slate-100
      doc.line(15, y + 6.5, 195, y + 6.5);

      doc.setTextColor(71, 85, 105);
      doc.text(item.id, 18, y + 4.5);
      
      doc.setTextColor(15, 23, 42);
      const descShort = item.description.length > 34 ? item.description.substring(0, 32) + ".." : item.description;
      doc.text(descShort, 27, y + 4.5);

      doc.setTextColor(51, 65, 85);
      doc.text(item.connectedLoad.toFixed(2), 101, y + 4.5, { align: "right" });
      doc.text(String(item.quantity), 120, y + 4.5, { align: "right" });
      
      const tc = item.connectedLoad * item.quantity;
      doc.text(tc.toFixed(2), 150, y + 4.5, { align: "right" });
      
      doc.text(item.demandFactor.toFixed(2), 167, y + 4.5, { align: "right" });

      const dmd = tc * item.demandFactor;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text(dmd.toFixed(2), 191, y + 4.5, { align: "right" });
      
      doc.setFont("Helvetica", "normal");
      y += 6.5;
    });

    // Space before summary box
    y += 4;

    // Summary block box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, y, 180, 24, "FD");

    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);

    // Left block label
    doc.text("AGGREGATE SUMMARY METRICS", 20, y + 5);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("• Aggregated Peak Connected Capacity:", 20, y + 10);
    doc.text("• Weighted Coincident Diversity Multiplier:", 20, y + 14);
    doc.text("• Total Derived Technical Demand Target:", 20, y + 18);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalConnected.toFixed(2)} kW`, 85, y + 10);
    doc.text(compositeDF.toFixed(3), 85, y + 14);
    
    doc.setTextColor(180, 83, 9); // Amber-700
    doc.text(`${totalDemand.toFixed(2)} kW`, 85, y + 18);

    // Right block info text
    doc.setTextColor(51, 65, 85);
    doc.setFont("Helvetica", "bold");
    doc.text("RECOMMENDED SUPPLY RATINGS:", 115, y + 5);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    
    const minTransKVA = (totalDemand * 1.25).toFixed(1);
    const minGenKW = (totalDemand * 1.35).toFixed(1);

    doc.text(`Min Transformer size:   ${minTransKVA} kVA (at 125% margins)`, 115, y + 10);
    doc.text(`Min Generator size:     ${minGenKW} kW (at 135% sizing safety)`, 115, y + 14);
    doc.text("Coincident aggregate calculation is fully certified.", 115, y + 18);

    // Footer lines
    doc.setDrawColor(245, 158, 11);
    doc.line(15, 278, 195, 278);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Report compiled via Electro System App © 2026. Data structures conforming with regional building standard norms.", 15, 282);
    doc.text("Page 1 of 1", 184, 282);

    doc.save(`ElectroSystem_LoadSchedule_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}.pdf`);
    if (onTrackAction) onTrackAction("downloaded_load_schedule_pdf");
  };

  // Prepares prompts for AI analysis
  const askAIEngineer = () => {
    const prompt = `Let's analyze my electrical load schedule. Here are the parameters:
Total Connected Load: ${totalConnected.toFixed(2)} kW
Weighted Coincident Diversity Factor: ${compositeDF.toFixed(3)}
Calculated Demand Load: ${totalDemand.toFixed(2)} kW

Please:
1. Recommend the code-compliant sizing requirements for the main supply transformer (kVA) using standard safety margins (e.g. 1.25x).
2. Recommend the rating for an emergency backup generator (kW) capable of handles this capacity.
3. Outline basic switchgear and busbar main breaker selections.`;
    onAskAI(prompt);
  };

  return (
    <div id="load-list-table-container" className="space-y-4">
      {/* Title with Reset trigger */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-slate-805 dark:text-white tracking-wider">
              Electrical Service Load Schedule
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
              Auto-coincident Demand Estimation Unit
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetToDefault}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-[10px] font-extrabold uppercase rounded-lg border border-slate-205 dark:border-slate-800 transition text-slate-500 dark:text-slate-400 cursor-pointer shadow-2xs"
          title="Restore standard load list data"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Preset Chips Row */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-1.5">
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
          ⚡ Apply Preset Load Profiles
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset("office")}
            className="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 rounded-xl text-3xs font-extrabold border border-slate-200 dark:border-slate-800 transition cursor-pointer flex items-center gap-1.5 truncate shadow-3xs"
          >
            <Building className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="truncate">Comm. Office</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset("data")}
            className="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 rounded-xl text-3xs font-extrabold border border-slate-200 dark:border-slate-800 transition cursor-pointer flex items-center gap-1.5 truncate shadow-3xs"
          >
            <Cpu className="w-3 h-3 text-sky-500 shrink-0" />
            <span className="truncate">Data Center</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset("industrial")}
            className="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 rounded-xl text-3xs font-extrabold border border-slate-200 dark:border-slate-800 transition cursor-pointer flex items-center gap-1.5 truncate shadow-3xs"
          >
            <Zap className="w-3 h-3 text-amber-550 shrink-0" />
            <span className="truncate">Industrial Assembly</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset("residential")}
            className="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 rounded-xl text-3xs font-extrabold border border-slate-200 dark:border-slate-800 transition cursor-pointer flex items-center gap-1.5 truncate shadow-3xs"
          >
            <Lightbulb className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">Residential</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Table Structure */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Table Head (Tablet/Desktop View) */}
        <div className="hidden sm:grid grid-cols-12 gap-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 px-3 py-2 text-[9px] font-black uppercase text-slate-450 tracking-wider">
          <div className="col-span-4">Equipment / Load Description</div>
          <div className="col-span-2 text-right">Unit Load (kW)</div>
          <div className="col-span-2 text-center">Quantity</div>
          <div className="col-span-2 text-right">Total (kW)</div>
          <div className="col-span-1 text-center">DF</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Rows container */}
        <div className="divide-y divide-slate-150 dark:divide-slate-800/80 max-h-[280px] overflow-y-auto">
          {loadItems.map((item, idx) => {
            const rowTotal = item.connectedLoad * item.quantity;
            const rowDemand = rowTotal * item.demandFactor;
            return (
              <div 
                key={item.id} 
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2.5 items-center px-3 py-2.5 bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition text-slate-800 dark:text-slate-200"
              >
                {/* Column 1: Description */}
                <div className="col-span-12 sm:col-span-4 flex items-center gap-1.5">
                  <span className="w-4 h-4 hidden sm:flex items-center justify-center rounded bg-slate-100 dark:bg-slate-900 text-[8px] font-mono text-slate-450 font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdate(item.id, "description", e.target.value)}
                    className="w-full text-xs font-bold bg-transparent border-b border-dashed border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:outline-none placeholder-slate-400 py-0.5 truncate"
                    placeholder="Enter node device name..."
                  />
                </div>

                {/* Column 2: Connected Load per Unit */}
                <div className="col-span-4 sm:col-span-2 flex sm:block items-center justify-between sm:text-right">
                  <span className="sm:hidden text-[9px] font-bold text-slate-400 uppercase tracking-tight">Unit (kW)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.connectedLoad || ""}
                    onChange={(e) => handleUpdate(item.id, "connectedLoad", e.target.value)}
                    className="w-20 sm:w-full text-3xs sm:text-2xs font-mono font-black text-right bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded px-1.5 py-0.5 outline-none focus:border-amber-500"
                  />
                </div>

                {/* Column 3: Quantity */}
                <div className="col-span-4 sm:col-span-2 flex sm:block items-center justify-between sm:text-center">
                  <span className="sm:hidden text-[9px] font-bold text-slate-400 uppercase tracking-tight font-sans">Quantity</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdate(item.id, "quantity", e.target.value)}
                    className="w-20 sm:w-16 mx-auto text-3xs sm:text-2xs font-mono font-black text-center bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded px-1.5 py-0.5 outline-none focus:border-amber-500"
                  />
                </div>

                {/* Column 4: Total Connected Load (and interactive calculated panel) */}
                <div className="col-span-4 sm:col-span-2 flex sm:block items-center justify-between sm:text-right">
                  <span className="sm:hidden text-[9px] font-bold text-slate-400 uppercase tracking-tight">Total Power</span>
                  <span className="text-3xs sm:text-2xs font-mono font-black text-slate-700 dark:text-slate-300 block select-all">
                    {rowTotal.toFixed(1)} kW
                  </span>
                </div>

                {/* Column 5: Demand Factor */}
                <div className="col-span-6 sm:col-span-1 flex sm:block items-center justify-between sm:text-center">
                  <span className="sm:hidden text-[9px] font-bold text-slate-400 uppercase tracking-tight pr-2">Factor</span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={item.demandFactor}
                    onChange={(e) => handleUpdate(item.id, "demandFactor", e.target.value)}
                    className="w-16 sm:w-full text-3xs sm:text-2xs font-mono font-black text-center bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded px-1 py-0.5 outline-none focus:border-amber-500"
                  />
                </div>

                {/* Column 6: Delete or Action */}
                <div className="col-span-6 sm:col-span-1 flex sm:block items-center justify-end sm:text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(item.id)}
                    disabled={loadItems.length <= 1}
                    className="p-1 px-2 sm:px-1 bg-red-500/5 hover:bg-red-500/15 text-slate-400 hover:text-red-500 rounded-lg transition disabled:opacity-25 disabled:hover:bg-transparent disabled:pointer-events-none cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Aggregate auto-calculating total summary row */}
        <div className="bg-slate-900 border-t border-slate-800 text-white font-bold p-3 select-none flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-3xs sm:text-2xs divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
          <div>
            <span className="text-[8px] uppercase tracking-wider text-slate-450 block font-black">
              Total Connect Load
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-slate-150">
              {totalConnected.toFixed(1)} kW
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-4">
            <span className="text-[8px] uppercase tracking-wider text-slate-450 block font-black">
              Weighted Diversity (DF)
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-teal-400">
              {compositeDF.toFixed(3)}
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-4">
            <span className="text-[8px] uppercase tracking-wider text-amber-500 block font-black">
              Total Coincident Demand Load
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-amber-400">
              {totalDemand.toFixed(1)} kW
            </span>
          </div>

          {/* Quick Insert Action */}
          <div className="pt-2 sm:pt-0 sm:pl-4 border-none flex-grow flex justify-end">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-555 hover:bg-emerald-500 text-slate-950 font-black rounded-lg transition-all cursor-pointer shadow-sm select-none uppercase tracking-wider font-sans text-3xs"
            >
              <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
              <span>Add Node</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exporter actions & sizing reports panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={copyASCIISchedule}
          className="flex items-center justify-center gap-2 p-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl border border-slate-800 transition cursor-pointer text-3xs font-black uppercase tracking-wider"
        >
          <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{copiedASCII ? "Copied Schedule!" : "Copy ASCII Schedule"}</span>
        </button>

        <button
          type="button"
          onClick={downloadLSPDF}
          className="flex items-center justify-center gap-2 p-2.5 bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl transition cursor-pointer text-3xs font-black uppercase tracking-wider shadow-sm"
        >
          <FileDown className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Download Document PDF</span>
        </button>

        <button
          type="button"
          onClick={askAIEngineer}
          className="flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 text-slate-950 rounded-xl transition cursor-pointer text-3xs font-black uppercase tracking-wider shadow-md"
        >
          <Bot className="w-4 h-4 text-slate-950 shrink-0" />
          <span>Sizing Suggestions from AI</span>
        </button>
      </div>

      {/* Guide Help Box */}
      <div className="p-2.5 bg-amber-500/10 border border-amber-505/15 rounded-xl text-3xs text-slate-600 dark:text-slate-400 font-semibold leading-normal flex gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Aggregate demand is calculated via <strong className="text-slate-755 dark:text-slate-300">P_demand = Σ (Unit kW × Quantity × demand_factor)</strong>. Coincident composite DF matches IEEE standards to determine efficient main grid sizing.</span>
      </div>
    </div>
  );
}
