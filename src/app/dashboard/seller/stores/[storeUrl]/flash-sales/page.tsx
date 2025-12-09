import { getAllFlashSales } from "@/queries/flash-sale";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DataTable from "@/components/ui/data-table";
import { Plus } from "lucide-react";
import FlashSaleDetails from "@/components/dashboard/forms/flash-sale-details";
import { columns } from "./columns";
import { FlashSale } from "@prisma/client";
type FlashSaleWithRelations = FlashSale & {
  store: {
    id: string;
    name: string;
    url: string;
  };
  products: Array<{
    // product: {
    productId: string;
    name: string;
    customMaxDiscount: number | null;
    customDiscountValue: number | null;
    // };
  }>;
};
export default async function SellerFlashSalesPage({
  params,
}: {
  params: { storeUrl: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/");
  const { storeUrl } = params;

  const flashSales = await getAllFlashSales(storeUrl);
  const formattedFlashSales = flashSales.map((flashSale) => ({
    ...flashSale,
    store: {
      id: flashSale.store.id,
      name: flashSale.store.name,
      url: flashSale.store.url,
    },
    products: flashSale.products.map((product) => ({
      productId: product.productId,
      name: product.product.name,
      customMaxDiscount: product.customMaxDiscount,
      customDiscountValue: product.customDiscountValue,
    })),
  }));
  return (
    <DataTable
      actionButtonText={
        <>
          <Plus size={15} />
          Create Flash Sale
        </>
      }
      modalChildren={<FlashSaleDetails storeUrl={storeUrl} />}
      newTabLink={`/dashboard/seller/stores/${storeUrl}/flash-sales/new`}
      filterValue="name"
      data={formattedFlashSales}
      searchPlaceholder="Search flash sale name..."
      columns={columns}
    />
  );
}
