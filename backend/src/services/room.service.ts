import Room from "../models/room.model";
import Drop from "../models/Drop";
import mongoose from "mongoose";
import { isBlocked } from "./safety.service";

export const joinRoom = async (userId: string, dropId: string) => {

  // Step 1: Validate the drop
  const drop = await Drop.findById(dropId);

  if (!drop) {
    throw new Error("Drop not found");
  }

  if (drop.expiresAt < new Date()) {
    throw new Error("Drop has expired");
  }

  // Step 2: Find an active room for this drop that has space
  const availableRoom = await Room.findOne({
    dropId: new mongoose.Types.ObjectId(dropId),
    isActive: true,
    $expr: { $lt: [{ $size: "$participants" }, "$maxSize"] },
  });

  // Step 3: If room exists → check blocks → add user
  if (availableRoom) {

    // Check if joining user is blocked by any participant
    for (const participantId of availableRoom.participants) {
      const blocked = await isBlocked(userId, participantId.toString());
      if (blocked) {
        throw new Error("You cannot join this room");
      }
    }

    const alreadyInRoom = availableRoom.participants.some(
      (p) => p.toString() === userId
    );

    if (!alreadyInRoom) {
      availableRoom.participants.push(
        new mongoose.Types.ObjectId(userId)
      );
      availableRoom.lastActiveAt = new Date();
      await availableRoom.save();
    }

    return availableRoom;
  }

  // Step 4: No available room → create a new one
  const newRoom = await Room.create({
    dropId: new mongoose.Types.ObjectId(dropId),
    participants: [new mongoose.Types.ObjectId(userId)],
    maxSize: drop.maxSize,
    isActive: true,
    lastActiveAt: new Date(),
  });

  return newRoom;
};