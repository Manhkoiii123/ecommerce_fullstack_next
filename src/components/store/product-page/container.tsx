/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import { useCartStore } from "@/cart-store/useCartStore";
import ProductInfo from "@/components/store/product-page/product-info/product-info";
import ProductSwiper from "@/components/store/product-page/product-swiper";
import QuantitySelector from "@/components/store/product-page/QuantitySelector";
import ReturnPrivacySecurityCard from "@/components/store/product-page/returns-security-privacy-card";
import ShipTo from "@/components/store/product-page/shipping/ship-to";
import ShippingDetails from "@/components/store/product-page/shipping/shipping-details";
import SocialShare from "@/components/store/shared/social-share";
import useFromStore from "@/hooks/useFromStore";
import {
  CartProductType,
  ProductPageDataType,
  ProductVariantDataType,
} from "@/lib/types";
import { cn, isProductValidToAdd, updateProductHistory } from "@/lib/utils";
import { ProductVariantImage } from "@prisma/client";
import { setCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProductPageContainerProps {
  productData: ProductPageDataType;
  sizeId: string | undefined;
  children: React.ReactNode;
}
const ProductPageContainer = ({
  children,
  productData,
  sizeId,
}: ProductPageContainerProps) => {
  if (!productData) return null;
  const { images, shippingDetails, productId, variantId } = productData;
  if (typeof shippingDetails === "boolean") return null;
  const data: CartProductType = {
    productId: productData.productId,
    variantId: productData.variantId,
    productSlug: productData.productSlug,
    variantSlug: productData.variantSlug,
    name: productData.name,
    variantName: productData.variantName,
    image: images[0].url,
    variantImage: productData.variantImage,
    quantity: 1,
    price: 0,
    sizeId: sizeId || "",
    size: "",
    stock: 1,
    weight: productData.weight || 0,
    shippingMethod: shippingDetails.shippingFeeMethod,
    shippingService: shippingDetails.shippingService,
    shippingFee: shippingDetails.shippingFee,
    extraShippingFee: shippingDetails.extraShippingFee,
    deliveryTimeMin: shippingDetails.deliveryTimeMin,
    deliveryTimeMax: shippingDetails.deliveryTimeMax,
    isFreeShipping: shippingDetails.isFreeShipping,
    freeShippingForAllCountries: productData.freeShippingForAllCountries,
  };

  const [productToBeAddedToCart, setProductToBeAddedToCart] =
    useState<CartProductType>(data);
  const [activeImage, setActiveImage] = useState<{ url: string } | null>(
    images[0]
  );
  const [variantImages, setVariantImages] =
    useState<ProductVariantImage[]>(images);

  const [isProductValid, setIsProductValid] = useState(false);
  const handleChange = (property: keyof CartProductType, value: any) => {
    setProductToBeAddedToCart((prevProduct) => ({
      ...prevProduct,
      [property]: value,
    }));
  };
  useEffect(() => {
    const check = isProductValidToAdd(productToBeAddedToCart);
    if (check !== isProductValid) {
      setIsProductValid(check);
    }
  }, [productToBeAddedToCart]);

  const addToCart = useCartStore((state) => state.addToCart);
  const cartItems = useFromStore(useCartStore, (state) => state.cart);
  const setCart = useCartStore((state) => state.setCart);
  // Keeping cart state updated
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the "cart" key was changed in localStorage
      if (event.key === "cart") {
        try {
          const parsedValue = event.newValue
            ? JSON.parse(event.newValue)
            : null;

          // Check if parsedValue and state are valid and then update the cart
          if (
            parsedValue &&
            parsedValue.state &&
            Array.isArray(parsedValue.state.cart)
          ) {
            setCart(parsedValue.state.cart);
          }
        } catch (error) {}
      }
    };

    // Attach the event listener
    window.addEventListener("storage", handleStorageChange);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  updateProductHistory(variantId);

  const maxQty =
    cartItems && sizeId
      ? (() => {
          const search_product = cartItems?.find(
            (p) =>
              p.productId === productId &&
              p.variantId === variantId &&
              p.sizeId === sizeId
          );
          return search_product
            ? search_product.stock - search_product.quantity
            : productToBeAddedToCart.stock;
        })()
      : productToBeAddedToCart.stock;
  const handleAddToCart = () => {
    if (maxQty <= 0) return;
    addToCart(productToBeAddedToCart);
    toast.success("Product added to cart successfully");
  };

  setCookie(`viewedProduct_${productData.productId}`, "true", {
    maxAge: 3600,
    path: "/",
  });

  const [isFixed, setIsFixed] = useState(false);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const handleScroll = () => {
    const childrenElement = document.getElementById("children-container");
    if (childrenElement) {
      const rect = childrenElement.getBoundingClientRect();

      if (window.scrollY > 600) {
        setIsFixed(true);
        setOffsetLeft(rect.right);
      } else {
        setIsFixed(false);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    window.addEventListener("resize", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);
  return (
    <div className="relative ">
      <div className="w-full xl:flex xl:gap-4">
        <div className="w-full flex-1">
          <ProductSwiper
            images={variantImages.length > 0 ? variantImages : images}
            activeImage={activeImage || images[0]}
            setActiveImage={setActiveImage}
          />
        </div>
        <div className="w-full mt-4 md:mt-0 flex flex-col gap-4 md:flex-row">
          <ProductInfo
            productData={productData}
            sizeId={sizeId}
            handleChange={handleChange}
            setVariantImages={setVariantImages}
            setActiveImage={setActiveImage}
          />
          <div
            className={`w-full lg:w-[390px] ${
              isFixed
                ? `lg:fixed lg:top-2 transition-all duration-300 transform`
                : "relative"
            } z-20`}
            style={{
              left: isFixed ? `${offsetLeft + 20}px` : "auto",
              transform: isFixed ? "translateY(0)" : "translateY(-10px)",
            }}
          >
            <div className="bg-white border rounded-md overflow-hidden  p-4 pb-0">
              {typeof shippingDetails !== "boolean" && (
                <>
                  <ShipTo
                    countryCode={shippingDetails.countryCode}
                    countryName={shippingDetails.countryName}
                    city={shippingDetails.city}
                  />
                  <div className="mt-3 space-y-3">
                    <ShippingDetails
                      quantity={1}
                      shippingDetails={shippingDetails}
                      weight={productData?.weight || 0}
                      freeShippingForAllCountries={
                        productData.freeShippingForAllCountries
                      }
                    />
                  </div>
                  <ReturnPrivacySecurityCard
                    returnPolicy={shippingDetails?.returnPolicy}
                    loading={false}
                  />
                </>
              )}
              <div className="mt-5 bg-white bottom-0 pb-4 space-y-3 sticky ">
                {/* quantity selector */}
                {sizeId && (
                  <div className=" w-full flex justify-end mt-4">
                    <QuantitySelector
                      productId={productToBeAddedToCart.productId}
                      quantity={productToBeAddedToCart.quantity}
                      size={productData.sizes}
                      sizeId={productToBeAddedToCart.sizeId}
                      handleChange={handleChange}
                      variantId={productToBeAddedToCart.variantId}
                      stock={productToBeAddedToCart.stock}
                    />
                  </div>
                )}
                {/* action button */}
                <button className="relative w-full py-2.5 min-w-20 bg-orange-background hover:bg-orange-hover text-white rounded-3xl h-11 leading-6 inline-block font-bold whitespace-nowrap border border-orange-border cursor-pointer transition-all duration-300 ease-bezier-1 select-none">
                  <span>Buy now</span>
                </button>
                <button
                  disabled={!isProductValid}
                  className={cn(
                    "relative w-full py-2.5 min-w-20 bg-orange-border hover:bg-[#e4cdce] text-orange-hover h-11 rounded-3xl leading-6 inline-block font-bold whitespace-nowrap border border-orange-border cursor-pointer transition-all duration-300 ease-bezier-1 select-none",
                    {
                      "cursor-not-allowed": !isProductValid || maxQty <= 0,
                    }
                  )}
                  onClick={() => handleAddToCart()}
                >
                  <span>Add to cart</span>
                </button>
                <SocialShare
                  // url=""
                  // quote=""
                  url={`/product/${productData.productSlug}/${productData.variantSlug}`}
                  quote={`${productData.name} · ${productData.variantName}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        id="children-container"
        className="lg:w-[calc(100%-410px)] mt-6 pb-16"
      >
        {children}
      </div>
    </div>
  );
};

export default ProductPageContainer;
