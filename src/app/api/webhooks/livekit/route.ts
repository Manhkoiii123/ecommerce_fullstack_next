import { headers } from "next/headers";
import { WebhookReceiver } from "livekit-server-sdk";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);
// lấy link live qua người dùng (vì link live sẽ là /u/${username}) => stream có cái stream.user.username => emit cái này về là ok
export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = headers();
  const authorization = headerPayload.get("Authorization");
  if (!authorization) {
    return new Response("No authorization header", { status: 400 });
  }
  const event = receiver.receive(body, authorization);
  if ((await event).event === "ingress_started") {
    await db.stream.update({
      where: {
        ingressId: (await event).ingressInfo?.ingressId,
      },
      data: {
        isLive: true,
      },
    });
  }
  if ((await event).event === "ingress_ended") {
    await db.stream.update({
      where: {
        ingressId: (await event).ingressInfo?.ingressId,
      },
      data: {
        isLive: false,
      },
    });
  }
  return NextResponse.json({ message: "Webhook received" }, { status: 200 });
}
