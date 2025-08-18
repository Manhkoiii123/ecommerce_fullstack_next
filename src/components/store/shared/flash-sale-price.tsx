"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

  // Use refs to track last values to prevent infinite loops
  const lastPriceRef = useRef<number | null>(null);
  const lastStockRef = useRef<number | null>(null);
  const lastSizeIdRef = useRef<string | null>(null);

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

  // Move useEffect to top level before any early returns
  useEffect(() => {
    if (handleChange && sizeId) {
      const selectedSize = sizes.find((s) => s.id === sizeId);
      if (selectedSize) {
        const basePrice =
          selectedSize.price * (1 - selectedSize.discount / 100);
        let finalPrice = basePrice;

        if (flashSaleDiscount) {
          if (flashSaleDiscount.discountType === "PERCENTAGE") {
            const customDiscount =
              flashSaleDiscount.customDiscountValue ||
              flashSaleDiscount.discountValue;
            finalPrice = basePrice * (1 - customDiscount / 100);
          } else {
            const customDiscount =
              flashSaleDiscount.customDiscountValue ||
              flashSaleDiscount.discountValue;
            finalPrice = Math.max(basePrice - customDiscount, 0);
          }

          if (
            flashSaleDiscount.maxDiscount &&
            flashSaleDiscount.discountType === "PERCENTAGE"
          ) {
            const maxDiscountAmount =
              (basePrice * flashSaleDiscount.maxDiscount) / 100;
            const currentDiscount = basePrice - finalPrice;
            if (currentDiscount > maxDiscountAmount) {
              finalPrice = basePrice - maxDiscountAmount;
            }
          }
        }

        // Only call handleChange if values actually changed
        if (
          lastPriceRef.current !== finalPrice ||
          lastStockRef.current !== selectedSize.quantity ||
          lastSizeIdRef.current !== sizeId
        ) {
          handleChange("price", finalPrice);
          handleChange("stock", selectedSize.quantity);

          // Update refs
          lastPriceRef.current = finalPrice;
          lastStockRef.current = selectedSize.quantity;
          lastSizeIdRef.current = sizeId;
        }
      }
    }
  }, [sizeId, flashSaleDiscount, sizes, handleChange]);

  if (!sizes || sizes.length === 0) {
    return null;
  }

  if (!sizeId) {
    // Calculate prices with flash sale discount
    const calculateFinalPrice = (price: number, discount: number) => {
      if (!flashSaleDiscount) {
        return price * (1 - discount / 100);
      }

      const basePrice = price * (1 - discount / 100);
      let flashSalePrice = basePrice;

      if (flashSaleDiscount.discountType === "PERCENTAGE") {
        const customDiscount =
          flashSaleDiscount.customDiscountValue ||
          flashSaleDiscount.discountValue;
        flashSalePrice = basePrice * (1 - customDiscount / 100);
      } else {
        const customDiscount =
          flashSaleDiscount.customDiscountValue ||
          flashSaleDiscount.discountValue;
        flashSalePrice = Math.max(basePrice - customDiscount, 0);
      }

      if (
        flashSaleDiscount.maxDiscount &&
        flashSaleDiscount.discountType === "PERCENTAGE"
      ) {
        const maxDiscountAmount =
          (basePrice * flashSaleDiscount.maxDiscount) / 100;
        const currentDiscount = basePrice - flashSalePrice;
        if (currentDiscount > maxDiscountAmount) {
          flashSalePrice = basePrice - maxDiscountAmount;
        }
      }

      return flashSalePrice;
    };

    const finalPrices = sizes.map((s) =>
      calculateFinalPrice(s.price, s.discount)
    );
    const minPrice = Math.min(...finalPrices).toFixed(2);
    const maxPrice = Math.max(...finalPrices).toFixed(2);
    const priceDisplay =
      minPrice === maxPrice ? minPrice : `$${minPrice} - $${maxPrice}`;

    return (
      <div>
        {flashSaleDiscount && (
          <div className="mb-2">
            <Badge variant="destructive" className="text-xs">
              <Flame className="w-3 h-3 mr-1" />
              FLASH SALE
            </Badge>
            <div className="text-xs text-red-600 mt-1">Ends in: {timeLeft}</div>
          </div>
        )}

        <div className="text-orange-primary inline-block font-bold leading-none mr-2.5">
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
          <p className="mt-2 text-xs">
            {sizes.reduce((a, b) => a + b.quantity, 0)} pieces
          </p>
        )}
      </div>
    );
  }

  const selectedSize = sizes.find((s) => s.id === sizeId);
  if (!selectedSize) return null;

  // Calculate final price for selected size
  const basePrice = selectedSize.price * (1 - selectedSize.discount / 100);
  let finalPrice = basePrice;

  if (flashSaleDiscount) {
    if (flashSaleDiscount.discountType === "PERCENTAGE") {
      const customDiscount =
        flashSaleDiscount.customDiscountValue ||
        flashSaleDiscount.discountValue;
      finalPrice = basePrice * (1 - customDiscount / 100);
    } else {
      const customDiscount =
        flashSaleDiscount.customDiscountValue ||
        flashSaleDiscount.discountValue;
      finalPrice = Math.max(basePrice - customDiscount, 0);
    }

    if (
      flashSaleDiscount.maxDiscount &&
      flashSaleDiscount.discountType === "PERCENTAGE"
    ) {
      const maxDiscountAmount =
        (basePrice * flashSaleDiscount.maxDiscount) / 100;
      const currentDiscount = basePrice - finalPrice;
      if (currentDiscount > maxDiscountAmount) {
        finalPrice = basePrice - maxDiscountAmount;
      }
    }
  }

  return (
    <div>
      {flashSaleDiscount && (
        <div className="mb-2">
          <Badge variant="destructive" className="text-xs">
            <Flame className="w-3 h-3 mr-1" />
            FLASH SALE
          </Badge>
          <div className="text-xs text-red-600 mt-1">Ends in: {timeLeft}</div>
        </div>
      )}

      <div className="text-orange-primary inline-block font-bold leading-none mr-2.5">
        <span className="inline-block text-4xl">${finalPrice.toFixed(2)}</span>
      </div>

      {selectedSize.price !== finalPrice && (
        <span className="text-[#999] inline-block text-xl font-normal leading-6 mr-2 line-through">
          ${selectedSize.price.toFixed(2)}
        </span>
      )}

      {selectedSize.discount > 0 && (
        <span className="inline-block text-orange-seconadry text-xl leading-6">
          {selectedSize.discount}% off
        </span>
      )}

      {flashSaleDiscount && (
        <span className="inline-block text-red-600 text-lg leading-6 ml-2">
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

export default FlashSalePrice;
