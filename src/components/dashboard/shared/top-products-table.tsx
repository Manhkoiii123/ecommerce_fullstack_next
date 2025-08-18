"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, DollarSign } from "lucide-react";
import Image from "next/image";

interface TopProduct {
  product: {
    id: string;
    name: string;
    slug: string;
    variants: Array<{
      images: string[];
    }>;
  } | null;
  sold: number;
  revenue: number;
}

interface TopProductsTableProps {
  products: TopProduct[];
  title?: string;
}

export const TopProductsTable = ({
  products,
  title = "Top sản phẩm bán chạy",
}: TopProductsTableProps) => {
  const formatRevenue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((item, index) => (
            <div
              key={item.product?.id || index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex items-center space-x-3">
                  {/* {item.product?.variants[0]?.images[0] && (
                    <Image
                      src={item.product.variants[0].images[0]}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-md"
                      width={48}
                      height={48}
                    />
                  )} */}
                  <div>
                    <p className="font-medium text-sm line-clamp-1">
                      {item.product?.name || "Sản phẩm không xác định"}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {item.sold} sold
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-1 text-green-600 font-medium">
                  <span>{formatRevenue(item.revenue)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
