import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/lib/notification-service";

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId, storeId, orderData } = await request.json();

    if (!orderId || !userId || !storeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await notificationService.notifyOrderCancelled(
      orderId,
      userId,
      storeId,
      orderData
    );

    return NextResponse.json({
      success: true,
      message: "Order cancellation notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending order cancellation notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
