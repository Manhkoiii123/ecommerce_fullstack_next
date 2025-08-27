"use client";
import { SimpleProduct } from "@/lib/types";
import AnimatedImg from "@/public/assets/images/ads/animated-deals.gif";
import TopSellerImg from "@/public/assets/images/featured/most-popular.avif";
import TopRatedImg from "@/public/assets/images/featured/top-rated.jpg";
import Image from "next/image";
import Link from "next/link";
import MainSwiper from "../shared/swiper";
import Countdown from "../shared/countdown";
import { FlashSale } from "@prisma/client";
import CountdownTimer from "@/components/shared/countdown-timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, ArrowRight } from "lucide-react";

// Define the extended type with products relation
type FlashSaleWithProducts = FlashSale & {
  products: Array<{
    product: {
      id: string;
      name: string;
      slug: string;
      variants: Array<{
        id: string;
        variantImage: string;
        sizes: Array<{
          id: string;
          price: number;
          discount: number;
        }>;
      }>;
    };
  }>;
};

// Component to display product with flash sale pricing
function FlashSaleProductCard({
  product,
  flashSale,
}: {
  product: FlashSaleWithProducts["products"][0];
  flashSale: FlashSaleWithProducts;
}) {
  const variant = product.product.variants[0];
  const size = variant?.sizes[0];

  if (!variant || !size) return null;

  const originalPrice = size.price;
  let discountedPrice = originalPrice;

  // Calculate discounted price based on flash sale
  if (flashSale.discountType === "PERCENTAGE") {
    const discountAmount = (originalPrice * flashSale.discountValue) / 100;
    discountedPrice = Math.max(0, originalPrice - discountAmount);
  } else if (flashSale.discountType === "FIXED_AMOUNT") {
    discountedPrice = Math.max(0, originalPrice - flashSale.discountValue);
  }

  return (
    <Link href={`/product/${product.product.slug}`}>
      <div className="bg-white rounded-lg p-2 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative">
          <Image
            src={variant.variantImage || "/placeholder-product.jpg"}
            alt={product.product.name}
            width={80}
            height={80}
            className="w-full h-20 object-cover rounded-md"
          />
          <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded">
            {flashSale.discountType === "PERCENTAGE"
              ? `${flashSale.discountValue}%`
              : `$${flashSale.discountValue}`}
          </div>
        </div>
        <div className="mt-2 text-center">
          <h4 className="text-xs font-medium text-gray-800 truncate">
            {product.product.name}
          </h4>
          <div className="flex flex-col items-center justify-center gap-1 mt-1">
            <span className="text-sm font-bold text-red-600">
              ${discountedPrice.toFixed(2)}
            </span>
            {discountedPrice < originalPrice && (
              <span className="text-xs text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AnimatedDeals({
  products,
  flashSale,
}: {
  products: SimpleProduct[];
  flashSale?: FlashSaleWithProducts;
}) {
  const getDiscountText = (sale: FlashSale) => {
    if (sale.discountType === "PERCENTAGE") {
      return `Up to ${sale.discountValue}% OFF`;
    }
    return `Up to $${sale.discountValue} OFF`;
  };

  const getProductCount = (sale: FlashSaleWithProducts) => {
    return sale.products?.length || 0;
  };

  return (
    <div className="relative bg-[#ed3835] w-full rounded-md overflow-hidden">
      {flashSale ? (
        // Flash Sale Mode
        <>
          <span className="inline-block w-full font-semibold text-center text-4xl text-white outline-none absolute top-[53%] z-10">
            {getDiscountText(flashSale)}
          </span>
          <Image
            src={AnimatedImg}
            alt=""
            width={2000}
            height={330}
            className="w-full h-[330px]"
          />

          {/* Flash Sale Info */}
          <div className="absolute top-[25%] left-[7%] min-[1070px]:left-[10%] bg-[#ffaf00] rounded-[24px] w-[140px] h-[181px] z-10 flex flex-col items-center justify-center p-2">
            <Flame className="h-8 w-8 text-white mb-2" />
            <span className="text-[16px] font-semibold text-center text-white">
              {flashSale.name}
            </span>
            <span className="text-[12px] text-center text-white mt-1">
              {getProductCount(flashSale)} products
            </span>
          </div>

          {/* Countdown Timer */}
          <div className="absolute top-[25%] right-[7%] min-[1070px]:right-[10%] bg-[#ffaf00] rounded-[24px] w-[140px] h-[181px] z-10 flex flex-col items-center justify-center p-2">
            <CountdownTimer
              endDate={flashSale.endDate}
              variant="compact"
              className="text-white"
            />
            <Link href={`/flash-sale/${flashSale.id}`} className="mt-2">
              <Button
                size="sm"
                className="bg-white text-orange-600 hover:bg-white/90 text-xs"
              >
                Shop Now
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Products with Flash Sale Pricing */}
          <div className="gap-[5px] w-[300px] min-[1100px]:w-[400px] min-[1400px]:w-[510px] absolute top-[3%] left-1/2 -translate-x-1/2">
            <div className="grid grid-cols-3 gap-2 min-[1100px]:grid-cols-4 min-[1400px]:grid-cols-5">
              {flashSale.products.slice(0, 5).map((product, index) => (
                <FlashSaleProductCard
                  key={product.product.id}
                  product={product}
                  flashSale={flashSale}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        // Original Mode
        <></>
      )}
    </div>
  );
}
