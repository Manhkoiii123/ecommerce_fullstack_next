import OrderGroupTable from "@/components/store/order-page/group-table";
import { OrderGroupWithItemsType } from "@/lib/types";
import { getShippingDatesRange } from "@/lib/utils";
import React from "react";

const OrderGroupsContainer = ({
  groups,
  check,
}: {
  groups: OrderGroupWithItemsType[];
  check: boolean;
}) => {
  console.log("🚀 ~ groups:", groups);
  const deliveryDetails = groups.map((group) => {
    const { minDate, maxDate } = getShippingDatesRange(
      group.shippingDeliveryMin,
      group.shippingDeliveryMax,
      group.createdAt
    );
    return {
      shippingService: group.shippingService,
      deliveryMinDate: minDate,
      deliveryMaxDate: maxDate,
    };
  });
  return (
    <div>
      <section className="p-2 relative">
        <div className="w-full space-y-4">
          {groups.map((group, index) => {
            const deliveryInfo = deliveryDetails[index];
            return (
              <OrderGroupTable
                key={group.id}
                group={group}
                deliveryInfo={deliveryInfo}
                check={check}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default OrderGroupsContainer;
