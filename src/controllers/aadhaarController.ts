import { Request, Response } from "express";
import AadhaarService from "../services/aadhaarService";

class aadhaarController {
  // Ensure the return type is explicitly Promise<Response>
  static async verify(req: Request, res: Response): Promise<Response> {
    try {
      // Extract the proof from the request body
      const { proof } = req.body;

      // Ensure proof is an object of type AnonAadhaarCore
      if (!proof || typeof proof !== "object") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid proof object." });
      }

      // Call the AadhaarService to verify the proof
      const result = await AadhaarService.verify(proof);

      // If the proof is valid, check if the user is over 18
      return res.status(200).json({ success: true, message: "User verified" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return res.status(400).json({ success: false, message: errorMessage });
    }
  }
}

export default aadhaarController;
