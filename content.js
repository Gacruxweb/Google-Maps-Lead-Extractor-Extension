// MapExtract Expert - Content Script (Google Maps DOM Extractor)
let scrapingInterval = null;
let maxResultsLimit = 40;
let minDelayMs = 2000;
let maxDelayMs = 5000;
const fieldsToExtract = {"name":true,"address":true,"phone":true,"website":true,"rating":true,"reviewsCount":true,"googleUrl":true};
const hlLanguage = "en";

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
          const revMatch = text.match(/\((\d+)\)/) || text.match(/(\d+)\s+(reviews|avis)/);
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
          // Regex fallback for various formats
          const phoneMatch = cardText.match(/(?:\+?[\d\s\-()]{7,20})/);
          if (phoneMatch) {
            const potential = phoneMatch[0].trim();
            if (/[\d]{5,}/.test(potential)) phone = potential;
          }
        }
      }
      
      let website = "";
      if (fieldsToExtract.website) {
        const webElem = card.querySelector(SELECTORS.website);
        if (webElem) {
          website = webElem.href || webElem.getAttribute("href") || "";
        }
        if (!website) {
          const links = Array.from(card.querySelectorAll('a'));
          const extLink = links.find(l => l.href && !l.href.includes("google.com/maps") && !l.href.includes("google.co") && !l.href.includes("apple.com") && !l.href.includes("facebook.com") && !l.href.includes("instagram.com"));
          if (extLink) website = extLink.href;
        }
      }

      let email = "";
      const emailMatch = cardText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) email = emailMatch[0];
      
      let address = "";
      if (fieldsToExtract.address) {
        // Improved address detection
        address = allSpans.find(txt => 
          txt.length > 5 && 
          (txt.includes(",") || txt.startsWith("·")) && 
          txt !== phone &&
          !/^\+?[\d\s\-()]{7,20}$/.test(txt)
        ) || "";
        
        if (!address) {
          address = allSpans.find(txt => 
            txt.length > 10 && 
            /\d+/.test(txt) && 
            txt !== phone && 
            !/^\+?[\d\s\-()]{7,20}$/.test(txt)
          ) || "Google Maps Search Details";
        }
      }

      // Social Media link extraction (if visible in card)
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
          currentQuery = decodeURIComponent(urlParts[0].replace(/\+/g, " "));
        } catch (e) {
          // fallback remains
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
