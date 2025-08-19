import { db } from "./db";
import socketManager from "./socket";
import { NotificationType, NotificationStatus } from "@prisma/client";

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  storeId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
}

class NotificationService {
  // Create notification and send via socket
  async createAndSend(data: CreateNotificationData): Promise<void> {
    try {
      // Create notification in database
      const notification = await db.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          userId: data.userId,
          storeId: data.storeId,
          orderId: data.orderId,
          metadata: data.metadata || {},
        },
      });

      // Send via socket
      await this.sendNotification(notification);

      console.log(`Notification created and sent: ${notification.id}`);
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Send notification via socket
  private async sendNotification(notification: any): Promise<void> {
    const payload: NotificationPayload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
    };

    // Send to user if specified
    if (notification.userId) {
      socketManager.sendToUser(notification.userId, "notification", payload);
    }

    // Send to store if specified
    if (notification.storeId) {
      socketManager.sendToStore(notification.storeId, "notification", payload);
    }
  }

  // Order placed notification
  async notifyOrderPlaced(
    orderId: string,
    userId: string,
    storeId: string,
    orderData: any
  ): Promise<void> {
    const userNotification: CreateNotificationData = {
      type: "ORDER_PLACED",
      title: "Đặt hàng thành công!",
      message: `Đơn hàng #${orderId} của bạn đã được đặt thành công. Chúng tôi sẽ xử lý và gửi hàng sớm nhất có thể.`,
      userId,
      orderId,
      metadata: {
        orderId,
        total: orderData.total,
        itemsCount: orderData.itemsCount,
      },
    };

    const storeNotification: CreateNotificationData = {
      type: "ORDER_PLACED",
      title: "Đơn hàng mới!",
      message: `Bạn có đơn hàng mới #${orderId} với giá trị ${orderData.total.toLocaleString(
        "vi-VN"
      )}đ.`,
      storeId,
      orderId,
      metadata: {
        orderId,
        total: orderData.total,
        customerName: orderData.customerName,
      },
    };

    await Promise.all([
      this.createAndSend(userNotification),
      this.createAndSend(storeNotification),
    ]);
  }

  // Order status changed notification
  async notifyOrderStatusChanged(
    orderId: string,
    userId: string,
    storeId: string,
    oldStatus: string,
    newStatus: string,
    orderData: any
  ): Promise<void> {
    const statusMessages = {
      Confirmed: "Đơn hàng đã được xác nhận",
      Processing: "Đơn hàng đang được xử lý",
      Shipped: "Đơn hàng đã được gửi",
      OutforDelivery: "Đơn hàng đang được giao",
      Delivered: "Đơn hàng đã được giao thành công",
      Cancelled: "Đơn hàng đã bị hủy",
      Failed: "Đơn hàng giao thất bại",
      Refunded: "Đơn hàng đã được hoàn tiền",
      Returned: "Đơn hàng đã được trả lại",
    };

    const userNotification: CreateNotificationData = {
      type: "ORDER_STATUS_CHANGED",
      title: "Trạng thái đơn hàng thay đổi",
      message: `${
        statusMessages[newStatus as keyof typeof statusMessages] ||
        "Trạng thái đơn hàng đã thay đổi"
      }. Đơn hàng #${orderId}`,
      userId,
      orderId,
      metadata: {
        orderId,
        oldStatus,
        newStatus,
        total: orderData.total,
      },
    };

    const storeNotification: CreateNotificationData = {
      type: "ORDER_STATUS_CHANGED",
      title: "Cập nhật trạng thái đơn hàng",
      message: `Đơn hàng #${orderId} đã được cập nhật từ "${oldStatus}" sang "${newStatus}"`,
      storeId,
      orderId,
      metadata: {
        orderId,
        oldStatus,
        newStatus,
        customerName: orderData.customerName,
      },
    };

    await Promise.all([
      this.createAndSend(userNotification),
      this.createAndSend(storeNotification),
    ]);
  }

  // Payment status changed notification
  async notifyPaymentStatusChanged(
    orderId: string,
    userId: string,
    storeId: string,
    oldStatus: string,
    newStatus: string,
    paymentData: any
  ): Promise<void> {
    const paymentMessages = {
      Paid: "Thanh toán thành công",
      Failed: "Thanh toán thất bại",
      Declined: "Thanh toán bị từ chối",
      Cancelled: "Thanh toán bị hủy",
      Refunded: "Đã hoàn tiền",
      PartiallyRefunded: "Đã hoàn tiền một phần",
      Chargeback: "Yêu cầu hoàn tiền",
    };

    const userNotification: CreateNotificationData = {
      type: "PAYMENT_STATUS_CHANGED",
      title: "Trạng thái thanh toán thay đổi",
      message: `${
        paymentMessages[newStatus as keyof typeof paymentMessages] ||
        "Trạng thái thanh toán đã thay đổi"
      } cho đơn hàng #${orderId}`,
      userId,
      orderId,
      metadata: {
        orderId,
        oldStatus,
        newStatus,
        amount: paymentData.amount,
      },
    };

    const storeNotification: CreateNotificationData = {
      type: "PAYMENT_STATUS_CHANGED",
      title: "Cập nhật trạng thái thanh toán",
      message: `Thanh toán cho đơn hàng #${orderId} đã thay đổi từ "${oldStatus}" sang "${newStatus}"`,
      storeId,
      orderId,
      metadata: {
        orderId,
        oldStatus,
        newStatus,
        amount: paymentData.amount,
      },
    };

    await Promise.all([
      this.createAndSend(userNotification),
      this.createAndSend(storeNotification),
    ]);
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    return await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  // Get store notifications
  async getStoreNotifications(
    storeId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    return await db.notification.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    await db.notification.update({
      where: { id: notificationId },
      data: { status: "READ" },
    });
  }

  // Mark all user notifications as read
  async markAllUserNotificationsAsRead(userId: string): Promise<void> {
    await db.notification.updateMany({
      where: { userId, status: "UNREAD" },
      data: { status: "READ" },
    });
  }

  // Mark all store notifications as read
  async markAllStoreNotificationsAsRead(storeId: string): Promise<void> {
    await db.notification.updateMany({
      where: { storeId, status: "UNREAD" },
      data: { status: "READ" },
    });
  }

  // Get unread count for user
  async getUnreadCount(userId: string): Promise<number> {
    return await db.notification.count({
      where: { userId, status: "UNREAD" },
    });
  }

  // Get unread count for store
  async getStoreUnreadCount(storeId: string): Promise<number> {
    return await db.notification.count({
      where: { storeId, status: "UNREAD" },
    });
  }

  // Delete old notifications (cleanup)
  async cleanupOldNotifications(daysOld: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await db.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: "ARCHIVED",
      },
    });
  }

  // Order cancelled notification
  async notifyOrderCancelled(
    orderId: string,
    userId: string,
    storeId: string,
    orderData: any
  ): Promise<void> {
    const userNotification: CreateNotificationData = {
      type: "ORDER_CANCELLED",
      title: "Đơn hàng đã bị hủy",
      message: `Đơn hàng #${orderId} của bạn đã được hủy thành công. Số tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc.`,
      userId,
      orderId,
      metadata: {
        orderId,
        total: orderData.total,
        cancelledAt: new Date().toISOString(),
      },
    };

    const storeNotification: CreateNotificationData = {
      type: "ORDER_CANCELLED",
      title: "Đơn hàng đã bị hủy",
      message: `Đơn hàng #${orderId} đã được khách hàng hủy. Số lượng sản phẩm đã được khôi phục vào kho.`,
      storeId,
      orderId,
      metadata: {
        orderId,
        customerName: orderData.customerName,
        total: orderData.total,
        cancelledAt: new Date().toISOString(),
      },
    };

    await Promise.all([
      this.createAndSend(userNotification),
      this.createAndSend(storeNotification),
    ]);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
