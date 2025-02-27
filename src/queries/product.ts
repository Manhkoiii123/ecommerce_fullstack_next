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
    const productSlug = await generateUniqueSlug(
      slugify(product.name, {
        replacement: "-",
        lower: true,
        trim: true,
      }),
      "product"
    );
    const variantSlug = await generateUniqueSlug(
      slugify(product.variantName, {
        replacement: "-",
        lower: true,
        trim: true,
      }),
      "productVariant"
    );

    const commonProductData = {
      name: product.name,
      description: product.description,
      slug: productSlug,
      brand: product.brand,
      store: { connect: { id: store.id } },
      category: { connect: { id: product.categoryId } },
      subCategory: { connect: { id: product.subCategoryId } },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      questions: {
        create: product.questions.map((q) => ({
          question: q.question,
          answer: q.answer,
        })),
      },
      specs: {
        create: product.product_specs.map((spec) => ({
          name: spec.name,
          value: spec.value,
        })),
      },
    };
    const commonVariantData = {
      variantName: product.variantName,
      variantDescription: product.variantDescription,
      slug: variantSlug,
      isSale: product.isSale,
      sku: product.sku,
      keywords: product.keywords.join(","),
      saleEndDate: product.saleEndDate,
      images: {
        create: product.images.map((image) => ({
          url: image.url,
          alt: image.url.split("/").pop() || "",
        })),
      },
      variantImage: product.variantImage,
      colors: {
        create: product.colors.map((c) => ({
          name: c.color,
        })),
      },
      sizes: {
        create: product.sizes.map((s) => ({
          size: s.size,
          quantity: s.quantity,
          price: s.price,
          discount: s.discount,
        })),
      },
      specs: {
        create: product.variant_specs.map((spec) => ({
          name: spec.name,
          value: spec.value,
        })),
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
    if (existingProduct) {
      // ghi đè variant của các cái đang có sẵn
      const variantData = {
        ...commonVariantData,
        product: {
          // connect: { id: product.productId } có nghĩa là liên kết bản ghi variantData với một bản ghi product đã có trong cơ sở dữ liệu dựa trên id.
          //  thì nó sẽ nối cái productId là cái id của cái product.productId
          connect: { id: product.productId },
        },
      };
      return await db.productVariant.create({ data: variantData });
    } else {
      // Nếu không, tạo một sản phẩm mới với các biến thể
      const productData = {
        ...commonProductData,
        id: product.productId,
        variants: {
          create: [
            {
              id: product.variantId,
              ...commonVariantData,
            },
          ],
        },
      };
      return await db.product.create({
        data: productData,
      });
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getProductMainInfo = async (productId: string) => {
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });
  if (!product) return null;

  return {
    productId: product.id,
    name: product.name,
    description: product.description,
    brand: product.brand,
    categoryId: product.categoryId,
    subCategoryId: product.subCategoryId,
    // offerTagId: product.offerTagId || undefined,
    storeId: product.storeId,
    // shippingFeeMethod: product.shippingFeeMethod,
    // questions: product.questions.map((q) => ({
    //   question: q.question,
    //   answer: q.answer,
    // })),
    // product_specs: product.specs.map((spec) => ({
    //   name: spec.name,
    //   value: spec.value,
    // })),
  };
};

export const getAllStoreProducts = async (storeUrl: string) => {
  const store = await db.store.findUnique({ where: { url: storeUrl } });
  if (!store) throw new Error("Please provide a valid store URL.");

  const products = await db.product.findMany({
    where: {
      storeId: store.id,
    },
    include: {
      category: true,
      subCategory: true,
      // offerTag: true,
      variants: {
        include: {
          images: true,
          colors: true,
          sizes: true,
        },
      },
      store: {
        select: {
          id: true,
          url: true,
        },
      },
    },
  });

  return products;
};

export const deleteProduct = async (productId: string) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");
  if (user.privateMetadata.role !== "SELLER")
    throw new Error(
      "Unauthorized Access: Seller Privileges Required for Entry."
    );

  if (!productId) throw new Error("Please provide product id.");

  const response = await db.product.delete({ where: { id: productId } });
  return response;
};
