import StreamPlayer from "@/components/stream-player/StreamPlayer";
import { isBlockedByUser } from "@/lib/block-service";
import {
  checkIfCurrentUserFollowingStore,
  getStoreByUrl,
} from "@/queries/store";
import { notFound } from "next/navigation";

interface UserPageprops {
  params: {
    storeUrl: string;
  };
}
const UserPage = async ({ params: { storeUrl } }: UserPageprops) => {
  const store = await getStoreByUrl(storeUrl);
  if (!store || !store.stream) {
    notFound();
  }

  const isFollowing = await checkIfCurrentUserFollowingStore(storeUrl);

  return (
    <StreamPlayer
      store={store}
      stream={store.stream}
      isFollowing={isFollowing}
    />
  );
};

export default UserPage;
