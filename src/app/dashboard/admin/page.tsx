"use client";

import { useAdminDashboardStats } from "@/hooks/useAdminDashboardStats";
import { AdminDashboardOverview } from "@/components/dashboard/admin/admin-dashboard-overview";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

const AdminDashboardPage = () => {
  const {
    dashboardStats,
    topStoresBySales,
    newlyCreatedStores,
    productsBySubCategory,
    newProductsBySubCategory,
    productsByOfferTag,
    storeStatusStats,
    categoriesWithStats,
    newStoresDays,
    changeNewStoresDays,
    isLoading,
    error,
    refetch,
  } = useAdminDashboardStats(30);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
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

  if (!dashboardStats || !storeStatusStats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <AdminDashboardOverview
      dashboardStats={dashboardStats}
      topStoresBySales={topStoresBySales}
      newlyCreatedStores={newlyCreatedStores}
      productsBySubCategory={productsBySubCategory}
      newProductsBySubCategory={newProductsBySubCategory}
      productsByOfferTag={productsByOfferTag}
      storeStatusStats={storeStatusStats}
      newStoresDays={newStoresDays}
      onDaysChange={changeNewStoresDays}
    />
  );
};

export default AdminDashboardPage;
