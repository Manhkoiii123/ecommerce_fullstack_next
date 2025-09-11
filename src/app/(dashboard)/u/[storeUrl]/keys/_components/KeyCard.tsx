"use client";
import CopyButton from "@/app/(dashboard)/u/[storeUrl]/keys/_components/CopyButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface KeyCardProps {
  value: string | null;
}

const KeyCard = ({ value }: KeyCardProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-xl bg-[#252731] p-6">
      <div className="flex items-start gap-x-10">
        <p className="font-semibold shrink-0">Stream Key</p>
        <div className="space-y-2 w-full">
          <div className="w-full flex items-center gap-x-2">
            <Input
              className="bg-neutral-900/80 text-white border-none rounded-r-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0"
              value={value || ""}
              disabled
              type={show ? "text" : "password"}
              placeholder="Stream key"
            />
            <CopyButton value={value || ""} />
          </div>
          <Button
            onClick={() => setShow(!show)}
            className="text-white"
            size={"sm"}
            variant={"link"}
          >
            {show ? "Hide" : "Show"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KeyCard;
