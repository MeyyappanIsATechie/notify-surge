// oops... admin.messaging() is gone in v12 — using getMessaging() from 'firebase-admin/messaging'
const { getMessaging } = require("firebase-admin/messaging");
const logger = require("../utils/logger");

const subscribeToTopic = async (tokens, topic) => {
  const res = await getMessaging().subscribeToTopic(tokens, topic);
  logger.info("Subscribed to topic", {
    topic,
    success: res.successCount,
    failed: res.failureCount,
  });
  return res;
};

const unsubscribeFromTopic = async (tokens, topic) => {
  const res = await getMessaging().unsubscribeFromTopic(tokens, topic);
  logger.info("Unsubscribed from topic", {
    topic,
    success: res.successCount,
    failed: res.failureCount,
  });
  return res;
};

const sendToTopic = async ({ topic, title, body, data = {} }) => {
  const message = {
    topic,
    notification: { title, body },
    data,
    android: {
      priority: "high",
      notification: { sound: "default" },
    },
    apns: {
      payload: { aps: { sound: "default", badge: 1 } },
    },
  };

  const messageId = await getMessaging().send(message);
  logger.info("FCM topic message sent", { topic, messageId });
  return messageId;
};

module.exports = { subscribeToTopic, unsubscribeFromTopic, sendToTopic };
