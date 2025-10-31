"use server";
import { db } from "@/lib/db";
import { CartProductType, CartWithCartItemsType } from "@/lib/types";
import { getProductFlashSaleDiscount } from "@/queries/flash-sale";
import {
  getDeliveryDetailsForStoreByCountry,
  getProductShippingFee,
  getShippingDetails,
} from "@/queries/product";
import { currentUser } from "@clerk/nextjs/server";
import {
  CartItem,
  Country as CountryDB,
  ShippingAddress,
} from "@prisma/client";
import { getCookie } from "cookies-next";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
export const followStore = async (storeId: string): Promise<boolean> => {
  try {
    //  lấy ng hiện tại
    const user = await currentUser();
    if (!user) throw new Error("Unauthenticated");
    // tìm quán
    const store = await db.store.findUnique({
      where: {
        id: storeId,
      },
    });
    if (!store) throw new Error("Store not found.");
    // lấy thông tin ng hiện tại trong db
    const userData = await db.user.findUnique({
      where: {
        id: user.id,
      },
    });
    if (!userData) throw new Error("User not found.");

    const userFollowingStore = await db.user.findFirst({
      where: {
        id: user.id,
        following: {
          some: {
            id: storeId,
          },
        },
      },
    });

    if (userFollowingStore) {
      await db.store.update({
        where: {
          id: storeId,
        },
        data: {
          followers: {
            disconnect: { id: userData.id },
          },
        },
      });
      revalidatePath(`/u/${store.url}`);
      revalidatePath(`/store/${store.url}`);

      return false;
    } else {
      await db.store.update({
        where: {
          id: storeId,
        },
        data: {
          followers: {
            connect: {
              id: userData.id,
            },
          },
        },
      });
      revalidatePath(`/u/${store.url}`);
      revalidatePath(`/store/${store.url}`);

      return true;
    }
  } catch (error) {
    throw error;
  }
};
export const saveUserCart = async (
  cartProducts: CartProductType[]
): Promise<boolean> => {
  console.log("🚀 ~ saveUserCart ~ cartProducts:", cartProducts);
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated");
  const userId = user.id;

  const userCart = await db.cart.findFirst({
    where: { userId },
  });

  // Delete any existing user cart
  if (userCart) {
    await db.cart.delete({
      where: {
        userId,
      },
    });
  }
  const validatedCartItems = await Promise.all(
    cartProducts.map(async (cartProduct) => {
      const { productId, variantId, sizeId, quantity } = cartProduct;

      // Fetch the product, variant, and size from the database
      const product = await db.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          store: true,
          freeShipping: {
            include: {
              eligibaleCountries: true,
            },
          },
          variants: {
            where: {
              id: variantId,
            },
            include: {
              sizes: {
                where: {
                  id: sizeId,
                },
              },
              images: true,
            },
          },
        },
      });

      if (
        !product ||
        product.variants.length === 0 ||
        product.variants[0].sizes.length === 0
      ) {
        throw new Error(
          `Invalid product, variant, or size combination for productId ${productId}, variantId ${variantId}, sizeId ${sizeId}`
        );
      }

      const variant = product.variants[0];
      const size = variant.sizes[0];

      // Validate stock and price
      const validQuantity = Math.min(quantity, size.quantity);

      const price = size.discount
        ? size.price - size.price * (size.discount / 100)
        : size.price;

      // Calculate Shipping details
      const countryCookie = await getCookie("userCountry", { cookies });

      let details = {
        shippingFee: 0,
        extraShippingFee: 0,
        isFreeShipping: false,
      };

      if (countryCookie) {
        const country = JSON.parse(countryCookie);
        const temp_details = await getShippingDetails(
          product.shippingFeeMethod,
          country,
          product.store,
          product.freeShipping,
          product.freeShippingForAllCountries
        );
        if (typeof temp_details !== "boolean") {
          details = temp_details;
        }
      }
      let shippingFee = 0;
      const { shippingFeeMethod } = product;
      if (shippingFeeMethod === "ITEM") {
        shippingFee =
          quantity === 1
            ? details.shippingFee
            : details.shippingFee + details.extraShippingFee * (quantity - 1);
      } else if (shippingFeeMethod === "WEIGHT") {
        shippingFee = details.shippingFee * variant.weight * quantity;
      } else if (shippingFeeMethod === "FIXED") {
        shippingFee = details.shippingFee;
      }

      const totalPrice = price * validQuantity + shippingFee;
      return {
        productId,
        variantId,
        productSlug: product.slug,
        variantSlug: variant.slug,
        sizeId,
        storeId: product.storeId,
        sku: variant.sku,
        name: `${product.name} · ${variant.variantName}`,
        image: variant.images[0].url,
        size: size.size,
        quantity: validQuantity,
        price,
        shippingFee,
        totalPrice,
      };
    })
  );
  console.log("🚀 ~ saveUserCart ~ validatedCartItems:", validatedCartItems);

  const subTotal = validatedCartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shippingFees = validatedCartItems.reduce(
    (acc, item) => acc + item.shippingFee,
    0
  );
  const total = subTotal + shippingFees;
  console.log("🚀 ~ saveUserCart ~ total:", total);
  const cart = await db.cart.create({
    data: {
      cartItems: {
        create: validatedCartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          sizeId: item.sizeId,
          storeId: item.storeId,
          sku: item.sku,
          productSlug: item.productSlug,
          variantSlug: item.variantSlug,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          size: item.size,
          price: item.price,
          shippingFee: item.shippingFee,
          totalPrice: item.totalPrice,
        })),
      },
      shippingFees,
      subTotal,
      total,
      userId,
    },
  });
  console.log("🚀 ~ saveUserCart ~ cart:", cart);
  if (cart) return true;
  return false;
};

