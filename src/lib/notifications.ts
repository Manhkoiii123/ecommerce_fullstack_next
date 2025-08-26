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
    | "SYSTEM_UPDATE";
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
        title: "Đơn hàng mới! 🎉",
        message: `${customerName} đã đặt đơn hàng mới với ${itemCount} sản phẩm trị giá $${orderTotal.toFixed(
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
          productName: firstProduct?.name || "Nhiều sản phẩm",
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
      title: "Đặt hàng thành công! ✅",
      message: `Đơn hàng của bạn đã được đặt thành công. Mã đơn hàng: ${orderId}`,
      userId,
      orderId,
      createdAt: new Date(),
      data: {
        orderId,
        orderTotal: totalOrderAmount,
        itemCount: totalItemCount,
        estimatedDelivery: `${Math.min(
          ...order.groups.map((g) => g.shippingDeliveryMin)
        )}-${Math.max(...order.groups.map((g) => g.shippingDeliveryMax))} ngày`,
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
  oldStatus?: string
) {
  try {
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
        message = `The status of order #${orderId} has changed from ${oldStatus} to ${newStatus}.`;
    }

    const storeNotifications: CreateNotificationData[] = order.groups.map(
      (group) => ({
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
      })
    );

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
  storeId: string,
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
          where: { storeId },
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
      title = "Thanh toán thành công! 💰";
      message = `Đơn hàng #${orderId} đã được thanh toán thành công qua ${paymentMethod}.`;
    } else if (paymentStatus === "Failed") {
      title = "Thanh toán thất bại! ❌";
      message = `Thanh toán cho đơn hàng #${orderId} đã thất bại. Vui lòng thử lại.`;
      notificationType = "PAYMENT_FAILED";
    } else if (paymentStatus === "Refunded") {
      title = "Hoàn tiền thành công! 💸";
      message = `Đơn hàng #${orderId} đã được hoàn tiền thành công.`;
    }

    // Notification cho chủ shop
    const storeNotificationData: CreateNotificationData = {
      type: notificationType,
      title: `Thanh toán - ${paymentStatus}`,
      message: `Đơn hàng #${orderId} của ${customerName} ($${amount.toFixed(
        2
      )}) - ${paymentStatus} qua ${paymentMethod}.`,
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
    };

    // Notification cho khách hàng
    const customerNotificationData: CreateNotificationData = {
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

    // Tạo cả hai notification
    await Promise.all([
      createNotification(storeNotificationData),
      createNotification(customerNotificationData),
    ]);

    return {
      storeNotification: storeNotificationData,
      customerNotification: customerNotificationData,
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
