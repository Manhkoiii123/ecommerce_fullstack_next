"use client";

import ProductCard from "@/components/store/cards/product/product-card";
import { useLiveProducts } from "@/hooks/use-live-products-socket";

export default function SelectedProducts({ storeId }: { storeId: string }) {
  const { cards } = useLiveProducts(storeId);

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold">Live Products</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
