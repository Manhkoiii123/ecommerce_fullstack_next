"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { PaymentIntent } from "@stripe/stripe-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-03-31.basil",
});

export const createStripePaymentIntent = async (orderId: string) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    const order = await db.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) throw new Error("Order not found.");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    throw error;
  }
};

export const createStripePayment = async (
  orderId: string,
  paymentIntent: PaymentIntent
) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    const order = await db.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) throw new Error("Order not found.");

    const updatedPaymentDetails = await db.paymentDetails.upsert({
      where: {
        orderId,
      },
      update: {
        paymentInetntId: paymentIntent.id,
        paymentMethod: "Stripe",
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status:
          paymentIntent.status === "succeeded"
            ? "Completed"
            : paymentIntent.status,
        userId: user.id,
      },
      create: {
        paymentInetntId: paymentIntent.id,
        paymentMethod: "Stripe",
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status:
          paymentIntent.status === "succeeded"
            ? "Completed"
            : paymentIntent.status,
        orderId: orderId,
        userId: user.id,
      },
    });

    const updatedOrder = await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus: paymentIntent.status === "succeeded" ? "Paid" : "Failed",
        paymentMethod: "Stripe",
        paymentDetails: {
          connect: {
            id: updatedPaymentDetails.id,
          },
        },
      },
      include: {
        paymentDetails: true,
      },
    });

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};
