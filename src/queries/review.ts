"use server";

import { db } from "@/lib/db";
import { ReviewDetailsType } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";
import { getRatingStatistics } from "./product";

export const upsertReview = async (
  productId: string,
  review: ReviewDetailsType
) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthenticated.");
    if (!productId) throw new Error("Product ID is required.");
    if (!review) throw new Error("Please provide review data.");
    // tìm để update
    const existingReview = await db.review.findFirst({
      where: {
        productId,
        userId: user.id,
        variant: review.variant,
      },
    });

    let review_data: ReviewDetailsType = review;
    if (existingReview) {
      review_data = { ...review_data, id: existingReview.id };
    }
    const reviewDetails = await db.review.upsert({
      where: {
        id: review_data.id,
      },
      update: {
        ...review_data,
        images: {
          deleteMany: {},
          create: review_data.images.map((img) => ({
            url: img.url,
          })),
        },
        userId: user.id,
      },
      create: {
        ...review_data,
        images: {
          create: review_data.images.map((img) => ({
            url: img.url,
          })),
        },
        productId,
        userId: user.id,
      },
      include: {
        images: true,
        user: true,
      },
    });

    const productReviews = await db.review.findMany({
      where: {
        productId,
      },
      select: {
        rating: true,
      },
    });

    const totalRating = productReviews.reduce(
      (acc, rev) => acc + rev.rating,
      0
    );

    const averageRating = totalRating / productReviews.length;

    const updatedProduct = await db.product.update({
      where: {
        id: productId,
      },
      data: {
        rating: averageRating,
        numReviews: productReviews.length,
      },
    });
    const statistics = await getRatingStatistics(productId);
    const message = existingReview
      ? "Your review has been updated successfully!"
      : "Thank you for submitting your review!";

    return {
      review: reviewDetails,
      rating: averageRating,
      statistics,
      message,
    };
  } catch (error) {
    throw error;
  }
};
