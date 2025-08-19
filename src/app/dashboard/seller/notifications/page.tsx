"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export default function SellerNotificationsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);

  // Load store notifications
  const loadNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?type=store");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, status: "READ" } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true, type: "store" }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, status: "READ" }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

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

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === "UNREAD") {
      markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.metadata?.orderId) {
      // Navigate to order management page
      window.location.href = `/dashboard/seller/orders/${notification.metadata.orderId}`;
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Thông báo cửa hàng</h1>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
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
            <TabsTrigger value="unread">Chưa đọc ({unreadCount})</TabsTrigger>
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
                              {notification.metadata?.total && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800"
                                >
                                  {notification.metadata.total.toLocaleString(
                                    "vi-VN"
                                  )}
                                  đ
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
