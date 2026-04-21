import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Circle from "../models/circle.model";
import CircleMessage from "../models/circleMessage.model";
import mongoose from "mongoose";
import CircleInvite from "../models/circleInvite.model";
import { User } from "../models/User";

export const createCircle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, vibe, originDropId } = req.body;
    const userId = req.user!.userId;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }
    const circle = await Circle.create({
      name,
      vibe: vibe ?? "chill",
      members: [new mongoose.Types.ObjectId(userId)],
      createdBy: new mongoose.Types.ObjectId(userId),
      originDropId: originDropId ?? undefined,
    });
    res.status(201).json({ success: true, circle });
  } catch (err) { next(err); }
};

export const getMyCircles = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const circles = await Circle.find({ members: { $in: [new mongoose.Types.ObjectId(userId)] } })
      .populate("members", "username")
      .populate("createdBy", "username")
      .sort({ updatedAt: -1 });
    res.json({ success: true, circles });
  } catch (err) { next(err); }
};

export const getCircle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const circle = await Circle.findOne({
      _id: id,
      members: { $in: [new mongoose.Types.ObjectId(userId)] },
    }).populate("members", "username");
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    res.json({ success: true, circle });
  } catch (err) { next(err); }
};

export const joinCircle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const circle = await Circle.findById(id);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    if (circle.members.length >= 20) { res.status(400).json({ error: "Circle is full (max 20)" }); return; }
    const alreadyMember = circle.members.some(m => m.toString() === userId);
    if (!alreadyMember) {
      circle.members.push(new mongoose.Types.ObjectId(userId));
      await circle.save();
    }
    res.json({ success: true, circle });
  } catch (err) { next(err); }
};

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const circle = await Circle.findOne({ _id: id, members: { $in: [new mongoose.Types.ObjectId(userId)] } });
    if (!circle) { res.status(404).json({ error: "Not a member" }); return; }
    const messages = await CircleMessage.find({ circleId: id })
      .populate("senderId", "username")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, messages: messages.reverse() });
  } catch (err) { next(err); }
};

export const addMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    const userId = req.user!.userId;
    const circle = await Circle.findById(id);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    if (circle.createdBy.toString() !== userId) { res.status(403).json({ error: "Only creator can add members" }); return; }
    if (circle.members.length >= 20) { res.status(400).json({ error: "Circle is full (max 20)" }); return; }
    const userToAdd = await User.findOne({ username });
    if (!userToAdd) { res.status(404).json({ error: "User not found" }); return; }
    const alreadyMember = circle.members.some(m => m.toString() === userToAdd._id.toString());
    if (alreadyMember) { res.status(400).json({ error: "Already a member" }); return; }
    circle.members.push(userToAdd._id as mongoose.Types.ObjectId);
    await circle.save();
    res.json({ success: true, message: `${username} added to circle` });
  } catch (err) { next(err); }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.userId;
    const circle = await Circle.findById(id);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    if (circle.createdBy.toString() !== userId) { res.status(403).json({ error: "Only creator can remove members" }); return; }
    circle.members = circle.members.filter(
      (m) => m.toString() !== memberId
    ) as mongoose.Types.ObjectId[];
    await circle.save();
    res.json({ success: true, message: "Member removed" });
  } catch (err) { next(err); }
};

export const leaveCircle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const circle = await Circle.findById(id);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    if (circle.createdBy.toString() === userId) { res.status(400).json({ error: "Creator cannot leave. Delete the circle instead." }); return; }
    circle.members = circle.members.filter(
      (m) => m.toString() !== userId
    ) as mongoose.Types.ObjectId[];
    await circle.save();
    res.json({ success: true, message: "Left circle" });
  } catch (err) { next(err); }
};

export const sendInvite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    const userId = req.user!.userId;
    const circle = await Circle.findById(id);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    const targetUser = await User.findOne({ username });
    if (!targetUser) { res.status(404).json({ error: "User not found" }); return; }
    const targetId = targetUser._id.toString();
    if (circle.members.some(m => m.toString() === targetId)) { res.status(400).json({ error: "Already a member" }); return; }
    const existing = await CircleInvite.findOne({ circleId: id as string, inviteeId: targetId, status: "pending" });
    if (existing) { res.status(400).json({ error: "Invite already pending" }); return; }
    const isCreator = circle.createdBy.toString() === userId;
    // ✅ fix
const invite = await CircleInvite.create({
    // ✅ fix
    circleId: new mongoose.Types.ObjectId(id as string),
      inviterId: userId,
      inviteeId: isCreator ? targetId : circle.createdBy.toString(),
      status: "pending",
    });
    res.status(201).json({
      success: true,
      message: isCreator ? `Invite sent to ${username}` : `Join request sent to circle creator`,
      invite,
    });
  } catch (err) { next(err); }
};

export const getPendingInvites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const invites = await CircleInvite.find({ inviteeId: userId, status: "pending" })
      .populate("circleId", "name vibe")
      .populate("inviterId", "username");
    res.json({ success: true, invites });
  } catch (err) { next(err); }
};

export const acceptInvite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { inviteId } = req.params;
    const userId = req.user!.userId;
    const invite = await CircleInvite.findOne({ _id: inviteId, inviteeId: userId, status: "pending" });
    if (!invite) { res.status(404).json({ error: "Invite not found" }); return; }
    invite.status = "accepted";
    await invite.save();
    const circle = await Circle.findById(invite.circleId);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    const isCreatorAccepting = circle.createdBy.toString() === userId;
    const memberToAdd = isCreatorAccepting ? invite.inviterId : invite.inviteeId;
    if (!circle.members.some(m => m.toString() === memberToAdd.toString())) {
      circle.members.push(memberToAdd as mongoose.Types.ObjectId);
      await circle.save();
    }
    res.json({ success: true, message: "Invite accepted" });
  } catch (err) { next(err); }
};

export const rejectInvite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { inviteId } = req.params;
    const userId = req.user!.userId;
    const invite = await CircleInvite.findOneAndUpdate(
      { _id: inviteId, inviteeId: userId, status: "pending" },
      { status: "rejected" },
      { new: true }
    );
    if (!invite) { res.status(404).json({ error: "Invite not found" }); return; }
    res.json({ success: true, message: "Invite rejected" });
  } catch (err) { next(err); }
};