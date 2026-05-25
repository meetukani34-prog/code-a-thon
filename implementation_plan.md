# Aegis AI — National Digital Identity Fraud & Citizen Protection Platform

A full-stack hackathon platform with 3 role-based views, a FastAPI backend, and a premium enterprise dark SaaS theme matching the provided mockups.

---

## Proposed Changes

### Directory Structure

```
c:\Code-A-Thon\
├── backend/
│   ├── main.py              # FastAPI server (CORS, 3 endpoints)
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html            # Vite entry HTML
│   ├── package.json          # React + Vite deps
│   ├── vite.config.js        # Vite config
│   ├── public/
│   └── src/
│       ├── main.jsx          # React DOM mount
│       ├── App.jsx           # Role router shell
│       ├── App.css           # Global dark theme + design tokens
│       └── components/
│           ├── CitizenPortal.jsx
│           ├── CitizenPortal.css
│           ├── AnalystTerminal.jsx
│           ├── AnalystTerminal.css
│           ├── ExecutiveDashboard.jsx
│           └── ExecutiveDashboard.css
```

> [!NOTE]
> The user requested Tailwind CSS in the spec title, but the attached mockups and the system guidelines both favor **Vanilla CSS** for maximum control and premium aesthetics. I will use **Vanilla CSS** with a comprehensive design token system (CSS custom properties) to faithfully replicate the mockup designs. If you prefer Tailwind, let me know and I'll adjust.

---

### Component 1: Design System & Global Styles

#### [NEW] [App.css](file:///c:/Code-A-Thon/frontend/src/App.css)

CSS custom properties design token system:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0F172A` | Page background |
| `--bg-card` | `#1E293B` | Card surfaces |
| `--bg-card-hover` | `#273548` | Card hover state |
| `--bg-sidebar` | `#0C1222` | Sidebar background |
| `--bg-input` | `#0F172A` | Input fields inside cards |
| `--accent-sky` | `#38BDF8` | Primary accent (Sky Blue) |
| `--accent-sky-dim` | `#0EA5E9` | Pressed/active sky accent |
| `--success` | `#10B981` | Verified/Success badges |
| `--success-bg` | `#064E3B` | Success badge background |
| `--warning` | `#F59E0B` | Review/Pending states |
| `--warning-bg` | `#78350F` | Warning badge background |
| `--danger` | `#EF4444` | Urgent/Critical/Font mismatch |
| `--danger-bg` | `#7F1D1D` | Danger badge background |
| `--text-primary` | `#F1F5F9` | Primary text |
| `--text-secondary` | `#94A3B8` | Secondary/muted text |
| `--text-tertiary` | `#64748B` | Tertiary/disabled text |
| `--border` | `#334155` | Card/table borders |
| `--font-family` | `'Inter', sans-serif` | Global typography |

Includes:
- CSS reset and base styles
- Google Fonts Inter import
- Role-switcher top banner styles
- Sidebar navigation pattern
- Card, badge, button, table, and input primitives
- Smooth transition defaults (150ms ease)
- Scrollbar styling for dark theme

---

### Component 2: App Shell & Role Router

#### [NEW] [App.jsx](file:///c:/Code-A-Thon/frontend/src/App.jsx)

- Full-width top banner fixed at top with `#0C1222` background
- Left: "AEGIS AI" branding with shield icon + "National Protection Platform" subtitle
- Center: 3 role-switch buttons — `[Citizen View]`, `[Analyst Console]`, `[Executive Dashboard]`
  - Active button gets `--accent-sky` background + white text
  - Inactive buttons get transparent + `--text-secondary` text + subtle border
- Right: Simulated user avatar + name display
- `useState` to track `activeView` → conditionally renders one of the 3 components
- Background set to `--bg-primary` via inline style on root container
- Smooth fade transition between views using CSS opacity + transform

---

### Component 3: Citizen Portal (Screen 1)

#### [NEW] [CitizenPortal.jsx](file:///c:/Code-A-Thon/frontend/src/components/CitizenPortal.jsx)
#### [NEW] [CitizenPortal.css](file:///c:/Code-A-Thon/frontend/src/components/CitizenPortal.css)

Layout: Sidebar + main content area (matching mockup 1).

**Sidebar** (200px fixed width):
- "Citizen ID / NATIONAL PROTECTION" logo header
- Nav items: Dashboard (active, sky blue highlight), Identity Vault, Fraud Alerts, Support, Settings
- Each nav item has an icon (emoji/unicode) + label

**Main Content**:

1. **Welcome Header Pane** — Dark card with:
   - `h1`: "Welcome back, Rajesh."
   - Subtitle: "Your identity is protected by Aegis AI."

