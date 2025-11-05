import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { storeId, productId } = req.body as {
      storeId?: string;
      productId?: string;
    };

    if (!storeId || !productId) {
      return res.status(400).json({ error: "Missing storeId or productId" });
    }

    const store = await db.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        url: true,
        userId: true,
        followers: { select: { id: true } },
      },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }
    if (store.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        variants: {
          select: {
            slug: true,
            variantImage: true,
            images: { select: { url: true } },
          },
          take: 1,
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const primaryVariant = product.variants[0];
    const variantSlug = primaryVariant?.slug || "";
    const imageUrl =
      primaryVariant?.variantImage || primaryVariant?.images[0]?.url || "";
    const productUrl = `/product/${product.slug}/${variantSlug}`;

    const followers = store.followers || [];
    if (followers.length === 0) {
      return res.status(200).json({ count: 0 });
    }

    const now = new Date();
    for (const follower of followers) {
      const notification = await db.notification.create({
        data: {
          type: "SYSTEM_UPDATE",
          title: `New product from ${store.name}`,
          message: `${product.name} has just been published. Check it out!`,
          userId: follower.id,
          storeId: store.id,
          data: {
            productId: product.id,
            productSlug: product.slug,
            variantSlug,
            productUrl,
            image: imageUrl,
          },
          createdAt: now,
        },
      });

      res?.socket?.server?.io?.emit(
        `notifications:user:${follower.id}`,
        notification
      );
    }

    return res.status(200).json({ count: followers.length });
  } catch (error) {
    console.log("[PRODUCT_PUBLISHED_NOTIFICATIONS]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
