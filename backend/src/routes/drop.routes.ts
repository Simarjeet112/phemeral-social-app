import { Router } from "express";
import { create, getDrops } from "../controllers/drop.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/", protect, create);
router.get("/", protect, getDrops);

export default router;