"use server";

import { db } from "@/lib/db";
import {
  FreeShippingWithCountriesType,
  ProductPageType,
  ProductShippingDetailsType,
  ProductWithVariantType,
  RatingStatisticsType,
  VariantImageType,
  VariantSimplified,
} from "@/lib/types";
import { generateUniqueSlug } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import slugify from "slugify";
import { getCookie } from "cookies-next";
import { cookies } from "next/headers";
import { FreeShipping, Store } from "@prisma/client";
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
      weight: product.weight,
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
export const getProducts = async (
  filters: any = {},
  sortBy: string = "",
  page: number = 1,
  pageSize: number = 10
) => {
  const currentPage = page;
  const limit = pageSize;
  const skip = (currentPage - 1) * limit;
  const wherClause: any = {
    AND: [],
  };
  if (filters.store) {
    const store = await db.store.findUnique({
      where: {
        url: filters.store,
      },
      select: { id: true },
    });
    if (store) {
      wherClause.AND.push({ storeId: store.id });
    }
  }
  if (filters.category) {
    const category = await db.category.findUnique({
      where: {
        url: filters.category,
      },
      select: { id: true },
    });
    if (category) {
      wherClause.AND.push({ categoryId: category.id });
    }
  }

  if (filters.subCategory) {
    const subCategory = await db.subCategory.findUnique({
      where: {
        url: filters.subCategory,
      },
      select: { id: true },
    });
    if (subCategory) {
      wherClause.AND.push({ subCategoryId: subCategory.id });
    }
  }
  const products = await db.product.findMany({
    where: wherClause,
    take: limit,
    skip: skip,
    include: {
      variants: {
        include: {
          sizes: true,
          images: true,
          colors: true,
        },
      },
    },
  });

  const productsWithFilteredVariants = products.map((product) => {
    const filteredVariants = product.variants;

    const variants: VariantSimplified[] = filteredVariants.map((variant) => ({
      variantId: variant.id,
      variantSlug: variant.slug,
      variantName: variant.variantName,
      images: variant.images,
      sizes: variant.sizes,
    }));

    const variantImages: VariantImageType[] = filteredVariants.map(
      (variant) => ({
        url: `/product/${product.slug}/${variant.slug}`,
        image: variant.variantImage
          ? variant.variantImage
          : variant.images[0].url,
      })
    );
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      rating: product.rating,
      sales: product.sales,
      variants,
      variantImages,
    };
  });
  const totalCount = products.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    products: productsWithFilteredVariants,
    totalPages,
    currentPage,
    pageSize,
    totalCount,
  };
};

export const getProductPageData = async (
  productSlug: string,
  variantSlug: string
) => {
  const [user, product, userCountry] = await Promise.all([
    currentUser(),
    retrieveProductDetails(productSlug, variantSlug),
    getUserCountry(),
  ]);
  if (!product) throw new Error("Product not found.");
  const storeId = product.storeId;
  //calc and retrieve the shipping detail
  const [
    productShippingDetails,
    storeFollowersCount,
    isUserFollowingStore,
    ratingStatistics,
  ] = await Promise.all([
    getShippingDetails(
      product?.shippingFeeMethod,
      userCountry,
      product?.store,
      product.freeShipping
    ),
    getStoreFollowersCount(storeId),
    user ? checkIfUserFollowingStore(storeId, user.id) : false,
    getRatingStatistics(product.id),
  ]);

  return formatProductResponse(
    product,
    productShippingDetails,
    storeFollowersCount,
    isUserFollowingStore,
    ratingStatistics
  );
};
export const retrieveProductDetails = async (
  productSlug: string,
  variantSlug: string
) => {
  const product = await db.product.findUnique({
    where: {
      slug: productSlug,
    },
    include: {
      category: true,
      subCategory: true,
      offerTag: true,
      store: true,
      specs: true,
      questions: true,
      reviews: true,
      freeShipping: {
        include: {
          eligibaleCountries: true,
        },
      },
      variants: {
        where: {
          slug: variantSlug,
        },
        include: {
          images: true,
          colors: true,
          sizes: true,
          specs: true,
        },
      },
    },
  });
  if (!product) return null;
  const variantImages = await db.productVariant.findMany({
    where: {
      productId: product.id,
    },
    select: {
      variantImage: true,
      slug: true,
    },
  });

  return {
    ...product,
    variantImages: variantImages.map((i) => ({
      url: `/product/${product.slug}/${i.slug}`,
      img: i.variantImage,
      slug: i.slug,
    })),
  };
};

const formatProductResponse = (
  product: ProductPageType,
  productShippingDetails: ProductShippingDetailsType,
  storeFollowersCount: number,
  isUserFollowingStore: boolean,
  ratingStatistics: RatingStatisticsType
) => {
  if (!product) return;
  const variant = product.variants[0];
  const { store, category, subCategory, offerTag, questions } = product;
  const { images, colors, sizes } = variant;

  return {
    productId: product.id,
    variantId: variant.id,
    productSlug: product.slug,
    variantSlug: variant.slug,
    name: product.name,
    description: product.description,
    variantName: variant.variantName,
    variantDescription: variant.variantDescription,
    images,
    category,
    subCategory,
    offerTag,
    isSale: variant.isSale,
    saleEndDate: variant.saleEndDate,
    brand: product.brand,
    sku: variant.sku,
    weight: variant.weight,
    variantImage: variant.variantImage,
    store: {
      id: store.id,
      url: store.url,
      name: store.name,
      logo: store.logo,
      followersCount: storeFollowersCount,
      isUserFollowingStore: isUserFollowingStore,
    },
    colors,
    sizes,
    specs: {
      product: product.specs,
      variant: variant.specs,
    },
    questions,
    rating: product.rating,
    relatedProducts: [],
    reviews: product.reviews,
    reviewsStatistics: ratingStatistics,
    shippingDetails: productShippingDetails,
    variantImages: product.variantImages,
  };
};

