import SidebarNavAdmin from "@/components/dashboard/sidebar/nav-admin";
import UserInfo from "@/components/dashboard/sidebar/user-info";
import Logo from "@/components/shared/logo";
import { adminDashboardSidebarOptions } from "@/constants/data";
import { currentUser } from "@clerk/nextjs/server";
import React, { FC } from "react";
interface SidebarProps {
  isAdmin?: boolean;
}

const Sidebar: FC<SidebarProps> = async ({ isAdmin }) => {
  const user = await currentUser();
  return (
    <div className="w-[340px] border-r h-screen p-4 flex flex-col fixed top-0 left-0 bottom-0  ">
      <div className=" flex items-center justify-center">
        <Logo width="50%" height="120px" />
      </div>

      <span className="mt-3" />
      {user && <UserInfo user={user} />}
      <SidebarNavAdmin menuLinks={adminDashboardSidebarOptions} />
    </div>
  );
};

export default Sidebar;
