"use server";

import { db } from "@/lib/db";

export const getFilteredColors = async (
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

  if (storeUrl) {
    const store = await db.store.findUnique({
      where: { url: storeUrl },
    });

    if (!store) {
      return { colors: [], count: 0 };
    }

    storeId = store.id;
  }

  const colors = await db.color.findMany({
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
      name: true,
    },
    take,
  });

  // Get Colors count
  const count = await db.color.count({
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
  });

  // Remove duplicate colors
  const uniqueColorsArray = Array.from(
    new Set(colors.map((color) => color.name))
  );

  // Return the unique colors in the desired format
  return {
    colors: uniqueColorsArray.map((color) => ({ name: color })),
    count,
  };
};
