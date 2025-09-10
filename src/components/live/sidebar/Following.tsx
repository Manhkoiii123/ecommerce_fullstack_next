"use client";

import UserItem, { UserItemSkeleton } from "@/components/live/sidebar/UserItem";
import { useSidebar } from "@/store/use-sidebar";

interface FollowingProps {
  data: any[];
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
            key={user.following.id}
            username={user.following.username}
            imageUrl={user.following.imageUrl}
            isLive={user.following.stream?.isLive}
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
