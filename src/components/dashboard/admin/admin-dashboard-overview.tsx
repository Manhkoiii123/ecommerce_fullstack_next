"use client";

import { StatsCard } from "../shared/stats-card";
import { TopStoresBySalesTable } from "./top-stores-by-sales-table";
import { NewlyCreatedStoresTable } from "./newly-created-stores-table";
import { ProductsBySubCategoryTable } from "./products-by-subcategory-table";
import { NewProductsBySubCategoryTable } from "./new-products-by-subcategory-table";
import { ProductsByOfferTagTable } from "./products-by-offer-tag-table";
import { StoreStatusChart } from "./store-status-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Store, Package, Users, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminDashboardOverviewProps {
  dashboardStats: any;
  topStoresBySales: any[];
  newlyCreatedStores: any[];
  productsBySubCategory: any[];
  newProductsBySubCategory: any[];
  productsByOfferTag: any[];
  storeStatusStats: any;
  newStoresDays: number;
  onDaysChange: (days: number) => void;
}

export const AdminDashboardOverview = ({
  dashboardStats,
  topStoresBySales,
  newlyCreatedStores,
  productsBySubCategory,
  newProductsBySubCategory,
  productsByOfferTag,
  storeStatusStats,
  newStoresDays,
  onDaysChange,
}: AdminDashboardOverviewProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform-wide statistics and management
          </p>
        </div>
        <Select
          value={newStoresDays.toString()}
          onValueChange={(value) => onDaysChange(Number(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Stores"
          value={dashboardStats.stores.total.toLocaleString()}
          description={`${dashboardStats.stores.active} active stores`}
          icon={Store}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900"
        />
        <StatsCard
          title="Active Stores"
          value={dashboardStats.stores.active.toLocaleString()}
          description={`${dashboardStats.stores.monthlyNew} new this month`}
          icon={Store}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
        />
        <StatsCard
          title="Total Products"
          value={dashboardStats.products.total.toLocaleString()}
          description={`${dashboardStats.products.monthlyNew} new this month`}
          icon={Package}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
        />
        <StatsCard
          title="Total Users"
          value={dashboardStats.users.total.toLocaleString()}
          description={`${dashboardStats.users.monthlyNew} new this month`}
          icon={Users}
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Pending Stores"
          value={dashboardStats.stores.pending.toLocaleString()}
          description="Awaiting approval"
          icon={Calendar}
        />
        <StatsCard
          title="New Stores This Month"
          value={dashboardStats.stores.monthlyNew.toLocaleString()}
          description="Recently registered"
          icon={Store}
        />
      </div>

      {/* Store Status Chart */}
      <div className="grid gap-6 lg:grid-cols-1">
        <StoreStatusChart data={storeStatusStats} />
      </div>

      {/* Main Content - Tabs */}
      <Tabs defaultValue="stores" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="subcategories">SubCategories</TabsTrigger>
          <TabsTrigger value="offertags">Offer Tags</TabsTrigger>
          <TabsTrigger value="new">New Items</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-6">
          <TopStoresBySalesTable stores={topStoresBySales} />
        </TabsContent>

        <TabsContent value="subcategories" className="space-y-6">
          <ProductsBySubCategoryTable subCategories={productsBySubCategory} />
        </TabsContent>

        <TabsContent value="offertags" className="space-y-6">
          <ProductsByOfferTagTable offerTags={productsByOfferTag} />
        </TabsContent>

        <TabsContent value="new" className="space-y-6">
          <NewlyCreatedStoresTable
            stores={newlyCreatedStores}
            days={newStoresDays}
          />
          <NewProductsBySubCategoryTable
            subCategories={newProductsBySubCategory}
            days={newStoresDays}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-20" asChild>
          <a href="/dashboard/admin/stores">
            <div className="flex flex-col items-center gap-2">
              <Store className="h-5 w-5" />
              <span>Manage Stores</span>
            </div>
          </a>
        </Button>
        <Button variant="outline" className="h-20" asChild>
          <a href="/dashboard/admin/categories">
            <div className="flex flex-col items-center gap-2">
              <Package className="h-5 w-5" />
              <span>Manage Categories</span>
            </div>
          </a>
        </Button>
        <Button variant="outline" className="h-20" asChild>
          <a href="/dashboard/admin/subCategories">
            <div className="flex flex-col items-center gap-2">
              <Package className="h-5 w-5" />
              <span>Manage SubCategories</span>
            </div>
          </a>
        </Button>
        <Button variant="outline" className="h-20" asChild>
          <a href="/dashboard/admin/offer-tags">
            <div className="flex flex-col items-center gap-2">
              <Package className="h-5 w-5" />
              <span>Manage Offer Tags</span>
            </div>
          </a>
        </Button>
      </div>
    </div>
  );
};
