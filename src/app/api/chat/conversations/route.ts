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
    const type = searchParams.get("type"); // "user" or "store"
    const storeId = searchParams.get("storeId");

    let conversations;

    if (type === "store" && storeId) {
      // Get conversations for a specific store
      conversations = await db.conversation.findMany({
        where: { storeId },
        include: {
          user: {
            include: {
              onlineStatus: true,
            },
          },
          store: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  picture: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: user.id },
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
      });
    } else {
      // Get conversations for user
      conversations = await db.conversation.findMany({
        where: { userId: user.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              picture: true,
            },
          },
          store: {
            include: {
              user: {
                select: {
                  id: true,
                  onlineStatus: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  picture: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: user.id },
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
      });

      // If no conversations, get followed stores
      if (conversations.length === 0) {
        const followedStores = await db.user.findUnique({
          where: { id: user.id },
          select: {
            following: {
              include: {
                user: {
                  select: {
                    id: true,
                    onlineStatus: true,
                  },
                },
              },
            },
          },
        });

        const storesWithConversations =
          followedStores?.following.map((store) => ({
            id: `temp-${store.id}`,
            userId: user.id,
            storeId: store.id,
            lastMessageAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              id: user.id,
              name: user.emailAddresses[0].emailAddress || "",
              picture: user.imageUrl || "",
            },
            store: {
              ...store,
              user: store.user,
            },
            messages: [],
            _count: {
              messages: 0,
            },
          })) || [];

        return NextResponse.json(storesWithConversations);
      }
    }

    return NextResponse.json(conversations);
  } catch (error) {
    console.log("[CONVERSATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
