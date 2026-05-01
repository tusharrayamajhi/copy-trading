// import { PublicKey } from "@solana/web3.js";

// // 1. Program & Admin
// export const PROGRAM_ID = new PublicKey("HZLEWKHxsPotKRUzrcNeSymVSnWeZYJw1MKycrr3ZRU7");
// export const PLATFORM_FEE_RECIPIENT = new PublicKey("AT5cVfYLu9oBa1xu5FNPw6eQuiNZ99Jj1vjxcjRmpePH");

// // 2. Mints
// export const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
// export const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

// // 3. ✅ ADDED: Platform Config PDA (Derived from ["platform_config"])
// export const PLATFORM_CONFIG_PDA = new PublicKey("mcov9MZ84aaiVZhiZCS7kJzd4zCL7y3oCkwFWzbtLGL");

// // 4. ✅ ADDED: Bank Accounts (The addresses you just funded)
// export const PLATFORM_BANK_SOL = new PublicKey("H7QAM2ERA5UvpTNWJ6jVRcinFayz9H7ssHVBZQxchxJr");
// export const PLATFORM_BANK_USDC = new PublicKey("HjyLW2Cs3RsnWNtwhPQRRBf4FLz6W8V9vLSZJZXKLeHT");

// // 5. Pyth Devnet Price Accounts
// // ✅ MUST BE THESE TWO FOR DEVNET
// // export const PYTH_SOL_USD = new PublicKey("J83w4HKm7baWhr3cnMvTf1zb6sq7WLA9K9R9NvX4E2X5");
// // export const PYTH_USDC_USD = new PublicKey("5SSkXsEKQepTZeeDW9oZ2Z87fD3BthJpqc7wL8u5S5ZJ");
// export const PYTH_SOL_USD = new PublicKey("7UVim1fVbmgyZ99A6f1mEAnS2XN7K9MrcpAnX2v3Y9rK");
// export const PYTH_USDC_USD = new PublicKey("D6q6zUN3Yf7pM8ScyYkb7YpGvT8S6G68pYpZ5Spx5Ld7");


import { PublicKey } from "@solana/web3.js";

// 1. Program & Admin
export const PROGRAM_ID = new PublicKey("AGNFafmkeBehcYJvKBzG1VYRzXEbfHeLYmKP7atSGB57");
export const PLATFORM_FEE_RECIPIENT = new PublicKey("AT5cVfYLu9oBa1xu5FNPw6eQuiNZ99Jj1vjxcjRmpePH");

// 2. Mints
export const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

// 3. Platform Config PDA
export const PLATFORM_CONFIG_PDA = new PublicKey("mcov9MZ84aaiVZhiZCS7kJzd4zCL7y3oCkwFWzbtLGL");

// 4. Bank Accounts
export const PLATFORM_BANK_SOL = new PublicKey("4dgh4vRX1VDUgSpGFdM4W5s8DXNmUy5YwdUhD2HHFKEg");
export const PLATFORM_BANK_USDC = new PublicKey("ygmA9QQzTNkTy1h7vDj4A83cMh792DXKJ2dxU44newr");

// 5. ✅ WORKING: Pyth Devnet Legacy Push Price Accounts
// These match the IDs in your lib.rs and work with the current pyth-sdk-solana crate.
export const PYTH_SOL_USD = new PublicKey("J83w4HKm7baWhr3cnMvTf1zb6sq7WLA9K9R9NvX4E2X5");
export const PYTH_USDC_USD = new PublicKey("5SSkXsEKQepTZeeDW9oZ2Z87fD3BthJpqc7wL8u5S5ZJ");

// 6. ⚠️ PULL ORACLE IDS (Future Use)
// These are for the new Receiver model (rec5EKMG...) which requires a different Rust SDK.
// export const PYTH_SOL_USD_PULL = new PublicKey("7UVim1fVbmgyZ99A6f1mEAnS2XN7K9MrcpAnX2v3Y9rK");
// export const PYTH_USDC_USD_PULL = new PublicKey("D6q6zUN3Yf7pM8ScyYkb7YpGvT8S6G68pYpZ5Spx5Ld7");
// export const SOL_USD_FEED_ID = "0xef0d8b6fda2ce3b2ef13300f3cf3c299172044F2BA3001C15FE98BA850122979";
// export const USDC_USD_FEED_ID = "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";