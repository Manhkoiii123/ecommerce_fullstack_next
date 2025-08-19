"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X, Check } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function DashboardNotificationBell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }, [user?.id]);

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
        body: JSON.stringify({ markAll: true }),
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

  // Load notifications on mount
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id, loadNotifications]);

  // Load notifications when popover opens
  useEffect(() => {
    if (user?.id && isOpen) {
      loadNotifications();
    }
  }, [user?.id, isOpen, loadNotifications]);

  // Auto-refresh notifications every 2 minutes
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(loadNotifications, 120000);
      return () => clearInterval(interval);
    }
  }, [user?.id, loadNotifications]);

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
      window.location.href = `/order/${notification.metadata.orderId}`;
    }

    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Thông báo</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="h-4 w-4 mr-1" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Không có thông báo nào
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                    notification.status === "UNREAD"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`font-medium text-sm ${getNotificationColor(
                            notification.type
                          )}`}
                        >
                          {notification.title}
                        </h4>
                        {notification.status === "UNREAD" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                              locale: vi,
                            }
                          )}
                        </span>
                        {notification.metadata?.orderId && (
                          <Badge variant="outline" className="text-xs">
                            #{notification.metadata.orderId.slice(-8)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = "/profile/notifications")}
            >
              Xem tất cả thông báo
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
