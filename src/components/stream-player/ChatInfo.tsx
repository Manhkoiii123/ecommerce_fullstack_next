import Hint from "@/components/live/hint";
import { Info } from "lucide-react";
import React, { useMemo } from "react";
interface ChatInfoProps {
  isDelayed: boolean;
  isFollowersOnly: boolean;
}
const ChatInfo = ({ isDelayed, isFollowersOnly }: ChatInfoProps) => {
  const hint = useMemo(() => {
    if (isFollowersOnly && !isDelayed) {
      return "Only followers can chat";
    }
    if (isDelayed && !isFollowersOnly) {
      return "Message are delayed by 3s";
    }
    if (isFollowersOnly && isDelayed) {
      return "Only followers can chat. Message are delayed by 3s";
    }
    return "";
  }, [isDelayed, isFollowersOnly]);
  const label = useMemo(() => {
    if (isFollowersOnly && !isDelayed) {
      return "Followers only";
    }
    if (isDelayed && !isFollowersOnly) {
      return "Slow mode";
    }
    if (isFollowersOnly && isDelayed) {
      return "Followers only and slow mode";
    }
    return "";
  }, [isDelayed, isFollowersOnly]);

  if (!isDelayed && !isFollowersOnly) {
    return null;
  }
  return (
    <div className="p-2 text-muted-foreground bg-white/5 border border-white/70 w-full rounded-t-md flex items-center gap-x-2">
      <Hint label={hint}>
        <Info className="w-4 h-4" />
      </Hint>
      <p className="text-xs font-semibold">{label}</p>
    </div>
  );
};

export default ChatInfo;
