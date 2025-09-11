import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const getSeft = async () => {
  const self = await currentUser();

  if (!self || !self.username) {
    throw new Error("Unauthorized");
  }
  const user = await db.user.findUnique({
    where: {
      id: self.id,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
export const getSeftByUsername = async (username: string) => {
  const self = await currentUser();
  if (!self || !self.username) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: self.id },
  });

  if (!user) {
    throw new Error("User not found");
  }
  if (self.username !== user.name) {
    throw new Error("Unauthorized");
  }
  return self;
};
