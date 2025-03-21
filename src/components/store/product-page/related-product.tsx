import ProductList from "@/components/store/shared/product-list";
import { ProductType } from "@/lib/types";
import React from "react";

const RelatedProducts = ({ products }: { products: ProductType[] }) => {
  return (
    <div className="mt-4 space-y-1">
      <ProductList products={products} title="Related Products" />
    </div>
  );
};

export default RelatedProducts;
