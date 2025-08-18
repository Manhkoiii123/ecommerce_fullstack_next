import { getProductForEdit } from "@/queries/product";
import ProductDetails from "@/components/dashboard/forms/product-details";
import { getAllCategories } from "@/queries/category";
import { getAllOfferTags } from "@/queries/offer-tag";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function EditProductPage({
  params,
}: {
  params: { storeUrl: string; productId: string };
}) {
  try {
    const product = await getProductForEdit(params.productId, params.storeUrl);

    if (!product) {
      notFound();
    }

    const categories = await getAllCategories();
    const offerTags = await getAllOfferTags();
    const countries = await db.country.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-7">
            <ProductDetails
              data={product}
              categories={categories}
              offerTags={offerTags}
              storeUrl={params.storeUrl}
              countries={countries}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading product for edit:", error);
    notFound();
  }
}