2. **Identity Status Row** — Card with:
   - Shield icon (emerald green circle)
   - "Identity Status" label + `VERIFIED` badge (emerald text on `--success-bg`)
   - "Last Scanned: Oct 24, 2023" date tracker
   - "View Digital ID" outlined button (right-aligned)

3. **2-Column Action Grid**:
   - **Left Card** — "Verify New Document"
     - Description text
     - Solid Sky Blue "⊕ Upload Document" button (full width)
     - **AbortController upload logic**:
       1. `onClick` → create `AbortController`, set 45s `setTimeout`
       2. `fetch` to Cloudinary upload URL with `signal: controller.signal`
       3. If 45s elapses → `controller.abort()` → show overlay banner: "⚠ Cloud network timeout — switching to local upload"
       4. Fallback: `fetch('/api/verify-document-local', { method: 'POST', body: formData })`
       5. Display result from whichever path succeeds
       6. Loading spinner during upload, success/error toast on completion
   - **Right Card** — "Report Suspicious Activity"
     - Description text
     - Outlined red "△ Report Alert" button (full width)
     - Opens a modal placeholder (or logs to console for hackathon)

4. **Recent Activity Log** — Table with columns: Date, Action, Location, Status
   - 4 mock rows with status badges:
     - Oct 24, 2023 | Portal Login | Mumbai, India | `Success` (green badge)
     - Oct 23, 2023 | Document Upload | New Delhi, India | `Pending` (amber badge)
     - Oct 20, 2023 | Key Rotation | Mumbai, India | `Success`
     - Oct 18, 2023 | Password Change | Mumbai, India | `Success`
   - "View Full Audit" link in top-right of the table card

---

### Component 4: Analyst Terminal (Screen 2)

#### [NEW] [AnalystTerminal.jsx](file:///c:/Code-A-Thon/frontend/src/components/AnalystTerminal.jsx)
#### [NEW] [AnalystTerminal.css](file:///c:/Code-A-Thon/frontend/src/components/AnalystTerminal.css)

Layout: Sidebar + top sub-nav bar + asymmetric 3-panel grid (matching mockup 2).

**Sidebar** (200px):
- "Aegis Console / THREAT LEVEL: ELEVATED" header (red accent)
- Nav: Incoming Scans (active, red highlight), Case Manager, Biometric Vault
- Bottom: "Analyst Priya / SENIOR AUDITOR" profile card

**Top Sub-nav**: "Aegis Analyst Console" + tabs (Dashboard active, Archive, Protocols) + notification bell + user name

**Main Content**:

1. **Active Case List Sidebar Panel** (~300px):
   - Header: "ACTIVE CASE LIST" + "8 CRITICAL" red badge
   - 4 case cards:
     - `#ID-99201` — Synthetic Identity Attempt — `URGENT` (red)
     - `#ID-88319` — Document ID #88319 — `ACTIVE` (sky blue)
     - `#ID-77421` — Multiple Login Origin — `REVIEW` (amber)
     - `#ID-66510` — Passport Verification — `PENDING` (grey)
   - Active case gets brighter background

2. **Center Viewframe** (flex-grow):
   - Header: "👁 LIVE SCAN VIEWFRAME: DOCUMENT ID #88319"
   - Left half: Document image placeholder (dark gradient card with scan-line animation CSS effect to simulate "scanning")
   - Right half: **Raw OCR Extraction** card:
     - Header: "RAW OCR EXTRACTION" badge + "3 ANOMALIES" red count
     - Field rows in monospace font:
       - `DOCUMENT_TYPE: NATIONAL_ID_CARD_V4.2`
       - `SURNAME: AL-ZAHRAWI`
       - `GIVEN_NAMES: MALIK_JIBRAN`
       - `DOCUMENT_NUMBER:` **⚠ AE-88319-X02 [FONT_MISMATCH]** — full red background row
       - `ISSUE_DATE: 12-SEP-2022`

3. **Bottom Analytics Panel Grid** (2 columns):
   - **Left: Tamper Analysis Metrics**
     - 3 horizontal progress bars:
       - Signature Integrity: 94.2% — sky blue bar (safe)
       - Hologram Match: 68.5% — amber/orange bar (caution)
       - Font Consistency: 12.0% — red bar (critical)
     - Each bar: label left, percentage right, colored fill bar below
   - **Right: Identity Link Analysis**
     - Inline responsive SVG canvas (~400×250)
     - `useEffect` → `fetch('/api/fraud-graph')` → receive `{ nodes: [...], edges: [...] }`
     - Render circular nodes at `(cx, cy)` coordinates, sized by `risk` value
     - Central red node = primary fraud target (pulsing animation)
     - Other nodes = `--accent-sky` or `--text-tertiary`
     - Lines between nodes using `<line>` elements with low-opacity stroke
     - "CLUSTER_ID: CX-44" label in corner

---

### Component 5: Executive Dashboard (Screen 3)

