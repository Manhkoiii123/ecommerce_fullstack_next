"use client";

import PaypalPayment from "@/components/store/cards/payment/paypal/paypal-payment";
import PaypalWrapper from "@/components/store/cards/payment/paypal/paypal-wrapper";
import StripePayment from "@/components/store/cards/payment/stripe/stripe-payment";
import StripeWrapper from "@/components/store/cards/payment/stripe/stripe-wrapper";
import { FC } from "react";

interface Props {
  orderId: string;
  userId: string;
  amount: number;
}

const OrderPayment: FC<Props> = ({ amount, orderId, userId }) => {
  return (
    <>
      {amount !== 0 && (
        <div className="w-full h-full  space-y-5">
          {/* Paypal */}
          <div className="mt-6">
            <PaypalWrapper>
              <PaypalPayment
                orderId={orderId}
                amount={amount}
                userId={userId}
              />
            </PaypalWrapper>
          </div>
          {/* Stripe */}
          <StripeWrapper amount={amount}>
            <StripePayment orderId={orderId} amount={amount} userId={userId} />
          </StripeWrapper>
        </div>
      )}
    </>
  );
};

export default OrderPayment;
