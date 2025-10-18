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
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Store } from "lucide-react";

interface TopStoresBySalesTableProps {
  stores: Array<{
    id: string;
    name: string;
    url: string;
    logo: string | null;
    status: string;
    owner: string;
    totalSales: number;
    productsCount: number;
    ordersCount: number;
  }>;
}

export const TopStoresBySalesTable = ({
  stores,
}: TopStoresBySalesTableProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "PENDING":
        return "secondary";
      case "BANNED":
        return "destructive";
      case "DISABLED":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Stores by Sales Volume
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Stores ranked by total product sales (units sold)
        </p>
      </CardHeader>
      <CardContent>
        {stores.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No stores data available
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Sales</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store, index) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`font-bold text-lg ${
                          index === 0
                            ? "text-yellow-500"
                            : index === 1
                            ? "text-gray-400"
                            : index === 2
                            ? "text-amber-700"
                            : "text-muted-foreground"
                        }`}
                      >
                        #{index + 1}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {store.logo ? (
                        <Image
                          src={store.logo}
                          alt={store.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Store className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{store.name}</div>
                        <div className="text-sm text-muted-foreground">
                          @{store.url}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{store.owner}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(store.status)}>
                      {store.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-bold text-lg">
                      {store.totalSales.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">units</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {store.productsCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {store.ordersCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/${store.url}`}
                      className="text-primary hover:underline text-sm"
                    >
                      View Store
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
