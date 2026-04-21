import { Server, Socket } from "socket.io";
import CircleMessage from "../models/circleMessage.model";
import Circle from "../models/circle.model";
import mongoose from "mongoose";

export const registerCircleSocket = (io: Server, socket: Socket) => {
  const userId = socket.data.userId as string;

  socket.on("circle:join", async ({ circleId }: { circleId: string }) => {
    try {
      const circle = await Circle.findOne({
        _id: new mongoose.Types.ObjectId(circleId),
        members: new mongoose.Types.ObjectId(userId),
      });

      if (!circle) {
        socket.emit("circle:error", { message: "Not a member of this circle" });
        return;
      }

      socket.join(`circle:${circleId}`);
      console.log(`userId: ${userId} joined circle: ${circleId}`);
    } catch (err) {
      socket.emit("circle:error", { message: "Failed to join circle" });
    }
  });

  socket.on("circle:message", async ({ circleId, text }: { circleId: string; text: string }) => {
    try {
      if (!text?.trim()) return;

      const circle = await Circle.findOne({
        _id: new mongoose.Types.ObjectId(circleId),
        members: new mongoose.Types.ObjectId(userId),
      });

      if (!circle) {
        socket.emit("circle:error", { message: "Not a member" });
        return;
      }

      const message = await CircleMessage.create({
        circleId: new mongoose.Types.ObjectId(circleId),
        senderId: new mongoose.Types.ObjectId(userId),
        text: text.trim(),
      });

      const populated = await message.populate("senderId", "username");

      io.to(`circle:${circleId}`).emit("circle:new_message", {
        _id: message._id,
        text: message.text,
        senderId: { _id: userId, username: (populated.senderId as any).username },
        createdAt: message.createdAt,
      });
    } catch (err) {
      socket.emit("circle:error", { message: "Failed to send message" });
    }
  });

  socket.on("circle:leave", ({ circleId }: { circleId: string }) => {
    socket.leave(`circle:${circleId}`);
  });
};