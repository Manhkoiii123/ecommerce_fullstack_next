"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const getOrder = async (orderId: string) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");
  const order = await db.order.findUnique({
    where: {
      id: orderId,
      userId: user.id,
    },
    include: {
      groups: {
        include: {
          items: true,
          store: true,
          coupon: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: {
          total: "desc",
        },
      },
      shippingAddress: {
        include: {
          country: true,
          user: true,
        },
      },
      paymentDetails: true,
    },
  });

  return order;
};
