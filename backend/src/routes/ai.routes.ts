import { Router } from "express";
import { suggestReplies, moodDetect, captionImprove } from "../controllers/ai.controller";
import { protect } from "../middleware/auth.middleware";
import { aiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.use(protect);      // all AI routes require auth
router.use(aiLimiter);    // all AI routes are rate limited

router.post("/suggestions", suggestReplies);
router.post("/mood", moodDetect);
router.post("/caption", captionImprove);

export default router;