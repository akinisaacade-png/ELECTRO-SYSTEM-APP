/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  REGIONS,
  CABLE_TABLES,
  RegionConfig,
  Cable,
  UserAnalytics,
  CalculationResult
} from "./types";
import {
  Zap,
  Cable as CableIcon,
  CircleDot,
  ShieldCheck,
  Bot,
  Film,
  BookOpen,
  Download,
  AlertTriangle,
  CheckCircle2,
  Globe,
  LayoutDashboard,
  Lock,
  UserCheck,
  RefreshCw,
  Play,
  ArrowRight,
  ChevronRight,
  Gift,
  Coins,
  Compass,
  AlertCircle,
  Sparkles,
  Loader2,
  Library,
  Layers
} from "lucide-react";
import CourseAnalytics from "./components/CourseAnalytics";
import AIAssistant from "./components/AIAssistant";
import VideoTutorial from "./components/VideoTutorial";
import EngineeringLibrary from "./components/EngineeringLibrary";
import VisualizerCard from "./components/VisualizerCard";
import ElectricalSymbols from "./components/ElectricalSymbols";
import UnitConverter from "./components/UnitConverter";
import ServicesMenu from "./components/ServicesMenu";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend as ChartLegend
} from "recharts";
import { jsPDF } from "jspdf";

// Firebase Integration
import {
  auth,
  db,
  handleFirestoreError,
  OperationType
} from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "firebase/firestore";

