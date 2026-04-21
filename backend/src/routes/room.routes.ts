import { Router } from "express";
import { joinDrop } from "../controllers/room.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// change /:id/join to this explicit path
router.post("/:id/join", protect, joinDrop);

export default router;