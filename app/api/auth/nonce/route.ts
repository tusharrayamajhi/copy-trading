import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  // Generate a random nonce
  const nonce = crypto.randomBytes(32).toString("base64");
  
  // You would typically store this nonce in a database or Redis mapped to an IP/session 
  // to verify it later. For simplicity here, we just return it to the client to be signed.
  return NextResponse.json({ nonce });
}
