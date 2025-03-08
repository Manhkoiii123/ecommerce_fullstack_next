"use client";
import ProductInfo from "@/components/store/product-page/product-info/product-info";
import ProductSwiper from "@/components/store/product-page/product-swiper";
import ShipTo from "@/components/store/product-page/shipping/ship-to";
import ShippingDetails from "@/components/store/product-page/shipping/shipping-details";
import { ProductPageDataType, ProductVariantDataType } from "@/lib/types";
import { useState } from "react";

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
  const { images, shippingDetails } = productData!;
  const [activeImage, setActiveImage] = useState<{ url: string } | null>(
    images[0]
  );

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
          <ProductInfo productData={productData} sizeId={sizeId} />
          <div className="w-full lg:w-[390px]">
            <div className="z-20">
              <div className="bg-white border rounded-md overflow-hidden overflow-y-auto p-4 pb-0">
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
                  </>
                )}
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
