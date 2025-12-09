import { autoCancelUnpaidOrders } from "@/queries/store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const result = await autoCancelUnpaidOrders();

  return NextResponse.json({ success: true, ...result });
}
