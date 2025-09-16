import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!conversationId) {
      return new NextResponse("Conversation ID is required", { status: 400 });
    }

    // Verify user has access to this conversation
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        store: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    // Check if user is either the customer or the store owner
    if (
      conversation.userId !== user.id &&
      conversation.store.userId !== user.id
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    let messages;

    if (cursor) {
      messages = await db.message.findMany({
        where: {
          conversationId,
          createdAt: { lt: new Date(cursor) },
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
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } else {
      messages = await db.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              picture: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    let nextCursor = null;
    if (messages.length === limit) {
      nextCursor = messages[messages.length - 1].createdAt;
    }

    return NextResponse.json({
      items: messages.reverse(),
      nextCursor,
    });
  } catch (error) {
    console.log("[MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { conversationId } = await req.json();

    if (!conversationId) {
      return new NextResponse("Conversation ID is required", { status: 400 });
    }

    // Mark messages as read
    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[MESSAGES_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
