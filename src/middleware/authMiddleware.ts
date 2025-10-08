import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; [key: string]: any };
    req.userId = decoded.id;   // ✅ gắn userId
    req.user = decoded;        // ✅ gắn full payload nếu cần
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
