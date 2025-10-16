import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        // kiểm tra user tồn tại
        const exist = await User.findOne({ email });
        if (exist) return res.status(400).json({ message: "Email already used" });

        // mã hóa mật khẩu
        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({ username, email, password: hashed });
        res.status(201).json({ message: "User created", userId: user._id });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const accessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET!,
            { expiresIn: "60m" }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: "7d" }
        );

        return res.json({
            accessToken,
            refreshToken,
            user: { id: user._id, email: user.email, username: user.username }
        });
    } catch (err) {
        console.error("❌ Login error:", err); // log chi tiết lỗi
        res.status(500).json({ message: "Server error", error: err });
    }
};


export const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
        const accessToken = jwt.sign(
            { id: (decoded as any).id },
            process.env.JWT_SECRET!,
            { expiresIn: "60m" }
        );
        return res.json({ accessToken });
    } catch (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
};
