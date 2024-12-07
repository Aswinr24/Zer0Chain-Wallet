import { Request, Response } from "express";
import axios from "axios";
import { createPublicClient, http, parseAbi } from "viem";
const contractAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "name_",
        type: "string",
        internalType: "string",
      },
      {
        name: "symbol_",
        type: "string",
        internalType: "string",
      },
      {
        name: "decimals_",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "DOMAIN_SEPARATOR",
    inputs: [],
    outputs: [
      {
        name: "result",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "_SOCKET",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "spender",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "result",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      {
        name: "spender",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "result",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "burn",
    inputs: [
      {
        name: "amount_",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "mint",
    inputs: [
      {
        name: "to_",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount_",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nonces",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "result",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "permit",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "spender",
        type: "address",
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "deadline",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "v",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "r",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "s",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [
      {
        name: "result",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      {
        name: "from",
        type: "address",
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "spender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "AllowanceOverflow",
    inputs: [],
  },
  {
    type: "error",
    name: "AllowanceUnderflow",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientAllowance",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidPermit",
    inputs: [],
  },
  {
    type: "error",
    name: "NotSOCKET",
    inputs: [],
  },
  {
    type: "error",
    name: "Permit2AllowanceIsFixedAtInfinity",
    inputs: [],
  },
  {
    type: "error",
    name: "PermitExpired",
    inputs: [],
  },
  {
    type: "error",
    name: "TotalSupplyOverflow",
    inputs: [],
  },
];
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
      const onChainAddress = await reData.data.response[0].payloads[0]
        .deployerDetails.onChainAddress;
      const forwadderAddress = await reData.data.response[0].payloads[0]
        .deployerDetails.forwarderAddress;
      const chainSlug = await reData.data.response[0].payloads[0].chainSlug;
      689774;

      const customChain = {
        id: 7625382, // Replace with your chain ID
        name: "offchainVM",
        network: "offchainVM",
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: ["https://rpc-socket-composer-testnet.t.conduit.xyz"],
          }, // Replace with your RPC URL
        },
      };

      const client = createPublicClient({
        chain: customChain,
        transport: http(customChain.rpcUrls.default.http[0]),
      });

      const contractAddress = "0x4511Ad2A72C2d17023A24b2b8957F9F26a4054B9";

      async function readFromContract() {
        try {
          // Call the contract function
          const result = await client.readContract({
            address: contractAddress as `0x${string}`,
            abi: contractAbi,
            functionName: "mint", // Replace with your function name
            args: ["0xE4F653Fb92ca2C55A309d0EDA4a19884F4a24133", 2], // Replace with the actual arguments
          });

          console.log("Contract read result:", await result);
        } catch (error) {
          console.error("Error reading from contract:", await error);
        }
      }

      readFromContract();

      return res.status(200).json({
        onChainAddress: onChainAddress,
        forwadderAddress: forwadderAddress,
        chainSlug: chainSlug,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return res.status(400).json({ success: false, message: errorMessage });
    }
  }
}

export default WalletController;
