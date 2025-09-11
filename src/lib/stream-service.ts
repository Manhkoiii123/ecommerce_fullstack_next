import { db } from "@/lib/db";

export const getStreamByStoreUrl = async (storeUrl: string) => {
  const stream = await db.stream.findFirst({
    where: {
      store: {
        url: storeUrl,
      },
    },
  });
  return stream;
};
