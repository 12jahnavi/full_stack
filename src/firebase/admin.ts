import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

let adminApp: App | undefined;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    if (getApps().every(app => app.name !== 'admin')) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      }, 'admin');
    } else {
      adminApp = getApps().find(app => app.name === 'admin');
    }
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Admin SDK features will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error);
  adminApp = undefined;
}

export function getAdminApp() {
  return adminApp;
}
