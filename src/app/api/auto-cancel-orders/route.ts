import { NextRequest, NextResponse } from "next/server";
import { autoCancelUnpaidOrders, getOrdersAtRiskOfCancellation } from "@/queries/store";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Check if user is admin or seller
    if (user.privateMetadata.role !== "ADMIN" && user.privateMetadata.role !== "SELLER") {
      return NextResponse.json(
        { error: "Unauthorized: Admin or Seller privileges required" },
        { status: 403 }
      );
    }

    const result = await autoCancelUnpaidOrders();
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in auto-cancel orders API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Check if user is admin or seller
    if (user.privateMetadata.role !== "ADMIN" && user.privateMetadata.role !== "SELLER") {
      return NextResponse.json(
        { error: "Unauthorized: Admin or Seller privileges required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeUrl = searchParams.get("storeUrl") || undefined;

    const atRiskOrders = await getOrdersAtRiskOfCancellation(storeUrl);
    
    return NextResponse.json({
      success: true,
      atRiskOrders,
      count: atRiskOrders.length,
    });
  } catch (error) {
    console.error("Error in get orders at risk API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
      );
  }
} 