export const getUserShippingAddresses = async () => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    const shippingAddresses = await db.shippingAddress.findMany({
      where: {
        userId: user.id,
      },
      include: {
        country: true,
        user: true,
      },
    });

    return shippingAddresses;
  } catch (error) {
    throw error;
  }
};
export const upsertShippingAddress = async (address: ShippingAddress) => {
  try {
    const user = await currentUser();

    if (!user) throw new Error("Unauthenticated.");

    if (!address) throw new Error("Please provide address data.");
    // nếu add 1 cái là def thì các cái còn lại sẽ update thành false
    if (address.default) {
      const addressDB = await db.shippingAddress.findUnique({
        where: { id: address.id },
      });
      if (addressDB) {
        try {
          await db.shippingAddress.updateMany({
            where: {
              userId: user.id,
              default: true,
            },
            data: {
              default: false,
            },
          });
        } catch (error) {
          throw new Error("Could not reset default shipping addresses");
        }
      }
    }

    const upsertedAddress = await db.shippingAddress.upsert({
      where: {
        id: address.id,
      },
      update: {
        ...address,
        userId: user.id,
      },
      create: {
        ...address,
        userId: user.id,
      },
    });

    return upsertedAddress;
  } catch (error) {
    console.log("🚀 ~ upsertShippingAddress ~ error:", error);
    // throw error;
  }
};
export const placeOrder = async (
  shippingAddress: ShippingAddress,
  cartId: string
): Promise<{ orderId: string; userId: string }> => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const userId = user.id;

  // fetch cart  của ng đó
  const cart = await db.cart.findUnique({
    where: {
      id: cartId,
    },
    include: {
      cartItems: true,
      coupon: true,
    },
  });
  if (!cart) throw new Error("Cart not found.");
  const cartItems = cart.cartItems;
  const cartCoupon = cart.coupon;
  // lặp qua cái mảng gửi lên để lấy ra phí ship + giá tiền  + quantity để tính được tổng price
  const validatedCartItems = await Promise.all(
    cartItems.map(async (cartProduct) => {
      const { productId, variantId, sizeId, quantity } = cartProduct;

      // Fetch the product, variant, and size from the database
      const product = await db.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          store: true,
          freeShipping: {
            include: {
              eligibaleCountries: true,
            },
          },
          variants: {
            where: {
              id: variantId,
            },
            include: {
              sizes: {
                where: {
                  id: sizeId,
                },
              },
              images: true,
            },
          },
        },
      });

      if (
        !product ||
        product.variants.length === 0 ||
        product.variants[0].sizes.length === 0
      ) {
        throw new Error(
          `Invalid product, variant, or size combination for productId ${productId}, variantId ${variantId}, sizeId ${sizeId}`
        );
      }

      const variant = product.variants[0];
      const size = variant.sizes[0];

      const validQuantity = Math.min(quantity, size.quantity);

      // Calculate base price with size discount
      let basePrice = size.discount
        ? size.price - size.price * (size.discount / 100)
        : size.price;

      // Apply flash sale discount if available
      let finalPrice = basePrice;
      try {
        const flashSaleDiscount = await getProductFlashSaleDiscount(productId);

        if (flashSaleDiscount) {
          if (flashSaleDiscount.discountType === "PERCENTAGE") {
            const customDiscount =
              flashSaleDiscount.customDiscountValue ||
              flashSaleDiscount.discountValue;
            finalPrice = basePrice * (1 - customDiscount / 100);

            // Apply max discount limit if exists
            if (flashSaleDiscount.maxDiscount) {
              const maxDiscountAmount =
                (basePrice * flashSaleDiscount.maxDiscount) / 100;
              const currentDiscount = basePrice - finalPrice;
              if (currentDiscount > maxDiscountAmount) {
                finalPrice = basePrice - maxDiscountAmount;
              }
            }
          } else {
            const customDiscount =
              flashSaleDiscount.customDiscountValue ||
              flashSaleDiscount.discountValue;
            finalPrice = Math.max(basePrice - customDiscount, 0);
          }
        }
      } catch (error) {
        console.error("Error applying flash sale discount:", error);
        // Fallback to base price if flash sale calculation fails
        finalPrice = basePrice;
      }

      const price = finalPrice;

      // lấy contry từ cái shipping address
      const countryId = shippingAddress.countryId;

      const temp_country = await db.country.findUnique({
        where: {
          id: countryId,
        },
      });

      if (!temp_country)
        throw new Error("Failed to get Shipping details for order.");

      const country = {
        name: temp_country.name,
        code: temp_country.code,
        city: "",
        region: "",
      };

      let details = {
        shippingFee: 0,
        extraShippingFee: 0,
        isFreeShipping: false,
      };

      if (country) {
        const temp_details = await getShippingDetails(
          product.shippingFeeMethod,
          country,
          product.store,
          product.freeShipping,
          product.freeShippingForAllCountries
        );
        if (typeof temp_details !== "boolean") {
          details = temp_details;
        }
      }
      let shippingFee = 0;
      const { shippingFeeMethod, freeShippingForAllCountries } = product;
      if (freeShippingForAllCountries) {
        shippingFee = 0;
      } else {
        if (shippingFeeMethod === "ITEM") {
          shippingFee =
            quantity === 1
              ? details.shippingFee
              : details.shippingFee + details.extraShippingFee * (quantity - 1);
        } else if (shippingFeeMethod === "WEIGHT") {
          shippingFee = details.shippingFee * variant.weight * quantity;
        } else if (shippingFeeMethod === "FIXED") {
          shippingFee = details.shippingFee;
        }
      }

      const totalPrice = price * validQuantity + shippingFee;
      return {
        productId,
        variantId,
        productSlug: product.slug,
        variantSlug: variant.slug,
        sizeId,
        storeId: product.storeId,
        sku: variant.sku,
        name: `${product.name} · ${variant.variantName}`,
        image: variant.images[0].url,
        size: size.size,
        quantity: validQuantity,
        price,
        shippingFee,
        totalPrice,
      };
    })
  );
  type GroupedItems = { [storeId: string]: typeof validatedCartItems };
  //nhóm theo cái id của store
  const groupedItems = validatedCartItems.reduce<GroupedItems>((acc, item) => {
    if (!acc[item.storeId]) acc[item.storeId] = [];
    acc[item.storeId].push(item);
    return acc;
  }, {} as GroupedItems);

  const order = await db.order.create({
    data: {
      userId: userId,
      shippingAddressId: shippingAddress.id,
      orderStatus: "Pending",
      paymentStatus: "Pending",
      subTotal: 0,
      shippingFees: 0,
      total: 0,
    },
  });
  let orderTotalPrice = 0;
  let orderShippingFee = 0;

  for (const [storeId, items] of Object.entries(groupedItems)) {
    // tính tổng tiền theo từng cửa hàng
    const groupedTotalPrice = items.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );
    const groupShippingFees = items.reduce(
      (acc, item) => acc + item.shippingFee,
      0
    );

    const { shippingService, deliveryTimeMin, deliveryTimeMax } =
      await getDeliveryDetailsForStoreByCountry(
        storeId,
        shippingAddress.countryId
      );
    const check = storeId === cartCoupon?.storeId;
    let discountedAmount = 0;
    if (check && cartCoupon) {
      discountedAmount = (groupedTotalPrice * cartCoupon.discount) / 100;
    }
    const totalAfterDiscount = groupedTotalPrice - discountedAmount;
    const orderGroup = await db.orderGroup.create({
      data: {
        orderId: order.id,
        storeId: storeId,
        status: "Pending",
        subTotal: groupedTotalPrice - groupShippingFees,
        shippingFees: groupShippingFees,
        total: totalAfterDiscount,
        shippingService: shippingService || "International Delivery",
        shippingDeliveryMin: deliveryTimeMin || 7,
        shippingDeliveryMax: deliveryTimeMax || 30,
        couponId: check && cartCoupon ? cartCoupon?.id : null,
      },
    });
    for (const item of items) {
      await db.orderItem.create({
        data: {
          orderGroupId: orderGroup.id,
          productId: item.productId,
          variantId: item.variantId,
          sizeId: item.sizeId,
          productSlug: item.productSlug,
          variantSlug: item.variantSlug,
          sku: item.sku,
          name: item.name,
          image: item.image,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          shippingFee: item.shippingFee,
          totalPrice: item.totalPrice,
        },
      });
      await db.size.update({
        where: {
          id: item.sizeId,
        },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });
      await db.product.update({
        where: {
          id: item.productId,
        },
        data: {
          sales: {
            increment: item.quantity,
          },
        },
      });
    }

    // try {
    //   await createNewOrderNotification(order.id, userId);
    // } catch (error) {
    //   console.error("Error creating order notification:", error);
    // }

    // tinhs tienef
    orderTotalPrice += totalAfterDiscount;
    orderShippingFee += groupShippingFees;

    // update tiền của order
    await db.order.update({
      where: {
        id: order.id,
      },
      data: {
        subTotal: orderTotalPrice - orderShippingFee,
        shippingFees: orderShippingFee,
        total: orderTotalPrice,
      },
    });
  }
  return {
    orderId: order.id,
    userId: userId,
  };
};

