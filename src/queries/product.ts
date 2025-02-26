"use server";

import { db } from "@/lib/db";
import { ProductWithVariantType } from "@/lib/types";
import { generateUniqueSlug } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import slugify from "slugify";
export const upsertProduct = async (
  product: ProductWithVariantType,
  storeUrl: string
) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthenticated.");
    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );
    if (!product) throw new Error("Please provide product data.");
    // tìm quán
    const store = await db.store.findUnique({
      where: { url: storeUrl, userId: user.id },
    });
    if (!store) throw new Error("Store not found.");
    // đã tồn tại
    const existingProduct = await db.product.findUnique({
      where: { id: product.productId },
    });
    const productSlug = generateUniqueSlug(
      slugify(product.name, {
        replacement: "-",
        lower: true,
        trim: true,
      }),
      "product"
    );
    const variantSlug = generateUniqueSlug(
      slugify(product.variantName, {
        replacement: "-",
        lower: true,
        trim: true,
      }),
      "productVariant"
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};
