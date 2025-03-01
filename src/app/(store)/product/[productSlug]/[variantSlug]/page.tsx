import { getProductPageData } from "@/queries/product";
import React from "react";
interface ProductVariantPageProps {
  params: { productSlug: string; variantSlug: string };
}
const ProductVariantPage = async ({
  params: { productSlug, variantSlug },
}: ProductVariantPageProps) => {
  const product = await getProductPageData(productSlug, variantSlug);
  return (
    <div>
      <h1 className="text-3xl">ProductVariantPage</h1>
    </div>
  );
};

export default ProductVariantPage;
