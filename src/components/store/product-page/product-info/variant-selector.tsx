import { VariantInfoType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductVariantImage } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React, { Dispatch, SetStateAction } from "react";
interface Variant {
  url: string;
  img: string;
  slug: string;
}
interface Props {
  variants: VariantInfoType[];
  slug: string;
  setVariantImages: Dispatch<SetStateAction<ProductVariantImage[]>>;
  setActiveImage: Dispatch<
    SetStateAction<{
      url: string;
    } | null>
  >;
}
const ProductVariantSelector = ({
  slug,
  variants,
  setVariantImages,
  setActiveImage,
}: Props) => {
  //   const handleSelectVariant = (variant: Variant) => {};
  return (
    <div className="flex items-center flex-wrap gap-2">
      {variants.map((variant, i) => (
        <Link
          href={variant.variantUrl}
          //   onClick={() => handleSelectVariant(variant)}
          key={i}
          onMouseEnter={() => {
            setVariantImages(variant.images);
            setActiveImage(variant.images[0]);
          }}
          onMouseLeave={() => {
            setVariantImages([]);
            setActiveImage(null);
            // setActiveImage(activeVariant?.images[0] || null);
          }}
        >
          <div
            className={cn(
              "w-12 h-12 max-h-12 rounded-full grid place-items-center overflow-hidden outline-[1px] outline-transparent outline-dashed outline-offset-2 cursor-pointer transition-all hover:border-main-primary duration-75 ease-in",
              {
                "outline-main-primary": slug
                  ? slug === variant.variantSlug
                  : i == 0,
              }
            )}
          >
            <Image
              src={variant.variantImage}
              alt={`product variant `}
              width={60}
              height={60}
              className="w-12 h-12 rounded-full object-cover object-center"
            />
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ProductVariantSelector;
