import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  getStoreNotifications,
  getUnreadNotificationCount,
} from "@/lib/notifications";

export async function GET(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeId } = params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    // Verify user has access to this store
    const store = await db.store.findFirst({
      where: {
        id: storeId,
        userId: user.id,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found or access denied" },
        { status: 404 }
      );
    }

    const notifications = await getStoreNotifications(storeId, limit);
    const unreadCount = await getUnreadNotificationCount(storeId);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total: notifications.length,
      },
    });
  } catch (error) {
    console.error("Error fetching store notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
