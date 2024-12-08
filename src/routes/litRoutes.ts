import { Router } from "express";
import { triggerLitActionController } from "../controllers/litActionController";

const router = Router();

router.post("/trigger-lit-action", triggerLitActionController);

export default router;
