import StreamPlayer from "@/components/stream-player/StreamPlayer";
import { getStoreByUrl } from "@/queries/store";
import { currentUser } from "@clerk/nextjs/server";

interface CreatorPageProps {
  params: {
    storeUrl: string;
  };
}
const CreatorPage = async ({ params: { storeUrl } }: CreatorPageProps) => {
  const store = await getStoreByUrl(storeUrl);
  if (!store || !store.stream) {
    throw new Error("Unauthorized");
  }
  return (
    <div className="!text-black h-full">
      <StreamPlayer store={store} stream={store.stream} isFollowing={true} />
    </div>
  );
};

export default CreatorPage;
