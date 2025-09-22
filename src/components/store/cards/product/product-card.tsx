"use client";
import ProductCardImageSwiper from "@/components/store/cards/product/swiper";
import VariantSwitcher from "@/components/store/cards/product/variant-switcher";
import FlashSalePrice from "@/components/store/shared/flash-sale-price";
import { Button } from "@/components/store/ui/button";
import { ProductType, VariantSimplified } from "@/lib/types";
import { cn } from "@/lib/utils";
import { addToWishlist } from "@/queries/user";
import { Heart } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import ReactStars from "react-rating-stars-component";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
const ProductCard = ({ product }: { product: ProductType }) => {
  const { name, slug, rating, sales, variantImages, variants, id } = product;
  const [variant, setVariant] = useState<VariantSimplified>(variants[0]);
  const { variantSlug, variantName, images, sizes } = variant;
  const router = useRouter();
  const { userId } = useAuth();
  const requireLogin = () => {
    if (!userId) {
      router.push("/sign-in");
      return false;
    }
    return true;
  };
  const handleaddToWishlist = async () => {
    try {
      if (!requireLogin()) return;
      const res = await addToWishlist(id, variant.variantId);
      if (res) toast.success("Product successfully added to wishlist.");
    } catch (error: any) {
      toast.error(error.toString());
    }
  };
  const goToProduct = () => {
    // if (!requireLogin()) return;
    router.push(`/product/${slug}?variant=${variantSlug}`);
  };
  return (
    <div>
      <div
        className={cn(
          "group w-[190px]  min-[480px]:w-[225px] relative transition-all duration-75 bg-white ease-in-out p-4 rounded-t-3xl border border-transparent hover:shadow-xl hover:border-border",
          {
            "": true,
          }
        )}
      >
        <div className="relative w-full h-full">
          <button
            onClick={goToProduct}
            className="w-full relative inline-block overflow-hidden text-left"
          >
            <ProductCardImageSwiper images={images} />
            <div className="text-sm text-main-primary h-[18px] overflow-hidden overflow-ellipsis line-clamp-1">
              {name} · {variantName}
            </div>
            {/* Rating - Sales */}
            {/* {product.rating > 0 && product.sales > 0 && ( */}
            <div className="flex items-center gap-x-1 h-5">
              <ReactStars
                count={5}
                size={24}
                color="#F5F5F5"
                activeColor="#FFD804"
                value={rating}
                isHalf
                edit={false}
              />
              <div className="text-xs text-main-secondary">{sales} sold</div>
            </div>
            {/* )}  */}
            {/* Price */}
            <FlashSalePrice productId={id} sizes={sizes} isCard />
          </button>
        </div>
        <div className="hidden  group-hover:block absolute -left-[1px] bg-white border border-t-0  w-[calc(100%+2px)] px-4 pb-4 rounded-b-3xl shadow-xl z-30 space-y-2">
          <VariantSwitcher
            images={variantImages}
            variants={variants}
            setVariant={setVariant}
            selectedVariant={variant}
          />
          <div className="flex flex-items gap-x-1">
            <Button onClick={goToProduct}>Go to product</Button>
            <Button
              variant="black"
              size="icon"
              onClick={() => handleaddToWishlist()}
            >
              <Heart className="w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
