import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@clerk/nextjs";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  connect: () => void;
  disconnect: () => void;
}

export const useSocket = (): UseSocketReturn => {
  const { user } = useUser();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize socket connection
  const connect = useCallback(async () => {
    if (!user?.id || socketRef.current?.connected) return;

    try {
      // Get user info for socket authentication
      const response = await fetch("/api/socket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-user-info" }),
      });

      if (!response.ok) throw new Error("Failed to get user info");

      const userInfo = await response.json();

      // Create socket connection
      const socket = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
        {
          transports: ["websocket", "polling"],
        }
      );

      socketRef.current = socket;

      // Socket event handlers
      socket.on("connect", () => {
        console.log("Socket connected");
        setIsConnected(true);

        // Authenticate with user info
        socket.emit("authenticate", {
          userId: userInfo.userId,
          storeId: userInfo.storeId,
        });

        // Join user room
        socket.emit("join-user", userInfo.userId);

        // Join store room if store owner
        if (userInfo.storeId) {
          socket.emit("join-store", userInfo.storeId);
        }
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      socket.on("notification", (notification: Notification) => {
        console.log("New notification received:", notification);

        // Add new notification to the beginning
        setNotifications((prev) => [notification, ...prev]);

        // Update unread count
        setUnreadCount((prev) => prev + 1);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });
    } catch (error) {
      console.error("Error connecting to socket:", error);
    }
  }, [user?.id]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
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
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
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
  }, []);

  // Load existing notifications
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

  // Connect on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      connect();
      loadNotifications();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, connect, disconnect, loadNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    connect,
    disconnect,
  };
};
