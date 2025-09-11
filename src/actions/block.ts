"use server";
import { getSeft } from "@/lib/auth-service";
import { blockUser, unBlockUser } from "@/lib/block-service";
import { RoomServiceClient } from "livekit-server-sdk";
import { revalidatePath } from "next/cache";

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_API_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export const onBlock = async (id: string) => {
  //TODO : disconnect from live
  // TODO allow abiliti to kick the guest
  // const self = await getSeft();
  // let blockedUser;
  // try {
  //   blockedUser = await blockUser(id);
  // } catch (error) {
  //   //guest
  // }
  // try {
  //   await roomService.removeParticipant(self.id, id);
  // } catch (error) {
  //   //user is not in the room
  // }
  // // revalidatePath(`/u/${self.username}/community`);
  // if (blockedUser) {
  //   revalidatePath(`/${blockedUser.blocked.username}`);
  // }
  // return blockedUser;
};
export const onUnBlock = async (id: string) => {
  // const unblockedUser = await unBlockUser(id);
  // revalidatePath("/");
  // if (unblockedUser) {
  //   revalidatePath(`/${unblockedUser.blocked.username}`);
  // }
  // return unblockedUser;
};
