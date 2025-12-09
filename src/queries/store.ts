"use server";

import { db } from "@/lib/db";
import {
  OrderStatus,
  StoreDefaultShippingType,
  StoreStatus,
  StoreType,
} from "@/lib/types";
import { checkIfUserFollowingStore } from "@/queries/product";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { ShippingRate, Store } from "@prisma/client";
import {
  createNewStorePendingNotification,
  createStoreApprovedNotification,
} from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export const upsertStore = async (store: Partial<Store>) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthenticated.");
    if (!store) throw new Error("Please provide store data.");
    const existingStore = await db.store.findFirst({
      where: {
        AND: [
          {
            OR: [
              { name: store.name },
              { email: store.email },
              { phone: store.phone },
              { url: store.url },
            ],
          },
          {
            NOT: {
              id: store.id,
            },
          },
        ],
      },
    });
    if (existingStore) {
      let errorMessage = "";
      if (existingStore.name === store.name) {
        errorMessage = "A store with the same name already exists";
      } else if (existingStore.email === store.email) {
        errorMessage = "A store with the same email already exists";
      } else if (existingStore.phone === store.phone) {
        errorMessage = "A store with the same phone number already exists";
      } else if (existingStore.url === store.url) {
        errorMessage = "A store with the same URL already exists";
      }
      throw new Error(errorMessage);
    }
    // Kiểm tra xem store có tồn tại không để xác định có phải create mới
    const isNewStore =
      !store.id ||
      !(await db.store.findUnique({
        where: { id: store.id },
      }));

    const storeDetails = await db.store.upsert({
      where: {
        id: store.id,
      },
      update: store,
      //@ts-ignore
      create: {
        ...store,
        user: {
          connect: { id: user.id },
        },
        stream: {
          create: {
            name: `${store.name}'s stream`,
            thumbnailUrl: store.logo,
            isLive: false,
            isChatEnabled: true,
            isChatDelayed: false,
            isChatFollowersOnly: false,
          },
        },
      },
    });

    // Chỉ gửi notification khi tạo mới store
    if (isNewStore) {
      try {
        await createNewStorePendingNotification(
          storeDetails.id,
          user.id,
          storeDetails.name
        );
      } catch (error) {
        console.error("Failed to create notification:", error);
      }
    }
    return storeDetails;
  } catch (error) {
    throw error;
  }
};

export const getStoreDefaultShippingDetails = async (storeUrl: string) => {
  try {
    if (!storeUrl) throw new Error("Store URL is required.");

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
      select: {
        defaultShippingService: true,
        defaultShippingFeePerItem: true,
        defaultShippingFeeForAdditionalItem: true,
        defaultShippingFeePerKg: true,
        defaultShippingFeeFixed: true,
        defaultDeliveryTimeMin: true,
        defaultDeliveryTimeMax: true,
        returnPolicy: true,
      },
    });

    if (!store) throw new Error("Store not found.");

    return store;
  } catch (error) {
    throw error;
  }
};

export const updateStoreDefaultShippingDetails = async (
  storeUrl: string,
  details: StoreDefaultShippingType
) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    if (!storeUrl) throw new Error("Store URL is required.");

    if (!details) {
      throw new Error("No shipping details provided to update.");
    }
    const check_ownership = await db.store.findUnique({
      where: {
        url: storeUrl,
        userId: user.id,
      },
    });

    if (!check_ownership)
      throw new Error(
        "Make sure you have the permissions to update this store"
      );

    const updatedStore = await db.store.update({
      where: {
        url: storeUrl,
        userId: user.id,
      },
      data: details,
    });

    return updatedStore;
  } catch (error) {
    throw error;
  }
};

export const getStoreShippingRates = async (storeUrl: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    if (!storeUrl) throw new Error("Store URL is required.");

    const check_ownership = await db.store.findUnique({
      where: {
        url: storeUrl,
        userId: user.id,
      },
    });

    if (!check_ownership)
      throw new Error(
        "Make sure you have the permissions to update this store"
      );

    const store = await db.store.findUnique({
      where: { url: storeUrl, userId: user.id },
    });

    if (!store) throw new Error("Store could not be found.");

    const countries = await db.country.findMany({
      orderBy: {
        name: "asc",
      },
    });

    const shippingRates = await db.shippingRate.findMany({
      where: {
        storeId: store.id,
      },
    });

    const rateMap = new Map();
    shippingRates.forEach((rate) => {
      rateMap.set(rate.countryId, rate);
    });

    const result = countries.map((country) => ({
      countryId: country.id,
      countryName: country.name,
      shippingRate: rateMap.get(country.id) || null,
    }));

    return result;
  } catch (error) {
    throw error;
  }
};

export const upsertShippingRate = async (
  storeUrl: string,
  shippingRate: ShippingRate
) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    const check_ownership = await db.store.findUnique({
      where: {
        url: storeUrl,
        userId: user.id,
      },
    });

    if (!check_ownership)
      throw new Error(
        "Make sure you have the permissions to update this store"
      );

    if (!shippingRate) throw new Error("Please provide shipping rate data.");

    if (!shippingRate.countryId)
      throw new Error("Please provide a valid country ID.");
    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
        userId: user.id,
      },
    });
    if (!store) throw new Error("Please provide a valid store URL.");

    const shippingRateDetails = await db.shippingRate.upsert({
      where: {
        id: shippingRate.id,
      },
      update: { ...shippingRate, storeId: store.id },
      create: { ...shippingRate, storeId: store.id },
    });

    return shippingRateDetails;
  } catch (error) {
    throw error;
  }
};

