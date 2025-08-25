import Header from "@/components/dashboard/header/header";
import Sidebar from "@/components/dashboard/sidebar/sidebar";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import {
  getListNotificationsByStoreId,
  getStoreByUrl,
} from "../../../../../queries/product";

const SellerStoreDashboardLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeUrl: string };
}) => {
  const user = await currentUser();
  if (!user) {
    redirect("/");
    return;
  }

  const stores = await db.store.findMany({
    where: {
      userId: user.id,
    },
  });
  return (
    <div className="h-full w-full flex">
      <Sidebar stores={stores} />
      <div className="w-full ml-[340px]">
        <Header storeUrl={params.storeUrl} />
        <div className="w-full mt-[75px] p-4">{children}</div>
      </div>
    </div>
  );
};

export default SellerStoreDashboardLayout;
