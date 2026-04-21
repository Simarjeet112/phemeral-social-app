import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
} from "../services/safety.service";

// ─── BLOCK USER ───────────────────────────────────────────
export const block = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const blockerId = req.user!.userId;
    const { blockedId } = req.body;

    if (!blockedId) {
      res.status(400).json({
        success: false,
        error: "blockedId is required",
      });
      return;
    }

    const result = await blockUser(blockerId, blockedId);

    res.status(201).json({
      success: true,
      message: "User blocked",
      block: result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    const status =
      message === "You cannot block yourself" ||
      message === "User already blocked"
        ? 400
        : 500;

    res.status(status).json({ success: false, error: message });
  }
};

// ─── UNBLOCK USER ─────────────────────────────────────────
export const unblock = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const blockerId = req.user!.userId;
    const { blockedId } = req.body;

    if (!blockedId) {
      res.status(400).json({
        success: false,
        error: "blockedId is required",
      });
      return;
    }

    const result = await unblockUser(blockerId, blockedId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    const status = message === "Block not found" ? 404 : 500;

    res.status(status).json({ success: false, error: message });
  }
};

// ─── GET BLOCKED USERS ────────────────────────────────────
export const getBlocked = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const blocks = await getBlockedUsers(userId);

    res.status(200).json({
      success: true,
      count: blocks.length,
      blocks,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// ─── REPORT USER ──────────────────────────────────────────
export const report = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reporterId = req.user!.userId;
    const { reportedId, reason, details } = req.body;

    if (!reportedId || !reason) {
      res.status(400).json({
        success: false,
        error: "reportedId and reason are required",
      });
      return;
    }

    const validReasons = [
      "harassment",
      "spam",
      "inappropriate_content",
      "other",
    ];

    if (!validReasons.includes(reason)) {
      res.status(400).json({
        success: false,
        error: `reason must be one of: ${validReasons.join(", ")}`,
      });
      return;
    }

    const result = await reportUser(reporterId, reportedId, reason, details);

    res.status(201).json({
      success: true,
      message: "Report submitted",
      report: result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    const status = message === "You cannot report yourself" ? 400 : 500;

    res.status(status).json({ success: false, error: message });
  }
};