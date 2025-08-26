"use server";

import { db } from "@/lib/db";
import { OrderStatus, ProductStatus } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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

export const cancelOrder = async (orderId: string) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

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

  if (!order) throw new Error("Order not found.");

  if (order.userId !== user.id) {
    throw new Error("Permission denied: You can only cancel your own orders.");
  }

  // Kiểm tra cả orderStatus và paymentStatus
  if (
    order.orderStatus === "Cancelled" &&
    order.paymentStatus === "Cancelled"
  ) {
    throw new Error("Order is already cancelled.");
  }

  // Chỉ cho phép hủy order chưa thanh toán hoặc đã bị hủy trước đó
  if (order.paymentStatus === "Paid") {
    throw new Error("Cannot cancel a paid order.");
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: "Cancelled",
        paymentStatus: "Cancelled",
        updatedAt: new Date(),
      },
    });

    await tx.orderGroup.updateMany({
      where: { orderId },
      data: {
        status: "Cancelled",
        updatedAt: new Date(),
      },
    });

    await tx.orderItem.updateMany({
      where: {
        orderGroupId: {
          in: order.groups.map((group) => group.id),
        },
      },
      data: {
        status: "Cancelled",
        updatedAt: new Date(),
      },
    });

    // Chỉ khôi phục inventory nếu order chưa bị hủy trước đó
    if (order.orderStatus !== "Cancelled") {
      for (const group of order.groups) {
        for (const item of group.items) {
          await tx.size.update({
            where: { id: item.sizeId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: {
              sales: {
                decrement: item.quantity,
              },
            },
          });
        }
      }
    }
  });

  // Revalidate trang order để cập nhật UI
  revalidatePath(`/order/${orderId}`);

  return {
    success: true,
    message: `Order ${orderId} cancelled successfully`,
    orderId,
    cancelledAt: new Date(),
    userId: user.id,
  };
};
