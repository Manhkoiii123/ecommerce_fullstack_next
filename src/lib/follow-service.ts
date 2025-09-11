import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const getFollowedStores = async () => {
  let userId;
  try {
    const self = await currentUser();
    if (self) {
      userId = self.id;
    }
  } catch (error) {
    userId = null;
  }

  let stores = [];

  if (userId) {
    stores = await db.store.findMany({
      where: {
        followers: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        stream: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
            isLive: true,
            isChatEnabled: true,
            isChatDelayed: true,
            isChatFollowersOnly: true,
            serverUrl: true,
            streamKey: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
      },
      orderBy: [
        {
          stream: {
            isLive: "desc",
          },
        },
        {
          updatedAt: "desc",
        },
      ],
    });
  } else {
    // If no user, return all stores with streams
    stores = await db.store.findMany({
      where: {
        stream: {
          isNot: null,
        },
      },
      include: {
        stream: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
            isLive: true,
            isChatEnabled: true,
            isChatDelayed: true,
            isChatFollowersOnly: true,
            serverUrl: true,
            streamKey: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
      },
      orderBy: [
        {
          stream: {
            isLive: "desc",
          },
        },
        {
          updatedAt: "desc",
        },
      ],
    });
  }

  return stores;
};
