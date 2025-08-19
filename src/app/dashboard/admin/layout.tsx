import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { currentUser } from "@clerk/nextjs/server";
import Header from "@/components/dashboard/header/header";
import Sidebar from "@/components/dashboard/sidebar/sidebar";
import { SocketProvider } from "@/components/dashboard/admin/socket-provider";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  if (!user || user.privateMetadata.role !== "ADMIN") redirect("/");
  return (
    <SocketProvider>
      <div className="w-full h-full">
        <Sidebar isAdmin />
        <div className="ml-[340px]">
          <Header />
          <div className="w-full mt-[75px] p-4">{children}</div>
        </div>
      </div>
    </SocketProvider>
  );
}
