import StoreCard from "@/components/store/cards/store-card";
import CategoriesHeader from "@/components/store/layout/categories-header/categories-header";
import Header from "@/components/store/layout/header/header";
import ProductPageContainer from "@/components/store/product-page/container";
import ProductDescription from "@/components/store/product-page/product-description";
import ProductQuestions from "@/components/store/product-page/product-questions";
import ProductSpecs from "@/components/store/product-page/product-specs";
import RelatedProducts from "@/components/store/product-page/related-product";
import ProductReviews from "@/components/store/product-page/reviews/product-reviews";
import StoreProducts from "@/components/store/product-page/store-products";
import { Separator } from "@/components/ui/separator";
import { VariantInfoType } from "@/lib/types";
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

  // JSON-LD: Product + BreadcrumbList
  const selectedSize = sizeId
    ? productData.sizes.find((s) => s.id === sizeId)
    : undefined;
  const computeDiscounted = (price: number, discount: number) =>
    Math.round(price * (1 - (discount || 0) / 100) * 100) / 100;
  const prices = productData.sizes.map((s) =>
    computeDiscounted(s.price, s.discount)
  );
  const price = selectedSize
    ? computeDiscounted(selectedSize.price, selectedSize.discount)
    : prices.length > 0
    ? Math.min(...prices)
    : undefined;
  const currency = "USD";
  const availability = selectedSize
    ? selectedSize.quantity > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock"
    : productData.sizes.some((s) => s.quantity > 0)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const productImages = productData.images?.map((img) => img.url) || [];
  const productUrl = `/product/${productData.productSlug}/${productData.variantSlug}`;
  const aggregateRating =
    typeof productData.rating === "number" && productData.rating > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: productData.rating,
          reviewCount: productData.reviewsStatistics?.totalReviews || 0,
        }
      : undefined;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${productData.name} - ${productData.variantName}`,
    description:
      productData.variantDescription || productData.description || undefined,
    image: productImages,
    sku: productData.sku,
    brand: productData.brand
      ? { "@type": "Brand", name: productData.brand }
      : undefined,
    url: productUrl,
    offers:
      typeof price === "number"
        ? {
            "@type": "Offer",
            priceCurrency: currency,
            price,
            availability,
            url: productUrl,
          }
        : undefined,
    aggregateRating,
  } as any;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "/",
      },
      category?.name && category?.url
        ? {
            "@type": "ListItem",
            position: 2,
            name: category.name,
            item: `/browse?category=${category.url}`,
          }
        : undefined,
      {
        "@type": "ListItem",
        position: 3,
        name: productData.name,
        item: `/product/${productData.productSlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: productData.variantName,
        item: productUrl,
      },
    ].filter(Boolean),
  } as any;

  return (
    <div>
      <Header />
      <CategoriesHeader />
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
          <ProductReviews
            productId={productData.productId}
            rating={productData.rating}
            variantsInfo={productData.variantInfo}
          />

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
              <ProductSpecs specs={specs} />
            </>
          )}
          {questions.length > 0 && (
            <>
              <Separator className="mt-6" />
              <ProductQuestions questions={productData.questions} />
            </>
          )}
          <Separator className="mt-6" />
          {/*store card  */}
          <div className="h-6"></div>
          <StoreCard store={productData.store} />
          {/* store products */}
          <StoreProducts
            storeUrl={productData.store.url}
            storeName={productData.store.name}
            count={5}
          />
        </ProductPageContainer>
      </div>
    </div>
  );
};

export default ProductVariantPage;
