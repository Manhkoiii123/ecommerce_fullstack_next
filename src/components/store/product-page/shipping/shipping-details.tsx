/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import ProductShippingFee from "@/components/store/product-page/shipping/shipping-fee";
import { ProductShippingDetailsType } from "@/lib/types";
import { getShippingDatesRange } from "@/lib/utils";
import { ChevronDown, ChevronRight, ChevronUp, Truck } from "lucide-react";
import { FC, useEffect, useState } from "react";

interface Props {
  shippingDetails: ProductShippingDetailsType;
  quantity: number;
  weight: number;
  loading?: boolean;
  freeShippingForAllCountries?: boolean;
  // countryName: string;
}

const ShippingDetails: FC<Props> = ({
  quantity,
  shippingDetails,
  weight,
  loading,
  freeShippingForAllCountries,
}) => {
  if (typeof shippingDetails === "boolean") return null;
  const [toggle, setToggle] = useState<boolean>(true);
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
  const { minDate, maxDate } = shippingDetails
    ? getShippingDatesRange(deliveryTimeMin, deliveryTimeMax)
    : { minDate: "Loading...", maxDate: "Loading..." };
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
  }, [quantity, shippingDetails, countryName]);

  return (
    <div>
      {freeShippingForAllCountries ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-1">
              <Truck className="w-4" />
              <span className="text-sm font-bold flex items-center">
                <span>
                  Free Shipping to&nbsp;
                  <span>{countryName}</span>
                </span>
              </span>
            </div>
            <ChevronRight className="w-3" />
          </div>
        </>
      ) : (
        <>
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
            <span className="flex items-center text-sm ml-5">
              Service:&nbsp;
              <strong className="text-sm">{shippingService}</strong>
            </span>
            <span className="flex items-center text-sm ml-5">
              Delivery:&nbsp;
              <strong className="text-sm">
                {`${minDate.slice(4)} - ${maxDate.slice(4)}`}
              </strong>
            </span>
            {!shippingDetails.isFreeShipping && toggle && (
              <ProductShippingFee
                fee={shippingFee}
                extraFee={extraShippingFee}
                method={shippingFeeMethod}
                quantity={quantity}
                weight={weight}
              />
            )}
            <div
              onClick={() => setToggle((prev) => !prev)}
              className="max-w-[calc(100%-2rem)] ml-4 flex items-center bg-gray-100 hover:bg-gray-200 h-5 cursor-pointer"
            >
              <div className="w-full flex items-center justify-between gap-x-1 px-2">
                <span className="text-xs">
                  {toggle ? "Hide" : "Shipping Fee Breakdown"}
                </span>
                {toggle ? (
                  <ChevronUp className="w-4" />
                ) : (
                  <ChevronDown className="w-4" />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShippingDetails;
