import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let db = null;

try {
  const app = getApps().length === 0 ? initializeApp() : getApps()[0];
  db = getFirestore(app);
} catch (err) {
  try {
    const app = getApps().length === 0 ? initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "finsight-ai" }) : getApps()[0];
    db = getFirestore(app);
  } catch (fallbackErr) {
    console.log("Firebase Admin initialization notice:", fallbackErr.message);
  }
}

export { db };
export default db;
