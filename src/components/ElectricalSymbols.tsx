import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Layers, 
  Info, 
  HelpCircle, 
  Code, 
  Check, 
  Copy, 
  BookOpen, 
  Cpu, 
  Sparkles, 
  Workflow,
  ExternalLink,
  Download
} from "lucide-react";
import { ELECTRICAL_SYMBOLS, ElectricalSymbol } from "../data/symbols";

interface ElectricalSymbolsProps {
  onTrackAction?: (actionName: string) => void;
}

export default function ElectricalSymbols({ onTrackAction }: ElectricalSymbolsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredSymbolId, setHoveredSymbolId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectedSymbol, setInspectedSymbol] = useState<ElectricalSymbol | null>(ELECTRICAL_SYMBOLS[0]);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [exportingGrid, setExportingGrid] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Filter symbols based on category and search query
  const categories = ["All", "Transformers", "Protections", "Motors & Loads", "Controls & Grounding"];

  const filteredSymbols = ELECTRICAL_SYMBOLS.filter((symbol) => {
    const matchesCategory = selectedCategory === "All" || symbol.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      symbol.name.toLowerCase().includes(searchLower) ||
      symbol.designator.toLowerCase().includes(searchLower) ||
      symbol.standards.toLowerCase().includes(searchLower) ||
      symbol.description.toLowerCase().includes(searchLower);
    
    return matchesCategory && matchesSearch;
  });

  // Calculate dynamic counts per category based on current search query
  const categoryCounts = categories.reduce((acc, cat) => {
    const symbolsInCat = ELECTRICAL_SYMBOLS.filter(s => cat === "All" || s.category === cat);
    const matchingSearch = symbolsInCat.filter(symbol => {
      const searchLower = searchQuery.toLowerCase();
      return symbol.name.toLowerCase().includes(searchLower) ||
        symbol.designator.toLowerCase().includes(searchLower) ||
        symbol.standards.toLowerCase().includes(searchLower) ||
        symbol.description.toLowerCase().includes(searchLower);
    }).length;

    acc[cat] = {
      total: symbolsInCat.length,
      matching: matchingSearch
    };
    return acc;
  }, {} as Record<string, { total: number; matching: number }>);

  // Reset or adjust focused index when filters change
  useEffect(() => {
    setFocusedIndex(0);
  }, [selectedCategory, searchQuery]);

  // Handle keyboard arrow keys + Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      // Skip when typing in the search bar (unless they press ArrowDown, which transfers focus to start navigating)
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        if (e.key === "ArrowDown" && filteredSymbols.length > 0) {
          const firstId = filteredSymbols[0].id;
          const cardEl = document.getElementById(`symbol-card-${firstId}`);
          if (cardEl) {
            cardEl.focus();
            setFocusedIndex(0);
            e.preventDefault();
          }
        }
        return;
      }

      if (filteredSymbols.length === 0) return;

      let nextIndex = focusedIndex;
      let handled = false;
      const columns = 2; // Assuming average responsive columns in catalog container

      switch (e.key) {
        case "ArrowLeft":
          nextIndex = focusedIndex - 1;
          handled = true;
          break;
        case "ArrowRight":
          nextIndex = focusedIndex + 1;
          handled = true;
          break;
        case "ArrowUp":
          nextIndex = focusedIndex - columns;
          handled = true;
          break;
        case "ArrowDown":
          nextIndex = focusedIndex + columns;
          handled = true;
          break;
        case "Enter":
        case " ":
          const matchSym = filteredSymbols[focusedIndex];
          if (matchSym) {
            setInspectedSymbol(matchSym);
            setIsDetailModalOpen(true);
            if (onTrackAction) onTrackAction(`keyboard_modal_${matchSym.id}`);
          }
          handled = true;
          break;
        default:
          break;
      }

      if (handled) {
        if (nextIndex < 0) {
          nextIndex = 0;
        } else if (nextIndex >= filteredSymbols.length) {
          nextIndex = filteredSymbols.length - 1;
        }

        setFocusedIndex(nextIndex);
        e.preventDefault();

        const sym = filteredSymbols[nextIndex];
        if (sym) {
          setInspectedSymbol(sym);
          const nextCard = document.getElementById(`symbol-card-${sym.id}`);
          if (nextCard) {
            nextCard.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [filteredSymbols, focusedIndex]);

  const handleCopyAscii = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onTrackAction) onTrackAction(`copy_ascii_${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({
      x: e.clientX + 16,
      y: e.clientY + 16
    });
  };

  // Convert SVG string to Canvas, draw high-resolution PNG with background report grids
  const exportSymbolAsPNG = (symbol: ElectricalSymbol) => {
    try {
      setDownloadingId(symbol.id);
      const svgString = symbol.svgMarkup;
      
      const img = new Image();
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setDownloadingId(null);
        return;
      }
      
      // Slate blue dark workspace canvas looks professional
      ctx.fillStyle = "#0f172a"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw subtle engineering workspace grid coordinates
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Draw standard metadata details
      ctx.fillStyle = "#64748b"; 
      ctx.font = "bold 13px monospace";
      ctx.fillText("ELECTRO COMPLIANCE CORE DIRECTIVE", 32, 40);
      
      ctx.fillStyle = "#94a3b8"; 
      ctx.font = "bold 11px monospace";
      ctx.fillText(`STANDARD: ${symbol.standards}`, 32, 65);
      ctx.fillText(`DESIGNATION CLASS: ${symbol.designator}`, 32, 85);
      ctx.fillText(`CATEGORY: ${symbol.category.toUpperCase()}`, 32, 105);
      
      // Draw name header
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(symbol.name, 32, 435);
      
      // Multiline wrapped caption layout
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px sans-serif";
      const descWords = symbol.description.split(" ");
      let line = "";
      let yPos = 465;
      for (let i = 0; i < descWords.length; i++) {
        let testLine = line + descWords[i] + " ";
        if (testLine.length > 55) {
          ctx.fillText(line, 32, yPos);
          line = descWords[i] + " ";
          yPos += 18;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 32, yPos);
      
      // Clean up markup class definitions for strict Canvas rendering compat
      let polishedSvg = svgString;
      polishedSvg = polishedSvg.replace(/class="[^"]*"/g, ""); 
      
      let strokeColor = "#f59e0b"; // default golden layout core
      if (symbol.id === "circuit-breaker") strokeColor = "#10b981";
      if (symbol.id === "safety-fuse") strokeColor = "#ef4444";
      if (symbol.id === "earth-ground") strokeColor = "#0ea5e9";
      if (symbol.id === "induction-motor") strokeColor = "#14b8a6";
      if (symbol.id === "magnetic-contactor") strokeColor = "#a855f7";
      if (symbol.id === "disconnector-switch") strokeColor = "#f97316";
      if (symbol.id === "control-relay") strokeColor = "#6366f1";
      
      if (!polishedSvg.includes("stroke=")) {
        polishedSvg = polishedSvg.replace("<svg", `<svg stroke="${strokeColor}"`);
      } else {
        polishedSvg = polishedSvg.replace(/stroke="[^"]*"/g, `stroke="${strokeColor}"`);
      }
      polishedSvg = polishedSvg.replace("<svg", `<svg style="color: ${strokeColor}; fill: none;"`);
      
      const svgBlob = new Blob([polishedSvg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const size = 200;
        const xOffset = (512 - size) / 2;
        const yOffset = (512 - size) / 2 - 20;
        
        ctx.drawImage(img, xOffset, yOffset, size, size);
        URL.revokeObjectURL(url);
        
        const link = document.createElement("a");
        link.download = `symbol_blueprint_${symbol.id}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        
        setDownloadingId(null);
        if (onTrackAction) onTrackAction(`download_success_${symbol.id}`);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setDownloadingId(null);
      };
      
      img.src = url;
    } catch (error) {
      console.error("Failed to export symbol card:", error);
      setDownloadingId(null);
    }
  };

  // Convert the full active grid set into a unified report sheet
  const exportGridAsPNG = () => {
    try {
      if (filteredSymbols.length === 0) return;
      setExportingGrid(true);
      
      const symbolCount = filteredSymbols.length;
      const cols = Math.min(3, symbolCount);
      const rows = Math.ceil(symbolCount / cols);
      
      const itemWidth = 320;
      const itemHeight = 350;
      const padding = 24;
      
      const canvas = document.createElement("canvas");
      canvas.width = cols * itemWidth + padding * (cols + 1);
      canvas.height = rows * itemHeight + padding * (rows + 1) + 120;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setExportingGrid(false);
        return;
      }
      
      // Background Engineering workspace block
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Blueprint subtle grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Title Block layout
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("ELECTRO COMPLIANCE BLUEPRINTS CATALOG", padding, 48);
      
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 11px monospace";
      ctx.fillText(`FILTER: ${selectedCategory.toUpperCase()} COMPLIANCE NODES  |  TOTAL QUANTITY: ${symbolCount} ACTIVE SYMBOLS`, padding, 75);
      
      ctx.fillStyle = "#64748b";
      ctx.font = "10px sans-serif";
      ctx.fillText("Standards reference sheets verified aligned under NEC Article 110, 240, 250, and 430 parameters.", padding, 92);
      
      let imagesLoaded = 0;
      const totalImages = symbolCount;
      
      const checkAndDownloadGrid = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
          const link = document.createElement("a");
          link.download = `electrical_blueprint_catalog_${selectedCategory.toLowerCase()}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          setExportingGrid(false);
          if (onTrackAction) onTrackAction("download_grid_success");
        }
      };
      
      filteredSymbols.forEach((symbol, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const x = padding + col * (itemWidth + padding);
        const y = 115 + padding + row * (itemHeight + padding);
        
        // Draw card background area
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x, y, itemWidth, itemHeight);
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, itemWidth, itemHeight);
        
        // Render labels
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 10px monospace";
        ctx.fillText(`CLASS DESIGNATOR: ${symbol.designator}`, x + 16, y + 28);
        
        // Right header
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 9px monospace";
        const standardBrief = symbol.standards.split(" / ")[0];
        ctx.fillText(standardBrief, x + itemWidth - ctx.measureText(standardBrief).width - 16, y + 28);
        
        // Category tag
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 8px sans-serif";
        ctx.fillText(symbol.category.toUpperCase(), x + 16, y + 242);
        
        // Title
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(symbol.name, x + 16, y + 262);
        
        // Multi-line description flow
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px sans-serif";
        const descWords = symbol.description.split(" ");
        let cardLine = "";
        let cardY = y + 284;
        for (let w = 0; w < descWords.length; w++) {
          let test = cardLine + descWords[w] + " ";
          if (test.length > 44) {
            ctx.fillText(cardLine, x + 16, cardY);
            cardLine = descWords[w] + " ";
            cardY += 14;
          } else {
            cardLine = test;
          }
        }
        ctx.fillText(cardLine, x + 16, cardY);
        
        // Format layout SVG graphic
        let polishedSvg = symbol.svgMarkup;
        polishedSvg = polishedSvg.replace(/class="[^"]*"/g, ""); 
        
        let strokeColor = "#f59e0b";
        if (symbol.id === "circuit-breaker") strokeColor = "#10b981";
        if (symbol.id === "safety-fuse") strokeColor = "#ef4444";
        if (symbol.id === "earth-ground") strokeColor = "#0ea5e9";
        if (symbol.id === "induction-motor") strokeColor = "#14b8a6";
        if (symbol.id === "magnetic-contactor") strokeColor = "#a855f7";
        if (symbol.id === "disconnector-switch") strokeColor = "#f97316";
        if (symbol.id === "control-relay") strokeColor = "#6366f1";
        
        if (!polishedSvg.includes("stroke=")) {
          polishedSvg = polishedSvg.replace("<svg", `<svg stroke="${strokeColor}"`);
        } else {
          polishedSvg = polishedSvg.replace(/stroke="[^"]*"/g, `stroke="${strokeColor}"`);
        }
        polishedSvg = polishedSvg.replace("<svg", `<svg style="color: ${strokeColor}; fill: none;"`);
        
        const svgBlob = new Blob([polishedSvg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        
        img.onload = () => {
          const graphicSize = 130;
          ctx.drawImage(img, x + (itemWidth - graphicSize) / 2, y + 55, graphicSize, graphicSize);
          URL.revokeObjectURL(url);
          checkAndDownloadGrid();
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          checkAndDownloadGrid();
        };
        
        img.src = url;
      });
    } catch (err) {
      console.error("Failed to export full filtered symbols grid sheet:", err);
      setExportingGrid(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Visual Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-6">
          <Workflow className="w-96 h-96 text-amber-500" />
        </div>
        
        <div className="relative z-10 max-w-4xl space-y-2">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block font-sans">
            Standard Reference &amp; Schematic Blueprint Database
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-amber-500" />
            Unified Electrical Symbols Directory
          </h2>
          <p className="text-xs md:text-sm text-slate-350 leading-relaxed font-semibold">
            Browse standardized schematic icons (IEC 60617 &amp; IEEE 315) mapped directly to professional full-scale code requirements. Undergo safety compliance audits, trace operational formulas, or review detailed <strong>NEC-compliant</strong> field rules by hovering over any schematic node.
          </p>
        </div>
      </div>

      {/* Main Grid and Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-6 items-start">
        
        {/* Persistent Legend Sidebar: Displays total and dynamic counts of symbols by category */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 sticky top-6">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-0.5">
                ANALYSIS METRICS
              </span>
              <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-1.5 font-sans">
                <Layers className="w-4 h-4 text-amber-500" />
                Subsystem Legend
              </h3>
            </div>

            {/* List of categories with dynamic counts */}
            <div className="space-y-2.5">
              {categories.map((cat) => {
                const colors = {
                  "All": { text: "text-slate-500 dark:text-slate-400", activeText: "text-slate-900 dark:text-slate-100" },
                  "Transformers": { text: "text-amber-600 dark:text-amber-400/90", activeText: "text-amber-500" },
                  "Protections": { text: "text-emerald-600 dark:text-emerald-400/90", activeText: "text-emerald-500" },
                  "Motors & Loads": { text: "text-rose-600 dark:text-rose-450", activeText: "text-rose-500" },
                  "Controls & Grounding": { text: "text-sky-600 dark:text-sky-400/90", activeText: "text-sky-450" },
                }[cat] || { text: "text-slate-500", activeText: "text-slate-900" };

                const countData = categoryCounts[cat] || { total: 0, matching: 0 };
                const percent = countData.total > 0 ? (countData.matching / countData.total) * 100 : 0;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (onTrackAction) onTrackAction(`legend_select_${cat}`);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-200 outline-none flex flex-col gap-1.5 cursor-pointer ${
                      isSelected 
                        ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 shadow-sm" 
                        : "border-slate-100 dark:border-slate-800 bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-900/40 hover:border-slate-200 dark:hover:border-slate-755"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[11px] font-black tracking-tight ${isSelected ? colors.activeText : colors.text}`}>
                        {cat}
                      </span>
                      <span className="text-4xs font-mono font-black text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded shrink-0">
                        {countData.matching} / {countData.total}
                      </span>
                    </div>

                    {/* Progress Bar of filter match */}
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-350 ${
                          isSelected ? "bg-amber-500" : "bg-slate-400/40"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center w-full text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <span>{Math.round(percent)}% matched</span>
                      {isSelected && <span className="text-amber-500 text-[8px] font-black">ACTIVE</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100/80 dark:border-slate-800">
              💡 <strong>Interactive Legend:</strong> Metrics calculate symbols matching the real-time query. Select any subsystem category here or above to filter cards.
            </div>
          </div>
        </div>

        {/* Left Column: List with Filters and Search Bar */}
        <div className="lg:col-span-8 xl:col-span-6 space-y-6 animate-fade-in">
          
          {/* Controls Bar Card */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-4">
            
            {/* Search Input bar */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-amber-500" />
                  Real-Time Schematic and Code Search
                </label>
                <span className="text-4xs font-black font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {filteredSymbols.length} of {ELECTRICAL_SYMBOLS.length} Matches
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (onTrackAction) onTrackAction("symbols_search");
                  }}
                  placeholder="Search schemas by name or description (e.g., 'fault', 'transformer', 'switch', 'motor')..."
                  className="w-full text-xs pl-10 pr-4 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-805 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Category selection and Report Export actions */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Filter by Functional Subsystem
                </label>

                {/* Grid PNG Download trigger */}
                <button
                  type="button"
                  onClick={exportGridAsPNG}
                  disabled={exportingGrid || filteredSymbols.length === 0}
                  className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 text-white dark:text-slate-900 rounded-lg text-4xs font-black uppercase cursor-pointer transition outline-none shadow-md shadow-emerald-500/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  {exportingGrid ? "Exporting PNG..." : "Download Grid as PNG"}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (onTrackAction) onTrackAction(`filter_category_${cat}`);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-2xs font-extrabold border transition-all cursor-pointer outline-none ${
                      selectedCategory === cat
                        ? "bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-black"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard Guide Note */}
            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[8px] tracking-normal">Tab</span>
              <span>or</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[8px] tracking-normal">← ↑ ↓ → Arrow Keys</span>
              <span>to navigate  |  </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[8px] tracking-normal flex items-center justify-center">Enter</span>
              <span>to open Popup</span>
            </div>

          </div>


          {/* Grid View */}
          {filteredSymbols.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredSymbols.map((symbol, index) => {
                const isActiveInspector = inspectedSymbol?.id === symbol.id;
                const isFocused = focusedIndex === index;
                
                return (
                  <motion.div
                    key={symbol.id}
                    id={`symbol-card-${symbol.id}`}
                    tabIndex={0}
                    onFocus={() => setFocusedIndex(index)}
                    onMouseEnter={() => setHoveredSymbolId(symbol.id)}
                    onMouseLeave={() => setHoveredSymbolId(null)}
                    onMouseMove={handleMouseMove}
                    onClick={() => {
                      setInspectedSymbol(symbol);
                      if (onTrackAction) onTrackAction(`inspect_symbol_${symbol.id}`);
                    }}
                    className={`bg-white dark:bg-slate-850 p-4 rounded-2xl border transition-all duration-305 flex flex-col justify-between cursor-pointer relative group outline-none ${
                      isActiveInspector
                        ? "ring-2 ring-amber-500 border-transparent shadow-md"
                        : isFocused
                        ? "ring-2 ring-amber-500/50 border-amber-500/40 dark:border-amber-450/45 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-amber-500/30 dark:hover:border-amber-400/30 hover:shadow-md"
                    }`}
                    whileHover={{ y: -3 }}
                  >
                    
                    {/* Upper block */}
                    <div className="space-y-3">
                      
                      {/* Standard Tag and Designator */}
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 font-extrabold leading-none">
                          Designator: {symbol.designator}
                        </span>
                        <span className="text-[8px] font-black uppercase text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 leading-none shrink-0">
                          {symbol.standards}
                        </span>
                      </div>

                      {/* Schematic SVG Area */}
                      <div className="w-full h-24 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-150 dark:border-slate-900 flex items-center justify-center p-4 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-950/90 relative">
                        {symbol.id === "substation-tx" && (
                          <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: symbol.svgMarkup }} />
                        )}
                        {symbol.id === "circuit-breaker" && (
                          <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: symbol.svgMarkup }} />
                        )}
                        {symbol.id === "safety-fuse" && (
                          <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: symbol.svgMarkup }} />
                        )}
                        {symbol.id === "earth-ground" && (
                          <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: symbol.svgMarkup }} />
                        )}
                        {symbol.id === "induction-motor" && (
                          <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: symbol.svgMarkup }} />
                        )}
                        {symbol.id === "magnetic-contactor" && (
                          <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: symbol.svgMarkup }} />
                        )}
                        {symbol.id === "disconnector-switch" && (
                          <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: symbol.svgMarkup }} />
                        )}
                        {symbol.id === "control-relay" && (
                          <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: symbol.svgMarkup }} />
                        )}
                        {symbol.id === "ac-generator" && (
                          <div className="w-16 h-16 text-amber-500" dangerouslySetInnerHTML={{ __html: symbol.svgMarkup }} />
                        )}

                        <span className="absolute right-2.5 bottom-2.5 p-1 bg-white/80 dark:bg-slate-900/80 rounded-md border border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-amber-500" />
                        </span>
                      </div>

                      {/* Descriptive Core */}
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider leading-none block">
                          {symbol.category}
                        </span>
                        <h4 className="text-xs font-black text-slate-850 dark:text-white leading-tight">
                          {symbol.name}
                        </h4>
                        <p className="text-3xs text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                          {symbol.description}
                        </p>
                      </div>

                    </div>

                    {/* Bottom compliance trigger bar */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-3 flex items-center justify-between text-4xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      <span>Standards Verified</span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-450 group-hover:text-amber-500 transition-colors">
                        NEC Code Audit <Info className="w-3 h-3 text-amber-500" />
                      </span>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-350 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-black text-slate-850 dark:text-white uppercase">
                No standard symbols match query
              </h4>
              <p className="text-xs text-slate-455 dark:text-slate-400 max-w-md mx-auto">
                No matching systems found within "{selectedCategory}" subgroup. Try refining your text search query or select another major functional subsystem category.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="mt-2 text-2xs font-extrabold text-amber-500 hover:text-amber-600 transition"
              >
                Reset Filter Parameters
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Code Inspector Sandbox Dashboard */}
        <div className="lg:col-span-12 xl:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-5 sticky top-6">
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-0.5">
                ELECTRO COMPLIANCE CORE
              </span>
              <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-500" />
                Live Engineering Schema Inspector
              </h3>
            </div>

            {inspectedSymbol ? (
              <div className="space-y-4 animate-fade-in">
                
                {/* Meta details */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {inspectedSymbol.name}
                    </h4>
                    <span className="text-3xs font-semibold text-slate-400">
                      Class Designator: {inspectedSymbol.designator}
                    </span>
                  </div>
                  <span className="text-4xs font-black uppercase text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-550/10 shrink-0">
                    {inspectedSymbol.category}
                  </span>
                </div>

                {/* SVG Visual Zoom card */}
                <div className="h-32 bg-slate-100/50 dark:bg-slate-950/60 rounded-xl border border-slate-150 dark:border-slate-900 flex items-center justify-center p-6 relative group overflow-hidden">
                  <div className="w-20 h-20 text-slate-800 dark:text-slate-150 transition-transform duration-500 hover:scale-110">
                    {inspectedSymbol.id === "substation-tx" && (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "circuit-breaker" && (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "safety-fuse" && (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "earth-ground" && (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "induction-motor" && (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "magnetic-contactor" && (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "disconnector-switch" && (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "control-relay" && (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "ac-generator" && (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                  </div>
                  
                  {/* Floating badge */}
                  <span className="absolute top-2.5 left-2.5 bg-slate-900 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider">
                    {inspectedSymbol.standards}
                  </span>
                </div>

                {/* Technical Usage Brief */}
                <div className="space-y-1">
                  <span className="text-4xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                    Core Engineering Function
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal font-semibold">
                    {inspectedSymbol.description}
                  </p>
                </div>

                {/* DETAILED COMPLIANCE TOOLTIP EXPLANATION (NEC ALIGNED) */}
                <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-600/20 rounded-xl p-3.5 space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center gap-1.5 border-b border-amber-500/15 pb-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      NEC / IEC Code Compliance Directives
                    </span>
                  </div>
                  <p className="text-3xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                    {inspectedSymbol.detailedUsage}
                  </p>
                </div>

                {/* Export Control Core Actions */}
                <div className="space-y-2 pt-2">
                  <span className="text-4xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                    Export Schema Asset Tools
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => exportSymbolAsPNG(inspectedSymbol)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 font-extrabold text-slate-950 rounded-xl text-xs cursor-pointer transition outline-none shadow-md shadow-amber-500/10"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {downloadingId === inspectedSymbol.id ? "Exporting..." : "Download PNG"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyAscii(inspectedSymbol.asciiRepresentation, inspectedSymbol.id)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-amber-500/30 rounded-xl text-xs font-black uppercase cursor-pointer transition outline-none"
                    >
                      {copiedId === inspectedSymbol.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate text-emerald-500 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Copy ASCII</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ASCII Diagram representation */}
                <div className="space-y-2">
                  <span className="text-4xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                    Single-Line Blueprints ASCII Representation
                  </span>
                  <pre className="text-3xs md:text-2xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-slate-750 dark:text-emerald-400 font-mono whitespace-pre leading-relaxed border border-slate-205 dark:border-slate-800 font-semibold overflow-x-auto select-all">
                    {inspectedSymbol.asciiRepresentation.trim()}
                  </pre>
                </div>

              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 dark:text-slate-500 italic text-2xs">
                Select any electrical node from the grid to inspect detailed NEC blueprints, designators, and code requirements.
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Dynamic Detail Popup Modal */}
      <AnimatePresence>
        {isDetailModalOpen && inspectedSymbol && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 md:p-8 max-w-2xl w-full relative z-10 shadow-2xl text-left space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-1">
                    EXPERT STANDARDS DETAIL VIEW
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-amber-500" />
                    {inspectedSymbol.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-mono text-slate-400 font-extrabold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      CLASS: {inspectedSymbol.designator}
                    </span>
                    <span className="text-[9px] font-mono text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      STANDARD: {inspectedSymbol.standards}
                    </span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer font-bold text-xs outline-none border-none"
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Grid content inside modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual rendering block */}
                <div className="h-44 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-6 relative overflow-hidden group">
                  <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-700 font-bold">GRID SYNC [A-1]</div>
                  <div className="absolute bottom-2 right-2 text-[8px] font-mono text-slate-700 font-bold">512px ZOOM</div>
                  
                  <div className="w-24 h-24 text-amber-500">
                    {inspectedSymbol.id === "substation-tx" && (
                      <div className="w-full h-full text-amber-500" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "circuit-breaker" && (
                      <div className="w-full h-full text-amber-500" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "safety-fuse" && (
                      <div className="w-full h-full text-amber-500" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "earth-ground" && (
                      <div className="w-full h-full text-amber-500" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "induction-motor" && (
                      <div className="w-full h-full text-amber-500" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "magnetic-contactor" && (
                      <div className="w-full h-full text-amber-500" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "disconnector-switch" && (
                      <div className="w-full h-full text-amber-500" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "control-relay" && (
                      <div className="w-full h-full text-amber-500" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                    {inspectedSymbol.id === "ac-generator" && (
                      <div className="w-full h-full text-amber-500" dangerouslySetInnerHTML={{ __html: inspectedSymbol.svgMarkup }} />
                    )}
                  </div>
                </div>

                {/* Info and action panel */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Description &amp; Operation
                    </span>
                    <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                      {inspectedSymbol.description}
                    </p>
                    <span className="inline-block text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded mt-1">
                      {inspectedSymbol.category}
                    </span>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => exportSymbolAsPNG(inspectedSymbol)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 font-extrabold text-slate-950 rounded-xl text-xs cursor-pointer transition outline-none shadow-md shadow-amber-500/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {downloadingId === inspectedSymbol.id ? "Exporting..." : "Download PNG"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleCopyAscii(inspectedSymbol.asciiRepresentation, inspectedSymbol.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-black uppercase cursor-pointer transition outline-none"
                    >
                      {copiedId === inspectedSymbol.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy ASCII</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Compliance section */}
              <div className="p-4 bg-amber-550/5 border border-amber-500/15 rounded-xl space-y-2">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  NEC National Electrical Code Specifications
                </span>
                <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                  {inspectedSymbol.detailedUsage}
                </p>
              </div>

              {/* ASCII Diagram representation */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  Cabling Schematic Diagram ASCII String
                </span>
                <pre className="text-3xs md:text-2xs p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono whitespace-pre leading-relaxed border border-slate-850 font-semibold overflow-x-auto select-all">
                  {inspectedSymbol.asciiRepresentation.trim()}
                </pre>
              </div>

              {/* Keyboard helper hints */}
              <div className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest pt-2 border-t border-slate-800/60">
                💡 Tip: Use Arrow Keys to navigate, and press Escape or click close to dismiss.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED FRAMER-MOTION CURSOR-FOLLOWING COMPLIANCE TOOLTIP ON HOVER */}
      <AnimatePresence>
        {hoveredSymbolId && (
          (() => {
            const sym = ELECTRICAL_SYMBOLS.find(s => s.id === hoveredSymbolId);
            if (!sym) return null;
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: "fixed",
                  left: tooltipPos.x,
                  top: tooltipPos.y,
                  zIndex: 9999,
                  pointerEvents: "none"
                }}
                className="max-w-xs md:max-w-sm bg-slate-950 dark:bg-slate-900 border border-amber-500/30 text-white rounded-xl p-3.5 shadow-2xl space-y-2 text-left"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-3xs font-black uppercase text-amber-400 tracking-wider">
                      NEC Usage Guidelines
                    </span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-450 uppercase font-mono px-1 rounded bg-white/5">
                    {sym.standards.split(" / ")[0]}
                  </span>
                </div>
                
                <h5 className="text-2xs font-extrabold text-amber-200">
                  {sym.name} ({sym.designator})
                </h5>
                
                <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
                  {sym.detailedUsage}
                </p>
                
                <div className="text-[8px] text-slate-500 font-black tracking-widest text-right uppercase pt-0.5 border-t border-white/5">
                  Click card to inspect
                </div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

    </div>
  );
}
