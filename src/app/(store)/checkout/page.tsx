import CheckoutContainer from "@/components/store/checkout-page/CheckoutContainer";
import Header from "@/components/store/layout/header/header";
import { db } from "@/lib/db";
import { Country } from "@/lib/types";
import { getUserShippingAddresses } from "@/queries/user";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const CheckoutPage = async () => {
  const user = await currentUser();
  if (!user) redirect("/cart");

  const cart = await db.cart.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      cartItems: true,
    },
  });

  if (!cart) redirect("/cart");
  const addresses = await getUserShippingAddresses();
  const countries = await db.country.findMany({
    orderBy: { name: "desc" },
  });
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
      <div className="bg-[#f4f4f4] min-h-[calc(100vh-65px)]">
        <div className="max-w-container mx-auto py-4 px-2 ">
          <CheckoutContainer
            cart={cart}
            countries={countries}
            addresses={addresses}
            //   userCountry={userCountry}
          />
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
