import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { SocketProvider } from "@/components/dashboard/seller/socket-provider";

export default async function SellerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();

  if (user?.privateMetadata.role !== "SELLER") redirect("/");

  return (
    <SocketProvider>
      <div>{children}</div>
    </SocketProvider>
  );
}