export const getStoreOrders = async (storeUrl: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "SELLER")
      throw new Error(
        "Unauthorized Access: Seller Privileges Required for Entry."
      );

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
    });

    if (!store) throw new Error("Store not found.");

    if (user.id !== store.userId) {
      throw new Error("You don't have persmission to access this store.");
    }

    const orders = await db.orderGroup.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        items: true,
        coupon: true,
        order: {
          select: {
            paymentStatus: true,

            shippingAddress: {
              include: {
                country: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            paymentDetails: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders;
  } catch (error) {
    throw error;
  }
};

export const applySeller = async (store: StoreType) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (!store) throw new Error("Please provide store data.");

    const existingStore = await db.store.findFirst({
      where: {
        AND: [
          {
            OR: [
              { name: store.name },
              { email: store.email },
              { phone: store.phone },
              { url: store.url },
            ],
          },
        ],
      },
    });

    if (existingStore) {
      let errorMessage = "";
      if (existingStore.name === store.name) {
        errorMessage = "A store with the same name already exists";
      } else if (existingStore.email === store.email) {
        errorMessage = "A store with the same email already exists";
      } else if (existingStore.phone === store.phone) {
        errorMessage = "A store with the same phone number already exists";
      } else if (existingStore.url === store.url) {
        errorMessage = "A store with the same URL already exists";
      }
      throw new Error(errorMessage);
    }

    const storeDetails = await db.store.create({
      data: {
        ...store,
        defaultShippingService:
          store.defaultShippingService || "International Delivery",
        returnPolicy: store.returnPolicy || "Return in 30 days.",
        userId: user.id,
        stream: {
          create: {
            name: `${store.name}'s stream`,
            thumbnailUrl: store.logo, // Sử dụng logo của store làm thumbnail
            isLive: false,
            isChatEnabled: true,
            isChatDelayed: false,
            isChatFollowersOnly: false,
          },
        },
      },
    });
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      privateMetadata: {
        role: "SELLER",
      },
    });
    await db.user.upsert({
      where: {
        email: user.emailAddresses[0].emailAddress,
      },
      update: {
        role: "SELLER",
      },
      create: {
        id: user.id!,
        name: user.firstName || "",
        email: user.emailAddresses[0].emailAddress,
        picture: user.imageUrl || "",
        role: "SELLER",
      },
    });

    // Gửi notification cho admin khi có store mới
    try {
      await createNewStorePendingNotification(
        storeDetails.id,
        user.id,
        storeDetails.name
      );
      console.log(
        "✅ Notification created successfully for new store application"
      );
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
    return storeDetails;
  } catch (error) {
    throw error;
  }
};

export const getStorePageDetails = async (storeUrl: string) => {
  const user = await currentUser();

  const store = await db.store.findUnique({
    where: {
      url: storeUrl,
      // status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      description: true,
      logo: true,
      cover: true,
      averageRating: true,
      numReviews: true,
      _count: {
        select: {
          followers: true,
        },
      },
    },
  });
  let isUserFollowingStore = false;
  if (user && store) {
    isUserFollowingStore = await checkIfUserFollowingStore(store.id, user.id);
  }
  if (!store) {
    throw new Error(`Store with URL "${storeUrl}" not found.`);
  }
  return { ...store, isUserFollowingStore };
};

export const deleteStore = async (storeId: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "ADMIN")
      throw new Error(
        "Unauthorized Access: Admin Privileges Required for Entry."
      );

    if (!storeId) throw new Error("Please provide store ID.");

    const response = await db.store.delete({
      where: {
        id: storeId,
      },
    });

    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllStores = async () => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "ADMIN") {
      throw new Error(
        "Unauthorized Access: Admin Privileges Required to View Stores."
      );
    }

    const stores = await db.store.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return stores;
  } catch (error) {
    throw error;
  }
};

