import { NextRequest, NextResponse } from "next/server";
import { getProductFlashSaleDiscount } from "@/queries/flash-sale";

export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds)) {
    return NextResponse.json(
        { error: "Product IDs array is required" },
        { status: 400 }
      );
    }

    const flashSalePrices = await Promise.all(
      productIds.map(async (productId: string) => {
        const discount = await getProductFlashSaleDiscount(productId);
        return {
          productId,
          discount,
        };
      })
    );

    return NextResponse.json({ flashSalePrices });
  } catch (error) {
    console.error("Error fetching flash sale cart prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch flash sale prices" },
      { status: 500 }
    );
  }
}
