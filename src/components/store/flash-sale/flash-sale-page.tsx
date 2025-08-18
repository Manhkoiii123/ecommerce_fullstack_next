"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CountdownTimer from "@/components/shared/countdown-timer";
import { FlashSale } from "@prisma/client";
import {
  Flame,
  Clock,
  TrendingUp,
  ShoppingCart,
  Heart,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface FlashSalePageProps {
  flashSale: FlashSale & {
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
            size: string;
            price: number;
            discount: number;
          }>;
        }>;
      };
      customDiscountValue: number | null;
      customMaxDiscount: number | null;
    }>;
    store: {
      id: string;
      name: string;
      url: string;
    };
  };
}

export default function FlashSalePage({ flashSale }: FlashSalePageProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<"price" | "discount" | "name">(
    "discount"
  );

  const calculateDiscountedPrice = (
    originalPrice: number,
    sizeDiscount: number = 0
  ) => {
    let finalPrice = originalPrice;

    // Apply size-specific discount first
    if (sizeDiscount > 0) {
      finalPrice = originalPrice - sizeDiscount;
    }

    // Apply flash sale discount
    if (flashSale.discountType === "PERCENTAGE") {
      const flashDiscount = (finalPrice * flashSale.discountValue) / 100;
      finalPrice = finalPrice - flashDiscount;
    } else {
      finalPrice = finalPrice - flashSale.discountValue;
    }

    // Apply max discount limit if set
    if (flashSale.maxDiscount && flashSale.discountType === "FIXED_AMOUNT") {
      const maxDiscount = Math.min(
        flashSale.discountValue,
        flashSale.maxDiscount
      );
      finalPrice = originalPrice - maxDiscount;
    }

    return Math.max(finalPrice, 0);
  };

  const getDiscountText = () => {
    if (flashSale.discountType === "PERCENTAGE") {
      return `Up to ${flashSale.discountValue}% OFF`;
    }
    return `Up to $${flashSale.discountValue} OFF`;
  };

  const sortedProducts = [...flashSale.products].sort((a, b) => {
    const aMinPrice = Math.min(
      ...a.product.variants.flatMap((v) => v.sizes.map((s) => s.price))
    );
    const bMinPrice = Math.min(
      ...b.product.variants.flatMap((v) => v.sizes.map((s) => s.price))
    );

    switch (sortBy) {
      case "price":
        return aMinPrice - bMinPrice;
      case "discount":
        const aMaxDiscount = Math.max(
          ...a.product.variants.flatMap((v) => v.sizes.map((s) => s.discount))
        );
        const bMaxDiscount = Math.max(
          ...b.product.variants.flatMap((v) => v.sizes.map((s) => s.discount))
        );
        return bMaxDiscount - aMaxDiscount;
      case "name":
        return a.product.name.localeCompare(b.product.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <div className="container mx-auto px-4 py-12">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              onClick={() => router.back()}
            >
              ← Back
            </Button>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Flame className="h-8 w-8 text-yellow-300" />
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30 text-lg px-4 py-2"
              >
                FLASH SALE
              </Badge>
              {flashSale.featured && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-500 text-white border-yellow-400 text-lg px-4 py-2"
                >
                  FEATURED
                </Badge>
              )}
            </div>

            {/* Title & Description */}
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {flashSale.name}
            </h1>
            {flashSale.description && (
              <p className="text-xl text-white/90 mb-6">
                {flashSale.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mb-8 text-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>{getDiscountText()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{flashSale.products.length} products</span>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="mb-8">
              <CountdownTimer
                endDate={flashSale.endDate}
                variant="default"
                className="bg-white/20 rounded-lg"
              />
            </div>

            {/* Store Info */}
            <div className="flex items-center justify-center gap-2 text-white/80">
              <span>Brought to you by</span>
              <Link href={`/store/${flashSale.store.url}`}>
                <Badge
                  variant="outline"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30 cursor-pointer"
                >
                  {flashSale.store.name}
                </Badge>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Flash Sale Products ({flashSale.products.length})
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="discount">Best Discount</option>
              <option value="price">Price: Low to High</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map((productItem) => {
            const product = productItem.product;
            const mainVariant = product.variants[0];
            const minPrice = Math.min(...mainVariant.sizes.map((s) => s.price));
            const maxPrice = Math.max(...mainVariant.sizes.map((s) => s.price));
            const minDiscountedPrice = Math.min(
              ...mainVariant.sizes.map((s) =>
                calculateDiscountedPrice(s.price, s.discount)
              )
            );
            const maxDiscountedPrice = Math.max(
              ...mainVariant.sizes.map((s) =>
                calculateDiscountedPrice(s.price, s.discount)
              )
            );

            return (
              <Card
                key={product.id}
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="relative">
                  <Image
                    src={mainVariant.variantImage || "/placeholder-product.jpg"}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Flash Sale Badge */}
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    {getDiscountText()}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  {/* Product Name */}
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="font-semibold text-gray-800 mb-2 hover:text-red-600 transition-colors cursor-pointer">
                      {product.name}
                    </h3>
                  </Link>

                  {/* CTA Button */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => router.push(`/product/${product.slug}`)}
                    >
                      View Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {flashSale.products.length === 0 && (
          <div className="text-center py-12">
            <Flame className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Products Available
            </h3>
            <p className="text-gray-500">
              This flash sale doesn&apos;t have any products yet.
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-100 border-t">
        <div className="container mx-auto px-4 py-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Don&apos;t Miss Out on These Amazing Deals!
          </h3>
          <p className="text-gray-600 mb-6">
            This flash sale ends soon. Shop now before the timer runs out!
          </p>
          <div className="flex justify-center">
            <CountdownTimer
              endDate={flashSale.endDate}
              variant="compact"
              className="bg-white rounded-lg shadow-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
