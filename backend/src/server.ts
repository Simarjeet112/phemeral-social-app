import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import testRoutes from "./routes/test.routes";
import dropRoutes from "./routes/drop.routes";
import roomRoutes from "./routes/room.routes";
import signalRoutes from "./routes/signal.routes";
import safetyRoutes from "./routes/safety.routes";
import ghostRoutes from "./routes/ghost.routes";
import aiRoutes from "./routes/ai.routes";
import circleRoutes from "./routes/circle.routes";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://192.168.1.2:3000",
    "http://frontend:3000",        // ← Docker internal container name
    process.env.FRONTEND_URL || "" // ← for production domain
  ],
  credentials: true,
}));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/drops", dropRoutes);
app.use("/api/drops", roomRoutes);
app.use("/api/signals", signalRoutes);
app.use("/api/safety", safetyRoutes);
app.use("/api/ghost", ghostRoutes);
app.use("/api/ai", aiRoutes);
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
app.use("/api/circles", circleRoutes);

export default app;