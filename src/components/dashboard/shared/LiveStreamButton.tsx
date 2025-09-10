"use client";

import { Button } from "@/components/ui/button";
import { TvMinimalPlay } from "lucide-react";
import { useRouter } from "next/navigation";

const LiveStreamButton = ({ storeUrl }: { storeUrl?: string }) => {
  const router = useRouter();
  return (
    <>
      <Button
        variant={"outline"}
        size={"icon"}
        className="rounded-full"
        onClick={() => {
          router.push(`/live?storeUrl=${storeUrl}`);
        }}
      >
        <TvMinimalPlay className="w-5 h-5" />
      </Button>
    </>
  );
};

export default LiveStreamButton;
