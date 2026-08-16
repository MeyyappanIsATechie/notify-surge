const admin = require("firebase-admin");
const logger = require("../utils/logger");

let initialized = false;

const initFirebase = () => {
  if (initialized) return;

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
    logger.info("Firebase Admin SDK initialized");
  } catch (err) {
    logger.error("Firebase init failed", { error: err.message });
    throw err; // Crash fast — server is useless without Firebase
  }
};

module.exports = { initFirebase };
