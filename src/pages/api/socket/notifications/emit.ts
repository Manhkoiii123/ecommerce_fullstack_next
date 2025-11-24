import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";

/**
 * API endpoint to emit socket notifications
 * Called after notifications are created in DB
 * to trigger real-time push to connected clients
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { notifications, type } = req.body;

    if (!notifications || !Array.isArray(notifications)) {
      return res.status(400).json({ error: "Invalid notifications data" });
    }

    const io = res?.socket?.server?.io;

    if (!io) {
      console.log("⚠️ Socket.io not initialized");
      return res
        .status(200)
        .json({ success: false, message: "Socket.io not available" });
    }

    let emittedCount = 0;

    // Emit each notification to the appropriate channel
    for (const notification of notifications) {
      try {
        if (notification.userId) {
          io.emit(
            `notifications:user:${notification.userId}`,
            notification
          );
          console.log(
            `✅ Emitted ${type} notification to user ${notification.userId}`
          );
          emittedCount++;
        }

        if (notification.storeId) {
          io.emit(
            `notifications:store:${notification.storeId}`,
            notification
          );
          console.log(
            `✅ Emitted ${type} notification to store ${notification.storeId}`
          );
          emittedCount++;
        }
      } catch (emitError) {
        console.error(
          `Error emitting notification ${notification.id}:`,
          emitError
        );
      }
    }

    return res.status(200).json({
      success: true,
      emittedCount,
      message: `Emitted ${emittedCount} socket events`,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_EMIT]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
