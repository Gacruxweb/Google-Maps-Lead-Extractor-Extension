// MapExtract Expert popup logic
let extLeads = [];
let extActive = false;

// Initial load
chrome.storage.local.get(["scrapedLeads"], (result) => {
  if (result.scrapedLeads) {
    extLeads = result.scrapedLeads;
    document.getElementById("metric-scraped").textContent = extLeads.length;
    addLog("info", "Recovered " + extLeads.length + " leads from background session.");
  }
});

document.getElementById("btn-start").addEventListener("click", () => {
  const queryBox = document.getElementById("queries-input").value;
  const queries = queryBox.split("\n").filter(q => q.trim() !== "");
  const minDelaySec = parseFloat(document.getElementById("min-delay").value) || 2;
  const maxDelaySec = parseFloat(document.getElementById("max-delay").value) || 5;
  const maxL = parseInt(document.getElementById("limit").value, 10) || 50;

  if (queries.length === 0) {
    addLog("error", "Please write at least one query.");
    return;
  }

  // Clear previous session data if starting fresh
  chrome.runtime.sendMessage({ type: "CLEAR_LEADS" }, () => {
    extLeads = [];
    document.getElementById("metric-scraped").textContent = "0";
    addLog("info", "Starting Scraper for " + queries.length + " search targets...");
    extActive = true;
    
    // Inject active maps tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url && (currentTab.url.includes("google.com/maps") || currentTab.url.includes("google.co.uk/maps"))) {
        
        // Use scripting API as a fallback to ensure content script is injected if first attempt fails
        chrome.tabs.sendMessage(currentTab.id, {
          action: "START_SCRAPING",
          minDelay: minDelaySec * 1000,
          maxDelay: maxDelaySec * 1000,
          maxResults: maxL
        }, (response) => {
          if (chrome.runtime.lastError) {
            addLog("error", "Connection failed. Please refresh the Google Maps page and try again.");
          } else {
            addLog("success", "Scraper handshaking successful. Engine running.");
          }
        });
      } else {
        addLog("warn", "Please open Google Maps before starting.");
      }
    });
  });
});

document.getElementById("btn-stop").addEventListener("click", () => {
  extActive = false;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (currentTab) {
      chrome.tabs.sendMessage(currentTab.id, { action: "STOP_SCRAPING" });
    }
  });
  addLog("info", "Scraper stop command submitted.");
});

document.getElementById("btn-export").addEventListener("click", () => {
  if (extLeads.length === 0) {
    alert("No leads have been extracted to export yet.");
    return;
  }
  
  // Dynamic headers including AI and Social fields
  const headers = [
    "Business Name", "Address", "Phone", "Website", "Rating", "Reviews", 
    "Google URL", "Query", "Language", "Timestamp", 
    "Facebook", "Instagram", "LinkedIn", "Twitter",
    "AI Score", "AI Explanation", "AI Outreach strategy"
  ];
  
  let csvContent = "\ufeff"; // BOM for Excel compatibility
  csvContent += headers.join(",") + "\n";
  
  extLeads.forEach(lead => {
    if (!lead) return;
    const row = [
      escapeCSV(lead.name || ""),
      escapeCSV(lead.address || ""),
      escapeCSV(lead.phone || ""),
      escapeCSV(lead.website || ""),
      lead.rating || 0,
      lead.reviewsCount || 0,
      escapeCSV(lead.googleUrl || ""),
      escapeCSV(lead.query || ""),
      escapeCSV(lead.language || ""),
      escapeCSV(lead.timestamp || ""),
      escapeCSV(lead.facebook || ""),
      escapeCSV(lead.instagram || ""),
      escapeCSV(lead.linkedin || ""),
      escapeCSV(lead.twitter || ""),
      escapeCSV(lead.aiScore || "Unrated"),
      escapeCSV(lead.aiScoreExplanation || ""),
      escapeCSV(lead.aiSuggestedApproach || "")
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `mapextract_leads_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

function escapeCSV(val) {
  if (val === undefined || val === null) return "";
  let str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Runtime Listener
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "LEAD_EXTRACTED" && message.lead) {
    extLeads.push(message.lead);
    document.getElementById("metric-scraped").textContent = extLeads.length;
    addLog("success", "Scraped: " + (message.lead.name || "Unknown"));
  }
  
  if (message.type === "SCRAPE_PAGE_COMPLETE") {
    chrome.runtime.sendMessage({ type: "GET_CURRENT_CONFIG" }, (config) => {
      if (config && config.activeProxy) {
        document.getElementById("metric-proxy").textContent = config.activeProxy;
        addLog("info", "Proxy rotated to: " + config.activeProxy);
      }
    });
  }
  
  if (message.type === "SCRAPING_COMPLETE") {
    addLog("success", "Scraping Session successfully complete! Count: " + extLeads.length);
  }
});

function addLog(type, msg) {
  const box = document.getElementById("console-logs");
  const div = document.createElement("div");
  const time = new Date().toLocaleTimeString();
  div.textContent = "[" + time + "] " + msg;
  if (type === "success") div.className = "log-success";
  if (type === "warn") div.className = "log-warn";
  if (type === "error") div.className = "log-error";
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// Handshake proxy check on popup load
chrome.runtime.sendMessage({ type: "GET_CURRENT_CONFIG" }, (config) => {
  if (config && config.activeProxy) {
    document.getElementById("metric-proxy").textContent = config.activeProxy;
  }
});
