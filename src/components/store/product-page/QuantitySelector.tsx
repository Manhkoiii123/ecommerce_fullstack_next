/* eslint-disable react-hooks/rules-of-hooks */
import { CartProductType } from "@/lib/types";
import { Size } from "@prisma/client";
import { Minus, Plus } from "lucide-react";
import React, { useEffect } from "react";
interface QuantitySelectorProps {
  productId: string;
  variantId: string;
  sizeId: string | null;
  quantity: number;
  handleChange: (property: keyof CartProductType, value: any) => void;
  size: Size[];
  stock: number;
}
const QuantitySelector = ({
  handleChange,
  productId,
  quantity,
  size,
  sizeId,
  variantId,
  stock,
}: QuantitySelectorProps) => {
  if (!sizeId) return null;
  useEffect(() => {
    handleChange("quantity", 1);
  }, [sizeId]);
  const handleIncrease = () => {
    if (quantity < stock) {
      handleChange("quantity", quantity + 1);
    }
  };
  const handleDecrease = () => {
    if (quantity > 1) {
      handleChange("quantity", quantity - 1);
    }
  };
  return (
    <div className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg">
      <div className="w-full flex justify-between items-center gap-x-5">
        <div className="grow">
          <span className="block text-xs text-gray-500">Select quantity</span>
          <input
            type="number"
            min={1}
            value={quantity}
            readOnly
            className="w-full p-0 bg-transparent border-0 focus:outline-none text-gray-800"
          />
        </div>
        <div className="flex justify-end items-center gap-x-1.5">
          <button
            onClick={handleDecrease}
            disabled={quantity === 1}
            className="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Minus className="w-3" />
          </button>
          <button
            onClick={handleIncrease}
            disabled={quantity === stock}
            className="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus className="w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantitySelector;
