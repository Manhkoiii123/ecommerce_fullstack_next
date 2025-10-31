import { CartProductType } from "@/lib/types";
import { saveUserCart } from "@/queries/user";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { PulseLoader } from "react-spinners";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface Props {
  selectedItems: CartProductType[];
  shippingFees: number;
}

const CartSummary: FC<Props> = ({ selectedItems, shippingFees }) => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [flashSaleSubtotal, setFlashSaleSubtotal] = useState<number>(0);
  const [originalSubtotal, setOriginalSubtotal] = useState<number>(0);

  // Calculate subtotal with flash sale discounts
  useEffect(() => {
    const calculateFlashSaleSubtotal = async () => {
      try {
        const productIds = selectedItems.map((item) => item.productId);

        if (productIds.length === 0) {
          setFlashSaleSubtotal(0);
          setOriginalSubtotal(0);
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

          let total = 0;
          let originalTotal = 0;

          for (const item of selectedItems) {
            const flashSaleData = flashSalePrices.find(
              (fp: any) => fp.productId === item.productId
            );

            let finalPrice = item.price;

            if (flashSaleData?.discount) {
              const discount = flashSaleData.discount;

              if (discount.discountType === "PERCENTAGE") {
                const customDiscount =
                  discount.customDiscountValue || discount.discountValue;
                finalPrice = item.price * (1 - customDiscount / 100);

                // Apply max discount limit if exists
                if (discount.maxDiscount) {
                  const maxDiscountAmount =
                    (item.price * discount.maxDiscount) / 100;
                  const currentDiscount = item.price - finalPrice;
                  if (currentDiscount > maxDiscountAmount) {
                    finalPrice = item.price - maxDiscountAmount;
                  }
                }
              } else {
                const customDiscount =
                  discount.customDiscountValue || discount.discountValue;
                finalPrice = Math.max(item.price - customDiscount, 0);
              }
            }

            total += finalPrice * item.quantity;
            originalTotal += item.price * item.quantity;
          }

          setFlashSaleSubtotal(total);
          setOriginalSubtotal(originalTotal);
        } else {
          // Fallback to original prices if API fails
          const total = selectedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
          setFlashSaleSubtotal(total);
          setOriginalSubtotal(total);
        }
      } catch (error) {
        console.error("Error calculating flash sale subtotal:", error);
        // Fallback to original prices if API fails
        const total = selectedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        setFlashSaleSubtotal(total);
        setOriginalSubtotal(total);
      }
    };

    calculateFlashSaleSubtotal();
  }, [selectedItems]);

  // Calculate total price including shipping fees
  const total = flashSaleSubtotal + shippingFees;

  const handleSaveCart = async () => {
    try {
      setLoading(true);
      const res = await saveUserCart(selectedItems);
      if (res) router.push("/checkout");
      setLoading(false);
    } catch (error: any) {
      toast.error(error.toString());
    }
  };
  // Nếu không có sản phẩm nào được chọn, hiển thị thông báo
  if (selectedItems.length === 0) {
    return (
      <div className="relative py-4 px-6 bg-white">
        <h1 className="text-gray-900 text-2xl font-bold mb-4">Summary</h1>
        <div className="text-center text-gray-500 py-8">
          <p>No items selected</p>
          <p className="text-sm mt-2">
            Select items from your cart to see summary
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-4 px-6 bg-white">
      <h1 className="text-gray-900 text-2xl font-bold mb-4">Summary</h1>
      <div className="mt-4 font-medium flex items-center text-[#222] text-sm pb-1 border-b">
        <h2 className="overflow-hidden whitespace-nowrap text-ellipsis break-normal">
          Subtotal
        </h2>
        <h3 className="flex-1 w-0 min-w-0 text-right">
          <span className="px-0.5 text-black">
            <div className="text-black text-lg inline-block break-all">
              ${flashSaleSubtotal.toFixed(2)}
            </div>
            {flashSaleSubtotal !== originalSubtotal && (
              <div className="text-sm text-gray-500 line-through">
                ${originalSubtotal.toFixed(2)}
              </div>
            )}
          </span>
        </h3>
      </div>
      <div className="mt-2 font-medium flex items-center text-[#222] text-sm pb-1 border-b">
        <h2 className="overflow-hidden whitespace-nowrap text-ellipsis break-normal">
          Shipping Fees
        </h2>
        <h3 className="flex-1 w-0 min-w-0 text-right">
          <span className="px-0.5 text-black">
            <div className="text-black text-lg inline-block break-all">
              +${shippingFees.toFixed(2)}
            </div>
          </span>
        </h3>
      </div>
      <div className="mt-2 font-medium flex items-center text-[#222] text-sm pb-1 border-b">
        <h2 className="overflow-hidden whitespace-nowrap text-ellipsis break-normal">
          Taxes
        </h2>
        <h3 className="flex-1 w-0 min-w-0 text-right">
          <span className="px-0.5 text-black">
            <div className="text-black text-lg inline-block break-all">
              +$0.00
            </div>
          </span>
        </h3>
      </div>
      <div className="mt-2 font-bold flex items-center text-[#222] text-sm">
        <h2 className="overflow-hidden whitespace-nowrap text-ellipsis break-normal">
          Total
        </h2>
        <h3 className="flex-1 w-0 min-w-0 text-right">
          <span className="px-0.5 text-black">
            <div className="text-black text-lg inline-block break-all">
              ${total.toFixed(2)}
            </div>
          </span>
        </h3>
      </div>
      <div className="my-2 5">
        <Button onClick={() => handleSaveCart()}>
          {loading ? (
            <PulseLoader size={5} color="#fff" />
          ) : (
            <span>Checkout ({selectedItems.length})</span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CartSummary;
