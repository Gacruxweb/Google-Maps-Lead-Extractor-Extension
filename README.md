
# MapExtract: Google Maps Lead Extractor Extension Studio

MapExtract is an enterprise-grade extension blueprint sandbox and compilation workspace designed to test, visualize, and package high-performance Chrome Extensions targeting B2B lead generation via Google Maps. 

By integrating proxy pool lists, humanized crawl speeds, customized database alignment scripts, and server-side **Gemini AI**, MapExtract enables you to compile live content scrapers that bypass rate limits, score leads instantly, and draft highly relevant cold pitches under a single interface.

---

## 🚀 Key Architectural Modules

* **Real-time Extraction Sandbox**: Simulates human scrapers scrolling through places, mapping phone numbers, physical addresses, websites, emails, reviews count, and stars.
* **Auto-Healing Proxy Rotation Node**: Real-time rotating proxy buffer showing automatic failover techniques when encountering HTTP 429 rate bounds.
* **Gemini LLM Lead Scoring**: Leverages the Gemini API to analyze ratings, review count, and digital presence, scoring candidates (A, B, or C) and producing actionable pitch recommendations.
* **Cold Outreach AI Pitch Engine**: Turns a simple sales offer string (e.g., "Web design / SEO Boost") into custom-crafted, localized sales email messages tailored specifically to that business's rating metrics.
* **Interactive CSV Structuring Parser**: Custom delimiters (commas, semicolons, pipe symbols, tabs), titles casing normalizers, and complete field name maps matching template requirements for HubSpot, Salesforce, or ActiveCampaign.
* **Compiler & Chrome Extension Builder**: Auto-generates Chrome-unpacked assets (`manifest.json`, local `background.js`, `content.js` script injects, and custom extension `popup.html`/`popup.js` files) compiled instantly into a downloaded zip package.

---

## 📖 Complete Step-by-Step User Manual

Welcome to the MapExtract Workspace! Below is the complete user manual describing how to configuration-test, AI-enrich, style-map, and locally install the generated extension.

---

### Module 1: Configuration & Sandbox Simulation

The **Sandbox Simulator** allows you to customize the scraping rules, speed behaviors, and security rotation thresholds without spending real third-party lookup credits.

#### 1. Configure Crawl Targets & Search Parameters
* Navigate to the **Search Parameters** section on the static sidebar.
* **Search Queries**: Type the targets of your search (one entry per line) in the list area (e.g. `Pizza New York`, `Dentist Munich`, `Graphic Designer Paris`). The engine processes these searches sequentially.
* **Localization Settings**: Select the target Google Search localization parameters:
  - **Language (`hl` parameter)**: English, French, German, Spanish, or Italian. This influences which text content and reviews get highlighted.
  - **Region (`gl` parameter)**: United States, United Kingdom, France, Germany, or Spain. Captures region-accurate Google Maps listings.

#### 2. Speed Limits & Rate Control (TOS Safeguards)
Avoid triggering bot-mitigation behaviors by customizing the built-in delay algorithms:
* **Min Delay & Max Delay**: Enter decimal delay rates (recommended range is **2.0s to 6.0s**). The scraper will draw a random decimal duration within this boundary for each scroll step to mimic real physical cursor behavior.
* **Result Limit Cap**: Restrict how many potential matches are scraped per individual query lines before proceeding to the subsequent line. Keeping caps between **40 and 100 leads** ensures clean, high-quality, high-speed yields.

#### 3. Proxy Pools & Rotation (IP Identity Masking)
* **IP Rotation Nodes**: Put lists of raw proxy IPs in the proxy textarea (format syntax: `IP:Port` or credential-bound `username:password@IP:Port`).
* **Rotation Trigger Threshold**: Direct the scraper to cycle to a fresh server node after $N$ pages have been verified.
* **Simulated Network Recovery Testing**: Click **Start Extraction** under the simulator screen. To see auto-healing in actions, click the **Inject Rate-Limit Error** button. This sends an artificial `HTTP 429 Too Many Requests` signal. You will watch the console register the error, lock the thread, swap your scrapers to a fresh proxy node in your pool, and auto-resume safety logs without breaking active processes!

---

### Module 2: CRM Active Leads & Gemini AI Enrichment

Once your lead list accumulates data, you can view, qualify, and draft personalized outbound campaigns right on your grid dashboard.

#### 1. Lead Verification & Qualification Grid
* Open the **Extracted Leads** panel tab to see your current CRM tables.
* The table details essential contact coordinates (Names, Phones, Ratings, Physical coordinates, social contacts, and domain websites if detected).
* Select any business name to instantly load the detailed inspection sidecard.

#### 2. Gemini Lead Rank & Scoring Engine
* Click **Scoring Run (Gemini)** or use the **Enrich All** trigger (requires a valid `GEMINI_API_KEY` configured in secrets).
* This inputs the listing rating, total reviews size, and social connectivity status directly to Gemini's analysis models.
* Gemini grades the prospect as **Grade A** (Outstanding candidate), **Grade B** (Moderate potential), or **Grade C** (Low-priority candidate), accompanied by a custom, clear bulleted analysis detailing why and what service they lack (e.g., low reviews, missing website address, etc.).

