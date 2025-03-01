import StoreDefaultShippingDetails from "@/components/dashboard/forms/store-default-shipping-details";
import { getStoreDefaultShippingDetails } from "@/queries/store";

const SellerStoreShippingPage = async ({
  params,
}: {
  params: { storeUrl: string };
}) => {
  const shippingDetails = await getStoreDefaultShippingDetails(params.storeUrl);
  return (
    <div>
      <StoreDefaultShippingDetails
        data={shippingDetails}
        storeUrl={params.storeUrl}
      />
    </div>
  );
};

export default SellerStoreShippingPage;
