import ProductDetails from "@/components/dashboard/forms/product-details";

import { getAllCategories } from "@/queries/category";
import { getAllOfferTags } from "@/queries/offer-tag";
import { getProductMainInfo } from "@/queries/product";

export default async function SellerNewProductVariantPage({
  params,
}: {
  params: { storeUrl: string; productId: string };
}) {
  const categories = await getAllCategories();
  const offerTags = await getAllOfferTags();
  const product = await getProductMainInfo(params.productId);
  if (!product) return null;
  return (
    <div>
      <ProductDetails
        categories={categories}
        storeUrl={params.storeUrl}
        data={product}
        offerTags={offerTags}
        // countries={countries}
      />
    </div>
  );
}
