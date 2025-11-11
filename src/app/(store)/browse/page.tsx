import ProductFilters from "@/components/store/browser-page/filter";
import ProductPagination from "@/components/store/browser-page/product-pagination";
import ProductSort from "@/components/store/browser-page/sort";
import ProductCard from "@/components/store/cards/product/product-card";
import Header from "@/components/store/layout/header/header";
import Pagination from "@/components/store/shared/pagination";
import { FiltersQueryType } from "@/lib/types";
import { getProducts } from "@/queries/product";
import { getFilteredSizes } from "@/queries/size";
import React from "react";

const BrowsePage = async ({
  searchParams,
}: {
  searchParams: FiltersQueryType;
}) => {
  const {
    category,
    offer,
    search,
    size,
    sort,
    subCategory,
    maxPrice,
    minPrice,
    color,
    page,
  } = searchParams;
  const products_data = await getProducts(
    {
      search,
      minPrice: Number(minPrice) || 0,
      maxPrice: Number(maxPrice) || Number.MAX_SAFE_INTEGER,
      category,
      subCategory,
      offer,
      size: Array.isArray(size) ? size : size ? [size] : undefined,
      color: Array.isArray(color) ? color : color ? [color] : undefined,
    },
    sort,
    (page && Number(page)) || 1
  );
  const { products, currentPage, totalPages, totalCount } = products_data;

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="fixed top-0 left-0 w-full z-10">
        <Header />
      </div>

      <div className="fixed top-[124px] lg:top-16 left-2 md:left-4 pt-4 h-[calc(100vh-64px)] overflow-auto scrollbar">
        <ProductFilters queries={searchParams} />
      </div>
      <div className="ml-[190px] md:ml-[220px] pt-[140px] lg:pt-20">
        <div className="sticky top-[64px] z-10 px-4 py-2 flex items-center">
          <ProductSort />
        </div>

        <div className="mt-4 px-4 w-full overflow-y-auto max-h-[calc(100vh-155px)] pb-28 scrollbar flex flex-wrap">
          {products.map((product, i) => (
            <ProductCard key={product.id + product.slug} product={product} />
          ))}
        </div>
        <ProductPagination page={currentPage} totalPages={totalPages} />
      </div>
    </div>
  );
};

export default BrowsePage;
