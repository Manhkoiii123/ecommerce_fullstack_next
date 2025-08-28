import { db } from "@/lib/db";

export async function canUserReviewProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    // Check if user has any orders with this product that are:
    // 1. Paid (paymentStatus = 'Paid')
    // 2. Shipped or delivered (orderStatus = 'Shipped' or 'Delivered')
    // 3. Product status is 'Shipped' or 'Delivered'

    const orderWithProduct = await db.order.findFirst({
      where: {
        userId,
        paymentStatus: "Paid",
        groups: {
          some: {
            items: {
              some: {
                productId,
                status: {
                  in: ["Shipped", "Delivered"],
                },
              },
            },
          },
        },
      },
      include: {
        groups: {
          include: {
            items: {
              where: {
                productId,
                status: {
                  in: ["Shipped", "Delivered"],
                },
              },
            },
          },
        },
      },
    });

    return !!orderWithProduct;
  } catch (error) {
    console.error("Error checking review permission:", error);
    return false;
  }
}

export async function getUserReviewableProducts(
  userId: string
): Promise<string[]> {
  try {
    const orders = await db.order.findMany({
      where: {
        userId,
        paymentStatus: "Paid",
        orderStatus: {
          in: ["Shipped", "Delivered"],
        },
      },
      include: {
        groups: {
          include: {
            items: {
              where: {
                status: {
                  in: ["Shipped", "Delivered"],
                },
              },
            },
          },
        },
      },
    });

    const productIds = new Set<string>();

    orders.forEach((order) => {
      order.groups.forEach((group) => {
        group.items.forEach((item) => {
          productIds.add(item.productId);
        });
      });
    });

    return Array.from(productIds);
  } catch (error) {
    console.error("Error getting reviewable products:", error);
    return [];
  }
}
