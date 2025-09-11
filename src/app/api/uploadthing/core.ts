import { getSeft } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  thumbnailUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const self = await getSeft();

      // Lấy storeUrl từ query params
      const url = new URL(req.url);
      const storeUrl = url.searchParams.get("storeUrl");

      if (!storeUrl) {
        throw new UploadThingError("Store URL is required");
      }

      // Verify user owns this store
      const store = await db.store.findFirst({
        where: {
          url: storeUrl,
          userId: self.id,
        },
        select: {
          id: true,
        },
      });

      if (!store) {
        throw new UploadThingError("Store not found or access denied");
      }

      return { user: self, storeId: store.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Update stream của store cụ thể
      await db.stream.update({
        where: {
          storeId: metadata.storeId,
        },
        data: {
          thumbnailUrl: file.url,
        },
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
