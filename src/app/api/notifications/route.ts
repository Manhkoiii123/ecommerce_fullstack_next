import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { notificationService } from "@/lib/notification-service";
import { db } from "@/lib/db";

// GET /api/notifications - Get user or store notifications
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'user' or 'store'
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (type === "store") {
      // Get store notifications for store owner
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { stores: true },
      });

      if (!user?.stores?.[0]) {
        return NextResponse.json({ error: "No store found" }, { status: 404 });
      }

      const storeId = user.stores[0].id;
      const notifications = await notificationService.getStoreNotifications(
        storeId,
        limit,
        offset
      );
      const unreadCount = await notificationService.getStoreUnreadCount(
        storeId
      );

      return NextResponse.json({
        notifications,
        unreadCount,
        total: notifications.length,
      });
    } else {
      // Get user notifications
      const notifications = await notificationService.getUserNotifications(
        userId,
        limit,
        offset
      );
      const unreadCount = await notificationService.getUnreadCount(userId);

      return NextResponse.json({
        notifications,
        unreadCount,
        total: notifications.length,
      });
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/mark-read - Mark notification as read
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll, type } = body;

    if (markAll) {
      if (type === "store") {
        const user = await db.user.findUnique({
          where: { id: userId },
          include: { stores: true },
        });

        if (!user?.stores?.[0]) {
          return NextResponse.json(
            { error: "No store found" },
            { status: 404 }
          );
        }

        await notificationService.markAllStoreNotificationsAsRead(
          user.stores[0].id
        );
      } else {
        await notificationService.markAllUserNotificationsAsRead(userId);
      }
    } else if (notificationId) {
      await notificationService.markAsRead(notificationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
