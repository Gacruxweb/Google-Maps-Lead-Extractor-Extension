import React from "react";
import { Lead, ScraperConfig } from "../types";
import { MapPin, RotateCcw, AlertTriangle, ShieldCheck, Play, Pause, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MapsMockupFrameProps {
  activeQuery: string;
  scrapedLeads: Lead[];
  isScraping: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onInjectNetworkError: () => void;
  simulatedErrorActive: boolean;
  currentProxy: string;
  config: ScraperConfig;
}

export const MapsMockupFrame: React.FC<MapsMockupFrameProps> = ({
  activeQuery,
  scrapedLeads,
  isScraping,
  onStartSimulation,
  onStopSimulation,
  onInjectNetworkError,
  simulatedErrorActive,
  currentProxy,
  config
}) => {
  // Take last 6 leads to display in the live-scroll pane
  const itemsToDisplay = scrapedLeads.slice(-5).reverse();

  return (
    <div className="bg-[#020617] border border-slate-800 rounded-sm flex flex-col h-full" id="maps-mockup-frame">
      {/* Simulation Controller Bar */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Google Maps Scraping Simulator</span>
        </div>
        
        <div className="flex gap-2">
          {isScraping ? (
            <button
              onClick={onStopSimulation}
              className="py-1 px-3 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors cursor-pointer"
              id="stop-sim-btn"
            >
              <Pause className="w-3.5 h-3.5" /> Stop Engine
            </button>
          ) : (
            <button
              onClick={onStartSimulation}
              className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors cursor-pointer"
              id="start-sim-btn"
            >
              <Play className="w-3.5 h-3.5 animate-pulse" /> Launch Demo Scraper
            </button>
          )}

          <button
            onClick={onInjectNetworkError}
            disabled={!isScraping || simulatedErrorActive}
            className={`py-1 px-3 text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors cursor-pointer ${
              simulatedErrorActive 
                ? "bg-amber-600/40 text-amber-200 cursor-not-allowed" 
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
            id="inject-error-btn"
            title="Simulate network disconnect / block, forcing retry & proxy rotation"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Break Connection (Demo Retry)
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 overflow-hidden h-full">
        {/* Left column: Simulated Google Maps scroll feed */}
        <div className="col-span-5 border-r border-slate-800 flex flex-col h-full bg-[#111827] overflow-hidden">
          {/* Header search bar inside mock Maps */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <div className="bg-slate-950 px-2.5 py-1.5 rounded-full border border-slate-800 flex-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-[11px] font-mono text-slate-300 truncate">
                {activeQuery || "Search Google Maps..."}
              </span>
            </div>
          </div>

          {/* Feed scroll area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {simulatedErrorActive && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded flex flex-col gap-1 text-slate-300"
                id="error-notification"
              >
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase font-mono">
                  <AlertTriangle className="w-4 h-4 animate-bounce" /> Rate Limit Triggered [429]
                </div>
                <p className="text-[10px] text-slate-400">
                  Google detected repetitive requests from client. Initiating automatic safe-abort, flushing buffer, and invoking rotating proxy rotation...
                </p>
                <div className="mt-2 text-[9px] font-mono text-amber-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Rotated to next proxy node: {currentProxy || "Acquiring..."}
                </div>
              </motion.div>
            )}

            {isScraping && !simulatedErrorActive && scrapedLeads.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                Querying Google Maps API database...
                <span className="text-[9px] font-mono text-slate-600">Simulating real user mouse movements to preserve safety limits.</span>
              </div>
            )}

            {!isScraping && scrapedLeads.length === 0 && (
              <div className="p-10 text-center text-slate-500 text-xs italic">
                Simulated feed idle. Click "Launch Demo Scraper" to see real-time scrolling, document extraction, and proxy defense.
              </div>
            )}

            <AnimatePresence>
              {itemsToDisplay.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  key={item.id}
                  className={`p-3 bg-slate-900 border rounded transition-all hover:border-slate-700 ${idx === 0 ? "border-indigo-500/80 bg-indigo-950/20 shadow-[0_0_8px_rgba(99,102,241,0.15)]" : "border-slate-800/80"}`}
                  id={`mock-feed-item-${item.id}`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-bold text-white truncate max-w-[170px]" title={item.name}>
                      {item.name}
                    </span>
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-sm text-[9px] font-mono font-bold uppercase shrink-0">
                      scraped
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                    <span className="text-amber-400 font-mono font-bold">★ {item.rating}</span>
                    <span className="text-slate-500">({item.reviewsCount} reviews)</span>
                  </div>

                  <div className="mt-2 space-y-1 text-[10px] text-slate-500 font-mono">
                    <p className="truncate">📞 {item.phone || "No phone available"}</p>
                    <p className="truncate text-indigo-400 hover:underline cursor-pointer">🌐 {item.website ? item.website.replace("https://", "") : "No website available"}</p>
                    <p className="truncate">📍 {item.address}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right column: Stylized Geometric interactive map grid preview */}
        <div className="col-span-12 md:col-span-7 bg-[#0b0f19] relative overflow-hidden flex flex-col justify-end p-4">
          {/* Abstract SVG Grid overlay representing coordinates mapping */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Radial background glow */}
              <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#4f46e5" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#4f46e5" strokeWidth="0.5" strokeDasharray="1,2" />
            </svg>
          </div>

          {/* Active status metrics overlay */}
          <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 p-3 rounded text-[11px] font-mono space-y-1 z-10 w-44 shadow-lg backdrop-blur-sm">
            <div className="text-slate-500 uppercase text-[9px] font-bold border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
              <span>GPS Coordinates</span>
              <span className="text-indigo-400">active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Center:</span>
              <span className="text-slate-300">51.5074° N</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delay mode:</span>
              <span className="text-amber-500">{config.minDelay / 1000}s - {config.maxDelay / 1000}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className={`${isScraping ? "text-emerald-400 animate-pulse" : "text-amber-400"}`}>
                {isScraping ? "RUNNING" : "IDLE"}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/60 text-[9px] text-slate-500">
              <span>Security rule:</span>
              <span>20 documents/min</span>
            </div>
          </div>

          {/* Map pins of currently extracted points */}
          <AnimatePresence>
            {scrapedLeads.map((item, idx) => {
              // Create pseudo-coordinates based on ID and index to scatter them nicely on screen
              const charSum = item.name.charCodeAt(0) + item.name.charCodeAt(item.name.length - 1);
              const leftPercent = 15 + ((charSum * 3) % 70);
              const topPercent = 15 + ((charSum * 7) % 65);
              const isHighlight = idx === scrapedLeads.length - 1;

              return (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  key={item.id}
                  className="absolute cursor-pointer group"
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  title={item.name}
                >
                  <div className="relative">
                    {/* Ring highlight animation for the most recent document */}
                    {isHighlight && (
                      <span className="absolute -inset-2.5 bg-indigo-500/30 rounded-full animate-ping pointer-events-none" />
                    )}

                    <MapPin className={`w-5 h-5 transition-colors ${isHighlight ? "text-indigo-404 text-indigo-400" : "text-emerald-500 hover:text-white"}`} />
                    
                    {/* Overlay popup card when hovered */}
                    <div className="absolute left-6 top-0 hidden group-hover:block bg-slate-950 border border-slate-850 p-2 rounded text-[10px] w-36 z-50 shadow-2xl">
                      <p className="font-bold text-white truncate">{item.name}</p>
                      <p className="text-amber-400">★ {item.rating} ({item.reviewsCount} reviews)</p>
                      <p className="text-slate-400 text-[9px] font-mono leading-none mt-1">{item.phone || "No phone"}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* TOS notice at bottom */}
          <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-sm flex items-start gap-2 max-w-sm z-10 shadow-lg backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-400 leading-normal">
              <span className="font-bold text-slate-200 block uppercase tracking-wider text-[9px] mb-0.5">TOS compliance assurance</span>
              Client-based UI rendering imitates genuine browse behaviors, satisfying Google search rate policies to guarantee continuous safety and account validation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
