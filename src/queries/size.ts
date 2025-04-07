"use server";

import { db } from "@/lib/db";

export const getFilteredSizes = async (
  filters: {
    category?: string;
    subCategory?: string;
    offer?: string;
    storeUrl?: string;
  },
  take = 10
) => {
  const { category, subCategory, offer, storeUrl } = filters;

  let storeId: string | undefined;

  const sizes = await db.size.findMany({
    where: {
      productVariant: {
        product: {
          AND: [
            category ? { category: { url: category } } : {},
            subCategory ? { subCategory: { url: subCategory } } : {},
            offer ? { category: { url: offer } } : {},
            storeId ? { store: { id: storeId } } : {},
          ],
        },
      },
    },
    select: {
      size: true,
    },
    take,
  });

  const count = await db.size.count({
    where: {
      productVariant: {
        product: {
          AND: [
            category ? { category: { url: category } } : {},
            subCategory ? { category: { url: subCategory } } : {},
            offer ? { category: { url: offer } } : {},
          ],
        },
      },
    },
  });
  // Remove duplicate sizes
  const uniqueSizesArray = Array.from(new Set(sizes.map((size) => size.size)));
  // Define a custom order using a Map for fast lookups
  const sizeOrderMap = new Map(
    ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"].map(
      (size, index) => [size, index]
    )
  );
  uniqueSizesArray.sort((a, b) => {
    return (
      (sizeOrderMap.get(a) ?? Infinity) - (sizeOrderMap.get(b) ?? Infinity) ||
      a.localeCompare(b)
    );
  });
  return {
    sizes: uniqueSizesArray.map((size) => ({ size })),
    count,
  };
};
