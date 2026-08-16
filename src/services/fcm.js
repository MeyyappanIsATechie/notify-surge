const admin = require("firebase-admin");
const logger = require("../utils/logger");

// Subscribe up to 500 device tokens to a topic in one call
const subscribeToTopic = async (tokens, topic) => {
  const res = await admin.messaging().subscribeToTopic(tokens, topic);
  logger.info("Subscribed to topic", {
    topic,
    success: res.successCount,
    failed: res.failureCount,
  });
  return res;
};

// Unsubscribe tokens from a topic
const unsubscribeFromTopic = async (tokens, topic) => {
  const res = await admin.messaging().unsubscribeFromTopic(tokens, topic);
  logger.info("Unsubscribed from topic", {
    topic,
    success: res.successCount,
    failed: res.failureCount,
  });
  return res;
};

// ONE API call → FCM fans out to every subscriber on that topic
// This is the core of the million-user notification pattern.
const sendToTopic = async ({ topic, title, body, data = {} }) => {
  const message = {
    topic,
    notification: { title, body },
    data, // Arbitrary key-value pairs — your app can read these on the client
    android: {
      priority: "high",
      notification: { sound: "default" },
    },
    apns: {
      // iOS (Apple Push Notification Service)
      payload: { aps: { sound: "default", badge: 1 } },
    },
  };

  const messageId = await admin.messaging().send(message);
  logger.info("FCM topic message sent", { topic, messageId });
  return messageId;
};

module.exports = { subscribeToTopic, unsubscribeFromTopic, sendToTopic };
