import {
  getAllStoreProducts,
  getProductPageData,
  getProducts,
  getRatingStatistics,
  getShippingDetails,
  retrieveProductDetails,
} from "@/queries/product";
import { getStoreDefaultShippingDetails } from "@/queries/store";
import { getAllSubCategories } from "@/queries/subCategories";
import {
  Cart,
  CartItem,
  Color,
  FreeShipping,
  FreeShippingCountry,
  Prisma,
  ProductVariantImage,
  Review,
  ReviewImage,
  ShippingAddress,
  ShippingFeeMethod,
  ShippingRate,
  Size,
  Spec,
  User,
  Country as CountryPrisma,
  Coupon,
  Store,
  OrderGroup,
  OrderItem,
} from "@prisma/client";
import countries from "@/data/countries.json";
import { getOrder } from "@/queries/order";
import { getUserOrders, getUserPayments } from "@/queries/profile";
export interface DashboardSidebarMenuInterface {
  label: string;
  icon: string;
  link: string;
}
export type SubCategoryWithCategoryType = Prisma.PromiseReturnType<
  typeof getAllSubCategories
>[0];

export type ProductWithVariantType = {
  productId: string;
  variantId: string;
  name: string;
  description: string;
  variantName: string;
  variantDescription: string;
  variantImage: string;
  images: { id?: string; url: string }[];
  categoryId: string;
  offerTagId: string;
  subCategoryId: string;
  isSale: boolean;
  saleEndDate?: string;
  brand: string;
  sku: string;
  colors: { id?: string; color: string }[];
  sizes: {
    id?: string;
    size: string;
    quantity: number;
    price: number;
    discount: number;
  }[];
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
  weight: number;
  product_specs: { id?: string; name: string; value: string }[];
  variant_specs: { id?: string; name: string; value: string }[];
  questions: { id?: string; question: string; answer: string }[];
  freeShippingForAllCountries: boolean;
  freeShippingCountriesIds: { id?: string; label: string; value: string }[];
  shippingFeeMethod: ShippingFeeMethod;
};

export type StoreProductType = Prisma.PromiseReturnType<
  typeof getAllStoreProducts
>[0];

export type StoreDefaultShippingType = Prisma.PromiseReturnType<
  typeof getStoreDefaultShippingDetails
>;

export type CountryWithShippingRatesType = {
  countryId: string;
  countryName: string;
  shippingRate: ShippingRate;
};
export interface Country {
  name: string;
  code: string;
  city: string;
  region: string;
}

export type SelectMenuOption = (typeof countries)[number];
export type ProductType = Prisma.PromiseReturnType<
  typeof getProducts
>["products"][0];

export type VariantSimplified = {
  variantId: string;
  variantSlug: string;
  variantName: string;
  images: ProductVariantImage[];
  sizes: Size[];
};

export type VariantImageType = {
  url: string;
  image: string;
};
export type ProductPageType = Prisma.PromiseReturnType<
  typeof retrieveProductDetails
>;
export type ProductPageDataType = Prisma.PromiseReturnType<
  typeof getProductPageData
>;
export type ProductVariantDataType = {
  id: string;
  variantName: string;
  slug: string;
  sku: string;
  variantImage: string;
  weight: number;
  isSale: boolean;
  saleEndDate: string | null;
  variantDescription: string | null;
  images: {
    url: string;
  }[];
  sizes: Size[];
  specs: Spec[];
  colors: { name: string }[];
  keywords: string;
};
export type ProductShippingDetailsType = Prisma.PromiseReturnType<
  typeof getShippingDetails
>;

export type FreeShippingWithCountriesType = FreeShipping & {
  eligibaleCountries: FreeShippingCountry[];
};
export type CartProductType = {
  productId: string;
  variantId: string;
  productSlug: string;
  variantSlug: string;
  name: string;
  variantName: string;
  image: string;
  variantImage: string;
  sizeId: string;
  size: string;
  quantity: number;
  price: number;
  stock: number;
  weight: number;
  shippingMethod: string;
  shippingService: string;
  shippingFee: number;
  extraShippingFee: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  isFreeShipping: boolean;
  freeShippingForAllCountries: boolean;
};
export type RatingStatisticsType = Prisma.PromiseReturnType<
  typeof getRatingStatistics
