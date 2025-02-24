import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export default async function SellerDashboardPage() {
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
  if (stores.length === 0) {
    redirect("/dashboard/seller/stores/new");
    return;
  }
  redirect(`/dashboard/seller/stores/${stores[0].url}`);

  return <div>Seller Dashboard</div>;
}
