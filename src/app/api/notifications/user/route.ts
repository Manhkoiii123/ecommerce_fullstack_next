import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  getUserNotifications,
  getUserUnreadNotificationCount,
} from "@/lib/notifications";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const notifications = await getUserNotifications(user.id, limit);
    const unreadCount = await getUserUnreadNotificationCount(user.id);

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
    console.error("Error fetching user notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
