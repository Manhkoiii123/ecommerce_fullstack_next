"use client";

import { Input } from "@/components/ui/input";
import { useParticipants } from "@livekit/components-react";
import { useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { ScrollArea } from "@/components/ui/scroll-area";
import CommunityItem from "@/components/stream-player/CommunityItem";
import { LocalParticipant, RemoteParticipant } from "livekit-client";

interface ChatCommunityProps {
  viewerName: string;
  hostName: string;
  isHidden: boolean;
}
const ChatCommunity = ({
  hostName,
  isHidden,
  viewerName,
}: ChatCommunityProps) => {
  const [value, setValue] = useState("");
  const [debounceValue] = useDebounceValue<string>(value, 500);
  const participants = useParticipants();
  const onChange = (newValue: string) => {
    setValue(newValue);
  };

  const filterParticipants = useMemo(() => {
    const deduped = participants.reduce((acc, p) => {
      const hostAsViewer = `host-${p.identity}`;
      if (!acc.some((p) => p.identity === hostAsViewer)) {
        acc.push(p);
      }
      return acc;
    }, [] as (RemoteParticipant | LocalParticipant)[]);

    return deduped.filter((p) => {
      return p.name?.toLowerCase().includes(debounceValue.toLowerCase());
    });
  }, [participants, debounceValue]);

  if (isHidden) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Community is disabled</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Input
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search community"
        className="border-white/10"
      />
      <ScrollArea className="gap-y-2 mt-4">
        <p className="text-center text-sm text-muted-foreground hidden last:block p-2">
          No result
        </p>
        {filterParticipants.map((p) => (
          <CommunityItem
            key={p.identity}
            hostName={hostName}
            participantName={p.name}
            participantsIdentity={p.identity}
            viewerName={viewerName}
          />
        ))}
      </ScrollArea>
    </div>
  );
};

export default ChatCommunity;
