"use client";
import { useCartStore } from "@/cart-store/useCartStore";
import CartProduct from "@/components/store/cards/cart-product";
import FastDelivery from "@/components/store/cards/fast-delivery";
import CartHeader from "@/components/store/cart-page/cart-header";
import EmptyCart from "@/components/store/cart-page/empty-cart";
import CartSummary from "@/components/store/cart-page/summary";
import { SecurityPrivacyCard } from "@/components/store/product-page/returns-security-privacy-card";
import useFromStore from "@/hooks/useFromStore";
import { CartProductType } from "@/lib/types";
import React, { useState } from "react";

const CartPage = () => {
  const cartItems = useFromStore(useCartStore, (state) => state.cart);
  const [selectedItems, setSelectedItems] = useState<CartProductType[]>([]);
  const [totalShipping, setTotalShipping] = useState<number>(0);
  return (
    <div>
      {cartItems && cartItems.length > 0 ? (
        <>
          <div className="bg-[#f5f5f5]">
            <div className="max-w-[1200px] mx-auto py-6 flex">
              <div className="min-w-0 flex-1">
                {/* cart header */}
                <CartHeader
                  cartItems={cartItems}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                />
                <div className="h-auto overflow-x-hidden overflow-auto mt-2">
                  {/* cart items */}
                  {cartItems.map((product) => (
                    <CartProduct
                      key={`${product.productSlug}-${product.variantSlug}`}
                      product={product}
                      selectedItems={selectedItems}
                      setSelectedItems={setSelectedItems}
                      setTotalShipping={setTotalShipping}
                    />
                  ))}
                </div>
              </div>
              {/* card side */}
              <div className="sticky top-4 ml-5 w-[380px] max-h-max">
                {/* cart summary */}
                <CartSummary
                  cartItems={cartItems}
                  shippingFees={totalShipping}
                />
                <div className="mt-2 bg-white p-4 px-6">
                  <FastDelivery />
                </div>
                <div className="mt-2 bg-white p-4 px-6">
                  <SecurityPrivacyCard />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <EmptyCart />
      )}
    </div>
  );
};

export default CartPage;
