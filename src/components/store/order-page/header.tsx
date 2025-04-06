"use client";
import OrderStatusTag from "@/components/store/shared/order-status";
import PaymentStatusTag from "@/components/store/shared/payment-status";
import { Button } from "@/components/ui/button";
import { OrderFulltType, OrderStatus, PaymentStatus } from "@/lib/types";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import React from "react";

const OrderHeader = ({ order }: { order: OrderFulltType }) => {
  if (!order) return;
  const handleDownload = () => {};
  const handlePrint = () => {};

  return (
    <div>
      <div className="w-full border-b flex flex-col min-[1100px]:flex-row gap-4 p-2">
        <div className="min-[1100px]:w-[920px] xl:w-[990px] flex items-center gap-x-3 ">
          <div className="border-r pr-4">
            <button className="w-10 h-10 border rounded-full grid place-items-center">
              <ChevronLeft className="stroke-main-secondary" />
            </button>
          </div>
          <h1 className="text-main-secondary">Order Details</h1>
          <ChevronRight className="stroke-main-secondary w-4" />
          <h2>Order #{order.id}</h2>
        </div>
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 ">
          <div className="w-full flex items-center gap-x-4">
            <PaymentStatusTag status={order.paymentStatus as PaymentStatus} />
            <OrderStatusTag status={order.orderStatus as OrderStatus} />
          </div>
          <div className="flex items-center gap-x-4">
            <Button variant="outline" onClick={() => handleDownload()}>
              <Download className="w-4 me-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => handlePrint()}>
              <Printer className="w-4 me-2" />
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHeader;
