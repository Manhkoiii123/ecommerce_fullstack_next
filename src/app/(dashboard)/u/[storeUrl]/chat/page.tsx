import ToggleCard from "@/app/(dashboard)/u/[storeUrl]/chat/_components/ToggleCard";
import { getStreamByStoreUrl } from "@/lib/stream-service";

const ChatPage = async ({ params }: { params: { storeUrl: string } }) => {
  const stream = await getStreamByStoreUrl(params.storeUrl);
  if (!stream) {
    throw new Error("Stream not found");
  }
  return (
    <div className="p-6 text-white">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat settings</h1>
      </div>
      <div className="space-y-4">
        <ToggleCard
          field="isChatEnabled"
          label="Enable chat"
          value={stream.isChatEnabled}
        />
        <ToggleCard
          field="isChatDelayed"
          label="Delay chat"
          value={stream.isChatDelayed}
        />
        <ToggleCard
          field="isChatFollowersOnly"
          label="Must be following to chat"
          value={stream.isChatFollowersOnly}
        />
      </div>
    </div>
  );
};

export default ChatPage;