#### [NEW] [ExecutiveDashboard.jsx](file:///c:/Code-A-Thon/frontend/src/components/ExecutiveDashboard.jsx)
#### [NEW] [ExecutiveDashboard.css](file:///c:/Code-A-Thon/frontend/src/components/ExecutiveDashboard.css)

Layout: Sidebar + main content (matching mockup 3).

**Sidebar** (200px):
- "National Director / EXECUTIVE SEAL" header
- Nav: Command Center (active), Analytics, Investigations, Audit Logs
- Bottom: Support, Sign Out

**Top Header Area**:
- "Mission Critical Status" h1
- Subtitle: "Real-time oversight of national security and identity protocols."
- Right: "Last 24 Hours" filter button + red "Export Report" button

**Main Content**:

1. **Top KPI Grid** (3 columns):
   - **Total Citizens Protected**: "2.4M" large number + "↗ 1.2%" green trend + mini bar sparkline (5 small bars)
   - **Active Investigations**: "142" large number + "-8 since yesterday" red trend + 3 avatar circles "Assigned Agents"
   - **System Authentications (24H)**: "85.6K" large number + "● OPTIMAL" green badge + "Avg Response: 12ms | Peak Load: 4.2k/min"

2. **National Scan Activity Chart** (full width):
   - Native SVG area chart with sky-blue filled path
   - X-axis: date labels (OCT 18 through OCT 28)
   - Y-axis: implicit from path height
   - Gradient fill from `--accent-sky` at 30% opacity down to transparent
   - Tooltip-style label at peak: "Oct 24, 14:00 — 94.2k Scans"
   - Legend: "● Current Period" (sky) + "● Previous Period" (grey)
   - Grid lines at 25%, 50%, 75% height

3. **Audit Trail Table** (full width, searchable):
   - Search input field: "🔍 Filter audit logs..."
   - Table columns: TIMESTAMP, ADMIN, ACTION, IP ADDRESS, STATUS
   - 3+ mock rows:
     - `2023-10-27T09:42:12Z` | SysAdmin-01 (avatar) | Updated Fraud Model `v2.41` badge | 192.168.4.120 | ✓
     - `2023-10-27T09:38:45Z` | Analyst-04 | Exported Security Dataset | 10.0.4.21 | ✓
     - `2023-10-27T09:15:22Z` | SysAdmin-01 | Firewall Policy Change | 192.168.4.120 | ✓
   - `useState` for search filter, filters rows by action/admin in real-time

---

### Component 6: FastAPI Backend

#### [NEW] [main.py](file:///c:/Code-A-Thon/backend/main.py)

**Dependencies**: `fastapi`, `uvicorn`, `python-multipart`, `numpy`, `opencv-python-headless`

**CORS**: Allow all origins (`["*"]`) for hackathon demo.

**Endpoints**:

1. **`POST /api/verify-document`** — Cloudinary asset verification
   - Accepts JSON body: `{ "cloudinary_url": str, "document_type": str }`
   - Returns simulated pixel analysis:
     ```json
     {
       "status": "analyzed",
       "document_id": "AE-88319-X02",
       "confidence": 0.87,
       "tamper_analysis": {
         "signature_integrity": 94.2,
         "hologram_match": 68.5,
         "font_consistency": 12.0
       },
       "anomalies": [
         {"field": "DOCUMENT_NUMBER", "type": "FONT_MISMATCH", "severity": "CRITICAL"},
         {"field": "HOLOGRAM", "type": "PATTERN_DEVIATION", "severity": "WARNING"},
         {"field": "MICROPRINT", "type": "RESOLUTION_LOW", "severity": "INFO"}
       ],
       "ocr_extraction": {
         "DOCUMENT_TYPE": "NATIONAL_ID_CARD_V4.2",
         "SURNAME": "AL-ZAHRAWI",
         "GIVEN_NAMES": "MALIK_JIBRAN",
         "DOCUMENT_NUMBER": "AE-88319-X02",
         "ISSUE_DATE": "12-SEP-2022"
       }
     }
     ```

2. **`POST /api/verify-document-local`** — Local binary fallback
   - Accepts `UploadFile` multipart form data
   - Reads file bytes → `np.frombuffer(contents, np.uint8)` → `cv2.imdecode(nparr, cv2.IMREAD_COLOR)`
   - Extracts dimensions, channel count, mean pixel intensity
   - Returns simulated analysis (same schema as above) + `"upload_method": "local_fallback"`

