import CartContainer from "@/components/store/cart-page/container";
import Header from "@/components/store/layout/header/header";
import { Country } from "@/lib/types";
import { cookies } from "next/headers";
import React from "react";

const CartPage = () => {
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
    <>
      <Header />
      <CartContainer userCountry={userCountry} />
    </>
  );
};

export default CartPage;