>;
export type StatisticsCardType = Prisma.PromiseReturnType<
  typeof getRatingStatistics
>["ratingStatistics"];
export type ReviewWithImage = Review & {
  images: ReviewImage[];
  user: User;
};
export type SortOrder = "asc" | "desc";
export type ReviewsFiltersType = {
  rating?: number;
  hasImages?: boolean;
};
export type ReviewsOrderType = {
  orderBy: "latest" | "oldest" | "highest";
};

export type ReviewDetailsType = {
  id: string;
  review: string;
  rating: number;
  images: { url: string }[];
  size: string;
  quantity: string;
  variant: string;
  color: string;
};
export type VariantInfoType = {
  variantName: string;
  variantSlug: string;
  variantImage: string;
  variantUrl: string;
  images: ProductVariantImage[];
  sizes: Size[];
  colors: Partial<Color>[];
};
export interface Country {
  name: string;
  code: string;
  city: string;
  region: string;
}
export type CartWithCartItemsType = Cart & {
  cartItems: CartItem[];
  coupon: (Coupon & { store: Store }) | null;
};
export type UserShippingAddressType = ShippingAddress & {
  country: CountryPrisma;
  user: User;
};
export type OrderFulltType = Prisma.PromiseReturnType<typeof getOrder>;
export enum OrderStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  Processing = "Processing",
  Shipped = "Shipped",
  OutforDelivery = "OutforDelivery",
  Delivered = "Delivered",
  Cancelled = "Cancelled",
  Failed = "Failed",
  Refunded = "Refunded",
  Returned = "Returned",
  PartiallyShipped = "PartiallyShipped",
  OnHold = "OnHold",
}

export enum PaymentStatus {
  Pending = "Pending",
  Paid = "Paid",
  Failed = "Failed",
  Declined = "Declined",
  Cancelled = "Cancelled",
  Refunded = "Refunded",
  PartiallyRefunded = "PartiallyRefunded",
  Chargeback = "Chargeback",
}
export type OrderGroupWithItemsType = OrderGroup & {
  items: OrderItem[];
  store: Store;
  _count: {
    items: number;
  };
  coupon: Coupon | null;
};

export enum ProductStatus {
  Pending = "Pending",
  Processing = "Processing",
  ReadyForShipment = "ReadyForShipment",
  Shipped = "Shipped",
  Delivered = "Delivered",
  Canceled = "Canceled",
  Returned = "Returned",
  Refunded = "Refunded",
  FailedDelivery = "FailedDelivery",
  OnHold = "OnHold",
  Backordered = "Backordered",
  PartiallyShipped = "PartiallyShipped",
  ExchangeRequested = "ExchangeRequested",
  AwaitingPickup = "AwaitingPickup",
}

export interface SearchResult {
  name: string;
  link: string;
  image: string;
}
export type OrderTableFilter =
  | ""
  | "unpaid"
  | "toShip"
  | "shipped"
  | "delivered";

export type OrderTableDateFilter =
  | ""
  | "last-6-months"
  | "last-1-year"
  | "last-2-years";

export type UserOrderType = Prisma.PromiseReturnType<
  typeof getUserOrders
>["orders"][0];

export type PaymentTableFilter = "" | "paypal" | "credit-card";

export type PaymentTableDateFilter =
  | ""
  | "last-6-months"
  | "last-1-year"
  | "last-2-years";
export type UserPaymentType = Prisma.PromiseReturnType<
  typeof getUserPayments
>["payments"][0];

export type ReviewFilter = "5" | "4" | "3" | "2" | "1" | "";

export type ReviewDateFilter =
  | ""
  | "last-6-months"
  | "last-1-year"
  | "last-2-years";

export type ReviewWithImageType = Review & {
  images: ReviewImage[];
  user: User;
};
