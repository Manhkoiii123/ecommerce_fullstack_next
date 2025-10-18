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
import { Package, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProductsBySubCategoryTableProps {
  subCategories: Array<{
    id: string;
    name: string;
    url: string;
    image: string;
    categoryName: string;
    productsCount: number;
  }>;
}

export const ProductsBySubCategoryTable = ({
  subCategories,
}: ProductsBySubCategoryTableProps) => {
  const maxProducts = Math.max(...subCategories.map((sc) => sc.productsCount));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Products by SubCategory
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total products distribution across subcategories
        </p>
      </CardHeader>
      <CardContent>
        {subCategories.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No subcategories data available
          </p>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SubCategory</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Products Count</TableHead>
                  <TableHead>Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subCategories.slice(0, 15).map((subCategory) => (
                  <TableRow key={subCategory.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={subCategory.image}
                          alt={subCategory.name}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                        <div>
                          <div className="font-semibold">
                            {subCategory.name}
                          </div>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {subCategory.productsCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[150px]">
                        <Progress
                          value={
                            (subCategory.productsCount / maxProducts) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
