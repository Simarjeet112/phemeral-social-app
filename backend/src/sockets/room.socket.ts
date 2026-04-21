import { Server, Socket } from "socket.io";
import Room from "../models/room.model";
import mongoose from "mongoose";

export const registerRoomEvents = (io: Server, socket: Socket): void => {

  // ─── JOIN ROOM ───────────────────────────────────────────
  socket.on("join_room", async (data: { roomId: string; userId: string }) => {
    try {
      const { roomId, userId } = data;

      const room = await Room.findById(roomId);

      if (!room || !room.isActive) {
        socket.emit("error", { message: "Room not found or inactive" });
        return;
      }

      // Join the Socket.io room
      socket.join(roomId);

      // Store userId on socket for later use
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      // Notify everyone else in the room
      socket.to(roomId).emit("room_update", {
        type: "USER_JOINED",
        participantCount: room.participants.length,
      });

      // Confirm to the joining user
      socket.emit("room_joined", {
        roomId,
        participantCount: room.participants.length,
      });

      console.log(`User ${userId} joined room ${roomId}`);

    } catch (error) {
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // ─── SEND MESSAGE ─────────────────────────────────────────
  socket.on("send_message", async (data: {
    roomId: string;
    userId: string;
    text: string;
  }) => {
    try {
      const { roomId, userId, text } = data;

      if (!text || !text.trim()) {
        socket.emit("error", { message: "Message cannot be empty" });
        return;
      }

      const room = await Room.findById(roomId);

      if (!room || !room.isActive) {
        socket.emit("error", { message: "Room not found or inactive" });
        return;
      }

      // Update lastActiveAt
      room.lastActiveAt = new Date();
      await room.save();

      // Build message payload
      const message = {
        userId,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      // Broadcast to everyone in the room including sender
      io.to(roomId).emit("receive_message", message);

    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ─── LEAVE ROOM ───────────────────────────────────────────
  socket.on("leave_room", async (data: {
    roomId: string;
    userId: string;
  }) => {
    try {
      const { roomId, userId } = data;

      await handleLeaveRoom(io, socket, roomId, userId);

    } catch (error) {
      socket.emit("error", { message: "Failed to leave room" });
    }
  });

  // ─── DISCONNECT ───────────────────────────────────────────
  socket.on("disconnect", async () => {
    try {
      const { roomId, userId } = socket.data;

      if (roomId && userId) {
        await handleLeaveRoom(io, socket, roomId, userId);
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  });
};

// ─── SHARED LEAVE LOGIC ───────────────────────────────────
const handleLeaveRoom = async (
  io: Server,
  socket: Socket,
  roomId: string,
  userId: string
): Promise<void> => {

  // Leave the Socket.io room
  socket.leave(roomId);

  // Remove user from participants in DB
  const room = await Room.findByIdAndUpdate(
    roomId,
    {
      $pull: {
        participants: new mongoose.Types.ObjectId(userId),
      },
    },
    { new: true }
  );

  if (!room) return;

  // If room is empty → dissolve it
  if (room.participants.length === 0) {
    room.isActive = false;
    await room.save();

    io.to(roomId).emit("room_dissolve", {
      message: "Room dissolved — everyone has left",
    });

    console.log(`Room ${roomId} dissolved`);
    return;
  }

  // Otherwise notify remaining users
  io.to(roomId).emit("room_update", {
    type: "USER_LEFT",
    participantCount: room.participants.length,
  });

  console.log(`User ${userId} left room ${roomId}`);
};