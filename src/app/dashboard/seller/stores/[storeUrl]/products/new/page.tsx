import ProductDetails from "@/components/dashboard/forms/product-details";
import { db } from "@/lib/db";
import { getAllCategories } from "@/queries/category";
import { getAllOfferTags } from "@/queries/offer-tag";
import React from "react";

const SellerNewProductPage = async ({
  params,
}: {
  params: { storeUrl: string };
}) => {
  const categories = await getAllCategories();
  const offerTags = await getAllOfferTags();
  const countries = await db.country.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  return (
    <div className="w-full">
      <ProductDetails
        categories={categories}
        storeUrl={params.storeUrl}
        offerTags={offerTags}
        countries={countries}
      />
    </div>
  );
};

export default SellerNewProductPage;