export const emptyUserCart = async () => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthenticated.");

    const userId = user.id;

    const res = await db.cart.delete({
      where: {
        userId,
      },
    });
    if (res) return true;
  } catch (error) {
    throw error;
  }
};

export const updateCartWithLatest = async (
  cartProducts: CartProductType[]
): Promise<CartProductType[]> => {
  // Fetch product, variant, and size data from the database for validation
  const validatedCartItems = await Promise.all(
    cartProducts.map(async (cartProduct) => {
      const { productId, variantId, sizeId, quantity } = cartProduct;

      // Fetch the product, variant, and size from the database
      const product = await db.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          store: true,
          freeShipping: {
            include: {
              eligibaleCountries: true,
            },
          },
          variants: {
            where: {
              id: variantId,
            },
            include: {
              sizes: {
                where: {
                  id: sizeId,
                },
              },
              images: true,
            },
          },
        },
      });

      if (
        !product ||
        product.variants.length === 0 ||
        product.variants[0].sizes.length === 0
      ) {
        throw new Error(
          `Invalid product, variant, or size combination for productId ${productId}, variantId ${variantId}, sizeId ${sizeId}`
        );
      }

      const variant = product.variants[0];
      const size = variant.sizes[0];

      // Calculate Shipping details
      const countryCookie = await getCookie("userCountry", { cookies });

      let details = {
        shippingService: product.store.defaultShippingService,
        shippingFee: 0,
        extraShippingFee: 0,
        isFreeShipping: false,
        deliveryTimeMin: 0,
        deliveryTimeMax: 0,
        freeShippingForAllCountries: product.freeShippingForAllCountries,
      };

      if (countryCookie) {
        const country = JSON.parse(countryCookie);
        const temp_details = await getShippingDetails(
          product.shippingFeeMethod,
          country,
          product.store,
          product.freeShipping,
          product.freeShippingForAllCountries
        );

        if (typeof temp_details !== "boolean") {
          details = temp_details;
        }
      }

      const price = size.discount
        ? size.price - (size.price * size.discount) / 100
        : size.price;

      const validated_qty = Math.min(quantity, size.quantity);

      return {
        productId,
        variantId,
        productSlug: product.slug,
        variantSlug: variant.slug,
        sizeId,
        sku: variant.sku,
        name: product.name,
        variantName: variant.variantName,
        image: variant.images[0].url,
        variantImage: variant.variantImage,
        stock: size.quantity,
        weight: variant.weight,
        shippingMethod: product.shippingFeeMethod,
        size: size.size,
        quantity: validated_qty,
        price,
        shippingService: details.shippingService,
        shippingFee: details.shippingFee,
        extraShippingFee: details.extraShippingFee,
        deliveryTimeMin: details.deliveryTimeMin,
        deliveryTimeMax: details.deliveryTimeMax,
        isFreeShipping: details.isFreeShipping,
        freeShippingForAllCountries: details.freeShippingForAllCountries,
      };
    })
  );
  return validatedCartItems;
};

