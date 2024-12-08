import { Request, Response } from "express";
import { triggerLitAction } from "../services/litActionService";

export const triggerLitActionController = async (
  req: Request,
  res: Response
) => {
  try {
    const { unsignedTransaction, toSign, wallet, address, publicKey, sigName } =
      req.body;

    const result = await triggerLitAction({
      unsignedTransaction,
      toSign,
      wallet,
      address,
      publicKey,
      sigName,
    });

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Error in triggerLitActionController:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
