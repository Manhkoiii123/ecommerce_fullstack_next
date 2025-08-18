import React from "react";
import { DashboardPage } from "@/components/dashboard/shared";

interface SellerStorePageProps {
  params: {
    storeUrl: string;
  };
}

const SellerStorePage = ({ params }: SellerStorePageProps) => {
  return (
    <div className="container mx-auto p-6">
      <DashboardPage storeUrl={params.storeUrl} />
    </div>
  );
};

export default SellerStorePage;
