/* eslint-disable react-hooks/rules-of-hooks */
import { CartProductType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

interface SimplifiedSize {
  id: string;
  size: string;
  quantity: number;
  price: number;
  discount: number;
}
interface Props {
  sizeId?: string | undefined;
  sizes: SimplifiedSize[];
  isCard?: boolean;
  handleChange?: (property: keyof CartProductType, value: any) => void;
}
const ProductPrice = ({ sizes, isCard, sizeId, handleChange }: Props) => {
  const pathname = usePathname();
  const { replace, push } = useRouter();
  if (!sizes || sizes.length === 0) {
    return;
  }
  if (!sizeId) {
    const discountPrices = sizes.map((s) => s.price * (1 - s.discount / 100));
    const totalQuantity = sizes.reduce((a, b) => a + b.quantity, 0);
    const minPrice = Math.min(...discountPrices).toFixed(2);
    const maxPrice = Math.max(...discountPrices).toFixed(2);
    const priceDisplay =
      minPrice === maxPrice ? minPrice : `$${minPrice} - $${maxPrice}`;

    let discount = 0;
    if (minPrice === maxPrice) {
      let check_discount = sizes.find((s) => s.discount > 0);
      if (check_discount) {
        discount = check_discount.discount;
      }
    }
    return (
      <div>
        <div className="text-orange-primary inline-block font-bold leading-none mr-2.5 ">
          <span
            className={cn("inline-block text-4xl text-nowrap", {
              "text-lg": isCard,
            })}
          >
            {priceDisplay}
          </span>
        </div>
        {!sizeId && !isCard && (
          <div className="text-orange-background text-xs leading-4 mt-1">
            <span>Note: Select a size to see the exact price</span>
          </div>
        )}
        {!sizeId && !isCard && (
          <p className="mt-2 text-xs">{totalQuantity} pieces</p>
        )}
      </div>
    );
  }
  const selectedSize = sizes.find((s) => s.id === sizeId);
  if (!selectedSize) return <></>;
  const discountedPrice =
    selectedSize.price * (1 - selectedSize.discount / 100);
  useEffect(() => {
    if (handleChange) {
      // khi thay đổi size thì đổi giá theo cái size đấy => update cái data để addtocart
      handleChange("price", discountedPrice);
      // thay đổi cả cái stock trong cái data thêm vào
      handleChange("stock", selectedSize.quantity);
    }
  }, [sizeId]);
  return (
    <div>
      <div className="text-orange-primary inline-block font-bold leading-none mr-2.5">
        <span className="inline-block text-4xl">
          ${discountedPrice.toFixed(2)}
        </span>
      </div>
      {selectedSize.price !== discountedPrice && (
        <span className="text-[#999] inline-block text-xl font-normal leading-6 mr-2 line-through">
          ${selectedSize.price.toFixed(2)}
        </span>
      )}
      {selectedSize.discount > 0 && (
        <span className="inline-block text-orange-seconadry text-xl leading-6">
          {selectedSize.discount}% off
        </span>
      )}
      <p className="mt-2 text-xs">
        {selectedSize.quantity > 0 ? (
          `${selectedSize.quantity} items`
        ) : (
          <span className="text-red-500">Out of stock</span>
        )}
      </p>
    </div>
  );
};

export default ProductPrice;
