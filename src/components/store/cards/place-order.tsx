import FastDelivery from "@/components/store/cards/fast-delivery";
import { SecurityPrivacyCard } from "@/components/store/product-page/returns-security-privacy-card";
import { Button } from "@/components/store/ui/button";
import { cn } from "@/lib/utils";
import { ShippingAddress } from "@prisma/client";
import { useState } from "react";
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
  const { push } = useRouter();
  const emptyCart = useCartStore((state) => state.emptyCart);
  const handlePlaceOrder = async () => {
    setLoading(true);
    if (!shippingAddress) {
      toast.error("Select a shipping address first !");
    } else {
      const order = await placeOrder(shippingAddress, cardId);
      if (order) {
        emptyCart();
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
        <Info title="Subtotal" text={`${subTotal.toFixed(2)}`} />
        <Info title="Shipping Fees" text={`+${shippingFees.toFixed(2)}`} />
        <Info title="Taxes" text="+0.00" />
        {cartData.coupon && (
          <Info
            title={`Coupon (${cartData.coupon.code}) (-${cartData.coupon.discount}%)`}
            text={`-$${discountedAmount.toFixed(2)}`}
          />
        )}{" "}
        <Info title="Total" text={`+${total.toFixed(2)}`} isBold noBorder />
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
  isBold,
  noBorder,
}: {
  title: string;
  text: string;
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
        </div>
      </h3>
    </div>
  );
};
