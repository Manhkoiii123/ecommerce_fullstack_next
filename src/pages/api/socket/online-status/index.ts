import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { isOnline } = req.body;

    // Update or create online status
    const onlineStatus = await db.userOnlineStatus.upsert({
      where: { userId },
      update: {
        isOnline,
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        isOnline,
        lastSeenAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
    });

    // Emit to all relevant conversations
    const userConversations = await db.conversation.findMany({
      where: { userId },
      select: { id: true, storeId: true },
    });

    for (const conversation of userConversations) {
      const statusKey = `chat:${conversation.id}:status`;
      res?.socket?.server?.io?.emit(statusKey, {
        userId,
        isOnline,
        lastSeenAt: onlineStatus.lastSeenAt,
      });
    }

    return res.status(200).json(onlineStatus);
  } catch (error) {
    console.log("[ONLINE_STATUS_POST]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