3. **`GET /api/fraud-graph`** — Fraud network graph data
   - Returns structured node/edge arrays:
     ```json
     {
       "cluster_id": "CX-44",
       "nodes": [
         {"id": "N1", "label": "AE-88319", "cx": 200, "cy": 175, "risk": 0.95, "is_primary": true},
         {"id": "N2", "label": "SYN-4412", "cx": 120, "cy": 100, "risk": 0.4, "is_primary": false},
         {"id": "N3", "label": "DOC-7781", "cx": 300, "cy": 90, "risk": 0.35, "is_primary": false},
         {"id": "N4", "label": "ID-22190", "cx": 80, "cy": 210, "risk": 0.55, "is_primary": false},
         {"id": "N5", "label": "PAX-0091", "cx": 160, "cy": 240, "risk": 0.3, "is_primary": false},
         {"id": "N6", "label": "REF-5523", "cx": 320, "cy": 200, "risk": 0.25, "is_primary": false}
       ],
       "edges": [
         {"from": "N1", "to": "N2"}, {"from": "N1", "to": "N3"},
         {"from": "N1", "to": "N4"}, {"from": "N1", "to": "N5"},
         {"from": "N2", "to": "N4"}, {"from": "N3", "to": "N6"},
         {"from": "N5", "to": "N4"}
       ]
     }
     ```

#### [NEW] [requirements.txt](file:///c:/Code-A-Thon/backend/requirements.txt)
```
fastapi==0.115.0
uvicorn==0.30.0
python-multipart==0.0.9
numpy==1.26.4
opencv-python-headless==4.9.0.80
```

---

### Component 7: Vite + React Project Setup

#### [NEW] [package.json](file:///c:/Code-A-Thon/frontend/package.json)

Dependencies:
- `react` ^18
- `react-dom` ^18

Dev dependencies:
- `vite` ^5
- `@vitejs/plugin-react` ^4

#### [NEW] [vite.config.js](file:///c:/Code-A-Thon/frontend/vite.config.js)

- React plugin enabled
- Dev server proxy: `/api` → `http://localhost:8000` (to forward API calls to FastAPI)

#### [NEW] [index.html](file:///c:/Code-A-Thon/frontend/index.html)

- Standard Vite entry with `<div id="root">` and `<script type="module" src="/src/main.jsx">`
- Page title: "Aegis AI — National Identity Protection Platform"
- Meta description for SEO

#### [NEW] [main.jsx](file:///c:/Code-A-Thon/frontend/src/main.jsx)

- Standard React 18 `createRoot` mount

---

## User Review Required

> [!IMPORTANT]
> **CSS Framework**: Your spec title mentioned "Tailwind CSS" but the system guidelines recommend Vanilla CSS, and your mockups show a very specific, custom design. I plan to use **Vanilla CSS with CSS custom properties** for pixel-perfect mockup replication. This avoids Tailwind setup overhead and gives us full design control for the hackathon. Please confirm or request Tailwind.

> [!IMPORTANT]
> **Document Image in Analyst Terminal**: The mockup shows a scan of an ID card. Since no real image is provided and the guidelines say not to use placeholders, I will **generate an image** using the image generation tool to create a realistic-looking scan visualization for the document viewframe. Alternatively, I can use a dark gradient + CSS scan-line animation to simulate a "live scan" effect without a real image.

> [!IMPORTANT]
> **Cloudinary Upload**: The AbortController logic will attempt to POST to a Cloudinary endpoint. For the hackathon demo, this will use a placeholder Cloudinary URL that will naturally timeout, triggering the fallback to the local `/api/verify-document-local` endpoint. This demonstrates the resilience pattern without requiring actual Cloudinary credentials.

---

## Open Questions

> [!NOTE]
> **Cloudinary Cloud Name**: Do you have actual Cloudinary credentials (cloud name, upload preset) for the upload attempt, or should I use a dummy URL that will naturally trigger the 45-second timeout → local fallback path for demo purposes?

> [!NOTE]
> **Port Configuration**: I plan to run FastAPI on `localhost:8000` and Vite dev server on `localhost:5173` with a proxy. Does this work for your demo environment?

---

## Verification Plan

### Automated Tests
1. **Backend**: Run `uvicorn backend.main:app --reload` and test all 3 endpoints with curl:
   - `curl -X POST http://localhost:8000/api/verify-document -H "Content-Type: application/json" -d '{"cloudinary_url": "test", "document_type": "national_id"}'`
   - `curl -X POST http://localhost:8000/api/verify-document-local -F "file=@test.jpg"`
   - `curl http://localhost:8000/api/fraud-graph`
2. **Frontend**: Run `npm run dev` in `frontend/` and verify:
   - All 3 role views render without console errors
   - Role switching buttons toggle views smoothly
   - Fraud graph SVG renders nodes/edges from API data
   - Upload button triggers AbortController logic

### Manual Verification
- Visual comparison of each rendered view against the 3 provided mockup screenshots
- Test the upload timeout → fallback flow by attempting an upload with no Cloudinary backend
- Verify the SVG fraud graph draws correctly with node positions from the API
