"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { PaymentIntent } from "@stripe/stripe-js";
import Stripe from "stripe";
import { notificationService } from "@/lib/notification-service";

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

    const oldStatus = order.paymentStatus;
    const newStatus = paymentIntent.status === "succeeded" ? "Paid" : "Failed";

    const updatedOrder = await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus: newStatus,
        paymentMethod: "Stripe",
        paymentDetails: {
          connect: {
            id: updatedPaymentDetails.id,
          },
        },
      },
      include: {
        paymentDetails: true,
        groups: {
          include: {
            store: true,
          },
        },
      },
    });

    // Send notification about payment status change
    if (oldStatus !== newStatus) {
      try {
        // Get the first store from order groups for notification
        const firstStore = updatedOrder.groups[0]?.store;
        if (firstStore) {
          await notificationService.notifyPaymentStatusChanged(
            orderId,
            user.id,
            firstStore.id,
            oldStatus,
            newStatus,
            {
              amount: updatedOrder.total,
            }
          );
        }
      } catch (error) {
        console.error("Error sending payment notification:", error);
        // Don't throw error, continue with payment update
      }
    }

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};
