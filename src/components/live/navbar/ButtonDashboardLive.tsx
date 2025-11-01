"use client";

import { Button } from "@/components/ui/button";
import { Clapperboard } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";

const ButtonDashboardLive = ({ user }: { user: any }) => {
  const searchParams = useSearchParams();
  const storeUrl = searchParams?.get("storeUrl");

  return (
    <Button
      size={"sm"}
      variant={"ghost"}
      className="text-muted-foreground hover:text-primary "
      asChild
    >
      {user.privateMetadata.role === "SELLER" && storeUrl && (
        <Link href={`/u/${storeUrl}`}>
          <Clapperboard className="h-5 w-5 lg:mr-2" />
          <span className="hidden lg:block">Dashboard</span>
        </Link>
      )}
    </Button>
  );
};

export default ButtonDashboardLive;
