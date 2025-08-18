import { NextRequest, NextResponse } from "next/server";
import { autoCancelUnpaidOrders } from "@/queries/store";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron service
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Auto-cancel cron job started at:", new Date().toISOString());

    const result = await autoCancelUnpaidOrders();

    console.log("Auto-cancel cron job completed:", result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("Error in auto-cancel cron job:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also allow GET for testing purposes
export async function GET(request: NextRequest) {
  try {
    console.log(
      "Auto-cancel cron job test started at:",
      new Date().toISOString()
    );

    const result = await autoCancelUnpaidOrders();

    console.log("Auto-cancel cron job test completed:", result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      //   message:
      //     "This is a test endpoint. Use POST with proper authorization for production.",
      ...result,
    });
  } catch (error) {
    console.error("Error in auto-cancel cron job test:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
