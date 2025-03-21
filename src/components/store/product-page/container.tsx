/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import ProductInfo from "@/components/store/product-page/product-info/product-info";
import ProductSwiper from "@/components/store/product-page/product-swiper";
import QuantitySelector from "@/components/store/product-page/QuantitySelector";
import ReturnPrivacySecurityCard from "@/components/store/product-page/returns-security-privacy-card";
import ShipTo from "@/components/store/product-page/shipping/ship-to";
import ShippingDetails from "@/components/store/product-page/shipping/shipping-details";
import SocialShare from "@/components/store/shared/social-share";
import {
  CartProductType,
  ProductPageDataType,
  ProductVariantDataType,
} from "@/lib/types";
import { isProductValidToAdd } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  const { images, shippingDetails } = productData;
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
  };
  const [productToBeAddedToCart, setProductToBeAddedToCart] =
    useState<CartProductType>(data);
  const [activeImage, setActiveImage] = useState<{ url: string } | null>(
    images[0]
  );

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

  return (
    <div className="relative ">
      <div className="w-full xl:flex xl:gap-4">
        <div className="w-full flex-1">
          <ProductSwiper
            images={images}
            activeImage={activeImage || images[0]}
            setActiveImage={setActiveImage}
          />
        </div>
        <div className="w-full mt-4 md:mt-0 flex flex-col gap-4 md:flex-row">
          <ProductInfo
            productData={productData}
            sizeId={sizeId}
            handleChange={handleChange}
          />
          <div className="w-full h-auto lg:w-[390px]">
            <div className="z-20">
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
                    className={`relative w-full py-2.5 min-w-20 bg-orange-border hover:bg-[#e4cdce] text-orange-hover h-11 rounded-3xl leading-6 inline-block font-bold whitespace-nowrap border border-orange-border cursor-pointer transition-all duration-300 ease-bezier-1 select-none ${
                      !isProductValid ? "cursor-not-allowed" : ""
                    }`}
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
      </div>
      <div className=" w-[calc(100%-390px)] mt-6 pb-16 ">{children}</div>
    </div>
  );
};

export default ProductPageContainer;
