"use client";
import { CartWithCartItemsType, UserShippingAddressType } from "@/lib/types";
import { Country, ShippingAddress } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { Country as CountryType } from "@/lib/types";
import UserShippingAddresses from "@/components/store/shared/shipping-addresses/shipping-addresses";
import CheckoutProductCard from "@/components/store/cards/checkout-product";
import PlaceOrderCard from "@/components/store/cards/place-order";
import CountryNote from "@/components/store/shared/country-note";
import { updateCheckoutProductstWithLatest } from "@/queries/user";
interface Props {
  cart: CartWithCartItemsType;
  countries: Country[];
  addresses: UserShippingAddressType[];
  userCountry: CountryType;
}
const CheckoutContainer = ({
  cart,
  countries,
  addresses,
  userCountry,
}: Props) => {
  const [cartData, setCartData] = useState<CartWithCartItemsType>(cart);
  const [selectedAddress, setSelectedAddress] =
    useState<ShippingAddress | null>(null);
  const { cartItems } = cart;
  const activeCountry = addresses.find(
    (add) => add.countryId === selectedAddress?.countryId
  )?.country;

  useEffect(() => {
    const hydrateCheckoutCart = async () => {
      const updatedCart = await updateCheckoutProductstWithLatest(
        cartItems,
        activeCountry
      );
      setCartData(updatedCart);
    };

    if (cartItems.length > 0) {
      hydrateCheckoutCart();
    }
  }, [activeCountry]);
  return (
    <div className="w-full flex flex-col gap-y-2 lg:flex-row">
      <div className="space-y-2 lg:flex-1">
        <UserShippingAddresses
          addresses={addresses}
          countries={countries}
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />
        <CountryNote
          country={activeCountry ? activeCountry.name : userCountry.name}
        />
        <div className="w-full p-4 bg-white my-3">
          <div className="relative">
            {cartData.cartItems.map((product) => (
              <CheckoutProductCard
                key={product.variantId}
                product={product}
                isDiscounted={cartData.coupon?.storeId === product.storeId}
              />
            ))}
          </div>
        </div>
      </div>
      {/* card side */}
      <PlaceOrderCard
        cardId={cartData.id}
        shippingAddress={selectedAddress}
        shippingFees={cartData.shippingFees}
        subTotal={cartData.subTotal}
        total={cartData.total}
        setCartData={setCartData}
        cartData={cartData}
      />
    </div>
  );
};

export default CheckoutContainer;
