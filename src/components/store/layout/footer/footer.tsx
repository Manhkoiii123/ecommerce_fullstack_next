import Contact from "@/components/store/layout/footer/contact";
import Links from "@/components/store/layout/footer/links";
import Newsletter from "@/components/store/layout/footer/new-letter";
import { getSubcategories } from "@/queries/subCategories";

export default async function Footer() {
  const subs = await getSubcategories(7, true);
  return (
    <div className="w-full bg-white">
      <Newsletter />
      <div className="max-w-[1430px] mx-auto">
        <div className="p-5">
          <div className="grid md:grid-cols-2 md:gap-x-5">
            <Contact />
            <Links subs={subs} />
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-slate-500 to-slate-800 px-2 text-white">
        <div className="max-w-[1430px] mx-auto flex items-center h-7">
          <span className="text-sm">
            <b>© GoShop</b> - All Rights Reserved
          </span>
        </div>
      </div>
    </div>
  );
}
