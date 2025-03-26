import { getAllStoreProducts } from "@/queries/product";
import DataTable from "@/components/ui/data-table";
import { Plus } from "lucide-react";
import ProductDetails from "@/components/dashboard/forms/product-details";
import { getAllCategories } from "@/queries/category";
import { getAllOfferTags } from "@/queries/offer-tag";
import { db } from "@/lib/db";
import { columns } from "@/app/dashboard/seller/stores/[storeUrl]/products/columns";

export default async function SellerProductsPage({
  params,
}: {
  params: { storeUrl: string };
}) {
  const products = await getAllStoreProducts(params.storeUrl);

  const categories = await getAllCategories();
  const offerTags = await getAllOfferTags();
  const countries = await db.country.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return (
    <DataTable
      actionButtonText={
        <>
          <Plus size={15} />
          Create product
        </>
      }
      modalChildren={
        <ProductDetails
          categories={categories}
          offerTags={offerTags}
          storeUrl={params.storeUrl}
          countries={countries}
        />
      }
      newTabLink={`/dashboard/seller/stores/${params.storeUrl}/products/new`}
      filterValue="name"
      data={products}
      columns={columns}
      searchPlaceholder="Search product name..."
    />
  );
}
