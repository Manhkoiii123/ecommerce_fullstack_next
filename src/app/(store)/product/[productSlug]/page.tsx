import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import React from "react";

const ProductPage = async ({ params }: { params: { productSlug: string } }) => {
  const product = await db.product.findUnique({
    where: { slug: params.productSlug },
    include: {
      variants: true,
    },
  });
  if (!product) return redirect("/");
  if (!product.variants.length) return redirect("/");

  return redirect(`/product/${product.slug}/${product.variants[0].slug}`);
};

export default ProductPage;