export const updateStoreStatus = async (
  storeId: string,
  status: StoreStatus
) => {
  const user = await currentUser();

  if (!user) throw new Error("Unauthenticated.");

  if (user.privateMetadata.role !== "ADMIN")
    throw new Error(
      "Unauthorized Access: Admin Privileges Required for Entry."
    );

  const store = await db.store.findUnique({
    where: {
      id: storeId,
    },
  });

  if (!store) {
    throw new Error("Store not found !");
  }

  const updatedStore = await db.store.update({
    where: {
      id: storeId,
    },
    data: {
      status,
    },
  });

  if (store.status === "PENDING" && updatedStore.status === "ACTIVE") {
    await db.user.update({
      where: {
        id: updatedStore.userId,
      },
      data: {
        role: "SELLER",
      },
    });

    try {
      await createStoreApprovedNotification(
        updatedStore.id,
        updatedStore.userId,
        updatedStore.name
      );
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  }

  return updatedStore.status;
};

export const getStoreRevenueStats = async (
  storeUrl: string,
  type: "day" | "month" = "day",
  year?: number,
  month?: number
) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const store = await db.store.findUnique({
    where: { url: storeUrl, userId: user.id },
  });
  if (!store) throw new Error("Store not found.");

  let where: any = { storeId: store.id };

  if (type === "day" && year && month) {
    where.createdAt = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
    const stats = await db.orderGroup.groupBy({
      by: ["createdAt"],
      where,
      _sum: { total: true },
      orderBy: { createdAt: "asc" },
    });
    // Format result: group by day
    return stats.map((item) => ({
      period: item.createdAt.getDate(),
      revenue: item._sum.total || 0,
    }));
  } else if (type === "month" && year) {
    where.createdAt = {
      gte: new Date(year, 0, 1),
      lt: new Date(year + 1, 0, 1),
    };
    const stats = await db.orderGroup.groupBy({
      by: ["createdAt"],
      where,
      _sum: { total: true },
      orderBy: { createdAt: "asc" },
    });
    // Format result: group by month
    return stats.reduce((acc, item) => {
      const month = item.createdAt.getMonth() + 1;
      acc[month] = (acc[month] || 0) + (item._sum.total || 0);
      return acc;
    }, {} as Record<number, number>);
  } else {
    throw new Error("Please provide valid year/month parameters.");
  }
};

// Thống kê sản phẩm bán chạy nhất trong tháng/năm
export const getStoreBestSellingProducts = async (
  storeUrl: string,
  year?: number,
  month?: number,
  limit: number = 5
) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const store = await db.store.findUnique({
    where: { url: storeUrl, userId: user.id },
  });
  if (!store) throw new Error("Store not found.");

  let where: any = {
    orderGroup: { storeId: store.id },
  };
  if (year && month) {
    where.orderGroup.createdAt = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  } else if (year) {
    where.orderGroup.createdAt = {
      gte: new Date(year, 0, 1),
      lt: new Date(year + 1, 0, 1),
    };
  }

  // Lấy sản phẩm bán chạy nhất dựa trên tổng số lượng bán ra
  const stats = await db.orderItem.groupBy({
    by: ["productId"],
    where,
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  // Lấy thông tin sản phẩm
  const products = await db.product.findMany({
    where: { id: { in: stats.map((s) => s.productId) } },
  });

  return stats.map((stat) => ({
    product: products.find((p) => p.id === stat.productId),
    sold: stat._sum.quantity || 0,
  }));
};

// Thống kê tổng quan cho dashboard
export const getStoreDashboardStats = async (storeUrl: string) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const store = await db.store.findUnique({
    where: { url: storeUrl, userId: user.id },
  });
  if (!store) throw new Error("Store not found.");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Tổng doanh thu tháng này
  const monthlyRevenue = await db.orderGroup.aggregate({
    where: {
      storeId: store.id,
      createdAt: { gte: startOfMonth },
      order: { paymentStatus: "Paid" },
      status: { not: "Cancelled" },
    },
    _sum: { total: true },
  });

  // Tổng doanh thu năm nay
  const yearlyRevenue = await db.orderGroup.aggregate({
    where: {
      storeId: store.id,
      createdAt: { gte: startOfYear },
      order: { paymentStatus: "Paid" },
      status: { not: "Cancelled" },
    },
    _sum: { total: true },
  });

  // Tổng số đơn hàng tháng này
  const monthlyOrders = await db.orderGroup.count({
    where: {
      storeId: store.id,
      createdAt: { gte: startOfMonth },
      status: { not: "Cancelled" },
    },
  });

  // Tổng số đơn hàng năm nay
  const yearlyOrders = await db.orderGroup.count({
    where: {
      storeId: store.id,
      createdAt: { gte: startOfYear },
      status: { not: "Cancelled" },
    },
  });

  // Tổng số sản phẩm đã bán tháng này
  const monthlyProductsSold = await db.orderItem.aggregate({
    where: {
      orderGroup: {
        storeId: store.id,
        createdAt: { gte: startOfMonth },
        status: { not: "Cancelled" },
      },
    },
    _sum: { quantity: true },
  });

  // Tổng số sản phẩm đã bán năm nay
  const yearlyProductsSold = await db.orderItem.aggregate({
    where: {
      orderGroup: {
        storeId: store.id,
        createdAt: { gte: startOfYear },
        status: { not: "Cancelled" },
      },
    },
    _sum: { quantity: true },
  });

  // Số khách hàng mới tháng này
  const monthlyNewCustomers = await db.orderGroup.groupBy({
    by: ["orderId"],
    where: {
      storeId: store.id,
      createdAt: { gte: startOfMonth },
    },
  });

  // Lấy userId từ các order để xác định khách hàng mới
  const monthlyOrderIds = monthlyNewCustomers.map((item) => item.orderId);
  const monthlyOrdersWithUsers = await db.order.findMany({
    where: {
      id: { in: monthlyOrderIds },
    },
    select: {
      userId: true,
      createdAt: true,
    },
  });

  // Lấy danh sách userId trong tháng hiện tại
  const monthlyUserIds = monthlyOrdersWithUsers.map(
    (order: any) => order.userId
  );

  // Lấy danh sách userId đã mua hàng trước tháng hiện tại
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthOrders = await db.order.findMany({
    where: {
      userId: { in: monthlyUserIds },
      createdAt: { lt: startOfMonth },
    },
    select: {
      userId: true,
    },
  });

  const previousMonthUserIds = new Set(
    previousMonthOrders.map((order: any) => order.userId)
  );

  // Chỉ đếm những userId chưa từng mua hàng trước tháng hiện tại
  const trulyNewMonthlyCustomers = monthlyUserIds.filter(
    (userId: string) => !previousMonthUserIds.has(userId)
  );
  const monthlyUniqueCustomers = new Set(trulyNewMonthlyCustomers).size;

  // Số khách hàng mới năm nay
  const yearlyNewCustomers = await db.orderGroup.groupBy({
    by: ["orderId"],
    where: {
      storeId: store.id,
      createdAt: { gte: startOfYear },
    },
  });

  // Lấy userId từ các order để xác định khách hàng mới
  const yearlyOrderIds = yearlyNewCustomers.map((item) => item.orderId);
  const yearlyOrdersWithUsers = await db.order.findMany({
    where: {
      id: { in: yearlyOrderIds },
    },
    select: {
      userId: true,
      createdAt: true,
    },
  });

  // Lấy danh sách userId trong năm hiện tại
  const yearlyUserIds = yearlyOrdersWithUsers.map((order: any) => order.userId);

  // Lấy danh sách userId đã mua hàng trước năm hiện tại
  const previousYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const previousYearOrders = await db.order.findMany({
    where: {
      userId: { in: yearlyUserIds },
      createdAt: { lt: startOfYear },
    },
    select: {
      userId: true,
    },
  });

  const previousYearUserIds = new Set(
    previousYearOrders.map((order: any) => order.userId)
  );

  // Chỉ đếm những userId chưa từng mua hàng trước năm hiện tại
  const trulyNewYearlyCustomers = yearlyUserIds.filter(
    (userId: string) => !previousYearUserIds.has(userId)
  );
  const yearlyUniqueCustomers = new Set(trulyNewYearlyCustomers).size;

  return {
    monthly: {
      revenue: monthlyRevenue._sum.total || 0,
      orders: monthlyOrders,
      productsSold: monthlyProductsSold._sum.quantity || 0,
      newCustomers: monthlyUniqueCustomers,
    },
    yearly: {
      revenue: yearlyRevenue._sum.total || 0,
      orders: yearlyOrders,
      productsSold: yearlyProductsSold._sum.quantity || 0,
      newCustomers: yearlyUniqueCustomers,
    },
  };
};

