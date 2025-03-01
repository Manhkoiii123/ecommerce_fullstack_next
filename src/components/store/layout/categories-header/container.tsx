"use client";
import { useState } from "react";
import { Category, OfferTag } from "@prisma/client";
import CategoriesMenu from "@/components/store/layout/categories-header/categories-menu";
import OfferTagsLinks from "@/components/store/layout/categories-header/offerTags-links";

export default function CategoriesHeaderContainer({
  categories,
  offerTags,
}: {
  categories: Category[];
  offerTags: OfferTag[];
}) {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className="w-full px-4 flex items-center gap-x-1">
      <CategoriesMenu categories={categories} open={open} setOpen={setOpen} />
      <OfferTagsLinks offerTags={offerTags} open={open} />
    </div>
  );
}
