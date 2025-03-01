import CategoriesHeader from "@/components/store/layout/categories-header/categories-header";
import Header from "@/components/store/layout/header/header";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

// import { Toaster } from "react-hot-toast";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Header />
      <CategoriesHeader />
      <div>{children}</div>
      {/* <Toaster position="top-center" /> */}
    </div>
  );
}
