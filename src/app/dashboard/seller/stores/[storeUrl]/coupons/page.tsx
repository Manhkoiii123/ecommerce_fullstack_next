import { columns } from "@/app/dashboard/seller/stores/[storeUrl]/coupons/columns";
import CouponDetails from "@/components/dashboard/forms/coupon-details";
import DataTable from "@/components/ui/data-table";
import { getStoreCoupons } from "@/queries/coupons";
import { Plus } from "lucide-react";

export default async function SellerCouponsPage({
  params,
}: {
  params: { storeUrl: string };
}) {
  const coupons = await getStoreCoupons(params.storeUrl);
  return (
    <div>
      <DataTable
        actionButtonText={
          <>
            <Plus size={15} />
            Create coupon
          </>
        }
        modalChildren={<CouponDetails storeUrl={params.storeUrl} />}
        newTabLink={`/dashboard/seller/stores/${params.storeUrl}/coupons/new`}
        filterValue="name"
        data={coupons}
        columns={columns}
        searchPlaceholder="Search coupon ..."
      />
    </div>
  );
}
