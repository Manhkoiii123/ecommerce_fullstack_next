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

    const { content, conversationId, storeId } = req.body;

    if (!content || (!conversationId && !storeId)) {
      return res.status(400).json({
        error: "Content and conversation ID or store ID are required",
      });
    }

    let conversation;

    if (conversationId) {
      // Find existing conversation
      conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          user: true,
          store: true,
        },
      });
    } else if (storeId) {
      // Find or create conversation
      conversation = await db.conversation.findUnique({
        where: {
          userId_storeId: {
            userId: userId,
            storeId: storeId,
          },
        },
        include: {
          user: true,
          store: true,
        },
      });

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            userId: userId,
            storeId: storeId,
          },
          include: {
            user: true,
            store: true,
          },
        });
      }
    }

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Create message
    const message = await db.message.create({
      data: {
        content,
        senderId: userId,
        conversationId: conversation.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
    });

    // Update conversation last message timestamp
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Emit to conversation room
    const conversationKey = `chat:${conversation.id}:messages`;
    res?.socket?.server?.io?.emit(conversationKey, message);

    // Emit to user and store for unread count updates
    const userKey = `chat:user:${conversation.userId}:unread`;
    const storeKey = `chat:store:${conversation.storeId}:unread`;

    res?.socket?.server?.io?.emit(userKey, {
      conversationId: conversation.id,
      senderId: userId,
      message,
    });

    res?.socket?.server?.io?.emit(storeKey, {
      conversationId: conversation.id,
      senderId: userId,
      message,
    });

    return res.status(200).json({
      ...message,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.log("[MESSAGES_POST]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
