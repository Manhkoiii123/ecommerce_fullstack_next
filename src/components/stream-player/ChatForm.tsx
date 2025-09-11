"use client";

import ChatInfo from "@/components/stream-player/ChatInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState } from "react";
interface ChatFormProps {
  onSubmit: () => void;
  value: string;
  onChange: (value: string) => void;
  isHidden: boolean;
  isChatFollowersOnly: boolean;
  isChatDelayed: boolean;
  isFollowing: boolean;
}
const ChatForm = ({
  isChatDelayed,
  isChatFollowersOnly,
  isFollowing,
  isHidden,
  onChange,
  onSubmit,
  value,
}: ChatFormProps) => {
  const [isDelayBlocked, setIsDelayBlocked] = useState(false);
  const isFollowersOnlyAndNotFollowing = isChatFollowersOnly && !isFollowing;
  const isDisabled =
    isHidden || isDelayBlocked || isFollowersOnlyAndNotFollowing;
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!value || isDisabled) return;
    if (isChatDelayed && !isDelayBlocked) {
      setIsDelayBlocked(true);
      setTimeout(() => {
        setIsDelayBlocked(false);
        onSubmit();
      }, 3000);
    } else {
      onSubmit();
    }
  };
  if (isHidden) {
    return null;
  }
  return (
    <form
      className="flex flex-col items-center gap-y-4 p-3"
      onSubmit={(e) => handleSubmit(e)}
    >
      <div className="w-full">
        <ChatInfo
          isDelayed={isChatDelayed}
          isFollowersOnly={isChatFollowersOnly}
        />
        <Input
          onChange={(e) => onChange(e.target.value)}
          value={value}
          disabled={isDisabled}
          placeholder="Send a message"
          className={cn(
            "border-gray-100 ",
            isChatFollowersOnly && " rounded-t-none border-t-0"
          )}
        />
      </div>
      <div className="ml-auto">
        <Button
          type="submit"
          variant={"default"}
          size={"sm"}
          disabled={isDisabled}
        >
          Chat
        </Button>
      </div>
    </form>
  );
};

export default ChatForm;

export const ChatFormSkeleton = () => {
  return (
    <div className="flex flex-col items-center gap-y-4 p-3">
      <Skeleton className="w-full h-10" />
      <div className="flex items-center gap-x-2 ml-auto">
        <Skeleton className="w-7 h-7" />
        <Skeleton className="w-7 h-12" />
      </div>
    </div>
  );
};
