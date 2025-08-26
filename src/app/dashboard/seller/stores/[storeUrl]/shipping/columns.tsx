"use client";

import { useParams, useRouter } from "next/navigation";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useModal } from "@/providers/modal-provider";

import { Edit, MoreHorizontal } from "lucide-react";

import { ColumnDef } from "@tanstack/react-table";
import { CountryWithShippingRatesType } from "@/lib/types";
import CustomModal from "@/components/shared/custom-modal";
import ShippingRateDetails from "@/components/dashboard/forms/shippingRate-details";

export const columns: ColumnDef<CountryWithShippingRatesType>[] = [
  {
    accessorKey: "countryName",
    header: "Country",
    cell: ({ row }) => {
      return <span>{row.original.countryName}</span>;
    },
  },
  {
    accessorKey: "shippingService",
    header: "Shipping service",
    cell: ({ row }) => {
      return (
        <span>{row.original.shippingRate?.shippingService || "Default"}</span>
      );
    },
  },
  {
    accessorKey: "shippingFeePerItem",
    header: "Shipping Fee per item",
    cell: ({ row }) => {
      const value = row.original.shippingRate?.shippingFeePerItem;
      return (
        <span>{value === 0 ? "Free" : value > 0 ? value : "Default"}</span>
      );
    },
  },
  {
    accessorKey: "shippingFeeForAdditionalItem",
    header: "Shipping Fee for additional item",
    cell: ({ row }) => {
      const value = row.original.shippingRate?.shippingFeeForAdditionalItem;

      return (
        <span>
          <span>{value === 0 ? "Free" : value > 0 ? value : "Default"}</span>
        </span>
      );
    },
  },
  {
    accessorKey: "shippingFeePerKg",
    header: "Shipping Fee per Kg",
    cell: ({ row }) => {
      const value = row.original.shippingRate?.shippingFeePerKg;

      return (
        <span>
          <span>{value === 0 ? "Free" : value > 0 ? value : "Default"}</span>
        </span>
      );
    },
  },
  {
    accessorKey: "shippingFeeFixed",
    header: "Shipping Fee fixed",
    cell: ({ row }) => {
      const value = row.original.shippingRate?.shippingFeeFixed;

      return (
        <span>
          <span>{value === 0 ? "Free" : value > 0 ? value : "Default"}</span>
        </span>
      );
    },
  },
  {
    accessorKey: "deliveryTimeMin",
    header: "Delivery min days",
    cell: ({ row }) => {
      return (
        <span>
          {row.original.shippingRate?.deliveryTimeMin
            ? `${row.original.shippingRate?.deliveryTimeMin}`
            : "Default"}
        </span>
      );
    },
  },
  {
    accessorKey: "deliveryTimeMax",
    header: "Delivery max days",
    cell: ({ row }) => {
      return (
        <span>
          {row.original.shippingRate?.deliveryTimeMax
            ? `${row.original.shippingRate?.deliveryTimeMax}`
            : "Default"}
        </span>
      );
    },
  },
  {
    accessorKey: "returnPolicy",
    header: "Return policy",
    cell: ({ row }) => {
      return (
        <span>
          {row.original.shippingRate?.returnPolicy
            ? `${row.original.shippingRate?.returnPolicy}`
            : "Default"}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const rowData = row.original;

      return <CellActions rowData={rowData} />;
    },
  },
];

interface CellActionsProps {
  rowData: CountryWithShippingRatesType;
}

const CellActions: React.FC<CellActionsProps> = ({ rowData }) => {
  const { setOpen } = useModal();
  const params = useParams<{ storeUrl: string }>();
  if (!params) return null;
  if (!rowData) return null;

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => {
              setOpen(
                <CustomModal>
                  <ShippingRateDetails
                    data={rowData}
                    storeUrl={params.storeUrl}
                  />
                </CustomModal>
              );
            }}
          >
            <Edit size={15} />
            Edit Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </AlertDialog>
  );
};
