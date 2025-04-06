"use client";

import PaypalPayment from "@/components/store/cards/payment/paypal/paypal-payment";
import PaypalWrapper from "@/components/store/cards/payment/paypal/paypal-wrapper";
import StripePayment from "@/components/store/cards/payment/stripe/stripe-payment";
import StripeWrapper from "@/components/store/cards/payment/stripe/stripe-wrapper";
import { FC } from "react";

interface Props {
  orderId: string;
  amount: number;
}

const OrderPayment: FC<Props> = ({ amount, orderId }) => {
  return (
    <div className="w-full h-full  space-y-5">
      {/* Paypal */}
      <div className="mt-6">
        <PaypalWrapper>
          <PaypalPayment orderId={orderId} />
        </PaypalWrapper>
      </div>
      {/* Stripe */}
      <StripeWrapper amount={amount}>
        <StripePayment orderId={orderId} />
      </StripeWrapper>
    </div>
  );
};

export default OrderPayment;
