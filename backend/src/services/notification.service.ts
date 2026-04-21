import admin from "../config/firebase";

export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data ?? {},
    });
    console.log(`Push sent: ${title}`);
  } catch (err) {
    // Don't crash the app if notification fails
    console.error("Push notification failed:", err);
  }
};