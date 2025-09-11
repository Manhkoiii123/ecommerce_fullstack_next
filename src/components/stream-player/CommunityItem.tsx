"use client";

// import { onBlock } from "@/actions/block";
import Hint from "@/components/live/hint";
import { Button } from "@/components/ui/button";
import { cn, stringToColor } from "@/lib/utils";
import { MinusCircle } from "lucide-react";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";

interface CommunityItemProps {
  hostName: string;
  participantName: string | undefined;
  participantsIdentity: string;
  viewerName: string;
}
const CommunityItem = ({
  hostName,
  participantName,
  participantsIdentity,
  viewerName,
}: CommunityItemProps) => {
  const [isPending, startTransition] = useTransition();
  const color = stringToColor(participantName || "");
  const isSelf = participantName === viewerName;
  const isHost = viewerName === hostName;
  const handleBlock = () => {
    // if (!participantName || isSelf || !isHost) return;
    // startTransition(() => {
    //   onBlock(participantsIdentity)
    //     .then(() => {
    //       toast.success(`Blocked ${participantName}`);
    //     })
    //     .catch(() => {
    //       toast.error("Something went wrong");
    //     });
    // });
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between w-full p-2 rounded-md text-sm hover:bg-white/5",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      <p style={{ color: color }}>{participantName}</p>
      {isHost && !isSelf && (
        <Hint label="Block">
          <Button
            variant={"ghost"}
            disabled={isPending}
            onClick={handleBlock}
            className="h-auto w-auto p-1 opacity-0 group-hover:opacity-100 transition"
          >
            <MinusCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Hint>
      )}
    </div>
  );
};

export default CommunityItem;
