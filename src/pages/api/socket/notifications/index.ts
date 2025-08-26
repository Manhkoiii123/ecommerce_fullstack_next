import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentUser();
    const { type, title, message, data, userId, storeId, orderId } = req.body;

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!type) {
      return res.status(400).json({ error: "Notification type missing" });
    }

    if (!title || !message) {
      return res.status(400).json({ error: "Title or message missing" });
    }

    const notification = await db.notification.create({
      data: {
        type,
        title,
        message,
        data,
        userId: userId || null,
        storeId: storeId || null,
        orderId: orderId || null,
      },
      include: {
        user: true,
        store: true,
        order: true,
      },
    });

    let channelKey: string | null = null;

    if (userId) {
      channelKey = `notifications:user:${userId}`;
    } else if (storeId) {
      channelKey = `notifications:store:${storeId}`;
    } else if (orderId) {
      channelKey = `notifications:order:${orderId}`;
    } else {
      channelKey = `notifications:system`;
    }

    if (channelKey) {
      res?.socket?.server?.io?.emit(channelKey, notification);
    }

    return res.status(200).json(notification);
  } catch (error) {
    console.log("[NOTIFICATIONS_POST]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