// Thống kê đơn hàng theo trạng thái
export const getStoreOrderStatusStats = async (storeUrl: string) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const store = await db.store.findUnique({
    where: { url: storeUrl, userId: user.id },
  });
  if (!store) throw new Error("Store not found.");

  const stats = await db.orderGroup.groupBy({
    by: ["status"],
    where: { storeId: store.id },
    _count: true,
  });

  const result = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  stats.forEach((stat) => {
    if (stat.status === "Pending") result.pending = stat._count;
    else if (stat.status === "Processing") result.processing = stat._count;
    else if (stat.status === "Shipped") result.shipped = stat._count;
    else if (stat.status === "Delivered") result.delivered = stat._count;
    else if (stat.status === "Cancelled") result.cancelled = stat._count;
  });

  return result;
};

// Thống kê doanh thu theo ngày trong tuần
export const getStoreWeeklyRevenue = async (
  storeUrl: string,
  year?: number,
  month?: number
) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const store = await db.store.findUnique({
    where: { url: storeUrl, userId: user.id },
  });
  if (!store) throw new Error("Store not found.");

  let where: any = { storeId: store.id };

  if (year && month) {
    // Thống kê theo tháng cụ thể
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);
    where.createdAt = {
      gte: startOfMonth,
      lt: endOfMonth,
    };
  } else {
    // Thống kê theo tuần hiện tại
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    where.createdAt = { gte: startOfWeek };
  }

  const stats = await db.orderGroup.groupBy({
    by: ["createdAt"],
    where: {
      ...where,
      order: {
        is: {
          paymentStatus: "Paid",
        },
      },

      // status của OrderGroup
      status: {
        in: [
          "Pending",
          "Confirmed",
          "Processing",
          "Shipped",
          "OutforDelivery",
          "Delivered",
          "Failed",
          "Refunded",
          "Returned",
          "PartiallyShipped",
          "OnHold",
        ],
      },
    },
    _sum: { total: true },
  });

  if (year && month) {
    // Nhóm theo ngày trong tháng
    const dailyData = Array.from(
      { length: new Date(year, month, 0).getDate() },
      (_, i) => ({
        day: i + 1,
        revenue: 0,
      })
    );

    stats.forEach((stat) => {
      const day = stat.createdAt.getDate();
      const index = day - 1;
      if (index >= 0 && index < dailyData.length) {
        dailyData[index].revenue =
          (dailyData[index].revenue || 0) + (stat._sum.total || 0);
      }
    });

    return dailyData;
  } else {
    // Nhóm theo ngày trong tuần
    const weeklyData = Array(7).fill(0);
    stats.forEach((stat) => {
      const dayOfWeek = stat.createdAt.getDay();
      weeklyData[dayOfWeek] =
        (weeklyData[dayOfWeek] || 0) + (stat._sum.total || 0);
    });

    return weeklyData.map((revenue, index) => ({
      day: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][index],
      revenue,
    }));
  }
};

