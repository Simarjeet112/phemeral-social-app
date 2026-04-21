import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import GhostMatch from "../models/ghost.model";
import { dissolveMatch } from "../services/ghost.service";

export const registerGhostSocket = (io: Server, socket: Socket) => {
  const userId = socket.data.userId as string;

  socket.on("ghost:join", async ({ matchId }: { matchId: string }) => {
    console.log(`ghost:join received - userId: ${userId} matchId: ${matchId}`);
    try {
      const match = await GhostMatch.findOne({
        _id: new mongoose.Types.ObjectId(matchId),
        $or: [
          { userA: new mongoose.Types.ObjectId(userId) },
          { userB: new mongoose.Types.ObjectId(userId) },
        ],
        isActive: true,
      });

      if (!match) {
        console.log(`ghost:join failed - match not found for userId: ${userId}`);
        socket.emit("ghost:error", { message: "Match not found or inactive" });
        return;
      }

      const room = `ghost:${matchId}`;
      socket.join(room);
      console.log(`userId: ${userId} joined ghost room: ${room}`);

      socket.to(room).emit("ghost:partner_joined", {
        message: "Your partner has connected",
      });

      socket.emit("ghost:joined", {
        matchId,
        expiresAt: match.expiresAt,
        message: "Joined ghost chat",
      });

    } catch (err) {
      console.error("ghost:join error:", err);
      socket.emit("ghost:error", { message: "Failed to join ghost room" });
    }
  });

  socket.on("ghost:message", async ({ matchId, content }: { matchId: string; content: string }) => {
    console.log(`ghost:message received - userId: ${userId} matchId: ${matchId} content: ${content}`);
    try {
      const match = await GhostMatch.findOne({
        _id: new mongoose.Types.ObjectId(matchId),
        $or: [
          { userA: new mongoose.Types.ObjectId(userId) },
          { userB: new mongoose.Types.ObjectId(userId) },
        ],
        isActive: true,
      });

      if (!match) {
        console.log(`ghost:message failed - match not found`);
        socket.emit("ghost:error", { message: "Match is no longer active" });
        return;
      }

      if (!content || content.trim().length === 0) {
        socket.emit("ghost:error", { message: "Message cannot be empty" });
        return;
      }

      const room = `ghost:${matchId}`;
      const sender = userId === match.userA.toString() ? "A" : "B";

      console.log(`Broadcasting to room: ${room} sender: ${sender}`);

      io.to(room).emit("ghost:new_message", {
        matchId,
        content: content.trim(),
        sender,
        timestamp: new Date(),
      });

    } catch (err) {
      console.error("ghost:message error:", err);
      socket.emit("ghost:error", { message: "Failed to send message" });
    }
  });

  socket.on("ghost:leave", async ({ matchId }: { matchId: string }) => {
    console.log(`ghost:leave received - userId: ${userId} matchId: ${matchId}`);
    try {
      const room = `ghost:${matchId}`;
      socket.to(room).emit("ghost:partner_left", {
        message: "Your partner has left the chat",
        dissolvedAt: new Date(),
      });
      await dissolveMatch(matchId);
      socket.leave(room);
      socket.emit("ghost:dissolved", { message: "You left the ghost chat" });
    } catch (err) {
      console.error("ghost:leave error:", err);
      socket.emit("ghost:error", { message: "Failed to leave ghost chat" });
    }
  });

  socket.on("disconnect", async () => {
    console.log(`ghost disconnect cleanup - userId: ${userId}`);
    try {
      if (!userId) return;
      const match = await GhostMatch.findOne({
        $or: [
          { userA: new mongoose.Types.ObjectId(userId) },
          { userB: new mongoose.Types.ObjectId(userId) },
        ],
        isActive: true,
      });

      if (match) {
        const room = `ghost:${match._id}`;
        socket.to(room).emit("ghost:partner_left", {
          message: "Your partner disconnected",
          dissolvedAt: new Date(),
        });
        await dissolveMatch(match._id.toString());
      }
    } catch (err) {
      console.error("Ghost disconnect cleanup failed:", err);
    }
  });
};