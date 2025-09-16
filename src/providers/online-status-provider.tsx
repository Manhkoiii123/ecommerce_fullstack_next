"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

interface OnlineStatusProviderProps {
  children: React.ReactNode;
}

export const OnlineStatusProvider = ({
  children,
}: OnlineStatusProviderProps) => {
  const { user } = useUser();
  const { updateOnlineStatus } = useOnlineStatus();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (user && !hasInitialized.current) {
      hasInitialized.current = true;
      // Set online when component mounts
      updateOnlineStatus(true);
    }
  }, [user, updateOnlineStatus]);

  return <>{children}</>;
};