// Thống kê top 5 sản phẩm có doanh thu cao nhất
export const getStoreTopRevenueProducts = async (
  storeUrl: string,
  year?: number,
  month?: number,
  limit: number = 5
) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const store = await db.store.findUnique({
    where: { url: storeUrl, userId: user.id },
  });
  if (!store) throw new Error("Store not found.");

  let where: any = {
    orderGroup: { storeId: store.id },
  };
  if (year && month) {
    where.orderGroup.createdAt = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  } else if (year) {
    where.orderGroup.createdAt = {
      gte: new Date(year, 0, 1),
      lt: new Date(year + 1, 0, 1),
    };
  }

  // Lấy sản phẩm có doanh thu cao nhất
  const stats = await db.orderItem.groupBy({
    by: ["productId"],
    where,
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    orderBy: { _sum: { totalPrice: "desc" } },
    take: limit,
  });

  // Lấy thông tin sản phẩm
  const products = await db.product.findMany({
    where: { id: { in: stats.map((s) => s.productId) } },
  });

  return stats.map((stat) => ({
    product: products.find((p) => p.id === stat.productId),
    sold: stat._sum.quantity || 0,
    revenue: stat._sum.totalPrice || 0,
  }));
};

// Thống kê tỷ lệ chuyển đổi đơn hàng
export const getStoreConversionRate = async (storeUrl: string) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const store = await db.store.findUnique({
    where: { url: storeUrl, userId: user.id },
  });
  if (!store) throw new Error("Store not found.");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Tổng số đơn hàng đã hoàn thành
  const completedOrders = await db.orderGroup.count({
    where: {
      storeId: store.id,
      createdAt: { gte: startOfMonth },
      status: "Delivered",
    },
  });

  // Tổng số đơn hàng
  const totalOrders = await db.orderGroup.count({
    where: {
      storeId: store.id,
      createdAt: { gte: startOfMonth },
    },
  });

  // Tỷ lệ chuyển đổi
  const conversionRate =
    totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  return {
    completedOrders,
    totalOrders,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
};

