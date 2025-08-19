import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/lib/notification-service";

// POST /api/notifications/order-placed - Send order placed notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userId, storeId, orderData } = body;

    // Validate required fields
    if (!orderId || !userId || !storeId || !orderData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send order placed notifications
    await notificationService.notifyOrderPlaced(
      orderId,
      userId,
      storeId,
      orderData
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending order placed notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
