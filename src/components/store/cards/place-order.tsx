import FastDelivery from "@/components/store/cards/fast-delivery";
import { SecurityPrivacyCard } from "@/components/store/product-page/returns-security-privacy-card";
import { Button } from "@/components/store/ui/button";
import { cn } from "@/lib/utils";
import { ShippingAddress } from "@prisma/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PulseLoader } from "react-spinners";
import { emptyUserCart, placeOrder } from "@/queries/user";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/cart-store/useCartStore";
import ApplyCouponForm from "@/components/store/forms/apply-coupon";
import { CartWithCartItemsType } from "@/lib/types";
interface Props {
  shippingFees: number;
  subTotal: number;
  total: number;
  shippingAddress: ShippingAddress | null;
  cardId: string;
  setCartData: React.Dispatch<React.SetStateAction<CartWithCartItemsType>>;
  cartData: CartWithCartItemsType;
}
const PlaceOrderCard: React.FC<Props> = ({
  cardId,
  shippingAddress,
  shippingFees,
  subTotal,
  total,
  setCartData,
  cartData,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [flashSaleSubtotal, setFlashSaleSubtotal] = useState<number>(subTotal);
  const [originalSubtotal, setOriginalSubtotal] = useState<number>(subTotal);
  const { push } = useRouter();
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  // Since updateCheckoutProductstWithLatest already applies flash sale to item.price,
  // we need to calculate original prices (without flash sale) for comparison
  useEffect(() => {
    const calculateOriginalPrices = async () => {
      try {
        const productIds = cartData.cartItems.map((item) => item.productId);

        if (productIds.length === 0) {
          setFlashSaleSubtotal(subTotal);
          setOriginalSubtotal(subTotal);
          return;
        }

        const response = await fetch("/api/flash-sale-cart-prices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productIds }),
        });

        if (response.ok) {
          const { flashSalePrices } = await response.json();

          let originalTotal = 0;

          for (const item of cartData.cartItems) {
            const flashSaleData = flashSalePrices.find(
              (fp: any) => fp.productId === item.productId
            );

            if (flashSaleData?.discount) {
              // Calculate original price by reversing the flash sale discount
              const discount = flashSaleData.discount;
              let originalPrice = item.price;

              if (discount.discountType === "PERCENTAGE") {
                const customDiscount =
                  discount.customDiscountValue || discount.discountValue;
                // Reverse: originalPrice = finalPrice / (1 - discount/100)
                originalPrice = item.price / (1 - customDiscount / 100);
              } else {
                const customDiscount =
                  discount.customDiscountValue || discount.discountValue;
                // Reverse: originalPrice = finalPrice + discount
                originalPrice = item.price + customDiscount;
              }

              originalTotal += originalPrice * item.quantity;
            } else {
              // No flash sale, use current price
              originalTotal += item.price * item.quantity;
            }
          }

          setFlashSaleSubtotal(subTotal);
          setOriginalSubtotal(originalTotal);
        } else {
          // Fallback to current prices if API fails
          setFlashSaleSubtotal(subTotal);
          setOriginalSubtotal(subTotal);
        }
      } catch (error) {
        console.error("Error calculating original prices:", error);
        // Fallback to current prices if calculation fails
        setFlashSaleSubtotal(subTotal);
        setOriginalSubtotal(subTotal);
      }
    };

    calculateOriginalPrices();
  }, [cartData.cartItems, subTotal]);

  const handlePlaceOrder = async () => {
    setLoading(true);
    if (!shippingAddress) {
      toast.error("Select a shipping address first !");
    } else {
      const order = await placeOrder(shippingAddress, cardId);
      if (order) {
        await fetch("/api/socket/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "NEW_ORDER",
            orderId: order.orderId,
            userId: order.userId,
          }),
        });

        // Xóa những sản phẩm đã đặt hàng khỏi localStorage cart
        // Sử dụng removeFromCart cho từng item dựa trên productId, variantId, sizeId
        cartData.cartItems.forEach((item) => {
          // Tìm item tương ứng trong localStorage cart và xóa
          const cartStore = useCartStore.getState();
          const itemToRemove = cartStore.cart.find(
            (cartItem) =>
              cartItem.productId === item.productId &&
              cartItem.variantId === item.variantId &&
              cartItem.sizeId === item.sizeId
          );
          if (itemToRemove) {
            removeFromCart(itemToRemove);
          }
        });
        // Xóa cart trong database (vì database chỉ lưu những sản phẩm đã chọn)
        await emptyUserCart();
        push(`/order/${order.orderId}`);
      }
    }
    setLoading(false);
  };
  let discountedAmount = 0;
  const applicableStoreItems = cartData.cartItems.filter(
    (item) => item.storeId === cartData.coupon?.storeId
  );

  const storeSubTotal = applicableStoreItems.reduce(
    (acc, item) => acc + item.price * item.quantity + item.shippingFee,
    0
  );

  if (cartData.coupon) {
    discountedAmount = (storeSubTotal * cartData.coupon.discount) / 100;
  }

  return (
    <div className="sticky top-4 mt-3 ml-5 w-[380px] max-h-max">
      <div className="relative py-4 px-6 bg-white">
        <h1 className="text-gray-900 text-2xl font-bold mb-4">Summary</h1>
        <Info
          title="Subtotal"
          text={`${flashSaleSubtotal.toFixed(2)}`}
          originalText={
            flashSaleSubtotal !== originalSubtotal
              ? `$${originalSubtotal.toFixed(2)}`
              : undefined
          }
        />
        <Info title="Shipping Fees" text={`+${shippingFees.toFixed(2)}`} />
        <Info title="Taxes" text="+0.00" />
        {cartData.coupon && (
          <Info
            title={`Coupon (${cartData.coupon.code}) (-${cartData.coupon.discount}%)`}
            text={`-$${discountedAmount.toFixed(2)}`}
          />
        )}{" "}
        <Info
          title="Total"
          text={`+${(flashSaleSubtotal + shippingFees).toFixed(2)}`}
          isBold
          noBorder
        />
        {/* Flash Sale Notice */}
        {flashSaleSubtotal !== originalSubtotal && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Flash Sale Active!</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              You&apos;re saving $
              {(originalSubtotal - flashSaleSubtotal).toFixed(2)} on your order!
            </p>
          </div>
        )}
      </div>
      <div className="mt-2">
        {cartData.coupon ? (
          <div className="flex bg-white pb-2">
            <svg width={16} height={96} xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 8 0 
         Q 4 4.8, 8 9.6 
         T 8 19.2 
         Q 4 24, 8 28.8 
         T 8 38.4 
         Q 4 43.2, 8 48 
         T 8 57.6 
         Q 4 62.4, 8 67.2 
         T 8 76.8 
         Q 4 81.6, 8 86.4 
         T 8 96 
         L 0 96 
         L 0 0 
         Z"
                fill="#66cdaa"
                stroke="#66cdaa"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
            <div className="mx-2 5 overflow-hidden w-full">
              <p className="mt-1.5 text-xl font-bold text-[#66cdaa] leading-8 mr-3 overflow-hidden text-ellipsis whitespace-nowrap">
                Coupon applied !
              </p>
              <p className="overflow-hidden leading-5 break-all text-zinc-400 max-h-10">
                ({cartData.coupon.code}) ({cartData.coupon.discount}%) discount
              </p>
              <p className="overflow-hidden text-sm leading-5 break-words text-zinc-400">
                Coupon applied only to items from {cartData.coupon.store.name}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white">
            <ApplyCouponForm cartId={cardId} setCartData={setCartData} />
          </div>
        )}
      </div>
      {/* Order Summary */}
      <div className="bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Order Summary</h2>

        <Info
          title="Subtotal"
          text={`$${flashSaleSubtotal.toFixed(2)}`}
          originalText={
            flashSaleSubtotal !== originalSubtotal
              ? `$${originalSubtotal.toFixed(2)}`
              : undefined
          }
        />

        <Info title="Shipping Fees" text={`$${shippingFees.toFixed(2)}`} />

        <Info
          title="Total"
          text={`$${(flashSaleSubtotal + shippingFees).toFixed(2)}`}
          isBold
          noBorder
        />

        {flashSaleSubtotal !== originalSubtotal && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Flash Sale Active!</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              You&apos;re saving $
              {(originalSubtotal - flashSaleSubtotal).toFixed(2)} on your order!
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-4">
        <Button onClick={() => handlePlaceOrder()}>
          {loading ? (
            <PulseLoader size={5} color="#fff" />
          ) : (
            <span>Place order</span>
          )}
        </Button>
      </div>
      <div className="mt-2 p-4 bg-white px-6">
        <FastDelivery />
      </div>
      <div className="mt-2 p-4 bg-white px-6">
        <SecurityPrivacyCard />
      </div>
    </div>
  );
};
export default PlaceOrderCard;

const Info = ({
  title,
  text,
  originalText,
  isBold,
  noBorder,
}: {
  title: string;
  text: string;
  originalText?: string;
  isBold?: boolean;
  noBorder?: boolean;
}) => {
  return (
    <div
      className={cn(
        "mt-2 font-medium flex items-center text-[#222] text-sm pb-1 border-b",
        {
          "font-bold": isBold,
          "border-b-0": noBorder,
        }
      )}
    >
      <h2 className="overflow-hidden whitespace-nowrap text-ellipsis break-normal">
        {title}
      </h2>
      <h3 className="flex-1 w-0 min-w-0 text-right">
        <div className="px-0.5 text-black">
          <span className="text-black text-lg inline-block break-all">
            {text}
          </span>
          {originalText && (
            <div className="text-sm text-gray-500 line-through">
              {originalText}
            </div>
          )}
        </div>
      </h3>
    </div>
  );
};

//  khi check => change quantity => lỗi => tính summary
