"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { FlashSale, FlashSaleProduct } from "@prisma/client";

export const getAllFlashSales = async (storeUrl?: string) => {
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

  const flashSales = await db.flashSale.findMany({
    where: storeId ? { storeId } : {},
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              variants: {
                select: {
                  id: true,
                  variantImage: true,
                  sizes: {
                    select: {
                      id: true,
                      size: true,
                      price: true,
                      discount: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      store: {
        select: {
          id: true,
          name: true,
          url: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return flashSales;
};

export const getActiveFlashSales = async (storeUrl?: string) => {
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

  const now = new Date();

  const activeFlashSales = await db.flashSale.findMany({
    where: {
      AND: [
        { isActive: true },
        { startDate: { lte: now } },
        { endDate: { gt: now } },
        storeId ? { storeId } : {},
      ],
    },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              variants: {
                select: {
                  id: true,
                  variantImage: true,
                  sizes: {
                    select: {
                      id: true,
                      size: true,
                      price: true,
                      discount: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      store: {
        select: {
          id: true,
          name: true,
          url: true,
        },
      },
    },
    orderBy: [{ featured: "desc" }, { endDate: "asc" }],
  });

  return activeFlashSales;
};

export const getFlashSale = async (flashSaleId: string) => {
  if (!flashSaleId) throw new Error("Please provide flash sale ID.");

  const flashSale = await db.flashSale.findUnique({
    where: {
      id: flashSaleId,
    },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              variants: {
                select: {
                  id: true,
                  variantImage: true,
                  sizes: {
                    select: {
                      id: true,
                      size: true,
                      price: true,
                      discount: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      store: {
        select: {
          id: true,
          name: true,
          url: true,
        },
      },
    },
  });

  return flashSale;
};

export const upsertFlashSale = async (data: {
  id?: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  featured: boolean;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscount?: number;
  storeId: string;
  productIds: string[];
  customDiscounts?: Array<{
    productId: string;
    customDiscountValue?: number;
    customMaxDiscount?: number;
  }>;
}) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (
      user.privateMetadata.role !== "SELLER" &&
      user.privateMetadata.role !== "ADMIN"
    )
      throw new Error(
        "Unauthorized Access: Seller or Admin privileges required."
      );

    // Verify store ownership
    const store = await db.store.findFirst({
      where: {
        id: data.storeId,
        userId: user.id,
      },
    });

    if (!store && user.privateMetadata.role !== "ADMIN") {
      throw new Error("Store not found or access denied.");
    }

    // Create or update flash sale
    const flashSale = await db.flashSale.upsert({
      where: {
        id: data.id || "",
      },
      update: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        featured: data.featured,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscount: data.maxDiscount,
        updatedAt: new Date(),
      },
      create: {
        id: data.id,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        featured: data.featured,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscount: data.maxDiscount,
        storeId: data.storeId,
      },
    });

    // Delete existing product associations
    await db.flashSaleProduct.deleteMany({
      where: {
        flashSaleId: flashSale.id,
      },
    });

    // Create new product associations
    const flashSaleProducts: Array<{
      flashSaleId: string;
      productId: string;
      customDiscountValue?: number;
      customMaxDiscount?: number;
    }> = data.productIds.map((productId) => {
      const customDiscount = data.customDiscounts?.find(
        (cd) => cd.productId === productId
      );

      return {
        flashSaleId: flashSale.id,
        productId,
        customDiscountValue: customDiscount?.customDiscountValue,
        customMaxDiscount: customDiscount?.customMaxDiscount,
      };
    });

    await db.flashSaleProduct.createMany({
      data: flashSaleProducts,
    });

    return flashSale;
  } catch (error) {
    throw error;
  }
};

export const deleteFlashSale = async (flashSaleId: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (
      user.privateMetadata.role !== "SELLER" &&
      user.privateMetadata.role !== "ADMIN"
    )
      throw new Error(
        "Unauthorized Access: Seller or Admin privileges required."
      );

    if (!flashSaleId) throw new Error("Please provide the flash sale ID.");

    const response = await db.flashSale.delete({
      where: {
        id: flashSaleId,
      },
    });

    return response;
  } catch (error) {
    throw error;
  }
};

export const toggleFlashSaleStatus = async (flashSaleId: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (
      user.privateMetadata.role !== "SELLER" &&
      user.privateMetadata.role !== "ADMIN"
    )
      throw new Error(
        "Unauthorized Access: Seller or Admin privileges required."
      );

    const flashSale = await db.flashSale.findUnique({
      where: { id: flashSaleId },
    });

    if (!flashSale) throw new Error("Flash sale not found.");

    const updatedFlashSale = await db.flashSale.update({
      where: { id: flashSaleId },
      data: {
        isActive: !flashSale.isActive,
        updatedAt: new Date(),
      },
    });

    return updatedFlashSale;
  } catch (error) {
    throw error;
  }
};

// Get flash sale discount for a specific product
export const getProductFlashSaleDiscount = async (productId: string) => {
  try {
    const now = new Date();

    const activeFlashSale = await db.flashSale.findFirst({
      where: {
        AND: [
          { isActive: true },
          { startDate: { lte: now } },
          { endDate: { gt: now } },
          {
            products: {
              some: {
                productId: productId,
              },
            },
          },
        ],
      },
      include: {
        products: {
          where: {
            productId: productId,
          },
        },
      },
    });

    if (!activeFlashSale) {
      return null;
    }

    const flashSaleProduct = activeFlashSale.products[0];

    return {
      flashSaleId: activeFlashSale.id,
      flashSaleName: activeFlashSale.name,
      discountType: activeFlashSale.discountType,
      discountValue: activeFlashSale.discountValue,
      maxDiscount: activeFlashSale.maxDiscount,
      endDate: activeFlashSale.endDate,
      customDiscountValue: flashSaleProduct?.customDiscountValue,
      customMaxDiscount: flashSaleProduct?.customMaxDiscount,
    };
  } catch (error) {
    console.error("Error getting product flash sale discount:", error);
    return null;
  }
};
