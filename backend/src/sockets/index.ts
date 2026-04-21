import { Server } from "socket.io";
import { registerRoomEvents } from "./room.socket";
import { registerGhostSocket } from "./ghost.socket";
import { registerCircleSocket } from "./circle.socket";
import jwt from "jsonwebtoken";

export const initSocket = (io: Server): void => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("No token"));
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.userId = payload.userId;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} userId: ${socket.data.userId}`);
    registerRoomEvents(io, socket);
    registerGhostSocket(io, socket);
    registerCircleSocket(io, socket);
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};