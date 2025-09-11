"use server";

import { getSeft } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { Stream } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const updateStream = async (
  storeUrl: string,
  values: Partial<Stream>
) => {
  try {
    const self = await getSeft();

    // Find the store by storeUrl and verify ownership
    const store = await db.store.findFirst({
      where: {
        url: storeUrl,
        userId: self.id, // Verify the user owns this store
      },
    });

    if (!store) {
      throw new Error("Store not found or unauthorized");
    }

    // Find the stream associated with the store
    const selfStream = await db.stream.findUnique({
      where: {
        storeId: store.id,
      },
    });

    if (!selfStream) {
      throw new Error("Stream not found");
    }

    // Validate and prepare data for update
    const validData: Partial<Stream> = {};

    // Only include fields that are provided and valid
    if (values.name !== undefined) {
      validData.name = values.name;
    }
    if (values.thumbnailUrl !== undefined) {
      validData.thumbnailUrl = values.thumbnailUrl;
    }
    if (values.ingressId !== undefined) {
      validData.ingressId = values.ingressId;
    }
    if (values.serverUrl !== undefined) {
      validData.serverUrl = values.serverUrl;
    }
    if (values.streamKey !== undefined) {
      validData.streamKey = values.streamKey;
    }
    if (values.isLive !== undefined) {
      validData.isLive = values.isLive;
    }
    if (values.isChatEnabled !== undefined) {
      validData.isChatEnabled = values.isChatEnabled;
    }
    if (values.isChatDelayed !== undefined) {
      validData.isChatDelayed = values.isChatDelayed;
    }
    if (values.isChatFollowersOnly !== undefined) {
      validData.isChatFollowersOnly = values.isChatFollowersOnly;
    }

    // Update the stream
    const stream = await db.stream.update({
      where: {
        id: selfStream.id,
      },
      data: validData,
    });

    // Revalidate relevant paths
    revalidatePath(`/u/${store.url}`);
    revalidatePath(`/${store.url}`);
    revalidatePath(`/live`);

    return stream;
  } catch (error) {
    console.error("Error updating stream:", error);
    throw new Error("Internal error");
  }
};
