"use server";
import { v4 } from "uuid";
import { AccessToken } from "livekit-server-sdk";
import { getStoreByUrl } from "@/queries/store";
import { currentUser } from "@clerk/nextjs/server";
export const createViewerToken = async (hostIdentity: string) => {
  const userIsLogin = await currentUser();
  const host = await getStoreByUrl(hostIdentity);
  if (!host) {
    throw new Error("Host not found");
  }
  let seft;

  if (!userIsLogin) {
    const id = v4();
    const username = `guest#${Math.floor(Math.random() * 1000)}`;
    seft = {
      id,
      username,
    };
  } else {
    if (userIsLogin.id === host.userId) {
      seft = host;
    } else {
      seft = userIsLogin;
    }
  }

  const isHost = userIsLogin?.id === host.userId;
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: isHost ? `host-${host?.id}` : seft?.id,
      name: !userIsLogin ? (seft as any).username : userIsLogin.username,
    }
  );

  token.addGrant({
    room: host.name,
    roomJoin: true,
    canPublish: false,
    canPublishData: true,
  });
  return await Promise.resolve(token.toJwt());
};
