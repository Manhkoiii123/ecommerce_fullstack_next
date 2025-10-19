import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Get all reviews for this product
    const reviews = await db.review.findMany({
      where: {
        productId: productId,
      },
      select: {
        review: true,
        rating: true,
        variant: true,
        color: true,
        size: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (reviews.length === 0) {
      return NextResponse.json({
        summary: "No reviews yet. Be the first to review this product!",
        totalReviews: 0,
        cached: false,
      });
    }

    // Check if we have a cached summary
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { reviewSummary: true, reviewSummaryUpdatedAt: true },
    });

    // If cached summary exists and was updated in the last 24 hours, return it
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (
      product?.reviewSummary &&
      product?.reviewSummaryUpdatedAt &&
      Date.now() - product.reviewSummaryUpdatedAt.getTime() < ONE_DAY
    ) {
      return NextResponse.json({
        summary: product.reviewSummary,
        totalReviews: reviews.length,
        cached: true,
      });
    }

    // Prepare review data for AI
    const reviewsText = reviews
      .slice(0, 50) // Limit to 50 most recent reviews to avoid token limits
      .map(
        (r, i) =>
          `Review ${i + 1} (${r.rating}★): ${r.review} [Variant: ${
            r.variant
          }, Color: ${r.color}, Size: ${r.size}]`
      )
      .join("\n\n");

    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const prompt = `Analyze the following ${
      reviews.length
    } customer reviews and create a concise summary in 2-3 sentences. Focus on:
1. Overall customer sentiment (positive/negative)
2. Most mentioned pros and cons
3. Common themes or patterns

Average Rating: ${averageRating.toFixed(1)}/5 stars

Reviews:
${reviewsText}

Write a professional, balanced summary that helps potential buyers make an informed decision. Be honest about both strengths and weaknesses mentioned in reviews.`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a professional product review analyst. Create concise, honest summaries that help customers make informed purchase decisions. Focus on facts mentioned in reviews, not assumptions.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.5,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API Error:", error);
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json(
        { error: "No summary generated" },
        { status: 500 }
      );
    }

    // Cache the summary in database
    await db.product.update({
      where: { id: productId },
      data: {
        reviewSummary: summary,
        reviewSummaryUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      summary,
      totalReviews: reviews.length,
      cached: false,
    });
  } catch (error) {
    console.error("Error generating review summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
