import React from "react";
import { ScraperConfig } from "../types";
import { Settings, Shield, Globe, Layers, RefreshCw, Layers3, ToggleLeft, ToggleRight, HelpCircle } from "lucide-react";

interface SidebarSettingsProps {
  config: ScraperConfig;
  onChange: (newConfig: ScraperConfig) => void;
}

export const SidebarSettings: React.FC<SidebarSettingsProps> = ({ config, onChange }) => {
  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split("\n").filter(q => q.trim() !== "");
    onChange({ ...config, queries: lines });
  };

  const handleFieldToggle = (field: keyof ScraperConfig["fieldsToExtract"]) => {
    onChange({
      ...config,
      fieldsToExtract: {
        ...config.fieldsToExtract,
        [field]: !config.fieldsToExtract[field]
      }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto border-r border-slate-800 bg-[#0F172A]" id="sidebar-settings">
      {/* Search Parameters Section */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-indigo-400" />
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Search Parameters</label>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-slate-500 block font-medium">Search Queries (One per line)</label>
              <div className="group relative">
                <HelpCircle className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400 cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded shadow-xl text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Target list of searches the engine will perform on Google Maps. e.g. "Pizza NYC" or "Hospitals London". One search per line.
                </div>
              </div>
            </div>
            <textarea
              className="w-full h-24 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded p-2 text-xs font-mono text-slate-300 outline-none resize-none transition-all"
              value={config.queries.join("\n")}
              onChange={handleQueryChange}
              placeholder="e.g. Coffee London&#10;Bakery Paris&#10;Dentist Berlin"
              id="search-queries"
            />
            <span className="text-[9px] text-slate-500 font-mono mt-1 block tracking-tight">Active Queries Count: {config.queries.length}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Language (hl)</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-1.5 text-xs text-slate-300 outline-none"
                value={config.hlLanguage}
                onChange={e => onChange({ ...config, hlLanguage: e.target.value })}
                id="language-select"
              >
                <option value="en">English (en)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
                <option value="es">Spanish (es)</option>
                <option value="it">Italian (it)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Region (gl)</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-1.5 text-xs text-slate-300 outline-none"
                value={config.glRegion}
                onChange={e => onChange({ ...config, glRegion: e.target.value })}
                id="region-select"
              >
                <option value="US">United States (US)</option>
                <option value="FR">France (FR)</option>
                <option value="DE">Germany (DE)</option>
                <option value="ES">Spain (ES)</option>
                <option value="GB">United Kingdom (GB)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Target Fields Config */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Layers3 className="w-4 h-4 text-indigo-400" />
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Target Fields</label>
        </div>
        
        <div className="space-y-2">
          {Object.entries(config.fieldsToExtract).map(([field, enabled]) => (
            <div
              key={field}
              onClick={() => handleFieldToggle(field as keyof ScraperConfig["fieldsToExtract"])}
              className="flex items-center justify-between p-2 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 rounded-sm cursor-pointer transition-all"
              id={`field-toggle-${field}`}
            >
              <span className="text-xs text-slate-400 capitalize">{field.replace(/([A-Z])/g, " $1")}</span>
              {enabled ? (
                <ToggleRight className="w-5 h-5 text-indigo-400" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Speed Dial & Human Limits */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Speed Control (TOS-Safety)</label>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-500">Min Sleep: {config.minDelay / 1000}s</span>
              <span className="text-slate-500">Max Sleep: {config.maxDelay / 1000}s</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1"
                max="20"
                className="bg-slate-950 border border-slate-800 rounded p-1 text-xs text-center font-mono"
                value={config.minDelay / 1000}
                onChange={e => onChange({ ...config, minDelay: Math.max(1, parseFloat(e.target.value) || 2) * 1000 })}
                placeholder="Min Sec"
                id="min-delay-input"
              />
              <input
                type="number"
                min="1"
                max="60"
                className="bg-slate-950 border border-slate-800 rounded p-1 text-xs text-center font-mono"
                value={config.maxDelay / 1000}
                onChange={e => onChange({ ...config, maxDelay: Math.max(1, parseFloat(e.target.value) || 5) * 1000 })}
                placeholder="Max Sec"
                id="max-delay-input"
              />
            </div>
            <p className="text-[10px] text-indigo-400/70 mt-1.5 font-mono leading-tight">
              💡 Random delay between requests prevents pattern triggers on Google Maps. We encourage 3s-6s.
            </p>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Result Cap per Search Query</label>
            <input
              type="number"
              min="10"
              max="500"
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-left font-mono"
              value={config.maxResultsPerQuery}
              onChange={e => onChange({ ...config, maxResultsPerQuery: Math.max(5, parseInt(e.target.value, 10) || 50) })}
              id="max-results-input"
            />
          </div>
        </div>
      </div>

      {/* Proxy Server Settings */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-indigo-400" />
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Proxy Pool & Anti-Ban</label>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 mb-1.5 block">IP Rotation Nodes (One per line)</label>
            <textarea
              className="w-full h-20 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-1.5 text-xs font-mono text-slate-300 outline-none resize-none"
              value={config.proxyList.join("\n")}
              onChange={e => onChange({ ...config, proxyList: e.target.value.split("\n").filter(p => p.trim() !== "") })}
              placeholder="e.g. 192.168.1.1:8080&#10;user:pass@45.21.32.12:3128"
              id="proxy-list-text"
            />
            <span className="text-[9px] font-mono text-slate-400">Total Proxies: {config.proxyList.length}</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Rotate Proxy every N pages</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-300 outline-none"
              value={config.rotateProxyPerNQueriesOrPages}
              onChange={e => onChange({ ...config, rotateProxyPerNQueriesOrPages: parseInt(e.target.value, 10) })}
              id="proxy-rotation-select"
            >
              <option value="1">1 page scrolled (Speed-Sensitive)</option>
              <option value="2">2 pages scrolled (Standard)</option>
              <option value="5">5 pages scrolled (Balanced)</option>
              <option value="10">10 pages scrolled (Slow-rate)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Auto-Updating Settings */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-indigo-400" />
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Auto-Update Endpoint</label>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Version tag</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs font-mono"
              value={config.currentVersion}
              onChange={e => onChange({ ...config, currentVersion: e.target.value })}
              placeholder="1.0.0"
              id="current-version"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">JSON Autoupdate Server URL</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs font-mono text-slate-400"
              value={config.customAutoUpdateUrl}
              onChange={e => onChange({ ...config, customAutoUpdateUrl: e.target.value })}
              placeholder="https://api.github.com/..."
              id="autoupdate-url"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
