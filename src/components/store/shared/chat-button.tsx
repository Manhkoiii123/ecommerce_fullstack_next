"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface ChatButtonProps {
  storeId: string;
  storeName: string;
}

export default function ChatButton({ storeId, storeName }: ChatButtonProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleChatClick = async () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setIsLoading(true);
    try {
      // Create or find conversation
      await axios.post("/api/socket/messages", {
        content: `Hi ${storeName}! I'm interested in your products.`,
        storeId,
      });

      // Navigate to chat
      router.push("/profile/chat");
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleChatClick}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <MessageCircle className="h-4 w-4" />
      Chat with Store
    </Button>
  );
}
