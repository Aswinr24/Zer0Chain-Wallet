import { Request, Response } from "express";
import axios from "axios";

class WalletController {
  // Ensure the return type is explicitly Promise<Response>
  static async getForwaderAddress(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { txHash } = req.body;
      const reData = await axios.get(
        `https://apiv2.dev.socket.tech/getDetailsByTxHash?txHash=${txHash}`
      );
      return res.status(200).json({
        onChainAddress: await reData.data.response[0].payloads[0]
          .deployerDetails.onChainAddress,
        forwadderAddress: await reData.data.response[0].payloads[0]
          .deployerDetails.forwarderAddress,
        chainSlug: await reData.data.response[0].payloads[0].chainSlug,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return res.status(400).json({ success: false, message: errorMessage });
    }
  }
}

export default WalletController;
