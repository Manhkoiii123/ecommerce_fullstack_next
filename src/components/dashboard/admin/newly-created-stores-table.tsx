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
import { Store, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NewlyCreatedStoresTableProps {
  stores: Array<{
    id: string;
    name: string;
    url: string;
    logo: string | null;
    status: string;
    owner: string;
    ownerEmail: string;
    productsCount: number;
    createdAt: Date;
  }>;
  days: number;
}

export const NewlyCreatedStoresTable = ({
  stores,
  days,
}: NewlyCreatedStoresTableProps) => {
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
          <Calendar className="h-5 w-5" />
          Newly Created Stores (Last {days} Days)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {stores.length} new store{stores.length !== 1 ? "s" : ""} registered
        </p>
      </CardHeader>
      <CardContent>
        {stores.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No new stores in the last {days} days
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
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
                    <div>
                      {/* <div className="font-medium">{store.owner}</div> */}
                      <div className="font-medium">{store.ownerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(store.status)}>
                      {store.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {store.productsCount}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(store.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link
                      href={`/dashboard/admin/stores`}
                      className="text-primary hover:underline text-sm"
                    >
                      Manage
                    </Link>
                    <Link
                      href={`/store/${store.url}`}
                      className="text-muted-foreground hover:underline text-sm"
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
