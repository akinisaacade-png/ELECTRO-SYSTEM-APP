import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Download, 
  Settings2, 
  Maximize2, 
  Minimize2, 
  HelpCircle, 
  Sliders, 
  Server,
  Zap,
  Tag,
  Copy,
  Plus,
  Trash2,
  FolderTree,
  Check,
  Building,
  RotateCcw,
  Edit2,
  Eye,
  Settings
} from "lucide-react";
import { BulkLoadEntry, CABLE_TABLES } from "../types";

interface CircuitDiagramGeneratorProps {
  bulkLoads: BulkLoadEntry[];
  bulkLoadsCalculations: {
    totalKw: number;
    totalKva: number;
    totalPf: number;
    baseCurrentA: number;
    designCurrentA: number;
    feederVolt: number;
    feederPhases: number;
  };
  activeRegion: string;
  isImperial: boolean;
  onTrackAction?: (actionName: string) => void;
  triggerToast?: (msg: string) => void;
}

// Tree Data Interfaces
interface TopologySource {
  id: string;
  name: string;
  voltage: string;
  type: "utility" | "generator" | "solar";
}

interface TopologyBranch {
  id: string;
  name: string;
  parent_id: string;
  breaker_rating: string;
}

interface TopologyLoad {
  id: string;
  name: string;
  parent_id: string;
  type: "motor" | "lighting" | "receptacle" | "cooking" | "generic";
  power_kw: number;
  pf: number;
  phases: number;
}

