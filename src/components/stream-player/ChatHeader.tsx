"use client";
import ChatToggle from "@/components/stream-player/ChatToggle";
import VariantToggle from "@/components/stream-player/VariantToggle";
import { Skeleton } from "@/components/ui/skeleton";
const ChatHeader = () => {
  return (
    <div className="relative p-3 border-b">
      <div className="absolute left-2 top-2 hidden lg:block">
        <ChatToggle />
      </div>
      <p className="font-semibold text-black text-center">Stream Chat</p>
      <div className="absolute right-2 top-2">{/* <VariantToggle /> */}</div>
    </div>
  );
};

export default ChatHeader;
export const ChatHeaderSkeleton = () => {
  return (
    <div className="relative p-3 border-b hidden md:block">
      <Skeleton className="h-6 w-6 left-3 top-3 absolute" />
      <Skeleton className="h-6 w-28 mx-auto" />
    </div>
  );
};
