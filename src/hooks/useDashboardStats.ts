import { useState, useEffect } from "react";
import {
  getStoreDashboardStats,
  getStoreOrderStatusStats,
  getStoreWeeklyRevenue,
  getStoreTopRevenueProducts,
  getStoreConversionRate,
  getStoreStatsByMonth,
  getStoreDashboardStatsByPeriod,
} from "@/queries/store";

interface DashboardStats {
  monthly: {
    revenue: number;
    orders: number;
    productsSold: number;
    newCustomers: number;
  };
  yearly: {
    revenue: number;
    orders: number;
    productsSold: number;
    newCustomers: number;
  };
}

interface OrderStatusStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

interface WeeklyRevenueData {
  day: string | number;
  revenue: number;
}

interface TopProduct {
  product: any;
  sold: number;
  revenue: number;
}

interface ConversionRateStats {
  completedOrders: number;
  totalOrders: number;
  conversionRate: number;
}

interface MonthlyStats {
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  overview: {
    revenue: number;
    orders: number;
    productsSold: number;
    newCustomers: number;
  };
  orderStatus: OrderStatusStats;
  topProducts: TopProduct[];
  conversionRate: {
    completedOrders: number;
    totalOrders: number;
    conversionRate: number;
  };
  dailyRevenue: Array<{
    day: number;
    revenue: number;
  }>;
}

interface DashboardData {
  dashboardStats: DashboardStats | null;
  orderStatusStats: OrderStatusStats | null;
  weeklyRevenue: WeeklyRevenueData[];
  topProducts: TopProduct[];
  conversionRate: ConversionRateStats | null;
  monthlyStats: MonthlyStats | null;
  isLoading: boolean;
  error: string | null;
}

export const useDashboardStats = (storeUrl: string) => {
  const [data, setData] = useState<DashboardData>({
    dashboardStats: null,
    orderStatusStats: null,
    weeklyRevenue: [],
    topProducts: [],
    conversionRate: null,
    monthlyStats: null,
    isLoading: true,
    error: null,
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!storeUrl) return;

      try {
        setData((prev) => ({ ...prev, isLoading: true, error: null }));

        // Fetch all statistics in parallel
        const [
          dashboardStats,
          orderStatusStats,
          weeklyRevenue,
          topProducts,
          conversionRate,
          monthlyStats,
        ] = await Promise.all([
          getStoreDashboardStats(storeUrl),
          getStoreOrderStatusStats(storeUrl),
          getStoreWeeklyRevenue(storeUrl, selectedYear, selectedMonth),
          getStoreTopRevenueProducts(storeUrl),
          getStoreConversionRate(storeUrl),
          getStoreStatsByMonth(storeUrl, selectedYear, selectedMonth),
        ]);

        setData({
          dashboardStats,
          orderStatusStats,
          weeklyRevenue,
          topProducts,
          conversionRate,
          monthlyStats,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Có lỗi xảy ra",
        }));
      }
    };

    fetchDashboardData();
  }, [storeUrl, selectedYear, selectedMonth]);

  const refetch = () => {
    setData((prev) => ({ ...prev, isLoading: true }));
    // Trigger useEffect by changing a dependency
    // This is a simple way to refetch data
  };

  const changePeriod = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  return {
    ...data,
    selectedYear,
    selectedMonth,
    changePeriod,
    refetch,
  };
};
