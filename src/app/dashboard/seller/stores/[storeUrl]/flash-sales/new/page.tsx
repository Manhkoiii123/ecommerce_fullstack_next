import { getStorePageDetails } from "@/queries/store";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import FlashSaleDetails from "@/components/dashboard/forms/flash-sale-details";

export default async function NewSellerFlashSalePage({
  params,
}: {
  params: { storeUrl: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/");
  const { storeUrl } = params;

  const store = await getStorePageDetails(storeUrl);

  if (!store) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Stores Found</h2>
          <p className="text-muted-foreground mb-4">
            You need to create a store first before you can create flash sales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Create New Flash Sale
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Set up a time-limited sale for your store
          </span>
        </div>
      </div>

      <FlashSaleDetails storeUrl={storeUrl} />
    </div>
  );
}
