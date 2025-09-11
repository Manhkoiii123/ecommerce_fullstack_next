// import { getSeft } from "@/lib/auth-service";
import { db } from "@/lib/db";

export const getStreams = async () => {
  // let userId;
  // try {
  //   const self = await getSeft();
  //   userId = self.id;
  // } catch (error) {
  //   userId = null;
  // }

  // Fetch all streams with store information
  const streams = await db.stream.findMany({
    select: {
      id: true,
      name: true,
      thumbnailUrl: true,
      isLive: true,
      // isChatEnabled: true,
      // isChatDelayed: true,
      // isChatFollowersOnly: true,
      // serverUrl: true,
      // streamKey: true,
      // createdAt: true,
      // updatedAt: true,
      store: true,
    },
    orderBy: [
      {
        isLive: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });

  return streams;
};
