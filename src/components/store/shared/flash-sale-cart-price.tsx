"use client";

import { useEffect, useState } from "react";
import { getProductFlashSaleDiscount } from "@/queries/flash-sale";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  originalPrice: number;
  quantity: number;
  showFlashSaleBadge?: boolean;
  className?: string;
}

const FlashSaleCartPrice = ({
  productId,
  originalPrice,
  quantity,
  showFlashSaleBadge = true,
  className = "",
}: Props) => {
  const [flashSaleDiscount, setFlashSaleDiscount] =
    useState<FlashSaleDiscount | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const fetchFlashSaleDiscount = async () => {
      try {
        const discount = await getProductFlashSaleDiscount(productId);
        setFlashSaleDiscount(discount);
      } catch (error) {
        console.error("Error fetching flash sale discount:", error);
      }
    };

    fetchFlashSaleDiscount();
  }, [productId]);

  useEffect(() => {
    if (!flashSaleDiscount) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(flashSaleDiscount.endDate).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        // Flash sale ended
        setFlashSaleDiscount(null);
        setTimeLeft("");
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSaleDiscount]);

  // Calculate final price with flash sale discount
  let finalPrice = originalPrice;

  if (flashSaleDiscount) {
    if (flashSaleDiscount.discountType === "PERCENTAGE") {
      const customDiscount =
        flashSaleDiscount.customDiscountValue ||
        flashSaleDiscount.discountValue;
      finalPrice = originalPrice * (1 - customDiscount / 100);

      // Apply max discount limit if exists
      if (flashSaleDiscount.maxDiscount) {
        const maxDiscountAmount =
          (originalPrice * flashSaleDiscount.maxDiscount) / 100;
        const currentDiscount = originalPrice - finalPrice;
        if (currentDiscount > maxDiscountAmount) {
          finalPrice = originalPrice - maxDiscountAmount;
        }
      }
    } else {
      const customDiscount =
        flashSaleDiscount.customDiscountValue ||
        flashSaleDiscount.discountValue;
      finalPrice = Math.max(originalPrice - customDiscount, 0);
    }
  }

  const totalPrice = finalPrice * quantity;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {flashSaleDiscount && showFlashSaleBadge && (
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="destructive" className="text-xs">
            <Flame className="w-3 h-3 mr-1" />
            FLASH SALE
          </Badge>
          <span className="text-xs text-red-600">Ends in: {timeLeft}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="font-semibold text-orange-primary">
          ${finalPrice.toFixed(2)} x {quantity} = ${totalPrice.toFixed(2)}
        </span>

        {flashSaleDiscount && originalPrice !== finalPrice && (
          <span className="text-sm text-gray-500 line-through">
            ${(originalPrice * quantity).toFixed(2)}
          </span>
        )}
      </div>

      {flashSaleDiscount && (
        <div className="text-xs text-red-600">
          +
          {flashSaleDiscount.discountType === "PERCENTAGE"
            ? `${
                flashSaleDiscount.customDiscountValue ||
                flashSaleDiscount.discountValue
              }%`
            : `$${
                flashSaleDiscount.customDiscountValue ||
                flashSaleDiscount.discountValue
              }`}{" "}
          FLASH SALE
        </div>
      )}
    </div>
  );
};

export default FlashSaleCartPrice;
