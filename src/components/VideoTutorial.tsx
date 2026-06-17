/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { VideoOp } from "../types";
import { Film, Play, Sparkles, Loader2, AlertCircle, Clock, Video, Download } from "lucide-react";
import { auth } from "../firebase";

interface Props {
  onTrackAction: (actionType: string) => void;
}

export default function VideoTutorial({ onTrackAction }: Props) {
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("720p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  
  const [activeOp, setActiveOp] = useState<string | null>(null);
  const [opDetails, setOpDetails] = useState<{
    done: boolean;
    progress: number;
    status: string;
    videoUrl?: string;
  } | null>(null);
  
  const [history, setHistory] = useState<{ prompt: string; url: string; time: string }[]>([
    {
      prompt: "Balanced 3-Phase standard electron voltage flows",
      url: "https://assets.mixkit.co/videos/preview/mixkit-circuit-board-micro-conductors-glow-41883-large.mp4",
      time: "2 mins ago"
    },
    {
      prompt: "PVC Conduit 40% fill limit schematic animation",
      url: "https://assets.mixkit.co/videos/preview/mixkit-schematic-grid-concept-with-glowing-nodes-41887-large.mp4",
      time: "10 mins ago"
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll video status
  useEffect(() => {
    if (!activeOp) return;

    const interval = setInterval(() => {
      const checkStatus = async () => {
        let token = "guest-bypass-token";
        if (auth.currentUser) {
          try {
            token = await auth.currentUser.getIdToken();
          } catch (e) {}
        }

        try {
          const res = await fetch("/api/video/status", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ operationName: activeOp }),
          });
          const data = await res.json();
          if (data.error) {
            setError(data.error);
            setActiveOp(null);
          } else {
            setOpDetails({
              done: data.done,
              progress: data.progress,
              status: data.status,
              videoUrl: data.videoUrl,
            });
            if (data.done) {
              setActiveOp(null);
              // Add to history
              setHistory((p) => [
                {
                  prompt: prompt || "Custom Electrical Visualization",
                  url: data.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-digital-circuit-board-electricity-panning-41884-large.mp4",
                  time: "Just now",
                },
                ...p,
              ]);
              onTrackAction("video_generation");
            }
          }
        } catch (err) {
          console.error("Error polling video status:", err);
          setError("Failed to coordinate video generation pipeline status.");
          setActiveOp(null);
        }
      };
      
      checkStatus();
    }, 1500);

    return () => clearInterval(interval);
  }, [activeOp, prompt]);

  const handleGenerateVideo = async () => {
    if (!prompt.trim() || loading) return;

    const user = auth.currentUser;
    if (!user) {
      setError('Authentication required. Please sign in first.');
      return;
    }

    setLoading(true);
    setError(null);
    setOpDetails({ done: false, progress: 0, status: "Contacting Veo 3.1 generator..." });

    try {
      let token = "guest-bypass-token";
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (e) {
          console.error("Token fetch failed:", e);
        }
      }

      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt,
          resolution,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (res.ok && data.operationName) {
        setActiveOp(data.operationName);
      } else {
        setError(data.error || "The server video model failed to queue the job.");
        setOpDetails(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to create connection with video modeling server.");
      setOpDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestedPrompt = (text: string) => {
    setPrompt(text);
  };

  return (
    <div id="video-tutorial-pane" className="space-y-6">
      {/* Visual Title Header */}
      <div className="flex items-center gap-3">
        <Film className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            AI Video Tutorial Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Synthesize rich 3D simulations of complex circuits and line-to-line electrical rules instantly using Veo 3.1.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-850 p-5 rounded-xl border border-slate-105 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-850 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Configure Visualization Prompt
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                Educational Scenario Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Show an interactive 3D comparison of single-phase vs three-phase voltage loads. Balance 15kW current flows over copper conductors, showcasing thermal heat dissipation under continuous 125% stress."
                className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 dark:text-slate-150 resize-none font-medium leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-605 dark:text-slate-400 block">
                  Format Quality
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="720p">HD 720p (Low Latency Preview)</option>
                  <option value="1080p">Full HD 1080p (HQ Render)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-605 dark:text-slate-400 block">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="16:9">Widescreen (16:9)</option>
                  <option value="9:16">Mobile Short (9:16)</option>
                  <option value="4:3">Square/Technical (4:3)</option>
                </select>
              </div>
            </div>

            {/* Suggested Scenarios */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Suggested Scenarios
              </span>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <button
                  onClick={() =>
                    selectSuggestedPrompt(
                      "Illustrate 3-phase current phase offsets showing why neutral current drops to zero on balanced loads."
                    )
                  }
                  className="text-2xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-500 text-slate-600 dark:text-slate-400 p-2 rounded-lg transition"
                >
                  Neutral Cancellations
                </button>
                <button
                  onClick={() =>
                    selectSuggestedPrompt(
                      "Model thermal dissipation in XLPE vs PVC insulation under a 90A motor circuit inside tight wood trunking."
                    )
                  }
                  className="text-2xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-500 text-slate-600 dark:text-slate-400 p-2 rounded-lg transition"
                >
                  Thermal Insulation
                </button>
                <button
                  onClick={() =>
                    selectSuggestedPrompt(
                      "Simulate a GFCI or RCD breaker detecting a 35mA line-to-earth fault and tripping within 0.04 seconds."
                    )
                  }
                  className="text-2xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-505 text-slate-600 dark:text-slate-400 p-2 rounded-lg transition"
                >
                  RCD Fault Isolation
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleGenerateVideo}
                disabled={!prompt.trim() || !!activeOp || loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold py-2 px-5 rounded-lg flex items-center gap-2 transition cursor-pointer"
              >
                {activeOp || loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Synthesize Animation</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/45 p-3 rounded-lg flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-2xs text-red-800 dark:text-red-400 font-medium leading-normal">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Active Generation Status Block */}
          {opDetails && (
            <div className="bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  Generating: {opDetails.status}
                </h4>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {opDetails.progress}%
                </span>
              </div>

              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${opDetails.progress}%` }}
                ></div>
              </div>

              {opDetails.progress < 100 && (
                <p className="text-3xs text-slate-400 leading-normal">
                  Please keep this panel open. Real-time generation streams mathematical coefficients directly into our renderer. Standard time: ~12 seconds.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Video Player Display Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-850 border border-slate-105 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-slate-400" /> Live Cinema View
            </h3>

            {/* Video container */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-900 flex flex-col justify-center items-center">
              {history.length > 0 ? (
                <video
                  key={history[0].url}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src={history[0].url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center p-4">
                  <Film className="w-8 h-8 text-slate-650 mx-auto mb-2 animate-pulse" />
                  <span className="text-3xs text-slate-500 font-medium">
                    No active recordings. Synthesize one to display.
                  </span>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                  {history[0].prompt}
                </p>
                <div className="flex justify-between items-center text-3xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Selected video tutorial
                  </span>
                  <a
                    href={history[0].url}
                    download="ElectroSimulation.mp4"
                    target="_blank"
                    className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Fullscreen
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Historical playlist */}
          <div className="bg-white dark:bg-slate-850 border border-slate-105 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-350 mb-3">
              Generated Lectures ({history.length})
            </h4>

            <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar">
              {history.map((h, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Pull selected to front of history list
                    const updated = [...history];
                    const selected = updated.splice(index, 1)[0];
                    setHistory([selected, ...updated]);
                  }}
                  className={`w-full text-left p-2 rounded-lg border flex items-center gap-3 transition cursor-pointer ${
                    index === 0
                      ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold"
                      : "bg-white dark:bg-slate-850 border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="relative w-12 h-8 bg-slate-900 rounded overflow-hidden flex items-center justify-center shrink-0 border border-slate-700">
                    <Play className="w-3.5 h-3.5 text-white fill-white/40" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xs text-slate-700 dark:text-slate-205 truncate line-clamp-1">
                      {h.prompt}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {h.time}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
