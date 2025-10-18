"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag, Package } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProductsByOfferTagTableProps {
  offerTags: Array<{
    id: string;
    name: string;
    url: string;
    productsCount: number;
  }>;
}

export const ProductsByOfferTagTable = ({
  offerTags,
}: ProductsByOfferTagTableProps) => {
  const maxProducts = Math.max(...offerTags.map((tag) => tag.productsCount));
  const totalProducts = offerTags.reduce(
    (sum, tag) => sum + tag.productsCount,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Products by Offer Tag
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalProducts} total products tagged across {offerTags.length} offer
          tags
        </p>
      </CardHeader>
      <CardContent>
        {offerTags.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No offer tags data available
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offer Tag</TableHead>
                <TableHead className="text-right">Products Count</TableHead>
                <TableHead>Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offerTags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded flex items-center justify-center">
                        <Tag className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">{tag.name}</div>
                        <div className="text-sm text-muted-foreground">
                          @{tag.url}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-lg">
                        {tag.productsCount}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[200px]">
                      <Progress
                        value={(tag.productsCount / maxProducts) * 100}
                        className="h-2"
                      />
                    </div>
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
