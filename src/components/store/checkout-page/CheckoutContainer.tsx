"use client";
import { CartWithCartItemsType, UserShippingAddressType } from "@/lib/types";
import { Country, ShippingAddress } from "@prisma/client";
import React, { useState } from "react";
import { Country as CountryType } from "@/lib/types";
import UserShippingAddresses from "@/components/store/shared/shipping-addresses/shipping-addresses";
import CheckoutProductCard from "@/components/store/cards/checkout-product";
import PlaceOrderCard from "@/components/store/cards/place-order";
interface Props {
  cart: CartWithCartItemsType;
  countries: Country[];
  addresses: UserShippingAddressType[];
  //   userCountry: CountryType;
}
const CheckoutContainer = ({ cart, countries, addresses }: Props) => {
  const [selectedAddress, setSelectedAddress] =
    useState<ShippingAddress | null>(null);
  return (
    <div className="w-full flex flex-col gap-y-2 lg:flex-row">
      <div className="space-y-2 lg:flex-1">
        <UserShippingAddresses
          addresses={addresses}
          countries={countries}
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />
        <div className="w-full p-4 bg-white my-3">
          <div className="relative">
            {cart.cartItems.map((product) => (
              <CheckoutProductCard
                key={product.variantId}
                product={product}
                // isDiscounted={cartData.coupon?.storeId === product.storeId}
              />
            ))}
          </div>
        </div>
      </div>
      {/* card side */}
      <PlaceOrderCard
        cardId={cart.id}
        shippingAddress={selectedAddress}
        shippingFees={cart.shippingFees}
        subTotal={cart.subTotal}
        total={cart.total}
      />
    </div>
  );
};

export default CheckoutContainer;
