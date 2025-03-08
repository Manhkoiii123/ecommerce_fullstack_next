/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { ProductShippingDetailsType } from "@/lib/types";
import { Truck } from "lucide-react";
import { FC, useEffect, useState } from "react";

interface Props {
  shippingDetails: ProductShippingDetailsType;
  quantity: number;
  weight: number;
  // loading: boolean;
  // countryName: string;
}

const ShippingDetails: FC<Props> = ({ quantity, shippingDetails, weight }) => {
  if (typeof shippingDetails === "boolean") return null;

  const [shippingTotal, setShippingTotal] = useState<number>(0);
  const {
    countryName,
    deliveryTimeMax,
    extraShippingFee,
    shippingFee,
    deliveryTimeMin,
    returnPolicy,
    shippingFeeMethod,
    shippingService,
  } = shippingDetails;
  useEffect(() => {
    if (!shippingDetails) return;

    const { shippingFee, extraShippingFee, shippingFeeMethod } =
      shippingDetails;

    switch (shippingFeeMethod) {
      case "ITEM":
        let qty = quantity - 1;
        setShippingTotal(shippingFee + qty * extraShippingFee);
        break;
      case "WEIGHT":
        setShippingTotal(shippingFee * quantity);
        break;
      case "FIXED":
        setShippingTotal(shippingFee);
        break;
      default:
        setShippingTotal(0);
        break;
    }
  }, [quantity, shippingDetails]);

  return (
    <div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-1">
            <Truck className="w-4" />
            <span className="text-sm font-bold flex items-center">
              <span>
                Shipping to&nbsp; <span>{countryName}</span>
              </span>
              <span>&nbsp;for ${shippingTotal}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingDetails;
