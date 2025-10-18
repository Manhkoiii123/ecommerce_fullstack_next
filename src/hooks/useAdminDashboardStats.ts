import { useState, useEffect } from "react";
import {
  getAdminDashboardStats,
  getTopStoresBySales,
  getNewlyCreatedStores,
  getProductsBySubCategory,
  getNewProductsBySubCategory,
  getProductsByOfferTag,
  getStoresByStatus,
  getCategoriesWithStats,
} from "@/queries/admin";

interface AdminDashboardData {
  dashboardStats: any;
  topStoresBySales: any[];
  newlyCreatedStores: any[];
  productsBySubCategory: any[];
  newProductsBySubCategory: any[];
  productsByOfferTag: any[];
  storeStatusStats: any;
  categoriesWithStats: any[];
  isLoading: boolean;
  error: string | null;
}

export const useAdminDashboardStats = (days: number = 30) => {
  const [data, setData] = useState<AdminDashboardData>({
    dashboardStats: null,
    topStoresBySales: [],
    newlyCreatedStores: [],
    productsBySubCategory: [],
    newProductsBySubCategory: [],
    productsByOfferTag: [],
    storeStatusStats: null,
    categoriesWithStats: [],
    isLoading: true,
    error: null,
  });

  const [newStoresDays, setNewStoresDays] = useState(days);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setData((prev) => ({ ...prev, isLoading: true, error: null }));

        // Fetch all statistics in parallel
        const [
          dashboardStats,
          topStoresBySales,
          newlyCreatedStores,
          productsBySubCategory,
          newProductsBySubCategory,
          productsByOfferTag,
          storeStatusStats,
          categoriesWithStats,
        ] = await Promise.all([
          getAdminDashboardStats(),
          getTopStoresBySales(10),
          getNewlyCreatedStores(newStoresDays),
          getProductsBySubCategory(),
          getNewProductsBySubCategory(newStoresDays),
          getProductsByOfferTag(),
          getStoresByStatus(),
          getCategoriesWithStats(),
        ]);

        setData({
          dashboardStats,
          topStoresBySales,
          newlyCreatedStores,
          productsBySubCategory,
          newProductsBySubCategory,
          productsByOfferTag,
          storeStatusStats,
          categoriesWithStats,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "An error occurred",
        }));
      }
    };

    fetchDashboardData();
  }, [newStoresDays]);

  const refetch = () => {
    setData((prev) => ({ ...prev, isLoading: true }));
  };

  const changeNewStoresDays = (days: number) => {
    setNewStoresDays(days);
  };

  return {
    ...data,
    newStoresDays,
    changeNewStoresDays,
    refetch,
  };
};
