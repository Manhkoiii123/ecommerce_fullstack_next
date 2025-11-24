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

  // Get the current store to check its status
  const currentStore = await db.store.findUnique({
    where: {
      url: params.storeUrl,
      userId: user.id,
    },
  });

  // If store doesn't exist or doesn't belong to user, redirect
  if (!currentStore) {
    redirect("/dashboard/seller");
    return;
  }

  // If store is pending, show pending approval interface
  if (currentStore.status === "PENDING") {
    return (
      <div className="h-full w-full flex">
        <Sidebar stores={stores} />
        <div className="w-full ml-[340px]">
          <Header storeUrl={params.storeUrl} />
          <div className="w-full mt-[75px] p-4">
            <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
              <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Store Pending Approval
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Your store &quot;{currentStore.name}&quot; is currently under review.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-700 mb-2">What&apos;s next?</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Our admin team will review your store details</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>This process typically takes 1-3 business days</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>You&apos;ll be notified once your store is approved</span>
                    </li>
                  </ul>
                </div>

                <div className="text-sm text-gray-500">
                  <p>Need help? Contact us at <a href="mailto:support@example.com" className="text-blue-600 hover:underline">support@example.com</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
