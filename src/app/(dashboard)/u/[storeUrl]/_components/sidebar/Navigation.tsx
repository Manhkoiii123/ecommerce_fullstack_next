"use client";
import NavItem, {
  NavItemSkeleton,
} from "@/app/(dashboard)/u/[storeUrl]/_components/sidebar/NavItem";
import { useUser } from "@clerk/nextjs";
import { Fullscreen, KeyRound } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
const Navigation = () => {
  const pathname = usePathname();
  const params = useParams();
  const storeUrl = params!.storeUrl as string;
  const { user } = useUser();
  const routes = [
    {
      label: "Stream",
      href: `/u/${storeUrl}`,
      icon: Fullscreen,
    },
    {
      label: "Keys",
      href: `/u/${storeUrl}/keys`,
      icon: KeyRound,
    },
  ];
  if (!user?.username) {
    return (
      <ul className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <NavItemSkeleton key={i} />
        ))}
      </ul>
    );
  }
  return (
    <ul className="space-y-4 px-2 pt-4 lg:pt-0">
      {routes.map((r) => (
        <NavItem
          key={r.href}
          label={r.label}
          href={r.href}
          icon={r.icon}
          isActive={pathname === r.href}
        />
      ))}
    </ul>
  );
};

export default Navigation;
