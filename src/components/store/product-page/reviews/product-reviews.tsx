"use client";
import RatingCard from "@/components/store/cards/product-rating";
import RatingStatisticsCard from "@/components/store/cards/rating-statistics";
import ReviewCard from "@/components/store/cards/reviews";
import ReviewsFilters from "@/components/store/product-page/reviews/filters";
import ReviewsSort from "@/components/store/product-page/reviews/sort";
import Pagination from "@/components/store/shared/pagination";
import {
  RatingStatisticsType,
  ReviewsFiltersType,
  ReviewsOrderType,
  ReviewWithImage,
} from "@/lib/types";
import { getProductFilteredReviews } from "@/queries/product";
import { Review } from "@prisma/client";
import React, { useEffect, useState } from "react";
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
      setData(res);
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
            <div className="space-y-6">
              <ReviewsFilters
                filters={filters}
                setFilters={setFilters}
                setSort={setSort}
                stats={statistics}
              />
              <ReviewsSort sort={sort} setSort={setSort} />
            </div>
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
        <Pagination
          page={page}
          totalPages={
            filters.rating || filters.hasImages
              ? data.length / pageSize
              : statistics.totalReviews / pageSize
          }
          setPage={setPage}
        />
      </div>
    </div>
  );
};

export default ProductReviews;
