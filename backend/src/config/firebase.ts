import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config(); // make sure env vars are loaded

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  console.log("Firebase init check:", { projectId, clientEmail: !!clientEmail, privateKey: !!privateKey });

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export default admin;