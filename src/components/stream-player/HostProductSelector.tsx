"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLiveProducts } from "@/hooks/use-live-products-socket";
import { useEffect, useState } from "react";

export default function HostProductSelector({
  storeUrl,
  storeId,
}: {
  storeUrl: string;
  storeId: string;
}) {
  const { productIds, updateSelection } = useLiveProducts(storeId);
  const [allProducts, setAllProducts] = useState<
    { id: string; name: string }[]
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/live/store-products/${storeUrl}`);
        const data = await res.json();
        setAllProducts(
          (data.products || []).map((p: any) => ({ id: p.id, name: p.name }))
        );
      } catch {}
    })();
  }, [storeUrl]);

  const onToggle = async (id: string) => {
    const exists = productIds.includes(id);
    let next: string[];
    if (exists) {
      next = productIds.filter((x) => x !== id);
    } else {
      next = [id, ...productIds.filter((x) => x !== id)];
    }
    setSaving(true);
    try {
      await updateSelection(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-md p-3">
      <div className="font-semibold mb-2">Chọn sản phẩm hiển thị</div>
      <div className="max-h-60 overflow-auto space-y-2">
        {allProducts.map((p) => (
          <label key={p.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={productIds.includes(p.id)}
              onCheckedChange={() => onToggle(p.id)}
            />
            <span className="line-clamp-1">{p.name}</span>
          </label>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Khi check, sản phẩm sẽ lên đầu danh sách. Người xem chỉ thấy danh sách
        đã chọn.
      </div>
      <div className="mt-2">
        <Button size="sm" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
