# FinSight AI — Frontend Comprehensive Audit Report (Phase F0)

Date: 2026-10-26  
Branch: `cleanup/dynamic-and-no-hardcode`  
Scope: Frontend application (`frontend/`), Firestore rules, environment config, bundle sizing, and lint status.

---

## 1. Leftover Hardcoding Audit

### 1.1 Localhost, Mock Strings, Process.env, and Obsolete Prefixes
- **Status:** **PASS** (with notes on allowed lines)
- **Command:**
  ```powershell
  git grep -nIE "localhost|127\.0\.0\.1|mock-|finsight-ai|process\.env|unpkg\.com|VITE_GEMINI|NEXT_PUBLIC" -- frontend README.md CHANGES.md
  ```
- **Evidence & Findings:**
  - `frontend/src/config/api.js:18`: `fromEnv || (import.meta.env.DEV ? "http://localhost:5000" : "")` (ALLOWED: only active under `import.meta.env.DEV`).
  - `frontend/.env.example:4`: `VITE_API_URL="http://localhost:5000"` (ALLOWED: local development template).
  - `README.md:29, 47, 67, 69, 79`: Localhost development instructions in documentation.
  - `frontend/package.json:2`: Package name `"finsight-ai"` (ALLOWED).
  - No occurrences of `mock-`, `127.0.0.1`, `process.env` in client code, `unpkg.com`, `VITE_GEMINI`, or `NEXT_PUBLIC`.

### 1.2 Gemini Model Names
- **Status:** **FAIL** (Deprecated model references in docs/backend example)
- **Command:**
  ```powershell
  git grep -nIE "gemini-[0-9]" -- .
  ```
- **Evidence & Findings:**
  - `README.md:49`: References `gemini-2.5-flash` (unsupported/non-existent model name).
  - `backend/.env.example:18-19`: References `gemini-2.5-flash` and `gemini-1.5-flash` (both retired / being retired per Google Gemini deprecation timeline).
  - `frontend/src`: Zero occurrences of any Gemini model name. Model selection is handled purely on the backend.
  - **Resolution:** Standardize to Google's official, current model `gemini-3.5-flash` (no shutdown date announced) across backend configuration and documentation.

### 1.3 URLs in Source
- **Status:** **PASS**
- **Command:**
  ```powershell
  git grep -nIE "https?://" -- frontend/src
  ```
- **Evidence & Findings:**
  - `frontend/src/components/AuthModal.jsx:198`: `https://www.googleapis.com/auth/gmail.readonly` (OAuth scope string).
  - `frontend/src/components/GmailConnectionButton.jsx:20`: `https://accounts.google.com/gsi/client` (Google Identity Services script).
  - `frontend/src/components/GmailConnectionButton.jsx:45`: `https://www.googleapis.com/auth/gmail.readonly` (OAuth scope string).
  - `frontend/src/components/SplashScreen.jsx:135`, `frontend/src/pages/Landing.jsx:241`: `http://www.w3.org/2000/svg` (XML namespace).
  - `frontend/src/index.css:5`: Google Fonts Inter stylesheet import.
  - No hardcoded backend or API endpoint URLs found.

### 1.4 Currency and Locale
- **Status:** **FAIL** (Inline locale hardcoded in RecentActivityList)
- **Command:**
  ```powershell
  git grep -nIE "₹|en-IN|\bINR\b" -- frontend/src
  ```
- **Evidence & Findings:**
  - `frontend/src/components/dashboard/RecentActivityList.jsx:105`: `d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })` — Hardcoded `en-IN` inline rather than using user preferences / centralized locale.
  - `frontend/src/components/voice/VoiceAssistantModal.jsx:61, 287, 289`: `"en-IN"` speech recognition locale code toggle (allowed voice engine language tag).
  - `frontend/src/config/constants.js:72-77`: Central defaults and available currencies (`DEFAULT_CURRENCY = "INR"`, `DEFAULT_CURRENCY_SYMBOL = "₹"`, `DEFAULT_LOCALE = "en-IN"`).
  - `frontend/src/utils/emailParser.js:169-171` & `statementParser.js:85`: Regex currency symbol patterns for receipt and bank statement parsing (allowed).
  - **Resolution for F2:** Update `RecentActivityList.jsx` to respect user settings/locale via `constants.js`.

---

## 2. Landing Page & Marketing Copy Audit

- **Status:** **PASS**
- **Inspected Files:** `frontend/src/pages/Landing.jsx`, `frontend/src/landing.css`, `frontend/index.html`
- **Evidence & Findings:**
  - Zero fake statistics (e.g. no "10K+ users", no "4.9 rating").
  - Zero fake testimonials or fictional customer reviews.
  - Zero fake pricing tiers or fake logos.
  - The hero presents true product features: "AI Insights", "100% Secure", "Works Offline", "Voice Entry", and "Smart. Secure. AI Powered.".
  - `index.html`: Title is `FinSight AI - Smart Personal Finance Tracker` with accurate meta description and no placeholder text.

