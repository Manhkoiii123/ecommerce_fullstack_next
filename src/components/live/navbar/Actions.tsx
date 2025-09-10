import ButtonDashboardLive from "@/components/live/navbar/ButtonDashboardLive";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Clapperboard } from "lucide-react";
import Link from "next/link";
import React from "react";

const Actions = async () => {
  const user = await currentUser();

  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      {!!user && (
        <div className="flex items-center gap-x-4">
          <ButtonDashboardLive user={JSON.parse(JSON.stringify(user))} />
          <UserButton afterSignOutUrl="/" />
        </div>
      )}
    </div>
  );
};

export default Actions;
