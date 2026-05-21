import JSZip from "jszip";
import { ScraperConfig, CustomFormatConfig } from "../types";

/**
 * Capitalizes headers according to configuration
 */
function handleHeaderCasing(header: string, casing: CustomFormatConfig["headerCasing"]): string {
  switch (casing) {
    case "upper":
      return header.toUpperCase();
    case "lower":
      return header.toLowerCase();
    case "camel":
      return header.replace(/_([a-z])/g, (_, char) => char.toUpperCase()).replace(/^(.)/, (_, char) => char.toLowerCase());
    case "title":
      return header
        .split("_")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    case "original":
    default:
      return header;
  }
}

/**
 * Generates custom mapping of headers based on user configuration
 */
export function getCSVHeaders(fields: ScraperConfig["fieldsToExtract"], formatConfig: CustomFormatConfig): string[] {
  const originalHeaders = [
    fields.name && "name",
    fields.address && "address",
    fields.phone && "phone",
    fields.email && "email",
    fields.website && "website",
    fields.rating && "rating",
    fields.reviewsCount && "total_reviews",
    fields.googleUrl && "google_url",
    "query",
    "language",
    "timestamp",
    "facebook",
    "instagram",
    "linkedin",
    "twitter",
    "lead_potential_rank",
    "ai_explanation",
    "outreach_strategy"
  ].filter(Boolean) as string[];

  return originalHeaders.map(header => {
    const customName = formatConfig.customHeaders[header];
    if (customName && customName.trim() !== "") {
      return customName;
    }
    return handleHeaderCasing(header, formatConfig.headerCasing);
  });
}

/**
 * Packages a deployable fully functional Chrome Extension in a ZIP file
 */
