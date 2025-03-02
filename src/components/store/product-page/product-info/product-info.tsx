import ProductPrice from "@/components/store/product-page/product-info/product-price";
import ProductVariantSelector from "@/components/store/product-page/product-info/variant-selector";
import ColorWheel from "@/components/store/shared/color-wheel";
import Countdown from "@/components/store/shared/countdown";
import { ProductPageDataType } from "@/lib/types";
import { CopyIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import ReactStars from "react-rating-stars-component";
interface ProductInfoProps {
  productData: ProductPageDataType;
  quantity?: number;
  sizeId: string | undefined;
}
const ProductInfo = ({ productData, quantity, sizeId }: ProductInfoProps) => {
  if (!productData) return null;
  const {
    productId,
    name,
    sku,
    colors,
    variantImages,
    sizes,
    isSale,
    saleEndDate,
    variantName,
    store,
    rating,
    numReviews,
  } = productData;
  const copySkuToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sku);
      toast.success("Copied successfully");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };
  return (
    <div className="relative w-full xl:w-[540px]">
      <div>
        <h1 className="text-main-primary inline font-bold leading-5">
          {name} · {variantName}
        </h1>
      </div>
      <div className="flex items-center text-xs mt-2">
        <Link href={`/store/${store.url}`} className="mr-2 hover:underline">
          <div className="w-full flex items-center gap-x-1">
            <Image
              src={store.logo}
              alt={store.name}
              width={100}
              height={100}
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        </Link>
        <div className="whitespace-nowrap">
          <span className="flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap text-gray-500">
            SKU: {sku}
          </span>
          <span
            className="inline-block align-middle text-[#2F68A8] mx-1 cursor-pointer"
            onClick={copySkuToClipboard}
          >
            <CopyIcon />
          </span>
        </div>
        <div className="md:ml-4 flex items-center gap-x-2 flex-1 whitespace-nowrap">
          <ReactStars
            count={5}
            size={24}
            color="#F5F5F5"
            activeColor="#FFD804"
            value={rating}
            isHalf
            edit={false}
          />
          <Link href="#reviews" className="text-[#ffd804] hover:underline">
            (
            {numReviews === 0
              ? "No review yet"
              : numReviews === 1
              ? "1 review"
              : `${numReviews} reviews`}
            )
          </Link>
        </div>
      </div>
      <div className="my-2 relative flex flex-col sm:flex-row justify-between">
        <ProductPrice sizes={sizes} sizeId={sizeId} />
        {isSale && saleEndDate && (
          <div className="mt-4 pb-2">
            <Countdown targetDate={saleEndDate} />
          </div>
        )}
      </div>
      <div className="mt-4 space-y-2">
        <div className="relative flex items-center justify-between text-main-primary font-bold">
          <span className="flex items-center gap-x-2">
            {colors.length > 1 ? "Colors" : "Color"}
            <ColorWheel colors={colors} size={25} />
          </span>
        </div>
        <div className="mt-4">
          {variantImages.length > 0 && (
            <ProductVariantSelector
              variants={variantImages}
              slug={productData.variantSlug}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
