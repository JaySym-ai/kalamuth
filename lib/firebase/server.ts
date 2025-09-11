import "server-only";

// Server-side Firebase Admin SDK. Works only in Node.js runtime (not Edge).
// Uses service account creds from env; caches app to avoid re-init in lambdas.

import { getApp, getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApp();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  // Fallback to ADC (e.g., local dev with `gcloud auth application-default login`)
  return initializeApp({
    credential: applicationDefault(),
    projectId: projectId || undefined,
  });
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}