// Thống kê theo tháng cụ thể được chọn
export const getStoreStatsByMonth = async (
  storeUrl: string,
  year: number,
  month: number
) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const store = await db.store.findUnique({
    where: { url: storeUrl, userId: user.id },
  });
  if (!store) throw new Error("Store not found.");

  if (!year || !month || month < 1 || month > 12) {
    throw new Error("Please provide valid year and month (1-12).");
  }

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1);

  // Doanh thu theo tháng
  const monthlyRevenue = await db.orderGroup.aggregate({
    where: {
      storeId: store.id,
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
      order: { paymentStatus: "Paid" },
      status: { not: "Cancelled" },
    },
    _sum: { total: true },
  });

  // Số đơn hàng theo tháng
  const monthlyOrders = await db.orderGroup.count({
    where: {
      storeId: store.id,
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  });

  // Số sản phẩm đã bán theo tháng
  const monthlyProductsSold = await db.orderItem.aggregate({
    where: {
      orderGroup: {
        storeId: store.id,
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
        status: { not: "Cancelled" },
      },
    },
    _sum: { quantity: true },
  });

  // Số khách hàng mới theo tháng
  const monthlyNewCustomers = await db.orderGroup.groupBy({
    by: ["orderId"],
    where: {
      storeId: store.id,
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  });

  // Lấy userId từ các order để xác định khách hàng mới
  const monthlyOrderIds = monthlyNewCustomers.map((item) => item.orderId);
  const monthlyOrdersWithUsers = await db.order.findMany({
    where: {
      id: { in: monthlyOrderIds },
    },
    select: {
      userId: true,
      createdAt: true,
    },
  });

  // Lấy danh sách userId trong tháng hiện tại
  const monthlyUserIds = monthlyOrdersWithUsers.map(
    (order: any) => order.userId
  );

  // Lấy danh sách userId đã mua hàng trước tháng hiện tại
  const previousMonthStart = new Date(year, month - 2, 1); // Tháng trước
  const previousOrders = await db.order.findMany({
    where: {
      userId: { in: monthlyUserIds },
      createdAt: { lt: startOfMonth },
    },
    select: {
      userId: true,
    },
  });

  const previousUserIds = new Set(
    previousOrders.map((order: any) => order.userId)
  );

  // Chỉ đếm những userId chưa từng mua hàng trước tháng hiện tại
  const trulyNewCustomers = monthlyUserIds.filter(
    (userId: string) => !previousUserIds.has(userId)
  );
  const monthlyUniqueCustomers = new Set(trulyNewCustomers).size;

  // Thống kê trạng thái đơn hàng theo tháng
  const orderStatusStats = await db.orderGroup.groupBy({
    by: ["status"],
    where: {
      storeId: store.id,
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
    _count: true,
  });

  const statusResult = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  orderStatusStats.forEach((stat) => {
    if (stat.status === "Pending") statusResult.pending = stat._count;
    else if (stat.status === "Processing")
      statusResult.processing = stat._count;
    else if (stat.status === "Shipped") statusResult.shipped = stat._count;
    else if (stat.status === "Delivered") statusResult.delivered = stat._count;
    else if (stat.status === "Cancelled") statusResult.cancelled = stat._count;
  });

  // Top sản phẩm bán chạy theo tháng
  const topProducts = await db.orderItem.groupBy({
    by: ["productId"],
    where: {
      orderGroup: {
        storeId: store.id,
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
        status: { not: "Cancelled" },
      },
    },
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  // Lấy thông tin sản phẩm
  const products = await db.product.findMany({
    where: { id: { in: topProducts.map((s) => s.productId) } },
  });

  const topProductsWithInfo = topProducts.map((stat) => ({
    product: products.find((p) => p.id === stat.productId),
    sold: stat._sum.quantity || 0,
    revenue: stat._sum.totalPrice || 0,
  }));

  // Tỷ lệ chuyển đổi theo tháng
  const completedOrders = await db.orderGroup.count({
    where: {
      storeId: store.id,
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
      status: "Delivered",
    },
  });

  const conversionRate =
    monthlyOrders > 0 ? (completedOrders / monthlyOrders) * 100 : 0;

  // Doanh thu theo ngày trong tháng
  const dailyRevenue = await db.orderGroup.groupBy({
    by: ["createdAt"],
    where: {
      storeId: store.id,
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
      order: { paymentStatus: "Paid" },
    },
    _sum: { total: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyData = dailyRevenue.map((item) => ({
    day: item.createdAt.getDate(),
    revenue: item._sum.total || 0,
  }));

  return {
    period: {
      year,
      month,
      monthName: new Date(year, month - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    },
    overview: {
      revenue: monthlyRevenue._sum.total || 0,
      orders: monthlyOrders,
      productsSold: monthlyProductsSold._sum.quantity || 0,
      newCustomers: monthlyUniqueCustomers,
    },
    orderStatus: statusResult,
    topProducts: topProductsWithInfo,
    conversionRate: {
      completedOrders,
      totalOrders: monthlyOrders,
      conversionRate: Math.round(conversionRate * 100) / 100,
    },
    dailyRevenue: dailyData,
  };
};

// Cập nhật function getStoreDashboardStats để hỗ trợ chọn tháng
export const getStoreDashboardStatsByPeriod = async (
  storeUrl: string,
  year?: number,
  month?: number
) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const store = await db.store.findUnique({
    where: { url: storeUrl, userId: user.id },
  });
  if (!store) throw new Error("Store not found.");

  const now = new Date();
  let startOfPeriod: Date;
  let endOfPeriod: Date;

  if (year && month) {
    // Thống kê theo tháng cụ thể
    startOfPeriod = new Date(year, month - 1, 1);
    endOfPeriod = new Date(year, month, 1);
  } else if (year) {
    // Thống kê theo năm
    startOfPeriod = new Date(year, 0, 1);
    endOfPeriod = new Date(year + 1, 0, 1);
  } else {
    // Thống kê theo tháng hiện tại
    startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  // Doanh thu theo kỳ
  const periodRevenue = await db.orderGroup.aggregate({
    where: {
      storeId: store.id,
      createdAt: {
        gte: startOfPeriod,
        lt: endOfPeriod,
      },
      order: { paymentStatus: "Paid" },
    },
    _sum: { total: true },
  });

  // Số đơn hàng theo kỳ
  const periodOrders = await db.orderGroup.count({
    where: {
      storeId: store.id,
      createdAt: {
        gte: startOfPeriod,
        lt: endOfPeriod,
      },
    },
  });

  // Số sản phẩm đã bán theo kỳ
  const periodProductsSold = await db.orderItem.aggregate({
    where: {
      orderGroup: {
        storeId: store.id,
        createdAt: {
          gte: startOfPeriod,
          lt: endOfPeriod,
        },
      },
    },
    _sum: { quantity: true },
  });

  // Số khách hàng mới theo kỳ
  const periodNewCustomers = await db.orderGroup.groupBy({
    by: ["orderId"],
    where: {
      storeId: store.id,
      createdAt: {
        gte: startOfPeriod,
        lt: endOfPeriod,
      },
    },
  });

  // Lấy userId từ các order để xác định khách hàng mới
  const periodOrderIds = periodNewCustomers.map((item) => item.orderId);
  const periodOrdersWithUsers = await db.order.findMany({
    where: {
      id: { in: periodOrderIds },
    },
    select: {
      userId: true,
      createdAt: true,
    },
  });

  // Lấy danh sách userId trong kỳ hiện tại
  const periodUserIds = periodOrdersWithUsers.map((order: any) => order.userId);

  // Lấy danh sách userId đã mua hàng trước kỳ hiện tại
  const previousPeriodOrders = await db.order.findMany({
    where: {
      userId: { in: periodUserIds },
      createdAt: { lt: startOfPeriod },
    },
    select: {
      userId: true,
    },
  });

  const previousPeriodUserIds = new Set(
    previousPeriodOrders.map((order: any) => order.userId)
  );

  // Chỉ đếm những userId chưa từng mua hàng trước kỳ hiện tại
  const trulyNewPeriodCustomers = periodUserIds.filter(
    (userId: string) => !previousPeriodUserIds.has(userId)
  );
  const periodUniqueCustomers = new Set(trulyNewPeriodCustomers).size;

  return {
    period: {
      start: startOfPeriod,
      end: endOfPeriod,
      year: year || now.getFullYear(),
      month: month || now.getMonth() + 1,
    },
    stats: {
      revenue: periodRevenue._sum.total || 0,
      orders: periodOrders,
      productsSold: periodProductsSold._sum.quantity || 0,
      newCustomers: periodUniqueCustomers,
    },
  };
};

// Auto-cancel unpaid orders after 3 days
export const autoCancelUnpaidOrders = async (storeUrl?: string) => {
  try {
    const orderUnpaid = await getOrdersAtRiskOfCancellation(storeUrl);

    const cancelledOrders = await Promise.all(
      orderUnpaid.map(async (o) => {
        const order = await db.orderGroup.findUnique({
          where: { id: o.id },
          include: {
            items: true,
            order: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
                groups: true,
              },
            },
          },
        });

        if (!order) throw new Error("Order not found.");

        await db.$transaction(async (tx) => {
          if (
            order.order.groups
              .filter((g) => g.id !== order.id)
              .every((g) => g.status === "Cancelled")
          ) {
            await tx.order.updateMany({
              where: { id: order.orderId },
              data: {
                orderStatus: "Cancelled",
                paymentStatus: "Cancelled",
                updatedAt: new Date(),
              },
            });
          }
          await tx.orderGroup.updateMany({
            where: { id: o.id },
            data: {
              status: "Cancelled",
              updatedAt: new Date(),
            },
          });

          await tx.orderItem.updateMany({
            where: { id: { in: order.items.map((i) => i.id) } },
            data: {
              status: "Cancelled",
              updatedAt: new Date(),
            },
          });

          for (const group of order.items) {
            await tx.size.update({
              where: { id: group.sizeId },
              data: {
                quantity: {
                  increment: group.quantity,
                },
              },
            });

            await tx.product.update({
              where: { id: group.productId },
              data: {
                sales: {
                  decrement: group.quantity,
                },
              },
            });
          }
        });

        return order;
      })
    );

    for (const o of cancelledOrders) {
      await fetch("http://localhost:3000/api/socket/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ORDER_STATUS_CHANGE",
          orderId: o.orderId,
          userId: o.order.userId,
          newStatus: OrderStatus.Cancelled,
          orderGroupId: o.id,
        }),
      });
    }

    revalidatePath("/dashboard/seller/stores", "layout");

    return {
      cancelled: cancelledOrders.length,
      message: `Successfully cancelled ${cancelledOrders.length} unpaid orders`,
      cancelledOrders,
    };
  } catch (error) {
    console.error("Error in autoCancelUnpaidOrders:", error);
    throw error;
  }
};

// Get orders that are at risk of being cancelled (unpaid for 2+ days)
export const getOrdersAtRiskOfCancellation = async (storeUrl?: string) => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() + 1);
    let store: any = null;
    if (storeUrl) {
      store = await db.store.findFirst({ where: { url: storeUrl } });
    }
    const whereClause: any = {
      status: "Pending",
      createdAt: {
        lt: twoDaysAgo,
      },
    };

    if (storeUrl) {
      whereClause.storeId = store?.id;
    }

    const atRiskOrders = await db.orderGroup.findMany({
      where: {
        ...whereClause,
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const filteredOrders = atRiskOrders.filter(
      (o) => o.order.paymentStatus !== "Paid"
    );

    return filteredOrders.map((order) => ({
      id: order.id,
      customerEmail: order.order.user.email || "Unknown",
      customerName: order.order.user.name || "Unknown",
      totalAmount: order.total,
      createdAt: order.createdAt,
      daysUnpaid: Math.floor(
        (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
      stores: store?.name,
      willBeCancelledIn:
        3 -
        Math.floor(
          (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
    }));
  } catch (error) {
    console.error("Error getting orders at risk of cancellation:", error);
    throw error;
  }
};

// Manual cancellation of specific order
export const manuallyCancelOrder = async (orderId: string, reason?: string) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthenticated.");

    // Check if user is admin or seller
    if (
      user.privateMetadata.role !== "ADMIN" &&
      user.privateMetadata.role !== "SELLER"
    ) {
      throw new Error("Unauthorized: Admin or Seller privileges required.");
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        groups: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Check if order is already cancelled or paid
    if (order.paymentStatus === "Cancelled" || order.paymentStatus === "Paid") {
      throw new Error(
        `Order cannot be cancelled. Current status: ${order.paymentStatus}`
      );
    }

    // Update order status to cancelled
    await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "Cancelled",
        orderStatus: "Cancelled",
        updatedAt: new Date(),
        // Add cancellation reason if provided
        ...(reason && {
          notes: `Cancelled manually by ${user.emailAddresses[0].emailAddress}. Reason: ${reason}`,
        }),
      },
    });

    // Update all order groups to cancelled
    await db.orderGroup.updateMany({
      where: { orderId },
      data: {
        status: "Cancelled",
        updatedAt: new Date(),
      },
    });

    // Note: Inventory restoration would need to be implemented based on your specific inventory management system
    // This is a placeholder for the inventory restoration logic

    return {
      success: true,
      message: `Order ${orderId} cancelled successfully`,
      orderId,
      cancelledAt: new Date(),
      cancelledBy: user.emailAddresses[0].emailAddress,
      reason,
    };
  } catch (error) {
    console.error("Error manually cancelling order:", error);
    throw error;
  }
};

export const checkIfCurrentUserFollowingStore = async (storeUrl: string) => {
  try {
    const user = await currentUser();

    if (!user) {
      return false;
    }

    if (!storeUrl) {
      throw new Error("Store URL is required.");
    }

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
      select: {
        id: true,
        followers: {
          where: {
            id: user.id,
          },
          select: { id: true },
        },
      },
    });

    if (!store) {
      throw new Error("Store not found.");
    }

    return store.followers.length > 0;
  } catch (error) {
    throw error;
  }
};

export const getStoreByUrl = async (storeUrl: string) => {
  try {
    if (!storeUrl) {
      throw new Error("Store URL is required.");
    }

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
        stream: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
            ingressId: true,
            serverUrl: true,
            streamKey: true,
            isLive: true,
            isChatEnabled: true,
            isChatDelayed: true,
            isChatFollowersOnly: true,
            storeId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            followers: true,
            products: true,
          },
        },
      },
    });

    if (!store) {
      throw new Error(`Store with URL "${storeUrl}" not found.`);
    }

    return store;
  } catch (error) {
    throw error;
  }
};

