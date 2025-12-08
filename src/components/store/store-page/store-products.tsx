"use client";
import { FiltersQueryType, ProductType } from "@/lib/types";
import { getProducts } from "@/queries/product";
import { useEffect, useState } from "react";
import ProductCard from "../cards/product/product-card";
import ProductPageStoreProductsSkeletonLoader from "../skeletons/product-page/store-products";
import ProductPagination from "@/components/store/browser-page/product-pagination";

export default function StoreProducts({
  searchParams,
  store,
}: {
  searchParams: FiltersQueryType;
  store: string;
}) {
  const [data, setData] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { category, offer, search, size, sort, subCategory, page } =
    searchParams;
  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const getFilteredProducts = async () => {
      setLoading(true);
      const { products, currentPage, totalPages } = await getProducts(
        {
          category,
          offer,
          search,
          size: Array.isArray(size) ? size : size ? [size] : undefined,
          subCategory,
          store,
        },
        sort,
        (page && Number(page)) || 1,
        6
      );
      setData(products);
      setCurrentPage(currentPage);
      setTotalPages(totalPages);
      setLoading(false);
    };
    getFilteredProducts();
  }, [searchParams]);
  return (
    <>
      {loading ? (
        <div className="p-4">
          <ProductPageStoreProductsSkeletonLoader />
        </div>
      ) : (
        <div className="flex flex-col  justify-center">
          <div className=" bg-white justify-center md:justify-start flex flex-wrap p-2 pb-16 rounded-md">
            {data.map((product) => (
              <ProductCard key={product.id + product.slug} product={product} />
            ))}
          </div>
          <ProductPagination page={currentPage} totalPages={totalPages} />
        </div>
      )}
    </>
  );
}
