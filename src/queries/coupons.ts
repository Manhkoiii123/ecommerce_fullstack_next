"use server";

import { db } from "@/lib/db";
import { CartWithCartItemsType } from "@/lib/types";
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

export const applyCoupon = async (
  couponCode: string,
  cartId: string
): Promise<{ message: string; cart: CartWithCartItemsType }> => {
  try {
    // Step 1: Fetch the coupon details
    const coupon = await db.coupon.findUnique({
      where: {
        code: couponCode,
      },
      include: {
        store: true,
      },
    });

    if (!coupon) {
      throw new Error("Invalid coupon code.");
    }

    // Step 2: Validate the coupon's date range
    const currentDate = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (currentDate < startDate || currentDate > endDate) {
      throw new Error("Coupon is expired or not yet active.");
    }

    // Step 3: Fetch the cart and validate its existence
    const cart = await db.cart.findUnique({
      where: {
        id: cartId,
      },
      include: {
        cartItems: true,
        coupon: true,
      },
    });

    if (!cart) {
      throw new Error("Cart not found.");
    }

    // Step 4: Ensure no coupon is already applied to the cart
    if (cart.couponId) {
      throw new Error("A coupon is already applied to this cart.");
    }

    // Step 5: Filter items from the store associated with the coupon
    const storeId = coupon.storeId;

    const storeItems = cart.cartItems.filter(
      (item) => item.storeId === storeId
    );

    if (storeItems.length === 0) {
      throw new Error(
        "No items in the cart belong to the store associated with this coupon."
      );
    }

    // Step 6: Calculate the discount on the store's items
    const storeSubTotal = storeItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const storeShippingTotal = storeItems.reduce(
      (acc, item) => acc + item.shippingFee,
      0
    );

    const storeTotal = storeSubTotal + storeShippingTotal;

    const discountedAmount = (storeTotal * coupon.discount) / 100;

    const newTotal = cart.total - discountedAmount;

    // Step 7: Update the cart with the applied coupon and new total
    const updatedCart = await db.cart.update({
      where: {
        id: cartId,
      },
      data: {
        couponId: coupon.id,
        total: newTotal,
      },
      include: {
        cartItems: true,
        coupon: {
          include: {
            store: true,
          },
        },
      },
    });

    return {
      message: `Coupon applied successfully. Discount: -$${discountedAmount.toFixed(
        2
      )} applied to items from ${coupon.store.name}.`,
      cart: updatedCart,
    };
  } catch (error: any) {
    throw error;
  }
};
