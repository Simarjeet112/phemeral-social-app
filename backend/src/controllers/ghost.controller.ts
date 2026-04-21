import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  enterQueue,
  leaveQueue,
  checkMatch,
  dissolveMatch,
} from "../services/ghost.service";

// ─── ENTER QUEUE ──────────────────────────────────────────
export const enter = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { lat, lng } = req.body;

    // Validate coordinates
    if (lat === undefined || lng === undefined) {
      res.status(400).json({
        success: false,
        error: "lat and lng are required",
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        error: "Invalid coordinates",
      });
      return;
    }

    const result = await enterQueue(userId, lat, lng);

    // If matched → 200, if waiting → 202 (accepted but processing)
    const statusCode = result.status === "matched" ? 200 : 202;

    res.status(statusCode).json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    const status =
      message === "You already have an active ghost match" ? 400 : 500;

    res.status(status).json({ success: false, error: message });
  }
};

// ─── LEAVE QUEUE ──────────────────────────────────────────
export const leave = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const result = await leaveQueue(userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// ─── CHECK MATCH ──────────────────────────────────────────
export const check = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const result = await checkMatch(userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// ─── DISSOLVE MATCH ───────────────────────────────────────
export const dissolve = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const matchId = req.params.id as string;

    const result = await dissolveMatch(matchId);

    res.status(200).json({
      success: true,
      message: "Match dissolved",
      match: result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    const status = message === "Match not found" ? 404 : 500;

    res.status(status).json({ success: false, error: message });
  }
};