"use client";
import { useCartStore } from "@/cart-store/useCartStore";
import CartProduct from "@/components/store/cards/cart-product";
import FastDelivery from "@/components/store/cards/fast-delivery";
import CartHeader from "@/components/store/cart-page/cart-header";
import EmptyCart from "@/components/store/cart-page/empty-cart";
import CartSummary from "@/components/store/cart-page/summary";

import { SecurityPrivacyCard } from "@/components/store/product-page/returns-security-privacy-card";
import CountryNote from "@/components/store/shared/country-note";
import useFromStore from "@/hooks/useFromStore";
import { CartProductType, Country } from "@/lib/types";
import { updateCartWithLatest } from "@/queries/user";
import React, { useEffect, useState } from "react";

const CartContainer = ({ userCountry }: { userCountry: Country }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [isCartLoaded, setIsCartLoaded] = useState<boolean>(false);
  const cartItems = useFromStore(useCartStore, (state) => state.cart);
  const [selectedItems, setSelectedItems] = useState<CartProductType[]>([]);
  const [totalShipping, setTotalShipping] = useState<number>(0);

  // Tính toán tổng phí ship chỉ cho những sản phẩm đã chọn
  const calculateSelectedItemsShipping = () => {
    let total = 0;

    selectedItems.forEach((item) => {
      let itemShippingFee = 0;

      if (item.shippingMethod === "ITEM") {
        const initialFee = item.shippingFee;
        const extraFee =
          item.quantity > 1 ? item.extraShippingFee * (item.quantity - 1) : 0;
        itemShippingFee = initialFee + extraFee;
      } else if (item.shippingMethod === "WEIGHT") {
        itemShippingFee = item.shippingFee * item.weight * item.quantity;
      } else if (item.shippingMethod === "FIXED") {
        itemShippingFee = item.shippingFee;
      }

      total += itemShippingFee;
    });

    setTotalShipping(total);
  };
  const setCart = useCartStore((state) => state.setCart);
  useEffect(() => {
    if (cartItems !== undefined) {
      setIsCartLoaded(true);
    }
  }, [cartItems]);

  useEffect(() => {
    const loadAndSyncCart = async () => {
      if (cartItems?.length) {
        try {
          const updatedCart = await updateCartWithLatest(cartItems);
          setCart(updatedCart);
          setLoading(false);
        } catch (error) {
          setLoading(false);
        }
      }
    };
    loadAndSyncCart();
  }, [isCartLoaded, userCountry]);

  // Tính toán lại phí ship mỗi khi selectedItems thay đổi
  useEffect(() => {
    calculateSelectedItemsShipping();
  }, [
    JSON.stringify(
      selectedItems.map(
        (item) => `${item.productId}-${item.variantId}-${item.sizeId}`
      )
    ),
  ]);
  return (
    <div>
      {cartItems && cartItems.length > 0 ? (
        <>
          {loading ? (
            <div>loading...</div>
          ) : (
            <>
              <div className="bg-[#f5f5f5] min-h-[calc(100vh-65px)]">
                <div className="max-w-[1200px] mx-auto py-6 flex">
                  <div className="min-w-0 flex-1">
                    {/* cart header */}
                    <CartHeader
                      cartItems={cartItems}
                      selectedItems={selectedItems}
                      setSelectedItems={setSelectedItems}
                    />
                    <div className="my-2">
                      <CountryNote country={userCountry.name} />
                    </div>
                    <div className="h-auto overflow-x-hidden overflow-auto mt-2">
                      {/* cart items */}
                      {cartItems.map((product) => (
                        <CartProduct
                          key={`${product.productSlug}-${product.variantSlug}`}
                          product={product}
                          selectedItems={selectedItems}
                          setSelectedItems={setSelectedItems}
                          onSelectionChange={calculateSelectedItemsShipping}
                          userCountry={userCountry}
                        />
                      ))}
                    </div>
                  </div>
                  {/* card side */}
                  <div className="sticky top-4 ml-5 w-[380px] max-h-max">
                    {/* cart summary - chỉ hiển thị khi có sản phẩm được chọn */}
                    {selectedItems.length > 0 ? (
                      <>
                        <CartSummary
                          selectedItems={selectedItems}
                          shippingFees={totalShipping}
                        />
                        <div className="mt-2 bg-white p-4 px-6">
                          <FastDelivery />
                        </div>
                        <div className="mt-2 bg-white p-4 px-6">
                          <SecurityPrivacyCard />
                        </div>
                      </>
                    ) : (
                      <div className="bg-white p-4 px-6 text-center text-gray-500">
                        <p>Select items to see summary</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <EmptyCart />
      )}
    </div>
  );
};

export default CartContainer;
