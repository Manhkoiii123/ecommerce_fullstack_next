"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { OrderStatus } from "@/lib/types";

interface OrderAtRisk {
  id: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  daysUnpaid: number;
  stores: string;
  willBeCancelledIn: number;
}

interface OrdersAtRiskProps {
  storeUrl?: string;
}

export const OrdersAtRisk = ({ storeUrl }: OrdersAtRiskProps) => {
  const [orders, setOrders] = useState<OrderAtRisk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoCancelling, setIsAutoCancelling] = useState(false);
  const [isAutoCancellingOneOrder, setIsAutoCancellingOneOrder] = useState<{
    [orderId: string]: boolean;
  }>({});

  const fetchOrdersAtRisk = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/auto-cancel-orders?storeUrl=${storeUrl || ""}`
      );
      const data = await response.json();

      if (data.success) {
        setOrders(data.atRiskOrders);
      } else {
        toast.error("Failed to fetch orders at risk");
      }
    } catch (error) {
      toast.error("Error fetching orders at risk");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoCancel = async () => {
    try {
      setIsAutoCancelling(true);
      const response = await fetch(
        `/api/auto-cancel-orders?storeUrl=${storeUrl || ""}`,
        {
          method: "POST",
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully cancelled ${data.cancelled} orders`);
        fetchOrdersAtRisk();
        data.cancelledOrders.forEach(async (o: any) => {
          await fetch("/api/socket/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "ORDER_STATUS_CHANGE",
              orderId: o.orderId,
              userId: o.order.userId,
              newStatus: OrderStatus.Cancelled,
              orderGroupId: o.id,
            }),
          });
        });
      } else {
        toast.error("Failed to auto-cancel orders");
      }
    } catch (error) {
      toast.error("Error auto-cancelling orders");
      console.error("Error:", error);
    } finally {
      setIsAutoCancelling(false);
    }
  };
  const handleAutoCancelOneOrder = async (orderId: string) => {
    try {
      setIsAutoCancellingOneOrder({
        ...isAutoCancellingOneOrder,
        [orderId]: true,
      });
      const response = await fetch(
        `/api/auto-cancel-one-order?orderId=${orderId}`,
        {
          method: "POST",
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully cancelled orders`);
        fetchOrdersAtRisk();
        await fetch("/api/socket/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "ORDER_STATUS_CHANGE",
            orderId: data.order.orderId,
            userId: data.order.order.userId,
            newStatus: OrderStatus.Cancelled,
            orderGroupId: orderId,
          }),
        });
      } else {
        toast.error("Failed to auto-cancel orders");
      }
    } catch (error) {
      toast.error("Error auto-cancelling orders");
      console.error("Error:", error);
    } finally {
      setIsAutoCancellingOneOrder({
        ...isAutoCancellingOneOrder,
        [orderId]: false,
      });
    }
  };

  useEffect(() => {
    fetchOrdersAtRisk();
  }, [storeUrl]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRiskLevel = (daysUnpaid: number) => {
    if (daysUnpaid >= 3) return { level: "Critical", color: "destructive" };
    if (daysUnpaid >= 2) return { level: "High", color: "destructive" };
    return { level: "Medium", color: "secondary" };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Orders at Risk of Cancellation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading orders...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Orders at Risk of Cancellation
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Orders that haven&apos;t been paid for 2+ days will be automatically
            cancelled after 3 days
          </p>
          <Button
            onClick={handleAutoCancel}
            disabled={isAutoCancelling || orders.length === 0}
            variant="destructive"
            size="sm"
          >
            {isAutoCancelling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Auto-Cancelling...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Auto-Cancel All
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Orders at Risk
            </h3>
            <p className="text-muted-foreground">
              All orders are either paid or within the safe payment window.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>{orders.length}</strong> orders are at risk of being
                automatically cancelled. These orders will be cancelled in the
                next 24 hours if payment is not received.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {orders.map((order) => {
                const riskLevel = getRiskLevel(order.daysUnpaid);
                return (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={riskLevel.color as any}>
                          {riskLevel.level} Risk
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Order #{order.id}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-red-600">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.daysUnpaid} days unpaid
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <div className="text-muted-foreground">
                          {order.customerEmail}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Store:</span>
                        <div className="font-medium">{order.stores}</div>
                        <span className="text-muted-foreground">
                          Created: {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Will be cancelled in:
                        </span>
                        <div className="font-medium text-red-600">
                          {order.willBeCancelledIn} day
                          {order.willBeCancelledIn !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-600"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {order.willBeCancelledIn === 0
                          ? "Today"
                          : `${order.willBeCancelledIn} day${
                              order.willBeCancelledIn !== 1 ? "s" : ""
                            } left`}
                      </Badge>
                      <Button
                        onClick={() => handleAutoCancelOneOrder(order.id)}
                        disabled={isAutoCancellingOneOrder[order.id]}
                        variant="destructive"
                        size="sm"
                      >
                        {isAutoCancellingOneOrder[order.id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Auto-Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Auto-Cancel
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
