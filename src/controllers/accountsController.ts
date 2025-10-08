// src/controllers/accountsController.ts
import { Response } from "express";
import Account from "../models/Accounts";
import { AuthRequest } from "../middleware/authMiddleware";

// GET /api/accounts -> list all accounts
export const listAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const accounts = await Account.find({ user: userId, isActive: true })
      .populate("parentAccount", "name providerId")
      .select("-__v")
      .lean();

    return res.json(accounts);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// GET /api/accounts/tree -> list theo dạng cây (profile -> pages)
export const listAccountsTree = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const profiles = await Account.find({
      user: userId,
      type: "profile",
      isActive: true,
    }).lean();

    const pages = await Account.find({
      user: userId,
      type: "page",
      isActive: true,
    }).lean();

    const tree = profiles.map((profile) => ({
      ...profile,
      pages: pages.filter(
        (page) => page.parentAccount?.toString() === profile._id.toString()
      ),
    }));

    return res.json(tree);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// POST /api/accounts -> tạo mới
export const createAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { provider, providerId, name, username, avatar, type, parentAccount } =
      req.body;

    if (!provider || !providerId || !type || !name) {
      return res
        .status(400)
        .json({ message: "provider, providerId, type, name are required" });
    }

    const doc = new Account({
      user: userId,
      provider,
      providerId,
      name,
      username,
      avatar,
      type,
      parentAccount,
    });

    await doc.save();
    return res.status(201).json(doc);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Account already exists" });
    }
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// DELETE /api/accounts/:id -> unlink
export const unlinkAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = req.params.id;
    const acc = await Account.findOne({ _id: id, user: userId });
    if (!acc) return res.status(404).json({ message: "Not found" });

    acc.isActive = false;
    await acc.save();
    return res.json({ message: "Unlinked" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};
