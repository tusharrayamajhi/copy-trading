import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const profiles = await prisma.traderProfile.findMany({
      select: {
        name: true,
        avatarUrl: true,
        bio: true,
        user: {
          select: {
            walletAddress: true
          }
        }
      }
    });

    // Convert to a map for easy lookup
    const profileMap: Record<string, any> = {};
    profiles.forEach((p) => {
      profileMap[p.user.walletAddress] = {
        name: p.name,
        avatarUrl: p.avatarUrl,
        bio: p.bio
      };
    });

    return NextResponse.json(profileMap);
  } catch (error) {
    console.error("Fetch Profiles Map Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
