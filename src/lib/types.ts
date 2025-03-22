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
  FreeShipping,
  FreeShippingCountry,
  Prisma,
  ProductVariantImage,
  Review,
  ReviewImage,
  ShippingRate,
  Size,
  Spec,
  User,
} from "@prisma/client";
import countries from "@/data/countries.json";
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
  images: { url: string }[];
  categoryId: string;
  subCategoryId: string;
  isSale: boolean;
  saleEndDate?: string;
  brand: string;
  sku: string;
  colors: { color: string }[];
  sizes: {
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
