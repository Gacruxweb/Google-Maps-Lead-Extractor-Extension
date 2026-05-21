// MapExtract Expert - Background Service Worker
let activeProxyIndex = 0;
const proxies = ["182.16.0.4:8080","195.43.111.10:3128","88.221.4.15:80"];
const rotateThreshold = 1;
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
      hl: "en",
      gl: "US",
      maxResults: 40,
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
    if (serverVersion && serverVersion !== "4.2") {
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
