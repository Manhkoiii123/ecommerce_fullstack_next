"use server";

import { db } from "@/lib/db";
import { StoreDefaultShippingType, StoreStatus, StoreType } from "@/lib/types";
import { checkIfUserFollowingStore } from "@/queries/product";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { ShippingRate, Store } from "@prisma/client";

export const upsertStore = async (store: Partial<Store>) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthenticated.");
    if (!store) throw new Error("Please provide store data.");
    const existingStore = await db.store.findFirst({
      where: {
        AND: [
          {
            OR: [
              { name: store.name },
              { email: store.email },
              { phone: store.phone },
              { url: store.url },
            ],
          },
          {
            NOT: {
              id: store.id,
            },
          },
        ],
      },
    });
    if (existingStore) {
      let errorMessage = "";
      if (existingStore.name === store.name) {
        errorMessage = "A store with the same name already exists";
      } else if (existingStore.email === store.email) {
        errorMessage = "A store with the same email already exists";
      } else if (existingStore.phone === store.phone) {
        errorMessage = "A store with the same phone number already exists";
      } else if (existingStore.url === store.url) {
        errorMessage = "A store with the same URL already exists";
      }
      throw new Error(errorMessage);
    }
    const storeDetails = await db.store.upsert({
      where: {
        id: store.id,
      },
      update: store,
      //@ts-ignore
      create: {
        ...store,
        user: {
          connect: { id: user.id },
        },
      },
    });

    return storeDetails;
  } catch (error) {
    throw error;
  }
};

export const getStoreDefaultShippingDetails = async (storeUrl: string) => {
  try {
    if (!storeUrl) throw new Error("Store URL is required.");

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
      select: {
        defaultShippingService: true,
        defaultShippingFeePerItem: true,
        defaultShippingFeeForAdditionalItem: true,
        defaultShippingFeePerKg: true,
        defaultShippingFeeFixed: true,
        defaultDeliveryTimeMin: true,
        defaultDeliveryTimeMax: true,
        returnPolicy: true,
      },
    });

    if (!store) throw new Error("Store not found.");

    return store;
  } catch (error) {
    throw error;
  }
};

export const updateStoreDefaultShippingDetails = async (
  storeUrl: string,
  details: StoreDefaultShippingType
) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    if (!storeUrl) throw new Error("Store URL is required.");

    if (!details) {
      throw new Error("No shipping details provided to update.");
    }
    const check_ownership = await db.store.findUnique({
      where: {
        url: storeUrl,
        userId: user.id,
      },
    });

    if (!check_ownership)
      throw new Error(
        "Make sure you have the permissions to update this store"
      );

    const updatedStore = await db.store.update({
      where: {
        url: storeUrl,
        userId: user.id,
      },
      data: details,
    });

    return updatedStore;
  } catch (error) {
    throw error;
  }
};

export const getStoreShippingRates = async (storeUrl: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    if (!storeUrl) throw new Error("Store URL is required.");

    const check_ownership = await db.store.findUnique({
      where: {
        url: storeUrl,
        userId: user.id,
      },
    });

    if (!check_ownership)
      throw new Error(
        "Make sure you have the permissions to update this store"
      );

    const store = await db.store.findUnique({
      where: { url: storeUrl, userId: user.id },
    });

    if (!store) throw new Error("Store could not be found.");

    const countries = await db.country.findMany({
      orderBy: {
        name: "asc",
      },
    });

    const shippingRates = await db.shippingRate.findMany({
      where: {
        storeId: store.id,
      },
    });

    const rateMap = new Map();
    shippingRates.forEach((rate) => {
      rateMap.set(rate.countryId, rate);
    });

    const result = countries.map((country) => ({
      countryId: country.id,
      countryName: country.name,
      shippingRate: rateMap.get(country.id) || null,
    }));

    return result;
  } catch (error) {
    throw error;
  }
};

export const upsertShippingRate = async (
  storeUrl: string,
  shippingRate: ShippingRate
) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    const check_ownership = await db.store.findUnique({
      where: {
        url: storeUrl,
        userId: user.id,
      },
    });

    if (!check_ownership)
      throw new Error(
        "Make sure you have the permissions to update this store"
      );

    if (!shippingRate) throw new Error("Please provide shipping rate data.");

    if (!shippingRate.countryId)
      throw new Error("Please provide a valid country ID.");
    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
        userId: user.id,
      },
    });
    if (!store) throw new Error("Please provide a valid store URL.");

    const shippingRateDetails = await db.shippingRate.upsert({
      where: {
        id: shippingRate.id,
      },
      update: { ...shippingRate, storeId: store.id },
      create: { ...shippingRate, storeId: store.id },
    });

    return shippingRateDetails;
  } catch (error) {
    throw error;
  }
};

