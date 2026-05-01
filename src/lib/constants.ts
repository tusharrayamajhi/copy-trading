import { PublicKey } from "@solana/web3.js";

export const PLATFORM_FEE_RECIPIENT = new PublicKey("6CS7E4yZQff1L23zgQ3xBNeAMQ8KyVtavYwTL27Jn19m");

// 2. Mints (Stay the same)
export const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");



export const PROGRAM_ID = new PublicKey("AGNFafmkeBehcYJvKBzG1VYRzXEbfHeLYmKP7atSGB57");

// The NEW v2 Config PDA
export const PLATFORM_CONFIG_PDA = new PublicKey("6YPa4Pe1dWuY4JbnUpc1YAKtQw62aPfq9XnyoV9CGjyJ");

// The NEW Bank Accounts for the v2 PDA
export const PLATFORM_BANK_SOL = new PublicKey("7srYNsuaz1GDzm4RsrkqRd8AbqVh288Kr8u4EjDxbthz");
export const PLATFORM_BANK_USDC = new PublicKey("J3oCbBq5ddTVnxB4UT73sL949jVQ8y6TaUECmDyPvsXh");