"use server";

import {
  IngressAudioEncodingPreset,
  IngressInput,
  IngressClient,
  IngressVideoEncodingPreset,
  RoomServiceClient,
  type CreateIngressOptions,
  TrackSource,
  IngressVideoOptions,
  IngressAudioOptions,
} from "livekit-server-sdk";
import { db } from "@/lib/db";
import { getSeft } from "@/lib/auth-service";
import { revalidatePath } from "next/cache";
import { getStorePageDetails } from "@/queries/store";

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_API_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const ingressClient = new IngressClient(process.env.LIVEKIT_API_URL!);

export const resetIngress = async (storeUrl: string) => {
  const store = await getStorePageDetails(storeUrl);
  if (!store) {
    throw new Error("Store not found");
  }
  const ingresses = await ingressClient.listIngress({
    roomName: store.name,
  });
  const rooms = await roomService.listRooms([store.name]);

  for (const room of rooms) {
    await roomService.deleteRoom(room.name);
  }
  for (const ingress of ingresses) {
    if (ingress.ingressId) {
      await ingressClient.deleteIngress(ingress.ingressId);
    }
  }
};

export const createIngress = async (
  ingressType: IngressInput,
  storeUrl: string
) => {
  const self = await getSeft();
  const store = await getStorePageDetails(storeUrl);

  if (!store) {
    throw new Error("Store not found or access denied");
  }
  // Kiểm tra ingress đã tồn tại chưa
  const existing = await ingressClient.listIngress({ roomName: storeUrl });
  if (existing.length > 0 && existing[0].url && existing[0].streamKey) {
    return {
      ingressId: existing[0].ingressId!,
      url: existing[0].url,
      streamKey: existing[0].streamKey,
    };
  }

  // Nếu chưa có ingress -> tạo mới
  const options: CreateIngressOptions = {
    name: store.name,
    roomName: store.name,
    participantName: store.name,
    participantIdentity: store.id,
  };

  if (ingressType === IngressInput.WHIP_INPUT) {
    options.bypassTranscoding = true;
  } else {
    options.video = new IngressVideoOptions({
      source: TrackSource.CAMERA,
      encodingOptions: {
        case: "preset",
        value: IngressVideoEncodingPreset.H264_1080P_30FPS_3_LAYERS,
      },
    });
    options.audio = new IngressAudioOptions({
      source: TrackSource.MICROPHONE,
      encodingOptions: {
        case: "preset",
        value: IngressAudioEncodingPreset.OPUS_STEREO_96KBPS,
      },
    });
  }

  const ingress = await ingressClient.createIngress(ingressType, options);

  if (!ingress || !ingress.url || !ingress.streamKey) {
    throw new Error("Failed to create ingress");
  }

  const stream = await db.stream.findFirst({
    where: {
      store: { url: storeUrl },
    },
    select: { id: true },
  });

  if (stream) {
    await db.stream.update({
      where: { id: stream.id },
      data: {
        ingressId: ingress.ingressId,
        serverUrl: ingress.url,
        streamKey: ingress.streamKey,
      },
    });
  }

  revalidatePath(`/u/${storeUrl}/keys`);

  return {
    ingressId: ingress.ingressId,
    url: ingress.url,
    streamKey: ingress.streamKey,
  };
};
