import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ColorThief from "colorthief";
import { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { CartProductType, Country } from "@/lib/types";
import countries from "@/data/countries.json";
import { differenceInDays, differenceInHours } from "date-fns";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const getGridClassName = (length: number) => {
  switch (length) {
    case 2:
      return "grid-cols-2";
    case 3:
      return "grid-cols-2 grid-rows-2";
    case 4:
      return "grid-cols-2 grid-rows-1";
    case 5:
      return "grid-cols-2 grid-rows-6";
    case 6:
      return "grid-cols-2";
    default:
      return "";
  }
};
export const getDominantColors = (imgUrl: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgUrl;
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const colors = colorThief.getPalette(img, 4).map((color) => {
          // Convert RGB array to hex string
          return `#${((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2])
            .toString(16)
            .slice(1)
            .toUpperCase()}`;
        });
        resolve(colors);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
};
// viết hàm check xem slug đã có chưa

// ví dụ /a-1 đã có sẽ tự động tăng lên là /a-2
export const generateUniqueSlug = async (
  baseSlug: string,
  model: keyof PrismaClient,
  field: string = "slug",
  separator: string = "-"
) => {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const exisitngRecord = await (db[model] as any).findFirst({
      where: {
        [field]: slug,
      },
    });
    if (!exisitngRecord) {
      break;
    }
    slug = `${slug}${separator}${suffix}`;
    suffix += 1;
  }
  return slug;
};

const DEFAULT_COUNTRY: Country = {
  name: "United States",
  code: "US",
  city: "",
  region: "",
};

interface IPInfoResponse {
  country: string;
  city: string;
  region: string;
}
export async function getUserCountry(): Promise<Country> {
  let userCountry: Country = DEFAULT_COUNTRY;

  // const geo = (req as any).geo;
  // if (geo) {
  //   userCountry = {
  //     name: geo.country || DEFAULT_COUNTRY.name,
  //     code: geo.country || DEFAULT_COUNTRY.code,
  //     city: geo.city || DEFAULT_COUNTRY.city,
  //     region: geo.region || DEFAULT_COUNTRY.region,
  //   };
  // } else {
  try {
    const response = await fetch(
      `https://ipinfo.io/?token=${process.env.IPINFO_TOKEN}`
    );
    if (response.ok) {
      const data = (await response.json()) as IPInfoResponse;
      userCountry = {
        name:
          countries.find((c) => c.code === data.country)?.name ||
          data.country ||
          DEFAULT_COUNTRY.name,
        code: data.country || DEFAULT_COUNTRY.code,
        city: data.city || DEFAULT_COUNTRY.city,
        region: data.region || DEFAULT_COUNTRY.region,
      };
    }
  } catch (error) {}
  // }

  return userCountry;
}
export const getShippingDatesRange = (
  minDays: number,
  maxDays: number,
  date?: Date
): { minDate: string; maxDate: string } => {
  const currentDate = date ? new Date(date) : new Date();
  const minDate = new Date(currentDate);
  minDate.setDate(currentDate.getDate() + minDays);
  const maxDate = new Date(currentDate);
  maxDate.setDate(currentDate.getDate() + maxDays);
  return {
    minDate: minDate.toDateString(),
    maxDate: maxDate.toDateString(),
  };
};

export const isProductValidToAdd = (product: CartProductType): boolean => {
  const {
    productId,
    variantId,
    productSlug,
    variantSlug,
    name,
    variantName,
    image,
    quantity,
    price,
    sizeId,
    size,
    stock,
    shippingFee,
    extraShippingFee,
    shippingMethod,
    shippingService,
    variantImage,
    weight,
    deliveryTimeMin,
    deliveryTimeMax,
  } = product;

  if (
    !productId ||
    !variantId ||
    !productSlug ||
    !variantSlug ||
    !name ||
    !variantName ||
    !image ||
    quantity <= 0 ||
    price <= 0 ||
    !sizeId ||
    !size ||
    stock <= 0 ||
    weight <= 0 ||
    !shippingMethod ||
    !variantImage ||
    deliveryTimeMin < 0 ||
    deliveryTimeMax < deliveryTimeMin
  ) {
    return false;
  }

  return true;
};
type CensorReturn = {
  firstName: string;
  lastName: string;
  fullName: string;
};
export function censorName(firstName: string, lastName: string): CensorReturn {
  const censor = (name: string): string => {
    if (name.length <= 2) return name;

    const firstChar = name[0];
    const lastChar = name[name.length - 1];

    const middleLength = name.length - 2;

    return `${firstChar}${"*".repeat(middleLength)}${lastChar}`;
  };

  const censoredFullName = `${firstName[0]}***${lastName[lastName.length - 1]}`;
  return {
    firstName: censor(firstName),
    lastName: censor(lastName),
    fullName: censoredFullName,
  };
}

export const getTimeUntil = (
  targetDate: string
): { days: number; hours: number } => {
  const target = new Date(targetDate);
  const now = new Date();

  if (target <= now) return { days: 0, hours: 0 };

  const totalDays = differenceInDays(target, now);
  const totalHours = differenceInHours(target, now) % 24;

  return { days: totalDays, hours: totalHours };
};

export const downloadBlobAsFile = (blob: Blob, filename: string) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};
export const printPDF = (blob: Blob) => {
  const pdfUrl = URL.createObjectURL(blob);
  const printWindow = window.open(pdfUrl, "_blank");
  if (printWindow) {
    printWindow.addEventListener("load", () => {
      printWindow.focus();
      printWindow.print();
    });
  }
};
