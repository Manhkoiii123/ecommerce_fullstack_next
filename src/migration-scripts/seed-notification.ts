import { db } from "../lib/db";

export async function duplicateNotification(id: string) {
  const notif = await db.notification.findUnique({ where: { id } });
  if (!notif) return;

  for (let i = 0; i < 30; i++) {
    await db.notification.create({
      data: {
        type: notif.type,
        title: notif.title,
        message: notif.message,
        status: notif.status,
        userId: notif.userId ?? undefined, // null → undefined
        storeId: notif.storeId ?? undefined,
        orderId: notif.orderId ?? undefined,
        data: notif.data ?? undefined, // null → undefined
      },
    });
  }
}
