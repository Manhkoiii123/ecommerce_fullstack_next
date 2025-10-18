"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

// Check if user is admin
async function checkAdmin() {
  const user = await currentUser();
  if (!user || user.privateMetadata.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return user;
}

// Platform-wide dashboard statistics
export const getAdminDashboardStats = async () => {
  await checkAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total stores
  const [totalStores, activeStores, pendingStores, monthlyNewStores] =
    await Promise.all([
      db.store.count(),
      db.store.count({ where: { status: "ACTIVE" } }),
      db.store.count({ where: { status: "PENDING" } }),
      db.store.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

  // Total products
  const [totalProducts, monthlyNewProducts] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

  // Total users
  const [totalUsers, monthlyNewUsers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

  return {
    stores: {
      total: totalStores,
      active: activeStores,
      pending: pendingStores,
      monthlyNew: monthlyNewStores,
    },
    products: {
      total: totalProducts,
      monthlyNew: monthlyNewProducts,
    },
    users: {
      total: totalUsers,
      monthlyNew: monthlyNewUsers,
    },
  };
};

// Get top stores by sales
export const getTopStoresBySales = async (limit: number = 10) => {
  await checkAdmin();

  // Get all stores with their products and sales
  const stores = await db.store.findMany({
    include: {
      products: {
        select: {
          sales: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          products: true,
          orderGroups: true,
        },
      },
    },
  });

  // Calculate total sales for each store
  const storesWithSales = stores.map((store) => {
    const totalSales = store.products.reduce(
      (sum, product) => sum + product.sales,
      0
    );
    return {
      id: store.id,
      name: store.name,
      url: store.url,
      logo: store.logo,
      status: store.status,
      owner: store.user.name,
      ownerEmail: store.user.email,
      totalSales,
      productsCount: store._count.products,
      ordersCount: store._count.orderGroups,
      createdAt: store.createdAt,
    };
  });

  // Sort by total sales and return top stores
  return storesWithSales
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, limit);
};

// Get newly created stores
export const getNewlyCreatedStores = async (days: number = 30) => {
  await checkAdmin();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const newStores = await db.store.findMany({
    where: {
      createdAt: {
        gte: cutoffDate,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return newStores.map((store) => ({
    id: store.id,
    name: store.name,
    url: store.url,
    logo: store.logo,
    status: store.status,
    owner: store.user.name,
    ownerEmail: store.user.email,
    productsCount: store._count.products,
    createdAt: store.createdAt,
  }));
};

// Get products count by subcategory
export const getProductsBySubCategory = async () => {
  await checkAdmin();

  const subCategories = await db.subCategory.findMany({
    include: {
      category: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      products: {
        _count: "desc",
      },
    },
  });

  return subCategories.map((subCategory) => ({
    id: subCategory.id,
    name: subCategory.name,
    url: subCategory.url,
    image: subCategory.image,
    categoryName: subCategory.category.name,
    productsCount: subCategory._count.products,
  }));
};

// Get new products added to each subcategory in the last N days
export const getNewProductsBySubCategory = async (days: number = 30) => {
  await checkAdmin();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const subCategories = await db.subCategory.findMany({
    include: {
      category: {
        select: {
          name: true,
        },
      },
      products: {
        where: {
          createdAt: {
            gte: cutoffDate,
          },
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  return subCategories
    .map((subCategory) => ({
      id: subCategory.id,
      name: subCategory.name,
      url: subCategory.url,
      categoryName: subCategory.category.name,
      newProductsCount: subCategory.products.length,
      newProducts: subCategory.products,
    }))
    .filter((sc) => sc.newProductsCount > 0)
    .sort((a, b) => b.newProductsCount - a.newProductsCount);
};

// Get products count by offer tag
export const getProductsByOfferTag = async () => {
  await checkAdmin();

  const offerTags = await db.offerTag.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      products: {
        _count: "desc",
      },
    },
  });

  return offerTags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    url: tag.url,
    productsCount: tag._count.products,
    createdAt: tag.createdAt,
  }));
};

// Get store status statistics
export const getStoresByStatus = async () => {
  await checkAdmin();

  const [active, pending, banned, disabled] = await Promise.all([
    db.store.count({ where: { status: "ACTIVE" } }),
    db.store.count({ where: { status: "PENDING" } }),
    db.store.count({ where: { status: "BANNED" } }),
    db.store.count({ where: { status: "DISABLED" } }),
  ]);

  return {
    active,
    pending,
    banned,
    disabled,
  };
};

// Get categories with product counts
export const getCategoriesWithStats = async () => {
  await checkAdmin();

  const categories = await db.category.findMany({
    include: {
      _count: {
        select: {
          products: true,
          subCategories: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    url: category.url,
    image: category.image,
    featured: category.featured,
    productsCount: category._count.products,
    subCategoriesCount: category._count.subCategories,
  }));
};
