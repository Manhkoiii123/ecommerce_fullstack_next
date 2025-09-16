"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSocket } from "@/providers/socket-provider";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SellerUnreadMessagesIndicatorProps {
  storeId: string;
  storeUrl: string;
}

export default function SellerUnreadMessagesIndicator({
  storeId,
  storeUrl,
}: SellerUnreadMessagesIndicatorProps) {
  const { user } = useUser();
  const { socket } = useSocket();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: conversations, refetch } = useQuery({
    queryKey: ["seller-conversations-unread", storeId],
    queryFn: async () => {
      const response = await fetch(
        `/api/chat/conversations?type=store&storeId=${storeId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
    enabled: !!user && !!storeId,
  });

  // Calculate total unread count
  useEffect(() => {
    if (conversations) {
      const totalUnread = conversations.reduce((total: number, conv: any) => {
        return total + conv._count.messages;
      }, 0);
      setUnreadCount(totalUnread);
    }
  }, [conversations]);

  useEffect(() => {
    if (!socket || !user || !storeId) return;

    // Listen for new messages
    const handleUnreadUpdate = (data: any) => {
      if (data.senderId !== user.id) {
        setUnreadCount((prev) => prev + 1);
        refetch(); // Refresh conversations
      }
    };

    socket.on(`chat:store:${storeId}:unread`, handleUnreadUpdate);

    return () => {
      socket.off(`chat:store:${storeId}:unread`, handleUnreadUpdate);
    };
  }, [socket, user, storeId, refetch]);

  const isOnChatPage = pathname?.includes("/chat");

  return (
    <Link
      href={`/dashboard/seller/stores/${storeUrl}/chat`}
      className="relative flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <MessageCircle className="h-5 w-5 text-gray-600" />
      <span className="text-sm font-medium">Messages</span>
      {unreadCount > 0 && !isOnChatPage && (
        <Badge
          variant="destructive"
          className="h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Link>
  );
}
