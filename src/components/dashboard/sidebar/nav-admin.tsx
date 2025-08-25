"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { ScrollArea } from "@/components/ui/scroll-area";

import { icons } from "@/constants/icons";

import { DashboardSidebarMenuInterface } from "@/lib/types";

import { cn } from "@/lib/utils";

export default function SidebarNavAdmin({
  menuLinks,
}: {
  menuLinks: DashboardSidebarMenuInterface[];
}) {
  const pathname = usePathname();
  return (
    <nav className="relative grow">
      <Command className="rounded-lg overflow-hidden bg-transparent h-full">
        <CommandInput placeholder="Search..." />
        <ScrollArea className="h-72">
          <CommandList className="py-2">
            <CommandEmpty>No Links Found.</CommandEmpty>
            <CommandGroup className="pt-0 relative">
              {menuLinks.map((link, index) => {
                let icon;
                const iconSearch = icons.find(
                  (icon) => icon.value === link.icon
                );
                if (iconSearch) icon = <iconSearch.path />;
                return (
                  <CommandItem
                    key={index}
                    className={cn("w-full h-12 cursor-pointer mt-1", {
                      "bg-accent text-accent-foreground":
                        link.link === pathname,
                    })}
                  >
                    <Link
                      href={link.link}
                      className="flex items-center gap-2 hover:bg-transparent rounded-md transition-all w-full"
                    >
                      {icon}
                      <span>{link.label}</span>
                    </Link>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </ScrollArea>
      </Command>
    </nav>
  );
}
