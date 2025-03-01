import CategoriesHeaderContainer from "@/components/store/layout/categories-header/container";
import { getAllCategories } from "@/queries/category";
import { getAllOfferTags } from "@/queries/offer-tag";

export default async function CategoriesHeader() {
  const categories = await getAllCategories();
  const offerTags = await getAllOfferTags();
  return (
    <div className="w-full pt-2 pb-3 px-0 bg-gradient-to-r from-slate-500 to-slate-800">
      <CategoriesHeaderContainer
        categories={categories}
        offerTags={offerTags}
      />
    </div>
  );
}
