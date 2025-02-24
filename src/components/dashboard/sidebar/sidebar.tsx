import SidebarNavAdmin from "@/components/dashboard/sidebar/nav-admin";
import SidebarNavSeller from "@/components/dashboard/sidebar/nav-seller";
import StoreSwitcher from "@/components/dashboard/sidebar/store-switcher";
import UserInfo from "@/components/dashboard/sidebar/user-info";
import Logo from "@/components/shared/logo";
import {
  adminDashboardSidebarOptions,
  SellerDashboardSidebarOptions,
} from "@/constants/data";
import { currentUser } from "@clerk/nextjs/server";
import { Store } from "@prisma/client";
import React, { FC } from "react";
interface SidebarProps {
  isAdmin?: boolean;
  stores?: Store[];
}

const Sidebar: FC<SidebarProps> = async ({ isAdmin, stores }) => {
  const user = await currentUser();
  return (
    <div className="w-[340px] border-r h-screen p-4 flex flex-col fixed top-0 left-0 bottom-0  ">
      <div className=" flex items-center justify-center">
        <Logo width="50%" height="120px" />
      </div>
      <span className="mt-3" />
      {!isAdmin && stores && <StoreSwitcher stores={stores} />}
      {user && <UserInfo user={user} />}
      {isAdmin ? (
        <SidebarNavAdmin menuLinks={adminDashboardSidebarOptions} />
      ) : (
        <SidebarNavSeller menuLinks={SellerDashboardSidebarOptions} />
      )}
    </div>
  );
};

export default Sidebar;
