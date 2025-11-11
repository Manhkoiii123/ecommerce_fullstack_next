"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { getProductFlashSaleDiscount } from "@/queries/flash-sale";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CartProductType } from "@/lib/types";

interface SimplifiedSize {
  id: string;
  size: string;
  quantity: number;
  price: number;
  discount: number;
}

interface FlashSaleDiscount {
  flashSaleId: string;
  flashSaleName: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscount: number | null;
  endDate: Date;
  customDiscountValue: number | null;
  customMaxDiscount: number | null;
}

interface Props {
  productId: string;
  sizes: SimplifiedSize[];
  isCard?: boolean;
  sizeId?: string;
  handleChange?: (property: keyof CartProductType, value: any) => void;
}

const FlashSalePrice = ({
  productId,
  sizes,
  isCard,
  sizeId,
  handleChange,
}: Props) => {
  const [flashSaleDiscount, setFlashSaleDiscount] =
    useState<FlashSaleDiscount | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const lastValues = useRef({
    price: 0,
    stock: 0,
    sizeId: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const discount = await getProductFlashSaleDiscount(productId);
        setFlashSaleDiscount(discount);
      } catch (err) {
        console.error("Error fetching flash sale discount:", err);
      }
    })();
  }, [productId]);

  useEffect(() => {
    if (!flashSaleDiscount) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const end = new Date(flashSaleDiscount.endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setFlashSaleDiscount(null);
        setTimeLeft("");
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSaleDiscount]);

  const calculateFinalPrice = useCallback(
    (price: number, discount: number): number => {
      const basePrice = price * (1 - discount / 100);
      if (!flashSaleDiscount) return basePrice;

      const { discountType, discountValue, customDiscountValue, maxDiscount } =
        flashSaleDiscount;

      const appliedValue = customDiscountValue ?? discountValue;
      let finalPrice =
        discountType === "PERCENTAGE"
          ? basePrice * (1 - appliedValue / 100)
          : Math.max(basePrice - appliedValue, 0);

      if (maxDiscount && discountType === "PERCENTAGE") {
        const maxAmount = (basePrice * maxDiscount) / 100;
        const currentDiscount = basePrice - finalPrice;
        if (currentDiscount > maxAmount) {
          finalPrice = basePrice - maxAmount;
        }
      }

      return finalPrice;
    },
    [flashSaleDiscount]
  );

  useEffect(() => {
    if (!handleChange || !sizeId) return;
    const size = sizes.find((s) => s.id === sizeId);
    if (!size) return;

    const finalPrice = calculateFinalPrice(size.price, size.discount);

    const changed =
      lastValues.current.price !== finalPrice ||
      lastValues.current.stock !== size.quantity ||
      lastValues.current.sizeId !== sizeId;

    if (changed) {
      handleChange("price", finalPrice);
      handleChange("stock", size.quantity);
      lastValues.current = {
        price: finalPrice,
        stock: size.quantity,
        sizeId,
      };
    }
  }, [sizeId, sizes, calculateFinalPrice, handleChange]);

  const renderPriceInfo = useMemo(() => {
    if (!sizes.length) return null;

    if (!sizeId) {
      const prices = sizes.map((s) => calculateFinalPrice(s.price, s.discount));
      const min = Math.min(...prices).toFixed(2);
      const max = Math.max(...prices).toFixed(2);
      const display = min === max ? `$${min}` : `$${min} - $${max}`;
      const totalStock = sizes.reduce((a, b) => a + b.quantity, 0);

      return (
        <div>
          {flashSaleDiscount && (
            <div className="mb-2">
              <Badge variant="destructive" className="text-xs">
                <Flame className="w-3 h-3 mr-1" /> FLASH SALE
              </Badge>
              <div className="text-xs text-red-600 mt-1">
                Ends in: {timeLeft}
              </div>
            </div>
          )}

          <div className="text-orange-primary inline-block font-bold leading-none mr-2.5">
            <span
              className={cn("inline-block text-4xl text-nowrap", {
                "text-lg": isCard,
              })}
            >
              {display}
            </span>
          </div>

          {!isCard && (
            <>
              <div className="text-orange-background text-xs leading-4 mt-1">
                Note: Select a size to see the exact price
              </div>
              <p className="mt-2 text-xs">{totalStock} pieces</p>
            </>
          )}
        </div>
      );
    }

    const size = sizes.find((s) => s.id === sizeId);
    if (!size) return null;

    const finalPrice = calculateFinalPrice(size.price, size.discount);
    const flashText =
      flashSaleDiscount &&
      (flashSaleDiscount.discountType === "PERCENTAGE"
        ? `${
            flashSaleDiscount.customDiscountValue ??
            flashSaleDiscount.discountValue
          }%`
        : `$${
            flashSaleDiscount.customDiscountValue ??
            flashSaleDiscount.discountValue
          }`);

    return (
      <div>
        {flashSaleDiscount && (
          <div className="mb-2">
            <Badge variant="destructive" className="text-xs">
              <Flame className="w-3 h-3 mr-1" /> FLASH SALE
            </Badge>
            <div className="text-xs text-red-600 mt-1">Ends in: {timeLeft}</div>
          </div>
        )}

        <div className="text-orange-primary inline-block font-bold leading-none mr-2.5">
          <span className="inline-block text-4xl">
            ${finalPrice.toFixed(2)}
          </span>
        </div>

        {size.price !== finalPrice && (
          <span className="text-[#999] inline-block text-xl font-normal leading-6 mr-2 line-through">
            ${size.price.toFixed(2)}
          </span>
        )}

        {size.discount > 0 && (
          <span className="inline-block text-orange-secondary text-xl leading-6">
            {size.discount}% off
          </span>
        )}

        {flashSaleDiscount && (
          <span className="inline-block text-red-600 text-lg leading-6 ml-2">
            + {flashText} FLASH SALE
          </span>
        )}

        <p className="mt-2 text-xs">
          {size.quantity > 0 ? (
            `${size.quantity} items`
          ) : (
            <span className="text-red-500">Out of stock</span>
          )}
        </p>
      </div>
    );
  }, [sizes, sizeId, flashSaleDiscount, timeLeft, isCard, calculateFinalPrice]);

  return renderPriceInfo;
};

export default FlashSalePrice;
