import { Country } from "@/lib/types";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import countries from "@/data/countries.json";
import { getUserCountry } from "@/lib/utils";
const isProtectedRoute = createRouteMatcher([
  "/dashboard",
  "/dashboard/(.*)",
  "/checkout",
  "/profile",
  "/profile/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }
  if (isProtectedRoute(req)) await auth.protect();
  let response = NextResponse.next();
  const countryCookie = req.cookies.get("userCountry");

  const DEFAULT_COUNTRY: Country = {
    name: "United States",
    code: "US",
    city: "",
    region: "",
  };
  if (countryCookie) {
    response = NextResponse.next();
  } else {
    // const geo = geolocation(req);
    // let userCountry = {
    //   name:
    //     countries.find((c) => c.code === geo.country)?.name ||
    //     DEFAULT_COUNTRY.name,
    //   code: geo.country || DEFAULT_COUNTRY.code,
    //   city: geo.city || DEFAULT_COUNTRY.city,
    //   region: geo.region || DEFAULT_COUNTRY.region,
    // };

    response = NextResponse.redirect(new URL(req.url));
    const userCountry = await getUserCountry();
    response.cookies.set("userCountry", JSON.stringify(userCountry), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return response;
});

export const config = {
  matcher: [
    "/",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
