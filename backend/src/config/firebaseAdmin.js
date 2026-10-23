import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app = null;
let db = null;
let adminAuth = null;

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (serviceAccountRaw) {
  try {
    const serviceAccount =
      typeof serviceAccountRaw === "string"
        ? JSON.parse(serviceAccountRaw)
        : serviceAccountRaw;

    app =
      getApps().length === 0
        ? initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id || projectId,
          })
        : getApps()[0];

    db = getFirestore(app);
    adminAuth = getAuth(app);
  } catch (err) {
    console.error(
      "FATAL: Failed to initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT:",
      err.message
    );
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
} else if (projectId) {
  try {
    app =
      getApps().length === 0
        ? initializeApp({ projectId })
        : getApps()[0];
    db = getFirestore(app);
    adminAuth = getAuth(app);
  } catch (err) {
    console.warn("Firebase Admin projectId initialization notice:", err.message);
  }
} else {
  const errMsg =
    "FATAL: Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID in environment variables.";
  console.error(errMsg);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

export { db, adminAuth };
export default db;
