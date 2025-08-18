import { getAllFlashSales } from "@/queries/flash-sale";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DataTable from "@/components/ui/data-table";
import { Plus } from "lucide-react";
import FlashSaleDetails from "@/components/dashboard/forms/flash-sale-details";
import { columns } from "./columns";

export default async function SellerFlashSalesPage({
  params,
}: {
  params: { storeUrl: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/");
  const { storeUrl } = params;

  const flashSales = await getAllFlashSales(storeUrl);

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
      data={flashSales}
      searchPlaceholder="Search flash sale name..."
      columns={columns}
    />
  );
}
