import CategoriesHeader from "@/components/store/layout/categories-header/categories-header";
import Footer from "@/components/store/layout/footer/footer";
import Header from "@/components/store/layout/header/header";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

import { Toaster } from "react-hot-toast";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Header />
      <CategoriesHeader />
      <div className="w-full mb-[75px] p-4">{children}</div>
      <Footer />
      <Toaster position="top-center" />
    </div>
  );
}
