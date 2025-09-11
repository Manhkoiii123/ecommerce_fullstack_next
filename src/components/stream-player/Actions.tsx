"use client";

import { onFollow, onUnFollow } from "@/actions/follow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { followStore } from "@/queries/user";
import { useAuth } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface ActionsProps {
  isFollowing: boolean;
  hostIdentity: string;
  isHost: boolean;
}
const Actions = ({ hostIdentity, isFollowing, isHost }: ActionsProps) => {
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState<boolean>(isFollowing);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { userId } = useAuth();
  const handleStoreFollow = async () => {
    if (!userId) router.push("/sign-in");
    try {
      setLoading(true);
      const res = await followStore(hostIdentity);
      setFollowing(res);

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Something happend, Try again later !");
    }
  };
  return (
    <Button
      onClick={handleStoreFollow}
      disabled={isPending || isHost}
      variant={"outline"}
      size={"sm"}
      className="w-full lg:w-auto"
    >
      <Heart
        className={cn("h-4 w-4 mr-2", isFollowing ? "fill-white" : "fill-none")}
      />
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
};

export default Actions;
