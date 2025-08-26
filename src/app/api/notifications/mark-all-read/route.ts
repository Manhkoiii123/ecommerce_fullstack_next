import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { userId, storeId } = await req.json();

    const where: any = { status: "UNREAD" };
    if (userId) where.userId = userId;
    if (storeId) where.storeId = storeId;

    const result = await db.notification.updateMany({
      where,
      data: { status: "READ" },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Error marking all as read:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
