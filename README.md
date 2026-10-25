# FinSight AI — AI-Powered Personal Finance Assistant

FinSight AI is a modern, high-performance Personal Finance Progressive Web App (PWA) designed to track expenses, manage budgets, analyze cash flows, scan receipts with vision AI, parse voice transactions, and provide contextual financial advice.

---

## 1. Real Architecture

- **Frontend (`frontend/`)**: React 19, Vite 7, Tailwind CSS 4, and `vite-plugin-pwa` (Workbox). Deployed on **Vercel**.
- **Backend (`backend/`)**: Node.js, Express 5 (ES Modules), Helmet security headers, rate limiting, and CORS enforcement. Deployed on **Render**.
- **Database & Auth**: **Firebase Firestore** and **Firebase Auth** exclusively.
  - User financial data lives under `users/{uid}/**` with strict Firestore security rules.
  - Real-time Firestore subscriptions (`onSnapshot`) serve as the single source of truth across all devices.
- **AI Processing**: Google Gemini API called **exclusively through the backend**.
  - All Gemini API keys remain secure on the server side and are never exposed in browser bundles.
  - Backend endpoints are protected by Firebase ID token authentication (`Authorization: Bearer <token>`).
- **Clean Architecture Notice**: There is **NO legacy relational ORM, NO SQL database, and NO Next.js** in this repository.

---

## 2. Environment Variables

### Frontend (`frontend/.env`)

Configure these in `frontend/.env` for local development and in the **Vercel Project Settings > Environment Variables** for production:

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API (Render URL in production) | `http://localhost:5000` (dev only) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain | `your-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `your-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging Sender ID | `123456789012` |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | `1:123456789012:web:...` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID (for Gmail Sync / Google Sign-In) | `12345...apps.googleusercontent.com` |

> **Security Note:** Never add `VITE_GEMINI_API_KEY` to the frontend. All AI requests are mediated securely by the backend service.

### Backend (`backend/.env`)

Configure these in `backend/.env` for local development and in the **Render Dashboard > Environment** for production:

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | HTTP server listening port | `5000` |
| `CLIENT_ORIGIN` | Allowed client origins (comma-separated, without trailing slashes) | `http://localhost:5173,https://your-app.vercel.app` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini AI model identifier | `gemini-2.5-flash` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project-id` |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin Service Account JSON string | `{"type":"service_account",...}` |

---

## 3. Local Development

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Run the Backend
```bash
cd backend
npm install
npm run dev
```
The backend server runs on `http://localhost:5000`. Test the health check endpoint:
```bash
curl http://localhost:5000/health
# Response: {"status":"ok","timestamp":"...","uptime":...}
```

### Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend Vite development server runs on `http://localhost:5173`.

---

## 4. Deployment Guide

### A. Frontend on Vercel
1. Link your Git repository on **Vercel**.
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the Frontend Environment Variables listed above.
4. **Important**: Whenever you update environment variables in Vercel, trigger a fresh redeploy (Vite inlines `import.meta.env` values at build time).
5. Single Page Application (SPA) rewrites and Cache-Control headers for `index.html`, `sw.js`, and `registerSW.js` are managed automatically by `frontend/vercel.json`.

### B. Backend on Render
1. Create a new **Web Service** on **Render** connected to your repository.
2. Configure service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Under Environment Variables, add the Backend variables (`PORT`, `CLIENT_ORIGIN`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT`).
4. `backend/package.json` specifies `"engines": { "node": ">=20" }`.

### C. Firebase Configuration
1. **Deploy Firestore Security Rules**:
   Apply `firestore.rules` via Firebase CLI or paste into Firebase Console:
   ```bash
   firebase deploy --only firestore:rules
   ```
   All documents are strictly restricted to authenticated users:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
2. **Authorized Domains in Firebase Auth**:
   In **Firebase Console > Authentication > Settings > Authorized Domains**, add your Vercel deployment domain (e.g., `your-app.vercel.app`).
3. **Google Cloud OAuth Client**:
   In **Google Cloud Console > APIs & Services > Credentials**, find your OAuth 2.0 Client ID and add your Vercel domain to **Authorized JavaScript origins** and **Authorized redirect URIs**.

---

## 5. Security & Verification

- **Authenticated API**: All backend endpoints (`/api/ai/*`, `/api/gmail/*`) verify the client's Firebase ID token using `firebase-admin`.
- **CORS Protection**: Origin validation rejects unauthorized origins and strips trailing slashes for accurate matching.
- **Rate Limiting**: AI endpoints are rate-limited to 60 requests per 15-minute window per IP to safeguard quotas.
- **Input Validation**: Receipt images (base64) and voice transcripts are validated for type, length, and MIME types. Sensitive tokens and prompts are never logged.
- **Fail-Loudly**: Missing Firebase client configuration renders a visible, clear diagnostics screen rather than failing silently with mock data.
- **PWA Lifecycle**: Old legacy service workers and obsolete `v1` caches are cleaned up automatically on launch. Progressive Web App caching policies are controlled via Workbox in `vite.config.js`.
