"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, Truck, CheckCircle, XCircle } from "lucide-react";

interface OrderStatusStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

interface OrderStatusChartProps {
  stats: OrderStatusStats;
}

const statusConfig = [
  {
    key: "pending" as keyof OrderStatusStats,
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
  },
  {
    key: "processing" as keyof OrderStatusStats,
    label: "Processing",
    icon: Package,
    color: "bg-blue-500",
    textColor: "text-blue-600",
  },
  {
    key: "shipped" as keyof OrderStatusStats,
    label: "Shipped",
    icon: Truck,
    color: "bg-purple-500",
    textColor: "text-purple-600",
  },
  {
    key: "delivered" as keyof OrderStatusStats,
    label: "Delivered",
    icon: CheckCircle,
    color: "bg-green-500",
    textColor: "text-green-600",
  },
  {
    key: "cancelled" as keyof OrderStatusStats,
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-500",
    textColor: "text-red-600",
  },
];

export const OrderStatusChart = ({ stats }: OrderStatusChartProps) => {
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Order Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {statusConfig.map((status) => {
            const count = stats[status.key];
            const percentage =
              total > 0 ? Math.round((count / total) * 100) : 0;
            const Icon = status.icon;

            return (
              <div
                key={status.key}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${status.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{status.label}</p>
                    <p className={`text-sm ${status.textColor}`}>
                      {count} orders
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {percentage}%
                </Badge>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Orders</span>
            <span className="text-lg font-bold">{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
