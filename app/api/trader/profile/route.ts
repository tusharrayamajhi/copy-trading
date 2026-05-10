import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user and their profile, or create it if missing
    let user = await prisma.user.findUnique({
      where: { walletAddress: session.walletAddress },
      include: { traderProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress: session.walletAddress },
        include: { traderProfile: true },
      });
    }

    let traderProfile = user.traderProfile;

    if (!traderProfile) {
      traderProfile = await prisma.traderProfile.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json(traderProfile);
  } catch (error) {
    console.error("Fetch Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, bio, avatarUrl } = await req.json();

    const user = await prisma.user.findUnique({
      where: { walletAddress: session.walletAddress },
      include: { traderProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedProfile = await prisma.traderProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name,
        bio,
        avatarUrl,
      },
      update: {
        name: name !== undefined ? name : undefined,
        bio: bio !== undefined ? bio : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
