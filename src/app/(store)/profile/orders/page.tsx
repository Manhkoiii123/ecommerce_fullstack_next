import OrdersTable from "@/components/store/profile/orders/orders-table";
import { getUserOrders } from "@/queries/profile";
import React from "react";

const OrderPage = async () => {
  const orders = await getUserOrders();
  return (
    <div>
      <OrdersTable orders={orders.orders} totalPages={orders.totalPages} />
    </div>
  );
};

export default OrderPage;
