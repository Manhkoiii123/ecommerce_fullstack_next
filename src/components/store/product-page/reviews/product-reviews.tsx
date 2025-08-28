"use client";
import RatingCard from "@/components/store/cards/product-rating";
import RatingStatisticsCard from "@/components/store/cards/rating-statistics";
import ReviewCard from "@/components/store/cards/reviews";
import ReviewDetails from "@/components/store/forms/review-details";
import ReviewsFilters from "@/components/store/product-page/reviews/filters";
import ReviewsSort from "@/components/store/product-page/reviews/sort";
import Pagination from "@/components/store/shared/pagination";
import {
  RatingStatisticsType,
  ReviewsFiltersType,
  ReviewsOrderType,
  ReviewWithImage,
  VariantInfoType,
} from "@/lib/types";
import { getProductFilteredReviews } from "@/queries/product";
import { Review } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { useReviewPermission } from "@/hooks/use-review-permission";
interface Props {
  productId: string;
  rating: number;
  variantsInfo: VariantInfoType[];
}
const defaultData = {
  ratingStatistics: [
    { rating: 1, numReviews: 0, percentage: 0 },
    { rating: 2, numReviews: 0, percentage: 0 },
    { rating: 3, numReviews: 0, percentage: 0 },
    { rating: 4, numReviews: 0, percentage: 0 },
    { rating: 5, numReviews: 0, percentage: 0 },
  ],
  reviewsWithImagesCount: 0,
  totalReviews: 0,
};
const ProductReviews = ({ productId, rating, variantsInfo }: Props) => {
  const { canReview, message } = useReviewPermission(productId);
  console.log("🚀 ~ ProductReviews ~ canReview:", canReview);
  const [data, setData] = useState<ReviewWithImage[]>([]);
  const half = Math.ceil(data.length / 2);
  const [averageRating, setAverageRating] = useState<number>(rating);
  const filtered_data = {
    rating: undefined,
    hasImages: undefined,
  };
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<ReviewsFiltersType>(filtered_data);
  const [filterLoading, setFilterLoading] = useState<boolean>(false);
  const [sort, setSort] = useState<ReviewsOrderType>();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(4);
  const [statistics, setStatistics] =
    useState<RatingStatisticsType>(defaultData);
  useEffect(() => {
    if (filters.rating || filters.hasImages || sort) {
      setPage(1);
      handleGetReviews();
    }
    if (page) {
      handleGetReviews();
    }
  }, [filters, sort, page]);
  const handleGetReviews = async () => {
    try {
      setFilterLoading(true);
      const res = await getProductFilteredReviews(
        productId,
        filters,
        sort,
        page,
        pageSize
      );
      setData(res.reviews);
      setStatistics(res.statistics);
      setLoading(false);
      setFilterLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <div className="pt-6" id="reviews">
      <div>
        <div className="h-12">
          <div className="flex items-center justify-between">
            <h2 className="text-main-primary text-2xl font-bold">
              Reviews ({statistics.totalReviews})
            </h2>
            {!canReview && (
              <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 px-3 py-1 rounded-full">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Review not available</span>
              </div>
            )}
          </div>
        </div>
        <div className="w-full">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <RatingCard rating={averageRating} />
            <RatingStatisticsCard statistics={statistics.ratingStatistics} />
          </div>
        </div>
        {statistics.totalReviews > 0 && (
          <>
            <div className="space-y-6">
              <ReviewsFilters
                filters={filters}
                setFilters={setFilters}
                setSort={setSort}
                stats={statistics}
              />
              <ReviewsSort sort={sort} setSort={setSort} />
            </div>
            <div className="mt-10   grid grid-cols-2 gap-4">
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
        {data.length >= pageSize && (
          <Pagination
            page={page}
            totalPages={
              filters.rating || filters.hasImages
                ? data.length / pageSize
                : 1 / pageSize
            }
            setPage={setPage}
          />
        )}
        <div className="mt-10">
          <ReviewDetails
            productId={productId}
            variantsInfo={variantsInfo}
            setReviews={setData}
            reviews={data}
            setAverageRating={setAverageRating}
            setStatistics={setStatistics}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
