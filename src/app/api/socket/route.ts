import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// This route is for socket.io connection handling
// The actual socket server is initialized in the main server file
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Socket.io endpoint" });
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, storeId } = body;

    if (action === "get-user-info") {
      // Get user info for socket authentication
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { stores: true },
      });

      return NextResponse.json({
        userId: user?.id,
        storeId: user?.stores?.[0]?.id || null,
        role: user?.role,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Socket route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
