import Container from "@/app/(dashboard)/u/[storeUrl]/_components/Container";
import Navbar from "@/app/(dashboard)/u/[storeUrl]/_components/navbar";
import Sidebar from "@/app/(dashboard)/u/[storeUrl]/_components/sidebar";
import { getStoreByUrl } from "@/queries/store";
import { redirect } from "next/navigation";
import React from "react";
interface CreatorLayoutProps {
  params: { storeUrl: string };
  children: React.ReactNode;
}
const CreatorLayout = async ({ children, params }: CreatorLayoutProps) => {
  const self = await getStoreByUrl(params.storeUrl);
  if (!self) {
    redirect("/");
  }
  return (
    <>
      <Navbar />
      <div className="flex h-full pt-20 !text-black">
        <Sidebar />
        <Container>{children}</Container>
      </div>
    </>
  );
};

export default CreatorLayout;
