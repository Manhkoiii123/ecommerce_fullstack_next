"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CheckCheck, Archive, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function NotificationsPage() {
  const { user } = useUser();
  const { notifications, markAsRead, markAllAsRead } = useSocket();
  const [activeTab, setActiveTab] = useState("all");
  const [filteredNotifications, setFilteredNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredNotifications(notifications);
    } else if (activeTab === "unread") {
      setFilteredNotifications(
        notifications.filter((n) => n.status === "UNREAD")
      );
    } else if (activeTab === "read") {
      setFilteredNotifications(
        notifications.filter((n) => n.status === "READ")
      );
    }
  }, [notifications, activeTab]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ORDER_PLACED":
        return "📦";
      case "ORDER_STATUS_CHANGED":
        return "🔄";
      case "PAYMENT_STATUS_CHANGED":
        return "💳";
      case "ORDER_SHIPPED":
        return "🚚";
      case "ORDER_DELIVERED":
        return "✅";
      case "ORDER_CANCELLED":
        return "❌";
      case "PAYMENT_FAILED":
        return "⚠️";
      case "PAYMENT_SUCCESS":
        return "🎉";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "ORDER_PLACED":
      case "ORDER_DELIVERED":
      case "PAYMENT_SUCCESS":
        return "text-green-600";
      case "ORDER_CANCELLED":
      case "PAYMENT_FAILED":
        return "text-red-600";
      case "ORDER_STATUS_CHANGED":
      case "PAYMENT_STATUS_CHANGED":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.status === "UNREAD") {
      markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.metadata?.orderId) {
      window.location.href = `/order/${notification.metadata.orderId}`;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Vui lòng đăng nhập để xem thông báo
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Thông báo</h1>
          <div className="flex items-center gap-2">
            {notifications.filter((n) => n.status === "UNREAD").length > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                <CheckCheck className="h-4 w-4 mr-2" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Tất cả ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Chưa đọc (
              {notifications.filter((n) => n.status === "UNREAD").length})
            </TabsTrigger>
            <TabsTrigger value="read">
              Đã đọc ({notifications.filter((n) => n.status === "READ").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">
                    {activeTab === "all" && "Không có thông báo nào"}
                    {activeTab === "unread" && "Không có thông báo chưa đọc"}
                    {activeTab === "read" && "Không có thông báo đã đọc"}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      notification.status === "UNREAD"
                        ? "ring-2 ring-blue-200 bg-blue-50"
                        : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3
                              className={`font-semibold ${getNotificationColor(
                                notification.type
                              )}`}
                            >
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              {notification.status === "UNREAD" && (
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800"
                                >
                                  Chưa đọc
                                </Badge>
                              )}
                              {notification.metadata?.orderId && (
                                <Badge variant="outline">
                                  #{notification.metadata.orderId.slice(-8)}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-600 mb-3">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                  locale: vi,
                                }
                              )}
                            </span>

                            {notification.status === "UNREAD" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Đánh dấu đã đọc
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
