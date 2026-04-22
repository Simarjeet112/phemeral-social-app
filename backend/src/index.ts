import { createServer } from "http";
import app from "./server";
import { connectDB } from "./config/db";
import { Server } from "socket.io";
import { initSocket } from "./sockets";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://192.168.1.2:3000",
      "https://phemeral-social-app-1.onrender.com",
      process.env.FRONTEND_URL || ""
    ],
    credentials: true,
  }
});

initSocket(io);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("❌ Failed to connect to MongoDB:", err);
  process.exit(1);
});
