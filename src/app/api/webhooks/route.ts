import { Webhook } from "svix";
import { headers } from "next/headers";
import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";
import { User } from "@prisma/client";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;
  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  const wh = new Webhook(SIGNING_SECRET);

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const data = JSON.parse(body).data;

    const user: Partial<User> = {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email_addresses[0].email_address,
      picture: data.image_url,
    };

    if (!user) return;

    // lấy user hiện có từ DB
    const existingUser = await db.user.findUnique({
      where: { email: user.email! },
    });

    let dbUser: User;
    if (existingUser) {
      // update nếu có user rồi
      dbUser = await db.user.update({
        where: { email: user.email! },
        data: user,
      });
    } else {
      // tạo mới, mặc định role = USER
      dbUser = await db.user.create({
        data: {
          id: user.id!,
          name: user.name!,
          email: user.email!,
          picture: user.picture!,
          role: "USER",
        },
      });
    }

    // 🔑 chỉ update metadata khi user mới tạo hoặc khi chưa có role
    if (!data.private_metadata?.role) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(data.id, {
        privateMetadata: {
          role: dbUser.role || "USER",
        },
      });
    }
  }

  if (eventType === "user.deleted") {
    const userId = JSON.parse(body).data.id;
    await db.user.delete({
      where: { id: userId },
    });
  }

  return new Response("Webhook received", { status: 200 });
}
