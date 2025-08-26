"use client";

import { useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationQuery } from "@/hooks/use-notification-query";
import { useNotificationScroll } from "@/hooks/use-notification-scroll";
import { useNotificationSocket } from "../../../hooks/use-notification-socket";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: "UNREAD" | "READ" | "ARCHIVED";
  data?: any;
  createdAt: string;
}

interface NotificationBellProps {
  storeId?: string;
  userId?: string;
}

export function NotificationBell({ storeId, userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const filterKey = userId ? "userId" : "storeId";
  const filterValue = userId || storeId || "";
  let channelKey: string = "";
  const queryKey = `notifications:${filterKey}:${filterValue}`;
  if (userId) {
    channelKey = `notifications:user:${userId}`;
  } else if (storeId) {
    channelKey = `notifications:store:${storeId}`;
  }
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useNotificationQuery({
      queryKey,
      apiUrl: "/api/notifications",
      filterKey,
      filterValue,
    });

  const notifications = data?.pages.flatMap((page) => page.items) || [];
  const unreadCount = data?.pages[0]?.unreadCount || 0;

  // Hook infinite scroll: chỉ load thêm khi scroll xuống cuối
  useNotificationScroll({
    chatRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    isOpen,
  });

  useNotificationSocket({ queryKey, addKey: channelKey });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: "PATCH",
      });

      queryClient.setQueryData(
        ["notifications", filterKey, filterValue],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((n: any) =>
                n.id === notificationId ? { ...n, status: "READ" } : n
              ),
            })),
          };
        }
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, storeId }),
      });
      const queryKey = `notifications:${filterKey}:${filterValue}`;
      queryClient.setQueryData(
        [queryKey, filterKey, filterValue],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((n: any) => ({
                ...n,
                status: "READ",
              })),
              unreadCount: 0,
            })),
          };
        }
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_ORDER":
        return "🛒";
      case "PAYMENT_RECEIVED":
        return "💰";
      case "ORDER_SHIPPED":
        return "📦";
      case "ORDER_DELIVERED":
        return "🎉";
      case "ORDER_CANCELLED":
        return "❌";
      case "REVIEW_RECEIVED":
        return "⭐";
      case "LOW_STOCK":
        return "⚠️";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "NEW_ORDER":
        return "bg-green-100 text-green-800";
      case "PAYMENT_RECEIVED":
        return "bg-blue-100 text-blue-800";
      case "ORDER_SHIPPED":
        return "bg-purple-100 text-purple-800";
      case "ORDER_DELIVERED":
        return "bg-green-100 text-green-800";
      case "ORDER_CANCELLED":
        return "bg-red-100 text-red-800";
      case "REVIEW_RECEIVED":
        return "bg-yellow-100 text-yellow-800";
      case "LOW_STOCK":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-[400px] shadow-lg z-[101]">
          <CardContent className="p-0">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Thông báo</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </div>

            {/* Scrollable container */}
            <div
              className="p-2 h-96 overflow-y-auto flex flex-col"
              ref={chatRef}
            >
              {status === "loading" ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Chưa có thông báo nào</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                      notification.status === "UNREAD" ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getNotificationColor(
                              notification.type
                            )}`}
                          >
                            {notification.type.replace("_", " ")}
                          </Badge>
                          {notification.status === "UNREAD" && (
                            <Badge
                              variant="default"
                              className="bg-blue-500 text-xs"
                            >
                              Mới
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString(
                            "vi-VN"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
