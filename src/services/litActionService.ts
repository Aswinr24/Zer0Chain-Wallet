import axios from "axios";
import { ethers } from "ethers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK, LIT_ABILITY, LIT_RPC } from "@lit-protocol/constants";
import {
  LitActionResource,
  LitPKPResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { litActionCode } from "./litAction";
import { getEnv } from "./utils";
interface TriggerLitActionParams {
  unsignedTransaction: string;
  toSign: string;
  address: string;
  publicKey: string;
  sigName: string;
  wallet: WalletData;
}
import { Wallet, WalletData, PayloadSignature } from "@coinbase/coinbase-sdk";

export const triggerLitAction = async ({
  unsignedTransaction,
  address,
  wallet,
}: TriggerLitActionParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Step 1: Trigger Lit Protocol to sign
    const litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.DatilTest,
    });
    await litNodeClient.connect();

    console.log("✅ Connected to Lit network");

    try {
      const importedWallet = await Wallet.import(wallet as WalletData);
    } catch (error) {
      console.error("Error importing wallet:", error);
    }

    const importedWallet = await Wallet.import(wallet as WalletData);
    // Custom auth signature generation function
    const generateAuthSig = async ({
      importedWallet,
      toSign,
    }: {
      importedWallet: Wallet;
      toSign: string;
    }) => {
      try {
        console.log(importedWallet, wallet);
        let payloadSignature: PayloadSignature =
          await importedWallet.createPayloadSignature("hello");
        console.log(payloadSignature);
        payloadSignature = await payloadSignature.wait();
        const signature = payloadSignature;
        return {
          sig: signature as any,
          address: address as string,
          derivedVia: "web3.eth.personal.sign",
          signedMessage: toSign as string,
        };
      } catch (error) {
        console.error("Error generating auth signature:", error);
        throw error;
      }
    };

    console.log("🔄 Getting Session Signatures...");
    const sessionSigs = await litNodeClient.getSessionSigs({
      chain: "ethereum",
      expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
      resourceAbilityRequests: [
        {
          resource: new LitPKPResource("*"),
          ability: LIT_ABILITY.PKPSigning,
        },
        {
          resource: new LitActionResource("*"),
          ability: LIT_ABILITY.LitActionExecution,
        },
      ],
      authNeededCallback: async ({
        resourceAbilityRequests,
        expiration,
        uri,
      }) => {
        const toSign = await createSiweMessageWithRecaps({
          uri: uri!,
          expiration: expiration!,
          resources: resourceAbilityRequests!,
          walletAddress: address,
          nonce: await litNodeClient.getLatestBlockhash(),
          litNodeClient,
        });
        console.log(toSign);

        return await generateAuthSig({
          importedWallet,
          toSign,
        });
      },
    });
    console.log("✅ Got Session Signatures");

    console.log("🔄 Executing Lit Action...");
    const message = new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode("Hello world")
      )
    );
    const litActionSignatures = await litNodeClient.executeJs({
      sessionSigs,
      code: litActionCode,
      jsParams: {
        toSign: message,
        publicKey: address,
        sigName: "sig",
      },
    });
    console.log("✅ Executed Lit Action");

    const pythonApiUrl = "http://localhost:5000/sign_transaction";
    const pythonResponse = await axios.post(pythonApiUrl, {
      litActionSignatures,
    });

    if (pythonResponse.data.success) {
      const signedTx = pythonResponse.data.signedTx;

      // Step 3: Send the signed transaction to the Ethereum network
      const provider = new ethers.providers.JsonRpcProvider(
        LIT_RPC.LOCAL_ANVIL
      );
      const transactionReceipt = await provider.sendTransaction(signedTx);

      return {
        success: true,
        message: `Transaction Sent. Hash: ${transactionReceipt.hash}`,
      };
    } else {
      return {
        success: false,
        message: "Failed to sign transaction in Python API",
      };
    }
  } catch (error: any) {
    console.error("Error in triggerLitAction:", error.message);
    return { success: false, message: "Error triggering Lit action" };
  }
};
