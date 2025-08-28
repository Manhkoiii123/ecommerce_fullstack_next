import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { canUserReviewProduct } from "@/lib/review-permission";
import { upsertReview } from "@/queries/review";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, ...reviewData } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if user can review this product
    const canReview = await canUserReviewProduct(userId, productId);

    if (!canReview) {
      return NextResponse.json(
        {
          error:
            "You cannot review this product. Product must be purchased, paid, and shipped.",
          code: "REVIEW_PERMISSION_DENIED",
        },
        { status: 403 }
      );
    }

    // Submit the review
    const response = await upsertReview(productId, reviewData);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
