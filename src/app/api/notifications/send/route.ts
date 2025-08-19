import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/lib/notification-service";

// POST /api/notifications/send - Send notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, storeId, orderId, metadata } = body;

    // Validate required fields
    if (!type || (!userId && !storeId)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create and send notification
    await notificationService.createAndSend({
      type,
      title: body.title,
      message: body.message,
      userId,
      storeId,
      orderId,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
