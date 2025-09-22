"use client";

import Actions from "@/components/stream-player/Actions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useParticipants,
  useRemoteParticipant,
} from "@livekit/components-react";
import { UserIcon } from "lucide-react";
import UserAvatar, { UserAvatarSkeleton } from "@/components/live/UserAvatar";
import { VerifiedMark } from "@/components/live/verified-mark";
import HostProductSelector from "@/components/stream-player/HostProductSelector";

interface HeaderProps {
  imageUrl: string;
  hostName: string;
  hostIdentity: string;
  viewerIdentity: string;
  name: string;
  isFollowing: boolean;
  storeUrl: string;
}
const Header = ({
  hostIdentity,
  hostName,
  imageUrl,
  isFollowing,
  name,
  viewerIdentity,
  storeUrl,
}: HeaderProps) => {
  const participants = useParticipants();
  const participant = useRemoteParticipant(hostIdentity);
  const isLive = !!participant;
  const participantCount = participants.length - 1;
  const hostAsViewer = `host-${hostIdentity}`;
  const isHost = viewerIdentity === hostAsViewer;

  return (
    <div className="flex flex-col lg:flex-row gap-y-4 lg:gap-y-0 items-start justify-between px-4 !text-black">
      <div className="flex items-center gap-x-3">
        <UserAvatar
          imageUrl={imageUrl}
          username={hostName}
          size="lg"
          isLive={isLive}
          showBadge={isLive}
        />
        <div className="space-y-1">
          <div className="flex items-center gap-x-2">
            <h2 className="text-lg font-semibold">{hostName}</h2>
            <VerifiedMark />
          </div>
          <p className="text-sm font-semibold">{name}</p>
          {isLive ? (
            <div className="font-semibold flex gap-x-1 items-center text-xs text-rose-500">
              <UserIcon className="h-4 w-4 " />
              <p>
                {participantCount}{" "}
                {participantCount === 1 ? "viewer" : "viewers"}
              </p>
            </div>
          ) : (
            <p className="font-semibold text-xs text-muted-foreground">
              Offline
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full lg:w-auto">
        <Actions
          isFollowing={isFollowing}
          hostIdentity={hostIdentity}
          isHost={isHost}
        />
        {isHost && isLive && (
          <HostProductSelector storeUrl={storeUrl} storeId={hostIdentity} />
        )}
      </div>
    </div>
  );
};

export default Header;
export const HeaderSkeleton = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-y-4 lg:gap-y-0 items-start justify-between px-4">
      <div className="flex items-center gap-x-2">
        <UserAvatarSkeleton size={"lg"} />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
};
