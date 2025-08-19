"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect } from "react";

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { isConnected, notifications, unreadCount } = useSocket();

  // Log socket connection status for debugging
  useEffect(() => {
    console.log("Seller Dashboard Socket Status:", {
      isConnected,
      notificationsCount: notifications.length,
      unreadCount,
    });
  }, [isConnected, notifications.length, unreadCount]);

  return <>{children}</>;
}
