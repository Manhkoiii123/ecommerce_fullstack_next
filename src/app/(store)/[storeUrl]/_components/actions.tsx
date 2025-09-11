"use client";

import { onBlock, onUnBlock } from "@/actions/block";
import { onFollow, onUnFollow } from "@/actions/follow";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { toast } from "sonner";
interface ActionsProps {
  isFollowing: boolean;
  userId: string;
  isBlockByThisUser: boolean;
}
export const Actions = ({
  isFollowing,
  userId,
  isBlockByThisUser,
}: ActionsProps) => {
  const [isPending, startTransition] = useTransition();
  const handleFollow = () => {
    // startTransition(() => {
    //   onFollow(userId)
    //     .then((res) =>
    //       toast.success(`You are now following ${res.following.username}`)
    //     )
    //     .catch((error) => toast.error(error.message));
    // });
  };
  const handleUnFollow = () => {
    // startTransition(() => {
    //   onUnFollow(userId)
    //     .then((res) =>
    //       toast.success(`You are now unfollowing ${res.following.username}`)
    //     )
    //     .catch((error) => toast.error(error.message));
    // });
  };
  const handleBlock = () => {
    // startTransition(() => {
    //   onBlock(userId)
    //     .then((data) =>
    //       toast.success(`Blocked the user ${data?.blocked.username}`)
    //     )
    //     .catch((error) => toast.error(error.message));
    // });
  };
  const handleUnBlock = () => {
    // startTransition(() => {
    //   onUnBlock(userId)
    //     .then((data) =>
    //       toast.success(`Unblocked the user ${data.blocked.username}`)
    //     )
    //     .catch((error) => toast.error(error.message));
    // });
  };
  return (
    <>
      <Button
        disabled={isPending}
        onClick={isFollowing ? handleUnFollow : handleFollow}
        variant={"default"}
      >
        {isFollowing ? "Unfollow" : "Follow"}
      </Button>
      <Button
        onClick={isBlockByThisUser ? handleUnBlock : handleBlock}
        disabled={isPending}
      >
        {isBlockByThisUser ? "Unblock" : "Block"} user
      </Button>
    </>
  );
};
