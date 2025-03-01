import { columns } from "@/app/dashboard/seller/stores/[storeUrl]/shipping/columns";
import StoreDefaultShippingDetails from "@/components/dashboard/forms/store-default-shipping-details";
import DataTable from "@/components/ui/data-table";
import {
  getStoreDefaultShippingDetails,
  getStoreShippingRates,
} from "@/queries/store";
import { redirect } from "next/navigation";

const SellerStoreShippingPage = async ({
  params,
}: {
  params: { storeUrl: string };
}) => {
  const shippingDetails = await getStoreDefaultShippingDetails(params.storeUrl);
  const shippingRates = await getStoreShippingRates(params.storeUrl);
  if (!shippingDetails || !shippingRates) return redirect("/");
  return (
    <div>
      <StoreDefaultShippingDetails
        data={shippingDetails}
        storeUrl={params.storeUrl}
      />
      <DataTable
        filterValue="countryName"
        data={shippingRates}
        columns={columns}
        searchPlaceholder="Search by country name..."
      />
    </div>
  );
};

export default SellerStoreShippingPage;
