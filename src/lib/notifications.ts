import { db } from "./db";

export interface CreateNotificationData {
  type:
    | "NEW_ORDER"
    | "ORDER_STATUS_CHANGE"
    | "PAYMENT_RECEIVED"
    | "PAYMENT_FAILED"
    | "ORDER_SHIPPED"
    | "ORDER_DELIVERED"
    | "ORDER_CANCELLED"
    | "LOW_STOCK"
    | "REVIEW_RECEIVED"
    | "SYSTEM_UPDATE"
    | "NEW_STORE_PENDING"
    | "STORE_APPROVED";
  title: string;
  message: string;
  storeId?: string;
  userId?: string;
  orderId?: string;
  data?: any;
  createdAt?: Date;
}

export async function createNotification(
  notificationData: CreateNotificationData
) {
  try {
    const notification = await db.notification.create({
      data: {
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        storeId: notificationData.storeId,
        userId: notificationData.userId,
        orderId: notificationData.orderId,
        data: notificationData.data,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Notification khi đặt hàng mới
export async function createNewOrderNotification(
  orderId: string,
  userId: string
) {
  try {
    // Lấy thông tin đơn hàng
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
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

    const customerName =
      order.user.name !== "null null" ? order.user.name : order.user.email;

    // Tạo notification cho từng store
    const storeNotifications: CreateNotificationData[] = [];
    for (const orderGroup of order.groups) {
      const storeId = orderGroup.storeId;
      const orderTotal = orderGroup.total;
      const itemCount = orderGroup.items.length;
      const firstProduct = orderGroup.items[0];

      const storeNotificationData: CreateNotificationData = {
        type: "NEW_ORDER",
        title: "New order! 🎉",
        message: `${customerName} has placed a new order with ${itemCount} items worth $${orderTotal.toFixed(
          2
        )}.`,

        storeId,
        orderId,
        createdAt: new Date(),
        data: {
          orderId,
          customerName,
          orderTotal,
          itemCount,
          productName: firstProduct?.name || "Many items",
          customerEmail: order.user.email,
        },
      };

      storeNotifications.push(storeNotificationData);
    }

    // Notification cho khách hàng (chung, 1 bản)
    const totalItemCount = order.groups.reduce(
      (sum, g) => sum + g.items.length,
      0
    );
    const totalOrderAmount = order.groups.reduce((sum, g) => sum + g.total, 0);

    const customerNotificationData: CreateNotificationData = {
      type: "NEW_ORDER",
      title: "Order placed successfully! ✅",
      message: `Your order has been placed successfully. Order ID: ${orderId}`,
      userId,
      orderId,
      createdAt: new Date(),
      data: {
        orderId,
        orderTotal: totalOrderAmount,
        itemCount: totalItemCount,
        estimatedDelivery: `${Math.min(
          ...order.groups.map((g) => g.shippingDeliveryMin)
        )}-${Math.max(...order.groups.map((g) => g.shippingDeliveryMax))} days`,
      },
    };

    // Tạo notification trong DB
    await Promise.all([
      ...storeNotifications.map((storeNotification) =>
        createNotification(storeNotification)
      ),
      createNotification(customerNotificationData),
    ]);

    return {
      storeNotifications,
      customerNotification: customerNotificationData,
    };
  } catch (error) {
    console.error("Error creating new order notification:", error);
    throw error;
  }
}

export async function createOrderStatusChangeNotification(
  orderId: string,
  userId: string,
  newStatus: string,
  oldStatus?: string,
  orderGroupId?: string
) {
  try {
    let orderGroup = null;
    if (orderGroupId) {
      orderGroup = await db.orderGroup.findUnique({
        where: { id: orderGroupId },
        include: {
          items: true,
        },
      });
    }
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
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

    const customerName =
      order.user.name !== "null null" ? order.user.name : order.user.email;

    let title = "";
    let message = "";
    let notificationType: CreateNotificationData["type"] =
      "ORDER_STATUS_CHANGE";

    switch (newStatus) {
      case "Confirmed":
        title = "Order confirmed ✅";
        message = `Order #${orderId} has been confirmed and is being processed.`;
        break;
      case "Processing":
        title = "Order processing 🔄";
        message = `Order #${orderId} is being prepared for shipment.`;
        break;
      case "Shipped":
        title = "Order shipped 📦";
        message = `Order #${orderId} has been shipped and is on the way.`;
        notificationType = "ORDER_SHIPPED";
        break;
      case "OutforDelivery":
        title = "Out for delivery 🚚";
        message = `Order #${orderId} is out for delivery to your address.`;
        break;
      case "Delivered":
        title = "Order delivered 🎉";
        message = `Order #${orderId} has been delivered successfully. Thank you for your purchase!`;
        notificationType = "ORDER_DELIVERED";
        break;
      case "Cancelled":
        title = "Order cancelled ❌";
        message = `Order #${orderId} has been cancelled. Please contact us if you have any questions.`;
        notificationType = "ORDER_CANCELLED";
        break;
      default:
        title = "Order status updated 📝";
        message = `The status of order #${orderId} has changed to ${newStatus}.`;
    }

    const storeNotifications: CreateNotificationData[] =
      orderGroupId && orderGroup
        ? [
            {
              type: notificationType,
              title: `Order status changed - ${newStatus}`,
              message: `Order #${orderId} from ${customerName} ($${orderGroup.total.toFixed(
                2
              )}) is now ${newStatus}.`,
              storeId: orderGroup.storeId,
              orderId,
              createdAt: new Date(),
              data: {
                orderGroupId,
                customerName,
                orderTotal: orderGroup.total,
                oldStatus,
                newStatus,
              },
            },
          ]
        : order.groups.map((group) => ({
            type: notificationType,
            title: `Order status changed - ${newStatus}`,
            message: `Order #${orderId} from ${customerName} ($${group.total.toFixed(
              2
            )}) is now ${newStatus}.`,
            storeId: group.storeId,
            orderId,
            createdAt: new Date(),
            data: {
              orderId,
              customerName,
              orderTotal: group.total,
              oldStatus,
              newStatus,
            },
          }));

    const customerNotificationData: CreateNotificationData = {
      type: notificationType,
      title,
      message,
      userId,
      orderId,
      createdAt: new Date(),
      data: {
        orderId,
        oldStatus,
        newStatus,
        orderTotal: order.groups.reduce((sum, g) => sum + g.total, 0),
      },
    };

    await Promise.all([
      ...storeNotifications.map((sn) => createNotification(sn)),
      createNotification(customerNotificationData),
    ]);

    return {
      storeNotifications,
      customerNotification: customerNotificationData,
    };
  } catch (error) {
    console.error("Error creating order status change notification:", error);
    throw error;
  }
}

// Notification khi thanh toán
export async function createPaymentNotification(
  orderId: string,
  userId: string,
  paymentStatus: string,
  amount: number,
  paymentMethod: string
) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        groups: {
          include: {
            store: true, // lấy thông tin store
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const customerName =
      order.user.name !== "null null" ? order.user.name : order.user.email;

    let title = "";
    let message = "";
    let notificationType: CreateNotificationData["type"] = "PAYMENT_RECEIVED";

    if (paymentStatus === "Paid") {
      title = "Payment successful! ";
      message = `Order #${orderId} has been successfully paid via ${paymentMethod}.`;
    } else if (paymentStatus === "Failed") {
      title = "Payment failed! ";
      message = `Payment for order #${orderId} has failed. Please try again.`;
      notificationType = "PAYMENT_FAILED";
    } else if (paymentStatus === "Refunded") {
      title = "Refund successful! ";
      message = `Order #${orderId} has been successfully refunded.`;
    }

    const storeNotifications = order.groups
      .filter((group) => group.status !== "Cancelled")
      .map((group) => {
        const storeId = group.storeId;

        return {
          type: notificationType,
          title: `Payment - ${paymentStatus}`,
          message: `Order #${orderId} for ${customerName} ($${amount.toFixed(
            2
          )}) - ${paymentStatus} via ${paymentMethod}.`,

          storeId,
          orderId,
          createdAt: new Date(),
          data: {
            orderId,
            customerName,
            amount,
            paymentStatus,
            paymentMethod,
          },
        } satisfies CreateNotificationData;
      });

    // 🔹 Notification cho khách hàng
    const customerNotification: CreateNotificationData = {
      type: notificationType,
      title,
      message,
      userId,
      orderId,
      createdAt: new Date(),
      data: {
        orderId,
        amount,
        paymentStatus,
        paymentMethod,
      },
    };

    // Tạo tất cả notifications
    await Promise.all([
      ...storeNotifications.map((n) => createNotification(n)),
      createNotification(customerNotification),
    ]);

    return {
      storeNotifications,
      customerNotification,
    };
  } catch (error) {
    console.error("Error creating payment notification:", error);
    throw error;
  }
}

// Lấy notification của store
export async function getStoreNotifications(
  storeId: string,
  limit: number = 50
) {
  try {
    const notifications = await db.notification.findMany({
      where: {
        storeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error("Error fetching store notifications:", error);
    throw error;
  }
}

// Lấy notification của user
export async function getUserNotifications(userId: string, limit: number = 50) {
  try {
    const notifications = await db.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    throw error;
  }
}

// Đánh dấu notification đã đọc
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await db.notification.update({
      where: { id: notificationId },
      data: { status: "READ" },
    });

    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

// Đếm số notification chưa đọc của store
export async function getUnreadNotificationCount(storeId: string) {
  try {
    const count = await db.notification.count({
      where: {
        storeId,
        status: "UNREAD",
      },
    });

    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    throw error;
  }
}

// Đếm số notification chưa đọc của user
export async function getUserUnreadNotificationCount(userId: string) {
  try {
    const count = await db.notification.count({
      where: {
        userId,
        status: "UNREAD",
      },
    });

    return count;
  } catch (error) {
    console.error("Error getting user unread notification count:", error);
    throw error;
  }
}

// Helper to trigger socket emission (best effort, won't fail if unavailable)
async function triggerSocketEmission(notifications: any[], type: string) {
  // Only try if we have a base URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    console.log("⏭️ No NEXT_PUBLIC_SITE_URL, skipping socket emission");
    return;
  }

  try {
    // Use setTimeout to make it non-blocking
    setTimeout(async () => {
      try {
        const response = await fetch(
          `${baseUrl}/api/socket/notifications/emit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notifications, type }),
          }
        );

        if (response.ok) {
          console.log(`✅ Socket emission triggered for ${type}`);
        }
      } catch (err) {
        console.log("⏭️ Socket emission skipped (expected in some contexts)");
      }
    }, 0);
  } catch (error) {
    // Silent fail - socket is optional
  }
}

// Notification khi người dùng tạo store mới (gửi cho admin)
export async function createNewStorePendingNotification(
  storeId: string,
  userId: string,
  storeName: string
) {
  try {
    // Lấy danh sách admin
    const admins = await db.user.findMany({
      where: {
        role: "ADMIN",
      },
    });

    if (admins.length === 0) {
      console.log("No admins found to notify");
      return { adminNotifications: [] };
    }

    // Tạo notification cho từng admin
    const adminNotifications = await Promise.all(
      admins.map((admin) =>
        createNotification({
          type: "NEW_STORE_PENDING",
          title: "New store pending approval! 🏪",
          message: `The store "${storeName}" has been created and is pending approval.`,
          userId: admin.id,
          storeId,
          createdAt: new Date(),
          data: {
            storeId,
            storeName,
            sellerId: userId,
            status: "PENDING",
          },
        })
      )
    );

    const result = adminNotifications.map((notification) => ({
      id: notification.id,
      type: "NEW_STORE_PENDING" as const,
      title: notification.title,
      message: notification.message,
      userId: notification.userId,
      storeId: notification.storeId,
      createdAt: notification.createdAt,
      data: notification.data,
      status: notification.status,
    }));

    // Try to emit socket events (non-blocking, best effort)
    triggerSocketEmission(result, "NEW_STORE_PENDING");

    return { adminNotifications: result };
  } catch (error) {
    console.error("Error creating new store pending notification:", error);
    throw error;
  }
}

export async function createStoreApprovedNotification(
  storeId: string,
  userId: string,
  storeName: string
) {
  try {
    const sellerNotificationData: CreateNotificationData = {
      type: "STORE_APPROVED",
      title: "Store approved! 🎉",
      message: `Congratulations! Your store "${storeName}" has been approved and is now active.`,
      userId,
      storeId,
      createdAt: new Date(),
      data: {
        storeId,
        storeName,
        status: "ACTIVE",
      },
    };

    const sellerNotification = await createNotification(sellerNotificationData);

    const result = {
      id: sellerNotification.id,
      type: sellerNotification.type as "STORE_APPROVED",
      title: sellerNotification.title,
      message: sellerNotification.message,
      userId: sellerNotification.userId,
      storeId: sellerNotification.storeId,
      createdAt: sellerNotification.createdAt,
      data: sellerNotification.data,
      status: sellerNotification.status,
    };

    // Try to emit socket event (non-blocking, best effort)
    triggerSocketEmission([result], "STORE_APPROVED");

    return {
      sellerNotification: result,
    };
  } catch (error) {
    console.error("Error creating store approved notification:", error);
    throw error;
  }
}
