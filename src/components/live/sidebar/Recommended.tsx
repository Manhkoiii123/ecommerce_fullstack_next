"use client";
import UserItem, { UserItemSkeleton } from "@/components/live/sidebar/UserItem";
import { useSidebar } from "@/store/use-sidebar";
import { Stream, User } from "@prisma/client";
interface RecommendedProps {
  data: (User & {
    stream: { isLive: boolean } | null;
  })[];
}
const Recommended = ({ data }: RecommendedProps) => {
  const { collapsed } = useSidebar((state) => state);
  const showLabel = !collapsed && data.length > 0;
  return (
    <div>
      {showLabel && (
        <div className="pl-6 mb-4">
          <p className="text-sm text-muted-foreground">Recommeded</p>
        </div>
      )}
      <ul className="space-y-2 px-2">
        {data.map((user) => (
          <UserItem
            key={user.id}
            username={user.name}
            imageUrl={user.picture}
            isLive={user.stream?.isLive}
          />
        ))}
      </ul>
    </div>
  );
};

export default Recommended;
export const RecommendedSkeleton = () => {
  return (
    <ul className="px-2">
      {[...Array(3)].map((_, i) => (
        <UserItemSkeleton key={i} />
      ))}
    </ul>
  );
};
