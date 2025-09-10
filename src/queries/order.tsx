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

export const updateOrderShippingAddress = async (
  orderId: string,
  shippingAddressData: {
    countryId: string;
    firstName: string;
    lastName: string;
    phone: string;
    address1: string;
    address2?: string;
    state: string;
    city: string;
    zip_code: string;
  }
) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  // Validate input data
  const { ShippingAddressSchema } = await import("@/lib/schemas");
  const validatedData = ShippingAddressSchema.parse(shippingAddressData);

  // Get the order with current status
  const order = await db.order.findUnique({
    where: {
      id: orderId,
      userId: user.id, // Ensure user can only update their own orders
    },
    include: {
      groups: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error(
      "Order not found or you don't have permission to update this order."
    );
  }

  // Check if order status allows address update
  const allowedStatuses: string[] = [
    "Pending",
    "Confirmed",
    "Processing",
    "OnHold",
  ];

  if (!allowedStatuses.includes(order.orderStatus)) {
    throw new Error(
      `Cannot update shipping address. Order status must be one of: ${allowedStatuses.join(
        ", "
      )}. Current status: ${order.orderStatus}`
    );
  }

  // Check if any order group has items that are already shipped
  const hasShippedItems = order.groups.some((group) =>
    group.items.some((item) =>
      ["Shipped", "Delivered", "ReadyForShipment"].includes(item.status)
    )
  );

  if (hasShippedItems) {
    throw new Error(
      "Cannot update shipping address. Some items in this order are already shipped or ready for shipment."
    );
  }

  // Create new shipping address
  const newShippingAddress = await db.shippingAddress.create({
    data: {
      ...validatedData,
      userId: user.id,
      default: false, // Don't set as default when updating order address
    },
  });

  // Update the order with new shipping address
  const updatedOrder = await db.order.update({
    where: { id: orderId },
    data: {
      shippingAddressId: newShippingAddress.id,
      updatedAt: new Date(),
    },
    include: {
      shippingAddress: {
        include: {
          country: true,
        },
      },
    },
  });

  // Revalidate the order page to update UI
  revalidatePath(`/order/${orderId}`);

  return {
    success: true,
    message: "Shipping address updated successfully",
    orderId,
    updatedAt: new Date(),
    newShippingAddress: updatedOrder.shippingAddress,
  };
};