---

## 3. Browser Storage Audit

- **Status:** **FAIL** (Stray localStorage and sessionStorage accesses in components)
- **Command:**
  ```powershell
  git grep -nE "localStorage|sessionStorage" -- frontend/src
  ```
- **Evidence & Findings:**
  - **Allowed:**
    - `frontend/src/App.jsx:95, 234`: `finsightTheme` (UI theme preference).
    - `frontend/src/components/AuthModal.jsx:95`: `finsightRememberEmail` (Remember email preference).
    - `frontend/src/services/firestore.js:1106-1256`: One-time migration `migrateLocalStorageToFirestore(uid)` reading legacy data to upload and then clearing keys.
  - **Findings to Fix:**
    - `frontend/src/components/AddTransactionModal.jsx:98`: `localStorage.getItem("finsight_user_accounts")` — Reads accounts from localStorage instead of Firestore or props.
    - `frontend/src/utils/AnomalyDetector.js:46, 50, 65, 76`: `localStorage.getItem/setItem/removeItem(STORAGE_KEY_DISMISSED)` — Anomaly dismissal state stored in unauthenticated localStorage instead of component/user state.
    - `frontend/src/components/AuthModal.jsx:257` & `App.jsx:210`: `sessionStorage.setItem("gmailAccessToken", accessToken)` — Gmail access token kept in browser storage.
    - `frontend/src/pages/Settings.jsx:64-80`: Legacy localStorage clear/backup functions referencing obsolete keys.
  - **Resolution for F2:** Eliminate account read from localStorage, clean up settings legacy storage manipulation, and ensure AnomalyDetector does not leak across sessions.

---

## 4. Backend Calls Audit

- **Status:** **FAIL** (Calls route through `apiClient.js`, but `apiClient.js` lacks robust error handling and token refresh)
- **Command:**
  ```powershell
  git grep -nE "fetch\(|apiFetch|axios" -- frontend/src
  ```
- **Inventory of Calls:**
  1. `frontend/src/components/AuthModal.jsx:263`: `apiFetch("/api/gmail/connect", ...)`
  2. `frontend/src/components/GmailConnectionButton.jsx:61`: `apiFetch("/api/gmail/connect", ...)`
  3. `frontend/src/services/aiService.js:6`: `apiFetch("/api/ai", ...)`
  4. `frontend/src/services/geminiVision.service.js:196`: `apiFetch("/api/ai/scan-receipt", ...)`
  5. `frontend/src/services/geminiVoice.service.js:384`: `apiFetch("/api/ai/parse-voice", ...)`
  6. `frontend/src/services/gmail.service.js:9`: `apiFetch("/api/gmail/connect", ...)`
  7. `frontend/src/services/apiClient.js:39`: Underlying browser `fetch(url, options)`.
- **Evidence & Deficiencies:**
  - All external backend requests route through `apiFetch` in `services/apiClient.js`.
  - `apiClient.js` passes `Authorization: Bearer <token>`, but:
    - Does NOT force token refresh if expired (`getIdToken(true)`).
    - Does NOT handle `401 Unauthorized` by triggering sign-out / prompting re-login.
    - Does NOT handle `429 Too Many Requests` with friendly rate limit feedback.
    - Does NOT handle Render 30-60s free-tier wake-up delays or timeouts (frozen spinner risk).
    - Does NOT provide structured network/server error throwing.
  - **Resolution for F3:** Upgrade `apiClient.js` with timeout handling, Render cold-start status notification ("AI is waking up, please wait"), 401 signout, and 429 throttling messages.

---

## 5. Firestore Paths vs `firestore.rules` Audit

- **Status:** **FAIL** (Rule allows all subcollections indiscriminately; Dashboard has stray path)
- **Command:**
  ```powershell
  git grep -nE "collection\(|doc\(" -- frontend/src
  ```
- **Firestore Paths Used in App:**
  - `users/{uid}/expenses` (Collection)
  - `users/{uid}/expenses/{id}` (Document)
  - `users/{uid}/income` (Collection)
  - `users/{uid}/income/{id}` (Document)
  - `users/{uid}/accounts` (Collection)
  - `users/{uid}/accounts/{id}` (Document)
  - `users/{uid}/budgets` (Collection)
  - `users/{uid}/budgets/{id}` (Document)
  - `users/{uid}/goals` (Collection)
  - `users/{uid}/goals/{id}` (Document)
  - `users/{uid}/bills` (Collection)
  - `users/{uid}/bills/{id}` (Document)
  - `users/{uid}/settings/preferences` (Document)
