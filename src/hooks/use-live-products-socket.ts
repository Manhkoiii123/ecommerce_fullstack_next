"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/providers/socket-provider";
import { ProductType } from "@/lib/types";

export type LiveProduct = {
  id: string;
  name: string;
  slug: string;
  variants: {
    id: string;
    variantName: string;
    images: { url: string }[];
    sizes: { price: number; discount: number }[];
  }[];
};

export function useLiveProducts(storeId: string) {
  const { socket } = useSocket();
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [cards, setCards] = useState<ProductType[]>([]);

  const loadCards = useCallback(async (ids: string[]) => {
    if (!ids || ids.length === 0) {
      setCards([]);
      return;
    }
    const res = await fetch(`/api/live/products-by-ids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: ids }),
    });
    const data = await res.json();
    setCards(data.products || []);
  }, []);

  useEffect(() => {
    if (!storeId) return;

    const fetchInitial = async () => {
      try {
        const res = await fetch(
          `/api/socket/live-products?storeId=${storeId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setProducts(data.products || []);
        setProductIds(data.productIds || []);
        setUpdatedAt(data.updatedAt || Date.now());
        await loadCards(data.productIds || []);
      } catch (e) {}
    };

    fetchInitial();
  }, [storeId, loadCards]);

  useEffect(() => {
    if (!socket || !storeId) return;

    const channel = `live:store:${storeId}:products`;
    const handler = async (payload: {
      productIds: string[];
      products: LiveProduct[];
      updatedAt: number;
    }) => {
      setProducts(payload.products || []);
      setProductIds(payload.productIds || []);
      setUpdatedAt(payload.updatedAt || Date.now());
      await loadCards(payload.productIds || []);
    };

    socket.on(channel, handler);
    return () => {
      socket.off(channel, handler);
    };
  }, [socket, storeId, loadCards]);

  const updateSelection = useCallback(
    async (newProductIds: string[]) => {
      if (!storeId) return;
      await fetch(`/api/socket/live-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, productIds: newProductIds }),
      });
    },
    [storeId]
  );

  return { products, productIds, updatedAt, updateSelection, cards };
}
