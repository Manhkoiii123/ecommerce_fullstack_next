import ConnectModal from "@/app/(dashboard)/u/[storeUrl]/keys/_components/ConnectModal";
import KeyCard from "@/app/(dashboard)/u/[storeUrl]/keys/_components/KeyCard";
import UrlCard from "@/app/(dashboard)/u/[storeUrl]/keys/_components/UrlCard";
import { getStreamByStoreUrl } from "@/lib/stream-service";
import { getStoreByUrl } from "@/queries/store";
import React from "react";

const KeysPage = async ({ params }: { params: { storeUrl: string } }) => {
  const self = await getStoreByUrl(params.storeUrl);
  const stream = await getStreamByStoreUrl(params.storeUrl);
  if (!stream) {
    throw new Error("Stream not found");
  }
  return (
    <div className="!pointer-events-nonetext-black p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Keys & URLs</h1>
        <ConnectModal storeUrl={params.storeUrl} />
      </div>
      <div className="space-y-4">
        <UrlCard value={stream.serverUrl} />
        <KeyCard value={stream.streamKey} />
      </div>
    </div>
  );
};

export default KeysPage;
