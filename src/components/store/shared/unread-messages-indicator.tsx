"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSocket } from "@/providers/socket-provider";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function UnreadMessagesIndicator() {
  const { user } = useUser();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: conversations, refetch } = useQuery({
    queryKey: ["conversations-unread", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/chat/conversations");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
    enabled: !!user,
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
    if (!socket || !user) return;

    // Listen for new messages
    const handleUnreadUpdate = (data: any) => {
      if (data.senderId !== user.id) {
        setUnreadCount((prev) => prev + 1);
        refetch(); // Refresh conversations
      }
    };

    socket.on(`chat:user:${user.id}:unread`, handleUnreadUpdate);

    return () => {
      socket.off(`chat:user:${user.id}:unread`, handleUnreadUpdate);
    };
  }, [socket, user, refetch]);

  if (!user || unreadCount === 0) {
    return null;
  }

  return (
    <Link href="/profile/chat" className="relative">
      <MessageCircle className="h-6 w-6 text-gray-600 hover:text-gray-800" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Link>
  );
}
