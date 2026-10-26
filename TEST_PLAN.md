# FinSight AI — 10-Minute Manual Verification Script

This step-by-step test plan allows anyone to manually verify all critical user journeys, authentication flows, Firestore persistence, offline PWA resilience, and backend AI integration in ~10 minutes.

---

## Pre-Requisites & Setup

1. Start frontend dev server or preview build:
   ```powershell
   cd frontend
   npm run dev
   # Open browser at http://localhost:5173
   ```
2. Ensure Firebase client credentials are configured in `frontend/.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Ensure backend is running or reachable (e.g. Render backend URL in `VITE_BACKEND_URL`).
4. Open Chrome / Edge Developer Tools (`F12`), switch to the **Console** and **Network** tabs.

---

## Step 1: Sign Up / Registration (1 min)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Create New User** | 1. Navigate to `/login` or click "Sign In" on Landing.<br>2. Switch tab to "Create Account".<br>3. Enter a new email (e.g. `testuser_audit@finsight.local`) and password (`Pass1234!`).<br>4. Click **Sign Up**. | Successfully authenticates, toasts `"Account created successfully"`, and redirects to `/dashboard`. Protected state is unlocked. | **Network tab:** Firebase Auth identity toolkit request returns HTTP 200.<br>**Console:** Clean logs; no errors or unhandled rejections. |

---

## Step 2: Add Income & Expense (1 min)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Log Income** | 1. In Quick Actions or on Dashboard, click **Add Income**.<br>2. Enter Amount: `75000`, Category: `Salary`, Account: `Bank`, Date: Today.<br>3. Click **Save Income**. | Income modal closes, success toast appears, Total Balance shows `₹75,000`, and Monthly Income card shows `₹75,000`. | **Firestore:** Document written to `users/{uid}/income/{docId}`.<br>Save button disabled during write to prevent duplicate submits. |
| **Log Expense** | 1. Click **Add Expense**.<br>2. Amount: `1200`, Category: `Food`, Merchant: `Grocery Store`, Account: `Cash`.<br>3. Click **Save Expense**. | Success toast appears, Total Balance adjusts to `₹73,800`, Recent Transactions list shows the grocery entry. | **Firestore:** Document written to `users/{uid}/expenses/{docId}`. |

---

## Step 3: Refresh & Verify Persistence (30 sec)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Page Refresh** | 1. Press `F5` / `Ctrl+R` to reload the page at `/dashboard`. | ProtectedRoute shows brief animated loading skeleton (no white flash or redirect loop). Data reloads cleanly with exact balance `₹73,800`. | **Console:** No `FirebaseError: Missing or insufficient permissions`. Data streams in from active onSnapshot. |

---

## Step 4: Multi-Browser Real-Time Sync (1 min)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Cross-Window Sync** | 1. Open an Incognito window or a second browser (Firefox/Edge).<br>2. Navigate to `http://localhost:5173/login`.<br>3. Log in with the same credentials from Step 1.<br>4. In Browser 1, add an expense (`Amount: 500`, `Category: Entertainment`). | Browser 2 updates **instantly** in real time via Firestore listener without needing a manual refresh. | **Console:** Zero duplicate items, real-time sync works via standard Firestore listener. |

---

## Step 5: Add Account, Budget, Goal, & Bill (2 min)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Add Account** | 1. Navigate to `/accounts`.<br>2. Click **Add Account**.<br>3. Name: `HDFC Savings`, Type: `Bank`, Balance: `25000`.<br>4. Save. | New account card appears with correct balance and badge. | **Firestore:** Written to `users/{uid}/accounts/{id}`. |
| **Add Budget** | 1. On Dashboard / Budgets, set a category budget: `Food` = `10000`. | Budget progress bar renders with current food spend `₹1,200 / ₹10,000` (12%). | **Firestore:** Stored in `users/{uid}/budgets/{id}`. |
| **Add Goal** | 1. In Savings Goals, click **Add Goal**.<br>2. Name: `Emergency Fund`, Target: `100000`, Current: `25000`. | Goal progress widget renders 25% complete. | **Firestore:** Stored in `users/{uid}/goals/{id}`. |
| **Add Bill** | 1. In Recurring Bills, add: `WiFi Broadband`, Amount: `999`, Due Date: Next week. | Bill is tracked with status `Upcoming`. | **Firestore:** Stored in `users/{uid}/bills/{id}`. |

---

