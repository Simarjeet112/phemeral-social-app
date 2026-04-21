import { Router } from "express";
import { send, accept, reject, getPending } from "../controllers/signal.controller";
import { protect } from "../middleware/auth.middleware";
import { signalLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/send", protect, send);
router.post("/:id/accept", protect, accept);
router.post("/:id/reject", protect, reject);
router.get("/pending", protect, getPending);
router.post("/send", protect, signalLimiter, send);

export default router;