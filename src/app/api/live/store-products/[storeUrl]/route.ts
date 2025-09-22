import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { storeUrl: string } }
) {
  try {
    const { storeUrl } = params;
    if (!storeUrl)
      return NextResponse.json(
        { error: "storeUrl is required" },
        { status: 400 }
      );

    const store = await db.store.findUnique({
      where: { url: storeUrl },
      select: { id: true },
    });
    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const products = await db.product.findMany({
      where: { storeId: store.id },
      select: { id: true, name: true },
    });
    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
