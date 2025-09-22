import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// In-memory store of selected product IDs per store
// Keyed by storeId
const liveSelectedProductsStore: Map<
  string,
  { productIds: string[]; updatedAt: number }
> = (global as any).liveSelectedProductsStore || new Map();

if (!(global as any).liveSelectedProductsStore) {
  (global as any).liveSelectedProductsStore = liveSelectedProductsStore;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  try {
    const { method } = req;
    const { storeId } = (req.method === "GET" ? req.query : req.body) as {
      storeId?: string;
    };

    if (!storeId || typeof storeId !== "string") {
      return res.status(400).json({ error: "storeId is required" });
    }

    if (method === "GET") {
      const current = liveSelectedProductsStore.get(storeId) || {
        productIds: [],
        updatedAt: Date.now(),
      };

      // Resolve minimal product details for current selection
      const products = current.productIds.length
        ? await db.product.findMany({
            where: { id: { in: current.productIds } },
            select: {
              id: true,
              name: true,
              slug: true,
              variants: {
                select: {
                  id: true,
                  variantName: true,
                  images: { select: { url: true } },
                  sizes: { select: { price: true, discount: true } },
                },
              },
            },
          })
        : [];

      return res.status(200).json({
        productIds: current.productIds,
        products,
        updatedAt: current.updatedAt,
      });
    }

    if (method === "POST") {
      const { userId } = getAuth(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify the user is the owner of the store
      const store = await db.store.findUnique({
        where: { id: storeId },
        select: { id: true, userId: true },
      });
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      if (store.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { productIds } = req.body as {
        storeId: string;
        productIds: string[];
      };
      if (!Array.isArray(productIds)) {
        return res.status(400).json({ error: "productIds must be an array" });
      }

      const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));

      liveSelectedProductsStore.set(storeId, {
        productIds: uniqueProductIds,
        updatedAt: Date.now(),
      });

      // Resolve minimal product details to broadcast
      const products = uniqueProductIds.length
        ? await db.product.findMany({
            where: { id: { in: uniqueProductIds } },
            select: {
              id: true,
              name: true,
              slug: true,
              variants: {
                select: {
                  id: true,
                  variantName: true,
                  images: { select: { url: true } },
                  sizes: { select: { price: true, discount: true } },
                },
              },
            },
          })
        : [];

      const channel = `live:store:${storeId}:products`;
      res?.socket?.server?.io?.emit(channel, {
        productIds: uniqueProductIds,
        products,
        updatedAt: Date.now(),
      });

      return res.status(200).json({ productIds: uniqueProductIds, products });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.log("[LIVE_PRODUCTS]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
