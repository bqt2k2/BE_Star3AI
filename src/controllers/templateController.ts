import { Request, Response } from "express";
import Template from "../models/Template";

// GET /api/templates
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await Template.find();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};