"use server";

import { db } from "@/lib/db";
import { OrderStatus, ProductStatus } from "@/lib/types";
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

export const updateOrderGroupStatus = async (
  storeId: string,
  groupId: string,
  status: OrderStatus
) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");
  if (user.privateMetadata.role !== "SELLER")
    throw new Error(
      "Unauthorized Access: Seller Privileges Required for Entry."
    );
  const store = await db.store.findUnique({
    where: {
      id: storeId,
      userId: user.id,
    },
  });
  if (!store) {
    throw new Error("Unauthorized Access !");
  }
  const order = await db.orderGroup.findUnique({
    where: {
      id: groupId,
      storeId: storeId,
    },
  });
  if (!order) throw new Error("Order not found.");
  const updatedOrder = await db.orderGroup.update({
    where: {
      id: groupId,
    },
    data: {
      status,
    },
  });
  return updatedOrder.status;
};

export const updateOrderItemStatus = async (
  storeId: string,
  orderItemId: string,
  status: ProductStatus
) => {
  const user = await currentUser();

  if (!user) throw new Error("Unauthenticated.");

  if (user.privateMetadata.role !== "SELLER")
    throw new Error(
      "Unauthorized Access: Seller Privileges Required for Entry."
    );

  const store = await db.store.findUnique({
    where: {
      id: storeId,
      userId: user.id,
    },
  });

  if (!store) {
    throw new Error("Unauthorized Access !");
  }

  const product = await db.orderItem.findUnique({
    where: {
      id: orderItemId,
    },
  });

  if (!product) throw new Error("Order item not found.");

  const updatedProduct = await db.orderItem.update({
    where: {
      id: orderItemId,
    },
    data: {
      status,
    },
  });

  return updatedProduct.status;
};
