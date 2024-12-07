import express, { Request, Response, NextFunction } from "express";
import WalletController from "../controllers/walletController";

const Wrouter = express.Router();

Wrouter.post(
  "/getContractForwader",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await WalletController.getForwaderAddress(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default Wrouter;
