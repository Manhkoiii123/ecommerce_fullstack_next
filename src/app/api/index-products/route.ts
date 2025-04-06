import { db } from "@/lib/db";
import client from "@/lib/elastic-search";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const products = await db.product.findMany({
      include: {
        variants: {
          include: {
            images: true,
          },
        },
      },
    });

    const body = products.flatMap((product) =>
      product.variants.flatMap((variant) => {
        const image =
          // @ts-ignore
          variant.images.find((img) => img.order === 1) || variant.images[0];

        return [
          {
            index: { _index: "products", _id: variant.id },
          },
          {
            name: `${product.name} · ${variant.variantName}`,
            link: `/product/${product.slug}?variant=${variant.slug}`,
            image: image ? image.url : "",
          },
        ];
      })
    );

    const bulkResponse = await client.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      return NextResponse.json(
        {
          message: "Failed to index products and variants",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Products indexed successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
