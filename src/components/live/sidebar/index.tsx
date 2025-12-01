import Following, {
  FollowingSkeleton,
} from "@/components/live/sidebar/Following";
import Recommended, {
  RecommendedSkeleton,
} from "@/components/live/sidebar/Recommended";
import Toggle, { ToggleSkeleton } from "@/components/live/sidebar/Toggle";
import Wrapper from "@/components/live/sidebar/wrapper";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFollowedStores } from "@/lib/follow-service";
import { getRecommended } from "@/lib/recommented-service";
import React from "react";

const Sidebar = async () => {
  const recommended = await getRecommended();
  const follows = await getFollowedStores();

  return (
    <Wrapper>
      <Toggle />
      <div className="flex flex-col flex-1 space-y-4 pt-4 lg:pt-0 ">
        <div className="flex-1">
          <ScrollArea className="h-[550px]">
            <Following data={follows} />
          </ScrollArea>
        </div>
        {/* <div className="min-h-0 overflow-y-auto">
          <Recommended data={recommended} />
        </div> */}
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
      {/* <RecommendedSkeleton /> */}
    </aside>
  );
};
