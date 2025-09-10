import LiveBadge from "@/components/live/live-badge";
import UserAvatar from "@/components/live/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import React from "react";
interface ThumbnailProps {
  src: string | null;
  fallBack: string;
  isLive: boolean;
  username: string;
}
const Thumbnail = ({ fallBack, isLive, src, username }: ThumbnailProps) => {
  let content;
  if (!src) {
    content = (
      <div className="flex flex-col items-center justify-center gap-y-4 w-full h-full transition-transform group-hover:translate-x-2 group-hover:-translate-y-2 rounded-md">
        <UserAvatar
          size={"lg"}
          username={username}
          imageUrl={fallBack}
          isLive={isLive}
          showBadge
        />
      </div>
    );
  } else {
    content = (
      <Image
        src={src}
        alt="thumbnail"
        fill
        className="object-cover transition-transform group-hover:translate-x-2 group-hover:-translate-y-2 rounded-md"
      />
    );
  }
  return (
    <div className="group aspect-video relative rounded-md cursor-pointer">
      <div className="rounded-md absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"></div>
      {content}
      {isLive && src && (
        <div className="absolute top-2 left-2 transition-transform group-hover:translate-x-2 group-hover:-translate-y-2 rounded-md">
          <LiveBadge />
        </div>
      )}
    </div>
  );
};

export default Thumbnail;

export const ThumbnailSkeleton = () => {
  return (
    <div className="group aspect-video relative rounded-xl cursor-pointer">
      <Skeleton className="w-full h-full" />
    </div>
  );
};
