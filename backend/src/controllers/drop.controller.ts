import { Request, Response, NextFunction } from "express";
import { createDrop, getActiveDrops } from "../services/drop.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text, image, duration, maxSize } = req.body;

    const drop = await createDrop(
      req.user!.userId,
      text,
      image,
      duration,
      maxSize ?? 10
    );

    res.status(201).json({
      message: "Drop created",
      drop,
    });
} catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    res.status(400).json({ error: message });
  }
};

export const getDrops = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const drops = await getActiveDrops();
    res.status(200).json({ success: true, count: drops.length, drops });
} catch (error: unknown) {
    next(error);
  }
};