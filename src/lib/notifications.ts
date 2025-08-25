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
  storeId: string,
  userId: string
) {
  try {
    // Lấy thông tin đơn hàng
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        groups: {
          where: { storeId },
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const orderGroup = order.groups[0];
    if (!orderGroup) {
      throw new Error("Order group not found");
    }

    const customerName = order.user.name;
    const orderTotal = orderGroup.total;
    const itemCount = orderGroup.items.length;
    const firstProduct = orderGroup.items[0];

    // Notification cho chủ shop
    const storeNotificationData: CreateNotificationData = {
      type: "NEW_ORDER",
      title: "Đơn hàng mới! 🎉",
      message: `${customerName} đã đặt đơn hàng mới với ${itemCount} sản phẩm trị giá $${orderTotal.toFixed(
        2
      )}.`,
      storeId,
      orderId,
      data: {
        orderId,
        customerName,
        orderTotal,
        itemCount,
        productName: firstProduct?.name || "Nhiều sản phẩm",
        customerEmail: order.user.email,
      },
    };

    // Notification cho khách hàng
    const customerNotificationData: CreateNotificationData = {
      type: "NEW_ORDER",
      title: "Đặt hàng thành công! ✅",
      message: `Đơn hàng của bạn đã được đặt thành công. Mã đơn hàng: ${orderId}`,
      userId,
      orderId,
      data: {
        orderId,
        orderTotal,
        itemCount,
        estimatedDelivery: `${orderGroup.shippingDeliveryMin}-${orderGroup.shippingDeliveryMax} ngày`,
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
    console.error("Error creating new order notification:", error);
    throw error;
  }
}

// Notification khi thay đổi trạng thái đơn hàng
export async function createOrderStatusChangeNotification(
  orderId: string,
  storeId: string,
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
          where: { storeId },
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const orderGroup = order.groups[0];
    if (!orderGroup) {
      throw new Error("Order group not found");
    }

    const customerName = order.user.name;
    const orderTotal = orderGroup.total;

    // Tạo message dựa trên trạng thái mới
    let title = "";
    let message = "";
    let notificationType: CreateNotificationData["type"] =
      "ORDER_STATUS_CHANGE";

    switch (newStatus) {
      case "Confirmed":
        title = "Đơn hàng đã được xác nhận! ✅";
        message = `Đơn hàng #${orderId} đã được xác nhận và đang được xử lý.`;
        break;
      case "Processing":
        title = "Đơn hàng đang được xử lý! 🔄";
        message = `Đơn hàng #${orderId} đang được chuẩn bị để giao hàng.`;
        break;
      case "Shipped":
        title = "Đơn hàng đã được gửi! 📦";
        message = `Đơn hàng #${orderId} đã được gửi và đang trên đường đến bạn.`;
        notificationType = "ORDER_SHIPPED";
        break;
      case "OutforDelivery":
        title = "Đơn hàng đang giao! 🚚";
        message = `Đơn hàng #${orderId} đang được giao đến địa chỉ của bạn.`;
        break;
      case "Delivered":
        title = "Đơn hàng đã được giao! 🎉";
        message = `Đơn hàng #${orderId} đã được giao thành công. Cảm ơn bạn đã mua hàng!`;
        notificationType = "ORDER_DELIVERED";
        break;
      case "Cancelled":
        title = "Đơn hàng đã bị hủy! ❌";
        message = `Đơn hàng #${orderId} đã bị hủy. Liên hệ với chúng tôi nếu bạn có thắc mắc.`;
        notificationType = "ORDER_CANCELLED";
        break;
      default:
        title = "Trạng thái đơn hàng đã thay đổi! 📝";
        message = `Trạng thái đơn hàng #${orderId} đã thay đổi từ ${oldStatus} thành ${newStatus}.`;
    }

    // Notification cho chủ shop
    const storeNotificationData: CreateNotificationData = {
      type: notificationType,
      title: `Trạng thái đơn hàng thay đổi - ${newStatus}`,
      message: `Đơn hàng #${orderId} của ${customerName} ($${orderTotal.toFixed(
        2
      )}) đã thay đổi trạng thái thành ${newStatus}.`,
      storeId,
      orderId,
      data: {
        orderId,
        customerName,
        orderTotal,
        oldStatus,
        newStatus,
      },
    };

    // Notification cho khách hàng
    const customerNotificationData: CreateNotificationData = {
      type: notificationType,
      title,
      message,
      userId,
      orderId,
      data: {
        orderId,
        oldStatus,
        newStatus,
        orderTotal: orderGroup.total,
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

    const customerName = order.user.name;

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
