import OrdersOverview from "@/components/store/profile/orders-overview";
import ProfileOverview from "@/components/store/profile/overview";
import React from "react";

const ProfilePage = () => {
  return (
    <div className="w-full space-y-4">
      <ProfileOverview />
      <OrdersOverview />
    </div>
  );
};

export default ProfilePage;
