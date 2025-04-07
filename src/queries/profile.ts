"use server";

import { db } from "@/lib/db";
import {
  OrderStatus,
  OrderTableDateFilter,
  OrderTableFilter,
  PaymentStatus,
  PaymentTableDateFilter,
  PaymentTableFilter,
  ReviewDateFilter,
  ReviewFilter,
} from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";
import { subMonths, subYears } from "date-fns";

export const getUserOrders = async (
  filter: OrderTableFilter = "",
  period: OrderTableDateFilter = "",
  search = "",
  page: number = 1,
  pageSize: number = 10
) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated");
  const skip = (page - 1) * pageSize;
  const whereClause: any = {
    AND: [{ userId: user.id }],
  };
  if (filter === "unpaid")
    whereClause.AND.push({ paymentStatus: PaymentStatus.Pending });
  if (filter === "toShip")
    whereClause.AND.push({ orderStatus: OrderStatus.Processing });
  if (filter === "shipped")
    whereClause.AND.push({ orderStatus: OrderStatus.Shipped });
  if (filter === "delivered")
    whereClause.AND.push({ orderStatus: OrderStatus.Delivered });

  // ngày
  const now = new Date();
  if (period === "last-6-months") {
    whereClause.AND.push({
      createdAt: { gte: subMonths(now, 6) },
    });
  }
  if (period === "last-1-year")
    whereClause.AND.push({ createdAt: { gte: subYears(now, 1) } });
  if (period === "last-2-years")
    whereClause.AND.push({ createdAt: { gte: subYears(now, 2) } });

  // search
  if (search.trim()) {
    whereClause.AND.push({
      OR: [
        {
          id: { contains: search }, // tìm kiếm theo id
        },
        {
          groups: {
            some: {
              store: {
                name: { contains: search }, // tìm kiếm theo tên store
              },
            },
          },
        },
        {
          groups: {
            some: {
              items: {
                some: {
                  name: { contains: search }, // tìm kiếm theo tên sản phẩm
                },
              },
            },
          },
        },
      ],
    });
  }

  const orders = await db.order.findMany({
    where: whereClause,
    include: {
      groups: {
        include: {
          items: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      },
      shippingAddress: {
        include: {
          country: true,
        },
      },
    },
    take: pageSize,
    skip,
    orderBy: {
      updatedAt: "desc",
    },
  });
  const totalCount = await db.order.count({ where: whereClause });

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    orders,
    totalPages,
    currentPage: page,
    pageSize,
    totalCount,
  };
};

//  get payment
export const getUserPayments = async (
  filter: PaymentTableFilter = "",
  period: PaymentTableDateFilter = "",
  search = "",
  page: number = 1,
  pageSize: number = 10
) => {
  const user = await currentUser();

  if (!user) throw new Error("Unauthenticated.");

  const skip = (page - 1) * pageSize;

  const whereClause: any = {
    AND: [
      {
        userId: user.id,
      },
    ],
  };

  if (filter === "paypal") whereClause.AND.push({ paymentMethod: "Paypal" });
  if (filter === "credit-card")
    whereClause.AND.push({ paymentMethod: "Stripe" });

  const now = new Date();
  if (period === "last-6-months") {
    whereClause.AND.push({
      createdAt: { gte: subMonths(now, 6) },
    });
  }
  if (period === "last-1-year")
    whereClause.AND.push({ createdAt: { gte: subYears(now, 1) } });
  if (period === "last-2-years")
    whereClause.AND.push({ createdAt: { gte: subYears(now, 2) } });

  if (search.trim()) {
    whereClause.AND.push({
      OR: [
        {
          id: { contains: search },
        },
        {
          paymentInetntId: { contains: search },
        },
      ],
    });
  }

  const payments = await db.paymentDetails.findMany({
    where: whereClause,
    include: {
      order: true,
    },
    take: pageSize,
    skip,
    orderBy: {
      updatedAt: "desc",
    },
  });

  const totalCount = await db.paymentDetails.count({ where: whereClause });

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    payments,
    totalPages,
    currentPage: page,
    pageSize,
    totalCount,
  };
};

export const getUserReviews = async (
  filter: ReviewFilter = "",
  period: ReviewDateFilter = "",
  search = "",
  page: number = 1,
  pageSize: number = 10
) => {
  const user = await currentUser();

  if (!user) throw new Error("Unauthenticated.");

  const skip = (page - 1) * pageSize;

  const whereClause: any = {
    AND: [
      {
        userId: user.id,
      },
    ],
  };

  if (filter) whereClause.AND.push({ rating: parseFloat(filter) });

  const now = new Date();
  if (period === "last-6-months") {
    whereClause.AND.push({
      createdAt: { gte: subMonths(now, 6) },
    });
  }
  if (period === "last-1-year")
    whereClause.AND.push({ createdAt: { gte: subYears(now, 1) } });
  if (period === "last-2-years")
    whereClause.AND.push({ createdAt: { gte: subYears(now, 2) } });

  if (search.trim()) {
    whereClause.AND.push({
      review: { contains: search },
    });
  }

  const reviews = await db.review.findMany({
    where: whereClause,
    include: {
      images: true,
      user: true,
    },
    take: pageSize,
    skip,
    orderBy: {
      updatedAt: "desc",
    },
  });

  const totalCount = await db.review.count({ where: whereClause });

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    reviews,
    totalPages,
    currentPage: page,
    pageSize,
    totalCount,
  };
};
