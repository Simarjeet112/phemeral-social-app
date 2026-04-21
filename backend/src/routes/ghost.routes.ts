import { Router } from "express";
import { enter, leave, check, dissolve } from "../controllers/ghost.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/enter", protect, enter);
router.post("/leave", protect, leave);
router.get("/match", protect, check);
router.post("/dissolve/:id", protect, dissolve);

export default router;