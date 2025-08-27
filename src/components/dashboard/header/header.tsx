import { UserButton } from "@clerk/nextjs";

import ThemeToggle from "@/components/shared/theme-toggle";
import { getStoreByUrl } from "../../../queries/product";
import { redirect } from "next/navigation";
import { NotificationBell } from "../shared/notification-bell";
import { currentUser } from "@clerk/nextjs/server";

export default async function Header({ storeUrl }: { storeUrl?: string }) {
  const user = await currentUser();
  if (!user) redirect("/");
  let storeByUrl;
  if (storeUrl) {
    storeByUrl = await getStoreByUrl(storeUrl);
  }
  return (
    <div className="fixed z-[20] md:left-[340px] left-0 top-0 right-0 p-4 bg-background/80 backdrop-blur-md flex gap-4 items-center border-b-[1px]">
      <div className="flex items-center gap-2 ml-auto">
        <UserButton afterSignOutUrl="/" />
        <ThemeToggle />
        {storeByUrl && user.privateMetadata.role === "SELLER" && (
          <NotificationBell storeId={storeByUrl.id} storeUrl={storeUrl} />
        )}
      </div>
    </div>
  );
}
