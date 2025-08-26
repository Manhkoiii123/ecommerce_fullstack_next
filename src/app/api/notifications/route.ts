import { NextResponse } from "next/server";
import { Notification } from "@prisma/client";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

const NOTIFICATIONS_BATCH = 3;

export async function GET(req: Request) {
  try {
    const profile = await currentUser();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const userId = searchParams.get("userId");
    const storeUrl = searchParams.get("storeUrl");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let where: any = {};

    if (userId) {
      where.userId = userId;
    } else if (storeUrl) {
      const store = await db.store.findUnique({
        where: { url: storeUrl },
      });

      if (!store) {
        return new NextResponse("Store not found", { status: 404 });
      }

      where.storeId = store.id;
    } else {
      return new NextResponse("Missing userId or storeUrl", { status: 400 });
    }

    let notifications: Notification[] = [];

    if (cursor) {
      notifications = await db.notification.findMany({
        take: NOTIFICATIONS_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where,
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      notifications = await db.notification.findMany({
        take: NOTIFICATIONS_BATCH,
        where,
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    let nextCursor = null;

    if (notifications.length === NOTIFICATIONS_BATCH) {
      nextCursor = notifications[NOTIFICATIONS_BATCH - 1].id;
    }

    return NextResponse.json({
      items: notifications,
      nextCursor,
    });
  } catch (error) {
    console.log("[NOTIFICATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