export const getStoreOrders = async (storeUrl: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
    });

    if (!store) throw new Error("Store not found.");

    if (user.id !== store.userId) {
      throw new Error("You don't have persmission to access this store.");
    }

    const orders = await db.orderGroup.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        items: true,
        coupon: true,
        order: {
          select: {
            paymentStatus: true,

            shippingAddress: {
              include: {
                country: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            paymentDetails: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return orders;
  } catch (error) {
    throw error;
  }
};

export const applySeller = async (store: StoreType) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (!store) throw new Error("Please provide store data.");

    const existingStore = await db.store.findFirst({
      where: {
        AND: [
          {
            OR: [
              { name: store.name },
              { email: store.email },
              { phone: store.phone },
              { url: store.url },
            ],
          },
        ],
      },
    });

    if (existingStore) {
      let errorMessage = "";
      if (existingStore.name === store.name) {
        errorMessage = "A store with the same name already exists";
      } else if (existingStore.email === store.email) {
        errorMessage = "A store with the same email already exists";
      } else if (existingStore.phone === store.phone) {
        errorMessage = "A store with the same phone number already exists";
      } else if (existingStore.url === store.url) {
        errorMessage = "A store with the same URL already exists";
      }
      throw new Error(errorMessage);
    }

    const storeDetails = await db.store.create({
      data: {
        ...store,
        defaultShippingService:
          store.defaultShippingService || "International Delivery",
        returnPolicy: store.returnPolicy || "Return in 30 days.",
        userId: user.id,
      },
    });
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      privateMetadata: {
        role: "SELLER",
      },
    });
    await db.user.upsert({
      where: {
        email: user.emailAddresses[0].emailAddress,
      },
      update: {
        role: "SELLER",
      },
      create: {
        id: user.id!,
        name: user.firstName || "",
        email: user.emailAddresses[0].emailAddress,
        picture: user.imageUrl || "",
        role: "SELLER",
      },
    });

    return storeDetails;
  } catch (error) {
    throw error;
  }
};

export const getStorePageDetails = async (storeUrl: string) => {
  const user = await currentUser();

  const store = await db.store.findUnique({
    where: {
      url: storeUrl,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      description: true,
      logo: true,
      cover: true,
      averageRating: true,
      numReviews: true,
      _count: {
        select: {
          followers: true,
        },
      },
    },
  });
  let isUserFollowingStore = false;
  if (user && store) {
    isUserFollowingStore = await checkIfUserFollowingStore(store.id, user.id);
  }
  if (!store) {
    throw new Error(`Store with URL "${storeUrl}" not found.`);
  }
  return { ...store, isUserFollowingStore };
};

export const deleteStore = async (storeId: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "ADMIN")
      throw new Error(
        "Unauthorized Access: Admin Privileges Required for Entry."
      );

    if (!storeId) throw new Error("Please provide store ID.");

    const response = await db.store.delete({
      where: {
        id: storeId,
      },
    });

    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllStores = async () => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "ADMIN") {
      throw new Error(
        "Unauthorized Access: Admin Privileges Required to View Stores."
      );
    }

    const stores = await db.store.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return stores;
  } catch (error) {
    throw error;
  }
};

export const updateStoreStatus = async (
  storeId: string,
  status: StoreStatus
) => {
  const user = await currentUser();

  if (!user) throw new Error("Unauthenticated.");

  if (user.privateMetadata.role !== "ADMIN")
    throw new Error(
      "Unauthorized Access: Admin Privileges Required for Entry."
    );

  const store = await db.store.findUnique({
    where: {
      id: storeId,
    },
  });

  if (!store) {
    throw new Error("Store not found !");
  }

  const updatedStore = await db.store.update({
    where: {
      id: storeId,
    },
    data: {
      status,
    },
  });

  if (store.status === "PENDING" && updatedStore.status === "ACTIVE") {
    await db.user.update({
      where: {
        id: updatedStore.userId,
      },
      data: {
        role: "SELLER",
      },
    });
  }

  return updatedStore.status;
};
