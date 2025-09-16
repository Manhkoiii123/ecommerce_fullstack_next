"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import SellerConversationsList from "./conversations-list";
import SellerChatWindow from "./chat-window";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface SellerChatContainerProps {
  storeId: string;
}

export default function SellerChatContainer({
  storeId,
}: SellerChatContainerProps) {
  const { user } = useUser();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const { isOnline } = useOnlineStatus();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Please sign in to access chat</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r">
        <SellerConversationsList
          storeId={storeId}
          onSelectConversation={setSelectedConversation}
          selectedConversation={selectedConversation}
        />
      </div>
      <div className="flex-1">
        {selectedConversation ? (
          <SellerChatWindow
            conversationId={selectedConversation}
            storeId={storeId}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">
                Select a customer to start chatting
              </p>
              <p className="text-sm">
                Customer conversations will appear here when they message your
                store
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
