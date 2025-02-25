"use server";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { SubCategory } from "@prisma/client";

export const getAllSubCategories = async () => {
  const subCategories = await db.subCategory.findMany({
    include: {
      category: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
  return subCategories;
};

export const upsertSubCategory = async (subCategory: SubCategory) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (user.privateMetadata.role !== "ADMIN")
      throw new Error(
        "Unauthorized Access: Admin Privileges Required for Entry."
      );

    if (!subCategory) throw new Error("Please provide subCategory data.");

    const existingSubCategory = await db.subCategory.findFirst({
      where: {
        AND: [
          {
            OR: [{ name: subCategory.name }, { url: subCategory.url }],
          },
          {
            NOT: {
              id: subCategory.id,
            },
          },
        ],
      },
    });

    if (existingSubCategory) {
      let errorMessage = "";
      if (existingSubCategory.name === subCategory.name) {
        errorMessage = "A SubCategory with the same name already exists";
      } else if (existingSubCategory.url === subCategory.url) {
        errorMessage = "A SubCategory with the same URL already exists";
      }
      throw new Error(errorMessage);
    }

    const subCategoryDetails = await db.subCategory.upsert({
      where: {
        id: subCategory.id,
      },
      update: subCategory,
      create: subCategory,
    });
    return subCategoryDetails;
  } catch (error) {
    throw error;
  }
};

export const deleteSubCategory = async (subCategoryId: string) => {
  const user = await currentUser();

  if (!user) throw new Error("Unauthenticated.");

  if (user.privateMetadata.role !== "ADMIN")
    throw new Error(
      "Unauthorized Access: Admin Privileges Required for Entry."
    );

  if (!subCategoryId) throw new Error("Please provide category ID.");

  const response = await db.subCategory.delete({
    where: {
      id: subCategoryId,
    },
  });
  return response;
};

export const getAllCategoriesForCategory = async (categoryId: string) => {
  const subCategories = await db.subCategory.findMany({
    where: {
      categoryId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
  return subCategories;
};
