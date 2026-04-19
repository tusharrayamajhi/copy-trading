import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

// src/lib/ata.ts
export function getATA(mint: PublicKey, owner: PublicKey, allowOwnerOffCurve = false): PublicKey {
    const splToken = require("@solana/spl-token");
    if (typeof splToken.getAssociatedTokenAddressSync === "function")
        return splToken.getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve);
    // Manual fallback — identical math, zero dependencies:
    const [address] = PublicKey.findProgramAddressSync(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return address;
}