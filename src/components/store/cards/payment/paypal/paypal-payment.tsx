"use client";
import { capturePayPalPayment, createPayPalPayment } from "@/queries/paypal";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function PaypalPayment({
  orderId,
  amount,
  userId,
}: {
  orderId: string;
  amount: number;
  userId: string;
}) {
  const router = useRouter();
  const paymentIdRef = useRef("");
  const createOrder = async (data: any, actions: any) => {
    const response = await createPayPalPayment(orderId);
    paymentIdRef.current = response.id;

    return response.id;
  };

  const onApprove = async () => {
    const captureResponse = await capturePayPalPayment(
      orderId,
      paymentIdRef.current
    );

    if (captureResponse.id) {
      await fetch("/api/socket/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PAYMENT_RECEIVED",
          orderId: orderId,
          userId,
          amount,
          paymentMethod: "PayPal",
          paymentStatus: "Paid",
        }),
      });
      router.refresh();
    }
  };
  return (
    <div>
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(err) => {}}
      />
    </div>
  );
}
