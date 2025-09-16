"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import ConversationsList from "./conversations-list";
import ChatWindow from "./chat-window";
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function ChatContainer() {
  const { user } = useUser();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
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
        <ConversationsList
          onSelectConversation={(id) => {
            // Check if it's a store selection (starts with "store:")
            if (id.startsWith("store:")) {
              const storeId = id.replace("store:", "");
              setSelectedStoreId(storeId);
              setSelectedConversation(null);
            } else {
              setSelectedConversation(id);
              setSelectedStoreId(null);
            }
          }}
          selectedConversation={selectedConversation}
        />
      </div>
      <div className="flex-1">
        {selectedConversation ? (
          <ChatWindow conversationId={selectedConversation} />
        ) : selectedStoreId ? (
          <ChatWindow conversationId={null} storeId={selectedStoreId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
