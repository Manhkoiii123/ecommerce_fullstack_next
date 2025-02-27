"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { OfferTag } from "@prisma/client";

export const getAllOfferTags = async (storeUrl?: string) => {
  let storeId: string | undefined;

  if (storeUrl) {
    const store = await db.store.findUnique({
      where: { url: storeUrl },
    });

    if (!store) {
      return [];
    }

    storeId = store.id;
  }

  const offerTgas = await db.offerTag.findMany({
    where: storeId
      ? {
          products: {
            some: {
              storeId: storeId,
            },
          },
        }
      : {},
    include: {
      products: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      products: {
        _count: "desc",
      },
    },
  });
  return offerTgas;
};

export const upsertOfferTag = async (offerTag: OfferTag) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "ADMIN")
      throw new Error(
        "Unauthorized Access: Admin Privileges Required for Entry."
      );

    if (!offerTag) throw new Error("Please provide offer tag data.");

    const existingOfferTag = await db.offerTag.findFirst({
      where: {
        AND: [
          {
            OR: [{ name: offerTag.name }, { url: offerTag.url }],
          },
          {
            NOT: {
              id: offerTag.id,
            },
          },
        ],
      },
    });

    if (existingOfferTag) {
      let errorMessage = "";
      if (existingOfferTag.name === offerTag.name) {
        errorMessage = "An offer tag with the same name already exists";
      } else if (existingOfferTag.url === offerTag.url) {
        errorMessage = "An offer tag with the same URL already exists";
      }
      throw new Error(errorMessage);
    }

    const offerTagDetails = await db.offerTag.upsert({
      where: {
        id: offerTag.id,
      },
      update: offerTag,
      create: offerTag,
    });
    return offerTagDetails;
  } catch (error) {
    throw error;
  }
};

export const getOfferTag = async (offerTagId: string) => {
  if (!offerTagId) throw new Error("Please provide offer tag ID.");

  const offerTag = await db.offerTag.findUnique({
    where: {
      id: offerTagId,
    },
  });

  return offerTag;
};

export const deleteOfferTag = async (offerTagId: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "ADMIN")
      throw new Error(
        "Unauthorized Access: Admin Privileges Required for Entry."
      );

    if (!offerTagId) throw new Error("Please provide the offer tag ID.");

    const response = await db.offerTag.delete({
      where: {
        id: offerTagId,
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};