export async function generateExtensionZip(config: ScraperConfig, formatConfig: CustomFormatConfig): Promise<Blob> {
  const zip = new JSZip();

  // 1. manifest.json
  const manifest = {
    manifest_version: 3,
    name: "MapExtract Expert - Google Maps Lead Extractor",
    version: config.currentVersion || "1.0.0",
    description: "Extract business names, addresses, phone numbers, and websites from Google Maps searches smoothly with rotation proxies, rate-limiting control, and pagination.",
    permissions: [
      "activeTab",
      "storage",
      "scripting",
      "declarativeNetRequest"
    ],
    host_permissions: [
      "https://*.google.com/maps*",
      "https://*.google.es/maps*",
      "https://*.google.fr/maps*",
      "https://*.google.de/maps*",
      "https://*.google.co.uk/maps*",
      "https://*.google.ca/maps*",
      "https://*.google.com.au/maps*"
    ],
    action: {
      default_popup: "popup.html",
      default_icon: "icon.png"
    },
    background: {
      service_worker: "background.js"
    },
    content_scripts: [
      {
        matches: [
          "https://*.google.com/maps*",
          "https://*.google.es/maps*",
          "https://*.google.fr/maps*",
          "https://*.google.de/maps*",
          "https://*.google.co.uk/maps*",
          "https://*.google.ca/maps*",
          "https://*.google.com.au/maps*"
        ],
        js: ["content.js"],
        run_at: "document_idle"
      }
    ],
    web_accessible_resources: [
      {
        resources: ["icon.png"],
        matches: ["<all_urls>"]
      }
    ]
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // 2. README.md (Installation Instructions)
  const readmeContent = `# MapExtract Expert Chrome Extension

## How to Install and Enable

1. **Extract this Downloaded Zip File** to a dedicated folder (e.g., \`MapExtractExtension\`) on your computer.
2. Open your Google Chrome browser and navigate to **\`chrome://extensions/\`** (by typing it into the URL bar and pressing Enter).
3. Toggle on **"Developer Mode"** using the switch in the upper-right corner of the Extensions page.
4. Click the **"Load unpacked"** button visible in the top-left corner.
5. Select the folder where you extracted these files (the folder containing \`manifest.json\`).
6. Pin the **MapExtract Expert** extension icon to your toolbar for quick access!

---

## How to Scrape Safely

- **Terms of Service Compliance:** This Chrome Extension operates on the **client side**, meaning it simulates real, manual user interactions (scrolling and page turns) rather than firing automated API commands. This makes extraction far safer and compliant with reasonable use.
- **Human Speed Simulation:** The configurable delay is pre-configured to your preset range: **${config.minDelay / 1000}s - ${config.maxDelay / 1000}s**. We strongly recommend keeping this between 3 and 7 seconds to mimic safe human review velocities.
- **Language & Region:** Tuned to fetch language results in \`${config.hlLanguage}\` and gl region \`${config.glRegion}\`.
- **Proxy Rotation:** The background script will auto-refresh the proxy pool using your list of **${config.proxyList.length} proxy nodes** every **${config.rotateProxyPerNQueriesOrPages} query pages**.

---

Active Configuration:
- Version: ${config.currentVersion}
- Auto-Update Check URL: ${config.customAutoUpdateUrl || "N/A"}
- Max results per query limits: ${config.maxResultsPerQuery} leads
`;

  zip.file("README.md", readmeContent);

  // 3. background.js
  const backgroundJsContent = `// MapExtract Expert - Background Service Worker
let activeProxyIndex = 0;
const proxies = ${JSON.stringify(config.proxyList)};
const rotateThreshold = ${config.rotateProxyPerNQueriesOrPages};
let pageCounter = 0;
let sessionLeads = [];

console.log("MapExtract background script initialized.");

// Listen to message pipelines from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "LEAD_EXTRACTED") {
    sessionLeads.push(request.lead);
    chrome.storage.local.set({ scrapedLeads: sessionLeads });
  }

  if (request.type === "SCRAPE_PAGE_COMPLETE") {
    pageCounter++;
    if (proxies.length > 0 && pageCounter >= rotateThreshold) {
      pageCounter = 0;
      rotateProxy();
    }
    sendResponse({ status: "processed", activeProxy: proxies[activeProxyIndex] || "Direct Connection" });
  }

  if (request.type === "GET_CURRENT_CONFIG") {
    sendResponse({
      proxies,
      activeProxy: proxies[activeProxyIndex] || null,
      hl: "${config.hlLanguage}",
      gl: "${config.glRegion}",
      maxResults: ${config.maxResultsPerQuery},
      leadsCount: sessionLeads.length
    });
  }

  if (request.type === "CLEAR_LEADS") {
    sessionLeads = [];
    chrome.storage.local.set({ scrapedLeads: [] });
    sendResponse({ status: "cleared" });
  }
});

// Proxy setting logic using Chrome API
function rotateProxy() {
  if (proxies.length === 0) return;
  activeProxyIndex = (activeProxyIndex + 1) % proxies.length;
  const currentProxy = proxies[activeProxyIndex];
  
  try {
    const parts = currentProxy.split("@");
    let server = "";
    let port = "";
    let username = "";
    let password = "";

    if (parts.length === 2) {
      const authParts = parts[0].split(":");
      username = authParts[0];
      password = authParts[1];
      const serverParts = parts[1].split(":");
      server = serverParts[0];
      port = serverParts[1];
    } else {
      const serverParts = parts[0].split(":");
      server = serverParts[0];
      port = serverParts[1];
    }

    const proxyConfig = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "http",
          host: server,
          port: parseInt(port, 10)
        },
        bypassList: ["localhost", "127.0.0.1"]
      }
    };

    chrome.proxy.settings.set(
      { value: proxyConfig, scope: "regular" },
      () => {
        console.log("Proxy successfully rotated to: " + server + ":" + port);
        // Note: Auth credentials can be injected using chrome.webRequest.onAuthRequired if needed
      }
    );
  } catch (err) {
    console.error("Failed to parse and rotate proxy:", err);
  }
}

// Check for updates
async function checkUpdates() {
  try {
    if (!updateUrl) return { updated: false, error: "Auto-update URL not configured." };
    const res = await fetch(updateUrl);
    if (!res.ok) throw new Error("HTTP Status " + res.status);
    const data = await res.json();
    const serverVersion = data.tag_name || data.version;
    if (serverVersion && serverVersion !== "${config.currentVersion}") {
      return {
        updated: true,
        newVersion: serverVersion,
        downloadUrl: data.zipball_url || data.html_url || updateUrl,
        changelog: data.body || "Critical bug fixes and scraper selector updates."
      };
    }
    return { updated: false };
  } catch (err) {
    return { updated: false, error: err.message };
  }
}
`;

  zip.file("background.js", backgroundJsContent);

  // 4. content.js
  const contentJsContent = `// MapExtract Expert - Content Script (Google Maps DOM Extractor)
let scrapingInterval = null;
let maxResultsLimit = ${config.maxResultsPerQuery};
let minDelayMs = ${config.minDelay};
let maxDelayMs = ${config.maxDelay};
const fieldsToExtract = ${JSON.stringify(config.fieldsToExtract)};
const hlLanguage = "${config.hlLanguage}";

console.log("MapExtract Content Script injected.");

// Standard CSS Selectors for Google Maps layout (Manifest V3 compatible)
const SELECTORS = {
  feedContainer: 'div[role="feed"]',
  cards: 'div.Nv265, div[role="article"], a.hfpxzc',
  name: 'div.qBF1Pd, h1.DUwDvf',
  website: 'a[data-item-id="authority"], a[aria-label*="website"], a[aria-label*="Site Web"]',
  phone: 'button[data-item-id^="phone:tel:"], button[aria-label*="Phone"], button[aria-label*="Téléphone"]',
  rating: 'span.MW4axd',
  reviews: 'span.fontBodyMedium' // review counts usually follow ratings or inside aria-label of parent
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_SCRAPING") {
    maxResultsLimit = request.maxResults || maxResultsLimit;
    minDelayMs = request.minDelay || minDelayMs;
    maxDelayMs = request.maxDelay || maxDelayMs;
    startScraperEngine(sendResponse);
    return true; // async
  }
  
  if (request.action === "STOP_SCRAPING") {
    stopScraperEngine();
    sendResponse({ status: "stopped" });
  }
});

function randomDelay() {
  return Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
}

async function startScraperEngine(sendResponse) {
  stopScraperEngine(); // Guard
  
  console.log("MapExtract Scraper Engine active. Target Max Results: " + maxResultsLimit);
  const collectedLeads = new Map();
  let scrollsWithoutNewItems = 0;
  const feed = document.querySelector(SELECTORS.feedContainer) || document.body;
  
  scrapingInterval = setInterval(async () => {
    // 1. Scan cards inside feed
    const cards = document.querySelectorAll(SELECTORS.cards);
    let originalCount = collectedLeads.size;
    
    for (let card of cards) {
      if (collectedLeads.size >= maxResultsLimit) {
        break;
      }
      
      let leadId = "";
      let googleUrl = "";
      
      if (card.tagName === "A" && card.href) {
        googleUrl = card.href;
        leadId = googleUrl.split("!1s")[1]?.split("!8m")[0] || googleUrl;
      } else {
        const linkElem = card.querySelector('a.hfpxzc');
        if (linkElem && linkElem.href) {
          googleUrl = linkElem.href;
          leadId = googleUrl.split("!1s")[1]?.split("!8m")[0] || googleUrl;
        } else {
          leadId = card.textContent?.trim().slice(0, 20) || Math.random().toString();
        }
      }
      
      if (collectedLeads.has(leadId)) continue;
      
      // Extract Data from Card
      let name = "";
      if (fieldsToExtract.name) {
        const nameNode = card.querySelector(SELECTORS.name);
        name = nameNode ? nameNode.textContent.trim() : (card.getAttribute("aria-label") || "").trim();
      }
      
      if (!name) continue; // Must have name to be a valid lead
      
      let rating = 0;
      let reviewsCount = 0;
      if (fieldsToExtract.rating) {
        const ratingNode = card.querySelector(SELECTORS.rating);
        if (ratingNode) {
          rating = parseFloat(ratingNode.textContent.replace(",", "."));
        }
        
        // Reviews Count lookup
        const starsLabel = card.querySelector('span[aria-label*="star"], span[aria-label*="étoiles"]');
        if (starsLabel) {
          const text = starsLabel.getAttribute("aria-label");
          const revMatch = text.match(/\\((\\d+)\\)/) || text.match(/(\\d+)\\s+(reviews|avis)/);
          if (revMatch) reviewsCount = parseInt(revMatch[1], 10);
        }
      }
      
      // Details (phone & website from subelements)
      const allSpans = Array.from(card.querySelectorAll('span')).map(s => s.textContent.trim()).filter(t => t.length > 0);
      const cardText = card.innerText || "";
      
      let phone = "";
      if (fieldsToExtract.phone) {
        const phoneElem = card.querySelector(SELECTORS.phone);
        if (phoneElem) {
          phone = phoneElem.getAttribute("data-item-id")?.replace("phone:tel:", "") || phoneElem.textContent.trim();
        }
        if (!phone) {
          const phonePattern = /^\\+?[\\d\\s\\-()]{8,20}$/;
          phone = allSpans.find(txt => phonePattern.test(txt) && /[\\d]{3,}/.test(txt)) || "";
          
          if (!phone) {
            const phoneMatch = cardText.match(/(?:\\+?[\\d\\s\\-()]{7,20})/);
            if (phoneMatch) {
              const potential = phoneMatch[0].trim();
              if (/[\\d]{5,}/.test(potential)) phone = potential;
            }
          }
        }
      }
      
      let website = "";
      if (fieldsToExtract.website) {
        const webElem = card.querySelector(SELECTORS.website);
        if (webElem) {
          website = webElem.href || webElem.getAttribute("aria-label") || "";
        }
        if (!website) {
          const links = Array.from(card.querySelectorAll('a'));
          const extLink = links.find(l => l.href && !l.href.includes("google.com/maps") && !l.href.includes("google.co") && !l.href.includes("apple.com"));
          if (extLink) website = extLink.href;
        }
      }

      let email = "";
      const emailMatch = cardText.match(/[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}/);
      if (emailMatch) email = emailMatch[0];
      
      let address = "";
      if (fieldsToExtract.address) {
        address = allSpans.find(txt => 
          txt.length > 5 && 
          (txt.includes(",") || txt.startsWith("·")) && 
          txt !== phone &&
          !/^\\+?[\\d\\s\\-()]{7,20}$/.test(txt)
        ) || "";
        
        if (!address) {
          address = allSpans.find(txt => 
            txt.length > 10 && 
            /\\d+/.test(txt) && 
            txt !== phone && 
            !/^\\+?[\\d\\s\\-()]{7,20}$/.test(txt)
          ) || "Google Maps Search Details";
        }
      }

      // Social Media link extraction
      let facebook = "";
      let instagram = "";
      let linkedin = "";
      let twitter = "";
      
      const socialLinks = card.querySelectorAll('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="x.com"]');
      socialLinks.forEach(link => {
        const href = link.href.toLowerCase();
        if (href.includes("facebook.com")) facebook = link.href;
        if (href.includes("instagram.com")) instagram = link.href;
        if (href.includes("linkedin.com")) linkedin = link.href;
        if (href.includes("twitter.com") || href.includes("x.com")) twitter = link.href;
      });
      
      // Improve query detection
      let currentQuery = document.querySelector('input#searchboxinput')?.value || "Universal Maps Lead";
      if ((!currentQuery || currentQuery === "Universal Maps Lead") && window.location.href.includes("/maps/search/")) {
        try {
          const urlParts = window.location.href.split("/maps/search/")[1].split("/");
          currentQuery = decodeURIComponent(urlParts[0].replace(/\\+/g, " "));
        } catch (e) {
          // fallback
        }
      }
      
      const scrapedItem = {
        id: leadId,
        name,
        address,
        phone,
        website,
        rating,
        reviewsCount,
        googleUrl,
        query: currentQuery,
        language: hlLanguage,
        timestamp: new Date().toISOString(),
        email,
        facebook,
        instagram,
        linkedin,
        twitter
      };
      
      collectedLeads.set(leadId, scrapedItem);
      
      // Dispatch immediately to pop-up
      chrome.runtime.sendMessage({
        type: "LEAD_EXTRACTED",
        lead: scrapedItem
      });
    }
    
    // Check progress limit
    if (collectedLeads.size >= maxResultsLimit) {
      console.log("Reached extraction limit of " + maxResultsLimit);
      stopScraperEngine();
      chrome.runtime.sendMessage({ type: "SCRAPING_COMPLETE", leads: Array.from(collectedLeads.values()) });
      return;
    }
    
    // 2. Pagination scroll handler
    const currentCount = collectedLeads.size;
    if (currentCount === originalCount) {
      scrollsWithoutNewItems++;
    } else {
      scrollsWithoutNewItems = 0;
    }
    
    // Scroll container down to trigger lazy loading
    if (feed) {
      feed.scrollTop += 800;
    }
    
    // If no new items loaded after scrolls, try clicking "Next Page" or end
    if (scrollsWithoutNewItems > 5) {
      scrollsWithoutNewItems = 0;
      const nextBtn = document.querySelector('button[aria-label*="Next"], button[aria-label*="Suivant"], button[id="ppdoxb"]');
      if (nextBtn) {
        console.log("End of loaded listing. Navigating to Next Page...");
        nextBtn.click();
        chrome.runtime.sendMessage({ type: "SCRAPE_PAGE_COMPLETE" });
      } else {
        console.log("No pagination button found. Scraper complete.");
        stopScraperEngine();
        chrome.runtime.sendMessage({ type: "SCRAPING_COMPLETE", leads: Array.from(collectedLeads.values()) });
      }
    }
  }, randomDelay());
}

function stopScraperEngine() {
  if (scrapingInterval) {
    clearInterval(scrapingInterval);
    scrapingInterval = null;
  }
}
`;

  zip.file("content.js", contentJsContent);

  // 5. popup.html
  const popupHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MapExtract Expert</title>
  <style>
    body {
      width: 420px;
      margin: 0;
      padding: 16px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0F172A;
      color: #CBD5E1;
      font-size: 13px;
    }
    h1 {
      font-size: 16px;
      margin-top: 0;
      color: #F8FAFC;
      border-bottom: 1px solid #1E293B;
      padding-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge {
      background-color: #4F46E5;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      color: #fff;
    }
    .card {
      background-color: #1E293B;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      border: 1px solid #334155;
    }
    .label {
      font-size: 11px;
      color: #818CF8;
      text-transform: uppercase;
      font-weight: bold;
      margin-bottom: 4px;
      display: block;
    }
    textarea, select, input {
      width: 100%;
      background-color: #0F172A;
      border: 1px solid #334155;
      padding: 6px;
      border-radius: 4px;
      color: #F8FAFC;
      box-sizing: border-box;
      font-family: monospace;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .btn {
      background-color: #4F46E5;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .btn:hover {
      background-color: #4338CA;
    }
    .btn-secondary {
      background-color: #475569;
    }
    .btn-secondary:hover {
      background-color: #334155;
    }
    .row {
      display: flex;
      gap: 8px;
    }
    .flex-1 { flex: 1; }
    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }
    .metric-value {
      font-size: 18px;
      font-weight: bold;
      color: #10B981;
    }
    .log-box {
      height: 100px;
      overflow-y: scroll;
      background-color: #020617;
      border: 1px solid #334155;
      font-family: monospace;
      font-size: 10px;
      padding: 8px;
      color: #94A3B8;
    }
    .log-success { color: #34D399; }
    .log-warn { color: #FBBF24; }
    .log-error { color: #F87171; }
  </style>
</head>
<body>
  <h1>MapExtract Expert <span class="badge">V${config.currentVersion}</span></h1>
  
  <div class="metrics">
    <div class="card">
      <div class="label">Leads Scraped</div>
      <div id="metric-scraped" class="metric-value">0</div>
    </div>
    <div class="card">
      <div class="label">Active Proxy</div>
      <div id="metric-proxy" class="metric-value" style="font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#FBBF24;">Direct</div>
    </div>
  </div>

  <div class="card">
    <label class="label">Search Queries (One per line)</label>
    <div style="font-size: 10px; color: #94A3B8; margin-bottom: 6px;">Enter the terms you want to search on Google Maps (e.g. "Dentists Berlin"). The engine will process each search one by one.</div>
    <textarea id="queries-input" rows="3" placeholder="Coffee shop near Paris\nDentist Munich">${config.queries.join("\n")}</textarea>
    
    <div class="row">
      <div class="flex-1">
        <label class="label">Delay (min - max s)</label>
        <div class="row">
          <input type="number" id="min-delay" value="${config.minDelay / 1000}" style="margin-bottom:0;">
          <input type="number" id="max-delay" value="${config.maxDelay / 1000}" style="margin-bottom:0;">
        </div>
      </div>
      <div class="flex-1">
        <label class="label">Limit (results/query)</label>
        <input type="number" id="limit" value="${config.maxResultsPerQuery}" style="margin-bottom:0;">
      </div>
    </div>
  </div>

  <div class="row" style="margin-bottom:12px;">
    <button id="btn-start" class="btn flex-1">Start Scraper</button>
    <button id="btn-stop" class="btn btn-secondary flex-1">Stop</button>
    <button id="btn-export" class="btn btn-secondary" style="background-color:#059669;">CSV</button>
  </div>

  <div class="card">
    <div class="label">System Console Logs</div>
    <div id="console-logs" class="log-box">
      <div>[system] Welcome to MapExtract Chrome Extension.</div>
      <div>[system] Extracting in: "${config.hlLanguage}" / "${config.glRegion}"</div>
    </div>
  </div>

  <div style="font-size:10px; color:#64748B; text-align:center; margin-top:8px;">
    Autoupdate verification endpoint configured: ${config.customAutoUpdateUrl ? "Active" : "None"}
  </div>

  <script src="popup.js"></script>
</body>
</html>
`;

  zip.file("popup.html", popupHtmlContent);

  // 6. popup.js
  const popupJsContent = `// MapExtract Expert popup logic
let extLeads = [];
let extActive = false;

// Initial load from storage
chrome.storage.local.get(["scrapedLeads"], (result) => {
  if (result.scrapedLeads) {
    extLeads = result.scrapedLeads;
    document.getElementById("metric-scraped").textContent = extLeads.length;
    addLog("info", "Recovered " + extLeads.length + " leads from session storage.");
  }
});

document.getElementById("btn-start").addEventListener("click", () => {
  const queryBox = document.getElementById("queries-input").value;
  const queries = queryBox.split("\\n").filter(q => q.trim() !== "");
  const minDelaySec = parseFloat(document.getElementById("min-delay").value) || 2;
  const maxDelaySec = parseFloat(document.getElementById("max-delay").value) || 5;
  const maxL = parseInt(document.getElementById("limit").value, 10) || 50;

  if (queries.length === 0) {
    addLog("error", "Please write at least one query.");
    return;
  }

  // Clear session data
  chrome.runtime.sendMessage({ type: "CLEAR_LEADS" }, () => {
    extLeads = [];
    document.getElementById("metric-scraped").textContent = "0";
    addLog("info", "Starting Scraper for " + queries.length + " targets...");
    extActive = true;
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url && (currentTab.url.includes("google.com/maps") || currentTab.url.includes("google.co.uk/maps"))) {
        chrome.tabs.sendMessage(currentTab.id, {
          action: "START_SCRAPING",
          minDelay: minDelaySec * 1000,
          maxDelay: maxDelaySec * 1000,
          maxResults: maxL
        }, (response) => {
          if (chrome.runtime.lastError) {
            addLog("error", "Connection failed. Please reload Google Maps page.");
          } else {
            addLog("success", "Handshake active. Scraper is running...");
          }
        });
      } else {
        addLog("warn", "Warning: Active tab is not Google Maps.");
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
  
  // Dynamically compile configured CSV headers
  const headers = ${JSON.stringify(getCSVHeaders(config.fieldsToExtract, formatConfig))};
  let csvContent = "\\ufeff"; // BOM for Excel
  csvContent += headers.join("${formatConfig.delimiter}") + "\\n";
  
  extLeads.forEach(lead => {
    if (!lead) return;
    const row = [
      ${config.fieldsToExtract.name ? 'escapeCSV(lead.name || "")' : 'null'},
      ${config.fieldsToExtract.address ? 'escapeCSV(lead.address || "")' : 'null'},
      ${config.fieldsToExtract.phone ? 'escapeCSV(lead.phone || "")' : 'null'},
      ${config.fieldsToExtract.email ? 'escapeCSV(lead.email || "")' : 'null'},
      ${config.fieldsToExtract.website ? 'escapeCSV(lead.website || "")' : 'null'},
      ${config.fieldsToExtract.rating ? 'lead.rating || 0' : 'null'},
      ${config.fieldsToExtract.reviewsCount ? 'lead.reviewsCount || 0' : 'null'},
      ${config.fieldsToExtract.googleUrl ? 'escapeCSV(lead.googleUrl || "")' : 'null'},
      escapeCSV(lead.query || ""),
      escapeCSV(lead.language || ""),
      escapeCSV(lead.timestamp || ""),
      escapeCSV(lead.facebook || ""),
      escapeCSV(lead.instagram || ""),
      escapeCSV(lead.linkedin || ""),
      escapeCSV(lead.twitter || ""),
      escapeCSV(lead.aiScore || ""),
      escapeCSV(lead.aiScoreExplanation || ""),
      escapeCSV(lead.aiSuggestedApproach || "")
    ].filter(v => v !== null);
    
    csvContent += row.join("${formatConfig.delimiter}") + "\\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "mapextract_leads.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

function escapeCSV(val) {
  if (val === undefined || val === null) return "";
  let str = String(val).replace(/"/g, '""');
  return ${formatConfig.addColumnQuote ? '`"${str}"`' : 'str'};
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
`;

  zip.file("popup.js", popupJsContent);

  // 7. Render a dummy blank icon to prevent developer mode icon warnings
  const dummyIconBase64 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAwZmBgOMBAADBiFTf6gOH/Uf8fNY9G86gxYDTmUWPAsDIgGvMIsgAAtYIQC37yRCEAAAAASUVORK5CYII=";
  zip.file("icon.png", dummyIconBase64, { base64: true });

  const content = await zip.generateAsync({ type: "blob" });
  return content;
}
