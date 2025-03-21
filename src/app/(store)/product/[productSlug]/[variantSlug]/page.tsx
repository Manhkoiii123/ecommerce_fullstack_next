import ProductPageContainer from "@/components/store/product-page/container";
import ProductDescription from "@/components/store/product-page/product-description";
import RelatedProducts from "@/components/store/product-page/related-product";
import { Separator } from "@/components/ui/separator";
import { getProductPageData, getProducts } from "@/queries/product";
import { notFound, redirect } from "next/navigation";
import React from "react";
interface ProductVariantPageProps {
  params: { productSlug: string; variantSlug: string };
  searchParams: { [key: string]: string };
}
const ProductVariantPage = async ({
  params: { productSlug, variantSlug },
  searchParams: { size: sizeId },
}: ProductVariantPageProps) => {
  const productData = await getProductPageData(productSlug, variantSlug);
  if (!productData) return notFound();
  const { sizes } = productData;
  if (sizeId) {
    const isSizeValid = sizes.some((size) => size.id === sizeId);
    if (!isSizeValid) return redirect(`/product/${productSlug}/${variantSlug}`);
  } else if (sizes.length === 1) {
    return redirect(
      `/product/${productSlug}/${variantSlug}?size=${sizes[0].id}`
    );
  }
  const { specs, questions, shippingDetails, category } = productData;
  const relatedProducts = await getProducts(
    {
      category: category.url,
    },
    "",
    1,
    12
  );
  return (
    <div>
      <div className="max-w-[1650px] mx-auto p-4 overflow-x-hidden">
        <ProductPageContainer productData={productData} sizeId={sizeId}>
          {relatedProducts.products && (
            <>
              <Separator />
              <RelatedProducts products={relatedProducts.products} />
            </>
          )}
          <Separator className="mt-6" />
          {/* product review */}
          <>
            <Separator className="mt-6" />
            {/* product desc */}
            <ProductDescription
              text={[
                productData.description,
                productData?.variantDescription || "",
              ]}
            />
          </>
          {(specs.product.length > 0 || specs.variant.length > 0) && (
            <>
              {/* Specs table */}
              <Separator className="mt-6" />
            </>
          )}
          {questions.length > 0 && (
            <>
              <Separator className="mt-6" />
            </>
          )}
          <Separator className="mt-6" />
          {/*store card  */}
          {/* store products */}
        </ProductPageContainer>
      </div>
    </div>
  );
};

export default ProductVariantPage;
