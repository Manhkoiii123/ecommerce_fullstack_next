"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const createPayPalPayment = async (orderId: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    const order = await db.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) throw new Error("Order not found.");

    const response = await fetch(
      "https://api.sandbox.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
          ).toString("base64")}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: order.total.toFixed(2).toString(),
              },
            },
          ],
        }),
      }
    );
    const paymentData = await response.json();
    return paymentData;
  } catch (error) {
    throw error;
  }
};

export const capturePayPalPayment = async (
  orderId: string,
  paymentId: string
) => {
  const user = await currentUser();

  if (!user) throw new Error("Unauthenticated.");

  const captureResponse = await fetch(
    `https://api.sandbox.paypal.com/v2/checkout/orders/${paymentId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
        ).toString("base64")}`,
      },
    }
  );

  const captureData = await captureResponse.json();

  if (captureData.status !== "COMPLETED") {
    return await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus: "Failed",
      },
    });
  }

  const newPaymentDetails = await db.paymentDetails.upsert({
    where: {
      orderId,
    },
    update: {
      paymentInetntId: paymentId,
      status:
        captureData.status === "COMPLETED" ? "Completed" : captureData.status,
      amount: Number(
        captureData.purchase_units[0].payments.captures[0].amount.value
      ),
      currency:
        captureData.purchase_units[0].payments.captures[0].amount.currency_code,
      paymentMethod: "Paypal",
      userId: user.id,
    },
    create: {
      paymentInetntId: paymentId,
      status:
        captureData.status === "COMPLETED" ? "Completed" : captureData.status,
      amount: Number(
        captureData.purchase_units[0].payments.captures[0].amount.value
      ),
      currency:
        captureData.purchase_units[0].payments.captures[0].amount.currency_code,
      paymentMethod: "Paypal",
      orderId: orderId,
      userId: user.id,
    },
  });

  const updatedOrder = await db.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentStatus: captureData.status === "COMPLETED" ? "Paid" : "Failed",
      paymentMethod: "Paypal",
      paymentDetails: {
        connect: {
          id: newPaymentDetails.id,
        },
      },
    },
    include: {
      paymentDetails: true,
    },
  });

  return updatedOrder;
};
