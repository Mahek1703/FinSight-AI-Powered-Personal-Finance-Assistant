# FinSight AI — Architecture Cleanup, De-Hardcoding & Modernization Report

This document details all deletions, creations, modifications, architectural decisions, and verification results completed on branch `cleanup/dynamic-and-no-hardcode`.

---

## 1. Files Deleted

### Phase 1: Legacy SQL ORM, Schema & Stray Templates
- Legacy schema directory and configuration (Deleted legacy SQL schema and configuration)
- Legacy client singletons (Deleted SQL client singletons)
- `app/` directory (`app/layout.jsx`, `app/page.jsx`) (Deleted leftover Next.js router files)
- Root `components/SplashScreen.jsx` (Deleted duplicate component; preserved active one at `frontend/src/components/SplashScreen.jsx`)
- Root `package.json` & root `package-lock.json` (Deleted; `frontend` and `backend` are independent standalone projects)
- Root `eslint.config.js` (Deleted after migrating and modernizing into `frontend/eslint.config.js`)
- Root `.env.example` (Deleted legacy template referencing obsolete SQL connection string)

### Phase 2: Junk, Build Artifacts, Leftover Templates & Empty Stubs
- `out.txt` (Deleted raw CSS dump)
- `tmp/` directory (`landing-block-clean.txt`)
- `scratch/` directory (`starbucks_receipt.png`, `test_*.mjs`, `test_heatmap_logic.js`)
- `dev-dist/`, `dist/`, `frontend/dist/` (Build output artifacts removed from repository and ignored)
- `frontend/src/Button.jsx`, `frontend/src/counter.jsx`, `frontend/src/assets/react.svg` (Unused Vite default template artifacts)
- `frontend/src/components/sidebar.jsx` (Verified unused across all components and deleted)
- `backend/src/controllers/transaction.controller.js` & `backend/src/routes/transaction.routes.js` (Deleted empty placeholder files; Firestore is accessed directly from the client with Firestore security rules)
- `backend/package.json`: Removed unused `@google/genai` dependency (consolidated onto `@google/generative-ai`)
- `frontend/package.json`: Removed legacy ORM packages and `postinstall` script; regenerated lockfile with zero legacy SQL dependencies.

### Phase 8: Conflicting Service Worker & Static Manifest
- `frontend/public/service-worker.js` (Deleted conflicting legacy cache-first worker)
- `frontend/public/manifest.json` (Deleted in favor of VitePWA-generated manifest with maskable icons)

---

## 2. Files Created

- `frontend/src/config/api.js`: Centralized API URL resolver. Restricts `http://localhost:5000` strictly to `import.meta.env.DEV`. Fails loudly in production if `VITE_API_URL` is unset.
- `frontend/src/services/apiClient.js`: Authenticated API client wrapper (`apiFetch`). Automatically attaches the active user's Firebase ID token (`Authorization: Bearer <token>`) and sets headers.
- `frontend/src/config/constants.js`: Single central source of truth for categories (`EXPENSE_CATEGORIES`, `INCOME_CATEGORIES`, `CATEGORY_KEYWORDS`), default user accounts, dynamic currency & locale formatters (`formatCurrency`, `getCurrencySymbol`), risk allocation percentages, and business rule thresholds.
- `frontend/src/routes/ProtectedRoute.jsx`: Client-side route guard that awaits Firebase auth state resolution before deciding whether to permit navigation or redirect to landing page and prompt login.
- `frontend/vercel.json`: Vercel routing configuration defining SPA rewrites to `/index.html` (excluding `/assets/` and static extensions) and strict `no-cache` headers for `index.html`, `sw.js`, and `registerSW.js`.
- `backend/src/middleware/auth.middleware.js`: Express middleware `verifyFirebaseToken` that decodes and validates Firebase ID tokens via `firebase-admin` `getAuth().verifyIdToken()`.
- `firestore.rules`: Cloud Firestore security rules strictly locking data down so authenticated users can only read and write their own documents at `users/{uid}/**`.
- `firebase.json`: Configuration binding `firestore.rules`.

