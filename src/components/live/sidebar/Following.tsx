"use client";

import UserItem, { UserItemSkeleton } from "@/components/live/sidebar/UserItem";
import { useSidebar } from "@/store/use-sidebar";
import { Store } from "@prisma/client";

interface FollowingProps {
  data: (Store & {
    stream: { isLive: boolean } | null;
  })[];
}
const Following = ({ data }: FollowingProps) => {
  const { collapsed } = useSidebar((state) => state);
  if (!data.length) {
    return null;
  }
  return (
    <div>
      {!collapsed && (
        <div className="pl-6 mb-4">
          <p className="text-sm text-muted-foreground">Following</p>
        </div>
      )}
      <ul className="space-y-2 px-2">
        {data.map((user) => (
          <UserItem
            key={user.id}
            username={user.name}
            imageUrl={user.logo}
            isLive={user.stream?.isLive}
            storeUrl={user.url}
          />
        ))}
      </ul>
    </div>
  );
};

export default Following;
export const FollowingSkeleton = () => {
  return (
    <ul className="px-2 pt-2 lg:pt-0">
      {[...Array(3)].map((_, i) => (
        <UserItemSkeleton key={i} />
      ))}
    </ul>
  );
};
