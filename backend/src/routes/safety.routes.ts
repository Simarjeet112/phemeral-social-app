import { Router } from "express";
import { block, unblock, getBlocked, report } from "../controllers/safety.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/block", protect, block);
router.delete("/block", protect, unblock);
router.get("/blocks", protect, getBlocked);
router.post("/report", protect, report);

export default router;