export default function CircuitDiagramGenerator({
  bulkLoads,
  bulkLoadsCalculations,
  activeRegion,
  isImperial,
  onTrackAction,
  triggerToast
}: CircuitDiagramGeneratorProps) {
  // Mode Selection: "preset" (fully custom tree editing) vs "aggregates" (direct list from active bulk sizer) vs JSON CAD
  const [activeTab, setActiveTab] = useState<"tree" | "direct" | "json-cad">("tree");

  // JSON CAD code editor states
  const [jsonInput, setJsonInput] = useState<string>(() => {
    return JSON.stringify({
      sources: [
        {
          id: "src_main",
          name: "Main LV Switchboard",
          voltage: "400 V",
          type: "utility"
        }
      ],
      branches: [
        {
          id: "br_panel_1",
          name: "Panel DB-1",
          parent_id: "src_main",
          breaker_rating: "125 A"
        },
        {
          id: "br_panel_2",
          name: "Panel DB-2",
          parent_id: "src_main",
          breaker_rating: "160 A"
        }
      ],
      loads: [
        {
          id: "ld_lighting_1",
          name: "Lighting Circuit L1",
          parent_id: "br_panel_1",
          type: "lighting",
          power_kw: 5.2,
          pf: 0.95,
          phases: 1
        },
        {
          id: "ld_motor_1",
          name: "Motor M1",
          parent_id: "br_panel_2",
          type: "motor",
          power_kw: 11.0,
          pf: 0.85,
          phases: 3
        },
        {
          id: "ld_generic_1",
          name: "Heavy Compressor L3",
          parent_id: "br_panel_2",
          type: "generic",
          power_kw: 8.5,
          pf: 0.88,
          phases: 3
        }
      ]
    }, null, 2);
  });
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.sources || !Array.isArray(parsed.sources)) throw new Error("Missing 'sources' array.");
      if (!parsed.branches || !Array.isArray(parsed.branches)) throw new Error("Missing 'branches' array.");
      if (!parsed.loads || !Array.isArray(parsed.loads)) throw new Error("Missing 'loads' array.");
      
      const newSources = parsed.sources.map((s: any, idx: number) => ({
        id: s.id || `src_${idx}`,
        name: s.name || `Source ${idx + 1}`,
        voltage: s.voltage || "400 V",
        type: s.type === "utility" || s.type === "generator" || s.type === "solar" ? s.type : "utility"
      }));

      const newBranches = parsed.branches.map((b: any, idx: number) => ({
        id: b.id || `br_${idx}`,
        name: b.name || `Panel ${idx + 1}`,
        parent_id: b.parent_id || newSources[0]?.id || "src_main",
        breaker_rating: b.breaker_rating || "100 A"
      }));

      const newLoads = parsed.loads.map((l: any, idx: number) => ({
        id: l.id || `ld_${idx}`,
        name: l.name || `Load ${idx + 1}`,
        parent_id: l.parent_id || newBranches[0]?.id || "br_panel_1",
        type: l.type === "motor" || l.type === "lighting" || l.type === "cooking" || l.type === "receptacle" || l.type === "generic" ? l.type : "generic",
        power_kw: typeof l.power_kw === "number" ? l.power_kw : 5.0,
        pf: typeof l.pf === "number" ? l.pf : 0.9,
        phases: typeof l.phases === "number" ? l.phases : 3
      }));

      setSources(newSources);
      setBranches(newBranches);
      setLoads(newLoads);
      setJsonError(null);
      triggerToast?.("JSON CAD configuration successfully compiled & loaded into SVG viewport! ✓");
      onTrackAction?.("compile_json_sld");
      setActiveTab("tree");
    } catch (err: any) {
      setJsonError(err?.message || "Invalid JSON syntax.");
      triggerToast?.("Failed to parse JSON: " + (err?.message || "Syntax Error"));
    }
  };

  const handleExportPNG = () => {
    try {
      const svgId = activeTab === "tree" ? "tree-sld-diagram-svg" : "direct-sld-diagram-svg";
      const svgElement = document.getElementById(svgId) as unknown as SVGSVGElement | null;
      if (!svgElement) {
        triggerToast?.("SVG diagram element not found in current viewport!");
        return;
      }

      // Get SVG dimensions
      const svgWidth = svgElement.width?.baseVal?.value || svgElement.viewBox?.baseVal?.width || 900;
      const svgHeight = svgElement.height?.baseVal?.value || svgElement.viewBox?.baseVal?.height || 550;

      // Create a cloned copy of the SVG to manipulate style properties if needed
      const clonedSvg = svgElement.cloneNode(true) as unknown as SVGSVGElement;
      
      // Force a solid background so it isn't transparent (high quality for reports)
      // Check if light or dark theme is active
      const isDarkMode = document.documentElement.classList.contains("dark");
      clonedSvg.style.backgroundColor = isDarkMode ? "#0b1329" : "#f8fafc";
      
      const serializer = new XMLSerializer();
      let svgText = serializer.serializeToString(clonedSvg);
      
      // Clean up namespace issues if not present
      if (!svgText.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        svgText = svgText.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      // Convert SVG text to a Data URL
      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const blobURL = URL.createObjectURL(svgBlob);

      // Create high-resolution Canvas
      const scaleFactor = 3; // 3x scale makes it crisp and high-resolution
      const canvas = document.createElement("canvas");
      canvas.width = svgWidth * scaleFactor;
      canvas.height = svgHeight * scaleFactor;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        triggerToast?.("Failed to instantiate 2D rendering canvas context.");
        return;
      }

      // Clear with background color
      ctx.fillStyle = isDarkMode ? "#0f172a" : "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      img.onload = () => {
        // Draw image onto high resolution canvas scaled
        ctx.drawImage(img, 0, 0, svgWidth * scaleFactor, svgHeight * scaleFactor);
        
        // Convert to PNG data URL
        try {
          const pngURL = canvas.toDataURL("image/png");
          
          // Trigger file download
          const downloadLink = document.createElement("a");
          const timestamp = new Date().toISOString().slice(0, 10);
          downloadLink.href = pngURL;
          downloadLink.download = `electrical-single-line-diagram-${activeTab}-${timestamp}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          URL.revokeObjectURL(blobURL);
          triggerToast?.("High-resolution report PNG downloaded successfully! ✓");
          onTrackAction?.("export_diagram_png");
        } catch (downloadErr) {
          console.error("Direct canvas export failed, attempting direct SVG/Blob fallback", downloadErr);
          // Fallback to SVG URL download
          const downloadLink = document.createElement("a");
          downloadLink.href = blobURL;
          downloadLink.download = `electrical-single-line-diagram-${activeTab}.svg`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          triggerToast?.("Security policy restricted PNG generation, SVG vector files saved instead. ✓");
        }
      };
      
      img.onerror = (err) => {
        console.error("Error loading SVG image for canvas render", err);
        triggerToast?.("Error rendering diagram to canvas.");
      };

      img.src = blobURL;
    } catch (err: any) {
      console.error("Export handler crashed", err);
      triggerToast?.("Failed to export PNG: " + (err?.message || err));
    }
  };
  
  // Custom Tree Topology States initialized with user spec
  const [sources, setSources] = useState<TopologySource[]>([
    {
      id: "src_main",
      name: "Main LV Switchboard",
      voltage: "415 V",
      type: "utility"
    }
  ]);

  const [branches, setBranches] = useState<TopologyBranch[]>([
    {
      id: "br_panel_1",
      name: "Panel DB-1 (Light Services)",
      parent_id: "src_main",
      breaker_rating: "125 A"
    },
    {
      id: "br_panel_2",
      name: "Panel DB-2 (Power Plant)",
      parent_id: "src_main",
      breaker_rating: "160 A"
    }
  ]);

  const [loads, setLoads] = useState<TopologyLoad[]>([
    {
      id: "ld_lighting_1",
      name: "Lighting Circuit L1",
      parent_id: "br_panel_1",
      type: "lighting",
      power_kw: 5.2,
      pf: 0.95,
      phases: 1
    },
    {
      id: "ld_motor_1",
      name: "Industrial Chiller M1",
      parent_id: "br_panel_2",
      type: "motor",
      power_kw: 11.0,
      pf: 0.85,
      phases: 3
    },
    {
      id: "ld_cooking_2",
      name: "Kitchen Ranges Range-A",
      parent_id: "br_panel_1",
      type: "cooking",
      power_kw: 14.5,
      pf: 1.0,
      phases: 3
    }
  ]);

  // Diagram rendering settings
  const [showWireLabels, setShowWireLabels] = useState(true);
  const [showBreakerRatings, setShowBreakerRatings] = useState(true);
  const [showLoadValues, setShowLoadValues] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Edit/Create Modal states for tree sizer
  const [showEditor, setShowEditor] = useState(false);
  const [editorTarget, setEditorTarget] = useState<"source" | "branch" | "load">("source");
  const [editMode, setEditMode] = useState<"create" | "update">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Inputs
  const [formSourceName, setFormSourceName] = useState("");
  const [formSourceVolt, setFormSourceVolt] = useState("415 V");
  const [formSourceType, setFormSourceType] = useState<"utility" | "generator" | "solar">("utility");

  const [formBranchName, setFormBranchName] = useState("");
  const [formBranchParent, setFormBranchParent] = useState("src_main");
  const [formBranchBreaker, setFormBranchBreaker] = useState("100 A");

  const [formLoadName, setFormLoadName] = useState("");
  const [formLoadParent, setFormLoadParent] = useState("br_panel_1");
  const [formLoadType, setFormLoadType] = useState<"motor" | "lighting" | "receptacle" | "cooking" | "generic">("lighting");
  const [formLoadKw, setFormLoadKw] = useState<number>(5.0);
  const [formLoadPf, setFormLoadPf] = useState<number>(0.90);
  const [formLoadPhases, setFormLoadPhases] = useState<number>(3);

  // Helper: Sizing tables
  const selectCable = (currentA: number) => {
    const table = isImperial ? CABLE_TABLES.awg : CABLE_TABLES.metric;
    const safetyDesignCurrent = currentA * 1.25;
    const match = table.find((c) => c.cap >= safetyDesignCurrent);
    return match || table[table.length - 1];
  };

  const getStandardBreaker = (currentA: number) => {
    const needed = currentA * 1.25;
    if (needed <= 15) return 15;
    if (needed <= 20) return 20;
    if (needed <= 30) return 30;
    if (needed <= 40) return 40;
    if (needed <= 50) return 50;
    if (needed <= 60) return 60;
    if (needed <= 70) return 70;
    if (needed <= 80) return 80;
    if (needed <= 90) return 90;
    if (needed <= 100) return 100;
    if (needed <= 125) return 125;
    if (needed <= 150) return 150;
    if (needed <= 175) return 175;
    if (needed <= 200) return 200;
    if (needed <= 225) return 225;
    if (needed <= 250) return 250;
    return Math.ceil(needed / 50) * 50;
  };

  // Helper calculation for currents in 3-phase and 1-phase configurations
  const calculateCurrentA = (kw: number, pf: number, phases: number, volt: number) => {
    if (pf <= 0) pf = 0.8;
    if (phases === 3) {
      return (kw * 1000) / (Math.sqrt(3) * volt * pf);
    }
    return (kw * 1000) / (volt * pf);
  };

  // Reset Tree data to clean defaults
  const resetTreeToDefaults = () => {
    setSources([
      { id: "src_main", name: "Main LV Switchboard", voltage: "415 V", type: "utility" }
    ]);
    setBranches([
      { id: "br_panel_1", name: "Panel DB-1 (Light Services)", parent_id: "src_main", breaker_rating: "125 A" },
      { id: "br_panel_2", name: "Panel DB-2 (Power Plant)", parent_id: "src_main", breaker_rating: "160 A" }
    ]);
    setLoads([
      { id: "ld_lighting_1", name: "Lighting Circuit L1", parent_id: "br_panel_1", type: "lighting", power_kw: 5.2, pf: 0.95, phases: 1 },
      { id: "ld_motor_1", name: "Industrial Chiller M1", parent_id: "br_panel_2", type: "motor", power_kw: 11.0, pf: 0.85, phases: 3 },
      { id: "ld_cooking_2", name: "Kitchen Ranges Range-A", parent_id: "br_panel_1", type: "cooking", power_kw: 14.5, pf: 1.0, phases: 3 }
    ]);
    triggerToast?.("Project hierarchy layout restored to benchmark standards! ✓");
    onTrackAction?.("reset_tree_diagram");
  };

  // Sync active sizer bulkLoads into the tree drawing dynamically
  const syncBulkSizerLoads = () => {
    if (bulkLoads.length === 0) {
      triggerToast?.("Your bulk load aggregator is empty. Please enter items there first!");
      return;
    }
    
    // Create new branches mapping and link them
    const newLoads: TopologyLoad[] = bulkLoads.map((bl, i) => ({
      id: `bl_ld_${bl.id}`,
      name: bl.name,
      parent_id: i % 2 === 0 ? "br_panel_1" : "br_panel_2",
      type: bl.name.toLowerCase().includes("motor") ? "motor" : "lighting",
      power_kw: bl.kw,
      pf: bl.pf,
      phases: bl.phases
    }));

    setLoads(newLoads);
    triggerToast?.(`Successfully loaded ${bulkLoads.length} active nodes into DB hierarchy!`);
    onTrackAction?.("sync_bulk_diagram");
  };

  // CRUD handlers
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editorTarget === "source") {
      const newSrc: TopologySource = {
        id: editMode === "create" ? `src_${Date.now()}` : (editingId || ""),
        name: formSourceName || "Unnamed Source Grid",
        voltage: formSourceVolt,
        type: formSourceType
      };

      if (editMode === "create") {
        setSources([...sources, newSrc]);
        triggerToast?.("New power system source feeding node injected!");
      } else {
        setSources(sources.map(s => s.id === editingId ? newSrc : s));
        triggerToast?.("Power grid source attributes modified!");
      }
    } else if (editorTarget === "branch") {
      const newBr: TopologyBranch = {
        id: editMode === "create" ? `br_${Date.now()}` : (editingId || ""),
        name: formBranchName || "Unnamed DB Panel",
        parent_id: formBranchParent,
        breaker_rating: formBranchBreaker
      };

      if (editMode === "create") {
        setBranches([...branches, newBr]);
        triggerToast?.("Distribution cabinet panel branch installed! ✓");
      } else {
        setBranches(branches.map(b => b.id === editingId ? newBr : b));
        triggerToast?.("Branch panel specifications upgraded!");
      }
    } else if (editorTarget === "load") {
      const newLd: TopologyLoad = {
        id: editMode === "create" ? `ld_${Date.now()}` : (editingId || ""),
        name: formLoadName || "Unnamed Appliance Load",
        parent_id: formLoadParent,
        type: formLoadType,
        power_kw: Number(formLoadKw) || 1.0,
        pf: Number(formLoadPf) || 0.9,
        phases: Number(formLoadPhases) || 3
      };

      if (editMode === "create") {
        setLoads([...loads, newLd]);
        triggerToast?.("Dynamic branching load attached to bus cabinet.");
      } else {
        setLoads(loads.map(l => l.id === editingId ? newLd : l));
        triggerToast?.("Branching load element parameters reconfigured!");
      }
    }
    setShowEditor(false);
    setEditingId(null);
  };

  const handleDeleteItem = (type: "source" | "branch" | "load", id: string) => {
    if (type === "source") {
      if (sources.length <= 1) {
        triggerToast?.("Your design requires at least 1 core utility service entrance.");
        return;
      }
      setSources(sources.filter((s) => s.id !== id));
      setBranches(branches.filter((b) => b.parent_id !== id));
    } else if (type === "branch") {
      setBranches(branches.filter((b) => b.id !== id));
      setLoads(loads.filter((l) => l.parent_id !== id));
    } else {
      setLoads(loads.filter((l) => l.id !== id));
    }
    setSelectedNodeId(null);
    triggerToast?.("Electrical component dismantled cleanly from design schematic.");
  };

  const openCreateModal = (target: "source" | "branch" | "load") => {
    setEditorTarget(target);
    setEditMode("create");
    setEditingId(null);
    if (target === "source") {
      setFormSourceName("");
      setFormSourceVolt("415 V");
      setFormSourceType("utility");
    } else if (target === "branch") {
      setFormBranchName("");
      setFormBranchParent(sources[0]?.id || "src_main");
      setFormBranchBreaker("100 A");
    } else {
      setFormLoadName("");
      setFormLoadParent(branches[0]?.id || "br_panel_1");
      setFormLoadType("lighting");
      setFormLoadKw(5.0);
      setFormLoadPf(0.9);
      setFormLoadPhases(3);
    }
    setShowEditor(true);
  };

  const openUpdateModal = (target: "source" | "branch" | "load", item: any) => {
    setEditorTarget(target);
    setEditMode("update");
    setEditingId(item.id);
    if (target === "source") {
      setFormSourceName(item.name);
      setFormSourceVolt(item.voltage);
      setFormSourceType(item.type);
    } else if (target === "branch") {
      setFormBranchName(item.name);
      setFormBranchParent(item.parent_id);
      setFormBranchBreaker(item.breaker_rating);
    } else {
      setFormLoadName(item.name);
      setFormLoadParent(item.parent_id);
      setFormLoadType(item.type);
      setFormLoadKw(item.power_kw);
      setFormLoadPf(item.pf);
      setFormLoadPhases(item.phases);
    }
    setShowEditor(true);
  };

  // --- SVG Tree Layout Coordinate Computations ---
  // We space out all available loads first. Then the panels/branches are self-centered, then the source is self-centered.
  const paddingX = 140;
  const spacingX = 180;
  
  // Tab 1: Structured Tree Topology Rendering Calculations
  const calculatedTreeCoordinates = useMemo(() => {
    const totalLoads = loads.length;
    const treeW = Math.max(900, totalLoads * spacingX + paddingX * 2);

    // 1. Position individual loads
    const loadCoords: Record<string, { x: number; y: number }> = {};
    loads.forEach((ld, idx) => {
      loadCoords[ld.id] = {
        x: paddingX + idx * spacingX,
        y: 350
      };
    });

    // 2. Position branches/panels
    const branchCoords: Record<string, { x: number; y: number }> = {};
    branches.forEach((br) => {
      // Find children loads of this board
      const childLoads = loads.filter((ld) => ld.parent_id === br.id);
      if (childLoads.length > 0) {
        // Average X coordinate of children
        const sumX = childLoads.reduce((acc, ld) => acc + (loadCoords[ld.id]?.x || 0), 0);
        branchCoords[br.id] = {
          x: sumX / childLoads.length,
          y: 200
        };
      } else {
        // Standalone branch offset
        const index = branches.indexOf(br);
        branchCoords[br.id] = {
          x: treeW / 2 + (index - (branches.length - 1) / 2) * 220,
          y: 200
        };
      }
    });

    // 3. Position sources
    const sourceCoords: Record<string, { x: number; y: number }> = {};
    sources.forEach((src) => {
      const childBranches = branches.filter((b) => b.parent_id === src.id);
      if (childBranches.length > 0) {
        const sumX = childBranches.reduce((acc, b) => acc + (branchCoords[b.id]?.x || treeW / 2), 0);
        sourceCoords[src.id] = {
          x: sumX / childBranches.length,
          y: 60
        };
      } else {
        const index = sources.indexOf(src);
        sourceCoords[src.id] = {
          x: treeW / 2 + (index - (sources.length - 1) / 2) * 350,
          y: 60
        };
      }
    });

    return {
      svgWidth: treeW,
      svgHeight: 460,
      loadCoords,
      branchCoords,
      sourceCoords
    };
  }, [sources, branches, loads]);

  // Tab 2: Direct Bulk Sizer Single level diagram coordinates
  const calculatedDirectCoordinates = useMemo(() => {
    const totalLoads = bulkLoads.length;
    const directW = Math.max(900, totalLoads * spacingX + paddingX * 2);
    return {
      svgWidth: directW,
      svgHeight: 410,
      busY: 175
    };
  }, [bulkLoads]);

  // Generating ASCII diagram from current tab state
  const getOutputAscii = () => {
    if (activeTab === "direct") {
      let output = `[UTILITY POWER GRID SOURCE] (${bulkLoadsCalculations.feederVolt}V)\n`;
      output += `       │\n`;
      output += `       ▼ [MAIN CIRCUIT DISK / OCPD] (${getStandardBreaker(bulkLoadsCalculations.designCurrentA)}A Breaker)\n`;
      output += `       │  Feeder Wire: ${selectCable(bulkLoadsCalculations.designCurrentA).sz}\n`;
      output += `───────┴─────────────── SOLID COPPER DISTRIBUTION BUSBAR ────────────────\n`;
      if (bulkLoads.length === 0) {
        output += `  (No active loader items found inside main DB core)\n`;
      } else {
        bulkLoads.forEach((load, idx) => {
          output += `       ├─┬─► [CB-${idx + 1}] ${getStandardBreaker(load.calculatedCurrent)}A || Wire: ${selectCable(load.calculatedCurrent).sz}\n`;
          output += `       │ └──► Branch Load ${idx + 1}: ${load.name} (${load.kw}kW, ${load.calculatedCurrent.toFixed(1)}A)\n`;
        });
      }
      return output;
    } else {
      let output = `[TREE CAD METADATA MATRIX - DOUBLE BUS SLD]\n`;
      sources.forEach((src) => {
        output += `⚡ SOURCE: ${src.name} (${src.voltage} grid, design type: ${src.type.toUpperCase()})\n`;
        const activeBranches = branches.filter(b => b.parent_id === src.id);
        activeBranches.forEach((br) => {
          output += `     └────► DB BRANCH: ${br.name} [Molded Case Breaker: ${br.breaker_rating}]\n`;
          const activeLoads = loads.filter(l => l.parent_id === br.id);
          activeLoads.forEach(l => {
            output += `              └────► LOAD TERMINAL: ${l.name} (${l.power_kw}kW, PF ${l.pf}, type: ${l.type})\n`;
          });
        });
      });
      return output;
    }
  };

  const handleCopyAscii = () => {
    navigator.clipboard.writeText(getOutputAscii());
    setCopiedId(true);
    triggerToast?.("CAD Single-Line ASCII Diagram successfully processed and copied!");
    onTrackAction?.("copy_blueprint_sld_ascii");
    setTimeout(() => setCopiedId(false), 2500);
  };

  // SVG trigger download
  const handleDownloadSvg = () => {
    try {
      const svgId = activeTab === "tree" ? "tree-sld-diagram-svg" : "direct-sld-diagram-svg";
      const svgElement = document.getElementById(svgId);
      if (!svgElement) return;

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      const link = document.createElement("a");
      link.href = svgUrl;
      link.download = `electro_engineering_diagram_${activeTab}_layout_${activeRegion}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(svgUrl);

      triggerToast?.("Interactive single-line blueprint downloaded successfully! ✓");
      onTrackAction?.("download_schematic_sld_svg");
    } catch (err) {
      console.error(err);
      triggerToast?.("Critical error during vector SVG serialization.");
    }
  };

  // Inspect selection returns specific data fields
  const getTreeInspectorDetails = () => {
    if (!selectedNodeId) return null;
    
    // Check if it's a Source
    const sNode = sources.find((s) => s.id === selectedNodeId);
    if (sNode) {
      const childBrs = branches.filter((b) => b.parent_id === sNode.id);
      return {
        id: sNode.id,
        targetType: "source" as const,
        title: sNode.name,
        badge: "Utility Service Entrance",
        details: [
          { label: "Nominal Grid Voltage", val: sNode.voltage },
          { label: "Feeding Topology Style", val: sNode.type === "utility" ? "Main Utility Feed (3Φ4W)" : sNode.type === "generator" ? "Local Generator (Standby)" : "PV Solar Core" },
          { label: "Downstream Cabinets Panel DB", val: `${childBrs.length} Distribution Nodes` }
        ],
        desc: `Main electricity service entrance providing raw electrical potential to lower levels. Regulated by regional authority protective grounding provisions.`,
        rawObj: sNode
      };
    }

    // Check if it's a Branch (DB Panel)
    const bNode = branches.find((b) => b.id === selectedNodeId);
    if (bNode) {
      const parentS = sources.find((s) => s.id === bNode.parent_id);
      const childLds = loads.filter((l) => l.parent_id === bNode.id);
      const designKw = childLds.reduce((acc, ld) => acc + ld.power_kw, 0);
      
      return {
        id: bNode.id,
        targetType: "branch" as const,
        title: bNode.name,
        badge: "Branch Distribution Board",
        details: [
          { label: "Incoming Main Breaker", val: bNode.breaker_rating },
          { label: "Branch Bus Voltage", val: parentS?.voltage || "415 V" },
          { label: "Total Mapped Load Capacity", val: `${designKw.toFixed(1)} kW` },
          { label: "Branch Loading Terminals", val: `${childLds.length} active nodes` }
        ],
        desc: `Individual branching distribution hub incorporating branch busbars, neutral rings, and secondary protective overcurrent circuit-breakers (OCPD) for isolation.`,
        rawObj: bNode
      };
    }

    // Check if it's a Load
    const lNode = loads.find((l) => l.id === selectedNodeId);
    if (lNode) {
      const parentB = branches.find((b) => b.id === lNode.parent_id);
      const ampRaw = calculateCurrentA(lNode.power_kw, lNode.pf, lNode.phases, 415);
      
      return {
        id: lNode.id,
        targetType: "load" as const,
        title: lNode.name,
        badge: `${lNode.type.toUpperCase()} LOAD NODE`,
        details: [
          { label: "Total Active Power", val: `${lNode.power_kw.toFixed(1)} kW` },
          { label: "Assumed System Power Factor", val: lNode.pf.toFixed(2) },
          { label: "Configuration Phases", val: `${lNode.phases}Φ Line Wire` },
          { label: "Estimated Node Current", val: `${ampRaw.toFixed(1)} A` },
          { label: "Recommended Wire Size", val: selectCable(ampRaw).sz }
        ],
        desc: `End terminal utilizing electro-mechanical energy. Demands appropriate conductor sizing to mitigate thermal copper voltage losses and excessive voltage drop.`,
        rawObj: lNode
      };
    }

    return null;
  };

  // Direct tab inspector
  const getDirectInspectorDetails = () => {
    if (!selectedNodeId) return null;
    if (selectedNodeId === "main") {
      return {
        title: "Main Distribution Service Entrance",
        badge: "Root Feeder",
        details: [
          { label: "Utility Main OCPD Breaker", val: `${getStandardBreaker(bulkLoadsCalculations.designCurrentA)}A Trip` },
          { label: "Main Feeder Wire", val: selectCable(bulkLoadsCalculations.designCurrentA).sz },
          { label: "Equivalent combined demand", val: `${bulkLoadsCalculations.totalKw.toFixed(1)} kW / ${bulkLoadsCalculations.totalKva.toFixed(1)} kVA` },
          { label: "Feeder System Volt", val: `${bulkLoadsCalculations.feederPhases}Φ – ${bulkLoadsCalculations.feederVolt}V` }
        ],
        desc: "Combined global electrical feed incorporating all load vector math calculations sum to drive safe core ampacity limits."
      };
    }

    const loadIndex = parseInt(selectedNodeId);
    const load = bulkLoads[loadIndex];
    if (!load) return null;

    return {
      title: load.name,
      badge: `${load.name.toUpperCase()} TERMINAL`,
      details: [
        { label: "Dedicated Circuit Breaker", val: `${getStandardBreaker(load.calculatedCurrent)}A` },
        { label: "Conductor Selection", val: selectCable(load.calculatedCurrent).sz },
        { label: "Baseline Current Draw", val: `${load.calculatedCurrent.toFixed(1)} A` },
        { label: "Power & Configuration", val: `${load.kw.toFixed(1)} kW (${load.phases}Φ – ${load.volt}V)` }
      ],
      desc: `Specific electrical consumer from the active Bulk Load Aggregator spreadsheet. Operates on ${load.isContinuous ? "Continuous (125%) safety load parameters" : "Standard (100%) code conditions"}.`
    };
  };

  const treeSelectedDetails = getTreeInspectorDetails();
  const directSelectedDetails = getDirectInspectorDetails();

  return (
    <div className={`border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-900/40 space-y-6 mt-8 transition-all ${isMaximized ? "fixed inset-4 z-50 overflow-y-auto bg-slate-50 dark:bg-slate-950 shadow-3xl border-slate-300" : ""}`}>
      
      {/* 1. Header with Title & Action Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <div>
          <span className="text-[9px] font-black tracking-widest bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded uppercase font-sans">
            AI-Engineered CAD Blueprints
          </span>
          <h3 className="text-sm font-black uppercase text-slate-850 dark:text-slate-100 tracking-wider flex items-center gap-2 mt-1">
            <FolderTree className="w-5 h-5 text-amber-500" />
            Cad-Driven Circuit Diagram Generator (SLD)
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 max-w-2xl leading-relaxed">
            Generate and visualize interactive, physical Single-Line Diagrams (SLD) with real-time copper wire and circuit breaker sizing. Drive the tree directly via multi-level custom DB topology or import from the Bulk Load Aggregator database.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
          <button
            type="button"
            onClick={handleCopyAscii}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 text-[10px] uppercase font-black text-slate-600 dark:text-slate-400 rounded-lg cursor-pointer transition select-none"
          >
            {copiedId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Copied ASCII Schema
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                ASCII Layout
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase font-black rounded-lg cursor-pointer transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Vector SVG
          </button>

          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition"
            title={isMaximized ? "Restore window layout" : "Togglefullscreen viewport"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Top Navigation Tabs & Options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-100/50 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-200/50 dark:border-slate-850">
        
        {/* Toggle Mode Tab Switches */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => { setActiveTab("tree"); setSelectedNodeId(null); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-4xs uppercase font-black tracking-wider transition ${
              activeTab === "tree" 
                ? "bg-white dark:bg-slate-905 text-amber-550 border border-slate-200 dark:border-slate-800 shadow-3xs" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/30"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            Project Tree Hierarchy (3-Tier DB)
          </button>
          
          <button
            type="button"
            onClick={() => { setActiveTab("direct"); setSelectedNodeId(null); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-4xs uppercase font-black tracking-wider transition ${
              activeTab === "direct" 
                ? "bg-white dark:bg-slate-905 text-amber-550 border border-slate-200 dark:border-slate-800 shadow-3xs" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/30"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Bulk Aggregator Busbar (1-Tier)
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("json-cad"); setSelectedNodeId(null); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-4xs uppercase font-black tracking-wider transition ${
              activeTab === "json-cad" 
                ? "bg-white dark:bg-slate-905 text-amber-550 border border-slate-200 dark:border-slate-800 shadow-3xs" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/30"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            JSON CAD Compiler
          </button>
        </div>

        {/* Rendering Annotation Filters */}
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showWireLabels}
              onChange={(e) => setShowWireLabels(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-amber-550 focus:ring-amber-500/10"
            />
            <span>Wire Sizing</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showBreakerRatings}
              onChange={(e) => setShowBreakerRatings(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-amber-550 focus:ring-amber-500/10"
            />
            <span>Breaker ratings</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showLoadValues}
              onChange={(e) => setShowLoadValues(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-amber-550 focus:ring-amber-500/10"
            />
            <span>Appliance metrics</span>
          </label>
        </div>
      </div>

      {/* 3. Main Operational Layout (Split Sidebar Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: The Interactive Vector Canvas */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850/80 shadow-3xs relative flex flex-col justify-between">
          
          {/* Top Info Banner Overlay */}
          <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100 dark:border-slate-900 text-3xs font-black uppercase text-slate-400">
            <span className="flex items-center gap-2">
              <span>{activeTab === "tree" ? "Double-bus distribution structural mapping" : activeTab === "direct" ? "Standard baseline parallel loading sizer" : "JSON Layout Coding Playground"}</span>
              <span className="text-[9px] text-amber-500 font-bold normal-case">
                {activeTab === "tree" ? `(${sources.length} sources ➔ ${branches.length} panels ➔ ${loads.length} loads)` : activeTab === "direct" ? `(${bulkLoads.length} active loads)` : ""}
              </span>
            </span>
            {activeTab !== "json-cad" && (
              <button
                type="button"
                onClick={handleExportPNG}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase text-[9px] px-2.5 py-1 rounded transition-colors tracking-wide shadow-sm hover:shadow active:scale-95 cursor-pointer"
                title="Export current diagram to high-resolution PNG"
              >
                <Download className="w-3 h-3" />
                <span>Export PNG Report</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto w-full border border-slate-150 dark:border-slate-900 rounded-xl bg-slate-50/40 dark:bg-slate-900/10 p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {activeTab === "tree" ? (
              // TREE TOPOLOGY RENDER
              <svg
                id="tree-sld-diagram-svg"
                width={calculatedTreeCoordinates.svgWidth}
                height={calculatedTreeCoordinates.svgHeight}
                viewBox={`0 0 ${calculatedTreeCoordinates.svgWidth} ${calculatedTreeCoordinates.svgHeight}`}
                className="mx-auto block select-none overflow-visible"
              >
                <defs>
                  <linearGradient id="mainGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="copperBusGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="50%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  <filter id="svgGlowAlpha" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Background Grid Lines */}
                <g opacity="0.08">
                  {Array.from({ length: Math.ceil(calculatedTreeCoordinates.svgWidth / 40) }).map((_, i) => (
                    <line key={i} x1={i * 40} y1={0} x2={i * 40} y2={calculatedTreeCoordinates.svgHeight} stroke="#475569" strokeWidth="0.5" strokeDasharray="3 3 M0 0 M10 10" />
                  ))}
                  {Array.from({ length: Math.ceil(calculatedTreeCoordinates.svgHeight / 40) }).map((_, i) => (
                    <line key={i} x1={0} y1={i * 40} x2={calculatedTreeCoordinates.svgWidth} y2={i * 40} stroke="#475569" strokeWidth="0.5" strokeDasharray="3 3 M0 0 M10 10" />
                  ))}
                </g>

                {/* ORTHOGONAL INTERCONNECT WIRE PATHLINES */}
                {sources.map((src) => {
                  const srcPt = calculatedTreeCoordinates.sourceCoords[src.id];
                  if (!srcPt) return null;

                  const connectedBranches = branches.filter((b) => b.parent_id === src.id);
                  return (
                    <g key={`feeder-${src.id}`} opacity={hoveredNodeId && hoveredNodeId !== src.id ? 0.35 : 1} className="transition-opacity">
                      {connectedBranches.map((br) => {
                        const brPt = calculatedTreeCoordinates.branchCoords[br.id];
                        if (!brPt) return null;
                        
                        return (
                          <g key={`link-${src.id}-${br.id}`}>
                            {/* Standard Orthogonal Line (vertical down to middle, then horiz, then vert down to panel) */}
                            <path
                              d={`M ${srcPt.x} ${srcPt.y} L ${srcPt.x} ${(srcPt.y + brPt.y) / 2} L ${brPt.x} ${(srcPt.y + brPt.y) / 2} L ${brPt.x} ${brPt.y}`}
                              fill="none"
                              className={`stroke-slate-400 transition-all ${
                                hoveredNodeId === br.id || selectedNodeId === br.id || hoveredNodeId === src.id || selectedNodeId === src.id
                                  ? "stroke-amber-500 stroke-[2.2px]"
                                  : "stroke-[1.5px]"
                              }`}
                              strokeLinecap="round"
                            />
                            
                            {/* OCPD Wire annotations */}
                            {showWireLabels && (
                              <g transform={`translate(${brPt.x - 32}, ${(srcPt.y + brPt.y) / 2 - 20})`}>
                                <rect width="44" height="12" rx="3" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" />
                                <text x="22" y="9" textAnchor="middle" className="font-mono text-[7px] font-black fill-slate-500 dark:fill-slate-400">
                                  {selectCable(250).sz}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

                {/* ORTHOGONAL LINKS: BR_PANEL TO DEDICATED APPLIANCES */}
                {branches.map((br) => {
                  const brPt = calculatedTreeCoordinates.branchCoords[br.id];
                  if (!brPt) return null;

                  const connectedLoads = loads.filter((l) => l.parent_id === br.id);
                  return (
                    <g key={`dist-${br.id}`} opacity={hoveredNodeId && hoveredNodeId !== br.id ? 0.35 : 1} className="transition-opacity">
                      {connectedLoads.map((ld) => {
                        const ldPt = calculatedTreeCoordinates.loadCoords[ld.id];
                        if (!ldPt) return null;

                        return (
                          <path
                            key={`link-ld-${ld.id}`}
                            d={`M ${brPt.x} ${brPt.y} L ${brPt.x} ${(brPt.y + ldPt.y) / 2} L ${ldPt.x} ${(brPt.y + ldPt.y) / 2} L ${ldPt.x} ${ldPt.y - 15}`}
                            fill="none"
                            className={`stroke-slate-400 transition-all ${
                              hoveredNodeId === ld.id || selectedNodeId === ld.id || hoveredNodeId === br.id || selectedNodeId === br.id
                                ? "stroke-amber-500 stroke-[2.2px]"
                                : "stroke-[1.5px]"
                            }`}
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {/* RENDERING LEVEL 1: GRID SOURCES */}
                {sources.map((src) => {
                  const pt = calculatedTreeCoordinates.sourceCoords[src.id];
                  if (!pt) return null;
                  const isNodeSelected = selectedNodeId === src.id;
                  const isNodeHovered = hoveredNodeId === src.id;

                  return (
                    <g
                      key={src.id}
                      transform={`translate(${pt.x}, ${pt.y})`}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredNodeId(src.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => setSelectedNodeId(src.id)}
                    >
                      {/* Outer Shield representing utility substation transformer or backup generation */}
                      <rect
                        x="-30"
                        y="-22"
                        width="60"
                        height="44"
                        rx="6"
                        className={`fill-white dark:fill-slate-900 border transition-all ${
                          isNodeSelected 
                            ? "stroke-amber-500 stroke-[2.5px] fill-amber-500/5 shadow-sm" 
                            : "stroke-slate-400 dark:stroke-slate-700 group-hover:stroke-amber-400"
                        }`}
                        style={isNodeSelected ? { filter: "url(#svgGlowAlpha)" } : {}}
                      />

                      {/* Power Source Icon paths inside circuit (rect layout) */}
                      {src.type === "utility" ? (
                        <path d="M-10 10 L0 -8 L10 10 M-14 1 L14 1 M-8 -4 L8 -4" className="stroke-slate-650 dark:stroke-slate-350 fill-none" strokeWidth="1.8" />
                      ) : src.type === "generator" ? (
                        <path d="M-10 -8 H10 V8 H-10 Z M-5 -3 L5 3 M-5 3 L5 -3" className="stroke-blue-500 fill-none" strokeWidth="1.8" />
                      ) : (
                        <g>
                          <circle cx="0" cy="0" r="10" className="fill-amber-500/10 stroke-amber-550" strokeWidth="1.5" />
                          <line x1="-12" y1="0" x2="12" y2="0" className="stroke-amber-500" strokeWidth="1.5" />
                          <line x1="0" y1="-12" x2="0" y2="12" className="stroke-amber-500" strokeWidth="1.5" />
                        </g>
                      )}

                      {/* Text Annotations */}
                      <text x="36" y="1" className="font-sans text-[10px] font-black fill-slate-800 dark:fill-slate-100 uppercase tracking-wide">
                        {src.name}
                      </text>
                      <text x="36" y="12" className="font-mono text-[8px] font-bold fill-slate-450 dark:fill-amber-400">
                        {src.voltage} • {src.type.toUpperCase()}
                      </text>
                    </g>
                  );
                })}

                {/* RENDERING LEVEL 2: DISTRIBUTION BOARD PANELS */}
                {branches.map((br) => {
                  const pt = calculatedTreeCoordinates.branchCoords[br.id];
                  if (!pt) return null;
                  const isNodeSelected = selectedNodeId === br.id;
                  const isNodeHovered = hoveredNodeId === br.id;

                  return (
                    <g
                      key={br.id}
                      transform={`translate(${pt.x}, ${pt.y})`}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredNodeId(br.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => setSelectedNodeId(br.id)}
                    >
                      {/* Solid cabinet card representation - rounded rectangle */}
                      <rect
                        x="-48"
                        y="-16"
                        width="96"
                        height="32"
                        rx="6"
                        className={`fill-white dark:fill-slate-900 border transition-all ${
                          isNodeSelected 
                            ? "stroke-orange-500 stroke-[2px] fill-orange-500/5 shadow-md" 
                            : "stroke-slate-350 dark:stroke-slate-850 group-hover:stroke-orange-400"
                        }`}
                        style={isNodeSelected ? { filter: "url(#svgGlowAlpha)" } : {}}
                      />

                      {/* Explicit DB label inside rectangle */}
                      <g transform="translate(-40, -10)">
                        <rect width="18" height="20" rx="3" className="fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700" strokeWidth="0.8" />
                        <text x="9" y="13" textAnchor="middle" className="font-sans text-[8px] font-black fill-slate-705 dark:fill-slate-300">DB</text>
                      </g>

                      {/* Name tags inside panel block */}
                      <text x="-16" y="-1" className="font-sans text-[8px] font-extrabold fill-slate-800 dark:fill-slate-200">
                        {br.name.length > 15 ? `${br.name.slice(0, 13)}...` : br.name}
                      </text>
                      <text x="-16" y="9" className="font-mono text-[7px] font-black fill-emerald-600 dark:fill-emerald-400">
                        MCB: {br.breaker_rating}
                      </text>

                      {/* Line connector downstream output points */}
                      <circle cx="0" cy="16" r="3" className="fill-orange-500" />
                    </g>
                  );
                })}

                {/* RENDERING LEVEL 3: INDIVIDUAL APPLIANCE TERMINALS */}
                {loads.map((ld) => {
                  const pt = calculatedTreeCoordinates.loadCoords[ld.id];
                  if (!pt) return null;
                  const isNodeSelected = selectedNodeId === ld.id;
                  const isNodeHovered = hoveredNodeId === ld.id;
                  const ampVal = calculateCurrentA(ld.power_kw, ld.pf, ld.phases, 415);
                  const isGenericLoad = ld.type === "generic" || ld.type === "cooking" || ld.type === "receptacle";

                  return (
                    <g
                      key={ld.id}
                      transform={`translate(${pt.x}, ${pt.y})`}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredNodeId(ld.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => setSelectedNodeId(ld.id)}
                    >
                      {/* Secondary circuit breaker inline switch symbol */}
                      <g transform="translate(0, -35)">
                        <line x1="0" y1="-10" x2="0" y2="10" className="stroke-slate-400" strokeWidth="1.5" />
                        <circle cx="0" cy="5" r="2" className="fill-slate-600 dark:fill-slate-400" />
                        <line x1="0" y1="5" x2="6" y2="-5" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="1.8" />
                        
                        {showBreakerRatings && (
                          <text x="10" y="8" className="font-mono text-[7px] font-bold fill-emerald-600 dark:fill-emerald-450 text-left">
                            {getStandardBreaker(ampVal)}A
                          </text>
                        )}
                      </g>

                      {/* Conductor tag inline */}
                      {showWireLabels && (
                        <g transform="translate(-20, -56)">
                          <rect width="40" height="10" rx="3" className="fill-slate-50 dark:fill-slate-905 stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" />
                          <text x="20" y="7.5" textAnchor="middle" className="font-mono text-[6.5px] font-medium fill-slate-500">
                            {selectCable(ampVal).sz}
                          </text>
                        </g>
                      )}

                      {/* Adaptive Shape: circle for lighting/motor, box with kW label for generic loads */}
                      {isGenericLoad ? (
                        <rect
                          x="-22"
                          y="-22"
                          width="44"
                          height="44"
                          rx="4"
                          className={`fill-white dark:fill-slate-900 border transition-all ${
                            isNodeSelected 
                              ? "stroke-purple-500 stroke-[2.2px] fill-purple-500/5 shadow-md" 
                              : "stroke-slate-200 dark:stroke-slate-800 group-hover:stroke-purple-400"
                          }`}
                        />
                      ) : (
                        <circle
                          cx="0"
                          cy="0"
                          r="22"
                          className={`fill-white dark:fill-slate-900 border transition-all ${
                            isNodeSelected 
                              ? "stroke-amber-500 stroke-[2.2px] fill-amber-500/5 shadow-md" 
                              : "stroke-slate-200 dark:stroke-slate-800 group-hover:stroke-amber-400"
                          }`}
                        />
                      )}

                      {/* Load Specific Icon Rendering */}
                      {ld.type === "motor" && (
                        <g stroke="#3b82f6" strokeWidth="1.2" fill="none">
                          <circle cx="0" cy="0" r="11" />
                          <text x="0" y="3.5" textAnchor="middle" className="font-sans text-[9px] font-black fill-blue-500" stroke="none">M</text>
                        </g>
                      )}

                      {ld.type === "lighting" && (
                        <g stroke="#f59e0b" strokeWidth="1.2" fill="none">
                          <circle cx="0" cy="-3" r="8" className="stroke-amber-500 fill-amber-500/10" />
                          <path d="M-4 5 L-2 10 H2 L4 5" className="stroke-amber-500" />
                          <line x1="-3" y1="12" x2="3" y2="12" className="stroke-amber-600" strokeWidth="1.5" />
                          <path d="M-2 -3 Q0 -1 2 -3" className="stroke-amber-400" />
                          <line x1="0" y1="-3" x2="0" y2="1" className="stroke-amber-400" />
                        </g>
                      )}

                      {ld.type === "cooking" && (
                        <g stroke="#ef4444" strokeWidth="1.2" fill="none" strokeLinecap="round">
                          <path d="M-8 -3 L-4 5 L2 -4 L6 4" className="stroke-red-500" />
                          <circle cx="0" cy="0" r="11" className="stroke-red-500/30" />
                        </g>
                      )}

                      {ld.type === "receptacle" && (
                        <g stroke="#14b8a6" strokeWidth="1.2" fill="none">
                          <circle cx="0" cy="0" r="10" className="stroke-teal-500/60" />
                          <line x1="-5" y1="-2" x2="-5" y2="4" className="stroke-teal-500" />
                          <line x1="5" y1="-2" x2="5" y2="4" className="stroke-teal-500" />
                          <rect x="-2" y="-5" width="4" height="10" rx="1" className="fill-slate-400" />
                        </g>
                      )}

                      {ld.type === "generic" && (
                        <g>
                          <rect x="-14" y="-14" width="28" height="28" rx="2" className="fill-purple-500/10 stroke-purple-500" strokeWidth="1.2" />
                          <text x="0" y="4" textAnchor="middle" className="font-mono text-[7px] font-black fill-purple-500">
                            {ld.power_kw}kW
                          </text>
                        </g>
                      )}

                      {/* Display Info Name Text */}
                      <text x="0" y="36" textAnchor="middle" className="font-sans text-[8.5px] font-black fill-slate-800 dark:fill-slate-100">
                        {ld.name.length > 18 ? `${ld.name.slice(0, 15)}...` : ld.name}
                      </text>

                      {showLoadValues && ld.type !== "generic" && (
                        <g>
                          <text x="0" y="47" textAnchor="middle" className="font-mono text-[7px] font-bold fill-slate-500 dark:text-slate-400">
                            {ld.power_kw.toFixed(1)} kW | PF {ld.pf.toFixed(2)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            ) : activeTab === "direct" ? (
              // DIRET SINGLE BUSBAR SCHEMATIC
              <svg
                id="direct-sld-diagram-svg"
                width={calculatedDirectCoordinates.svgWidth}
                height={calculatedDirectCoordinates.svgHeight}
                viewBox={`0 0 ${calculatedDirectCoordinates.svgWidth} ${calculatedDirectCoordinates.svgHeight}`}
                className="mx-auto block select-none overflow-visible"
              >
                <defs>
                  <linearGradient id="mainGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
                  </linearGradient>
                  
                  <linearGradient id="copperBusGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="50%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>

                  <filter id="svgGlowAlpha" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* BACKGROUND GRAPH GRID */}
                <g opacity="0.08">
                  {Array.from({ length: Math.ceil(calculatedDirectCoordinates.svgWidth / 40) }).map((_, i) => (
                    <line key={i} x1={i * 40} y1={0} x2={i * 40} y2={calculatedDirectCoordinates.svgHeight} stroke="#475569" strokeWidth="0.5" strokeDasharray="3 3 M0 0" />
                  ))}
                  {Array.from({ length: Math.ceil(calculatedDirectCoordinates.svgHeight / 40) }).map((_, i) => (
                    <line key={i} x1={0} y1={i * 40} x2={calculatedDirectCoordinates.svgWidth} y2={i * 40} stroke="#475569" strokeWidth="0.5" strokeDasharray="3 3 M0 0" />
                  ))}
                </g>

                {/* 1. TOP UTILITY INTEGRATED SECTION */}
                <g className="utility-source-node">
                  <circle
                    cx={calculatedDirectCoordinates.svgWidth / 2}
                    cy="45"
                    r="24"
                    className={`stroke-slate-550 fill-white dark:fill-slate-900 transition-colors ${hoveredNodeId === "main" ? "stroke-amber-500 fill-amber-500/5" : ""}`}
                    strokeWidth="2"
                  />
                  <path
                    d={`M${calculatedDirectCoordinates.svgWidth / 2 - 10} 58 L${calculatedDirectCoordinates.svgWidth / 2} 32 L${calculatedDirectCoordinates.svgWidth / 2 + 10} 58 M${calculatedDirectCoordinates.svgWidth / 2 - 14} 45 L${calculatedDirectCoordinates.svgWidth / 2 + 14} 45 M${calculatedDirectCoordinates.svgWidth / 2 - 8} 36 L${calculatedDirectCoordinates.svgWidth / 2 + 8} 36`}
                    className={`stroke-slate-650 dark:stroke-slate-350 transition-colors ${hoveredNodeId === "main" ? "stroke-amber-500" : ""}`}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <text
                    x={calculatedDirectCoordinates.svgWidth / 2 + 32}
                    y="42"
                    className="font-sans text-[9px] font-black fill-slate-500 tracking-wider text-left dark:fill-slate-450"
                  >
                    UTILITY SOURCE CABINET
                  </text>
                  <text
                    x={calculatedDirectCoordinates.svgWidth / 2 + 32}
                    y="53"
                    className="font-mono text-[9px] font-black fill-amber-600 dark:fill-amber-450 text-left"
                  >
                    Wye Standard Interconnect ({bulkLoadsCalculations.feederVolt}V)
                  </text>
                </g>

                {/* 2. CONNECTION LINE DOWN TO MAIN OCPD */}
                <line
                  x1={calculatedDirectCoordinates.svgWidth / 2}
                  y1="69"
                  x2={calculatedDirectCoordinates.svgWidth / 2}
                  y2="95"
                  className={`stroke-slate-500 transition-all ${hoveredNodeId === "main" ? "stroke-amber-500" : ""}`}
                  strokeWidth="2.5"
                />

                {/* MAIN FEEDER CABLE SIZE LABEL */}
                {showWireLabels && (
                  <g>
                    <rect
                      x={calculatedDirectCoordinates.svgWidth / 2 - 68}
                      y="70"
                      width="60"
                      height="15"
                      rx="3"
                      className="fill-slate-100/95 dark:fill-slate-850/95 stroke-slate-200 dark:stroke-slate-800"
                      strokeWidth="1"
                    />
                    <text
                      x={calculatedDirectCoordinates.svgWidth / 2 - 38}
                      y="80"
                      textAnchor="middle"
                      className="font-mono text-[8px] font-bold fill-slate-600 dark:fill-slate-350"
                    >
                      {selectCable(bulkLoadsCalculations.designCurrentA).sz}
                    </text>
                  </g>
                )}

                {/* 3. MAIN OCPD INTERACTIVE SWITCH */}
                <g 
                  className="cursor-pointer group/main"
                  onMouseEnter={() => setHoveredNodeId("main")}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => setSelectedNodeId("main")}
                >
                  <rect
                    x={calculatedDirectCoordinates.svgWidth / 2 - 18}
                    y="95"
                    width="36"
                    height="40"
                    rx="5"
                    className={`stroke-slate-200 fill-white dark:fill-slate-900 transition-all dark:stroke-slate-800/80 ${
                      selectedNodeId === "main" ? "stroke-amber-500 ring-2 ring-amber-500/20" : "group-hover/main:stroke-amber-400"
                    }`}
                    strokeWidth="1.5"
                    style={selectedNodeId === "main" ? { filter: "url(#svgGlowAlpha)" } : {}}
                  />
                  <path
                    d={`M${calculatedDirectCoordinates.svgWidth / 2 - 8} 123 L${calculatedDirectCoordinates.svgWidth / 2 + 8} 107`}
                    className={`stroke-slate-700 dark:stroke-slate-200 transition-colors ${hoveredNodeId === "main" ? "stroke-amber-500" : ""}`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx={calculatedDirectCoordinates.svgWidth / 2 - 8} cy="123" r="2.5" className="fill-slate-800 dark:fill-slate-200" />
                  <circle cx={calculatedDirectCoordinates.svgWidth / 2 + 8} cy="123" r="2.5" className="fill-slate-800 dark:fill-slate-200" />

                  <text
                    x={calculatedDirectCoordinates.svgWidth / 2 - 24}
                    y="117"
                    textAnchor="end"
                    className="font-mono text-[8.5px] font-black fill-slate-705 dark:fill-slate-300"
                  >
                    Main MCB
                  </text>

                  {showBreakerRatings && (
                    <text
                      x={calculatedDirectCoordinates.svgWidth / 2 + 24}
                      y="117"
                      textAnchor="start"
                      className="font-mono text-[8.5px] font-bold fill-emerald-600 dark:fill-emerald-450"
                    >
                      {getStandardBreaker(bulkLoadsCalculations.designCurrentA)}A
                    </text>
                  )}
                </g>

                {/* FEEDER CONDUIT LINE TO BUSBAR */}
                <line
                  x1={calculatedDirectCoordinates.svgWidth / 2}
                  y1="135"
                  x2={calculatedDirectCoordinates.svgWidth / 2}
                  y2={calculatedDirectCoordinates.busY}
                  className={`stroke-slate-500 transition-all ${hoveredNodeId === "main" ? "stroke-amber-500" : ""}`}
                  strokeWidth="2.5"
                />

                {/* 4. SOLID COPPER BUSBAR SECTION */}
                <g className="distribution-busbar">
                  <rect
                    x={paddingX}
                    y={calculatedDirectCoordinates.busY - 3}
                    width={calculatedDirectCoordinates.svgWidth - paddingX * 2}
                    height="6"
                    rx="3"
                    className="fill-[url(#copperBusGradient)] shadow-sm"
                  />
                  <text
                    x={paddingX + 10}
                    y={calculatedDirectCoordinates.busY - 8}
                    className="font-sans text-[8px] font-black fill-orange-600 dark:fill-orange-400 uppercase tracking-widest"
                  >
                    Distribution Copper Busbar Grid ────► {bulkLoadsCalculations.feederVolt}V / {bulkLoadsCalculations.feederPhases}Φ
                  </text>
                </g>

                {/* 5. INDIVIDUAL BRANCHES DRAWER FROM AGGREGATE */}
                {bulkLoads.map((load, index) => {
                  const nodeX = paddingX + 50 + index * spacingX;
                  const isNodeHovered = hoveredNodeId === index.toString();
                  const isNodeSelected = selectedNodeId === index.toString();
                  const branchActive = isNodeHovered || isNodeSelected;
                  
                  const loadType = load.name.toLowerCase().includes("motor") ? "motor" : "lighting";
                  const breakerType = getStandardBreaker(load.calculatedCurrent);
                  const cableMatch = selectCable(load.calculatedCurrent);

                  return (
                    <g key={load.id} className="branch-circuit-diagram-node">
                      <circle cx={nodeX} cy={calculatedDirectCoordinates.busY} r="3.5" className={`transition-colors ${branchActive ? "fill-amber-500" : "fill-orange-500"}`} />
                      
                      <line
                        x1={nodeX}
                        y1={calculatedDirectCoordinates.busY}
                        x2={nodeX}
                        y2="215"
                        className={`stroke-slate-550 transition-all ${branchActive ? "stroke-amber-450" : ""}`}
                        strokeWidth="1.8"
                      />

                      {/* Branch cable label */}
                      {showWireLabels && (
                        <g>
                          <rect x={nodeX - 42} y="180" width="36" height="12" rx="3" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.8" />
                          <text x="-24" dx={nodeX} dy="188" textAnchor="middle" className="font-mono text-[7px] font-bold fill-slate-500 dark:fill-slate-400">
                            {cableMatch.sz}
                          </text>
                        </g>
                      )}

                      {/* INTERACTIVE BRANCH BREAKER */}
                      <g
                        className="cursor-pointer group/branch"
                        onMouseEnter={() => setHoveredNodeId(index.toString())}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => setSelectedNodeId(index.toString())}
                      >
                        <circle
                          cx={nodeX}
                          cy="215"
                          r="14"
                          className={`fill-white dark:fill-slate-900 border transition-all ${
                            isNodeSelected ? "stroke-amber-500 stroke-[2] fill-amber-500/5" : "stroke-slate-200 dark:stroke-slate-800 group-hover/branch:stroke-amber-400/80"
                          }`}
                        />
                        <path d={`M${nodeX - 5} 220 L${nodeX + 5} 207`} className={`stroke-slate-700 dark:stroke-slate-200 transition-colors ${branchActive ? "stroke-amber-500" : ""}`} strokeWidth="2" />
                        <circle cx={nodeX - 5} cy="220" r="1.5" className="fill-slate-800 dark:fill-slate-200" />
                        <circle cx={nodeX + 5} cy="220" r="1.5" className="fill-slate-800 dark:fill-slate-200" />

                        <text x={nodeX - 16} y="218" textAnchor="end" className="font-mono text-[8px] font-bold fill-slate-500 dark:fill-slate-400">CB-{index + 1}</text>
                        {showBreakerRatings && (
                          <text x={nodeX + 16} y="218" textAnchor="start" className="font-mono text-[8px] font-black fill-emerald-600 dark:fill-emerald-450">{breakerType}A</text>
                        )}
                      </g>

                      {/* Line from switches to standard loaders drawing */}
                      <line x1={nodeX} y1="229" x2={nodeX} y2="290" className={`stroke-slate-550 transition-all ${branchActive ? "stroke-amber-450" : ""}`} strokeWidth="1.8" />

                      {/* Electrical load asset */}
                      <g
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredNodeId(index.toString())}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => setSelectedNodeId(index.toString())}
                      >
                        <circle
                          cx={nodeX}
                          cy="312"
                          r="22"
                          className={`stroke-slate-205 fill-white dark:fill-slate-900 transition-all dark:stroke-slate-800 ${
                            isNodeSelected ? "stroke-amber-500 stroke-[2] fill-amber-550/5 shadow-md" : "hover:stroke-amber-400/80"
                          }`}
                        />
                        
                        {loadType === "motor" ? (
                          <g stroke="#3b82f6" strokeWidth="1.2" fill="none">
                            <circle cx={nodeX} cy="312" r="10" />
                            <text x={nodeX} y="315" textAnchor="middle" className="font-sans text-[10px] font-black fill-blue-500" stroke="none">M</text>
                          </g>
                        ) : (
                          <g stroke="#f59e0b" strokeWidth="1.2" fill="none">
                            <circle cx={nodeX} cy="312" r="9" />
                            <path d={`M${nodeX - 6} ${312 - 6} L${nodeX + 6} ${312 + 6}`} className="stroke-amber-500/60" />
                            <path d={`M${nodeX + 6} ${312 - 6} L${nodeX - 6} ${312 + 6}`} className="stroke-amber-500/60" />
                          </g>
                        )}

                        <text x={nodeX} y="348" textAnchor="middle" className="font-sans text-[8.5px] font-black fill-slate-800 dark:fill-slate-100">
                          {load.name.length > 18 ? `${load.name.slice(0, 15)}...` : load.name}
                        </text>

                        {showLoadValues && (
                          <text x={nodeX} y="359" textAnchor="middle" className="font-mono text-[7.5px] font-bold fill-slate-500 dark:fill-slate-400">
                            {load.kw.toFixed(1)} kW – {load.calculatedCurrent.toFixed(1)}A
                          </text>
                        )}
                      </g>
                    </g>
                  );
                })}
              </svg>
            ) : (
              // JSON CODE CAD MULTI-PANEL PLAYGROUND
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                      Configuration Schema (Pristine JSON)
                    </span>
                    <button
                      type="button"
                      onClick={() => setJsonInput(JSON.stringify({
                        sources,
                        branches,
                        loads
                      }, null, 2))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300 transition"
                      title="Sync current diagram states"
                    >
                      Export Current State
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='{ "sources": [], "branches": [], "loads": [] }'
                      className="w-full h-80 font-mono text-[11px] leading-normal p-3.5 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 select-all"
                    />
                    {jsonError && (
                      <div className="mt-2 text-2xs font-extrabold text-rose-500 bg-rose-500/10 border border-rose-500/15 p-2 rounded-md">
                        ⚠️ Compilation Error: {jsonError}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyJson}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-wider text-[10.5px] rounded-lg transition shadow-xs"
                  >
                    Run / Compile JSON Schema ────►
                  </button>
                </div>

                <div className="space-y-4 bg-slate-100/30 dark:bg-slate-950/45 p-4 rounded-xl border border-slate-200/60 dark:border-slate-850/70 text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">
                    AI Studio Tool Specification Card
                  </span>
                  
                  <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-3.5 rounded-lg space-y-2">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono px-1.5 py-0.5 rounded font-black uppercase block">
                      circuit_diagram_generator
                    </span>
                    <p className="text-[10px] leading-relaxed text-slate-500">
                      This specification enables agentic LLMs to generate standard Single-Line Diagram markup from aggregate calculation matrixes dynamically.
                    </p>
                    
                    <div className="text-[8.5px] font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-100 dark:border-slate-900 text-slate-450 dark:text-slate-400 overflow-x-auto max-h-48 scrollbar-thin">
                      <pre className="select-all">{`{
  "id": "circuit_diagram_generator",
  "name": "Circuit Diagram Generator",
  "description": "Generates an SVG single-line diagram from Bulk Load Aggregator data.",
  "input_schema": {
    "type": "object",
    "properties": {
      "bulk_load_data": {
        "type": "object",
        "description": "Bulk Load Aggregator JSON containing sources, branches, and loads."
      }
    },
    "required": ["bulk_load_data"]
  }
}`}</pre>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-2 leading-relaxed">
                    <p className="font-bold uppercase text-[9px] text-amber-500">How to use the compiler:</p>
                    <p>1. Modify the sources, branches, or loads arrays on the left.</p>
                    <p>2. Keep parents matching child foreign-keys (e.g. branch <code>parent_id</code> references a source <code>id</code>).</p>
                    <p>3. Click "Run / Compile JSON" to instantly view your custom design rendered inside the main SLD diagram viewport!</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Micro Information Overlay Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[10px] font-semibold text-slate-500 gap-2">
            <span className="flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-Time Vector Auto-Calculation Layer Synced with {isImperial ? "NFPA/NEC Regulations" : "Metric Standard Regulations"} (BS/IEC)
            </span>
            <div className="flex gap-2">
              {activeTab === "tree" && (
                <button
                  type="button"
                  onClick={resetTreeToDefaults}
                  className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 px-2 py-0.5 rounded transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore Defaults
                </button>
              )}
              {activeTab === "tree" && bulkLoads.length > 0 && (
                <button
                  type="button"
                  onClick={syncBulkSizerLoads}
                  className="flex items-center gap-1 text-[9px] font-black text-amber-550 uppercase tracking-widest hover:bg-amber-550/10 px-2 py-0.5 rounded transition"
                >
                  <Building className="w-3 h-3" />
                  Sync Bulk Aggregates
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Interactive Node Inspector & Editor Controls */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Node Inspector Display Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850/80 rounded-xl p-5 shadow-3xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-755 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-orange-500" />
                Live SLD Inspector
              </h4>
              <span className="text-[8px] font-mono font-black bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-amber-600 dark:text-amber-450 uppercase">
                Audit Active
              </span>
            </div>

            <AnimatePresence mode="wait">
              {/* Conditional details rendering based on active view tab */}
              {activeTab === "tree" ? (
                treeSelectedDetails ? (
                  <motion.div
                    key={selectedNodeId}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 rounded-lg">
                      <span className="text-[7.5px] font-black text-amber-500 uppercase tracking-widest block mb-0.5">
                        {treeSelectedDetails.badge}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">
                        {treeSelectedDetails.title}
                      </h5>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[9px] uppercase font-black text-slate-400 tracking-wide border-b border-slate-150 dark:border-slate-800 pb-1.5">
                        <span>Physical Properties</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {treeSelectedDetails.details.map((dt, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900">
                            <span className="text-[8px] text-slate-450 block font-semibold uppercase leading-none">{dt.label}</span>
                            <span className="text-2xs font-extrabold text-slate-800 dark:text-slate-200 mt-1.5 block font-mono">
                              {dt.val}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <span className="text-[8px] text-slate-400 block font-black uppercase tracking-wider mb-1">Functional Description</span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          {treeSelectedDetails.desc}
                        </p>
                      </div>

                      {/* Interactive Edit Action for user model custom edits */}
                      <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => openUpdateModal(treeSelectedDetails.targetType, treeSelectedDetails.rawObj)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                          Modify Components
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(treeSelectedDetails.targetType, treeSelectedDetails.id)}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950/10 hover:bg-rose-100 text-rose-500 rounded-lg transition"
                          title="Dismantle element"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 max-w-[200px] mx-auto leading-relaxed italic font-semibold">
                      Click any component node on the diagram (Service Entrance, sub panel DB, or power appliances) to inspect detailed protection ratings, calculated current draws, and single-line wire diameters.
                    </p>
                  </div>
                )
              ) : (
                directSelectedDetails ? (
                  <motion.div
                    key={selectedNodeId}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 rounded-lg">
                      <span className="text-[7.5px] font-black text-indigo-500 uppercase tracking-widest block mb-0.5">
                        {directSelectedDetails.badge}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">
                        {directSelectedDetails.title}
                      </h5>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[9px] uppercase font-black text-slate-400 tracking-wide border-b border-slate-150 dark:border-slate-800 pb-1.5">
                        <span>Calculated Sizing Limits</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {directSelectedDetails.details.map((dt, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900">
                            <span className="text-[8px] text-slate-450 block font-semibold uppercase leading-none">{dt.label}</span>
                            <span className="text-2xs font-extrabold text-slate-800 dark:text-slate-200 mt-1.5 block font-mono">
                              {dt.val}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold pt-1">
                        {directSelectedDetails.desc}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 max-w-[200px] mx-auto leading-relaxed italic font-semibold">
                      Click components on the direct aggregate single-busbar diagram to audit active wiring safety codes and protection ampacities.
                    </p>
                  </div>
                )
              )}
            </AnimatePresence>
          </div>

          {/* Tab 1 Diagram Tree Designer Admin Box */}
          {activeTab === "tree" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850/80 rounded-xl p-5 shadow-3xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-755 dark:text-slate-200 uppercase">
                  Designer Canvas Toolkit
                </h4>
                <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Tree Enabled
                </span>
              </div>

              <p className="text-[10px] text-slate-550 leading-relaxed">
                Add and customize the electrical infrastructure directly. Wire diameters, fault trip limits, and vector balance values adjust dynamically.
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => openCreateModal("source")}
                  className="flex flex-col items-center gap-1 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:border-amber-500/40 hover:bg-slate-100/35 transition"
                >
                  <Plus className="w-4 h-4 text-amber-550" />
                  <span className="text-[8.5px] font-black uppercase">Add Source</span>
                </button>
                <button
                  type="button"
                  onClick={() => openCreateModal("branch")}
                  className="flex flex-col items-center gap-1 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:border-amber-500/40 hover:bg-slate-100/35 transition"
                >
                  <Plus className="w-4 h-4 text-orange-500" />
                  <span className="text-[8.5px] font-black uppercase">Add Panel DB</span>
                </button>
                <button
                  type="button"
                  onClick={() => openCreateModal("load")}
                  className="flex flex-col items-center gap-1 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:border-amber-500/40 hover:bg-slate-100/35 transition"
                >
                  <Plus className="w-4 h-4 text-blue-500" />
                  <span className="text-[8.5px] font-black uppercase">Add load</span>
                </button>
              </div>
            </div>
          )}

          {/* Summary balance card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850/80 rounded-xl p-5 shadow-3xs space-y-3.5">
            <h4 className="text-xs font-black text-slate-755 dark:text-slate-200 uppercase pb-1.5 border-b border-slate-100 dark:border-slate-800">
              Total Combined Sizing Envelope
            </h4>
            <div className="space-y-2 font-mono text-[10.5px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-450 uppercase font-black text-[8px]">Active Real Power</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">
                  {activeTab === "tree" 
                    ? `${loads.reduce((acc, ld) => acc + ld.power_kw, 0).toFixed(1)} kW` 
                    : `${bulkLoadsCalculations.totalKw.toFixed(1)} kW`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450 uppercase font-black text-[8px]">Average Power Factor</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">
                  {activeTab === "tree"
                    ? (loads.reduce((acc, ld) => acc + ld.pf, 0) / Math.max(1, loads.length)).toFixed(2)
                    : bulkLoadsCalculations.totalPf.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-[8px] text-amber-500 font-black uppercase">Feeder Line Ampacity</span>
                <span className="font-black text-amber-600 dark:text-amber-450 text-xs">
                  {activeTab === "tree"
                    ? `${calculateCurrentA(loads.reduce((acc, ld) => acc + ld.power_kw, 0), 0.85, 3, 415).toFixed(1)} A`
                    : `${bulkLoadsCalculations.designCurrentA.toFixed(1)} A`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CRUD DIALOUGE INTERFACE OVERLAY */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4 text-xs font-semibold text-slate-705 dark:text-slate-350"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-amber-550" />
                {editMode === "create" ? "Configure New Component" : "Modify Design Component"}
              </h4>
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="text-slate-400 hover:text-rose-500 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Type 1: Source parameters */}
              {editorTarget === "source" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase font-black block">Source Name</label>
                    <input
                      type="text"
                      required
                      value={formSourceName}
                      onChange={(e) => setFormSourceName(e.target.value)}
                      placeholder="e.g. Utility Transformer Sub-1"
                      className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-850 dark:text-slate-100 text-xs px-3 py-2 border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-black block">Voltage Level</label>
                      <select
                        value={formSourceVolt}
                        onChange={(e) => setFormSourceVolt(e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs px-2 py-2 border"
                      >
                        <option value="415 V">415 V (3-Phase)</option>
                        <option value="400 V">400 V (3-Phase)</option>
                        <option value="240 V">240 V (Single Phase)</option>
                        <option value="110 V">110 V (Single Phase)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-black block">Grid Supply Type</label>
                      <select
                        value={formSourceType}
                        onChange={(e: any) => setFormSourceType(e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs px-2 py-2 border"
                      >
                        <option value="utility">Main Utility Grid</option>
                        <option value="generator">Standby Generator</option>
                        <option value="solar">Solar PV Inverter</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Type 2: Branch Panel parameters */}
              {editorTarget === "branch" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase font-black block">Panel DB Name</label>
                    <input
                      type="text"
                      required
                      value={formBranchName}
                      onChange={(e) => setFormBranchName(e.target.value)}
                      placeholder="e.g. Panel DB-Floor 1"
                      className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-850 dark:text-slate-100 text-xs px-3 py-2 border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-black block">Parent Source Feed</label>
                      <select
                        value={formBranchParent}
                        onChange={(e) => setFormBranchParent(e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs px-2 py-2 border"
                      >
                        {sources.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-black block">Breaker Rating</label>
                      <select
                        value={formBranchBreaker}
                        onChange={(e) => setFormBranchBreaker(e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs px-2 py-2 border"
                      >
                        <option value="63 A">63 A MCCB</option>
                        <option value="100 A">100 A MCCB</option>
                        <option value="125 A">125 A MCCB</option>
                        <option value="160 A">160 A MCCB</option>
                        <option value="250 A">250 A MCCB</option>
                        <option value="400 A">400 A Air CB</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Type 3: Individual loads parameters */}
              {editorTarget === "load" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase font-black block">Appliance / Load Name</label>
                    <input
                      type="text"
                      required
                      value={formLoadName}
                      onChange={(e) => setFormLoadName(e.target.value)}
                      placeholder="e.g. Conveyor Belt Motor M2"
                      className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-850 dark:text-slate-100 text-xs px-3 py-2 border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-black block">Parent Cabinet DB</label>
                      <select
                        value={formLoadParent}
                        onChange={(e) => setFormLoadParent(e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs px-2 py-2 border"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-black block">Load Element Type</label>
                      <select
                        value={formLoadType}
                        onChange={(e: any) => setFormLoadType(e.target.value)}
                        className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs px-2 py-2 border"
                      >
                        <option value="lighting">Lighting Circuits</option>
                        <option value="motor">Induction Motor (Coils)</option>
                        <option value="receptacle">Receptacle Plug Outlet</option>
                        <option value="cooking">Heater Oven ranges</option>
                        <option value="generic">Generic Static Load</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-black block">Power (Active kW)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formLoadKw}
                        onChange={(e) => setFormLoadKw(Number(e.target.value))}
                        className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs px-3 py-2 border font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-black block">Power Factor (PF)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.4"
                        max="1.0"
                        required
                        value={formLoadPf}
                        onChange={(e) => setFormLoadPf(Number(e.target.value))}
                        className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs px-3 py-2 border font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-black block">Phase configuration</label>
                      <select
                        value={formLoadPhases}
                        onChange={(e) => setFormLoadPhases(Number(e.target.value))}
                        className="w-full rounded-md border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs px-2 py-2 border"
                      >
                        <option value={3}>3-Phase (3Φ Balanced)</option>
                        <option value={1}>1-Phase (1Φ Line)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200/55 text-slate-650 text-[10.5px] uppercase font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10.5px] uppercase font-black rounded-lg transition"
                >
                  Confirm Configuration
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
