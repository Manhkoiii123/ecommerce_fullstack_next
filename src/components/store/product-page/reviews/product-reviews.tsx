"use client";
import RatingCard from "@/components/store/cards/product-rating";
import RatingStatisticsCard from "@/components/store/cards/rating-statistics";
import { RatingStatisticsType } from "@/lib/types";
import React, { useState } from "react";
interface Props {
  productId: string;
  rating: number;
  statistics: RatingStatisticsType;
}
const ProductReviews = ({ productId, rating, statistics }: Props) => {
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
            <div className="mt-10  min-h-72 grid grid-cols-2 gap-6"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
