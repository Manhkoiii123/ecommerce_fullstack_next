/* eslint-disable react-hooks/exhaustive-deps */
import { useCartStore } from "@/cart-store/useCartStore";
import { CartProductType, Country } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Trash,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
interface Props {
  product: CartProductType;
  selectedItems: CartProductType[];
  setSelectedItems: Dispatch<SetStateAction<CartProductType[]>>;
  setTotalShipping: Dispatch<SetStateAction<number>>;
  userCountry: Country;
}
const CartProduct: FC<Props> = ({
  product,
  selectedItems,
  setSelectedItems,
  setTotalShipping,
  userCountry,
}) => {
  const {
    productId,
    variantId,
    productSlug,
    variantSlug,
    name,
    variantName,
    sizeId,
    image,
    price,
    quantity,
    stock,
    size,
    weight,
    shippingMethod,
    shippingService,
    shippingFee,
    extraShippingFee,
  } = product;
  const totalPrice = price * quantity;

  const prevShippingFeeRef = useRef(shippingFee);
  const prevCountryRef = useRef(userCountry);
  const unique_id = `${productId}-${variantId}-${sizeId}`;
  const [shippingInfo, setShippingInfo] = useState({
    initialFee: 0,
    extraFee: 0,
    totalFee: 0,
    method: shippingMethod,
    weight: weight,
    shippingService: shippingService,
  });
  const selected = selectedItems.find(
    (p) => unique_id === `${p.productId}-${p.variantId}-${p.sizeId}`
  );

  const { updateProductQuantity, removeFromCart } = useCartStore(
    (state) => state
  );
  const calculateShipping = (newQty?: number) => {
    let initialFee = 0;
    let extraFee = 0;
    let totalFee = 0;

    const quantityToUse = newQty !== undefined ? newQty : quantity;

    if (shippingMethod === "ITEM") {
      initialFee = shippingFee;
      extraFee = quantityToUse > 1 ? extraShippingFee * (quantityToUse - 1) : 0;
      totalFee = initialFee + extraFee;
    } else if (shippingMethod === "WEIGHT") {
      totalFee = shippingFee * weight * quantityToUse;
    } else if (shippingMethod === "FIXED") {
      totalFee = shippingFee;
    }
    if (stock > 0) {
      setTotalShipping((prev) => prev - shippingInfo.totalFee + totalFee);
    }

    setShippingInfo({
      initialFee,
      extraFee,
      totalFee,
      method: shippingMethod,
      weight,
      shippingService,
    });
  };

  // calc Lại phí khi đổi country
  useEffect(() => {
    if (
      shippingFee !== prevShippingFeeRef.current ||
      userCountry !== prevCountryRef.current
    ) {
      calculateShipping();
      // update ref
    }
     prevCountryRef.current = userCountry;
     prevShippingFeeRef.current = shippingFee;
     if (!shippingInfo.totalFee) {
       calculateShipping();
     }
  }, [
    quantity,
    shippingFee,
    extraShippingFee,
    shippingInfo.totalFee,
    userCountry,
  ]);

  const handleSelectProduct = () => {
    setSelectedItems((prev) => {
      const exists = prev.some(
        (item) =>
          item.productId === product.productId &&
          item.variantId === product.variantId &&
          item.sizeId === product.sizeId
      );
      return exists
        ? prev.filter((item) => item !== product)
        : [...prev, product];
    });
  };

  const updateProductQuantityHandler = (type: "add" | "remove") => {
    if (type === "add" && quantity < stock) {
      updateProductQuantity(product, quantity + 1);
      calculateShipping(quantity + 1);
    } else if (type === "remove" && quantity > 1) {
      updateProductQuantity(product, quantity - 1);
      calculateShipping(quantity - 1);
    }
  };
  return (
    <div
      className={cn("bg-white px-6 border-t bordet-t-[#ebebeb] select-none", {
        "bg-red-100": stock === 0,
      })}
    >
      <div className="py-4">
        <div className="relative flex self-start">
          {/* Image */}
          <div className="flex items-center">
            {stock > 0 && (
              <label
                htmlFor={unique_id}
                className="p-0 text-gray-900 text-sm leading-6 inline-flex items-center mr-2 cursor-pointer align-middle"
              >
                <span className="leading-8 inline-flex p-0.5 cursor-pointer ">
                  <span
                    className={cn(
                      "leading-8 w-5 h-5 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-orange-background",
                      {
                        "border-orange-background": selected,
                      }
                    )}
                  >
                    {selected && (
                      <span className="bg-orange-background  w-5 h-5 rounded-full flex items-center justify-center">
                        <Check className="w-3.5 text-white mt-0.5" />
                      </span>
                    )}
                  </span>
                </span>
                <input
                  type="checkbox"
                  id={unique_id}
                  hidden
                  onChange={() => handleSelectProduct()}
                />
              </label>
            )}
            <Link href={`/product/${productSlug}?variant=${variantSlug}`}>
              <div className="m-0 mr-4 ml-2 w-28 h-28 bg-gray-200 relative rounded-lg">
                <Image
                  src={image}
                  alt={name}
                  height={200}
                  width={200}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            </Link>
          </div>
          {/* Info */}
          <div className="w-0 min-w-0 flex-1">
            {/* Title - Actions */}
            <div className="w-[calc(100%-48px)] flex items-start overflow-hidden whitespace-nowrap">
              <Link
                href={`/product/${productSlug}?variant=${variantSlug}`}
                className="inline-block overflow-hidden text-sm whitespace-nowrap overflow-ellipsis"
              >
                {name} · {variantName}
              </Link>
              <div className="absolute top-0 right-0">
                <span
                  className="mr-2.5 cursor-pointer inline-block"
                  // onClick={() => handleaddToWishlist()}
                >
                  <Heart className="w-4 hover:stroke-orange-seconadry" />
                </span>
                <span
                  className="cursor-pointer inline-block"
                  onClick={() => removeFromCart(product)}
                >
                  <Trash className="w-4 hover:stroke-orange-seconadry" />
                </span>
              </div>
            </div>
            {/* Style - size */}
            <div className="my-1">
              <button className="text-main-primary relative h-[24px] bg-gray-100 whitespace-normal px-2.5 py-0 max-w-full text-xs leading-4 rounded-xl font-bold cursor-pointer  outline-0">
                <span className="flex items-center justify-between flex-wrap">
                  <div className="text-left inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-[95%]">
                    {size}
                  </div>
                  <span className="ml-0.5">
                    <ChevronRight className="w-3" />
                  </span>
                </span>
              </button>
            </div>
            {/* Price - Delivery */}
            <div className="flex flex-col gap-y-2 sm:flex-row sm:items-center sm:justify-between mt-2 relative">
              {stock > 0 ? (
                <div>
                  <span className="inline-block break-all">
                    ${price.toFixed(2)} x {quantity} = ${totalPrice.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="inline-block break-all text-sm text-red-500">
                    Out of stock
                  </span>
                </div>
              )}
              <div className="text-xs">
                <div className="text-gray-900 text-sm leading-6 list-none inline-flex items-center">
                  <div
                    className="w-6 h-6 text-xs bg-gray-100 hover:bg-gray-200 leading-6 grid place-items-center rounded-full cursor-pointer"
                    onClick={() => updateProductQuantityHandler("remove")}
                  >
                    <Minus className="w-3 stroke-[#555]" />
                  </div>
                  <input
                    type="text"
                    value={quantity}
                    min={1}
                    max={stock}
                    className="m-1 h-6 w-[32px] bg-transparent border-none leading-6 tracking-normal text-center outline-none text-gray-900 font-bold"
                  />
                  <div
                    className="w-6 h-6 text-xs bg-gray-100 hover:bg-gray-200 leading-6 grid place-items-center rounded-full cursor-pointer"
                    onClick={() => updateProductQuantityHandler("add")}
                  >
                    <Plus className="w-3 stroke-[#555]" />
                  </div>
                </div>
              </div>
            </div>
            {stock > 0 && (
              <div className="mt-1 text-xs text-[#999] cursor-pointer">
                <div className="flex items-center mb-1">
                  <span>
                    <Truck className="w-4 inline-block text-[#01A971]" />
                    {shippingInfo.totalFee > 0 ? (
                      <span className="text-[#01A971] ml-1">
                        {shippingMethod === "ITEM" ? (
                          <>
                            ${shippingInfo.initialFee} (first item)
                            {quantity > 1
                              ? `+ 
                              ${quantity - 1} item(s) x $${extraShippingFee} 
                              (additional items)`
                              : " x 1"}
                            = ${shippingInfo.totalFee.toFixed(2)}
                          </>
                        ) : shippingMethod === "WEIGHT" ? (
                          <>
                            ${shippingFee} x {shippingInfo.weight}kg x&nbsp;
                            {quantity} {quantity > 1 ? "items" : "item"} = $
                            {shippingInfo.totalFee.toFixed(2)}
                          </>
                        ) : (
                          <>Fixed Fee : ${shippingInfo.totalFee.toFixed(2)}</>
                        )}
                      </span>
                    ) : (
                      <span className="text-[#01A971] ml-1">Free Delivery</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartProduct;
