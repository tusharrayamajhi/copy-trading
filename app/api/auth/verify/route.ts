import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { prisma } from "@/src/lib/prisma";
import { signToken, setSession } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { publicKey, signature, nonce } = await request.json();

    if (!publicKey || !signature || !nonce) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const message = new TextEncoder().encode(`Sign this message for authenticating with your wallet. Nonce: ${nonce}`);
    const signatureUint8 = bs58.decode(signature);
    const publicKeyUint8 = bs58.decode(publicKey);

    const isValid = nacl.sign.detached.verify(message, signatureUint8, publicKeyUint8);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Upsert user in database
    let user = await prisma.user.findUnique({
      where: { walletAddress: publicKey },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: publicKey,
          role: "INVESTOR", // default role
        },
      });
      // create investor profile
      await prisma.investorProfile.create({
        data: {
          userId: user.id
        }
      });
    }

    // Generate JWT and set cookie
    const token = await signToken({
      userId: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    });

    await setSession(token);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
