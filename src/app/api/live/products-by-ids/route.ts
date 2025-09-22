import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { productIds } = await req.json();
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: {
        variants: {
          include: {
            sizes: true,
            images: true,
            colors: true,
          },
        },
      },
    });

    const mapped = products.map((product) => {
      const variants = product.variants.map((variant) => ({
        variantId: variant.id,
        variantSlug: variant.slug,
        variantName: variant.variantName,
        images: variant.images,
        sizes: variant.sizes,
      }));

      const variantImages = product.variants.map((variant) => ({
        url: `/product/${product.slug}/${variant.slug}`,
        image: variant.variantImage
          ? variant.variantImage
          : variant.images[0]?.url,
      }));

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        rating: product.rating,
        sales: product.sales,
        numReviews: product.numReviews,
        variants,
        variantImages,
      };
    });

    const orderIndex: Record<string, number> = Object.fromEntries(
      productIds.map((id: string, idx: number) => [id, idx])
    );
    mapped.sort((a, b) => (orderIndex[a.id] ?? 0) - (orderIndex[b.id] ?? 0));

    return NextResponse.json({ products: mapped });
  } catch (e) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