## Step 6: CSV Statement Import (1 min)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Import CSV** | 1. Navigate to `/transactions`.<br>2. Click **Import Statement**.<br>3. Create or drag a test `.csv` file with headers:<br>`Date,Description,Amount,Type`<br>`2026-03-01,Zomato Delivery,340,Expense`<br>`2026-03-05,Freelance Client,15000,Income`<br>4. Click **Import**. | Transactions preview parses correctly with categories (`Food`, `Salary`). Batch commit imports all records without duplication. | **Console:** Clean batch commit logs; Papaparse dynamically loaded without bloating initial bundle. |

---

## Step 7: Receipt Scanning & OCR (1 min)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Scan Receipt** | 1. Click **Scan Receipt** icon / modal.<br>2. Upload an image of a grocery or cafe receipt.<br>3. Review parsed merchant name, date, and total amount. | If backend is online, parsed amounts autofill into the transaction form. If backend is unavailable or sleeping, honest error / slow wake banner is displayed with retry. | **Network tab:** Request to `POST /api/v1/gemini/analyze-receipt` or `POST /api/v1/ocr/scan-receipt`.<br>**Headers:** `Authorization: Bearer <Firebase ID token>`. |

---

## Step 8: Voice Entry (30 sec)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Voice Log** | 1. Click the microphone icon.<br>2. Speak: *"Spent 450 rupees on Uber ride yesterday"*.<br>3. Confirm speech transcription or backend parsing. | Form populates: Amount: `450`, Category: `Travel`, Note: `Uber ride`. | **Network tab:** If backend audio processing is triggered, Bearer token is attached. |

---

## Step 9: AI Advisor & Slow Backend Wake-up (1 min)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **AI Advisor** | 1. Navigate to `/ai-advisor`.<br>2. Ask: *"How can I optimize my food budget this month?"*<br>3. If backend is free-tier sleeping (Render spin-up): notice amber banner *"AI is waking up, please wait (~30s)..."*. | Once awake, response streams or populates recommendations based on user's actual transactions. If backend fails or is offline, local summary clearly labels itself as *"computed from your data, AI unavailable"*. | **Network tab:** `POST /api/v1/ai/chat` or `POST /api/v1/ai/advisor`.<br>**Request Headers:** `Authorization: Bearer <idToken>`.<br>**Response:** HTTP 200 with structured advice. |

---

## Step 10: Gmail Sync (Optional / Manual Trigger) (30 sec)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Connect Gmail** | 1. In Settings or Transactions, click **Sync Gmail**.<br>2. Inspect network call. | Backend proxy validates user session via Bearer token before requesting Google OAuth credentials. | **Network tab:** `GET /api/v1/gmail/status` or `POST /api/v1/gmail/sync`.<br>**Headers:** `Authorization: Bearer <token>`. |

---

## Step 11: Offline Mode & PWA Resilience (1 min)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Go Offline** | 1. In DevTools, open the **Network** tab.<br>2. Change throttling dropdown from **No throttling** to **Offline**.<br>3. Reload or navigate between `/dashboard`, `/transactions`, and `/accounts`. | - Top banner displays: *"You are offline. Showing cached financial data."*<br>- Cached transactions and accounts still render seamlessly from IndexedDB persistence.<br>- No white screen crash. | **Application tab:** Service Worker is active, Cache Storage has pre-cached app assets, IndexedDB contains offline snapshot cache. |
| **Restore Network** | 4. Set throttling back to **No throttling**. | Offline banner dismisses automatically. | |

---

## Step 12: PWA Installation (30 sec)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **PWA Check** | 1. Look for the "Install App" button in the browser address bar (or in-app prompt).<br>2. Check DevTools > **Application** > **Manifest**. | Manifest loads without errors: `name: FinSight AI`, `start_url: /`, `display: standalone`, icons 192x192 & 512x512 maskable present. | No manifest or icon parsing warnings. |

---

## Step 13: Log Out & Protected Route Verification (30 sec)

| Action | Steps | Expected Result | What to Inspect in DevTools |
| :--- | :--- | :--- | :--- |
| **Sign Out** | 1. In user menu (bottom left / top right), click **Sign Out**.<br>2. Try manually navigating to `http://localhost:5173/dashboard` or `http://localhost:5173/transactions`. | User is signed out immediately; attempting to access `/dashboard` redirects immediately to `/login`. Firestore real-time listeners are completely unsubscribed. | **Console:** No listener memory leaks or permission errors post-logout. |

---

## Summary Checklist

- [x] Sign Up & Login authentication
- [x] Firestore read/write real-time listeners
- [x] Multi-tab / multi-browser state sync
- [x] Ingestion flows (CSV statement, Receipt OCR, Voice)
- [x] AI Advisor with Bearer token & cold-start notice
- [x] Offline IndexedDB cache & Service Worker
- [x] Logout listener teardown & ProtectedRoute redirection
