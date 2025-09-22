"use client";

import { useViewerToken } from "@/hooks/use-viewer-token";
import { Store, Stream } from "@prisma/client";
import { LiveKitRoom } from "@livekit/components-react";
import Video from "@/components/stream-player/Video";
import { useChatSidebar } from "@/store/use-chat-sidebar";
import { cn } from "@/lib/utils";
import Chat from "@/components/stream-player/Chat";
import ChatToggle from "@/components/stream-player/ChatToggle";
import Header from "@/components/stream-player/Header";
import SelectedProducts from "@/components/stream-player/SelectedProducts";

interface StreamPlayerProps {
  stream: Stream;
  isFollowing: boolean;
  store: Store;
}
const StreamPlayer = ({ isFollowing, stream, store }: StreamPlayerProps) => {
  const { identity, name, token } = useViewerToken(store.url);

  const { collapsed } = useChatSidebar();
  if (!token || !name || !identity) {
    return <div>cannot</div>;
  }
  return (
    <>
      {collapsed && (
        <div className="hidden lg:block fixed top-[100px] right-2 z-50">
          <ChatToggle />
        </div>
      )}
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_WS_URL}
        className={cn(
          "grid grid-cols-1 lg:gap-y-0 lg:grid-cols-3 2xl:grid-cols-4 h-full",
          collapsed && "lg:grid-cols-2 2xl:grid-cols-2"
        )}
      >
        <div className="space-y-4 col-span-1 lg:col-span-2 2xl:col-span-3 lg:overflow-y-auto hidden-scrollbar pb-10 ">
          <Video hostName={store.name} hostIdentity={store.id} />
          <Header
            hostName={store.name}
            hostIdentity={store.id}
            viewerIdentity={identity}
            imageUrl={store.logo}
            isFollowing={isFollowing}
            name={stream.name}
            storeUrl={store.url}
          />
          <SelectedProducts storeId={store.id} />
        </div>
        <div className={cn("col-span-1 2xl:col-span-1", collapsed && "hidden")}>
          <Chat
            viewerName={name}
            hostName={store.name}
            hostIdentity={store.id}
            isFollowing={isFollowing}
            isChatEnabled={stream.isChatEnabled}
            isChatDelayed={stream.isChatDelayed}
            isChatFollowersOnly={stream.isChatFollowersOnly}
          />
        </div>
      </LiveKitRoom>
    </>
  );
};

export default StreamPlayer;
