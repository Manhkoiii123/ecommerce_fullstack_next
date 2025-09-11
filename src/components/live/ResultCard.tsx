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
      <div className="group h-full w-full space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1">
        <div className="relative overflow-hidden rounded-lg">
          <Thumbnail
            src={data.thumbnailUrl}
            isLive={data.isLive}
            fallBack={data.store.logo}
            username={data.store.name}
          />
          {data.isLive && (
            <div className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white shadow-md">
              LIVE
            </div>
          )}
        </div>

        <div className="flex gap-x-3">
          <Avatar className="ring-2 ring-gray-100 transition-all duration-300 group-hover:ring-blue-200">
            <AvatarImage src={data.store.logo} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {data.store.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col text-sm overflow-hidden">
            <p className="truncate font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-600">
              {data.name}
            </p>
            <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
              {data.store.name}
            </p>
            {data.isLive && (
              <div className="mt-1 flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs text-red-600 font-medium">
                  Live now
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResultCard;
export const ResultCardSkeleton = () => {
  return (
    <div className="h-full w-full space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="relative overflow-hidden rounded-lg">
        <ThumbnailSkeleton />
      </div>
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