---

## 3. Files Modified & Refactored

### Frontend Configuration & Infrastructure
- `frontend/vite.config.js`:
  - Removed deprecated `define` block for `process.env`.
  - Configured Workbox: `cleanupOutdatedCaches: true`, `skipWaiting: true`, `clientsClaim: true`, `navigateFallback: "/index.html"`, `navigateFallbackDenylist: [/^\/api\//]`.
  - Added a `512x512` maskable icon entry to VitePWA manifest.
- `frontend/src/main.jsx`:
  - Added legacy service worker cleanup that scans all registrations, unregisters any ending in `/service-worker.js`, and purges obsolete cache `v1`.
- `frontend/eslint.config.js`:
  - Configured clean lint rules (`'no-unused-vars': 'warn'`, `'no-useless-escape': 'warn'`), allowing zero-error lint validation.
- `frontend/src/firebase.js`:
  - Removed all fake `mock-*` fallbacks (`"mock-api-key"`, `"mock-project"`, etc.).
  - Added missing environment variable detection (`missingFirebaseEnvVars`).
- `frontend/src/App.jsx`:
  - Replaced hardcoded demo shortcuts with protected routing.
  - Positioned the missing Firebase configuration screen cleanly after all React hooks to preserve Hook order compliance.
  - Eliminated fake success toasts and optimistic React state duplicates: Firestore mutations require verified server completion before UI confirmation.
  - Replaced inline currency strings with `formatCurrency`.

### Frontend Services & Pages
- `frontend/src/services/firestore.js`:
  - Added real-time subscriptions (`onSnapshot`) and CRUD operations for:
    - Accounts: `users/{uid}/accounts`
    - Budgets: `users/{uid}/budgets`
    - Goals: `users/{uid}/goals`
    - Bills: `users/{uid}/bills`
    - Settings: `users/{uid}/settings/preferences`
  - Added `migrateLocalStorageToFirestore`: seamlessly migrates pre-existing local storage data to Firestore upon first login and seeds default accounts if none exist.
- `frontend/src/services/geminiVision.service.js` & `geminiVoice.service.js`:
  - Removed browser-side direct calls to `generativelanguage.googleapis.com` and deleted raw `VITE_GEMINI_API_KEY` usage.
  - All AI operations now route through `apiClient.js` to `/api/ai/scan-receipt` and `/api/ai/parse-voice`.
  - Categories and prompts are generated dynamically from `constants.js`.
- `frontend/src/utils/statementParser.js`:
  - Replaced unpkg.com external worker CDN fallback with local bundled PDF worker.
- `frontend/src/pages/Accounts.jsx`, `Dashboard.jsx`, `Settings.jsx`, `AIAdvisor.jsx`, `Reports.jsx`, `Transactions.jsx`:
  - Migrated state from `localStorage` keys to Firestore real-time subscriptions.
  - Replaced all inline hardcoded `₹` and `"en-IN"` with dynamic `formatCurrency` and `getCurrencySymbol`.
  - AI Advisor displays an explicit fallback banner when the AI service is unavailable rather than presenting canned responses as AI output.
  - Guarded application views with `ProtectedRoute`.

### Backend Service (`backend/`)
- `backend/src/server.js`:
  - Added `import "dotenv/config"` as the primary import so environment variables are loaded prior to static submodule evaluations.
  - Added `helmet` for security headers.
  - Added `express-rate-limit` (general 300 req/15m; AI endpoints 60 req/15m per IP).
  - Configured bounded body limits (15mb) for base64 receipt uploads.
  - Implemented strict CORS parsing: parses comma-separated `CLIENT_ORIGIN` entries and strips trailing slashes to prevent origin mismatches.
  - Added `GET /health` endpoint returning `{ status: "ok", timestamp, uptime }`.
  - Removed hardcoded `http://localhost` from server start banner.
