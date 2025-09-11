import Following, {
  FollowingSkeleton,
} from "@/components/live/sidebar/Following";
import Recommended, {
  RecommendedSkeleton,
} from "@/components/live/sidebar/Recommended";
import Toggle, { ToggleSkeleton } from "@/components/live/sidebar/Toggle";
import Wrapper from "@/components/live/sidebar/wrapper";
import { getFollowedStores } from "@/lib/follow-service";
import { getRecommended } from "@/lib/recommented-service";
import React from "react";

const Sidebar = async () => {
  const recommended = await getRecommended();
  const follows = await getFollowedStores();

  return (
    <Wrapper>
      <Toggle />
      <div className=" space-y-4 pt-4 lg:pt-0">
        <Following data={follows} />
        <Recommended data={recommended} />
      </div>
    </Wrapper>
  );
};

export default Sidebar;
export const SidebarSkeleton = () => {
  return (
    <aside className="fixed left-0 flex flex-col w-[70px] lg:w-60 h-full border-r border-[#2d2e35] z-50">
      <ToggleSkeleton />
      <FollowingSkeleton />
      <RecommendedSkeleton />
    </aside>
  );
};
