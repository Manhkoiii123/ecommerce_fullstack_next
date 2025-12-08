"use server";

import { db } from "@/lib/db";
import {
  FreeShippingWithCountriesType,
  ProductPageType,
  ProductShippingDetailsType,
  ProductWithVariantType,
  RatingStatisticsType,
  SortOrder,
  VariantImageType,
  VariantSimplified,
} from "@/lib/types";
import { generateUniqueSlug } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import { Country, ProductVariant, Size, Store } from "@prisma/client";
import { getCookie } from "cookies-next";
import { cookies } from "next/headers";
import slugify from "slugify";
export const upsertProduct = async (
  product: ProductWithVariantType,
  storeUrl: string
) => {
  try {
    // Retrieve current user
    const user = await currentUser();

    // Check if user is authenticated
    if (!user) throw new Error("Unauthenticated.");

    // Ensure user has seller privileges
    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    // Ensure product data is provided
    if (!product) throw new Error("Please provide product data.");

    // Find the store by URL
    const store = await db.store.findUnique({
      where: { url: storeUrl, userId: user.id },
    });
    if (!store) throw new Error("Store not found.");

    // Check if the product already exists
    const existingProduct = await db.product.findUnique({
      where: { id: product.productId },
    });

    // Check if the variant already exists
    const existingVariant = await db.productVariant.findUnique({
      where: { id: product.variantId },
    });

    if (existingProduct) {
      if (existingVariant) {
        // Update existing variant and product
        await handleProductUpdate(product);
      } else {
        // Create new variant
        await handleCreateVariant(product);
      }
    } else {
      // Create new product and variant
      await handleProductCreate(product, store.id);
    }
  } catch (error) {
    throw error;
  }
};

