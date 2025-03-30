"use client";
import { CartWithCartItemsType, UserShippingAddressType } from "@/lib/types";
import { Country, ShippingAddress } from "@prisma/client";
import React, { useState } from "react";
import { Country as CountryType } from "@/lib/types";
import UserShippingAddresses from "@/components/store/shared/shipping-addresses/shipping-addresses";
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
              //CheckoutProductCard
              <div key={product.id}></div>
            ))}
          </div>
        </div>
      </div>
      {/* card side */}
    </div>
  );
};

export default CheckoutContainer;
