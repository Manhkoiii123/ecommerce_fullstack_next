"use server";

import { db } from "@/lib/db";
// nếu muốn thêm trường vào db (sau khi npx prisma gene=> chạy db push thì lỗi) mà trong db bảng đó đã có dữ liệu thì nó sẽ có thông báo
// là mất all dữ liệu => chạy script để tránh
export async function updateVariantImage() {
  try {
    const variants = await db.productVariant.findMany({
      include: {
        images: true,
      },
    });

    for (const variant of variants) {
      if (variant.images.length > 0) {
        const firstImage = variant.images[0];
        await db.productVariant.update({
          where: { id: variant.id },
          data: {
            variantImage: firstImage.url,
          },
        });
      }
    }
  } catch (error) {}
}
