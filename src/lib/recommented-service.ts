import { db } from "@/lib/db";
import { getSeft } from "@/lib/auth-service";

export const getRecommended = async () => {
  let userId;
  try {
    const self = await getSeft();
    userId = self.id;
  } catch (error) {
    userId = null;
  }

  let stores = [];

  if (userId) {
    stores = await db.store.findMany({
      where: {
        AND: [
          {
            followers: {
              none: {
                id: userId,
              },
            },
          },
          {
            stream: {
              isNot: null,
            },
          },
        ],
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
