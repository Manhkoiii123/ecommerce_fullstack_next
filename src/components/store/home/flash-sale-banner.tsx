"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountdownTimer from "@/components/shared/countdown-timer";
import { getActiveFlashSales } from "@/queries/flash-sale";
import { FlashSale } from "@prisma/client";
import { Clock, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Flame } from "lucide-react";

interface FlashSaleBannerProps {
  storeUrl?: string;
  className?: string;
  flashSales: FlashSaleWithProducts[];
}

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

export default function FlashSaleBanner({
  storeUrl,
  className = "",
  flashSales,
}: FlashSaleBannerProps) {
  // useEffect(() => {
  //   const fetchFlashSales = async () => {
  //     try {
  //       const activeSales = await getActiveFlashSales(storeUrl);
  //       setFlashSales(activeSales.slice(1));
  //     } catch (error) {
  //       console.error("Error fetching flash sales:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchFlashSales();
  // }, [storeUrl]);

  if (flashSales.length === 0) {
    return null;
  }

  const featuredSale = flashSales[0]; // Now this is the second flash sale

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
    <div className={`space-y-4 ${className}`}>
      {flashSales.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashSales.slice(0, 3).map((sale) => (
            <Card
              key={sale.id}
              className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-300"
                  >
                    {getDiscountText(sale)}
                  </Badge>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2">
                  {sale.name}
                </h3>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {getProductCount(sale)} products
                  </span>
                  <CountdownTimer
                    endDate={sale.endDate}
                    variant="minimal"
                    className="text-orange-600"
                  />
                </div>

                <Link href={`/flash-sale/${sale.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    View Sale
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
