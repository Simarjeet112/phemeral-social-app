import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { joinRoom } from "../services/room.service";

export const joinDrop = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    console.log(`joinDrop called - dropId: ${id} userId: ${userId}`);

    const room = await joinRoom(userId, id);
    res.status(200).json({
      success: true,
      message: "Joined room successfully",
      room,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    console.log(`joinDrop error: ${message}`);
    const status =
      message === "Drop not found" || message === "Drop has expired"
        ? 404
        : 500;
    res.status(status).json({ success: false, error: message });
  }
}; 