#### 3. Custom AI Outreach Pitch Writer
* In the Outreach sidebar card, enter the service or product you want to sell (e.g., *Website SEO redirection and loading-speed optimizations*).
* Click **Pitch Email Draft**.
* Gemini processes your exact product services alongside the scraped company metrics (like reviews rating and name) and drafts a premium, professional cold outreach email pitch formatted in the target business's native country language.

---

### Module 3: Structural CSV Formatting Normalization

CRMs contain varying schema requirements. Before exporting, configure format properties so headers sync up seamlessly with your software.

* Open the **CSV Output Alignment** tab on page controls.
* **Delimiter settings**: Choose column split rules using a CSV separator selection dropdown (Comma `,`, Semicolon `;`, Pipe symbol `|`, or Tab `\t`).
* **Force Quotes Wrap**: Prevent stray data commas or text characters from shifting your Excel columns by enabling double quotes encapsulation strings (`"text_content"`).
* **Column Title Casing**: Align property capitalization instantly using:
  - `original_format`
  - `UPPERCASE_FORMAT`
  - `lowercase_format`
  - `camelCaseFormat`
  - `Title Case Format`
* **Custom Overrides Mapping Table**: Put custom names over database default keys. (e.g. Map the default output `name` field to Hubspot's `Company Name`, or rename `phone` to `Direct Phone Line`). Any mapped parameters instantly replace default CSV headers.

---

### Module 4: Building & Installing Your Chrome Extension

Once you have tested configurations in the MapExtract Sandbox, you compile these exact preferences into a standalone Chrome Extension for production use.

#### Step 1: Exporting Your Custom Extension
1. Go to the **Chrome Extension Compiler** tab.
2. Select your config preferences.
3. Click the **Download Extension Package (ZIP)** button.
4. The studio compiles your active queries list, speed delays, selected target extraction fields, and proxy arrays directly into a downloadable ZIP folder (e.g., `mapextract-extension.zip`).

#### Step 2: Extracting Assets
* Create a clean directory on your local machine named `MapExtract Extension`.
* Move the downloaded `.zip` file inside and unzip all contents. You will find standard modular browser scripts:
  - `manifest.json`: Configures permission triggers (storage, activeTab, cookies).
  - `background.js`: Monitors network request redirects, headers, and handles proxy pool rotations.
  - `content.js`: Main crawling engine injected directly inside Google Maps frame pages to parse listings structural DOM values.
  - `popup.html`/`popup.js`: Simple, dark extension popup window displaying control parameters and download outputs.
  - `icon.png`: Extension action toolbar icon.

#### Step 3: Google Chrome Installation Guide (Unpacked)
1. Launch your **Google Chrome** desktop browser.
2. Click the three dots settings menu, navigate to **Extensions**, and choose **Manage Extensions** (or type `chrome://extensions/` directly into your search bar).
3. Toggle the **Developer Mode** slider in the header on (top-right side).
4. Click the **Load unpacked** button visible in the top-left section.
5. Select the `MapExtract Extension` target folder (the directory containing `manifest.json`).
6. MapExtract will successfully compile and display as a registered active extension in your browser bar.

#### Step 4: Real-world Lead Generation Workspace Workflow
1. Navigate directly to [google.com/maps](https://www.google.com/maps).
2. Click the **MapExtract Icon** in your Chrome pinned toolbar to launch the popup panel.
3. Confirm your pre-loaded queries are correct, and click **Start Extraction**.
4. The content script will scroll down active search results blocks automatically, pausing at intervals to reflect your safe speed configuration, and extracting listings data.
5. The popup keeps a live count. When you are satisfied, click **Download Extracted CSV** to export your freshly parsed leads list instantly, formatted exactly as configured!

---

## 🛠 Extension Architecture Internals

For developers wishing to modify the scraper engine files locally:

```
├── manifest.json       # Extension metadata, service worker registration, permissions
├── background.js       # Background proxy list controller & cross-origin message relay
├── content.js          # Google Maps DOM selector extractor & page scroller
├── popup.html          # Lightweight popup layout (styled with clean CSS variables)
└── popup.js            # Extractor controls orchestrator and exporter
```

---

## 💻 Local Development & Contribution

We welcome contributions! To edit and update the MapExtract Sandbox dashboard locally:

### 1. Set Up the Environment
**Prerequisites:** [Node.js](https://nodejs.org/) (v18+)

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure API Keys**:
   Create a `.env` file (or edit `.env.example`) and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The application will boot on port `3000` at `http://localhost:3000`.

### 2. Sandbox Styling & App Updates
* **Dashboard Interface**: Primary layouts are located inside `/src/App.tsx`.
* **Sidebar Inputs**: Handled by `/src/components/SidebarSettings.tsx`.
* **Exporter Logic**: Layout configurations are compiled via `/src/components/ExportSettingsDiv.tsx`.
* **Code Packaging Rules**: ZIP compiling is managed inside `/src/lib/extensionCodeGenerator.ts`.

### 3. Verify Code Quality
Before committing adjustments, verify formatting rules and compile static layers successfully:
```bash
npm run lint  # Checks for code style guidelines and warning levels
npm run build # Confirms server side builds compile cleanly
```

---

## 📝 License
Open to use.
