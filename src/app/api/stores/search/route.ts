import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limit = Number(searchParams.get("limit") || 10);

    if (!q || q.trim().length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    const stores = await db.store.findMany({
      where: {
        OR: [
          {
            name: {
              contains: q,
            },
          },
          {
            url: {
              contains: q,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        logo: true,
        url: true,
        user: {
          select: {
            id: true,
            onlineStatus: true,
          },
        },
      },
      take: Math.min(Math.max(limit, 1), 25),
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.log("[STORES_SEARCH_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