const getUserCountry = async () => {
  const userCountryCookie = (await getCookie("userCountry", { cookies })) || "";
  const defaultCountry = { name: "United States", code: "US" };

  try {
    const parsedCountry = JSON.parse(userCountryCookie as string);
    if (
      parsedCountry &&
      typeof parsedCountry === "object" &&
      "name" in parsedCountry &&
      "code" in parsedCountry
    ) {
      return parsedCountry;
    }
    return defaultCountry;
  } catch (error) {}
};

export const getShippingDetails = async (
  shippingFeeMethod: string,
  userCountry: { name: string; code: string; city: string },
  store: Store,
  freeShipping: FreeShippingWithCountriesType | null
) => {
  // mặc định khởi tạo
  let shippingDetails = {
    shippingFeeMethod,
    shippingService: store.defaultShippingService,
    shippingFee: 0,
    extraShippingFee: 0,
    deliveryTimeMin: 0,
    deliveryTimeMax: 0,
    returnPolicy: "",
    countryCode: userCountry.code,
    countryName: userCountry.name,
    city: userCountry.city,
    isFreeShipping: false,
  };
  // tìm cái thông tin country của người dùng đang ở
  const country = await db.country.findUnique({
    where: {
      name: userCountry.name,
      code: userCountry.code,
    },
  });
  if (country) {
    // tìm cái shipping ở thành phố đó
    const shippingRate = await db.shippingRate.findFirst({
      where: {
        countryId: country.id,
        storeId: store.id,
      },
    });
    // lấy ra cái shipping rate gán vào cái để trả ra
    const returnPolicy = shippingRate?.returnPolicy || store.returnPolicy;
    const shippingService =
      shippingRate?.shippingService || store.defaultShippingService;
    const shippingFeePerItem =
      shippingRate?.shippingFeePerItem || store.defaultShippingFeePerItem;
    const shippingFeeForAdditionalItem =
      shippingRate?.shippingFeeForAdditionalItem ||
      store.defaultShippingFeeForAdditionalItem;
    const shippingFeePerKg =
      shippingRate?.shippingFeePerKg || store.defaultShippingFeePerKg;
    const shippingFeeFixed =
      shippingRate?.shippingFeeFixed || store.defaultShippingFeeFixed;
    const deliveryTimeMin =
      shippingRate?.deliveryTimeMin || store.defaultDeliveryTimeMin;
    const deliveryTimeMax =
      shippingRate?.deliveryTimeMax || store.defaultDeliveryTimeMax;

    // check free shipping
    if (freeShipping) {
      const free_shipping_countries = freeShipping.eligibaleCountries;
      const check_free_shipping = free_shipping_countries.find(
        (c) => c.countryId === country.id
      );
      if (check_free_shipping) {
        shippingDetails.isFreeShipping = true;
      }
    }
    shippingDetails = {
      shippingFeeMethod,
      shippingService: shippingService,
      shippingFee: 0,
      extraShippingFee: 0,
      deliveryTimeMin,
      deliveryTimeMax,
      returnPolicy,
      countryCode: userCountry.code,
      countryName: userCountry.name,
      city: userCountry.city,
      isFreeShipping: shippingDetails.isFreeShipping,
    };
    const { isFreeShipping } = shippingDetails;
    switch (shippingFeeMethod) {
      case "ITEM":
        shippingDetails.shippingFee = isFreeShipping ? 0 : shippingFeePerItem;
        shippingDetails.extraShippingFee = isFreeShipping
          ? 0
          : shippingFeeForAdditionalItem;
        break;

      case "WEIGHT":
        shippingDetails.shippingFee = isFreeShipping ? 0 : shippingFeePerKg;
        break;

      case "FIXED":
        shippingDetails.shippingFee = isFreeShipping ? 0 : shippingFeeFixed;
        break;

      default:
        break;
    }
    return shippingDetails;
  }
  return false;
};
const getStoreFollowersCount = async (storeId: string) => {
  const storeFollwersCount = await db.store.findUnique({
    where: {
      id: storeId,
    },
    select: {
      _count: {
        select: {
          followers: true,
        },
      },
    },
  });
  return storeFollwersCount?._count.followers || 0;
};

export const checkIfUserFollowingStore = async (
  storeId: string,
  userId: string | undefined
) => {
  let isUserFollowingStore = false;
  if (userId) {
    const storeFollowersInfo = await db.store.findUnique({
      where: {
        id: storeId,
      },
      select: {
        followers: {
          where: {
            id: userId,
          },
          select: { id: true },
        },
      },
    });
    if (storeFollowersInfo && storeFollowersInfo.followers.length > 0) {
      isUserFollowingStore = true;
    }
  }

  return isUserFollowingStore;
};
export const getRatingStatistics = async (productId: string) => {
  const ratingStats = await db.review.groupBy({
    by: ["rating"],
    where: {
      productId,
    },
    _count: {
      rating: true,
    },
  });
  const totalReviews = ratingStats.reduce(
    (sum, stat) => sum + stat._count.rating,
    0
  );
  const ratingCounts = Array(5).fill(0);

  // đưa về dạng [1,2,3,4,5] => 1 là số đánh giá 1*, ...
  ratingStats.forEach((stat) => {
    let rating = Math.floor(stat.rating);
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating - 1] = stat._count.rating;
    }
  });
  return {
    ratingStatistics: ratingCounts.map((count, index) => ({
      rating: index + 1,
      numReviews: count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    })),
    reviewsWithImagesCount: await db.review.count({
      where: {
        productId,
        images: { some: {} },
      },
    }),
    totalReviews,
  };
};
