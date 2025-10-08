import { Router } from "express";   
import { getTemplates} from "../controllers/templateController";

const router = Router();
router.get("/", getTemplates);
export default router;