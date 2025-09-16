import { useSocket } from "@/providers/socket-provider";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { throttle } from "@/utils/throttle";

export const useOnlineStatus = () => {
  const { socket, isConnected } = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const lastUpdateRef = useRef<boolean | null>(null);
  const isUpdatingRef = useRef(false);

  const updateOnlineStatusRaw = useCallback(async (online: boolean) => {
    // Prevent duplicate calls
    if (isUpdatingRef.current || lastUpdateRef.current === online) {
      return;
    }

    isUpdatingRef.current = true;
    try {
      await axios.post("/api/socket/online-status", {
        isOnline: online,
      });
      setIsOnline(online);
      lastUpdateRef.current = online;
    } catch (error) {
      console.error("Failed to update online status:", error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, []);

  // Throttle the update function to prevent spam
  const updateOnlineStatus = useMemo(
    () => throttle(updateOnlineStatusRaw, 5000), // 5 seconds throttle
    [updateOnlineStatusRaw]
  );

  useEffect(() => {
    if (isConnected && !isOnline && lastUpdateRef.current !== true) {
      updateOnlineStatus(true);
    }
  }, [isConnected, isOnline, updateOnlineStatus]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for more reliable offline status
      navigator.sendBeacon(
        "/api/socket/online-status",
        JSON.stringify({
          isOnline: false,
        })
      );
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOnlineStatus(false);
      } else if (isConnected) {
        updateOnlineStatus(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updateOnlineStatus, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lastUpdateRef.current === true) {
        updateOnlineStatus(false);
      }
    };
  }, [updateOnlineStatus]);

  return {
    isOnline,
    updateOnlineStatus,
  };
};
