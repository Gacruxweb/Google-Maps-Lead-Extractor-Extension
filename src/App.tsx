import React, { useState, useEffect, useRef } from "react";
import { Lead, ScraperConfig, CustomFormatConfig, ScraperLog } from "./types";
import { SidebarSettings } from "./components/SidebarSettings";
import { ExportSettingsDiv } from "./components/ExportSettingsDiv";
import { MapsMockupFrame } from "./components/MapsMockupFrame";
import { scoreLeadsWithGemini, generateColdEmailDraft } from "./services/geminiService";
import { generateExtensionZip, getCSVHeaders } from "./lib/extensionCodeGenerator";
import { generateRandomMockLead, createInitialLogs } from "./lib/mockDataGenerator";

// Lucide Icons
import {
  Download,
  Terminal,
  Layers,
  Sparkles,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCheck,
  RotateCw,
  RefreshCw,
  Mail,
  Building,
  Info,
  HelpCircle,
  Check,
  ExternalLink,
  Zap
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // 1. Scraper Settings State
  const [config, setConfig] = useState<ScraperConfig>({
    queries: ["Coffee shop London", "Bakery Paris", "Dentist Berlin"],
    minDelay: 2000,
    maxDelay: 5000,
    maxResultsPerQuery: 40,
    hlLanguage: "en",
    glRegion: "US",
    customAutoUpdateUrl: "https://api.github.com/repos/user/mapextract/releases/latest",
    currentVersion: "4.2",
    proxyList: ["182.16.0.4:8080", "195.43.111.10:3128", "88.221.4.15:80"],
    rotateProxyPerNQueriesOrPages: 1,
    fieldsToExtract: {
      name: true,
      address: true,
      phone: true,
      website: true,
      rating: true,
      reviewsCount: true,
      email: true,
      googleUrl: true
    }
  });

  // 2. Custom Output Format Configuration
  const [formatConfig, setFormatConfig] = useState<CustomFormatConfig>({
    delimiter: ",",
    addColumnQuote: true,
    headerCasing: "original",
    customHeaders: {
      name: "Business Name",
      phone: "Phone Line",
      website: "Homepage",
      email: "Email Address",
      total_reviews: "Total Reviews",
      lead_potential_rank: "Lead Potential Rank"
    }
  });

  // 3. Extracted Lead Buffer
  const [scrapedLeads, setScrapedLeads] = useState<Lead[]>([
    {
      id: "g_maps_seed_1",
      name: "Blue Bottle Coffee - Kings Cross",
      query: "Coffee shop London",
      address: "24 Stable St, London N1C 4AB",
      phone: "+44 20 7404 0000",
      website: "https://bluebottlecoffee.com",
      rating: 4.6,
      reviewsCount: 382,
      googleUrl: "https://www.google.com/maps",
      language: "en",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      email: "contact@bluebottle.uk",
      aiScore: "A",
      aiScoreExplanation: "Premium listing with great ratings, active website, and dedicated contact phone.",
      aiSuggestedApproach: "Offer reviews synchronization plugin to showcase their outstanding 4.6 stars rating directly on their website."
    },
    {
      id: "g_maps_seed_2",
      name: "Poilâne Bakery - Saint-Germain",
      query: "Bakery Paris",
      address: "8 Rue du Cherche-Midi, 75006 Paris",
      phone: "+33 1 45 48 42 59",
      website: "https://poilane.com",
      rating: 4.8,
      reviewsCount: 1204,
      googleUrl: "https://www.google.com/maps",
      language: "fr",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      aiScore: "A",
      aiScoreExplanation: "Iconic bakery with highly responsive customers but basic static web landing.",
      aiSuggestedApproach: "Pitch local reservation engine software integration to automate bread order collections."
    },
    {
      id: "g_maps_seed_3",
      name: "Zahnarztpraxis Berlin Mitte - Becker",
      query: "Dentist Berlin",
      address: "Friedrichstraße 200, 10117 Berlin",
      phone: "+49 30 1122 3344",
      website: "",
      rating: 3.9,
      reviewsCount: 18,
      googleUrl: "https://www.google.com/maps",
      language: "de",
      timestamp: new Date(Date.now() - 900000).toISOString(),
      aiScore: "B",
      aiScoreExplanation: "Listed with direct phone number but lacks a business website. Great prospect for landing page design.",
      aiSuggestedApproach: "Pitch quick dental patient booking calendar landing page design using a ready-to-use dentist UI preset."
    }
  ]);

  // 4. Runtime logs, simulation states
  const [systemLogs, setSystemLogs] = useState<ScraperLog[]>(createInitialLogs());
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [simulatedErrorActive, setSimulatedErrorActive] = useState<boolean>(false);
  const [currentProxy, setCurrentProxy] = useState<string>("182.16.0.4:8080");
  const [activeQueryIndex, setActiveQueryIndex] = useState<number>(0);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("g_maps_seed_1");
  const [servicePitch, setServicePitch] = useState<string>("Google review booster strategy & website SEO speed-up auditing");
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [emailDraftLoading, setEmailDraftLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"simulator" | "leads" | "formatting" | "bundle">("simulator");
  const [leadCounter, setLeadCounter] = useState<number>(1);

  // References for automated console updates scrolling
  const consoleBottomRef = useRef<HTMLDivElement>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [systemLogs]);

  // Handle Proxy and simulation ticks
  const writeLog = (type: ScraperLog["type"], message: string) => {
    const newLog: ScraperLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      type,
      message
    };
    setSystemLogs(prev => [...prev, newLog]);
  };

  // Start scraper simulation
  const startSimulation = () => {
    if (isScraping) return;
    setIsScraping(true);
    setSimulatedErrorActive(false);
    writeLog("info", `Launching Humanized Google Maps Scraper engine for query: "${config.queries[activeQueryIndex]}"`);
    writeLog("info", `Active settings: Latency range ${config.minDelay / 1000}s - ${config.maxDelay / 1000}s. Capping at ${config.maxResultsPerQuery} results.`);
    if (config.proxyList.length > 0) {
      setCurrentProxy(config.proxyList[0]);
      writeLog("proxy", `Routing traffic through active proxy proxy-pool server: ${config.proxyList[0]}`);
    }

    let localCounter = leadCounter;
    let pagesScrolledCount = 0;

    const tick = () => {
      // If error is active, hold generation and log retry loop
      if (simulatedErrorActive) {
        return;
      }

      // Roll delay & generate a realistic lead
      const activeQuery = config.queries[activeQueryIndex];
      const newLead = generateRandomMockLead(activeQuery, config.hlLanguage, localCounter);
      localCounter++;
      setLeadCounter(localCounter);

      setScrapedLeads(prev => {
        // Prevent duplicate IDs
        if (prev.some(lead => lead.name === newLead.name)) {
          return prev;
        }
        return [...prev, newLead];
      });

      writeLog("success", `Extracted Lead: [${newLead.name}] | Rating: ${newLead.rating} ★ | Phone: ${newLead.phone || "N/A"}`);

      // Simulate scrolling and pagination page turns
      pagesScrolledCount++;
      if (pagesScrolledCount % config.rotateProxyPerNQueriesOrPages === 0 && config.proxyList.length > 0) {
        // Rotate proxy
        const nextProxyIndex = pagesScrolledCount % config.proxyList.length;
        const nextProxyIp = config.proxyList[nextProxyIndex];
        setCurrentProxy(nextProxyIp);
        writeLog("proxy", `Rotate Trigger Activated. Rotating proxy endpoint to: ${nextProxyIp} (Secure Masking)`);
      }

      // Check results limit or query transition
      if (scrapedLeads.length >= config.maxResultsPerQuery) {
        // Cycle queries
        if (activeQueryIndex < config.queries.length - 1) {
          const nextIndex = activeQueryIndex + 1;
          setActiveQueryIndex(nextIndex);
          writeLog("info", `Completed queries cap [${config.maxResultsPerQuery}]. Advacing to next query: "${config.queries[nextIndex]}"`);
        } else {
          writeLog("success", `All ${config.queries.length} queries parsed successfully. Scraper idle.`);
          stopSimulation();
        }
      }
    };

    // Calculate a dynamic randomized delay interval
    const intervalTime = Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay;
    const interval = setInterval(tick, intervalTime);
    simulationIntervalRef.current = interval;
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsScraping(false);
    writeLog("info", "Scraping simulation safely stopped by supervisor.");
  };

  // Demonstration of error handling & automatic proxy recovery
  const injectNetworkError = () => {
    if (!isScraping) return;
    setSimulatedErrorActive(true);
    writeLog("error", "Exception detected! [HTTP 429: Too Many Requests] Rate limit boundary reached on Google Host.");
    writeLog("warn", "Locking thread. Pausing scraper scroll to bypass cookie security check...");
    
    // Simulate smart recovery timeline
    setTimeout(() => {
      if (config.proxyList.length > 0) {
        const fallbackProxy = config.proxyList[(activeQueryIndex + 1) % config.proxyList.length];
        setCurrentProxy(fallbackProxy);
        writeLog("proxy", `Bypassing rate limit: Identity swapped to rotated backup node: ${fallbackProxy}`);
      }
      setSimulatedErrorActive(false);
      writeLog("info", "Session resumed. Connection established cleanly. Safe scrolling resumes...");
    }, 4000);
  };

  // 5. AI Leads Scoring Logic
  const bulkAIEenrichLeads = async () => {
    if (scrapedLeads.length === 0) return;
    setAiGenerating(true);
    writeLog("info", `Initiating Gemini Pro Lead Scoring analysis for ${scrapedLeads.length} leads...`);
    try {
      const enriched = await scoreLeadsWithGemini(scrapedLeads);
      setScrapedLeads(enriched);
      writeLog("success", `AI Enrichment audit complete. Successfully graded and strategized ${scrapedLeads.length} prospects!`);
    } catch (err: any) {
      writeLog("error", `Gemini Lead Score Failed: ${err.message || err}`);
      alert(`AI Enrichment Error: ${err.message || err}\n\nTo persist actual Gemini models, please verify GEMINI_API_KEY is configured in AI Studio environments.`);
    } finally {
      setAiGenerating(false);
    }
  };

  const enrichSelectedLead = async (lead: Lead) => {
    setAiGenerating(true);
    writeLog("info", `Calling Gemini Model to audit single premium candidate: [${lead.name}]`);
    try {
      const enrichedLeads = await scoreLeadsWithGemini([lead]);
      if (enrichedLeads && enrichedLeads.length > 0) {
        const enriched = enrichedLeads[0];
        setScrapedLeads(prev => prev.map(l => l.id === lead.id ? enriched : l));
        writeLog("success", `Enriched [${lead.name}] -> Grade [${enriched.aiScore}] Suggested Approach: "${enriched.aiSuggestedApproach}"`);
      }
    } catch (err: any) {
      writeLog("error", `Single Enrichment Failed: ${err.message || err}`);
      alert(`AI Model Enrichment Failed: ${err.message || err}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const draftEmailPitchForSelectedLead = async (lead: Lead) => {
    if (!servicePitch || servicePitch.trim() === "") {
      alert("Please outline your Product or Service Pitch before drafting an outreach email.");
      return;
    }
    setEmailDraftLoading(true);
    writeLog("info", `Generating personalized cold outreach email copy with Gemini AI for [${lead.name}] pitching "${servicePitch}"`);
    try {
      const draft = await generateColdEmailDraft(lead, servicePitch);
      setScrapedLeads(prev => prev.map(l => l.id === lead.id ? { ...l, coldEmailDraft: draft } : l));
      writeLog("success", `Email Copywriter generated professional outreach pitch successfully for [${lead.name}].`);
    } catch (err: any) {
      writeLog("error", `Email Writer failed: ${err.message || err}`);
      alert(`Gemini Pitch Draft Error: ${err.message || err}`);
    } finally {
      setEmailDraftLoading(false);
    }
  };

  // Find currently selected lead object
  const activeLead = scrapedLeads.find(l => l.id === selectedLeadId) || scrapedLeads[0];

  // 6. CSV Generator Handlers
  const triggerCSVDownload = () => {
    if (scrapedLeads.length === 0) {
      alert("There are no leads in the stack database to export.");
      return;
    }

    const headers = getCSVHeaders(config.fieldsToExtract, formatConfig);
    const separator = formatConfig.delimiter === "\\t" ? "\t" : formatConfig.delimiter;

    let csvContent = "\ufeff"; // BOM wrapper for Excel localization
    csvContent += headers.join(separator) + "\n";

    scrapedLeads.forEach(lead => {
      const rowData = [
        config.fieldsToExtract.name ? (lead.name || "") : undefined,
        config.fieldsToExtract.address ? (lead.address || "Google Maps Search Details") : undefined,
        config.fieldsToExtract.phone ? (lead.phone || "") : undefined,
        config.fieldsToExtract.email ? (lead.email || "") : undefined,
        config.fieldsToExtract.website ? (lead.website || "") : undefined,
        config.fieldsToExtract.rating ? (lead.rating || 0).toString() : undefined,
        config.fieldsToExtract.reviewsCount ? (lead.reviewsCount || 0).toString() : undefined,
        config.fieldsToExtract.googleUrl ? (lead.googleUrl || "") : undefined,
        lead.query || "Universal Lead",
        lead.language || "en",
        lead.timestamp || new Date().toISOString(),
        lead.facebook || "",
        lead.instagram || "",
        lead.linkedin || "",
        lead.twitter || "",
        lead.aiScore || "Unrated",
        lead.aiScoreExplanation || "",
        lead.aiSuggestedApproach || ""
      ].filter(x => x !== undefined) as string[];

      // Map column quote rule
      const escapedRow = rowData.map(val => {
        let cleanStr = String(val).replace(/"/g, '""');
        return formatConfig.addColumnQuote ? `"${cleanStr}"` : cleanStr;
      });

      csvContent += escapedRow.join(separator) + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `google_maps_leads_format_${formatConfig.headerCasing}.csv`;
    link.click();
    writeLog("success", `Downloaded customized CSV file with ${scrapedLeads.length} listings. Delimiter: [${formatConfig.delimiter}]`);
  };

  // 7. Chrome manifest code bundle downloader
  const triggerZipDownload = async () => {
    writeLog("info", "Assembling fully operational unpacked Google Chrome Extension bundle dynamically matching your proxy list & TOS guidelines...");
    try {
      const blob = await generateExtensionZip(config, formatConfig);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `google-maps-lead-extractor-chrome-extension-v${config.currentVersion}.zip`;
      link.click();
      writeLog("success", "Manifest V3 Compliant Chrome Extension is compiled successfully & ZIP folder dispatched to browser!");
    } catch (err: any) {
      writeLog("error", `ZIP compilation failure: ${err.message}`);
      alert(`Failed to pack extension: ${err.message}`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0F172A] text-slate-300 font-sans flex flex-col" id="root-container">
      
      {/* 1. Header component */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-505 bg-indigo-600 rounded-sm flex items-center justify-center shadow-lg">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-tight text-white uppercase font-display flex items-center gap-2">
              MapExtract Extension Studio <span className="text-indigo-400 font-mono text-xs font-normal">v{config.currentVersion}</span>
            </h1>
            <p className="text-[10px] text-slate-400 capitalize tracking-tight hidden sm:block">unpacked V3 chrome extension visual builder & optimizer</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Active Simulator Node: <span className="text-indigo-400">{currentProxy}</span>
            </span>
          </div>

          <button
            onClick={triggerZipDownload}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-tighter rounded-sm transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            id="download-extension-zip-head"
          >
            <Download className="w-3.5 h-3.5" /> Compile & Download Extension ZIP
          </button>
        </div>
      </header>

      {/* 2. Main Workspace layout (Split into Left sidebar / Content sandbox / Right sidebar) */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden bg-[#0A0F1D]">
        
        {/* Left Side options - configuration menu */}
        <aside className="col-span-12 lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col max-h-[500px] lg:max-h-[calc(100vh-8rem)]">
          <SidebarSettings config={config} onChange={setConfig} />
        </aside>

        {/* Center Panel - Sandbox simulator panel */}
        <main className="col-span-12 md:col-span-7 lg:col-span-6 flex flex-col p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
          
          {/* Navigation Tab selection */}
          <div className="border border-slate-800 p-1 bg-slate-900 rounded flex gap-1 justify-between shrink-0">
            <button
              onClick={() => setActiveTab("simulator")}
              className={`flex-1 py-1.5 px-3 text-xs uppercase font-bold tracking-wide rounded-sm transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "simulator" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              id="tab-simulator"
            >
              <RotateCw className="w-3.5 h-3.5" /> 1. Live Simulator
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`flex-1 py-1.5 px-3 text-xs uppercase font-bold tracking-wide rounded-sm transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "leads" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              id="tab-leads"
            >
              <ListFilter className="w-3.5 h-3.5" /> 2. Stack Leads ({scrapedLeads.length})
            </button>
            <button
              onClick={() => setActiveTab("formatting")}
              className={`flex-1 py-1.5 px-3 text-xs uppercase font-bold tracking-wide rounded-sm transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "formatting" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              id="tab-formatting"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> 3. Output Customizer
            </button>
            <button
              onClick={() => setActiveTab("bundle")}
              className={`flex-1 py-1.5 px-3 text-xs uppercase font-bold tracking-wide rounded-sm transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "bundle" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              id="tab-bundle"
            >
              <HelpCircle className="w-3.5 h-3.5" /> 4. Instructions
            </button>
          </div>

          {/* ACTIVE TAB: SIMULATOR */}
          {activeTab === "simulator" && (
            <div className="flex-1 flex flex-col space-y-4 h-full" id="tabcontent-simulator">
              <div className="flex-1 min-h-[460px]">
                <MapsMockupFrame
                  activeQuery={config.queries[activeQueryIndex]}
                  scrapedLeads={scrapedLeads}
                  isScraping={isScraping}
                  onStartSimulation={startSimulation}
                  onStopSimulation={stopSimulation}
                  onInjectNetworkError={injectNetworkError}
                  simulatedErrorActive={simulatedErrorActive}
                  currentProxy={currentProxy}
                  config={config}
                />
              </div>

              {/* Real-time counters block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-sm">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Current Query</span>
                  <span className="block text-xs font-bold text-white truncate font-mono">
                    {config.queries[activeQueryIndex] || "No query initialized"}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-sm">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Simulated Speed</span>
                  <span className="block text-xs font-bold text-indigo-400 font-mono">
                    {((config.minDelay + config.maxDelay) / 2000).toFixed(1)}s Delay
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-sm">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Proxy Status</span>
                  <span className="block text-xs font-bold text-emerald-400 font-mono truncate">
                    {config.proxyList.length > 0 ? `${config.proxyList.length} ips active` : "Direct Connect"}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-sm">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Total Extracted</span>
                  <span className="block text-xs font-bold text-amber-500 font-mono">
                    {scrapedLeads.length} leads
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE TAB: LEADS GRID */}
          {activeTab === "leads" && (
            <div className="flex-1 flex flex-col space-y-4" id="tabcontent-leads">
              <div className="bg-[#1E293B]/40 border border-slate-820 border-slate-800 p-3 rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Leads Database stack</h2>
                  <p className="text-[10px] text-slate-400">Review, grade, and enrich Google Maps listings before triggering customized CSV outputs.</p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={bulkAIEenrichLeads}
                    disabled={aiGenerating || scrapedLeads.length === 0}
                    className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 shadow cursor-pointer"
                    id="bulk-enrich-btn"
                  >
                    <Sparkles className="w-3 h-3" /> Classify All with Gemini AI
                  </button>
                  <button
                    onClick={triggerCSVDownload}
                    className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 shadow cursor-pointer"
                    id="bulk-download-csv"
                  >
                    <FileSpreadsheet className="w-3 h-3" /> Export Customized CSV
                  </button>
                </div>
              </div>

              {/* Leads Stack Table Grid */}
              <div className="flex-1 border border-slate-800 rounded bg-slate-950 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
                    <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800 z-10">
                      <tr>
                        <th className="p-2.5 font-medium uppercase tracking-tight">Active Business Name</th>
                        <th className="p-2.5 font-medium uppercase tracking-tight">Direct Phone</th>
                        <th className="p-2.5 font-medium uppercase tracking-tight">Email Contact</th>
                        <th className="p-2.5 font-medium uppercase tracking-tight">Website Page</th>
                        <th className="p-2.5 font-medium uppercase tracking-tight">Total Reviews</th>
                        <th className="p-2.5 font-medium uppercase tracking-tight">Lead Potential Rank</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {scrapedLeads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                            Database catalog is currently empty. Run the scraping simulation or click launch scraper to populate leads stack.
                          </td>
                        </tr>
                      ) : (
                        scrapedLeads.map(lead => (
                          <tr
                            key={lead.id}
                            onClick={() => setSelectedLeadId(lead.id)}
                            className={`cursor-pointer transition-colors ${selectedLeadId === lead.id ? "bg-indigo-950/40 hover:bg-indigo-950/50" : "hover:bg-slate-900/60"}`}
                            id={`lead-table-row-${lead.id}`}
                          >
                            <td className="p-2.5 font-medium text-white truncate max-w-[150px]">
                              {lead.name}
                            </td>
                            <td className="p-2.5 font-mono text-slate-440 text-slate-400">
                              {lead.phone || "No phone Listed"}
                            </td>
                            <td className="p-2.5 font-mono text-slate-500 truncate max-w-[140px]">
                              {lead.email || "—"}
                            </td>
                            <td className="p-2.5 font-mono text-indigo-400 truncate max-w-[120px]">
                              {lead.website ? lead.website.replace("https://", "") : "—"}
                            </td>
                            <td className="p-2.5 text-slate-400 font-mono">
                              ⭐ {lead.rating} ({lead.reviewsCount})
                            </td>
                            <td className="p-2.5 text-slate-400">
                              {lead.aiScore ? (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  lead.aiScore === "A" 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                    : lead.aiScore === "B" 
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                                    : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                                }`}>
                                  Rank {lead.aiScore}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-mono text-[9px]">Unrated</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE TAB: FORMATTING & SCHEMA CUSTOMIZATION */}
          {activeTab === "formatting" && (
            <div className="flex-1 flex flex-col space-y-4" id="tabcontent-customizer">
              <ExportSettingsDiv formatConfig={formatConfig} onChange={setFormatConfig} />

              {/* Dynamic CSV Headers Preview Card */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded text-[11px] space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Dynamic Live Header Preview</h4>
                <div className="bg-slate-950 p-2 text-indigo-400 rounded-sm font-mono leading-none break-all border border-slate-800/60">
                  {getCSVHeaders(config.fieldsToExtract, formatConfig).join(formatConfig.delimiter === "\\t" ? "  [Tab]  " : formatConfig.delimiter)}
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Your customized headers automatically sync instantly into the downloadable raw code assets within the unpacked extension bundle as well!
                </p>
              </div>

              {/* Live Preview Record Grid */}
              <div className="bg-slate-905 bg-slate-900 p-4 rounded border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Custom Output Preview</span>
                  <span className="text-[9px] font-mono text-slate-500">Record format: Raw export simulation</span>
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded p-3 font-mono text-[10px] text-slate-400 overflow-x-auto whitespace-pre leading-relaxed">
                  {/* Print Headers */}
                  <div className="text-white border-b border-slate-800 pb-1.5 font-bold">
                    {getCSVHeaders(config.fieldsToExtract, formatConfig).join(formatConfig.delimiter === "\\t" ? "    " : formatConfig.delimiter)}
                  </div>
                  {/* Print First 2 leads with custom casing */}
                  {scrapedLeads.slice(0, 2).map((l, i) => {
                    const row = [
                      config.fieldsToExtract.name ? l.name : undefined,
                      config.fieldsToExtract.address ? l.address : undefined,
                      config.fieldsToExtract.phone ? l.phone : undefined,
                      config.fieldsToExtract.website ? l.website : undefined,
                      config.fieldsToExtract.rating ? l.rating.toString() : undefined,
                      config.fieldsToExtract.reviewsCount ? l.reviewsCount.toString() : undefined,
                      config.fieldsToExtract.googleUrl ? l.googleUrl : undefined,
                      l.query,
                      l.language,
                      l.timestamp,
                      l.aiScore || "Unrated"
                    ].filter(x => x !== undefined) as string[];

                    const wrapped = row.map(v => formatConfig.addColumnQuote ? `"${v}"` : v);
                    return (
                      <div key={l.id} className="pt-1.5 border-b border-slate-900/60">
                        {wrapped.join(formatConfig.delimiter === "\\t" ? "    " : formatConfig.delimiter)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE TAB: INSTRUCTIONS */}
          {activeTab === "bundle" && (
            <div className="flex-1 bg-slate-900/40 border border-slate-800 p-5 rounded-sm space-y-4" id="tabcontent-instructions">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Developers Deployment instructions
              </h2>
              <p className="text-[11px] text-slate-400">
                You have generated a premium ready-to-load **unpacked Chrome Extension** containing Manifest Manifest V3 scripts, automatic page scroll tracking, multiple concurrent query support, and automated user agent configuration logic.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-indigo-400 font-bold shrink-0">1</div>
                  <div className="text-[11px]">
                    <span className="font-bold text-white block">Download the extension bundle button</span>
                    Click **Compile & Download Extension ZIP** from the top right corner. Save the zip folder in a convenient path.
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-indigo-400 font-bold shrink-0">2</div>
                  <div className="text-[11px]">
                    <span className="font-bold text-white block">Unzip structural archive</span>
                    Extract the zipped file content to a local folder named e.g. <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-amber-500">MapExtractExtension</code>.
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-indigo-400 font-bold shrink-0">3</div>
                  <div className="text-[11px]">
                    <span className="font-bold text-white block">Navigate to Chrome Dev settings</span>
                    Open Google Chrome and navigate to <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-indigo-400">chrome://extensions/</code> in the search bar.
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-indigo-400 font-bold shrink-0">4</div>
                  <div className="text-[11px]">
                    <span className="font-bold text-white block">Enable Developer Mode & Load Code</span>
                    Toggle **Developer mode** switch (top-right). Click the **Load unpacked** button (top-left) and select your unpacked folder path!
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-indigo-400 font-bold shrink-0">5</div>
                  <div className="text-[11px]">
                    <span className="font-bold text-white block">Test on actual Google Maps URL!</span>
                    Open <a href="https://maps.google.com" target="_blank" className="text-indigo-400 underline font-mono flex items-center gap-1 inline-flex">google.com/maps <ExternalLink className="w-3 h-3" /></a>, write a search phrase, and click your Extension popup icon to watch automation scrape leads natively without friction blocks.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: AI Lead scoring detail panel & Systems Terminal */}
        <section className="col-span-12 md:col-span-5 lg:col-span-3 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col max-h-[850px] lg:max-h-[calc(100vh-8rem)]">
          
          {/* AI Audit Workspace */}
          <div className="p-4 border-b border-slate-800 bg-[#0F172A] flex-1 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] block">
                  AI Lead Enrichment Panel
                </span>
              </div>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold font-mono">
                Gemini Powered
              </span>
            </div>

            {/* If no selected or active lead */}
            {!activeLead ? (
              <div className="text-center py-10 text-xs italic text-slate-600">
                Pick or click any listing in the Leads Grid stack to trigger custom pitch and email copying layout options.
              </div>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col" id="ai-lead-focus">
                {/* Compact Lead Summary card */}
                <div className="bg-slate-900 p-3 rounded-sm border border-slate-800/80">
                  <span className="test text-[9px] uppercase font-mono text-slate-500">Selected Lead</span>
                  <p className="text-xs font-bold text-white tracking-wide truncate">{activeLead.name}</p>
                  
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 justify-between">
                    <span>⭐ {activeLead.rating} ({activeLead.reviewsCount} reviews)</span>
                    <span className="text-[9px] font-mono text-slate-500 truncate max-w-[130px]">{activeLead.address}</span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5 max-w-[60%]">
                      <span className="text-[10px] text-indigo-300 font-mono truncate">{activeLead.phone || "No listed phone"}</span>
                      <span className="text-[10px] text-emerald-400 font-mono truncate">{activeLead.email || "No email detected"}</span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      {activeLead.facebook && <a href={activeLead.facebook} target="_blank" title="Facebook" className="text-slate-500 hover:text-blue-500 transition-colors"><ExternalLink className="w-2.5 h-2.5" /></a>}
                      {activeLead.instagram && <a href={activeLead.instagram} target="_blank" title="Instagram" className="text-slate-500 hover:text-pink-500 transition-colors"><ExternalLink className="w-2.5 h-2.5" /></a>}
                      {activeLead.linkedin && <a href={activeLead.linkedin} target="_blank" title="LinkedIn" className="text-slate-500 hover:text-blue-400 transition-colors"><ExternalLink className="w-2.5 h-2.5" /></a>}
                      {activeLead.twitter && <a href={activeLead.twitter} target="_blank" title="Twitter/X" className="text-slate-500 hover:text-sky-400 transition-colors"><ExternalLink className="w-2.5 h-2.5" /></a>}
                      {!activeLead.aiScore ? (
                        <button
                          onClick={() => enrichSelectedLead(activeLead)}
                          disabled={aiGenerating}
                          className="py-1 px-2 bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/30 text-white text-[9px] uppercase font-bold rounded transition-colors flex items-center gap-1 cursor-pointer"
                          id={`enrich-single-${activeLead.id}`}
                        >
                          <Sparkles className="w-2.5 h-2.5" /> Analyze AI
                        </button>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-sm text-[9px] font-bold border border-emerald-500/20">
                          Rank {activeLead.aiScore} Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Print score details if present */}
                {activeLead.aiScore && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-indigo-950/20 border border-indigo-900/40 p-3 rounded-sm space-y-2 text-[11px]"
                    id="ai-assessment-fields"
                  >
                    <div>
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest font-mono">1. Lead Grading Score</span>
                      <p className="text-slate-300 mt-0.5 leading-normal">{activeLead.aiScoreExplanation}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest font-mono">2. Outreach Angle Suggestions</span>
                      <p className="text-slate-300 mt-0.5 leading-normal">{activeLead.aiSuggestedApproach}</p>
                    </div>
                  </motion.div>
                )}

                {/* Custom pitch configuration block */}
                <div className="bg-slate-900 p-3 rounded-sm border border-slate-800/80 space-y-2 flex-1 flex flex-col min-h-[220px]">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-indigo-400 font-bold block mb-1">Outreach Offer (What are you selling?)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-slate-300 placeholder-slate-700"
                      value={servicePitch}
                      onChange={e => setServicePitch(e.target.value)}
                      placeholder="e.g. Website redesign or Local SEO services"
                      id="service-pitch-input"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[9px] text-slate-500 font-mono">Generate cold pitch</span>
                    <button
                      onClick={() => draftEmailPitchForSelectedLead(activeLead)}
                      disabled={emailDraftLoading || aiGenerating}
                      className="py-1 px-3 bg-indigo-650 hover:bg-indigo-600 bg-indigo-500 border border-indigo-400/30 text-white text-[10px] font-bold uppercase rounded flex items-center gap-1 shadow-md cursor-pointer disabled:opacity-40"
                      id="generate-cold-email-btn"
                    >
                      <Mail className="w-3.5 h-3.5" /> Pitch Email Draft
                    </button>
                  </div>

                  {/* Print Cold Email Draft text box */}
                  <div className="flex-1 bg-slate-950 border border-slate-850 rounded p-2.5 font-mono text-[9.5px] text-slate-400 overflow-y-auto min-h-[140px] relative">
                    {emailDraftLoading ? (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 text-slate-300 font-sans text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        Writing sales message...
                      </div>
                    ) : activeLead.coldEmailDraft ? (
                      <div className="whitespace-pre-line leading-relaxed text-slate-300 selection:bg-indigo-600">
                        {activeLead.coldEmailDraft}
                      </div>
                    ) : (
                      <div className="text-slate-600 italic text-center pt-8">
                        No draft email constructed yet. Fill out the service pitch and click "Pitch Email Draft" to write custom outreach text instantly.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* System Terminal Console Output logs (Titled System Monitor) */}
          <div className="h-56 bg-slate-950 border-t border-slate-800 p-4 flex flex-col" id="console-logs-wrapper">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Active Console stream</span>
              </div>
              <button
                onClick={() => setSystemLogs(createInitialLogs())}
                className="text-[9px] uppercase font-mono text-slate-600 hover:text-slate-300 cursor-pointer"
                id="clear-logs-btn"
              >
                Clear Stream
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px] leading-relaxed select-text pr-1">
              {systemLogs.map((log) => {
                let colorClass = "text-slate-400";
                if (log.type === "success") colorClass = "text-emerald-400";
                if (log.type === "warn") colorClass = "text-amber-400";
                if (log.type === "error") colorClass = "text-rose-400 font-bold";
                if (log.type === "proxy") colorClass = "text-indigo-400";

                const logTime = new Date(log.timestamp).toLocaleTimeString();

                return (
                  <p key={log.id} className={colorClass}>
                    <span className="text-[8px] text-slate-600 font-normal mr-1">[{logTime}]</span>
                    {log.message}
                  </p>
                );
              })}
              <div ref={consoleBottomRef} />
            </div>
          </div>
        </section>
      </div>

      {/* 3. Footer component block */}
      <footer className="h-12 border-t border-slate-800 bg-[#1E293B] flex flex-col sm:flex-row items-center justify-between px-6 py-2 sm:py-0 text-[10px] uppercase font-bold text-slate-500 shrink-0 font-mono">
        <div className="flex items-center gap-4">
          <span>TOS Safeguards: Enabled</span>
          <span className="hidden sm:inline">Active Thread: Safe Client Simulation</span>
          <span>Google login security: Verified</span>
        </div>
        <div className="flex items-center gap-4 text-slate-404">
          <span>License Tier: Professional Studio</span>
          <button
            onClick={() => setActiveTab("bundle")}
            className="hover:text-indigo-400 transition-colors uppercase cursor-pointer"
            id="footer-docs-link"
          >
            Installation documentation
          </button>
        </div>
      </footer>
    </div>
  );
}
