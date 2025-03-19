/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import ProductShippingFee from "@/components/store/product-page/shipping/shipping-fee";
import { ProductShippingDetailsType } from "@/lib/types";
import { ChevronRight, Truck } from "lucide-react";
import { FC, useEffect, useState } from "react";

interface Props {
  shippingDetails: ProductShippingDetailsType;
  quantity: number;
  weight: number;
  loading?: boolean;
  // countryName: string;
}

const ShippingDetails: FC<Props> = ({
  quantity,
  shippingDetails,
  weight,
  loading,
}) => {
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
            {shippingDetails.isFreeShipping ? (
              <span className="text-sm font-bold flex items-center">
                <span>
                  Free Shipping to&nbsp;
                  <span>{countryName}</span>
                </span>
              </span>
            ) : (
              <span className="text-sm font-bold flex items-center">
                <span>Shipping to {countryName}</span>
                <span className="flex items-center">
                  &nbsp;for $&nbsp;
                  {loading ? (
                    <></>
                  ) : (
                    // <MoonLoader size={12} color="#e5e5e5" />
                    shippingTotal
                  )}
                </span>
              </span>
            )}
          </div>
          <ChevronRight className="w-3" />
        </div>
        <ProductShippingFee fee={shippingFee} extraFee={extraShippingFee} method={shippingFeeMethod} quantity={quantity} weight={weight} />
      </div>
    </div>
  );
};

export default ShippingDetails;