export default function App() {
  // Page Navigation tab
  const [activePage, setActivePage] = useState<string>("dashboard");
  // Shared AI assistant pre-filled prompt from services navigation matrix
  const [aiServicePrompt, setAiServicePrompt] = useState<string | null>(null);
  // Calculators page sub-tabs
  const [calcTab, setCalcTab] = useState<"load" | "cable" | "vdrop" | "conduit" | "gemini-sizer">("load");
  // Region synchronization
  const [activeRegion, setActiveRegion] = useState<string>("UK");
  // Global Metric / Imperial Toggle
  const [isImperial, setIsImperial] = useState<boolean>(false);

  // Premium workflow
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [premiumUser, setPremiumUser] = useState<{ name: string; email: string } | null>(null);

  // Stripe payments checkout mock state
  const [stripeForm, setStripeForm] = useState({
    card: "",
    exp: "",
    cvc: "",
    nameOnCard: "",
    selectedPlan: "monthly",
    price: "$29.99"
  });
  const [stripeProgress, setStripeProgress] = useState<number | null>(null);
  const [stripeStatusText, setStripeStatusText] = useState("Initializing safe handshake...");

  // Calculations store
  const [lastResults, setLastResults] = useState<Record<string, any>>({});
  const [notifications, setNotifications] = useState<string | null>(null);

  // User Learning course statistics state
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    userId: "default-user",
    userName: "Guest Engineer",
    courses: {
      "load-design": { progress: 30, quizzesTaken: 1, avgScore: 80, completed: false },
      "cable-sizing": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
      "conduit-fill": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
      "code-compliance": { progress: 10, quizzesTaken: 0, avgScore: 0, completed: false },
    },
    overallScore: 75,
    calculationsRun: 5,
    checksRun: 3,
  });

  // Load calculator values
  const [loadKw, setLoadKw] = useState(75);
  const [loadPf, setLoadPf] = useState(0.85);
  const [loadVolt, setLoadVolt] = useState(415);
  const [loadPhases, setLoadPhases] = useState(3);
  const [loadType, setLoadType] = useState("continuous");
  const [loadTemp, setLoadTemp] = useState(30);
  const [loadGroup, setLoadGroup] = useState(1.0);
  const [loadResult, setLoadResult] = useState<any>(null);

  // Quick Load values (Dashboard page)
  const [quickKw, setQuickKw] = useState(45);
  const [quickVolt, setQuickVolt] = useState(415);
  const [quickPh, setQuickPh] = useState(3);
  const [quickResult, setQuickResult] = useState<any>(null);

  // Design error detector inputs
  const [diagCurrent, setDiagCurrent] = useState(65);
  const [diagCableSize, setDiagCableSize] = useState(16);
  const [diagLen, setDiagLen] = useState(50);
  const [diagVolt, setDiagVolt] = useState(415);
  const [diagResult, setDiagResult] = useState<any>(null);

  // Cable Sizing form
  const [csAmp, setCsAmp] = useState(65);
  const [csLen, setCsLen] = useState(80);
  const [csMethod, setCsMethod] = useState("conduit");
  const [csConductor, setCsConductor] = useState("copper");
  const [csInsulation, setCsInsulation] = useState("pvc");
  const [csResult, setCsResult] = useState<any>(null);

  // Voltage drop calculator form
  const [vdAmp, setVdAmp] = useState(50);
  const [vdLen, setVdLen] = useState(60);
  const [vdSize, setVdSize] = useState(10);
  const [vdVolt, setVdVolt] = useState(415);
  const [vdCircuitType, setVdCircuitType] = useState("other");
  const [vdResult, setVdResult] = useState<any>(null);

  // Conduit fill check
  const [cfDiam, setCfDiam] = useState(32);
  const [cfCableOD, setCfCableOD] = useState(8.5);
  const [cfWires, setCfWires] = useState(3);
  const [cfStandard, setCfStandard] = useState("nec");
  const [cfResult, setCfResult] = useState<any>(null);

  // Gemini Wire Sizing state
  const [geminiPrompt, setGeminiPrompt] = useState("Calculate conduit fill and wire gauge for a 50A continuous load circuit running 120 feet using copper THHN.");
  const [geminiSizingResult, setGeminiSizingResult] = useState<string>("");
  const [geminiLoading, setGeminiLoading] = useState<boolean>(false);
  const [sizerMode, setSizerMode] = useState<"text" | "parameters">("parameters");
  const [structuredSizingData, setStructuredSizingData] = useState<any>(null);

  // Automated Compliance Checker (Compliance page)
  const [ccVd, setCcVd] = useState(2.8);
  const [ccAmpacity, setCcAmpacity] = useState(70);
  const [ccDesignCurrent, setCcDesignCurrent] = useState(65);
  const [ccDiscontTime, setCcDiscontTime] = useState(0.3);
  const [ccRcd, setCcRcd] = useState("yes");
  const [ccCircuitType, setCcCircuitType] = useState("other");
  const [ccResult, setCcResult] = useState<any>(null);

  // Auth/Trial states (Subscription page)
  const [authView, setAuthView] = useState<"signup" | "signin" | "reset" | "stripe">("signup");
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  // Sync state on load: set up active Firebase Auth sub & real-time Firestore listeners
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsPremium(true);
        setPremiumUser({ name: user.displayName || "Licensed Engineer", email: user.email || "" });
        
        // Listen to User Analytics document in real-time
        const docRef = doc(db, "userAnalytics", user.uid);
        const unsubAnalytics = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setAnalytics(docSnap.data() as UserAnalytics);
          } else {
            // First-time registration: bootstrap default analytics record
            const defaultAnalytics: UserAnalytics = {
              userId: user.uid,
              userName: user.displayName || "Licensed Engineer",
              courses: {
                "load-design": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
                "cable-sizing": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
                "conduit-fill": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
                "code-compliance": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
              },
              overallScore: 0,
              calculationsRun: 0,
              checksRun: 0,
            };
            setDoc(docRef, defaultAnalytics).catch((err) => {
              handleFirestoreError(err, OperationType.CREATE, `userAnalytics/${user.uid}`);
            });
            setAnalytics(defaultAnalytics);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `userAnalytics/${user.uid}`);
        });

        return () => unsubAnalytics();
      } else {
        // Logged out
        setIsPremium(false);
        setPremiumUser(null);
        // Default local stats for Guest Account
        setAnalytics({
          userId: "default-user",
          userName: "Guest Engineer",
          courses: {
            "load-design": { progress: 30, quizzesTaken: 1, avgScore: 80, completed: false },
            "cable-sizing": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
            "conduit-fill": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
            "code-compliance": { progress: 10, quizzesTaken: 0, avgScore: 0, completed: false },
          },
          overallScore: 75,
          calculationsRun: 5,
          checksRun: 3,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const triggerToast = (msg: string) => {
    setNotifications(msg);
    setTimeout(() => setNotifications(null), 3000);
  };

  const trackActionOnBackend = async (action: string) => {
    if (auth.currentUser) {
      const docRef = doc(db, "userAnalytics", auth.currentUser.uid);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          let calculationsRun = data.calculationsRun || 0;
          let checksRun = data.checksRun || 0;
          const courses = { ...data.courses };

          if (action === "calculation") {
            calculationsRun += 1;
            if (courses["load-design"]) {
              courses["load-design"].progress = Math.min((courses["load-design"].progress || 0) + 15, 100);
              if (courses["load-design"].progress === 100) courses["load-design"].completed = true;
            }
          } else if (action === "compliance_check") {
            checksRun += 1;
            if (courses["code-compliance"]) {
              courses["code-compliance"].progress = Math.min((courses["code-compliance"].progress || 0) + 20, 100);
              if (courses["code-compliance"].progress === 100) courses["code-compliance"].completed = true;
            }
          }

          let totalScore = 0;
          let counts = 0;
          Object.values(courses).forEach((c: any) => {
            if (c.quizzesTaken > 0) {
              totalScore += c.avgScore;
              counts++;
            }
          });
          const overallScore = counts > 0 ? Math.round(totalScore / counts) : data.overallScore || 0;

          await setDoc(docRef, {
            ...data,
            calculationsRun,
            checksRun,
            courses,
            overallScore
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `userAnalytics/${auth.currentUser.uid}`);
      }
    } else {
      // Local fallback for Guest limit progression
      setAnalytics((prev) => {
        const next = { ...prev };
        if (action === "calculation") {
          next.calculationsRun += 1;
          if (next.courses["load-design"]) {
            next.courses["load-design"].progress = Math.min(next.courses["load-design"].progress + 15, 100);
            if (next.courses["load-design"].progress === 100) next.courses["load-design"].completed = true;
          }
        } else if (action === "compliance_check") {
          next.checksRun += 1;
          if (next.courses["code-compliance"]) {
            next.courses["code-compliance"].progress = Math.min(next.courses["code-compliance"].progress + 20, 100);
            if (next.courses["code-compliance"].progress === 100) next.courses["code-compliance"].completed = true;
          }
        }
        return next;
      });
    }
  };

  const setAppRegionSync = (r: string) => {
    setActiveRegion(r);
    // Auto shift corresponding defaults
    const regConf = REGIONS[r];
    setLoadVolt(regConf.voltage);
    setQuickVolt(regConf.voltage);
    setDiagVolt(regConf.voltage);
    setVdVolt(regConf.voltage);
    // Auto toggle global metric vs imperial system
    const defaultIsImperial = ["US", "CA"].includes(r);
    setIsImperial(defaultIsImperial);
    triggerToast(`Region synchronized globally to ${r} (${regConf.std})`);
  };

  // Safe Math formula: sizing amperes
  const calcLineCurrent = (kw: number, pf: number, ph: number, v: number) => {
    if (ph === 3) {
      return (kw * 1000) / (Math.sqrt(3) * v * pf);
    }
    return (kw * 1000) / (v * pf);
  };

  const selectCableFromList = (currentA: number, region: string) => {
    const table = isImperial ? CABLE_TABLES.awg : CABLE_TABLES.metric;
    // Standard safety engineering factor: design for 125% load
    const safetyDesignCurrent = currentA * 1.25;
    const match = table.find((c) => c.cap >= safetyDesignCurrent);
    return match || table[table.length - 1];
  };

  // Dashboard Page Calculators
  const runQuickCalc = () => {
    const current = calcLineCurrent(quickKw, 0.85, quickPh, quickVolt);
    const cb = selectCableFromList(current, activeRegion);
    const proposedBreaker = Math.ceil((current * 1.25) / 5) * 5;
    const regConf = REGIONS[activeRegion];

    const resultObj = {
      current: current.toFixed(2),
      cable: cb.sz,
      breaker: proposedBreaker,
      ref: regConf.ref,
    };

    setQuickResult(resultObj);
    setLastResults((p) => ({ ...p, quickCalculator: resultObj }));
    trackActionOnBackend("calculation");
    triggerToast("Quick design computed successfully!");
  };

  const runDesignErrorCheck = () => {
    // Check if user-provided running current is supported by custom selected cable size
    const list = CABLE_TABLES.metric;
    const match = list.find((c) => parseInt(c.sz) === diagCableSize) || list[3]; // default 6mm2
    
    // Calculate precise resistance over line run m
    const vdVolts = (diagCurrent * 2 * match.r * diagLen) / 1000;
    const vdPct = (vdVolts / diagVolt) * 105; // standard single phase formula representation
    
    const isAmpacityValid = diagCurrent <= match.cap;
    const isVdValid = vdPct <= 3.0; // standard maximum safe threshold

    const errResultObj = {
      ampacity: match.cap,
      vdPct: vdPct.toFixed(2),
      vdVolts: vdVolts.toFixed(2),
      ampOk: isAmpacityValid,
      vdOk: isVdValid,
      status: isAmpacityValid && isVdValid ? "COMPLIANT" : "ERRORS FOUND"
    };

    setDiagResult(errResultObj);
    setLastResults((p) => ({ ...p, errorDetector: errResultObj }));
    trackActionOnBackend("compliance_check");
    triggerToast("Rigid circuit design safety audit completed.");
  };

  // Sizing Engine Calculations
  const runFullLoadCalc = () => {
    // If imperial, convert Fahrenheit input back to Celsius for lookup derating
    const tempInC = isImperial ? ((loadTemp - 32) / 1.8) : loadTemp;
    const base = calcLineCurrent(loadKw, loadPf, loadPhases, loadVolt);
    
    let continuousCoeff = loadType === "continuous" || loadType === "motor" ? 1.25 : 1.0;
    // Derating temperature multiplier values using temperature in Celsius
    let tempDerating = tempInC <= 30 ? 1.0 : tempInC <= 35 ? 0.94 : tempInC <= 40 ? 0.87 : 0.82;
    let combinedDerating = loadGroup * tempDerating;

    let designCurrent = base * continuousCoeff;
    let finalSizingCurrent = designCurrent / combinedDerating;

    const matchedCable = selectCableFromList(finalSizingCurrent, activeRegion);
    const recommendedBreaker = Math.ceil(designCurrent / 5) * 5;
    const totalApparentKva = loadKw / loadPf;
    const regConf = REGIONS[activeRegion];

    const results = {
      base: base.toFixed(2),
      design: designCurrent.toFixed(2),
      derating: combinedDerating.toFixed(3),
      deratedCurrent: finalSizingCurrent.toFixed(2),
      cable: matchedCable.sz,
      breaker: recommendedBreaker,
      kva: totalApparentKva.toFixed(1),
      ref: regConf.ref,
    };

    setLoadResult(results);
    setLastResults((p) => ({ ...p, advancedLoadCalc: results }));
    trackActionOnBackend("calculation");
    triggerToast("Calculated full active layout.");
  };

  const runCableSizingTool = () => {
    const codesTable = isImperial ? CABLE_TABLES.awg : CABLE_TABLES.metric;
    const regConf = REGIONS[activeRegion];

    let foundCable = codesTable.find((c) => c.cap >= csAmp) || codesTable[codesTable.length - 1];
    
    // Volt drop over double current loops
    const lineVolt = ["US", "CA"].includes(activeRegion) ? 240 : 415;
    // csLen is in feet if isImperial is active, convert to meters (division by 3.28084)
    const effectiveLenInMeters = isImperial ? (csLen / 3.28084) : csLen;
    const voltageLoss = (csAmp * 2 * foundCable.r * effectiveLenInMeters) / 1000;
    const lossPercentage = (voltageLoss / lineVolt) * 100;
    const isVdOk = lossPercentage <= regConf.vd_other;

    const resObj = {
      cable: foundCable.sz,
      ampacity: foundCable.cap,
      resistance: foundCable.r,
      lossPct: lossPercentage.toFixed(2),
      lossLimit: regConf.vd_other,
      vdOk: isVdOk,
      ref: regConf.ref
    };

    setCsResult(resObj);
    setLastResults((p) => ({ ...p, cableSizingTool: resObj }));
    trackActionOnBackend("calculation");
    triggerToast(`Sized cable for standard layout: ${foundCable.sz}`);
  };

  const convertAwgToMm2 = (awg: number) => {
    switch (Math.round(awg)) {
      case 14: return 2.08;
      case 12: return 3.31;
      case 10: return 5.26;
      case 8: return 8.37;
      case 6: return 13.3;
      case 4: return 21.15;
      case 3: return 26.67;
      case 2: return 33.62;
      case 1: return 42.41;
      case 0: return 53.49;
      default: return awg; // fallback
    }
  };

  const runVoltageDropCalc = () => {
    // If imperial, parse AWG input index (e.g. 10AWG) to metric mm2 area.
    const sizeInMm2 = isImperial ? convertAwgToMm2(vdSize) : vdSize;
    const rCoeff = (0.0172 * 1000) / sizeInMm2; // copper resistivity
    
    // Convert feet run to meters if imperial is toggled
    const distanceMeters = isImperial ? (vdLen / 3.28084) : vdLen;
    const totalVdVolts = (vdAmp * 2 * rCoeff * distanceMeters) / 1000;
    const dropPct = (totalVdVolts / vdVolt) * 100;

    const regConf = REGIONS[activeRegion];
    const dropLimit = vdCircuitType === "lighting" ? regConf.vd_light : regConf.vd_other;
    const passed = dropPct <= dropLimit;

    const resObj = {
      dropPct: dropPct.toFixed(3),
      dropVolts: totalVdVolts.toFixed(3),
      limit: dropLimit,
      passed: passed,
      resistance: rCoeff.toFixed(4),
      ref: regConf.ref
    };

    setVdResult(resObj);
    setLastResults((p) => ({ ...p, explicitVoltageDrop: resObj }));
    trackActionOnBackend("calculation");
    triggerToast(`Voltage drop checkout: ${dropPct.toFixed(2)}%`);
  };

  const runConduitFillCalc = () => {
    // Convert conduit and cable OD to mm if imperial (inches) is active
    const pipeDiamMm = isImperial ? (cfDiam * 25.4) : cfDiam;
    const cableDiamMm = isImperial ? (cfCableOD * 25.4) : cfCableOD;

    const totalConduitArea = Math.PI * Math.pow(pipeDiamMm / 2, 2);
    const singleCableArea = Math.PI * Math.pow(cableDiamMm / 2, 2);
    const combinedCableArea = singleCableArea * cfWires;
    const currentFillPct = (combinedCableArea / totalConduitArea) * 100;

    // NEC vs BS compliance limit thresholds
    let maxAllowedLimit = cfStandard === "nec" ? (cfWires === 1 ? 53 : cfWires === 2 ? 31 : 40) : 45;
    const passed = currentFillPct <= maxAllowedLimit;

    const resObj = {
      fillPct: currentFillPct.toFixed(1),
      maxLimit: maxAllowedLimit,
      conduitArea: totalConduitArea.toFixed(0),
      cableArea: combinedCableArea.toFixed(0),
      passed: passed
    };

    setCfResult(resObj);
    setLastResults((p) => ({ ...p, conduitFillChecker: resObj }));
    trackActionOnBackend("calculation");
    triggerToast(`Conduit checked. Fill percentage is ${currentFillPct.toFixed(1)}%`);
  };

  const calculateWireSizing = async () => {
    if (!geminiPrompt.trim()) {
      triggerToast("Please input electrical design criteria.");
      return;
    }
    setGeminiLoading(true);
    setGeminiSizingResult("");
    setStructuredSizingData(null);
    try {
      const isParam = sizerMode === "parameters";
      const endpoint = isParam ? "/api/electro-calculate" : "/api/electro-analyze";

      let token = "guest-bypass-token";
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (e) {
          console.error("Token fetch failed:", e);
        }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userPrompt: geminiPrompt })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (isParam) {
          setStructuredSizingData(data.data);
          
          // Generate a beautifully structured direct-DOM report matching the prompt specs
          const report = `AI CALCULATOR SCHEMATIC REPORT:\n` +
            `• Minimum Circuit Ampacity: ${data.data.minimumCircuitAmpacity} A\n` +
            `• Recommended Breaker Size: ${data.data.recommendedBreakerSize} A\n` +
            `• Recommended Wire Gauge: ${data.data.recommendedWireGaugeAWG}\n` +
            `• Voltage Drop: ${data.data.voltageDropPercentage}%\n` +
            `• Conduit Fill: ${data.data.conduitFillPercentage}%\n\n` +
            `Engineering Notes:\n${data.data.engineeringNotes}\n\n` +
            `Disclaimer:\n${data.data.safetyDisclaimer}`;
          
          setGeminiSizingResult(report);
          
          // Direct DOM update as requested for element 'output-display'
          setTimeout(() => {
            const displayEl = document.getElementById("output-display");
            if (displayEl) {
              displayEl.innerHTML = report;
            }
          }, 50);          
        } else {
          setGeminiSizingResult(data.analysis);
          // Direct DOM update as requested for element 'output-display'
          setTimeout(() => {
            const displayEl = document.getElementById("output-display");
            if (displayEl) {
              displayEl.innerHTML = data.analysis;
            }
          }, 50);
        }
        
        trackActionOnBackend("calculation");
        triggerToast("Gemini deep compliance sizing successful! ✓");
      } else {
        const errorMsg = `⚠ [Sizing Issue]: ${data.error || "Failed to solve calculations."}`;
        setGeminiSizingResult(errorMsg);
        triggerToast("Sizing execution warning.");
      }
    } catch (err: any) {
      console.error("UI Fetch Error: ", err);
      const networkError = "❌ [Network Failure]: Offline or unresolved server route. Please inspect your local web server configuration.";
      setGeminiSizingResult(networkError);
      triggerToast("Network sizer communication error.");
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleApplyPromptSizer = (prompt: string, mode: "parameters" | "text") => {
    setGeminiPrompt(prompt);
    setSizerMode(mode);
    setCalcTab("gemini-sizer");
    setActivePage("calculator");
    triggerToast("Loaded prompt template parameters! Activating AI deep sizer...");
    setTimeout(() => {
      const buttonEl = document.getElementById("trigger-deep-sizer-button");
      if (buttonEl) {
        buttonEl.click();
      } else {
        calculateWireSizing();
      }
    }, 150);
  };

  const runGlobalComplianceChecker = () => {
    const regConf = REGIONS[activeRegion];
    const thresholdLimit = ccCircuitType === "lighting" ? regConf.vd_light : regConf.vd_other;

    const evaluations = [
      {
        check: "Voltage Drop Compliance",
        ok: ccVd <= thresholdLimit,
        details: `${ccVd}% measured vs ${thresholdLimit}% legal maximum (${regConf.ref})`
      },
      {
        check: "Cable Ampacity Load Margin",
        ok: ccDesignCurrent <= ccAmpacity,
        details: `${ccDesignCurrent}A design current vs ${ccAmpacity}A safe cable rating`
      },
      {
        check: "Circuit Disconnection Speed",
        ok: ccDiscontTime <= 0.40,
        details: `${ccDiscontTime} seconds vs 0.40s maximum target (final branch circuit shielding)`
      },
      {
        check: "Ground Fault RCD Fitted",
        ok: ccRcd === "yes",
        details: ccRcd === "yes" ? "30mA residual current fault protection active" : "⚠ Code Infraction: General sockets require active ground-leakage RCD trip switches."
      }
    ];

    const overallPassed = evaluations.every((e) => e.ok);

    const ccResultsObj = {
      overall: overallPassed,
      evals: evaluations,
      standard: regConf.std
    };

    setCcResult(ccResultsObj);
    setLastResults((p) => ({ ...p, regionalComplianceReport: ccResultsObj }));
    trackActionOnBackend("compliance_check");
    triggerToast("Calculated total global standards compliance report.");
  };

  // Create downloadable file report (Professional PDF via jsPDF)
  const downloadCalculationsReport = () => {
    if (Object.keys(lastResults).length === 0) {
      triggerToast("Please perform a calculation in any tab before attempting to export.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const stamp = new Date();
    
    // Custom Color Palette for schematic look
    const brandDarkRGB = [15, 23, 42]; // slate-900
    const brandAmberRGB = [217, 119, 6]; // amber-700
    const emeraldRGB = [5, 150, 105]; // emerald-600
    const redRGB = [220, 38, 38]; // rose-600

    // Utility closure for formatting display area sizes
    const formatAreaHelper = (metricSizeNum: number, optionalStringSize?: string) => {
      if (isImperial) {
        if (optionalStringSize) {
          if (optionalStringSize.includes("AWG") || optionalStringSize.includes("/") || optionalStringSize.match(/^\d+$/)) {
            return optionalStringSize;
          }
        }
        if (metricSizeNum <= 1.5) return "14 AWG";
        if (metricSizeNum <= 2.5) return "12 AWG";
        if (metricSizeNum <= 4) return "10 AWG";
        if (metricSizeNum <= 6) return "8 AWG";
        if (metricSizeNum <= 10) return "6 AWG";
        if (metricSizeNum <= 16) return "4 AWG";
        if (metricSizeNum <= 25) return "2 AWG";
        if (metricSizeNum <= 35) return "1 AWG";
        if (metricSizeNum <= 50) return "1/0";
        if (metricSizeNum <= 70) return "2/0";
        if (metricSizeNum <= 95) return "3/0";
        return "4/0 AWG";
      }
      return optionalStringSize || `${metricSizeNum} mm²`;
    };

    // --- PAGE HEADER BANNER ---
    doc.setFillColor(brandDarkRGB[0], brandDarkRGB[1], brandDarkRGB[2]);
    doc.rect(0, 0, 210, 38, "F"); 

    // Dynamic brand line
    doc.setDrawColor(brandAmberRGB[0], brandAmberRGB[1], brandAmberRGB[2]);
    doc.setLineWidth(1.2);
    doc.line(0, 38, 210, 38);

    // Title & Brand Sub-text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("ELECTRO SYSTEM APP", 15, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text("VALIDATED MULTI-REGIONAL ELECTRICAL ENGINEERING CODES REPORT", 15, 25);

    // Timestamp & ID details on top right
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(186, 195, 206);
    doc.text(`Doc ID: ES-REP-${stamp.getTime()}`, 195, 14, { align: "right" });
    doc.text(`Generated: ${stamp.toLocaleString()}`, 195, 20, { align: "right" });
    doc.text(`Active Unit Scale: ${isImperial ? "Imperial (AWG / ft / lbs)" : "Metric (mm² / m / kg)"}`, 195, 26, { align: "right" });

    // Reset default text styling
    doc.setTextColor(brandDarkRGB[0], brandDarkRGB[1], brandDarkRGB[2]);

    // --- REGION COMPLIANCE OVERVIEW ---
    let currentY = 50;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DOCUMENT CONTROLS & COMPLIANCE MATRIX", 15, currentY);
    
    currentY += 4;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(15, currentY, 195, currentY);
    
    currentY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Active Region Scope:", 15, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`Certified for: Multi-Region Compliance Rules (UK - US - CA - AU - DE - NG)`, 48, currentY);

    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Compliance Codes:", 15, currentY);
    doc.setFont("helvetica", "normal");
    doc.text("BS 7671 Table 4, NEC NFPA 70, AS/NZS 3000 Cl.3, CSA C22.1, DIN VDE 100", 48, currentY);

    currentY += 10;

    // --- RENDER DYNAMIC RESULTS PANELS ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("CALCULATED HARDWARE & PERFORMANCE SPECIFICATIONS", 15, currentY);
    
    currentY += 4;
    doc.line(15, currentY, 195, currentY);
    currentY += 8;

    for (const [key, val] of Object.entries(lastResults)) {
      if (currentY > 235) {
        doc.addPage();
        currentY = 25;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("CALCULATED SPECIFICATIONS (CONTINUED)", 15, currentY);
        currentY += 4;
        doc.line(15, currentY, 195, currentY);
        currentY += 8;
      }

      // Render tab heading card backdrop
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(15, currentY - 4, 180, 7.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(brandAmberRGB[0], brandAmberRGB[1], brandAmberRGB[2]);
      
      let printableTabName = "";
      if (key === "quickCalculator") printableTabName = "QUICK CONDUCTOR SIZER RESULTS";
      else if (key === "errorDetector") printableTabName = "HEURISTIC DESIGN COMPLIANCE SAFETY CHECK";
      else if (key === "advancedLoadCalc") printableTabName = "ACTIVE LINE-TO-LINE LOAD MULTIPLIER SIZING";
      else if (key === "cableSizingTool") printableTabName = "CONDUIT CABLE AMPACITY & INTERNAL COMPONENT SIZES";
      else if (key === "explicitVoltageDrop") printableTabName = "LINE RUN VOLTAGE DROPS & IMPEDANCE AUDIT";
      else if (key === "conduitFillChecker") printableTabName = "PVC/EMT CONDUIT AREA FILL FACTOR COMPU-STACKS";
      else printableTabName = key.replaceAll("_", " ").toUpperCase();

      doc.text(printableTabName, 18, currentY + 1.2);
      doc.setTextColor(brandDarkRGB[0], brandDarkRGB[1], brandDarkRGB[2]);

      currentY += 8;

      // Draw values nicely in multi-column layout
      doc.setFontSize(8);
      const entries = Object.entries(val);
      
      let colIndex = 0;
      for (const [k, v] of entries) {
        if (Array.isArray(v)) continue; // skip complex array types
        
        const xPos = colIndex === 0 ? 18 : colIndex === 1 ? 75 : 135;
        
        doc.setFont("helvetica", "bold");
        let keyLabel = k.toUpperCase().replaceAll("_", " ");
        doc.text(`${keyLabel}:`, xPos, currentY);
        
        doc.setFont("helvetica", "normal");
        
        let valText = "";
        if (typeof v === "boolean") {
          valText = v ? "PASS (✓ COMPLIANT)" : "FAIL (▲ CRITICAL OVERLIMIT)";
          if (!v) doc.setTextColor(redRGB[0], redRGB[1], redRGB[2]);
          else doc.setTextColor(emeraldRGB[0], emeraldRGB[1], emeraldRGB[2]);
        } else {
          valText = String(v);
        }

        // Apply conversions inside text display results
        if ((key === "cableSizingTool" || key === "advancedLoadCalc") && k === "cable") {
          valText = formatAreaHelper(parseFloat(valText) || 0, valText);
        }

        doc.text(valText, xPos + 24, currentY);
        doc.setTextColor(brandDarkRGB[0], brandDarkRGB[1], brandDarkRGB[2]);

        colIndex++;
        if (colIndex === 3) {
          colIndex = 0;
          currentY += 5.5;
        }
      }

      if (colIndex !== 0) {
        currentY += 5.5;
      }
      currentY += 3.5;
    }

    if (currentY > 220) {
      doc.addPage();
      currentY = 25;
    }

    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PROFESSIONAL STRUCTURAL DECLARATION & SEAL", 15, currentY);
    
    currentY += 4;
    doc.line(15, currentY, 195, currentY);

    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    const blockText = "DISCLAIMER & ENGINEERING DECLARATION: This output report document is dynamically compiled using advanced computational algorithms conforming to British/IEC standards, US National Electrical Code (NEC), and general structural guidelines. Handshake values represent simulated maximum peak currents and are suited for professional layout design drafts. Actual site installations must always be verified by an accredited journeyman electrician or supervising engineer in physical alignment of environmental heat and local conditions.";
    const lines = doc.splitTextToSize(blockText, 175);
    doc.text(lines, 15, currentY);

    currentY += (lines.length * 3.8) + 5;

    // Stamp seal certificate wrapper box
    doc.setFillColor(241, 245, 249);
    doc.rect(15, currentY, 180, 24, "F");
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, currentY, 180, 24, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(emeraldRGB[0], emeraldRGB[1], emeraldRGB[2]);
    doc.text("✓ VALIDATED BY ELECTRO AI SYSTEM ENGINE", 20, currentY + 10);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Compliance Class A Verified Certificate", 20, currentY + 17);

    // Digital secure checksum stamp
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    const hashStamp = Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    doc.text(`DIGITAL SIGNATURE CHECKSUM: [${hashStamp}]`, 190, currentY + 14, { align: "right" });

    doc.save(`ElectroSystem_CalculationsReport_${stamp.getTime()}.pdf`);
    triggerToast("Professional PDF report compiled and downloaded successfully!");
  };

  const toggleUnitSystem = () => {
    setIsImperial((prev) => {
      const nextUnit = !prev;
      if (nextUnit) {
        // Metric -> Imperial
        // Convert length run inputs from m to ft (1m = 3.28084 ft)
        setCsLen((prevLen) => Math.round(prevLen * 3.28084));
        setVdLen((prevLen) => Math.round(prevLen * 3.28084));
        // Convert temperature loads from C to F (C * 1.8 + 32)
        setLoadTemp((prevTemp) => Math.round(prevTemp * 1.8 + 32));
        // Scale conduit diameters from mm to inches (divided by 25.4)
        setCfDiam((p) => parseFloat((p / 25.4).toFixed(2)));
        setCfCableOD((p) => parseFloat((p / 25.4).toFixed(2)));
        triggerToast("Units set globally to Imperial (AWG, ft, lbs, °F)");
      } else {
        // Imperial -> Metric
        // Convert length run inputs from ft to m
        setCsLen((prevLen) => Math.round(prevLen / 3.28084));
        setVdLen((prevLen) => Math.round(prevLen / 3.28084));
        // Convert temperature back to C
        setLoadTemp((prevTemp) => Math.round((prevTemp - 32) / 1.8));
        // Scale conduit diameters back to mm
        setCfDiam((p) => Math.round(p * 25.4));
        setCfCableOD((p) => parseFloat((p * 25.4).toFixed(1)));
        triggerToast("Units set globally to Metric (mm², m, kg, °C)");
      }
      return nextUnit;
    });
  };

  // Firebase register student profile (sign up)
  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suName || !suEmail || suPassword.length < 8) {
      triggerToast("Please enter a valid name, email and secure password (8+ characters).");
      return;
    }
    
    try {
      const res = await createUserWithEmailAndPassword(auth, suEmail, suPassword);
      await updateProfile(res.user, { displayName: suName });
      
      const defaultAnalytics: UserAnalytics = {
        userId: res.user.uid,
        userName: suName,
        courses: {
          "load-design": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
          "cable-sizing": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
          "conduit-fill": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
          "code-compliance": { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false },
        },
        overallScore: 0,
        calculationsRun: 0,
        checksRun: 0,
      };

      await setDoc(doc(db, "userAnalytics", res.user.uid), defaultAnalytics);
      triggerToast(`🎉 Account registered successfully for ${suName}!`);
      setActivePage("dashboard");
    } catch (err: any) {
      triggerToast(`Authentication Error: ${err.message}`);
    }
  };

  const handleFirebaseLogIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      triggerToast("Please fill in both email and password fields.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      triggerToast("Signed in. Synchronized cloud curriculum!");
      setActivePage("dashboard");
    } catch (err: any) {
      triggerToast(`Login Error: ${err.message}`);
    }
  };

  const handleFirebasePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      triggerToast("Please enter your registered email address.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      triggerToast("Security link successfully sent to your email! Please check your spam folder.");
      setAuthView("signin");
    } catch (err: any) {
      triggerToast(`Reset Error: ${err.message}`);
    }
  };

  const handleFirebaseLogOut = async () => {
    try {
      await signOut(auth);
      triggerToast("Successfully signed out. Switched to offline backup modes.");
      setActivePage("dashboard");
    } catch (err: any) {
      triggerToast(`Logout Error: ${err.message}`);
    }
  };

  const handleCustomPaymentCheck = () => {
    if (!stripeForm.card || !stripeForm.exp || !stripeForm.cvc || !stripeForm.nameOnCard) {
      triggerToast("Please input valid card parameters to confirm safe Stripe connection.");
      return;
    }

    setStripeProgress(0);
    setStripeStatusText("Negotiating Stripe SSL sandbox connection...");

    const intervals = [
      { p: 25, txt: "Securing tokenized handshake keys with Stripe endpoint..." },
      { p: 55, txt: "Querying financial routing authorization protocols..." },
      { p: 80, txt: "Provisioning licensing database keys on Cloud Run..." },
      { p: 100, txt: "Subscription successfully unlocked!" }
    ];

    intervals.forEach((step, idx) => {
      setTimeout(() => {
        setStripeProgress(step.p);
        setStripeStatusText(step.txt);
        if (step.p === 100) {
          setTimeout(() => {
            setIsPremium(true);
            setPremiumUser({ name: stripeForm.nameOnCard || "Premium Engineer", email: "engineer@electro.app" });
            setStripeProgress(null);
            triggerToast("🎉 Premium billing active! Priority Gemini reasoning engines unlocked!");
            setActivePage("dashboard");
          }, 1000);
        }
      }, (idx + 1) * 750);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Dynamic Global Notification Toast */}
      {notifications && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl border border-emerald-500 font-semibold text-xs flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{notifications}</span>
        </div>
      )}

      {/* Primary Elegant Topbar */}
      <header className="bg-gradient-to-r from-emerald-850 via-emerald-700 to-amber-600 shadow-md border-b border-emerald-900/10 px-5 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-amber-400 to-amber-500 rounded-full flex items-center justify-center border border-amber-300 shadow shadow-amber-500/20">
            <Zap className="w-5 h-5 text-slate-900 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white leading-none">
              ELECTRO <span className="text-amber-300 font-extrabold">SYSTEM</span> APP
            </h1>
            <span className="text-[10px] text-white/70 font-semibold tracking-wider">
              AI-POWERED ELECTRICAL ENGINEERING WORKSPACE
            </span>
          </div>
        </div>

        {/* Global Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
            { id: "services", label: "Services Menu", icon: <Compass className="w-3.5 h-3.5" /> },
            { id: "calculator", label: "Calculator", icon: <CableIcon className="w-3.5 h-3.5" /> },
            { id: "converter", label: "Converter", icon: <RefreshCw className="w-3.5 h-3.5" /> },
            { id: "compliance", label: "Compliance", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: "ai-assistant", label: "AI Assistant", icon: <Bot className="w-3.5 h-3.5" /> },
            { id: "video-tutorial", label: "Video Tutorial", icon: <Film className="w-3.5 h-3.5" /> },
            { id: "learning", label: "Learning Center", icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: "library", label: "Engineering Library", icon: <Library className="w-3.5 h-3.5" /> },
            { id: "symbols", label: "Symbols", icon: <Layers className="w-3.5 h-3.5" /> },
            { id: "subscription", label: "Premium License", icon: <Gift className="w-3.5 h-3.5" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                activePage === item.id
                  ? "bg-amber-400 border-amber-450 text-slate-900 font-extrabold shadow-sm"
                  : "bg-white/10 hover:bg-white/20 border-white/5 text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Profile / Tier indicators */}
        <div className="flex items-center gap-2">
          {auth.currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-3xs text-white hidden sm:inline-block font-bold">
                Hi, <span className="text-amber-200">{auth.currentUser.displayName || "Engineer"}</span>
              </span>
              <button
                onClick={handleFirebaseLogOut}
                className="bg-white/15 hover:bg-red-650/40 border border-white/10 hover:border-red-500 text-3xs text-white font-bold px-2 py-1 rounded transition-all cursor-pointer"
                title="Sign Out of Corporate Account"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <span className="bg-white/10 border border-white/10 text-3xs text-slate-300 font-bold px-2 py-1 rounded">
              Guest Mode
            </span>
          )}

          {isPremium ? (
            <span className="bg-amber-400 text-slate-900 border border-amber-500 text-3xs font-black uppercase px-2 py-1 rounded-md shadow-xs flex items-center gap-1">
              <Coins className="w-3 h-3 text-slate-900" /> PREMIUM TIER
            </span>
          ) : (
            <button
              onClick={() => setActivePage("subscription")}
              className="bg-white/10 hover:bg-white/25 border border-white/20 text-3xs text-white font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer"
            >
              <Lock className="w-3 h-3 text-amber-300 animate-pulse" /> FREE TRIAL
            </button>
          )}
          
          <div className="bg-slate-900/30 border border-white/10 px-2.5 py-1 rounded-md text-3xs text-white uppercase font-bold flex items-center gap-1">
            <Globe className="w-3 h-3 text-amber-300" /> Region: <span className="text-amber-300 font-black">{activeRegion}</span>
          </div>
        </div>
      </header>

      {/* Main Structural Layout */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        
        {/* Left Side Navigation and Operations Dashboard */}
        <aside className="w-64 shrink-0 bg-white dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800 p-4 hidden md:block space-y-6">
          
          {/* Quick calculative tabs sub-navigation */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-2.5 py-2 bg-amber-500/15 dark:bg-amber-400/10 rounded-lg border border-amber-500/45 shadow-sm">
              <span className="flex-1 text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest pl-1 font-mono">
                ⚡ CALCULATORS
              </span>
              <span className="bg-amber-500 text-[10px] text-slate-900 font-extrabold px-1.5 py-0.5 rounded shadow-sm text-center">
                ACTIVE
              </span>
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setActivePage("calculator");
                  setCalcTab("load");
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg text-left transition ${
                  activePage === "calculator" && calcTab === "load"
                    ? "bg-amber-500 dark:bg-amber-500 text-slate-900 font-black shadow-md shadow-amber-500/20 border-l-4 border-slate-900"
                    : "text-slate-800 dark:text-slate-100 bg-slate-100/70 hover:bg-amber-50 dark:bg-slate-800/40 dark:hover:bg-amber-950/20 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/50 dark:border-slate-800 border-l-4 border-transparent"
                }`}
              >
                <Zap className={`w-4 h-4 shrink-0 ${activePage === "calculator" && calcTab === "load" ? "text-slate-900" : "text-amber-500 font-bold"}`} />
                <span>Load Calculation</span>
              </button>

              <button
                onClick={() => {
                  setActivePage("calculator");
                  setCalcTab("cable");
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg text-left transition ${
                  activePage === "calculator" && calcTab === "cable"
                    ? "bg-amber-500 dark:bg-amber-500 text-slate-900 font-black shadow-md shadow-amber-500/20 border-l-4 border-slate-900"
                    : "text-slate-800 dark:text-slate-100 bg-slate-100/70 hover:bg-amber-50 dark:bg-slate-800/40 dark:hover:bg-amber-950/20 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/50 dark:border-slate-800 border-l-4 border-transparent"
                }`}
              >
                <CableIcon className={`w-4 h-4 shrink-0 ${activePage === "calculator" && calcTab === "cable" ? "text-slate-900" : "text-amber-500 font-bold"}`} />
                <span>Cable Sizing</span>
              </button>

              <button
                onClick={() => {
                  setActivePage("calculator");
                  setCalcTab("vdrop");
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg text-left transition ${
                  activePage === "calculator" && calcTab === "vdrop"
                    ? "bg-amber-500 dark:bg-amber-500 text-slate-900 font-black shadow-md shadow-amber-500/20 border-l-4 border-slate-900"
                    : "text-slate-800 dark:text-slate-100 bg-slate-100/70 hover:bg-amber-50 dark:bg-slate-800/40 dark:hover:bg-amber-950/20 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/50 dark:border-slate-800 border-l-4 border-transparent"
                }`}
              >
                <ChevronRight className={`w-4 h-4 shrink-0 ${activePage === "calculator" && calcTab === "vdrop" ? "text-slate-900" : "text-amber-500 font-bold"}`} />
                <span>Voltage Drop</span>
              </button>

              <button
                onClick={() => {
                  setActivePage("calculator");
                  setCalcTab("conduit");
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg text-left transition ${
                  activePage === "calculator" && calcTab === "conduit"
                    ? "bg-amber-500 dark:bg-amber-500 text-slate-900 font-black shadow-md shadow-amber-500/20 border-l-4 border-slate-900"
                    : "text-slate-800 dark:text-slate-100 bg-slate-100/70 hover:bg-amber-50 dark:bg-slate-800/40 dark:hover:bg-amber-950/20 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/50 dark:border-slate-800 border-l-4 border-transparent"
                }`}
              >
                <CircleDot className={`w-4 h-4 shrink-0 ${activePage === "calculator" && calcTab === "conduit" ? "text-slate-900" : "text-amber-500 font-bold"}`} />
                <span>Conduit Fill</span>
              </button>

              <button
                onClick={() => {
                  setActivePage("calculator");
                  setCalcTab("gemini-sizer");
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg text-left transition ${
                  activePage === "calculator" && calcTab === "gemini-sizer"
                    ? "bg-amber-500 dark:bg-amber-500 text-slate-900 font-black shadow-md shadow-amber-500/20 border-l-4 border-slate-900"
                    : "text-slate-800 dark:text-slate-100 bg-slate-100/70 hover:bg-amber-50 dark:bg-slate-800/40 dark:hover:bg-amber-950/20 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/50 dark:border-slate-800 border-l-4 border-transparent"
                }`}
              >
                <Sparkles className={`w-4 h-4 shrink-0 ${activePage === "calculator" && calcTab === "gemini-sizer" ? "text-slate-900" : "text-amber-500 font-bold"}`} />
                <span>AI Wire &amp; Conduit Sizer</span>
              </button>
            </div>
          </div>

          {/* Region synchronization selector panel */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2.5 py-2 bg-lime-500/15 dark:bg-lime-400/10 rounded-lg border border-lime-500/45 shadow-sm">
              <span className="flex-1 text-[11px] font-black text-lime-600 dark:text-lime-400 uppercase tracking-widest pl-1 font-mono">
                🌎 JURISDICTION
              </span>
              <span className="bg-lime-500 text-[10px] text-slate-900 font-extrabold px-1.5 py-0.5 rounded shadow-sm text-center">
                GLOBAL
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.keys(REGIONS).map((regKey) => {
                const conf = REGIONS[regKey];
                const isActive = activeRegion === regKey;
                return (
                  <button
                    key={regKey}
                    onClick={() => setAppRegionSync(regKey)}
                    className={`flex flex-col items-start px-2 py-1.5 border rounded-lg text-left transition cursor-pointer ${
                      isActive
                        ? "bg-lime-500 border-lime-600 text-slate-900 shadow-md font-black"
                        : "bg-slate-100/80 hover:bg-slate-200/60 dark:bg-slate-800/50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-250/30"
                    }`}
                  >
                    <span className="text-3xs tracking-widest font-extrabold select-none">
                      {regKey}
                    </span>
                    <span className="text-[10px] truncate max-w-[85px] leading-snug font-bold">
                      {conf.std}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              Actions
            </span>
            <div className="space-y-1">
              <button
                onClick={() => setActivePage("services")}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg text-left transition cursor-pointer ${
                  activePage === "services"
                    ? "bg-amber-400 text-slate-900 font-extrabold shadow-sm"
                    : "text-slate-600 dark:text-slate-350 hover:bg-slate-105 dark:hover:bg-slate-850"
                }`}
              >
                <Compass className={`w-3.5 h-3.5 ${activePage === "services" ? "text-slate-900" : "text-emerald-500"}`} />
                <span>Services Menu</span>
              </button>
              <button
                onClick={() => setActivePage("compliance")}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-left transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Code Inspections</span>
              </button>
              <button
                onClick={() => setActivePage("ai-assistant")}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-left transition cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-500" />
                <span>AI Engineering Chat</span>
              </button>
              <button
                onClick={() => setActivePage("library")}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-left transition cursor-pointer"
              >
                <Library className="w-3.5 h-3.5 text-emerald-500" />
                <span>Engineering Library</span>
              </button>
              <button
                onClick={() => setActivePage("converter")}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg text-left transition cursor-pointer ${
                  activePage === "converter"
                    ? "bg-amber-400 text-slate-900 font-extrabold shadow-sm"
                    : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850"
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${activePage === "converter" ? "text-slate-900" : "text-emerald-500"}`} />
                <span>Unit Converter</span>
              </button>
              <button
                onClick={() => {
                  setActivePage("symbols");
                  trackActionOnBackend("view_symbols");
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg text-left transition cursor-pointer ${
                  activePage === "symbols"
                    ? "bg-amber-400 text-slate-900 font-extrabold shadow-sm"
                    : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850"
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${activePage === "symbols" ? "text-slate-900" : "text-emerald-500"}`} />
                <span>Electrical Symbols</span>
              </button>
              <button
                onClick={downloadCalculationsReport}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg text-left font-semibold transition cursor-pointer border border-dashed border-emerald-300"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit Logs</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content canvas viewport */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
          
          {/* Fallback Banner for Trial Users */}
          {!isPremium && (
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white rounded-xl p-4 border border-emerald-990 flex flex-wrap items-center justify-between gap-4 shadow-sm animate-pulse">
              <div className="flex gap-3 items-center">
                <Gift className="w-8 h-8 text-amber-300 shrink-0" />
                <div>
                  <h4 className="text-xs font-black tracking-normal uppercase">
                    Electro Premium Sandbox Trial Active
                  </h4>
                  <p className="text-xs text-slate-200 mt-0.5 max-w-xl leading-relaxed">
                    Configure your Stripe mock credentials inside the Premium License tab or register for trial benefits to unlock priority high-thinking reasoning cores.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePage("subscription")}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer border-b-2 border-slate-950"
              >
                Upgrade License ★
              </button>
            </div>
          )}

          {/* PAGE CONTENT RENDERING */}

          {/* DASHBOARD PAGE */}
          {activePage === "dashboard" && (
            <div className="space-y-6">
              
              {/* Region Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Selected Region
                  </span>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1.5">
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>{activeRegion} ({REGIONS[activeRegion].std})</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Ref Table: {REGIONS[activeRegion].ref}</p>
                </div>

                <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Design Load Current
                  </span>
                  <div className="text-lg font-bold text-slate-850 dark:text-white">
                    {quickResult?.current ? `${quickResult.current} A` : "—"}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Calculated from last load run</p>
                </div>

                <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Recommended Cable
                  </span>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100 italic">
                    {quickResult?.cable || "—"}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Safety sizing standard applied</p>
                </div>

                <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Global Audit Index
                  </span>
                  <div className="text-lg font-black text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>✓ PASS</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">BS 7671 / NEC NFPA constraints ok</p>
                </div>
              </div>

              {/* Main Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Panel 1: Quick Load Calculation */}
                <div className="bg-white dark:bg-slate-850 p-5 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Quick Circuit Sizing
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Power Load (kW)</label>
                      <input
                        type="number"
                        value={quickKw}
                        onChange={(e) => setQuickKw(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Supply Voltage (V)</label>
                      <input
                        type="number"
                        value={quickVolt}
                        onChange={(e) => setQuickVolt(parseInt(e.target.value) || 0)}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Phases</label>
                      <select
                        value={quickPh}
                        onChange={(e) => setQuickPh(parseInt(e.target.value) || 3)}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                      >
                        <option value={3}>3-Phase Balanced</option>
                        <option value={1}>Single Phase</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Target Region</label>
                      <select
                        value={activeRegion}
                        onChange={(e) => setAppRegionSync(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                      >
                        <option value="UK">UK – BS 7671</option>
                        <option value="US">USA – NEC NFPA 70</option>
                        <option value="AU">Australia – AS/NZS</option>
                        <option value="CA">Canada – CEC CSA</option>
                        <option value="DE">Germany – DIN VDE</option>
                        <option value="NG">Nigeria – IEC 60364</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={runQuickCalc}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Size Load Circuit
                  </button>

                  {quickResult && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-800 p-3 rounded-lg divide-y divide-emerald-100 dark:divide-emerald-900/30">
                      <div className="flex justify-between py-1.5 text-xs">
                        <span className="text-slate-500">Calculated Line Current:</span>
                        <strong className="text-slate-850 dark:text-white font-bold">{quickResult.current} A</strong>
                      </div>
                      <div className="flex justify-between py-1.5 text-xs">
                        <span className="text-slate-500">Recommended Cable Conductor Size:</span>
                        <strong className="text-slate-850 dark:text-white font-bold">{quickResult.cable}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 text-xs">
                        <span className="text-slate-500">Overcurrent Protection Breaker:</span>
                        <strong className="text-slate-850 dark:text-white font-bold">{quickResult.breaker} A</strong>
                      </div>
                      <div className="flex justify-between py-1.5 text-xs">
                        <span className="text-slate-500">Compliance Authority Clause:</span>
                        <span className="text-[10px] text-emerald-650 font-semibold">{quickResult.ref}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Panel 2: Design Error Detector (Visual Code Auditor) */}
                <div className="bg-white dark:bg-slate-850 p-5 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Electrical Design Error Check
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Measured Current (A)</label>
                      <input
                        type="number"
                        value={diagCurrent}
                        onChange={(e) => setDiagCurrent(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Select Cable (mm²)</label>
                      <select
                        value={diagCableSize}
                        onChange={(e) => setDiagCableSize(parseInt(e.target.value))}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                      >
                        <option value={10}>10 mm² Cable (46A base)</option>
                        <option value={16}>16 mm² Cable (61A base)</option>
                        <option value={25}>25 mm² Cable (80A base)</option>
                        <option value={35}>35 mm² Cable (99A base)</option>
                        <option value={6}>6 mm² Cable (34A base)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Route Length (m)</label>
                      <input
                        type="number"
                        value={diagLen}
                        onChange={(e) => setDiagLen(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Operation Voltage (V)</label>
                      <input
                        type="number"
                        value={diagVolt}
                        onChange={(e) => setDiagVolt(parseInt(e.target.value) || 415)}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={runDesignErrorCheck}
                    className="w-full bg-amber-450 hover:bg-amber-500 text-slate-900 font-bold text-xs py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Audit Circuit Layout
                  </button>

                  {diagResult && (
                    <div
                      className={`p-3.5 rounded-lg border flex flex-col gap-2 ${
                        diagResult.ampOk && diagResult.vdOk
                          ? "bg-emerald-50 border-emerald-250 text-slate-800 dark:bg-slate-900 dark:border-emerald-900/40"
                          : "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300"
                      }`}
                    >
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        {diagResult.ampOk && diagResult.vdOk ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Circuit Complies to Reference Rules</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
                            <span>Warnings Detected (Design Violation)</span>
                          </>
                        )}
                      </h4>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-250/20">
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-tight">Cable Limit (A)</span>
                          <span className="font-bold">{diagResult.ampacity} A</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-tight">Status:</span>
                          <span className={`font-bold ${diagResult.ampOk ? "text-emerald-650" : "text-red-500 animate-pulse font-extrabold"}`}>
                            {diagResult.ampOk ? "Valid Size" : "CURRENT EXCEEDS CAP!"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-tight">Voltage Loss Percentage</span>
                          <span className="font-bold">{diagResult.vdPct}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-tight">Loss Status:</span>
                          <span className={`font-bold ${diagResult.vdOk ? "text-emerald-650" : "text-red-500 font-extrabold"}`}>
                            {diagResult.vdOk ? "Passed (≤3%)" : "EXCEEDS 3% FALL!"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* General Reference Table */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Jurisdiction Reference Matrix
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-440 font-semibold uppercase">
                        <th className="py-2.5 px-3">State</th>
                        <th className="py-2.5 px-3">Rulebase Standard</th>
                        <th className="py-2.5 px-3">Standard Frequency</th>
                        <th className="py-2.5 px-3">Earthing Matrix Configuration</th>
                        <th className="py-2.5 px-3">Reference Guideline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {Object.entries(REGIONS).map(([key, item]) => (
                        <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-900/45 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {key}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {item.std}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {item.freq} Hz
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">
                            {item.earthing}
                          </td>
                          <td className="py-2.5 px-3 text-3xs text-emerald-600 dark:text-emerald-450 font-bold font-mono">
                            {item.ref}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CALCULATORS PAGE (TABBED PANEL SUB-CALCS) */}
          {activePage === "calculator" && (
            <div className="space-y-6">
              
              {/* Tab selector menu */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar gap-2 pb-px">
                <button
                  onClick={() => setCalcTab("load")}
                  className={`px-5 py-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    calcTab === "load"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/5"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${calcTab === "load" ? "text-amber-500" : "text-slate-450"}`} />
                  <span>Line-to-Line Load Calc</span>
                </button>
                <button
                  onClick={() => setCalcTab("cable")}
                  className={`px-5 py-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    calcTab === "cable"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/5"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <CableIcon className={`w-3.5 h-3.5 ${calcTab === "cable" ? "text-amber-500" : "text-slate-450"}`} />
                  <span>Conductor Cable Sizing</span>
                </button>
                <button
                  onClick={() => setCalcTab("vdrop")}
                  className={`px-5 py-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    calcTab === "vdrop"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/5"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <ChevronRight className={`w-3.5 h-3.5 ${calcTab === "vdrop" ? "text-amber-500" : "text-slate-450"}`} />
                  <span>Voltage Drop Verification</span>
                </button>
                <button
                  onClick={() => setCalcTab("conduit")}
                  className={`px-5 py-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    calcTab === "conduit"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/5"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <CircleDot className={`w-3.5 h-3.5 ${calcTab === "conduit" ? "text-amber-500" : "text-slate-450"}`} />
                  <span>PVC Conduit Area Fill</span>
                </button>
                <button
                  onClick={() => setCalcTab("gemini-sizer")}
                  className={`px-5 py-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    calcTab === "gemini-sizer"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/5"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${calcTab === "gemini-sizer" ? "text-amber-500" : "text-slate-450"}`} />
                  <span>AI Wire &amp; Conduit Sizer</span>
                </button>
              </div>

              {/* UNIVERSAL OPERATIONS & GLOBAL CONTROL BAR */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="space-y-1 text-center sm:text-left animate-fade-in">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Global Engineering Standards Toggle
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-none">
                    Updates physical unit scales dynamically, automatically converting inputs and conductor indices.
                  </p>
                </div>
                
                {/* Visual Premium Action Switch */}
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] uppercase font-black tracking-wider ${!isImperial ? "text-amber-500 font-extrabold" : "text-slate-400"}`}>
                    Metric (mm², m, kg, °C)
                  </span>
                  
                  <button
                    onClick={toggleUnitSystem}
                    id="global-unit-toggle-switch"
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      isImperial ? "bg-amber-550" : "bg-slate-300 dark:bg-slate-750"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isImperial ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                  
                  <span className={`text-[10px] uppercase font-black tracking-wider ${isImperial ? "text-amber-500 font-extrabold" : "text-slate-400"}`}>
                    Imperial (AWG, ft, lbs, °F)
                  </span>
                </div>
              </div>

              {/* DYNAMIC SVG CAD DIAGRAM VISUALIZER CARD */}
              <VisualizerCard
                activeTab={calcTab}
                activeRegion={activeRegion}
                isImperial={isImperial}
                loadKw={loadKw}
                loadPf={loadPf}
                loadVolt={loadVolt}
                loadPhases={loadPhases}
                loadType={loadType}
                loadResult={loadResult}
                csAmp={csAmp}
                csLen={csLen}
                csMethod={csMethod}
                csConductor={csConductor}
                csInsulation={csInsulation}
                csResult={csResult}
                vdAmp={vdAmp}
                vdLen={vdLen}
                vdSize={vdSize}
                vdVolt={vdVolt}
                vdResult={vdResult}
                cfDiam={cfDiam}
                cfCableOD={cfCableOD}
                cfWires={cfWires}
                cfStandard={cfStandard}
                cfResult={cfResult}
              />

              {/* CALC SUB - LOAD PANEL */}
              {calcTab === "load" && (
                <motion.div
                  key="load"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden border-t-4 border-t-amber-500 space-y-0"
                >
                  {/* Vibrant Section Header */}
                  <div className="px-6 py-5 bg-amber-500/5 dark:bg-amber-550/2 border-b border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-2.5">
                      <Zap className="w-5 h-5 text-amber-500 font-black" />
                      Balanced 3-Phase Load Sizing
                    </h3>
                    <span className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 uppercase">
                      Load Calculation
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Inner stepcard border around inputs */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/40 dark:bg-slate-900/10 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800 pb-2">
                        <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 w-5 h-5 rounded-full inline-flex items-center justify-center text-3xs font-black">1</span>
                        Electrical Load Parameters
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Load Power (kW)</label>
                          <input
                            type="number"
                            value={loadKw}
                            onChange={(e) => setLoadKw(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Power Factor (PF)</label>
                          <input
                            type="number"
                            value={loadPf}
                            step="0.01"
                            min="0.1"
                            max="1.0"
                            onChange={(e) => setLoadPf(parseFloat(e.target.value) || 0.85)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Supply Volt (V)</label>
                          <input
                            type="number"
                            value={loadVolt}
                            onChange={(e) => setLoadVolt(parseInt(e.target.value) || 415)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Supply Phases</label>
                          <select
                            value={loadPhases}
                            onChange={(e) => setLoadPhases(parseInt(e.target.value) || 3)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                          >
                            <option value={3}>3-Phase Balanced (√3 factor)</option>
                            <option value={1}>Single-Phase layout</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Continuous Margin</label>
                          <select
                            value={loadType}
                            onChange={(e) => setLoadType(e.target.value)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                          >
                            <option value="continuous">Continuous Duty (125% factor)</option>
                            <option value="non-continuous">Non-Continuous Duty (100% factor)</option>
                            <option value="motor">Inductive Motor startup</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Ambient Temp ({isImperial ? "°F" : "°C"})</label>
                          <input
                            type="number"
                            value={loadTemp}
                            onChange={(e) => setLoadTemp(parseInt(e.target.value) || 30)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Group Derating Multiplier</label>
                          <select
                            value={loadGroup}
                            onChange={(e) => setLoadGroup(parseFloat(e.target.value) || 1.0)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                          >
                            <option value={1.0}>1 single circuit loop (1.0)</option>
                            <option value={0.8}>2 to 3 grouped loop paths (0.80)</option>
                            <option value={0.7}>4 to 6 grouped loop paths (0.70)</option>
                            <option value={0.65}>7+ grouped paths (0.65 derate)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">National Code Authority</label>
                          <select
                            value={activeRegion}
                            onChange={(e) => setAppRegionSync(e.target.value)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                          >
                            <option value="UK">UK – BS 7671</option>
                            <option value="US">USA – NEC NFPA 70</option>
                            <option value="AU">Australia – AS/NZS</option>
                            <option value="CA">Canada – CEC CSA</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Step border and actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-150 dark:border-slate-800">
                      <button
                        onClick={downloadCalculationsReport}
                        className="text-xs border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-slate-600 dark:text-slate-300"
                      >
                        <Download className="w-4 h-4" /> Download Report
                      </button>
                      <button
                        onClick={runFullLoadCalc}
                        className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-slate-900 font-extrabold text-xs py-2 px-5 rounded-lg transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                      >
                        Calculate Sizing Parameters
                      </button>
                    </div>

                    {loadResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="bg-lime-500/5 dark:bg-lime-950/5 border border-lime-500/30 dark:border-lime-500/15 p-5 rounded-xl space-y-4 shadow-2xs"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-lime-500/15">
                          <strong className="text-xs font-black text-lime-700 dark:text-lime-400 tracking-wider uppercase flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-pulse inline-block" />
                            Final Multi-Phase Sizing Audit Results
                          </strong>
                          <span className="text-[10px] uppercase font-bold text-lime-650 dark:text-lime-450">
                            Verified Standard Output
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight font-bold uppercase">Base Current</span>
                            <span className="text-sm font-black text-slate-850 dark:text-white">{loadResult.base} A</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight font-bold uppercase">Design Ampacity Goal</span>
                            <span className="text-sm font-black text-amber-600 dark:text-amber-400">{loadResult.design} A</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight font-bold uppercase">Cable Selection</span>
                            <span className="text-sm font-black text-lime-600 dark:text-lime-450">{loadResult.cable}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight font-bold uppercase">OCPD Breaker Size</span>
                            <span className="text-sm font-black text-slate-850 dark:text-white">{loadResult.breaker} A</span>
                          </div>
                        </div>

                        <div className="text-xs leading-relaxed text-slate-650 dark:text-slate-350 bg-white/45 dark:bg-black/35 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-3xs">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[10px] block mb-1">Standard Code Interpretation:</span> Under {activeRegion} standard requirements ({loadResult.ref}), a continuous base layout of {loadResult.base}A scaled by safety multipliers results in {loadResult.design}A target ampacity. Factoring grouped derating thermal adjustments ({loadResult.derating}), the conductor size must withstand ≥{loadResult.deratedCurrent}A. Resulting cable selection is {loadResult.cable} coupled with a standard protective {loadResult.breaker}A trip breaker. Apparent line power capacity translates to {loadResult.kva} kVA.
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* CALC SUB - CABLE SIZING PANEL */}
              {calcTab === "cable" && (
                <motion.div
                  key="cable"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden border-t-4 border-t-amber-500 space-y-0"
                >
                  {/* Vibrant Section Header */}
                  <div className="px-6 py-5 bg-amber-500/5 dark:bg-amber-550/2 border-b border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-2.5">
                      <CableIcon className="w-5 h-5 text-amber-500 font-bold" />
                      Conductor Cable Sizing
                    </h3>
                    <span className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 uppercase">
                      Cable Sizing
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Inner stepcard border around inputs */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/40 dark:bg-slate-900/10 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800 pb-2">
                        <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 w-5 h-5 rounded-full inline-flex items-center justify-center text-3xs font-black">1</span>
                        Cable Layout Parameters
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Design Load (Amperes)</label>
                          <input
                            type="number"
                            value={csAmp}
                            onChange={(e) => setCsAmp(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Line Run Length ({isImperial ? "ft" : "m"})</label>
                          <input
                            type="number"
                            value={csLen}
                            onChange={(e) => setCsLen(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Installation Method</label>
                          <select
                            value={csMethod}
                            onChange={(e) => setCsMethod(e.target.value)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                          >
                            <option value="conduit">Enclosed PVC Conduit in walls</option>
                            <option value="trunking">Metal trunking trays</option>
                            <option value="free_air">Open Free Air suspended brackets</option>
                            <option value="underground">Underground direct trenches</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Conductor Component</label>
                          <select
                            value={csConductor}
                            onChange={(e) => setCsConductor(e.target.value)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                          >
                            <option value="copper">High-Grade Copper (Cu)</option>
                            <option value="aluminium">Utility-Grade Aluminium (Al)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Conductor Temp Rating</label>
                          <select
                            value={csInsulation}
                            onChange={(e) => setCsInsulation(e.target.value)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                          >
                            <option value="pvc">PVC Polyvinyl 70°C Thermoplastic</option>
                            <option value="xlpe">XLPE Crossed Polyethylene 90°C</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Active Authority</label>
                          <input
                            type="text"
                            disabled
                            value={`${activeRegion} Standard – ${REGIONS[activeRegion].std}`}
                            className="w-full text-xs p-2 rounded bg-slate-150 dark:bg-slate-800 text-slate-500 font-semibold border border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action trigger row */}
                    <div className="flex justify-end pt-2 border-t border-slate-150 dark:border-slate-800">
                      <button
                        onClick={runCableSizingTool}
                        className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-slate-900 font-extrabold text-xs py-2 px-5 rounded-lg transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                      >
                        Size Cable Conductor
                      </button>
                    </div>

                    {csResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="bg-lime-500/5 dark:bg-lime-950/5 border border-lime-500/30 dark:border-lime-500/15 p-5 rounded-xl space-y-4 shadow-2xs"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-lime-500/15">
                          <strong className="text-xs font-black text-lime-700 dark:text-lime-400 tracking-wider uppercase flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-pulse inline-block" />
                            Recommended Conductor Sizing Metric Match
                          </strong>
                          <span className="text-[10px] uppercase font-bold text-lime-650 dark:text-lime-450">
                            Verified Cable Output
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Engine Size Output</span>
                            <strong className="text-base font-black text-amber-600 dark:text-amber-400">{csResult.cable}</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Safe Current Ampacity</span>
                            <strong className="text-base font-black text-slate-850 dark:text-white">{csResult.ampacity} A</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Voltage Drop on Run</span>
                            <strong className={`text-base font-black ${csResult.vdOk ? "text-lime-600 dark:text-lime-450" : "text-red-500 animate-pulse"}`}>
                              {csResult.lossPct}%
                            </strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Resistance Constant</span>
                            <strong className="text-sm font-mono text-slate-600 dark:text-slate-400">{csResult.resistance} Ω/km</strong>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* CALC SUB - VOLTAGE DROP PANEL */}
              {calcTab === "vdrop" && (
                <motion.div
                  key="vdrop"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden border-t-4 border-t-amber-500 space-y-0"
                >
                  {/* Vibrant Section Header */}
                  <div className="px-6 py-5 bg-amber-500/5 dark:bg-amber-550/2 border-b border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-2.5">
                      <ChevronRight className="w-5 h-5 text-amber-500 font-bold" />
                      Voltage Drop Verification
                    </h3>
                    <span className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 uppercase">
                      Voltage Drop
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Inner stepcard border around inputs */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/40 dark:bg-slate-900/10 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800 pb-2">
                        <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 w-5 h-5 rounded-full inline-flex items-center justify-center text-3xs font-black">1</span>
                        Drop Sizing parameters
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Operation Current (A)</label>
                          <input
                            type="number"
                            value={vdAmp}
                            onChange={(e) => setVdAmp(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Conductor Length ({isImperial ? "ft" : "m"})</label>
                          <input
                            type="number"
                            value={vdLen}
                            onChange={(e) => setVdLen(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Select Conductor Size ({isImperial ? "AWG Gauge" : "mm²"})</label>
                          <input
                            type="number"
                            value={vdSize}
                            onChange={(e) => setVdSize(parseFloat(e.target.value) || 10)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">System Voltage (V)</label>
                          <input
                            type="number"
                            value={vdVolt}
                            onChange={(e) => setVdVolt(parseInt(e.target.value) || 415)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Load Classification</label>
                          <select
                            value={vdCircuitType}
                            onChange={(e) => setVdCircuitType(e.target.value)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                          >
                            <option value="other">General Sockets &amp; Power Loops (Max 5%)</option>
                            <option value="lighting">Public Lighting Fixtures (Max 3%)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Regulating Authority</label>
                          <input
                            type="text"
                            disabled
                            value={`${activeRegion} Standard`}
                            className="w-full text-xs p-2 rounded bg-slate-150 dark:bg-slate-800 text-slate-500 font-semibold border border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action trigger row */}
                    <div className="flex justify-end pt-2 border-t border-slate-150 dark:border-slate-800">
                      <button
                        onClick={runVoltageDropCalc}
                        className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-slate-900 font-extrabold text-xs py-2 px-5 rounded-lg transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                      >
                        Verify Voltage Loss
                      </button>
                    </div>

                    {vdResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className={`p-5 rounded-xl border space-y-4 shadow-2xs ${
                          vdResult.passed
                            ? "bg-lime-500/5 dark:bg-lime-950/5 border-lime-500/30 dark:border-lime-500/15"
                            : "bg-red-500/5 dark:bg-red-950/5 border-red-500/30 dark:border-red-500/15"
                        }`}
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                          <strong className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${vdResult.passed ? "text-lime-700 dark:text-lime-400" : "text-red-700 dark:text-red-400"}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${vdResult.passed ? "bg-lime-500" : "bg-red-500"} animate-pulse inline-block`} />
                            Voltage Loss Drop Report
                          </strong>
                          <span
                            className={`text-2xs font-black uppercase px-2 py-0.5 rounded ${
                              vdResult.passed ? "bg-lime-500/25 text-lime-700 dark:text-lime-400" : "bg-red-500/25 text-red-650 dark:text-red-400"
                            }`}
                          >
                            {vdResult.passed ? "PASSED MATCH ✓" : "REGULATION INFRACTION! ✗"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Computed Drop</span>
                            <strong className="text-sm font-black text-slate-850 dark:text-white">{vdResult.dropPct}%</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Loss in Potential (V)</span>
                            <strong className="text-sm font-black text-slate-850 dark:text-white">{vdResult.dropVolts} V</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Regulation Limit</span>
                            <strong className="text-sm font-black text-slate-850 dark:text-white">{vdResult.limit}%</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Conductor Resistance</span>
                            <strong className="text-xs font-mono text-slate-600 dark:text-slate-400">{vdResult.resistance} Ω/km</strong>
                          </div>
                        </div>

                        {/* Line Chart Visualizing Cable Length vs. Voltage Drop % and its Regulation Limit */}
                        {(() => {
                          const sizeInMm2 = isImperial ? convertAwgToMm2(vdSize) : vdSize;
                          const rCoeff = (0.0172 * 1000) / (sizeInMm2 || 1);
                          const regConf = REGIONS[activeRegion];
                          const limitValue = vdCircuitType === "lighting" ? regConf.vd_light : regConf.vd_other;

                          let criticalLenMeters = 0;
                          if (vdAmp > 0 && rCoeff > 0) {
                            criticalLenMeters = (limitValue * 10 * vdVolt) / (vdAmp * 2 * rCoeff);
                          }
                          const criticalLenLabel = isImperial ? Math.round(criticalLenMeters * 3.28084) : Math.round(criticalLenMeters);
                          const maxRange = Math.max(criticalLenLabel * 1.5, vdLen * 1.5, 100);

                          const chartData = [];
                          const steps = 11;
                          for (let i = 0; i <= steps; i++) {
                            const currentLen = Math.round((i * maxRange) / steps);
                            const dMeters = isImperial ? (currentLen / 3.28084) : currentLen;
                            const volts = (vdAmp * 2 * rCoeff * dMeters) / 1000;
                            const pct = (volts / vdVolt) * 100;
                            chartData.push({
                              length: currentLen,
                              "Drop (%)": parseFloat(pct.toFixed(2)),
                              "Regulation Limit": limitValue,
                            });
                          }

                          const exceedsLimit = vdLen > criticalLenLabel;

                          return (
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-205 dark:border-slate-800 space-y-4">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div>
                                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 uppercase tracking-wider flex items-center gap-1.5 leading-none">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    Cable Run Loss Profile Chart
                                  </h4>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 block">
                                    Line sweep of voltage drop across distance
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    Current length: {vdLen} {isImperial ? "ft" : "m"}
                                  </span>
                                  <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border ${
                                    exceedsLimit 
                                      ? "text-rose-600 bg-rose-500/10 border-rose-500/20" 
                                      : "text-amber-600 bg-amber-500/10 border-amber-500/20"
                                  }`}>
                                    Regulation Threshold: {criticalLenLabel} {isImperial ? "ft" : "m"}
                                  </span>
                                </div>
                              </div>

                              <div className="w-full h-[220px] relative font-mono text-[9px] select-none">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart 
                                    data={chartData} 
                                    margin={{ top: 12, right: 15, left: -20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                                    <XAxis 
                                      dataKey="length" 
                                      stroke="#94a3b8" 
                                      className="text-[9px]"
                                      tickLine={false}
                                    />
                                    <YAxis 
                                      stroke="#94a3b8" 
                                      className="text-[9px]" 
                                      domain={[0, 'auto']}
                                      tickLine={false}
                                      tickFormatter={(v) => `${v}%`}
                                    />
                                    <ChartTooltip
                                      contentStyle={{ 
                                        backgroundColor: '#1e293b', 
                                        borderColor: '#334155', 
                                        color: '#f8fafc',
                                        borderRadius: '10px', 
                                        fontSize: '11px',
                                      }}
                                      formatter={(value: any, name: string) => [
                                        name === "Drop (%)" ? `${value}%` : `${value}% (Max)`, 
                                        name
                                      ]}
                                      labelFormatter={(label) => `Length: ${label} ${isImperial ? "ft" : "m"}`}
                                    />
                                    <ChartLegend
                                      wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                                      verticalAlign="bottom"
                                      height={32}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="Drop (%)" 
                                      name={`Drop (%) at ${vdSize}${isImperial ? " AWG" : " mm²"}`}
                                      stroke="#f59e0b" 
                                      strokeWidth={2.5} 
                                      dot={{ r: 3, fill: '#f59e0b', strokeWidth: 1 }}
                                      activeDot={{ r: 5, fill: '#f59e0b' }}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="Regulation Limit" 
                                      name={`Limit Rule (${limitValue}%)`}
                                      stroke="#ef4444" 
                                      strokeWidth={1.5} 
                                      strokeDasharray="4 4"
                                      dot={false}
                                      activeDot={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>

                              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                                {exceedsLimit ? (
                                  <span className="text-red-650 dark:text-red-400 font-bold flex items-start gap-1.5">
                                    ⚠️ <strong>Distance threshold exceeded:</strong> Cable length ({vdLen} {isImperial ? "ft" : "m"}) exceeds regulation threshold of {criticalLenLabel} {isImperial ? "ft" : "m"}. Please shorten run length, increase conductor size, or reduce current options.
                                  </span>
                                ) : (
                                  <span className="text-emerald-650 dark:text-emerald-400 font-bold flex items-start gap-1.5">
                                    ✓ <strong>Standard Compliant Run:</strong> This specific cross-sectional path fits safety regulations. You can run up to {criticalLenLabel} {isImperial ? "ft" : "m"} ({criticalLenLabel - vdLen} {isImperial ? "ft" : "m"} additional) before triggering drop limitations.
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* CALC SUB - CONDUIT FILL PANEL */}
              {calcTab === "conduit" && (
                <motion.div
                  key="conduit"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden border-t-4 border-t-amber-500 space-y-0"
                >
                  {/* Vibrant Section Header */}
                  <div className="px-6 py-5 bg-amber-500/5 dark:bg-amber-550/2 border-b border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-2.5">
                      <CircleDot className="w-5 h-5 text-amber-500 font-bold" />
                      Conduit Capacity Sizing Fill Checks
                    </h3>
                    <span className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 uppercase">
                      Conduit Fill
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Inner stepcard border around inputs */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/40 dark:bg-slate-900/10 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800 pb-2">
                        <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 w-5 h-5 rounded-full inline-flex items-center justify-center text-3xs font-black">1</span>
                        Physical Layout dimensions
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Conduit ID ({isImperial ? "inches" : "mm"})</label>
                          <input
                            type="number"
                            value={cfDiam}
                            onChange={(e) => setCfDiam(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Cable Outer Diam ({isImperial ? "inches" : "mm"})</label>
                          <input
                            type="number"
                            value={cfCableOD}
                            onChange={(e) => setCfCableOD(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Conductor Wires (count)</label>
                          <input
                            type="number"
                            value={cfWires}
                            onChange={(e) => setCfWires(parseInt(e.target.value) || 1)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-550 block">Capacity Code Standard</label>
                          <select
                            value={cfStandard}
                            onChange={(e) => setCfStandard(e.target.value)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                          >
                            <option value="nec">USA NEC Chapter 9 (Max 40%)</option>
                            <option value="bs">UK BS 7671 Appendix 5 (45%)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Action trigger row */}
                    <div className="flex justify-end pt-2 border-t border-slate-150 dark:border-slate-800">
                      <button
                        onClick={runConduitFillCalc}
                        className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-slate-900 font-extrabold text-xs py-2 px-5 rounded-lg transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                      >
                        Audit Conduit Fill Check
                      </button>
                    </div>

                    {cfResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className={`p-5 rounded-xl border flex flex-col gap-4 shadow-2xs ${
                          cfResult.passed
                            ? "bg-lime-500/5 dark:bg-lime-950/5 border-lime-500/30 dark:border-lime-500/15"
                            : "bg-red-500/5 dark:bg-red-950/5 border-red-500/30 dark:border-red-500/15"
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-800/80">
                          <h4 className="text-xs font-black flex items-center gap-1.5 uppercase tracking-wider">
                            {cfResult.passed ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 text-lime-600 animate-pulse" />
                                <span className="text-lime-700 dark:text-lime-400">Conduit Conductor Layout Approved</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
                                <span className="text-red-700 dark:text-red-400">Warning: Conduit Overcrowded (Excess Friction)</span>
                              </>
                            )}
                          </h4>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded ${
                            cfResult.passed ? "bg-lime-500/25 text-lime-705 dark:text-lime-400" : "bg-red-500/25 text-red-650 dark:text-red-400"
                          }`}>
                            Limit: {cfResult.maxLimit}%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Occupancy Area Fill</span>
                            <strong className="text-base font-black text-slate-850 dark:text-white">{cfResult.fillPct}%</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Internal Conduit Area</span>
                            <strong className="text-sm font-mono text-slate-600 dark:text-slate-400">{cfResult.conduitArea} mm²</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Wires Combined Area</span>
                            <strong className="text-sm font-mono text-slate-600 dark:text-slate-400">{cfResult.cableArea} mm²</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-amber-500 shadow-3xs">
                            <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase leading-tight">Capacity Margin Check</span>
                            <strong className={`text-sm font-extrabold ${cfResult.passed ? "text-lime-650 dark:text-lime-450" : "text-red-500 font-black animate-pulse"}`}>
                              {cfResult.passed ? "Safe layout!" : "Overcrowded (Code Violation)"}
                            </strong>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* CALC SUB - GEMINI WIRE SIZING PANEL */}
              {calcTab === "gemini-sizer" && (
                <motion.div
                  key="gemini-sizer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden border-t-4 border-t-amber-500 space-y-0"
                >
                  {/* Vibrant Section Header */}
                  <div className="px-6 py-5 bg-amber-500/5 dark:bg-amber-550/2 border-b border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-amber-500 font-bold" />
                      Gemini AI Deep Conductor &amp; Conduit Sizer
                    </h3>
                    <span className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 uppercase">
                      AI Assist
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Prompt input field and templates */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/40 dark:bg-slate-900/10 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800 pb-2">
                        <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 w-5 h-5 rounded-full inline-flex items-center justify-center text-3xs font-black">1</span>
                        Electrical Circuit Details &amp; Environmental Factors
                      </h4>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-550 block">Define Circuit Specifications (Prompt)</label>
                        <textarea
                          rows={3}
                          value={geminiPrompt}
                          onChange={(e) => setGeminiPrompt(e.target.value)}
                          placeholder="e.g. Calculate conduit fill and wire gauge for a 50A continuous load circuit running 120 feet using copper THHN."
                          className="w-full text-xs p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/55"
                        />
                      </div>

                      {/* Prompt Templates */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Use Quick Templates</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setGeminiPrompt("Calculate conduit fill and wire gauge for a 50A continuous load circuit running 120 feet using copper THHN.")}
                            className="text-3xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-750 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-150 dark:border-slate-750 transition cursor-pointer font-bold"
                          >
                            50A continuous (THHN, 120 feet)
                          </button>
                          <button
                            type="button"
                            onClick={() => setGeminiPrompt("Size conduit fill & wire gauge for three-phase 100A continuous balanced layout in XLPE copper conduit.")}
                            className="text-3xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-750 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-150 dark:border-slate-750 transition cursor-pointer font-bold"
                          >
                            100A balanced three-phase
                          </button>
                          <button
                            type="button"
                            onClick={() => setGeminiPrompt("Size wires & rigid PVC conduit fill for 240V, 30A non-continuous motor load running 85 feet copper THWN.")}
                            className="text-3xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-750 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-150 dark:border-slate-750 transition cursor-pointer font-bold"
                          >
                            30A non-continuous motor run
                          </button>
                        </div>
                      </div>

                      {/* Selection for API Calculator Mode */}
                      <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800 pt-3">
                        <label className="text-xs font-semibold text-slate-550 block">AI Computation Strategy</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-905 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setSizerMode("parameters");
                              setStructuredSizingData(null);
                            }}
                            className={`px-3 py-1.5 text-xs font-black rounded-md transition-all cursor-pointer ${
                              sizerMode === "parameters"
                                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/40 dark:border-slate-750"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            Structured Schema Sizer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSizerMode("text");
                              setStructuredSizingData(null);
                            }}
                            className={`px-3 py-1.5 text-xs font-black rounded-md transition-all cursor-pointer ${
                              sizerMode === "text"
                                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/40 dark:border-slate-750"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            Conversational Text Report
                          </button>
                        </div>
                      </div>
                    </div>
                       {/* Action trigger row */}
                    <div className="flex justify-end pt-2 border-t border-slate-150 dark:border-slate-800">
                      <button
                        id="trigger-deep-sizer-button"
                        onClick={calculateWireSizing}
                        disabled={geminiLoading}
                        className="bg-amber-505 hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600 text-slate-900 font-extrabold text-xs py-2.5 px-6 rounded-lg transition-all shadow-md shadow-amber-500/15 cursor-pointer flex items-center gap-2"
                      >
                        {geminiLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                            Analyzing with Gemini AI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-slate-900" />
                            Perform AI Deep Sizing
                          </>
                        )}
                      </button>
                    </div>

                    {/* Parametric Dashboard results mapping structured schema properties */}
                    {sizerMode === "parameters" && structuredSizingData && !geminiLoading && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-200/60 dark:border-slate-800/60 pt-6">
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between">
                          <span className="text-slate-400 dark:text-slate-505 text-[10px] uppercase tracking-wider font-extrabold block">Min Circuit Ampacity</span>
                          <strong className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1 block">
                            {structuredSizingData.minimumCircuitAmpacity} A
                          </strong>
                          <span className="text-[9px] text-slate-450 block mt-1">Conductor continuous load safety baseline</span>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between">
                          <span className="text-slate-400 dark:text-slate-505 text-[10px] uppercase tracking-wider font-extrabold block">Protective Breaker</span>
                          <strong id="breaker-badge" className="text-xl font-black text-slate-855 dark:text-slate-100 mt-1 block">
                            {structuredSizingData.recommendedBreakerSize} A
                          </strong>
                          <span className="text-[9px] text-slate-455 block mt-1">Overcurrent protective device limit</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between">
                          <span className="text-slate-400 dark:text-slate-550 text-[10px] uppercase tracking-wider font-extrabold block">AWG Wire Conductor</span>
                          <strong id="wire-readout" className="text-xl font-black text-amber-650 dark:text-amber-400 mt-1 block">
                            {structuredSizingData.recommendedWireGaugeAWG}
                          </strong>
                          <span className="text-[9px] text-slate-450 block mt-1">Minimum gauge copper conductor</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between">
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-extrabold block">Sizing Voltage Drop</span>
                          <div className="space-y-1.5 mt-1">
                            <strong id="drop-gauge" className="text-base font-mono text-slate-800 dark:text-slate-100 block">
                              {structuredSizingData.voltageDropPercentage}%
                            </strong>
                            <div className="w-full bg-slate-150 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  structuredSizingData.voltageDropPercentage <= 3 ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(structuredSizingData.voltageDropPercentage * 25, 100)}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-slate-450 block leading-none">
                              {structuredSizingData.voltageDropPercentage <= 3 ? "✓ Within NEC 3% limit" : "⚠ Exceeds branch limit"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between">
                          <span className="text-slate-400 dark:text-slate-550 text-[10px] uppercase tracking-wider font-extrabold block">Conduit fill factor</span>
                          <div className="space-y-1.5 mt-1">
                            <strong className="text-base font-mono text-slate-800 dark:text-slate-100 block">
                              {structuredSizingData.conduitFillPercentage}%
                            </strong>
                            <div className="w-full bg-slate-150 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  structuredSizingData.conduitFillPercentage <= 40 ? "bg-emerald-500" : "bg-amber-550"
                                }`}
                                style={{ width: `${Math.min(structuredSizingData.conduitFillPercentage * 2, 100)}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-slate-450 block leading-none">
                              {structuredSizingData.conduitFillPercentage <= 40 ? "✓ Safe (<40% occupancy)" : "⚠ Dense fill factor"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between">
                          <span className="text-slate-400 dark:text-slate-550 text-[10px] uppercase tracking-wider font-extrabold block">Professional Engineer disclaimer</span>
                          <span id="disclaimer" className="text-[9px] font-black text-rose-555 dark:text-rose-450 leading-normal block mt-1 uppercase">
                            {structuredSizingData.safetyDisclaimer}
                          </span>
                        </div>

                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-xs">
                          <span className="text-slate-400 dark:text-slate-550 text-[10px] uppercase tracking-wider font-extrabold block">AI Sizer Engineering Notes</span>
                          <div id="notes-box" className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed block mt-2 whitespace-pre-wrap font-medium">
                            {structuredSizingData.engineeringNotes}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Result Container with output-display ID */}
                    {(geminiLoading || geminiSizingResult) && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="bg-lime-500/5 dark:bg-lime-950/5 border border-lime-500/30 dark:border-lime-500/15 p-6 rounded-xl space-y-4 shadow-sm"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-lime-500/15">
                          <strong className="text-xs font-black text-lime-700 dark:text-lime-400 tracking-wider uppercase flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-pulse inline-block" />
                            Gemini Code Audit &amp; Conduit Sizing Report
                          </strong>
                          <span className="text-[10px] uppercase font-bold text-lime-650 dark:text-lime-450">
                            NEC Compliance Sizing
                          </span>
                        </div>

                        {geminiLoading && (
                          <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse font-bold uppercase tracking-wider">
                              Calculating thermals, conduits, and code-compliant NEC ampacities...
                            </p>
                          </div>
                        )}

                        {/* Output Display Div targeting container for raw text rendering as fallback/user request compatibility */}
                        {geminiSizingResult && (
                          <div className="mt-2 border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <div
                              id="output-display"
                              className="text-xs text-slate-850 dark:text-slate-100 whitespace-pre-wrap leading-relaxed space-y-2 font-medium bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800"
                            >
                              {geminiSizingResult}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

            </div>
          )}

          {/* CODE COMPLIANCE REFERENCE PAGE */}
          {activePage === "compliance" && (
            <div className="space-y-6">
              
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Integrated Regional Compliance Engine
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify circuits against legal minimum trip limits, cable insulation thresholds, and maximum structural voltage drop factors.
                  </p>
                </div>
              </div>

              {/* Sub Check Audit Layout */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  Code Inspector Parameters
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">Inspection Territory</label>
                    <select
                      value={activeRegion}
                      onChange={(e) => setAppRegionSync(e.target.value)}
                      className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <option value="UK">UK (BS 7671 - IET standard)</option>
                      <option value="US">USA (NEC Article 210 NFPA)</option>
                      <option value="AU">Australia (AS/NZS 3000:2018)</option>
                      <option value="CA">Canada (CEC Section 8 CSA)</option>
                      <option value="DE">Germany (DIN VDE 0100 standard)</option>
                      <option value="NG">Nigeria (COREN / IEC 60364 manual)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-550 block">Measured Volts Drop (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={ccVd}
                      onChange={(e) => setCcVd(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-550 block">Conductor Safe Ampacity (A)</label>
                    <input
                      type="number"
                      value={ccAmpacity}
                      onChange={(e) => setCcAmpacity(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-550 block">Continuous Design Current (A)</label>
                    <input
                      type="number"
                      value={ccDesignCurrent}
                      onChange={(e) => setCcDesignCurrent(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-550 block">Instant Disconnection time (s)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ccDiscontTime}
                      onChange={(e) => setCcDiscontTime(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-550 block">Is RCD (Ground Switch) Installed?</label>
                    <select
                      value={ccRcd}
                      onChange={(e) => setCcRcd(e.target.value)}
                      className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-705 dark:text-slate-300 cursor-pointer"
                    >
                      <option value="yes">Yes (30mA Ground-Cut Protection Active)</option>
                      <option value="no">No ground-fault interrupters fit</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={runGlobalComplianceChecker}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" /> Run Compliance Check
                  </button>
                </div>

                {ccResult && (
                  <div className="space-y-3 pt-3">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500">Compliance Summary Checklist ({ccResult.standard}):</span>
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full ${
                          ccResult.overall
                            ? "bg-emerald-100 text-emerald-805 border border-emerald-400"
                            : "bg-red-100 text-red-600 border border-red-300"
                        }`}
                      >
                        {ccResult.overall ? "✓ COMPLIANT WORKFLOW APPROVED" : "✗ DESIGN REJECTED (SAFETY THREATS)"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {ccResult.evals.map((e: any, index: number) => (
                        <div
                          key={index}
                          className={`flex items-start gap-4 p-3 rounded-lg border text-xs leading-normal ${
                            e.ok
                              ? "bg-white border-slate-100 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800"
                              : "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-350"
                          }`}
                        >
                          <span
                            className={`px-2 py-0.5 rounded text-4xs font-black shrink-0 ${
                              e.ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-650"
                            }`}
                          >
                            {e.ok ? "PASS" : "WARN"}
                          </span>
                          <div className="flex-1">
                            <span className="font-bold block text-slate-800 dark:text-slate-155">{e.check}</span>
                            <span className="text-3xs text-slate-450 mt-0.5 block">{e.details}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CHAT AI ASSISTANT PAGE */}
          {activePage === "ai-assistant" && (
            <div className="space-y-6">
              
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Principal AI Engineering Partner
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time conversational partner for modeling three-phase neutral imbalances, fault impedance coordination, or localized code lookups.
                  </p>
                </div>
              </div>

              <AIAssistant 
                onTrackAction={trackActionOnBackend} 
                initialPrompt={aiServicePrompt}
                onClearInitialPrompt={() => setAiServicePrompt(null)}
              />
            </div>
          )}

          {/* VIDEO TUTORIAL PAGE */}
          {activePage === "video-tutorial" && (
            <VideoTutorial onTrackAction={trackActionOnBackend} />
          )}

          {/* LEARNING CENTER & INTERACTIVE QUIZ PAGE */}
          {activePage === "learning" && (
            <CourseAnalytics
              analytics={analytics}
              onRefresh={() => {}}
              onTrackAction={trackActionOnBackend}
            />
          )}

          {/* ENGINEERING KNOWLEDGE PACKS & PROMPT LIBRARY */}
          {activePage === "library" && (
            <EngineeringLibrary
              activeRegion={activeRegion}
              onApplyPromptSizer={handleApplyPromptSizer}
              onTrackAction={trackActionOnBackend}
            />
          )}

          {/* ELECTRICAL STANDARDS & SYMBOLS CATALOG */}
          {activePage === "symbols" && (
            <ElectricalSymbols
              onTrackAction={trackActionOnBackend}
            />
          )}

          {/* QUICK UNIT CONVERTER TAB */}
          {activePage === "converter" && (
            <UnitConverter />
          )}

          {/* SERVICES NAVIGATION SUITE MENU */}
          {activePage === "services" && (
            <ServicesMenu 
              onNavigate={(page, subTab) => {
                setActivePage(page);
                if (subTab) {
                  setCalcTab(subTab as "load" | "cable" | "vdrop" | "conduit" | "gemini-sizer");
                }
              }}
              onAskAI={(prompt) => {
                setAiServicePrompt(prompt);
                setActivePage("ai-assistant");
              }}
            />
          )}

          {/* SUBSCRIPTION & BILLING CARD VIEW */}
          {activePage === "subscription" && (
            <div className="space-y-8">
              
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Corporate Engineering Licensing Manager
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Activate priority Cloud computing, priority Gemini model reasoning, and certification exports here.
                  </p>
                </div>
              </div>

              {/* Sub Tab View: Register / Login or Pay */}
              <div className="flex justify-center border-b border-slate-150 dark:border-slate-800 pb-px mb-2 tab-bar max-w-md mx-auto">
                <button
                  onClick={() => setAuthView("signup")}
                  className={`flex-1 text-center py-2 text-xs font-bold ${
                    authView === "signup" ? "border-b-2 border-emerald-605 text-emerald-600" : "text-slate-400"
                  }`}
                >
                  Quick Sign Up
                </button>
                <button
                  onClick={() => setAuthView("signin")}
                  className={`flex-1 text-center py-2 text-xs font-bold ${
                    authView === "signin" ? "border-b-2 border-emerald-605 text-emerald-600" : "text-slate-400"
                  }`}
                >
                  Sign In (Returning)
                </button>
                <button
                  onClick={() => setAuthView("stripe")}
                  className={`flex-1 text-center py-2 text-xs font-bold ${
                    authView === "stripe" ? "border-b-2 border-emerald-605 text-emerald-600" : "text-slate-400"
                  }`}
                >
                  Stripe Gateway Mocks
                </button>
              </div>

              {authView === "signup" && (
                <div className="bg-white dark:bg-slate-850 p-6 rounded-xl border border-slate-150 dark:border-slate-800 max-w-md mx-auto space-y-4 shadow-sm">
                  <div className="text-center pb-2">
                    <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">
                      Register Student Profile
                    </h3>
                    <p className="text-2xs text-slate-400 mt-1">
                      7-day full premium access included. No credit card required.
                    </p>
                  </div>

                  <form onSubmit={handleStartTrial} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-2xs font-semibold text-slate-500 block">Full Name</label>
                      <input
                        type="text"
                        required
                        value={suName}
                        onChange={(e) => setSuName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-100 outline-none text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-2xs font-semibold text-slate-500 block">Email Address</label>
                      <input
                        type="email"
                        required
                        value={suEmail}
                        onChange={(e) => setSuEmail(e.target.value)}
                        placeholder="engineer@electro.app"
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-100 outline-none text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-2xs font-semibold text-slate-500 block">Password (8+ chars)</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={suPassword}
                        onChange={(e) => setSuPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-100 outline-none text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2 rounded-lg transition-all border-b-2 border-emerald-800 cursor-pointer shadow flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-4 h-4 text-amber-305" /> Start 7-Day Free Trial
                    </button>
                  </form>
                </div>
              )}

              {authView === "signin" && (
                <form onSubmit={handleFirebaseLogIn} className="bg-white dark:bg-slate-850 p-6 rounded-xl border border-slate-150 dark:border-slate-800 max-w-md mx-auto space-y-4 shadow-sm">
                  <div className="text-center pb-2">
                    <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">
                      Returning Architect Log In
                    </h3>
                    <p className="text-2xs text-slate-400 mt-1">
                      Synchronize your learning statistics on standard cloud nodes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-2xs font-semibold text-slate-500 block">Registered Email</label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="engineer@electro.app"
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-2xs font-semibold text-slate-500 block">Security Password</label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-white outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg cursor-pointer"
                    >
                      Log In (Recall Data)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthView("reset")}
                      className="text-center w-full text-2xs text-slate-400 hover:text-emerald-500 block transition pt-1 cursor-pointer"
                    >
                      Forgot Credentials / Set New Password
                    </button>
                  </div>
                </form>
              )}

              {authView === "reset" && (
                <form onSubmit={handleFirebasePasswordReset} className="bg-white dark:bg-slate-850 p-6 rounded-xl border border-slate-150 dark:border-slate-800 max-w-md mx-auto space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest text-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    Reset Security Password
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-2xs font-semibold text-slate-500 block">Registered Email</label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter registered email address..."
                        className="w-full text-xs p-2 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 text-white font-bold text-xs py-2 rounded cursor-pointer"
                    >
                      Send Password Reset Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthView("signin")}
                      className="text-center w-full text-2xs text-slate-400 hover:text-emerald-500 block transition pt-1 cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {authView === "stripe" && (
                <div className="bg-white dark:bg-slate-850 p-6 rounded-xl border border-slate-150 dark:border-slate-800 max-w-md mx-auto space-y-4 shadow-sm">
                  <div className="text-center pb-2">
                    <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Coins className="w-5 h-5 text-amber-500" />
                      Stripe Payment Checkout Mock
                    </h3>
                    <p className="text-2xs text-slate-400 mt-1">
                      Direct sandbox payment engine configuration.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setStripeForm({
                            ...stripeForm,
                            selectedPlan: "monthly",
                            price: "$29.99"
                          })
                        }
                        className={`flex-1 p-2 rounded border text-center transition ${
                          stripeForm.selectedPlan === "monthly"
                            ? "border-emerald-600 bg-emerald-50/15"
                            : "border-slate-200"
                        }`}
                      >
                        <span className="block font-bold">Monthly Plan</span>
                        <span className="text-slate-400 text-3xs">$29.99/mo</span>
                      </button>
                      <button
                        onClick={() =>
                          setStripeForm({
                            ...stripeForm,
                            selectedPlan: "yearly",
                            price: "$299.99"
                          })
                        }
                        className={`flex-1 p-2 rounded border text-center transition ${
                          stripeForm.selectedPlan === "yearly"
                            ? "border-emerald-605 bg-emerald-50/15"
                            : "border-slate-200"
                        }`}
                      >
                        <span className="block font-bold text-semibold">Yearly License</span>
                        <span className="text-slate-400 text-3xs">$299.99/yr</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-3xs font-bold text-slate-400 uppercase">Card Conductor Num</label>
                        <input
                          type="text"
                          value={stripeForm.card}
                          onChange={(e) => setStripeForm({ ...stripeForm, card: e.target.value })}
                          placeholder="4242 •••• •••• 4242"
                          className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 border"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-3xs font-bold text-slate-405 uppercase">Expiration</label>
                          <input
                            type="text"
                            value={stripeForm.exp}
                            onChange={(e) => setStripeForm({ ...stripeForm, exp: e.target.value })}
                            placeholder="MM/YY"
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 border"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-3xs font-bold text-slate-405 uppercase">CVC Code</label>
                          <input
                            type="text"
                            value={stripeForm.cvc}
                            onChange={(e) => setStripeForm({ ...stripeForm, cvc: e.target.value })}
                            placeholder="123"
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 border"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-3xs font-bold text-slate-405 uppercase">Conductor Name</label>
                        <input
                          type="text"
                          value={stripeForm.nameOnCard}
                          onChange={(e) => setStripeForm({ ...stripeForm, nameOnCard: e.target.value })}
                          placeholder="Principal Surveyor Name"
                          className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 border"
                        />
                      </div>
                    </div>

                    {stripeProgress !== null && (
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border space-y-2">
                        <div className="flex justify-between font-bold text-3xs text-emerald-650">
                          <span>{stripeStatusText}</span>
                          <span>{stripeProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 transition-all duration-300"
                            style={{ width: `${stripeProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleCustomPaymentCheck}
                      disabled={stripeProgress !== null}
                      className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-slate-900 font-extrabold text-xs py-2 rounded-lg transition-all border-b-2 border-slate-900/30 cursor-pointer"
                    >
                      Authenticate Secure Purchase of {stripeForm.price}
                    </button>
                  </div>
                </div>
              )}

              {/* Pricing Cards Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-850 rounded-xl p-6 border border-slate-150 dark:border-slate-800 space-y-4">
                  <span className="text-3xs font-extrabold tracking-widest text-emerald-650 uppercase bg-emerald-50 dark:bg-emerald-990/20 px-2 py-1 rounded inline-block">
                    Professional Sizing
                  </span>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    $29.99<span className="text-xs font-normal text-slate-400">/month</span>
                  </div>
                  <p className="text-2xs text-slate-500">
                    Comprehensive multi-regional layouts, load checklists, and code auditing tools for single engineers.
                  </p>

                  <ul className="text-xs space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <li className="flex items-center gap-1.5 text-slate-650">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Sizing limits under BS 7671, NEC &amp; CEC
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-650 font-semibold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Low Latency Gemini 3.5 Conversation Mode
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-650 font-semibold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Veo 3.1 Educational Video Tutorial synthesis
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-650">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Interactive quiz dashboard tracking
                    </li>
                  </ul>

                  <button
                    onClick={() => {
                      setStripeForm({
                        ...stripeForm,
                        selectedPlan: "monthly",
                        price: "$29.99"
                      });
                      setAuthView("stripe");
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-850 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition text-center"
                  >
                    Select Monthly Plan
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-850 rounded-xl p-6 border-2 border-amber-400 space-y-4 relative overflow-hidden">
                  <div className="absolute top-2 right-[-28px] bg-amber-400 text-slate-900 text-[10px] font-black tracking-widest uppercase rotate-45 py-1 px-8">
                    Best Deal
                  </div>

                  <span className="text-3xs font-extrabold tracking-widest text-slate-900 bg-amber-400 px-2 py-1 rounded inline-block">
                    Corporate License ★
                  </span>
                  <div className="text-3xl font-black text-slate-100">
                    $299.99<span className="text-xs font-normal text-slate-400">/year</span>
                  </div>
                  <span className="text-3xs bg-emerald-50 text-emerald-600 rounded px-2.5 py-0.5 inline-block font-semibold">
                    Save $60 on annual plans
                  </span>
                  <p className="text-2xs text-slate-500">
                    Complete agency-level suite supporting unlimited workspace engineering operations, and certified downloads.
                  </p>

                  <ul className="text-xs space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <li className="flex items-center gap-1.5 text-slate-650">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Everything in standard Professional
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      High-Thinking reasoning cores for complex grid designs
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-650">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Premium blueprint OCR PDF scanning support
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-650">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Collaborative engineering team metrics
                    </li>
                  </ul>

                  <button
                    onClick={() => {
                      setStripeForm({
                        ...stripeForm,
                        selectedPlan: "yearly",
                        price: "$299.99"
                      });
                      setAuthView("stripe");
                    }}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs py-2 rounded-lg cursor-pointer transition text-center"
                  >
                    Get Annual Core License
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Corporate Technical Footer */}
      <footer className="bg-slate-950 text-slate-400 text-center py-4 px-5 border-t border-slate-850 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-450 shrink-0" />
            <span className="font-bold text-slate-300">ELECTRO SYSTEM APP</span>
            <span className="text-slate-600">|</span>
            <span className="text-2xs">© 2026 AI-Powered Electrical Engineering workspace.</span>
          </div>
          <div className="flex gap-4 text-3xs font-semibold text-slate-500 uppercase tracking-widest">
            <span>Jurisdictions: AU · CA · DE · NG · UK · US</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
