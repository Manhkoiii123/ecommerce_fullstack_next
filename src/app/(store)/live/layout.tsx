import Container from "@/components/live/Container";
import Navbar from "@/components/live/navbar";
import Sidebar, { SidebarSkeleton } from "@/components/live/sidebar";
import { Suspense } from "react";

const BrowerLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <div className="flex h-full pt-20">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
        <Container>{children}</Container>
      </div>
    </>
  );
};

export default BrowerLayout;