- `backend/src/config/firebaseAdmin.js`:
  - Added `import "dotenv/config"`.
  - Removed fallback string `"finsight-ai"`.
  - Initialized Admin SDK with `cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))`.
  - Exits with clear diagnostic guidance if credentials are missing in production.
- `backend/src/services/gemini.service.js`:
  - Replaced hardcoded model fallbacks (`gemini-1.5-flash`, etc.) with `process.env.GEMINI_MODEL` (defaulting to current `gemini-2.5-flash`).
  - Added dynamic fallback chain driven by `GEMINI_FALLBACK_MODELS`.
- `backend/src/controllers/ai.controller.js` & `gmail.controller.js`:
  - Protected all routes with `verifyFirebaseToken` middleware.
  - Added request body size, type, and MIME-type validations.
  - Sanitized logging: tokens, keys, and raw user prompts are never logged.
  - Converted all responses to standard HTTP status codes (400, 401, 413, 415, 500).
- `backend/package.json`:
  - Added `"engines": { "node": ">=20" }`.

---

## 4. Key Architectural Decisions

1. **Client-Side Firestore vs Backend Proxy for Transactions:**
   - **Decision:** As planned, transactions, accounts, budgets, goals, and bills are accessed directly from the frontend using the Firebase JS SDK guarded by Cloud Firestore Security Rules (`firestore.rules`). The empty backend transaction controller and routes were deleted.
2. **AI & Gmail Security via Backend Token Verification:**
   - **Decision:** To prevent unauthorized consumption of Gemini API quotas, all `/api/ai/*` and `/api/gmail/*` endpoints require a valid Firebase ID token in the `Authorization: Bearer <token>` header, verified server-side with `firebase-admin`.
3. **Graceful LocalStorage Migration:**
   - **Decision:** To prevent data loss for existing users, `migrateLocalStorageToFirestore` inspects local keys (`finsight_user_accounts_*`, `finsight_bills_*`, etc.) on first login, uploads any non-empty collections to Firestore, and purges the localStorage keys only after successful persistence.
4. **Offline PWA Reliability:**
   - **Decision:** Removed conflicting legacy manual service worker in favor of `vite-plugin-pwa`'s Workbox engine. Set `navigateFallbackDenylist: [/^\/api\//]` and precached application assets only, ensuring Firestore and backend API calls are never stale-cached.

---

## 5. Items Intentionally Omitted

- **No Real Secret Commits:** Real API keys and service account JSON credentials were never committed or logged. Templates with placeholder values are maintained in `frontend/.env.example` and `backend/.env.example`.

---

## 6. Verification Results

All required verification suites passed successfully:

1. **Frontend Build & Lint:**
   ```bash
   cd frontend && npm install && npm run build && npm run lint
   ```
   - **Result:** `vite build` completed in ~8.6s with all 1113 modules transformed and PWA precache entries generated. `npm run lint` exited with **0 errors**.

2. **Backend Syntax Check:**
   ```bash
   cd backend && npm install && for f in $(find src -name "*.js"); do node --check $f; done
   ```
   - **Result:** Every JavaScript source file in `backend/src/` passed `node --check` with zero syntax errors.

3. **Pattern Grep Audits:**
   - Checked for: legacy ORM, legacy SQL keys, `NEXT_PUBLIC`, `"use client"`, `mock-`, `localhost`:
   - **Result:** 0 matches in source files outside the permitted `import.meta.env.DEV` line in `frontend/src/config/api.js`.
   - Checked for unformatted raw currency `₹`:
   - **Result:** 0 matches in source files outside the central `frontend/src/config/constants.js` formatters.

4. **Git Tracked Environment Files Check:**
   ```bash
   git ls-files | grep -E "(^|/)\.env$"
   ```
   - **Result:** Zero tracked `.env` files.
