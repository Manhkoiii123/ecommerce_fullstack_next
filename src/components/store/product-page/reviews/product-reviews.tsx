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
  const [data, setData] = useState<ReviewWithImage[]>([]);
  console.log("🚀 ~ ProductReviews ~ data:", data);
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
