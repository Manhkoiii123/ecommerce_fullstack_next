import { cancelGroupOrder } from "@/queries/store";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // Check if user is admin or seller
    // if (
    //   user.privateMetadata.role !== "ADMIN" &&
    //   user.privateMetadata.role !== "SELLER"
    // ) {
    //   return NextResponse.json(
    //     { error: "Unauthorized: Admin or Seller privileges required" },
    //     { status: 403 }
    //   );
    // }
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    if (!orderId)
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    const result = await cancelGroupOrder(orderId);

    return NextResponse.json({
      success: true,
      order: result,
    });
  } catch (error) {
    console.error("Error in auto-cancel orders API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
