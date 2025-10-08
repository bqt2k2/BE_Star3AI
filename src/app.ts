import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./utils/db";
import authRoutes from "./routes/auth";
import templateRoutes from "./routes/template";
import accountsRoutes from "./routes/accounts";
import sessionRoutes from "./routes/sessionRoutes";
import scheduleRoutes from "./routes/scheduleRoutes";

import http from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// 👉 lưu client WebSocket theo userId
const clients = new Map<string, any>();

// 📢 Hàm gửi event tới client
export const notifyUser = (userId: string, data: any) => {
  const client = clients.get(userId);
  if (client && client.readyState === 1) {
    client.send(JSON.stringify(data));
  }
};

// ✅ start server
const startServer = async (PORT: number | string) => {
  try {
    await connectDB();

    // REST routes
    app.use("/api/auth", authRoutes);
    app.use("/api/templates", templateRoutes);
    app.use("/api/accounts", accountsRoutes);
    app.use("/api/sessions", sessionRoutes);
    app.use("/api/ai", scheduleRoutes);

    // 👉 tạo HTTP server
    const server = http.createServer(app);

    // 👉 WebSocket server trên cùng port
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (ws, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(1008, "Invalid or expired token"); 
        return;
      }

      try {
        // verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const userId = decoded.id;

        clients.set(userId, ws);
        console.log(`🔌 User ${userId} connected via WebSocket`);

        ws.on("close", () => {
          clients.delete(userId);
          console.log(`❌ User ${userId} disconnected`);
        });
      } catch (err) {
        console.error("❌ Invalid token", err);
        ws.close();
      }
    });

    // 🚀 listen 0.0.0.0 để emulator Android/iOS truy cập được
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
