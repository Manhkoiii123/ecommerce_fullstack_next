"use server";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
export const followStore = async (storeId: string): Promise<boolean> => {
  try {
    //  lấy ng hiện tại
    const user = await currentUser();
    if (!user) throw new Error("Unauthenticated");
    // tìm quán
    const store = await db.store.findUnique({
      where: {
        id: storeId,
      },
    });
    if (!store) throw new Error("Store not found.");
    // lấy thông tin ng hiện tại trong db
    const userData = await db.user.findUnique({
      where: {
        id: user.id,
      },
    });
    if (!userData) throw new Error("User not found.");

    const userFollowingStore = await db.user.findFirst({
      where: {
        id: user.id,
        following: {
          some: {
            id: storeId,
          },
        },
      },
    });

    if (userFollowingStore) {
      await db.store.update({
        where: {
          id: storeId,
        },
        data: {
          followers: {
            disconnect: { id: userData.id },
          },
        },
      });
      return false;
    } else {
      await db.store.update({
        where: {
          id: storeId,
        },
        data: {
          followers: {
            connect: {
              id: userData.id,
            },
          },
        },
      });
      return true;
    }
  } catch (error) {
    throw error;
  }
};