- **Mismatches & Security Issues:**
  - `frontend/src/pages/Dashboard.jsx:303`: Attempts to construct `doc(db, "users", uid, "transactions", targetId)`. `transactions` is not a collection used in Firestore; the application uses `expenses` and `income`.
  - Current `firestore.rules`:
    ```
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    ```
    This wildcard grants indiscriminate write access without schema/type validation, size bounds, or explicit collection enforcement.
  - Missing `firestore.indexes.json` referenced in `firebase.json`.
  - **Resolution for F4:** Enforce granular collection rules with type and value validation (amount > 0, field length limits), fix `Dashboard.jsx:303`, and add composite indexes.

---

## 6. Code Hygiene, File Sizes & Bundle Chunks Audit

### 6.1 `console.log` Count
- **Status:** **FAIL** (2 instances of `console.log` remain)
- **Evidence:**
  - `frontend/src/components/AuthModal.jsx:273`: `console.log("Gmail connected successfully:", gmailData);`
  - `frontend/src/components/GmailConnectionButton.jsx:78`: `console.log("FinSight AI: Gmail transactions received from backend:", data.transactions);`
  - **Resolution for F1:** Remove all `console.log` statements.

### 6.2 Files Larger Than 30 KB
- **Status:** **FAIL** (4 client files exceed 30 KB)
- **Evidence:**
  - `frontend/src/pages/Reports.jsx`: 41,281 bytes
  - `frontend/src/services/firestore.js`: 39,934 bytes
  - `frontend/src/pages/Accounts.jsx`: 36,726 bytes
  - `frontend/src/pages/Transactions.jsx`: 32,316 bytes
  - (`frontend/src/pages/Dashboard.jsx`: 28,485 bytes, near threshold)
  - **Resolution for F6:** Refactor monolithic files into modular subcomponents and custom hooks (`useFinanceData`, `useAccounts`, `useBudgets`).

### 6.3 Depcheck Dependencies
- **Status:** **PASS** (Informational)
- **Evidence:**
  - Unused dependencies: `tailwindcss` (used via `@tailwindcss/vite` in Vite and CSS `@import`).
  - Unused devDependencies: `@types/react`, `@types/react-dom`.

### 6.4 Build Bundle Chunk Sizes
- **Status:** **FAIL** (Massive single vendor bundle)
- **Evidence from `npm run build`:**
  - `dist/assets/index-DVhzQf_N.js`: **2,561.40 kB** (gzip: 767.44 kB)
  - `dist/assets/pdf.worker.min-CjEcRF4W.mjs`: 1,264.34 kB
  - `dist/assets/index-BxhOPWN4.css`: 185.90 kB
  - Vite warning: "Some chunks are larger than 500 kB after minification."
  - **Resolution for F6:** Implement route lazy-loading (`React.lazy` + `Suspense`), dynamic imports for heavy libraries (`xlsx`, `papaparse`, `pdfjs-dist`), and Rollup `manualChunks` vendor splitting.

---

## 7. ESLint Config & Rule Degradation Review

- **Status:** **FAIL** (Linter rules downgraded or disabled; 62 warnings suppressed)
- **Current `frontend/eslint.config.js`:**
  ```javascript
  rules: {
    'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    'no-useless-escape': 'warn',
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/immutability': 'off',
  }
  ```
- **Evidence & Findings:**
  - `no-unused-vars` was downgraded from `error` to `warn` with broad regex suppressions.
  - `no-useless-escape` was downgraded from `error` to `warn`.
  - `react-hooks/set-state-in-effect` and `react-hooks/immutability` were turned `off`.
  - Current lint execution produces **62 warnings** across 12 files (dead imports, missing effect dependencies in `AnomalyAlertBanner`, `CashFlowForecastCard`, `VoiceAssistantModal`, `Reports`, etc.).
  - **Resolution for F1:** Restore strict standard rules, eliminate dead code, fix all missing hook dependencies, fix regex escapes, and ensure `npm run lint` passes with **0 errors and 0 warnings**.

---

## Audit Summary & Roadmap

| Item | Focus Area | Status | Target Phase |
|---|---|---|---|
| F0.1 | Hardcoded strings & model names | FAIL | F2 |
| F0.2 | Landing page fake copy | PASS | F2 |
| F0.3 | Stray localStorage/sessionStorage | FAIL | F2 |
| F0.4 | Backend calls & auth headers | FAIL | F3 |
| F0.5 | Firestore paths vs rules | FAIL | F4 |
| F0.6 | Code hygiene, file sizes & chunks | FAIL | F1, F6 |
| F0.7 | ESLint rule degradation | FAIL | F1 |
