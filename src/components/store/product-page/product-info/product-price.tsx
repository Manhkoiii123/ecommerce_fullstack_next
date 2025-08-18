/* eslint-disable react-hooks/rules-of-hooks */
import { CartProductType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import FlashSalePrice from "@/components/store/shared/flash-sale-price";

interface SimplifiedSize {
  id: string;
  size: string;
  quantity: number;
  price: number;
  discount: number;
}
interface Props {
  productId: string; // Add productId for flash sale
  sizeId?: string | undefined;
  sizes: SimplifiedSize[];
  isCard?: boolean;
  handleChange?: (property: keyof CartProductType, value: any) => void;
}
const ProductPrice = ({ productId, sizes, isCard, sizeId, handleChange }: Props) => {
  // Use FlashSalePrice component for flash sale support
  return (
    <FlashSalePrice
      productId={productId}
      sizes={sizes}
      isCard={isCard}
      sizeId={sizeId}
      handleChange={handleChange}
    />
  );
};

export default ProductPrice;
