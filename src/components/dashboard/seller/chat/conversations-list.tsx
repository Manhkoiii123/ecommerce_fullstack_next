"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSocket } from "@/providers/socket-provider";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SellerConversationsListProps {
  storeId: string;
  onSelectConversation: (conversationId: string) => void;
  selectedConversation: string | null;
}

interface Conversation {
  id: string;
  userId: string;
  storeId: string;
  lastMessageAt: string;
  user: {
    id: string;
    name: string;
    picture: string;
    email: string;
    onlineStatus?: {
      isOnline: boolean;
      lastSeenAt: string;
    } | null;
  };
  store: {
    id: string;
    name: string;
    logo: string;
    url: string;
  };
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
      picture: string;
    };
  }>;
  _count: {
    messages: number;
  };
}

export default function SellerConversationsList({
  storeId,
  onSelectConversation,
  selectedConversation,
}: SellerConversationsListProps) {
  const { user } = useUser();
  const { socket } = useSocket();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const {
    data: conversations,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["seller-conversations", storeId],
    queryFn: async () => {
      const response = await fetch(
        `/api/chat/conversations?type=store&storeId=${storeId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json() as Promise<Conversation[]>;
    },
    enabled: !!user && !!storeId,
  });

  useEffect(() => {
    if (!socket || !user || !storeId) return;

    // Listen for new messages to update unread counts
    const handleUnreadUpdate = (data: any) => {
      if (data.senderId !== user.id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.conversationId]: (prev[data.conversationId] || 0) + 1,
        }));
      }
      // Always refetch to update last message
      refetch();
    };

    // Listen for ALL messages in store conversations
    const handleNewMessage = (message: any) => {
      // Refetch immediately when any new message arrives
      refetch();
    };

    socket.on(`chat:store:${storeId}:unread`, handleUnreadUpdate);

    // Listen to all conversations for this store
    conversations?.forEach((conv) => {
      socket.on(`chat:${conv.id}:messages`, handleNewMessage);
    });

    return () => {
      socket.off(`chat:store:${storeId}:unread`, handleUnreadUpdate);
      conversations?.forEach((conv) => {
        socket.off(`chat:${conv.id}:messages`, handleNewMessage);
      });
    };
  }, [socket, user, storeId, refetch, conversations]);

  // Initialize unread counts from conversations data
  useEffect(() => {
    if (conversations) {
      const counts: Record<string, number> = {};
      conversations.forEach((conv) => {
        counts[conv.id] = conv._count.messages;
      });
      setUnreadCounts(counts);
    }
  }, [conversations]);

  const handleConversationClick = (conversationId: string) => {
    onSelectConversation(conversationId);
    // Reset unread count for this conversation
    setUnreadCounts((prev) => ({
      ...prev,
      [conversationId]: 0,
    }));
  };

  const formatLastMessage = (conversation: Conversation) => {
    if (conversation.messages.length === 0) {
      return "No messages yet";
    }
    const lastMessage = conversation.messages[0];
    const prefix = lastMessage.sender.id === user?.id ? "You: " : "";
    return (
      prefix +
      (lastMessage.content.length > 50
        ? `${lastMessage.content.substring(0, 50)}...`
        : lastMessage.content)
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Customer Messages</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Customer Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations?.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No customer messages yet</p>
            <p className="text-sm mt-1">
              Customer conversations will appear here when they message your
              store
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations?.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                  selectedConversation === conversation.id &&
                    "bg-blue-50 border-r-2 border-blue-500"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Image
                      src={conversation.user.picture}
                      alt={conversation.user.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover "
                    />
                    {conversation.user.onlineStatus?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">
                        {conversation.user.email}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {unreadCounts[conversation.id] > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {unreadCounts[conversation.id]}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {formatLastMessage(conversation)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
