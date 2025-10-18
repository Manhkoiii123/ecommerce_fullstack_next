"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PackagePlus, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NewProductsBySubCategoryTableProps {
  subCategories: Array<{
    id: string;
    name: string;
    url: string;
    categoryName: string;
    newProductsCount: number;
  }>;
  days: number;
}

export const NewProductsBySubCategoryTable = ({
  subCategories,
  days,
}: NewProductsBySubCategoryTableProps) => {
  const totalNewProducts = subCategories.reduce(
    (sum, sc) => sum + sc.newProductsCount,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackagePlus className="h-5 w-5" />
          New Products by SubCategory (Last {days} Days)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalNewProducts} new product{totalNewProducts !== 1 ? "s" : ""}{" "}
          added across {subCategories.length} subcategor
          {subCategories.length !== 1 ? "ies" : "y"}
        </p>
      </CardHeader>
      <CardContent>
        {subCategories.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No new products added in the last {days} days
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SubCategory</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">New Products</TableHead>
                <TableHead className="text-right">Growth</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subCategories.map((subCategory, index) => (
                <TableRow key={subCategory.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      )}
                      <div>
                        <div className="font-semibold">{subCategory.name}</div>
                        <div className="text-sm text-muted-foreground">
                          @{subCategory.url}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {subCategory.categoryName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="font-semibold">
                      +{subCategory.newProductsCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm text-green-600 font-medium">
                      {(
                        (subCategory.newProductsCount / totalNewProducts) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/admin/subCategories`}
                      className="text-primary hover:underline text-sm"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
