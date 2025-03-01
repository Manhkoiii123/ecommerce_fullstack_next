import Link from "next/link";
import { cookies } from "next/headers";
import UserMenu from "@/components/store/layout/header/user-menu/user-menu";
import Cart from "@/components/store/layout/header/cart";
import DownloadApp from "@/components/store/layout/header/download-app";
import Search from "@/components/store/layout/header/search/search";
import { Country } from "@/lib/types";
import CountryLanguageCurrencySelector from "@/components/store/layout/header/country-lang-curr-selector";

export default function Header() {
  const cookieStore = cookies();
  const userCountryCookie = cookieStore.get("userCountry");
  let userCountry: Country = {
    name: "United States",
    city: "",
    code: "US",
    region: "",
  };

  if (userCountryCookie) {
    userCountry = JSON.parse(userCountryCookie.value) as Country;
  }
  return (
    <div className="bg-gradient-to-r from-slate-500 to-slate-800">
      <div className="h-full w-full lg:flex text-white px-4 lg:px-12">
        <div className="flex lg:w-full lg:flex-1 flex-col lg:flex-row gap-3 py-3">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="font-extrabold text-3xl font-mono">GoShop</h1>
            </Link>
            <div className="flex lg:hidden">
              <UserMenu />
              <Cart />
            </div>
          </div>
          <Search />
        </div>
        <div className="hidden lg:flex w-full lg:w-fit lg:mt-2 justify-end mt-1.5 pl-6">
          <div className="lg:flex">
            <DownloadApp />
          </div>
          <CountryLanguageCurrencySelector userCountry={userCountry} />
          <UserMenu />
          <Cart />
        </div>
      </div>
    </div>
  );
}
