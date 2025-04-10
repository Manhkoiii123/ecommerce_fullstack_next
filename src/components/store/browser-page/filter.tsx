import CategoryFilter from "@/components/store/browser-page/filters/category/category-filter";
import ColorFilter from "@/components/store/browser-page/filters/color/color-filter";
import FiltersHeader from "@/components/store/browser-page/filters/header";
import OfferFilter from "@/components/store/browser-page/filters/offer/offer-filter";
import PriceFilter from "@/components/store/browser-page/filters/price/price";
import SizeFilter from "@/components/store/browser-page/filters/size/size-filter";
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
      <FiltersHeader queries={queries} />
      <div className="border-t w-40 md:w-44">
        <PriceFilter />
        <CategoryFilter categories={categories} />
        <ColorFilter queries={queries} storeUrl={storeUrl} />
        <OfferFilter offers={offers} />
        <SizeFilter queries={queries} storeUrl={storeUrl} />
      </div>
    </div>
  );
};

export default ProductFilters;
