import { Router, Request, Response } from "express";
import { protect } from "../middleware/auth.middleware";
import {User} from "../models/User"; // ← match your actual filename

const router = Router();

router.post("/fcm-token", protect, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

    await User.findByIdAndUpdate(req.user?.userId, { fcmToken: token });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save token" });
  }
});

export default router;