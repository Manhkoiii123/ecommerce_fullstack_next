"use client";

import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { StatsCard } from "./stats-card";
import { OrderStatusChart } from "./order-status-chart";
import { WeeklyRevenueChart } from "./weekly-revenue-chart";
import { TopProductsTable } from "./top-products-table";
import { ConversionRateCard } from "./conversion-rate-card";
import { PeriodSelector } from "./period-selector";

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
  conversionRate: ConversionRateStats;
  dailyRevenue: Array<{
    day: number;
    revenue: number;
  }>;
}

interface DashboardOverviewProps {
  dashboardStats: DashboardStats;
  orderStatusStats: OrderStatusStats;
  weeklyRevenue: WeeklyRevenueData[];
  topProducts: TopProduct[];
  conversionRate: ConversionRateStats;
  monthlyStats: MonthlyStats | null;
  selectedYear: number;
  selectedMonth: number;
  onPeriodChange: (year: number, month: number) => void;
}

export const DashboardOverview = ({
  dashboardStats,
  orderStatusStats,
  weeklyRevenue,
  topProducts,
  conversionRate,
  monthlyStats,
  selectedYear,
  selectedMonth,
  onPeriodChange,
}: DashboardOverviewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  // Sử dụng thống kê theo tháng được chọn nếu có, nếu không thì dùng thống kê tổng quan
  const currentStats = monthlyStats?.overview || dashboardStats.monthly;
  const currentOrderStatus = monthlyStats?.orderStatus || orderStatusStats;
  const currentTopProducts = monthlyStats?.topProducts || topProducts;
  const currentConversionRate = monthlyStats?.conversionRate || conversionRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your business activities
          </p>
        </div>

        {/* Period Selector */}
        <PeriodSelector
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onPeriodChange={onPeriodChange}
        />
      </div>

      {/* Period Info */}
      {monthlyStats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Currently viewing statistics for: {monthlyStats.period.monthName}
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={monthlyStats ? "Monthly Revenue" : "Monthly Revenue"}
          value={formatCurrency(currentStats.revenue)}
          description={
            monthlyStats
              ? "Total revenue for the month"
              : "Total revenue for the month"
          }
          icon={DollarSign}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
        />
        <StatsCard
          title={monthlyStats ? "Monthly Orders" : "Monthly Orders"}
          value={formatNumber(currentStats.orders)}
          description={
            monthlyStats
              ? "Total new orders for the month"
              : "Total new orders for the month"
          }
          icon={ShoppingCart}
          className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200"
        />
        <StatsCard
          title="Products Sold"
          value={formatNumber(currentStats.productsSold)}
          description="Total quantity of products"
          icon={Package}
          className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200"
        />
        <StatsCard
          title="New Customers"
          value={formatNumber(currentStats.newCustomers)}
          description={
            monthlyStats
              ? "New customers for the month"
              : "New customers for the month"
          }
          icon={Users}
          className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
        />
      </div>

      {/* Charts and Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Revenue Chart */}
        <WeeklyRevenueChart
          data={weeklyRevenue}
          title={
            monthlyStats ? "Daily Revenue for the Month" : "Weekly Revenue"
          }
          isDaily={!!monthlyStats}
        />

        {/* Order Status Chart */}
        <OrderStatusChart stats={currentOrderStatus} />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products Table */}
        <TopProductsTable
          products={currentTopProducts}
          title={
            monthlyStats
              ? "Top Selling Products for the Month"
              : "Top Revenue Products"
          }
        />

        {/* Conversion Rate Card */}
        <ConversionRateCard stats={currentConversionRate} />
      </div>

      {/* Yearly Summary - Chỉ hiển thị khi không chọn tháng cụ thể */}
      {!monthlyStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Yearly Revenue"
            value={formatCurrency(dashboardStats.yearly.revenue)}
            description="Total revenue for the year"
            icon={TrendingUp}
            className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200"
          />
          <StatsCard
            title="Yearly Orders"
            value={formatNumber(dashboardStats.yearly.orders)}
            description="Total orders for the year"
            icon={ShoppingCart}
            className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200"
          />
          <StatsCard
            title="Yearly Products Sold"
            value={formatNumber(dashboardStats.yearly.productsSold)}
            description="Total quantity of products for the year"
            icon={Package}
            className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200"
          />
          <StatsCard
            title="Yearly New Customers"
            value={formatNumber(dashboardStats.yearly.newCustomers)}
            description="New customers for the year"
            icon={Users}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
          />
        </div>
      )}
    </div>
  );
};
