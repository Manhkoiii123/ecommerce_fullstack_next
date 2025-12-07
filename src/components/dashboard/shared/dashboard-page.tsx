"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { DashboardOverview } from "./dashboard-overview";

interface DashboardExampleProps {
  storeUrl: string;
}

export const DashboardPage = ({ storeUrl }: DashboardExampleProps) => {
  const {
    dashboardStats,
    orderStatusStats,
    weeklyRevenue,
    topProducts,
    conversionRate,
    monthlyStats,
    selectedYear,
    selectedMonth,
    changePeriod,
    isLoading,
    error,
    refetch,
  } = useDashboardStats(storeUrl);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 border rounded-lg">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!dashboardStats || !orderStatusStats || !conversionRate) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data to display</p>
      </div>
    );
  }

  return (
    <DashboardOverview
      dashboardStats={dashboardStats}
      orderStatusStats={orderStatusStats}
      weeklyRevenue={weeklyRevenue}
      topProducts={topProducts}
      conversionRate={conversionRate}
      monthlyStats={monthlyStats}
      selectedYear={selectedYear}
      selectedMonth={selectedMonth}
      onPeriodChange={changePeriod}
      storeUrl={storeUrl}
    />
  );
};
