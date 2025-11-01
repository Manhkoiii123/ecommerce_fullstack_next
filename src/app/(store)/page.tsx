import ProductCard from "@/components/store/cards/product/product-card";
import AnimatedDeals from "@/components/store/home/animated-deals";
import Featured from "@/components/store/home/main/featured";
import HomeMainSwiper from "@/components/store/home/main/home-swiper";
import HomeUserCard from "@/components/store/home/main/user/user";
import Sideline from "@/components/store/home/sideline/sideline";
import CategoriesHeader from "@/components/store/layout/categories-header/categories-header";
import Footer from "@/components/store/layout/footer/footer";
import Header from "@/components/store/layout/header/header";
import ProductList from "@/components/store/shared/product-list";
import MainSwiper from "@/components/store/shared/swiper";
import { SimpleProduct } from "@/lib/types";
import { getHomeDataDynamic } from "@/queries/home";
import { getProducts } from "@/queries/product";
import { getActiveFlashSales } from "@/queries/flash-sale";
import Image from "next/image";
import SuperDealsImg from "@/public/assets/images/ads/super-deals.avif";
import FeaturedCategories from "@/components/store/home/featured-categories";
import FlashSaleBanner from "@/components/store/home/flash-sale-banner";

export default async function Home() {
  const productsData = await getProducts();
  const { products } = productsData;

  const {
    products_mens_fashion: products_laptop,
    products_flash_sale: products_flash_sale,
    products_buy_1_get_1: products_buy_1_get_1,
    products_offer_tag_4,
  } = await getHomeDataDynamic([
    { property: "category", value: "mens-fashion", type: "simple" },
    { property: "offer", value: "flash-sale", type: "full" },
    { property: "offer", value: "buy-1-get-1", type: "simple" },
    { property: "offer", value: "offer_tag_4", type: "simple" },
  ]);

  // Get active flash sales
  const activeFlashSales = await getActiveFlashSales();
  const firstFlashSale =
    activeFlashSales.length > 0 ? activeFlashSales[0] : undefined;

  return (
    <>
      <Header />
      <CategoriesHeader />
      <div className="relative w-full">
        <Sideline />
        <div className="relative w-[calc(100%-40px)] h-full bg-[#e3e3e3]">
          <div className="max-w-[1600px] mx-auto min-h-screen p-4">
            <div className="w-full grid gap-2 min-[1170px]:grid-cols-[1fr_350px] min-[1465px]:grid-cols-[200px_1fr_350px]">
              <div
                className="cursor-pointer hidden min-[1465px]:block bg-cover bg-no-repeat rounded-md"
                style={{
                  backgroundImage:
                    "url(/assets/images/ads/winter-sports-clothing.jpg)",
                }}
              />
              <div className="space-y-2 h-fit">
                <HomeMainSwiper />
                <Featured
                  products={products_laptop.filter(
                    (product): product is SimpleProduct =>
                      "variantSlug" in product
                  )}
                />
              </div>
              <div className="h-full">
                <HomeUserCard
                  products={products_laptop.filter(
                    (product): product is SimpleProduct =>
                      "variantSlug" in product
                  )}
                />
              </div>
            </div>
            {/* Animated deals */}
            <div className="mt-2 hidden min-[915px]:block">
              <AnimatedDeals
                products={products_laptop.filter(
                  (product): product is SimpleProduct =>
                    "variantSlug" in product
                )}
                flashSale={firstFlashSale}
              />
            </div>
            {/* Flash Sales Banner */}
            <div className="mt-10">
              <FlashSaleBanner flashSales={activeFlashSales.slice(1)} />
            </div>

            <div className="mt-10 space-y-10">
              <div className="bg-white rounded-md">
                <MainSwiper products={products_flash_sale} type="curved">
                  <div className="mb-4 pl-4 flex items-center justify-between">
                    <Image
                      src={SuperDealsImg}
                      alt="Super deals"
                      width={200}
                      height={50}
                    />
                  </div>
                </MainSwiper>
              </div>

              <FeaturedCategories />

              <div>
                <div className="text-center h-[32px] leading-[32px] text-[24px] font-extrabold text-[#222] flex justify-center">
                  <div className="h-[1px] flex-1 border-t-[2px] border-t-[hsla(0,0%,59.2%,.3)] my-4 mx-[14px]" />
                  <span>More to love</span>
                  <div className="h-[1px] flex-1 border-t-[2px] border-t-[hsla(0,0%,59.2%,.3)] my-4 mx-[14px]" />
                </div>
                <div className="mt-7 bg-white justify-center flex flex-wrap min-[1530px]:grid min-[1530px]:grid-cols-7 p-4 pb-16 rounded-md">
                  {products.map((product, i) => (
                    <ProductCard key={i} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
