import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import {
  createNewOrderNotification,
  createOrderStatusChangeNotification,
} from "../../../../lib/notifications";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, orderId, userId, newStatus } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Notification type missing" });
    }

    let notificationResult;

    if (type === "NEW_ORDER") {
      if (!orderId || !userId) {
        return res
          .status(400)
          .json({ error: "Missing orderId, storeId or userId" });
      }

      notificationResult = await createNewOrderNotification(orderId, userId);
    }

    if (type === "ORDER_STATUS_CHANGE") {
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
    }

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
        notificationResult?.customerNotification
      );
    }

    return res.status(200).json(notificationResult);
  } catch (error) {
    console.log("[NOTIFICATIONS_POST]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
