import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  createCircle, getMyCircles, getCircle,
  joinCircle, getMessages, removeMember,
  leaveCircle, sendInvite, getPendingInvites,
  acceptInvite, rejectInvite,
} from "../controllers/circle.controller";

const router = Router();

router.post("/", protect, createCircle);
router.get("/", protect, getMyCircles);
router.get("/invites/pending", protect, getPendingInvites);
router.get("/:id", protect, getCircle);
router.post("/:id/join", protect, joinCircle);
router.get("/:id/messages", protect, getMessages);
router.post("/:id/invite", protect, sendInvite);
router.post("/invites/:inviteId/accept", protect, acceptInvite);
router.post("/invites/:inviteId/reject", protect, rejectInvite);
router.delete("/:id/members/:memberId", protect, removeMember);
router.post("/:id/leave", protect, leaveCircle);

export default router;