export const getStoreBasicInfo = async (storeUrl: string) => {
  try {
    if (!storeUrl) {
      throw new Error("Store URL is required.");
    }

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        cover: true,
        averageRating: true,
        numReviews: true,
        status: true,
        featured: true,
        createdAt: true,
        stream: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
            isLive: true,
            isChatEnabled: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            followers: true,
            products: true,
          },
        },
      },
    });

    if (!store) {
      throw new Error(`Store with URL "${storeUrl}" not found.`);
    }

    return store;
  } catch (error) {
    throw error;
  }
};

export const getStoreWithFollowers = async (storeUrl: string) => {
  try {
    if (!storeUrl) {
      throw new Error("Store URL is required.");
    }

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
        stream: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
            ingressId: true,
            serverUrl: true,
            streamKey: true,
            isLive: true,
            isChatEnabled: true,
            isChatDelayed: true,
            isChatFollowersOnly: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        followers: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
        _count: {
          select: {
            followers: true,
            products: true,
          },
        },
      },
    });

    if (!store) {
      throw new Error(`Store with URL "${storeUrl}" not found.`);
    }

    return store;
  } catch (error) {
    throw error;
  }
};

// Thêm hàm chuyên biệt để lấy store với stream live
export const getStoreWithLiveStream = async (storeUrl: string) => {
  try {
    if (!storeUrl) {
      throw new Error("Store URL is required.");
    }

    const store = await db.store.findUnique({
      where: {
        url: storeUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
        stream: {
          where: {
            isLive: true,
          },
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
            serverUrl: true,
            streamKey: true,
            isLive: true,
            isChatEnabled: true,
            isChatDelayed: true,
            isChatFollowersOnly: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            followers: true,
            products: true,
          },
        },
      },
    });

    if (!store) {
      throw new Error(`Store with URL "${storeUrl}" not found.`);
    }

    return store;
  } catch (error) {
    throw error;
  }
};

