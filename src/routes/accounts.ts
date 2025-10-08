import express from "express";
import { listAccounts, createAccount, unlinkAccount } from "../controllers/accountsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, listAccounts);
router.post("/", authMiddleware, createAccount);
router.delete("/:id", authMiddleware, unlinkAccount);

export default router;
