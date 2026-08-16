// firebase-admin v12+ uses modular imports — admin.credential no longer exists
const { initializeApp, cert } = require("firebase-admin/app");
const logger = require("../utils/logger");

let initialized = false;

const initFirebase = () => {
  if (initialized) return;

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    initializeApp({
      credential: cert(serviceAccount), // cert() comes from 'firebase-admin/app' directly and not from 'firebase-admin' as before
    });

    initialized = true;
    logger.info("Firebase Admin SDK initialized");
  } catch (err) {
    logger.error("Firebase init failed", { error: err.message });
    throw err;
  }
};

module.exports = { initFirebase };
