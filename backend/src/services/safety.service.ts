import mongoose from "mongoose";
import Block from "../models/block.model";
import Report, { ReportReason } from "../models/report.model";

// ─── UTILITY: CHECK IF BLOCKED ────────────────────────────
export const isBlocked = async (
  userA: string,
  userB: string
): Promise<boolean> => {
  const block = await Block.findOne({
    $or: [
      {
        blockerId: new mongoose.Types.ObjectId(userA),
        blockedId: new mongoose.Types.ObjectId(userB),
      },
      {
        blockerId: new mongoose.Types.ObjectId(userB),
        blockedId: new mongoose.Types.ObjectId(userA),
      },
    ],
  });

  return !!block;
};

// ─── BLOCK USER ───────────────────────────────────────────
export const blockUser = async (
  blockerId: string,
  blockedId: string
) => {
  if (blockerId === blockedId) {
    throw new Error("You cannot block yourself");
  }

  const existingBlock = await Block.findOne({
    blockerId: new mongoose.Types.ObjectId(blockerId),
    blockedId: new mongoose.Types.ObjectId(blockedId),
  });

  if (existingBlock) {
    throw new Error("User already blocked");
  }

  const block = await Block.create({
    blockerId: new mongoose.Types.ObjectId(blockerId),
    blockedId: new mongoose.Types.ObjectId(blockedId),
  });

  return block;
};

// ─── UNBLOCK USER ─────────────────────────────────────────
export const unblockUser = async (
  blockerId: string,
  blockedId: string
) => {
  const block = await Block.findOneAndDelete({
    blockerId: new mongoose.Types.ObjectId(blockerId),
    blockedId: new mongoose.Types.ObjectId(blockedId),
  });

  if (!block) {
    throw new Error("Block not found");
  }

  return { message: "User unblocked successfully" };
};

// ─── GET BLOCKED USERS ────────────────────────────────────
export const getBlockedUsers = async (userId: string) => {
  const blocks = await Block.find({
    blockerId: new mongoose.Types.ObjectId(userId),
  }).populate("blockedId", "username");

  return blocks;
};

// ─── REPORT USER ──────────────────────────────────────────
export const reportUser = async (
  reporterId: string,
  reportedId: string,
  reason: ReportReason,
  details?: string
) => {
  if (reporterId === reportedId) {
    throw new Error("You cannot report yourself");
  }

  const report = await Report.create({
    reporterId: new mongoose.Types.ObjectId(reporterId),
    reportedId: new mongoose.Types.ObjectId(reportedId),
    reason,
    details,
  });

  return report;
};