export const cancelGroupOrder = async (orderId: string) => {
  try {
    const order = await db.orderGroup.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            groups: true,
          },
        },
      },
    });

    if (!order) throw new Error("Order not found.");

    await db.$transaction(async (tx) => {
      if (
        order.order.groups
          .filter((g) => g.id !== order.id)
          .every((g) => g.status === "Cancelled")
      ) {
        await tx.order.updateMany({
          where: { id: order.orderId },
          data: {
            orderStatus: "Cancelled",
            paymentStatus: "Cancelled",
            updatedAt: new Date(),
          },
        });
      }

      await tx.orderGroup.updateMany({
        where: { id: orderId },
        data: {
          status: "Cancelled",
          updatedAt: new Date(),
        },
      });

      await tx.orderItem.updateMany({
        where: { id: { in: order.items.map((i) => i.id) } },
        data: {
          status: "Cancelled",
          updatedAt: new Date(),
        },
      });

      for (const group of order.items) {
        await tx.size.update({
          where: { id: group.sizeId },
          data: {
            quantity: {
              increment: group.quantity,
            },
          },
        });

        await tx.product.update({
          where: { id: group.productId },
          data: {
            sales: {
              decrement: group.quantity,
            },
          },
        });
      }
    });

    revalidatePath(`/order/${order.orderId}`);
    return order;
  } catch (error) {
    throw error;
  }
};
