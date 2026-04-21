import mongoose from "mongoose";
import ngeohash from "ngeohash";
import MatchQueue from "../models/matchQueue.model";
import GhostMatch from "../models/ghost.model";
import { User } from "../models/User";
import { sendPushNotification } from "./notification.service";

// ─── ENTER QUEUE ──────────────────────────────────────────
export const enterQueue = async (
  userId: string,
  lat: number,
  lng: number
) => {
  const geohash = ngeohash.encode(lat, lng, 5);

  const existingMatch = await GhostMatch.findOne({
    $or: [
      { userA: new mongoose.Types.ObjectId(userId) },
      { userB: new mongoose.Types.ObjectId(userId) },
    ],
    isActive: true,
  });

  if (existingMatch) {
    throw new Error("You already have an active ghost match");
  }

  const waitingUser = await MatchQueue.findOne({
    geohash,
    userId: { $ne: new mongoose.Types.ObjectId(userId) },
  });

  if (waitingUser) {
    await MatchQueue.deleteMany({
      userId: {
        $in: [
          new mongoose.Types.ObjectId(userId),
          waitingUser.userId,
        ],
      },
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const match = await GhostMatch.create({
      userA: waitingUser.userId,
      userB: new mongoose.Types.ObjectId(userId),
      geohash,
      isActive: true,
      expiresAt,
    });

    // ─── NOTIFY BOTH USERS ──────────────────────────────
    const [userADoc, userBDoc] = await Promise.all([
      User.findById(waitingUser.userId),
      User.findById(userId),
    ]);

    if (userADoc?.fcmToken) {
      await sendPushNotification(
        userADoc.fcmToken,
        "Ghost Match Found 👻",
        "You've been matched. Start chatting before it disappears.",
        { matchId: match._id.toString() }
      );
    }

    if (userBDoc?.fcmToken) {
      await sendPushNotification(
        userBDoc.fcmToken,
        "Ghost Match Found 👻",
        "You've been matched. Start chatting before it disappears.",
        { matchId: match._id.toString() }
      );
    }
    // ────────────────────────────────────────────────────

    return { status: "matched", match };
  }

  const expiresAt = new Date(Date.now() + 30 * 1000);

  await MatchQueue.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { geohash, expiresAt },
    { upsert: true, new: true }
  );

  return { status: "waiting", geohash };
};

// ─── LEAVE QUEUE ──────────────────────────────────────────
export const leaveQueue = async (userId: string) => {
  await MatchQueue.findOneAndDelete({
    userId: new mongoose.Types.ObjectId(userId),
  });

  return { message: "Left queue successfully" };
};

// ─── CHECK MATCH ──────────────────────────────────────────
export const checkMatch = async (userId: string) => {
  const match = await GhostMatch.findOne({
    $or: [
      { userA: new mongoose.Types.ObjectId(userId) },
      { userB: new mongoose.Types.ObjectId(userId) },
    ],
    isActive: true,
  });

  if (!match) return { status: "no_match" };

  return { status: "matched", match };
};

// ─── DISSOLVE MATCH ───────────────────────────────────────
export const dissolveMatch = async (matchId: string) => {
  const match = await GhostMatch.findByIdAndUpdate(
    matchId,
    { isActive: false },
    { new: true }
  );

  if (!match) throw new Error("Match not found");

  return match;
};