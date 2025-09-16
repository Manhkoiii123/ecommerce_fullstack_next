"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import axios from "axios";

interface ChatWindowProps {
  conversationId: string | null;
  storeId?: string;
}

interface MessageWithSender {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    picture: string;
  };
}

export default function ChatWindow({
  conversationId,
  storeId,
}: ChatWindowProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actualConversationId, setActualConversationId] = useState<
    string | null
  >(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If we have storeId but no conversationId, we need to create/find the conversation
  useEffect(() => {
    if (storeId && !conversationId) {
      // We'll handle this in the first message send
      setActualConversationId(null);
    } else if (conversationId) {
      setActualConversationId(conversationId);
    }
  }, [conversationId, storeId]);

  const chatQuery = useChatQuery({
    queryKey: actualConversationId
      ? `chat:${actualConversationId}`
      : `store:${storeId}`,
    apiUrl: "/api/chat/messages",
    conversationId: actualConversationId || "",
  });

  useChatSocket({
    queryKey: actualConversationId
      ? `chat:${actualConversationId}`
      : `store:${storeId}`,
    addKey: actualConversationId
      ? `chat:${actualConversationId}:messages`
      : `store:${storeId}:messages`,
    updateKey: actualConversationId
      ? `chat:${actualConversationId}:messages:update`
      : `store:${storeId}:messages:update`,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatQuery.data]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (!actualConversationId) return;

    const markAsRead = async () => {
      try {
        await axios.patch("/api/chat/messages", {
          conversationId: actualConversationId,
        });
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    };

    markAsRead();
  }, [actualConversationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await axios.post("/api/socket/messages", {
        content: message,
        conversationId: actualConversationId,
        storeId: storeId,
      });

      // If we created a new conversation, update the actualConversationId
      if (!actualConversationId && response.data) {
        // The response should contain the conversation info
        // We might need to fetch the conversation ID from the response
        setActualConversationId(response.data.conversationId);
      }

      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (chatQuery.status === "loading") {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (chatQuery.status === "error") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Failed to load messages</p>
      </div>
    );
  }

  const messages = chatQuery.data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {chatQuery.hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => chatQuery.fetchNextPage()}
                  disabled={chatQuery.isFetchingNextPage}
                >
                  {chatQuery.isFetchingNextPage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Load more messages"
                  )}
                </Button>
              </div>
            )}

            {messages.map((msg: MessageWithSender) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start space-x-3",
                  msg.senderId === user?.id ? "justify-end" : "justify-start"
                )}
              >
                {msg.senderId !== user?.id && (
                  <Image
                    src={msg.sender.picture}
                    alt={msg.sender.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}

                <div
                  className={cn(
                    "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                    msg.senderId === user?.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      msg.senderId === user?.id
                        ? "text-blue-100"
                        : "text-gray-500"
                    )}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>

                {msg.senderId === user?.id && (
                  <Image
                    src={msg.sender.picture}
                    alt={msg.sender.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !message.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
