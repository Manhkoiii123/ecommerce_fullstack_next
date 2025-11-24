import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import {
  createNewOrderNotification,
  createOrderStatusChangeNotification,
  createPaymentNotification,
  createNewStorePendingNotification,
  createStoreApprovedNotification,
} from "../../../../lib/notifications";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      type,
      orderId,
      userId,
      newStatus,
      paymentStatus,
      amount,
      paymentMethod,
      storeId,
      storeName,
    } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Notification type missing" });
    }

    let notificationResult: any;

    if (type === "NEW_ORDER") {
      if (!orderId || !userId) {
        return res
          .status(400)
          .json({ error: "Missing orderId, storeId or userId" });
      }

      notificationResult = await createNewOrderNotification(orderId, userId);

      // Emit notifications for order
      if (notificationResult?.storeNotifications) {
        for (const storeNotification of notificationResult.storeNotifications) {
          if (storeNotification.storeId) {
            res?.socket?.server?.io?.emit(
              `notifications:store:${storeNotification.storeId}`,
              storeNotification
            );
          }
        }
      }

      if (notificationResult?.customerNotification) {
        res?.socket?.server?.io?.emit(
          `notifications:user:${userId}`,
          notificationResult.customerNotification
        );
      }
    } else if (type === "ORDER_STATUS_CHANGE") {
      if (!orderId || !userId || !newStatus) {
        return res.status(400).json({
          error: "Missing orderId, userId or newStatus",
        });
      }

      notificationResult = await createOrderStatusChangeNotification(
        orderId,
        userId,
        newStatus
      );

      // Emit notifications for order status change
      if (notificationResult?.storeNotifications) {
        for (const storeNotification of notificationResult.storeNotifications) {
          if (storeNotification.storeId) {
            res?.socket?.server?.io?.emit(
              `notifications:store:${storeNotification.storeId}`,
              storeNotification
            );
          }
        }
      }

      if (notificationResult?.customerNotification) {
        res?.socket?.server?.io?.emit(
          `notifications:user:${userId}`,
          notificationResult.customerNotification
        );
      }
    } else if (type === "PAYMENT_RECEIVED" || type === "PAYMENT_FAILED") {
      if (!orderId || !userId) {
        return res.status(400).json({
          error: "Missing orderId, userId or paymentStatus",
        });
      }

      notificationResult = await createPaymentNotification(
        orderId,
        userId,
        paymentStatus,
        amount,
        paymentMethod
      );

      // Emit notifications for payment
      if (notificationResult?.storeNotifications) {
        for (const storeNotification of notificationResult.storeNotifications) {
          if (storeNotification.storeId) {
            res?.socket?.server?.io?.emit(
              `notifications:store:${storeNotification.storeId}`,
              storeNotification
            );
          }
        }
      }

      if (notificationResult?.customerNotification) {
        res?.socket?.server?.io?.emit(
          `notifications:user:${userId}`,
          notificationResult.customerNotification
        );
      }
    } else if (type === "NEW_STORE_PENDING") {
      if (!storeId || !userId || !storeName) {
        return res.status(400).json({
          error: "Missing storeId, userId or storeName",
        });
      }

      notificationResult = await createNewStorePendingNotification(
        storeId,
        userId,
        storeName
      );

      // Emit notification cho admin khi có store mới
      if (notificationResult?.adminNotifications) {
        for (const adminNotification of notificationResult.adminNotifications) {
          if (adminNotification.userId) {
            res?.socket?.server?.io?.emit(
              `notifications:user:${adminNotification.userId}`,
              adminNotification
            );
          }
        }
      }
    } else if (type === "STORE_APPROVED") {
      if (!storeId || !userId || !storeName) {
        return res.status(400).json({
          error: "Missing storeId, userId or storeName",
        });
      }

      notificationResult = await createStoreApprovedNotification(
        storeId,
        userId,
        storeName
      );

      // Emit notification cho seller khi store được approve
      if (notificationResult?.sellerNotification) {
        res?.socket?.server?.io?.emit(
          `notifications:user:${notificationResult.sellerNotification.userId}`,
          notificationResult.sellerNotification
        );
      }
    }

    return res.status(200).json(notificationResult);
  } catch (error) {
    console.log("[NOTIFICATIONS_POST]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