export const addToWishlist = async (
  productId: string,
  variantId: string,
  sizeId?: string
) => {
  const user = await currentUser();

  if (!user) throw new Error("Unauthenticated.");

  const userId = user.id;

  try {
    const existingWIshlistItem = await db.wishlist.findFirst({
      where: {
        userId,
        productId,
        variantId,
      },
    });

    if (existingWIshlistItem) {
      throw new Error("Product is already in the wishlist");
    }

    return await db.wishlist.create({
      data: {
        userId,
        productId,
        variantId,
        sizeId,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const updateCheckoutProductstWithLatest = async (
  cartProducts: CartItem[],
  address: CountryDB | undefined
): Promise<CartWithCartItemsType> => {
  // Fetch product, variant, and size data from the database for validation
  const validatedCartItems = await Promise.all(
    cartProducts.map(async (cartProduct) => {
      const { productId, variantId, sizeId, quantity } = cartProduct;

      // Fetch the product, variant, and size from the database
      const product = await db.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          store: true,
          freeShipping: {
            include: {
              eligibaleCountries: true,
            },
          },
          variants: {
            where: {
              id: variantId,
            },
            include: {
              sizes: {
                where: {
                  id: sizeId,
                },
              },
              images: true,
            },
          },
        },
      });

      if (
        !product ||
        product.variants.length === 0 ||
        product.variants[0].sizes.length === 0
      ) {
        throw new Error(
          `Invalid product, variant, or size combination for productId ${productId}, variantId ${variantId}, sizeId ${sizeId}`
        );
      }

      const variant = product.variants[0];
      const size = variant.sizes[0];

      // Calculate Shipping details
      const countryCookie = await getCookie("userCountry", { cookies });

      const country = address
        ? address
        : countryCookie
        ? JSON.parse(countryCookie)
        : null;

      if (!country) {
        throw new Error("Couldn't retrieve country data");
      }

      let shippingFee = 0;

      const { shippingFeeMethod, freeShipping, store } = product;

      const fee = await getProductShippingFee(
        shippingFeeMethod,
        country,
        store,
        freeShipping,
        variant.weight,
        quantity,
        product.freeShippingForAllCountries
      );

      if (fee) {
        shippingFee = fee;
      }

      // Calculate base price with size discount
      let basePrice = size.discount
        ? size.price - (size.price * size.discount) / 100
        : size.price;

      // Apply flash sale discount if available
      let finalPrice = basePrice;
      try {
        const flashSaleDiscount = await getProductFlashSaleDiscount(productId);

        if (flashSaleDiscount) {
          if (flashSaleDiscount.discountType === "PERCENTAGE") {
            const customDiscount =
              flashSaleDiscount.customDiscountValue ||
              flashSaleDiscount.discountValue;
            finalPrice = basePrice * (1 - customDiscount / 100);

            // Apply max discount limit if exists
            if (flashSaleDiscount.maxDiscount) {
              const maxDiscountAmount =
                (basePrice * flashSaleDiscount.maxDiscount) / 100;
              const currentDiscount = basePrice - finalPrice;
              if (currentDiscount > maxDiscountAmount) {
                finalPrice = basePrice - maxDiscountAmount;
              }
            }
          } else {
            const customDiscount =
              flashSaleDiscount.customDiscountValue ||
              flashSaleDiscount.discountValue;
            finalPrice = Math.max(basePrice - customDiscount, 0);
          }
        }
      } catch (error) {
        console.error("Error applying flash sale discount:", error);
        // Fallback to base price if flash sale calculation fails
        finalPrice = basePrice;
      }

      const price = finalPrice;

      const validated_qty = Math.min(quantity, size.quantity);

      const totalPrice = price * validated_qty + shippingFee;

      try {
        const newCartItem = await db.cartItem.update({
          where: {
            id: cartProduct.id,
          },
          data: {
            name: `${product.name} · ${variant.variantName}`,
            image: variant.images[0].url,
            price,
            quantity: validated_qty,
            shippingFee,
            totalPrice,
          },
        });
        return newCartItem;
      } catch (error) {
        return cartProduct;
      }
    })
  );

  // Apply coupon if exist
  const cartCoupon = await db.cart.findUnique({
    where: {
      id: cartProducts[0].cartId,
    },
    select: {
      coupon: {
        include: {
          store: true,
        },
      },
    },
  });
  // Recalculate the cart's total price and shipping fees
  const subTotal = validatedCartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const shippingFees = validatedCartItems.reduce(
    (acc, item) => acc + item.shippingFee,
    0
  );

  let total = subTotal + shippingFees;

  // Apply coupon discount if applicable
  if (cartCoupon?.coupon) {
    const { coupon } = cartCoupon;

    const currentDate = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (currentDate > startDate && currentDate < endDate) {
      // Check if the coupon applies to any store in the cart
      const applicableStoreItems = validatedCartItems.filter(
        (item) => item.storeId === coupon.storeId
      );

      if (applicableStoreItems.length > 0) {
        // Calculate subtotal for the coupon's store (including shipping fees)
        const storeSubTotal = applicableStoreItems.reduce(
          (acc, item) => acc + item.price * item.quantity + item.shippingFee,
          0
        );
        // Apply coupon discount to the store's subtotal
        const discountedAmount = (storeSubTotal * coupon.discount) / 100;
        total -= discountedAmount;
      }
    }
  }

  const cart = await db.cart.update({
    where: {
      id: cartProducts[0].cartId,
    },
    data: {
      subTotal,
      shippingFees,
      total,
    },
    include: {
      cartItems: true,
      coupon: {
        include: {
          store: true,
        },
      },
    },
  });

  if (!cart) throw new Error("Somethign went wrong !");

  return cart;
};

export const cancelOrder = async (orderId: string): Promise<boolean> => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated.");

  const order = await db.order.findUnique({
    where: { id: orderId },
  });
  if (!order) throw new Error("Order not found.");
  if (order.userId !== user.id) throw new Error("Permission denied.");

  if (order.orderStatus === "Cancelled") return true;

  const orderGroups = await db.orderGroup.findMany({
    where: { orderId },
    include: { items: true },
  });

  await db.$transaction(async (tx) => {
    // Cập nhật trạng thái đơn hàng
    await tx.order.update({
      where: { id: orderId },
      data: { orderStatus: "Cancelled" },
    });

    for (const group of orderGroups) {
      for (const item of group.items) {
        await tx.size.update({
          where: { id: item.sizeId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: {
            sales: {
              decrement: item.quantity,
            },
          },
        });
      }
    }
  });

  return true;
};
