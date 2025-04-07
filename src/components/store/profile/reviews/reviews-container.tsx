"use client";
import {
  ReviewDateFilter,
  ReviewFilter,
  ReviewWithImageType,
} from "@/lib/types";
import { useEffect, useState } from "react";
import { getUserReviews } from "@/queries/profile";
import ReviewsHeader from "./reviews-header";
import ReviewCard from "@/components/store/cards/reviews";
import Pagination from "@/components/store/shared/pagination";

export default function ReviewsContainer({
  reviews,
  totalPages,
}: {
  reviews: ReviewWithImageType[];
  totalPages: number;
}) {
  const [data, setData] = useState<ReviewWithImageType[]>(reviews);

  const [page, setPage] = useState<number>(1);
  const [totalDataPages, setTotalDataPages] = useState<number>(totalPages);

  const [filter, setFilter] = useState<ReviewFilter>("");

  const [period, setPeriod] = useState<ReviewDateFilter>("");

  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    setPage(1);
  }, [filter, period, search]);

  useEffect(() => {
    const getData = async () => {
      const res = await getUserReviews(filter, period, search, page);
      if (res) {
        setData(res.reviews);
        setTotalDataPages(res.totalPages);
      }
    };
    getData();
  }, [page, filter, search, period]);
  return (
    <div>
      <div className="">
        <ReviewsHeader
          filter={filter}
          setFilter={setFilter}
          period={period}
          setPeriod={setPeriod}
          search={search}
          setSearch={setSearch}
        />
        <div className="space-y-2">
          {data.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
      <div className="mt-2">
        <Pagination page={page} setPage={setPage} totalPages={totalDataPages} />
      </div>
    </div>
  );
}
