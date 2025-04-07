import CategoryFilter from "@/components/store/browser-page/filters/category/category-filter";
import OfferFilter from "@/components/store/browser-page/filters/offer/offer-filter";
import { FiltersQueryType } from "@/lib/types";
import { getAllCategories } from "@/queries/category";
import { getAllOfferTags } from "@/queries/offer-tag";
import React from "react";

const ProductFilters = async ({
  queries,
  storeUrl,
}: {
  queries: FiltersQueryType;
  storeUrl?: string;
}) => {
  const categories = await getAllCategories(storeUrl);
  const offers = await getAllOfferTags(storeUrl);
  return (
    <div className="h-full w-48 transition-transform overflow-auto pr-6 pb-2.5 flex-none basis-[196px] sticky top-0 overflow-x-hidden scrollbar">
      <div className="border-t w-40 md:w-44">
        <CategoryFilter categories={categories} />
        <OfferFilter offers={offers} />
      </div>
    </div>
  );
};

export default ProductFilters;
