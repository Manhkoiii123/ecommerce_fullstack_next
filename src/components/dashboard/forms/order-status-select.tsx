import OrderStatusTag from "@/components/store/shared/order-status";
import { OrderStatus } from "@/lib/types";
import { updateOrderGroupStatus } from "@/queries/order";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  storeId: string;
  groupId: string;
  status: OrderStatus;
  orderId?: string;
  userId?: string;
}

const OrderStatusSelect: FC<Props> = ({
  groupId,
  status,
  storeId,
  orderId,
  userId,
}) => {
  const [newStatus, setNewStatus] = useState<OrderStatus>(status);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const router = useRouter();

  const options = Object.values(OrderStatus).filter((s) => s !== newStatus);

  const handleClick = async (selectedStatus: OrderStatus) => {
    try {
      const response = await updateOrderGroupStatus(
        storeId,
        groupId,
        selectedStatus
      );
      await fetch("/api/socket/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ORDER_STATUS_CHANGE",
          orderId: orderId,
          userId: userId,
          newStatus: selectedStatus,
          orderGroupId: groupId,
        }),
      });
      if (response) {
        setNewStatus(response as OrderStatus);
        setIsOpen(false);
        router.refresh();
      }
    } catch (error: any) {
      toast.error("Oops!", {
        description: error.toString(),
      });
    }
  };
  return (
    <div className="relative">
      <div
        className="cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <OrderStatusTag status={newStatus} />
      </div>
      {isOpen && (
        <div className="absolute z-50 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-md shadow-md mt-2 w-[140px]">
          {options.map((option) => (
            <button
              key={option}
              className="w-full flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              onClick={() => handleClick(option)}
            >
              <OrderStatusTag status={option} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderStatusSelect;
