import Thumbnail, { ThumbnailSkeleton } from "@/components/live/thumbnail";
import { UserAvatarSkeleton } from "@/components/live/UserAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Stream, Store } from "@prisma/client";
import Link from "next/link";

interface ResultCardProps {
  data: {
    store: Store;
    name: string;
    thumbnailUrl: string | null;
    isLive: boolean;
  };
}

const ResultCard = ({ data }: ResultCardProps) => {
  return (
    <Link href={`/${data.store.url}`}>
      <div className="h-full w-full space-y-4">
        <Thumbnail
          src={data.thumbnailUrl}
          isLive={data.isLive}
          fallBack={data.store.logo}
          username={data.store.name}
        />

        <div className="flex gap-x-3">
          <Avatar>
            <AvatarImage src={data.store.logo} />
            <AvatarFallback>{data.store.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-sm overflow-hidden">
            <p className="truncate font-semibold hover:text-blue-500">
              {data.name}
            </p>
            <p className="text-muted-foreground">{data.store.name}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResultCard;
export const ResultCardSkeleton = () => {
  return (
    <div className="h-full w-full space-y-4">
      <ThumbnailSkeleton />
      <div className="flex gap-x-3">
        <UserAvatarSkeleton />
        <div className="flex flex-col gap-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
};
