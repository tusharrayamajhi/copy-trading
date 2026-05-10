import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const traderProfile = await prisma.traderProfile.findFirst({
      where: { user: { walletAddress: address } },
      select: {
        name: true,
        bio: true,
        avatarUrl: true,
      }
    });

    return NextResponse.json(traderProfile || {});
  } catch (error) {
    console.error("Public Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
