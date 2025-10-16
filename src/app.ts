import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./utils/db";
import http from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth";
import templateRoutes from "./routes/template";
import accountsRoutes from "./routes/accounts";
import sessionRoutes from "./routes/sessionRoutes";
import scheduleRoutes from "./routes/scheduleRoutes";
import postRoutes from "./routes/postRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Kết nối Mongo
connectDB();

// REST routes
app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/schedule", scheduleRoutes);

// 👉 tạo HTTP server để dùng chung cho cả Express + WebSocket
const server = http.createServer(app);

// 👉 lưu client WebSocket theo userId
const clients = new Map<string, any>();

// 📢 Hàm notify FE qua WS
export const notifyUser = (userId: string, data: any) => {
  const client = clients.get(userId);
  if (client && client.readyState === 1) {
    client.send(JSON.stringify(data));
  }
};

// 👉 WebSocket server
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token) {
    ws.close(1008, "Invalid or expired token");
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decoded.id;

    clients.set(userId, ws);
    console.log(`🔌 User ${userId} connected via WS`);

    ws.on("close", () => {
      clients.delete(userId);
      console.log(`❌ User ${userId} disconnected`);
    });
  } catch (err) {
    console.error("❌ Invalid token", err);
    ws.close();
  }
});

// 🚀 start server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔌 WS running at ws://localhost:${PORT}/ws`);
});

export default app;
