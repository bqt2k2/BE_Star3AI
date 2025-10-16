import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

import { connectDB } from "../utils/db";
import authRoutes from "../routes/auth";
import templateRoutes from "../routes/template";
import accountsRoutes from "../routes/accounts";
import sessionRoutes from "../routes/sessionRoutes";
import scheduleRoutes from "../routes/scheduleRoutes";
import postRoutes from "../routes/postRoutes";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// 🧠 Lưu danh sách client WebSocket theo userId
const clients = new Map<string, any>();

/**
 * 📢 Gửi event qua WS tới user cụ thể
 */
export const notifyUser = (userId: string, data: any) => {
  const client = clients.get(userId);
  if (client && client.readyState === 1) {
    client.send(JSON.stringify(data));
  } else {
    console.log(`⚠️ User ${userId} not connected, cannot notify`);
  }
};

/**
 * 🚀 Khởi động server
 */
const startServer = async (PORT: number | string) => {
  try {
    await connectDB();

    // REST routes
    app.use("/api/auth", authRoutes);
    app.use("/api/templates", templateRoutes);
    app.use("/api/accounts", accountsRoutes);
    app.use("/api/sessions", sessionRoutes);
    app.use("/api/schedule", scheduleRoutes);
    app.use("/api/posts", postRoutes);

    // 👉 HTTP server
    const server = http.createServer(app);

    // 👉 WebSocket server chạy cùng port
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (ws, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(1008, "Missing token");
        return;
      }

      try {
        // ✅ Xác thực JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const userId = decoded.id;

        clients.set(userId, ws);
        console.log(`🔌 User ${userId} connected via WebSocket`);

        ws.on("close", () => {
          clients.delete(userId);
          console.log(`❌ User ${userId} disconnected`);
        });
      } catch (err) {
        console.error("❌ Invalid token:", err);
        ws.close();
      }
    });

    // 🔥 Lắng nghe
    server.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🔌 WebSocket running at ws://localhost:${PORT}/ws`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer(PORT);

export default app; // ✅ export để import vào test hoặc controller nếu cần
