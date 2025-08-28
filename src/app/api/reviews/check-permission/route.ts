import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { canUserReviewProduct } from "@/lib/review-permission";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const canReview = await canUserReviewProduct(userId, productId);

    return NextResponse.json({
      canReview,
      message: canReview
        ? "User can review this product"
        : "User cannot review this product. Product must be purchased, paid, and shipped.",
    });
  } catch (error) {
    console.error("Error checking review permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
