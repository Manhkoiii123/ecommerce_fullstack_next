"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { Coupon } from "@prisma/client";

export const upsertCoupon = async (coupon: Coupon, storeUrl: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    if (!coupon) throw new Error("Please provide coupon data.");
    if (!storeUrl) throw new Error("Store URL is required.");

    const store = await db.store.findUnique({
      where: { url: storeUrl },
    });

    if (!store) throw new Error("Store not found.");

    const existingCoupon = await db.coupon.findFirst({
      where: {
        AND: [
          { code: coupon.code },
          { storeId: store.id },
          {
            NOT: {
              id: coupon.id,
            },
          },
        ],
      },
    });

    if (existingCoupon) {
      throw new Error(
        "A coupon with the same code already exists for this store."
      );
    }

    const couponDetails = await db.coupon.upsert({
      where: {
        id: coupon.id,
      },
      update: { ...coupon, storeId: store.id },
      create: { ...coupon, storeId: store.id },
    });

    return couponDetails;
  } catch (error) {
    throw error;
  }
};

export const getStoreCoupons = async (storeUrl: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    if (!storeUrl) throw new Error("Store URL is required.");

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
    });

    if (!store) throw new Error("Store not found.");

    if (store.userId !== user.id)
      throw new Error("Unauthorized Access: You do not own this store.");

    const coupons = await db.coupon.findMany({
      where: {
        storeId: store.id,
      },
    });

    return coupons;
  } catch (error) {
    throw error;
  }
};

export const getCoupon = async (couponId: string) => {
  try {
    if (!couponId) throw new Error("Please provide coupon ID.");

    const coupon = await db.coupon.findUnique({
      where: {
        id: couponId,
      },
    });

    return coupon;
  } catch (error) {
    throw error;
  }
};

export const deleteCoupon = async (couponId: string, storeUrl: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error("Unauthorized Access: Seller Privileges Required.");

    if (!couponId || !storeUrl)
      throw new Error("Please provide coupon ID and store URL.");

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
    });

    if (!store) throw new Error("Store not found.");

    if (store.userId !== user.id) {
      throw new Error(
        "You are not the owner of this store. Only the store owner can delete coupons."
      );
    }

    const response = await db.coupon.delete({
      where: {
        id: couponId,
        storeId: store.id,
      },
    });

    return response;
  } catch (error) {
    throw error;
  }
};
