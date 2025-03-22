"use client";
import RatingCard from "@/components/store/cards/product-rating";
import RatingStatisticsCard from "@/components/store/cards/rating-statistics";
import ReviewCard from "@/components/store/cards/reviews";
import { RatingStatisticsType, ReviewWithImage } from "@/lib/types";
import { Review } from "@prisma/client";
import React, { useState } from "react";
interface Props {
  productId: string;
  rating: number;
  statistics: RatingStatisticsType;
  reviews: ReviewWithImage[];
}
const ProductReviews = ({ productId, rating, statistics, reviews }: Props) => {
  const [data, setData] = useState<ReviewWithImage[]>(reviews);
  const half = Math.ceil(data.length / 2);
  const [averageRating, setAverageRating] = useState<number>(rating);
  return (
    <div className="pt-6" id="reviews">
      <div>
        <div className="h-12">
          <h2 className="text-main-primary text-2xl font-bold">
            Custom Reviews ({statistics.totalReviews})
          </h2>
        </div>
        <div className="w-full">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <RatingCard rating={averageRating} />
            <RatingStatisticsCard statistics={statistics.ratingStatistics} />
          </div>
        </div>
        {statistics.totalReviews > 0 && (
          <>
            <div className="space-y-6"></div>
            <div className="mt-10  min-h-72 grid grid-cols-2 gap-4">
              {data.length > 0 ? (
                <>
                  <div className="flex flex-col gap-3">
                    {data.slice(0, half).map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    {data.slice(half).map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </>
              ) : (
                <>No Reviews yet.</>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
