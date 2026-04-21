import mongoose from "mongoose";
import Signal from "../models/signal.model";
import Connection from "../models/connection.model";
import Room from "../models/room.model";
import { isBlocked } from "./safety.service";

// ─── SEND SIGNAL ──────────────────────────────────────────
export const sendSignal = async (
  senderId: string,
  receiverId: string,
  roomId: string
) => {
  // Can't signal yourself
  if (senderId === receiverId) {
    throw new Error("You cannot signal yourself");
  }

  // Check if either user has blocked the other
  const blocked = await isBlocked(senderId, receiverId);
  if (blocked) {
    throw new Error("Cannot signal this user");
  }

  // Both users must be in the room
  const room = await Room.findById(roomId);

  if (!room || !room.isActive) {
    throw new Error("Room not found or inactive");
  }

  const senderInRoom = room.participants.some(
    (p) => p.toString() === senderId
  );
  const receiverInRoom = room.participants.some(
    (p) => p.toString() === receiverId
  );

  if (!senderInRoom || !receiverInRoom) {
    throw new Error("Both users must be in the room");
  }

  // Check if signal already exists
  const existingSignal = await Signal.findOne({
    senderId: new mongoose.Types.ObjectId(senderId),
    receiverId: new mongoose.Types.ObjectId(receiverId),
    roomId: new mongoose.Types.ObjectId(roomId),
  });

  if (existingSignal) {
    throw new Error("Signal already sent");
  }

  // Create signal — expires in 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const signal = await Signal.create({
    senderId: new mongoose.Types.ObjectId(senderId),
    receiverId: new mongoose.Types.ObjectId(receiverId),
    roomId: new mongoose.Types.ObjectId(roomId),
    status: "pending",
    expiresAt,
  });

  return signal;
};

// ─── ACCEPT SIGNAL ────────────────────────────────────────
export const acceptSignal = async (
  signalId: string,
  userId: string
) => {
  const signal = await Signal.findById(signalId);

  if (!signal) {
    throw new Error("Signal not found");
  }

  if (signal.receiverId.toString() !== userId) {
    throw new Error("Not authorized");
  }

  if (signal.status !== "pending") {
    throw new Error("Signal already actioned");
  }

  signal.status = "accepted";
  await signal.save();

  // Check if connection already exists
  const existingConnection = await Connection.findOne({
    $or: [
      { userA: signal.senderId, userB: signal.receiverId },
      { userA: signal.receiverId, userB: signal.senderId },
    ],
  });

  if (existingConnection) {
    return existingConnection;
  }

  // Create 24h connection
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const connection = await Connection.create({
    userA: signal.senderId,
    userB: signal.receiverId,
    expiresAt,
  });

  return connection;
};

// ─── REJECT SIGNAL ────────────────────────────────────────
export const rejectSignal = async (
  signalId: string,
  userId: string
) => {
  const signal = await Signal.findById(signalId);

  if (!signal) {
    throw new Error("Signal not found");
  }

  if (signal.receiverId.toString() !== userId) {
    throw new Error("Not authorized");
  }

  if (signal.status !== "pending") {
    throw new Error("Signal already actioned");
  }

  signal.status = "rejected";
  await signal.save();

  return { message: "Signal rejected" };
};

// ─── GET PENDING SIGNALS ──────────────────────────────────
export const getPendingSignals = async (userId: string) => {
  const signals = await Signal.find({
    receiverId: new mongoose.Types.ObjectId(userId),
    status: "pending",
  }).populate("senderId", "username");

  return signals;
};