"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCreatorSidebar } from "@/store/use-creator-sidebar";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface NavItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
}

const NavItem = ({ isActive, href, icon: Icon, label }: NavItemProps) => {
  const { collapsed } = useCreatorSidebar((state) => state);
  return (
    <Button
      asChild
      variant={"ghost"}
      className={cn(
        "w-full h-12   hover:bg-opacity-85 hover:text-inherit",
        collapsed ? "justify-center" : "justify-start",
        isActive && "bg-gray-100"
      )}
    >
      <Link href={href}>
        <div className="flex items-center gap-4">
          <Icon className={cn("w-4 h-4 ", collapsed ? "mr-0" : "mr-2")} />
          {!collapsed && <p className="truncate">{label}</p>}
        </div>
      </Link>
    </Button>
  );
};

export default NavItem;
export const NavItemSkeleton = () => {
  return (
    <li className="flex items-center gap-x-4 px-3 py-2">
      <Skeleton className="min-h-[48px] min-w-[48px] rounded-md" />
      <div className="flex-1 hidden lg:block">
        <Skeleton className="h-6" />
      </div>
    </li>
  );
};
