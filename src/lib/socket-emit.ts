// Socket emission helper
// This module handles emitting socket events for real-time notifications

interface NotificationData {
  id?: string;
  type: string;
  title: string;
  message: string;
  userId: string | null;
  storeId: string | null;
  createdAt: Date;
  data: any;
  status?: string;
}

/**
 * Get socket.io server instance from global
 * Only available in API routes context
 */
function getSocketServer() {
  // @ts-ignore
  const io = global.io;
  if (!io) {
    console.log("⏭️ Socket.io server not available in this context");
    return null;
  }
  return io;
}

/**
 * Emit notification socket events to specific users
 */
export async function emitSocketNotifications(
  notifications: NotificationData[]
) {
  const io = getSocketServer();

  if (!io) {
    // Socket not available (normal in Server Actions)
    // Client will poll/refetch to get new notifications
    return false;
  }

  try {
    for (const notification of notifications) {
      if (notification.userId) {
        io.emit(`notifications:user:${notification.userId}`, notification);
        console.log(`✅ Emitted notification to user ${notification.userId}`);
      }

      if (notification.storeId) {
        io.emit(`notifications:store:${notification.storeId}`, notification);
        console.log(`✅ Emitted notification to store ${notification.storeId}`);
      }
    }
    return true;
  } catch (error) {
    console.error("Error emitting socket notifications:", error);
    return false;
  }
}

/**
 * Emit single notification
 */
export async function emitSocketNotification(notification: NotificationData) {
  return emitSocketNotifications([notification]);
}
