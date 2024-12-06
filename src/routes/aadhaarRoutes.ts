import express, { Request, Response, NextFunction } from "express";
import aadhaarController from "../controllers/aadhaarController";

const router = express.Router();

router.post(
  "/verify",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await aadhaarController.verify(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
