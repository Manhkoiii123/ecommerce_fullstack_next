import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/lib/notification-service";

// POST /api/notifications/payment-status-changed - Send payment status changed notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userId, storeId, oldStatus, newStatus, paymentData } =
      body;

    // Validate required fields
    if (
      !orderId ||
      !userId ||
      !storeId ||
      !oldStatus ||
      !newStatus ||
      !paymentData
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send payment status changed notifications
    await notificationService.notifyPaymentStatusChanged(
      orderId,
      userId,
      storeId,
      oldStatus,
      newStatus,
      paymentData
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending payment status changed notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
