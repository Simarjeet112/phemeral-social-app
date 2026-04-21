import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  sendSignal,
  acceptSignal,
  rejectSignal,
  getPendingSignals,
} from "../services/signal.service";
import { sendPushNotification } from "../services/notification.service";
import { User } from "../models/User";

// ─── SEND SIGNAL ──────────────────────────────────────────
export const send = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const senderId = req.user!.userId;
    const { receiverId, roomId } = req.body;

    if (!receiverId || !roomId) {
      res.status(400).json({
        success: false,
        error: "receiverId and roomId are required",
      });
      return;
    }

    const signal = await sendSignal(senderId, receiverId, roomId);

    res.status(201).json({
      success: true,
      message: "Signal sent",
      signal,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    const status =
      message === "You cannot signal yourself" ||
      message === "Signal already sent" ||
      message === "Both users must be in the room"
        ? 400
        : message === "Room not found or inactive"
        ? 404
        : 500;

    res.status(status).json({ success: false, error: message });
  }
};

// ─── ACCEPT SIGNAL ────────────────────────────────────────
export const accept = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const signalId = req.params.id as string;

    const connection = await acceptSignal(signalId, userId);

    // ─── NOTIFY SIGNAL SENDER ───────────────────────────
    const sender = await User.findById(connection.userA);
    if (sender?.fcmToken) {
      await sendPushNotification(
        sender.fcmToken,
        "Signal Accepted ⚡",
        "Someone accepted your signal. You have 24 hours.",
        { connectionId: connection._id.toString() }
      );
    }
    // ────────────────────────────────────────────────────

    res.status(200).json({
      success: true,
      message: "Signal accepted — connection created",
      connection,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    const status =
      message === "Not authorized" ? 403
      : message === "Signal not found" ? 404
      : message === "Signal already actioned" ? 400
      : 500;

    res.status(status).json({ success: false, error: message });
  }
};

// ─── REJECT SIGNAL ────────────────────────────────────────
export const reject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const signalId = req.params.id as string;

    const result = await rejectSignal(signalId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    const status =
      message === "Not authorized" ? 403
      : message === "Signal not found" ? 404
      : message === "Signal already actioned" ? 400
      : 500;

    res.status(status).json({ success: false, error: message });
  }
};

// ─── GET PENDING SIGNALS ──────────────────────────────────
export const getPending = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const signals = await getPendingSignals(userId);

    res.status(200).json({
      success: true,
      count: signals.length,
      signals,
    });
  } catch (error: unknown) {
    next(error);
  }
};