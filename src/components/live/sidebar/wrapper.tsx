"use client";
import { FollowingSkeleton } from "@/components/live/sidebar/Following";
import { RecommendedSkeleton } from "@/components/live/sidebar/Recommended";
import { ToggleSkeleton } from "@/components/live/sidebar/Toggle";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/store/use-sidebar";
import { useEffect, useState } from "react";

interface WrapperProps {
  children: React.ReactNode;
}

const Wrapper = ({ children }: WrapperProps) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  const { collapsed } = useSidebar();
  if (!isClient)
    return (
      <aside className="text-white fixed left-0 flex flex-col w-[70px] lg:w-60 h-full  border-r  z-50">
        <ToggleSkeleton />
        <FollowingSkeleton />
        <RecommendedSkeleton />
      </aside>
    );
  return (
    <aside
      className={cn(
        "text-white fixed left-0 flex flex-col w-60 h-full  border-r  z-50",
        collapsed && "w-[70px]"
      )}
    >
      {children}
    </aside>
  );
};

export default Wrapper;