const handleProductCreate = async (
  product: ProductWithVariantType,
  storeId: string
) => {
  // Generate unique slugs for product and variant
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

  const productData = {
    id: product.productId,
    name: product.name,
    description: product.description,
    slug: productSlug,
    store: { connect: { id: storeId } },
    category: { connect: { id: product.categoryId } },
    subCategory: { connect: { id: product.subCategoryId } },
    offerTag: { connect: { id: product.offerTagId } },
    brand: product.brand,
    specs: {
      create: product.product_specs.map((spec) => ({
        name: spec.name,
        value: spec.value,
      })),
    },
    questions: {
      create: product.questions.map((q) => ({
        question: q.question,
        answer: q.answer,
      })),
    },
    variants: {
      create: [
        {
          id: product.variantId,
          variantName: product.variantName,
          variantDescription: product.variantDescription,
          slug: variantSlug,
          variantImage: product.variantImage,
          sku: product.sku,
          weight: product.weight,
          keywords: product.keywords.join(","),
          isSale: product.isSale,
          saleEndDate: product.saleEndDate,
          images: {
            create: product.images.map((img) => ({
              url: img.url,
            })),
          },
          colors: {
            create: product.colors.map((color) => ({
              name: color.color,
            })),
          },
          sizes: {
            create: product.sizes.map((size) => ({
              size: size.size,
              price: size.price,
              quantity: size.quantity,
              discount: size.discount,
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
        },
      ],
    },
    shippingFeeMethod: product.shippingFeeMethod,
    freeShippingForAllCountries: product.freeShippingForAllCountries,
    freeShipping: product.freeShippingForAllCountries
      ? undefined
      : product.freeShippingCountriesIds &&
        product.freeShippingCountriesIds.length > 0
      ? {
          create: {
            eligibaleCountries: {
              create: product.freeShippingCountriesIds.map((country) => ({
                country: { connect: { id: country.value } },
              })),
            },
          },
        }
      : undefined,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  const new_product = await db.product.create({ data: productData });
  // fire realtime notifications to followers of the store
  try {
    const baseUrl =
      (process.env.NEXT_PUBLIC_SITE_URL as string) ||
      (process.env.NEXT_PUBLIC_APP_URL as string) ||
      (process.env.NEXTAUTH_URL as string) ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const cookieHeader = cookies()
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    const url = `${baseUrl.replace(/\/$/, "")}/api/socket/product-published`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ storeId, productId: new_product.id }),
    });
  } catch (e) {}
  return new_product;
};

const handleCreateVariant = async (product: ProductWithVariantType) => {
  const variantSlug = await generateUniqueSlug(
    slugify(product.variantName, {
      replacement: "-",
      lower: true,
      trim: true,
    }),
    "productVariant"
  );

  const variantData = {
    id: product.variantId,
    productId: product.productId,
    variantName: product.variantName,
    variantDescription: product.variantDescription,
    slug: variantSlug,
    isSale: product.isSale,
    saleEndDate: product.isSale ? product.saleEndDate : "",
    sku: product.sku,
    keywords: product.keywords.join(","),
    weight: product.weight,
    variantImage: product.variantImage,
    images: {
      create: product.images.map((img) => ({
        url: img.url,
      })),
    },
    colors: {
      create: product.colors.map((color) => ({
        name: color.color,
      })),
    },
    sizes: {
      create: product.sizes.map((size) => ({
        size: size.size,
        price: size.price,
        quantity: size.quantity,
        discount: size.discount,
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

  const new_variant = await db.productVariant.create({ data: variantData });
  return new_variant;
};

const handleProductUpdate = async (product: ProductWithVariantType) => {
  // Update product
  await db.product.update({
    where: { id: product.productId },
    data: {
      name: product.name,
      description: product.description,
      brand: product.brand,
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId,
      offerTagId: product.offerTagId || null,
      shippingFeeMethod: product.shippingFeeMethod,
      freeShippingForAllCountries: product.freeShippingForAllCountries,
      updatedAt: new Date(),
    },
  });

  // Delete existing related data
  await db.spec.deleteMany({
    where: { productId: product.productId },
  });
  await db.question.deleteMany({
    where: { productId: product.productId },
  });
  await db.freeShipping.deleteMany({
    where: { productId: product.productId },
  });

  // Update variant
  await db.productVariant.update({
    where: { id: product.variantId },
    data: {
      variantName: product.variantName,
      variantDescription: product.variantDescription,
      variantImage: product.variantImage,
      sku: product.sku,
      weight: product.weight,
      keywords: product.keywords.join(","),
      isSale: product.isSale,
      saleEndDate: product.saleEndDate,
      updatedAt: new Date(),
    },
  });

  // Delete existing variant related data (except images - we'll handle them separately)
  await db.color.deleteMany({
    where: { productVariantId: product.variantId },
  });
  await db.size.deleteMany({
    where: { productVariantId: product.variantId },
  });
  await db.spec.deleteMany({
    where: { variantId: product.variantId },
  });

  // Create new related data
  await db.spec.createMany({
    data: product.product_specs.map((spec) => ({
      name: spec.name,
      value: spec.value,
      productId: product.productId,
    })),
  });

  await db.question.createMany({
    data: product.questions.map((q) => ({
      question: q.question,
      answer: q.answer,
      productId: product.productId,
    })),
  });

  // Handle images: preserve existing ones and add new ones
  const existingImages = await db.productVariantImage.findMany({
    where: { productVariantId: product.variantId },
    select: { url: true },
  });

  const existingImageUrls = existingImages.map((img) => img.url);
  const newImageUrls = product.images.filter(
    (img) => !existingImageUrls.includes(img.url)
  );

  // Only create new images that don't exist
  if (newImageUrls.length > 0) {
    await db.productVariantImage.createMany({
      data: newImageUrls.map((img) => ({
        url: img.url,
        productVariantId: product.variantId,
      })),
    });
  }

  await db.color.createMany({
    data: product.colors.map((color) => ({
      name: color.color,
      productVariantId: product.variantId,
    })),
  });

  await db.size.createMany({
    data: product.sizes.map((size) => ({
      size: size.size,
      quantity: size.quantity,
      price: size.price,
      discount: size.discount,
      productVariantId: product.variantId,
    })),
  });

  await db.spec.createMany({
    data: product.variant_specs.map((spec) => ({
      name: spec.name,
      value: spec.value,
      variantId: product.variantId,
    })),
  });

  // Handle free shipping
  if (product.freeShippingForAllCountries) {
    // No specific countries needed
  } else if (
    product.freeShippingCountriesIds &&
    product.freeShippingCountriesIds.length > 0
  ) {
    await db.freeShipping.create({
      data: {
        productId: product.productId,
        eligibaleCountries: {
          create: product.freeShippingCountriesIds.map((country) => ({
            country: { connect: { id: country.value } },
          })),
        },
      },
    });
  }
};

export const getProductMainInfo = async (productId: string) => {
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      questions: true,
      specs: true,
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
    offerTagId: product.offerTagId || undefined,
    storeId: product.storeId,
    shippingFeeMethod: product.shippingFeeMethod,
    questions: product.questions.map((q) => ({
      question: q.question,
      answer: q.answer,
    })),
    product_specs: product.specs.map((spec) => ({
      name: spec.name,
      value: spec.value,
    })),
  };
};

export const getProductForEdit = async (
  productId: string,
  storeUrl: string
) => {
  // authn + authz
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");
  if (user.privateMetadata.role !== "SELLER")
    throw new Error(
      "Unauthorized Access: Seller Privileges Required for Entry."
    );

  if (!productId) throw new Error("Please provide product id.");
  if (!storeUrl) throw new Error("Please provide store url.");

  const store = await db.store.findUnique({
    where: { url: storeUrl, userId: user.id },
    select: { id: true },
  });
  if (!store) throw new Error("Store not found.");

  // fetch product within the seller's store
  const product = await db.product.findFirst({
    where: { id: productId, storeId: store.id },
    include: {
      specs: true,
      questions: true,
      variants: {
        include: {
          images: true,
          colors: true,
          sizes: true,
          specs: true,
        },
      },
      freeShipping: {
        include: {
          eligibaleCountries: {
            include: { country: true },
          },
        },
      },
    },
  });

  if (!product) throw new Error("Product not found.");
  const variant = product.variants[0];
  if (!variant) throw new Error("Product has no variants.");

  return {
    productId: product.id,
    variantId: variant.id,
    name: product.name,
    description: product.description,
    variantName: variant.variantName,
    variantDescription: variant.variantDescription || "",
    variantImage:
      variant.variantImage || (variant.images[0] ? variant.images[0].url : ""),
    images: variant.images.map((img) => ({ url: img.url })),
    categoryId: product.categoryId,
    subCategoryId: product.subCategoryId,
    offerTagId: product.offerTagId || "",
    isSale: variant.isSale,
    saleEndDate: variant.saleEndDate || "",
    brand: product.brand,
    sku: variant.sku,
    colors: variant.colors.map((c) => ({ color: c.name })),
    sizes: variant.sizes.map((s) => ({
      size: s.size,
      quantity: s.quantity,
      price: s.price,
      discount: s.discount,
    })),
    keywords: variant.keywords
      ? variant.keywords.split(",").filter(Boolean)
      : [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    weight: variant.weight,
    product_specs: product.specs.map((spec) => ({
      name: spec.name,
      value: spec.value,
    })),
    variant_specs: variant.specs.map((spec) => ({
      name: spec.name,
      value: spec.value,
    })),
    questions: product.questions.map((q) => ({
      question: q.question,
      answer: q.answer,
    })),
    freeShippingForAllCountries: product.freeShippingForAllCountries,
    freeShippingCountriesIds: product.freeShipping
      ? product.freeShipping.eligibaleCountries.map((ec) => ({
          value: ec.country.id,
          label: ec.country.name,
        }))
      : [],
    shippingFeeMethod: product.shippingFeeMethod,
  };
};

export const getAllStoreProducts = async (storeUrl: string) => {
  const store = await db.store.findUnique({ where: { url: storeUrl } });
  if (!store) throw new Error("Please provide a valid store URL.");

  const products = await db.product.findMany({
    where: {
      storeId: store.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      brand: true,
      categoryId: true,
      subCategoryId: true,
      offerTagId: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      offerTag: {
        select: {
          id: true,
          name: true,
        },
      },
      variants: {
        select: {
          id: true,
          variantName: true,
          variantDescription: true,
          variantImage: true,
          sku: true,
          weight: true,
          keywords: true,
          isSale: true,
          saleEndDate: true,
          images: {
            select: {
              id: true,
              url: true,
            },
          },
          colors: {
            select: {
              id: true,
              name: true,
            },
          },
          sizes: {
            select: {
              id: true,
              size: true,
              quantity: true,
              price: true,
              discount: true,
            },
          },
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

  // Handle null subCategory by providing a default value
  const productsWithSubCategory = await Promise.all(
    products.map(async (product) => {
      let subCategory;

      if (product.subCategoryId) {
        // Fetch actual subcategory data
        const subCat = await db.subCategory.findUnique({
          where: { id: product.subCategoryId },
          select: {
            id: true,
            name: true,
            image: true,
            url: true,
            featured: true,
            categoryId: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (subCat) {
          subCategory = subCat;
        } else {
          // Fallback if subcategory not found
          subCategory = {
            id: product.subCategoryId,
            name: "Unknown Subcategory",
            image: "",
            url: "",
            featured: false,
            categoryId: product.categoryId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      } else {
        // No subcategory
        subCategory = {
          id: "",
          name: "No Subcategory",
          image: "",
          url: "",
          featured: false,
          categoryId: product.categoryId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return {
        ...product,
        subCategory,
      };
    })
  );

  return productsWithSubCategory;
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
  pageSize: number = 5
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
  if (filters.offer) {
    const offer = await db.offerTag.findUnique({
      where: {
        url: filters.offer,
      },
      select: { id: true },
    });
    if (offer) {
      wherClause.AND.push({ offerTagId: offer.id });
    }
  }
  if (filters.search) {
    wherClause.AND.push({
      OR: [
        {
          name: { contains: filters.search },
        },
        {
          description: { contains: filters.search },
        },
        {
          variants: {
            some: {
              variantName: { contains: filters.search },
              variantDescription: { contains: filters.search },
            },
          },
        },
      ],
    });
  }

  if (filters.minPrice || filters.maxPrice) {
    wherClause.AND.push({
      variants: {
        some: {
          sizes: {
            some: {
              price: {
                gte: filters.minPrice || 0,
                lte: filters.maxPrice || Infinity,
              },
            },
          },
        },
      },
    });
  }

  if (filters.size && Array.isArray(filters.size)) {
    wherClause.AND.push({
      variants: {
        some: {
          sizes: {
            some: {
              size: {
                in: filters.size,
              },
            },
          },
        },
      },
    });
  }

  let orderBy: Record<string, SortOrder> = {};
  switch (sortBy) {
    case "most-popular":
      orderBy = { views: "desc" };
      break;
    case "new-arrivals":
      orderBy = { createdAt: "desc" };
      break;
    case "top-rated":
      orderBy = { rating: "desc" };
      break;
    default:
      orderBy = { views: "desc" };
  }
  const products = await db.product.findMany({
    where: wherClause,
    orderBy,
    // take: limit,
    // skip: skip,
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
  type VariantWithSizes = ProductVariant & { sizes: Size[] };

  products.sort((a, b) => {
    const getMinPrice = (product: any) => {
      return Math.min(
        ...product.variants.flatMap((variant: VariantWithSizes) =>
          variant.sizes.map((size) => {
            let discount = size.discount;
            let discountedPrice = size.price * (1 - discount / 100);
            return discountedPrice;
          })
        ),
        Infinity
      );
    };

    const minPriceA = getMinPrice(a);
    const minPriceB = getMinPrice(b);

    if (sortBy === "price-low-to-high") {
      return minPriceA - minPriceB;
    } else if (sortBy === "price-high-to-low") {
      return minPriceB - minPriceA;
    }

    return 0;
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
      numReviews: product.numReviews,
      variants,
      variantImages,
    };
  });

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const pageData = productsWithFilteredVariants.slice(start, end);
  const totalCount = await db.product.count({ where: wherClause });
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    products: pageData,
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
      product.freeShipping,
      product.freeShippingForAllCountries
    ),
    getStoreFollowersCount(storeId),
    user ? checkIfUserFollowingStore(storeId, user.id) : false,
    getRatingStatistics(product.id),
  ]);
  await incrementProductViews(product.id);
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
      reviews: {
        include: {
          images: true,
          user: true,
        },
      },
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
  const variantInfo = await db.productVariant.findMany({
    where: {
      productId: product.id,
    },
    include: {
      images: true,
      sizes: true,
      colors: true,
      product: {
        select: {
          slug: true,
        },
      },
    },
  });

  return {
    ...product,
    variantInfo: variantInfo.map((variant) => ({
      variantName: variant.variantName,
      variantSlug: variant.slug,
      variantImage: variant.variantImage,
      variantUrl: `/product/${productSlug}/${variant.slug}`,
      images: variant.images,
      sizes: variant.sizes,
      colors: variant.colors,
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
    variantInfo: product.variantInfo,
    freeShippingForAllCountries: product.freeShippingForAllCountries,
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
  freeShipping: FreeShippingWithCountriesType | null,
  freeShippingForAllCountries: boolean
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
    freeShippingForAllCountries: freeShippingForAllCountries,
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
      freeShippingForAllCountries: shippingDetails.freeShippingForAllCountries,
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
export const getProductFilteredReviews = async (
  productId: string,
  filters: { rating?: number; hasImages?: boolean },
  sort: { orderBy: "latest" | "oldest" | "highest" } | undefined,
  page: number = 1,
  pageSize: number = 4
) => {
  const reviewFilter: any = {
    productId,
  };

  if (filters.rating) {
    const rating = filters.rating;
    reviewFilter.rating = {
      in: [rating, rating + 0.5],
    };
  }

  if (filters.hasImages) {
    reviewFilter.images = {
      some: {},
    };
  }

  const sortOption: { createdAt?: SortOrder; rating?: SortOrder } =
    sort && sort.orderBy === "latest"
      ? { createdAt: "desc" }
      : sort && sort.orderBy === "oldest"
      ? { createdAt: "asc" }
      : { rating: "desc" };

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const statistics = await getRatingStatistics(productId);
  const reviews = await db.review.findMany({
    where: reviewFilter,
    include: {
      images: true,
      user: true,
    },
    orderBy: sortOption,
    skip, // Skip records for pagination
    take, // Take records for pagination
  });

  return { reviews, statistics };
};

export const getDeliveryDetailsForStoreByCountry = async (
  storeId: string,
  countryId: string
) => {
  const shippingRate = await db.shippingRate.findFirst({
    where: {
      countryId,
      storeId,
    },
  });

  let storeDetails;
  if (!shippingRate) {
    storeDetails = await db.store.findUnique({
      where: {
        id: storeId,
      },
      select: {
        defaultShippingService: true,
        defaultDeliveryTimeMin: true,
        defaultDeliveryTimeMax: true,
      },
    });
  }

  const shippingService = shippingRate
    ? shippingRate.shippingService
    : storeDetails?.defaultShippingService;

  const deliveryTimeMin = shippingRate
    ? shippingRate.deliveryTimeMin
    : storeDetails?.defaultDeliveryTimeMin;

  const deliveryTimeMax = shippingRate
    ? shippingRate.deliveryTimeMax
    : storeDetails?.defaultDeliveryTimeMax;

  return {
    shippingService,
    deliveryTimeMin,
    deliveryTimeMax,
  };
};

export const getProductShippingFee = async (
  shippingFeeMethod: string,
  userCountry: Country,
  store: Store,
  freeShipping: FreeShippingWithCountriesType | null,
  weight: number,
  quantity: number,
  freeShippingForAllCountries: boolean
) => {
  if (freeShippingForAllCountries) return 0;
  const country = await db.country.findUnique({
    where: {
      name: userCountry.name,
      code: userCountry.code,
    },
  });

  if (country) {
    if (freeShipping) {
      const free_shipping_countries = freeShipping.eligibaleCountries;
      const isEligableForFreeShipping = free_shipping_countries.some(
        (c) => c.countryId === country.id
      );
      if (isEligableForFreeShipping) {
        return 0;
      }
    }

    const shippingRate = await db.shippingRate.findFirst({
      where: {
        countryId: country.id,
        storeId: store.id,
      },
    });

    // const {
    //   shippingFeePerItem = store.defaultShippingFeePerItem,
    //   shippingFeeForAdditionalItem = store.defaultShippingFeeForAdditionalItem,
    //   shippingFeePerKg = store.defaultShippingFeePerKg,
    //   shippingFeeFixed = store.defaultShippingFeeFixed,
    // } = shippingRate || {};
    const shippingFeePerItem =
      shippingRate?.shippingFeePerItem || store.defaultShippingFeePerItem;
    const shippingFeeForAdditionalItem =
      shippingRate?.shippingFeeForAdditionalItem ||
      store.defaultShippingFeeForAdditionalItem;
    const shippingFeePerKg =
      shippingRate?.shippingFeePerKg || store.defaultShippingFeePerKg;
    const shippingFeeFixed =
      shippingRate?.shippingFeeFixed || store.defaultShippingFeeFixed;

    const additionalItemsQty = quantity - 1;

    const feeCalculators: Record<string, () => number> = {
      ITEM: () =>
        shippingFeePerItem + shippingFeeForAdditionalItem * additionalItemsQty,
      WEIGHT: () => shippingFeePerKg * weight * quantity,
      FIXED: () => shippingFeeFixed,
    };

    const calculateFee = feeCalculators[shippingFeeMethod];
    if (calculateFee) {
      return calculateFee();
    }

    return 0;
  }

  return 0;
};

export const getProductsByIds = async (
  ids: string[],
  page: number = 1,
  pageSize: number = 10
): Promise<{ products: any; totalPages: number }> => {
  if (!ids || ids.length === 0) {
    throw new Error("Ids are undefined");
  }

  const currentPage = page;
  const limit = pageSize;
  const skip = (currentPage - 1) * limit;

  try {
    const variants = await db.productVariant.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        variantName: true,
        slug: true,
        images: {
          select: {
            url: true,
          },
        },
        sizes: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            rating: true,
            sales: true,
          },
        },
      },
      take: limit,
      skip: skip,
    });

    const new_products = variants.map((variant) => ({
      id: variant.product.id,
      slug: variant.product.slug,
      name: variant.product.name,
      rating: variant.product.rating,
      sales: variant.product.sales,
      variants: [
        {
          variantId: variant.id,
          variantName: variant.variantName,
          variantSlug: variant.slug,
          images: variant.images,
          sizes: variant.sizes,
        },
      ],
      variantImages: [],
    }));

    const ordered_products = ids
      .map((id) =>
        new_products.find((product) => product.variants[0].variantId === id)
      )
      .filter(Boolean);

    const allProducts = await db.productVariant.count({
      where: {
        id: {
          in: ids,
        },
      },
    });

    const totalPages = Math.ceil(allProducts / pageSize);

    return {
      products: ordered_products,
      totalPages,
    };
  } catch (error) {
    throw new Error("Failed to fetch products. Please try again.");
  }
};

const incrementProductViews = async (productId: string) => {
  const isProductAlreadyViewed = await getCookie(`viewedProduct_${productId}`, {
    cookies,
  });

  if (!isProductAlreadyViewed) {
    await db.product.update({
      where: {
        id: productId,
      },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }
};

export const getStoreByUrl = async (storeUrl: string) => {
  const store = await db.store.findUnique({
    where: { url: storeUrl },
  });
  return store;
};
export const getListNotificationsByStoreId = async (storeId: string) => {
  const notifications = await db.notification.findMany({
    where: { storeId },
  });
  return notifications;
};
