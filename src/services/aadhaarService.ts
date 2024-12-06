import {
  verify,
  init,
  artifactUrls,
  ArtifactsOrigin,
  InitArgs,
  AnonAadhaarCore,
  productionPublicKeyHash,
} from "@anon-aadhaar/core";

// Initialize the library
const initAnonAadhaar = async () => {
  const anonAadhaarInitArgs: InitArgs = {
    wasmURL: artifactUrls.v2.wasm,
    zkeyURL: artifactUrls.v2.zkey,
    vkeyURL: artifactUrls.v2.vk,
    artifactsOrigin: ArtifactsOrigin.server,
  };

  // Initialize the core library
  await init(anonAadhaarInitArgs);
};

// Verify Aadhaar proof
class AadhaarService {
  static async verify(anonAadhaarProof: AnonAadhaarCore) {
    // Ensure the SDK is initialized
    await initAnonAadhaar();

    // First, verify the proof (Groth16 proof and public signals)
    const isValidProof = await verify(anonAadhaarProof);
    if (!isValidProof) {
      throw new Error(
        "[verifyAnonAadhaarProof]: Your proof is not a valid proof."
      );
    }

    // Verify the proof was signed with the official UIDAI public key
    if (productionPublicKeyHash !== anonAadhaarProof.proof.pubkeyHash) {
      throw new Error(
        "[verifyAnonAadhaarProof]: The document was not signed with the Indian government public key."
      );
    }

    // Ensure the proof was signed less than 1 hour ago
    if (
      Math.floor(Date.now() / 1000) -
        Number(anonAadhaarProof.proof.timestamp) >=
      3600
    ) {
      throw new Error(
        "[verifyAnonAadhaarProof]: Your QR must have been signed less than 1 hour ago."
      );
    }

    // Verify that the nullifier seed is valid
    if (
      anonAadhaarProof.proof.nullifierSeed !==
      process.env.NEXT_PUBLIC_NULLIFIER_SEED!
    ) {
      throw new Error(
        "[verifyAnonAadhaarProof]: Your proof must be generated from an authorized frontend."
      );
    }

    // Verify that the user is over 18 years old
    if (anonAadhaarProof.proof.ageAbove18 !== "1") {
      throw new Error(
        "[verifyAnonAadhaarProof]: You must be over 18 to access this service."
      );
    }

    // If all checks pass, return true
    return true;
  }
}

export default AadhaarService;
