import React from "react";
import { CustomFormatConfig } from "../types";
import { FileSpreadsheet, Quote, CaseUpper, FileEdit } from "lucide-react";

interface ExportSettingsDivProps {
  formatConfig: CustomFormatConfig;
  onChange: (newFormat: CustomFormatConfig) => void;
}

export const ExportSettingsDiv: React.FC<ExportSettingsDivProps> = ({ formatConfig, onChange }) => {
  const handleHeaderMapChange = (key: string, value: string) => {
    onChange({
      ...formatConfig,
      customHeaders: {
        ...formatConfig.customHeaders,
        [key]: value
      }
    });
  };

  return (
    <div className="bg-[#1E293B]/70 border border-slate-800 p-5 rounded-sm space-y-5" id="export-settings-panel">
      <div>
        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <FileSpreadsheet className="w-3.5 h-3.5" /> CSV Custom Layout Options
        </h3>
        <p className="text-[11px] text-slate-400 mb-4">
          Determine custom casing, separators, and column encapsulations to match your database or CRM import models perfectly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CSV Separator options */}
        <div className="bg-slate-900/60 p-3 rounded-sm border border-slate-800/80">
          <label className="text-[11px] text-indigo-300 font-bold block uppercase mb-1.5 font-mono">1. Column Separator</label>
          <select
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-1.5 text-xs text-slate-300 outline-none"
            value={formatConfig.delimiter}
            onChange={e => onChange({ ...formatConfig, delimiter: e.target.value as any })}
            id="separator-dropdown"
          >
            <option value=",">Comma ( , )</option>
            <option value=";">Semicolon ( ; )</option>
            <option value="|">Pipe ( | )</option>
            <option value="\t">Tab ( \t )</option>
          </select>
        </div>

        {/* Column quotes */}
        <div className="bg-slate-900/60 p-3 rounded-sm border border-slate-800/80 flex flex-col justify-between">
          <div>
            <label className="text-[11px] text-indigo-300 font-bold block uppercase mb-1 font-mono">2. Quote Wrap</label>
            <p className="text-[10px] text-slate-500 mb-2 leading-tight">Force wrap strings inside double quotes.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ ...formatConfig, addColumnQuote: true })}
              className={`flex-1 py-1 px-3 text-xs rounded transition-all ${formatConfig.addColumnQuote ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-950 hover:bg-slate-800 text-slate-400'}`}
              id="quote-wrap-on"
            >
              Enabled
            </button>
            <button
              onClick={() => onChange({ ...formatConfig, addColumnQuote: false })}
              className={`flex-1 py-1 px-3 text-xs rounded transition-all ${!formatConfig.addColumnQuote ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-950 hover:bg-slate-800 text-slate-400'}`}
              id="quote-wrap-off"
            >
              Disabled
            </button>
          </div>
        </div>

        {/* Header casing mapping */}
        <div className="bg-slate-900/60 p-3 rounded-sm border border-slate-800/80">
          <label className="text-[11px] text-indigo-300 font-bold block uppercase mb-1.5 font-mono">3. Column Title Casing</label>
          <select
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-1.5 text-xs text-slate-300 outline-none"
            value={formatConfig.headerCasing}
            onChange={e => onChange({ ...formatConfig, headerCasing: e.target.value as any })}
            id="casing-dropdown"
          >
            <option value="original">original_format</option>
            <option value="upper">UPPERCASE_FORMAT</option>
            <option value="lower">lowercase_format</option>
            <option value="camel">camelCaseFormat</option>
            <option value="title">Title Case Format</option>
          </select>
        </div>
      </div>

      {/* Manual Column Headers Overrides */}
      <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-sm">
        <label className="text-[11px] text-indigo-300 font-bold uppercase tracking-wide block mb-3 font-mono flex items-center gap-1.5">
          <FileEdit className="w-3.5 h-3.5" /> 4. Custom Column Renaming Map
        </label>
        <p className="text-[10px] text-slate-500 mb-3 leading-tight">
          Rename default database attributes to match custom fields in CRM templates (Hubspot, Salesforce, Close.io, etc.). Leave empty to use system default casing.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "name", label: "Business Name" },
            { key: "phone", label: "Phone" },
            { key: "website", label: "Website Link" },
            { key: "address", label: "Lead Address" },
            { key: "rating", label: "Google Rating" },
            { key: "reviews_count", label: "Reviews Count" },
            { key: "google_url", label: "Google Maps URL" },
            { key: "ai_score", label: "AI Score Grade" }
          ].map(field => (
            <div key={field.key} className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono italic block">{field.label}:</span>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs mb-1 font-mono text-slate-300 placeholder-slate-700 focus:border-indigo-600 transition-colors"
                value={formatConfig.customHeaders[field.key] || ""}
                onChange={e => handleHeaderMapChange(field.key, e.target.value)}
                placeholder={field.key}
                id={`rename-map-${field.key}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
