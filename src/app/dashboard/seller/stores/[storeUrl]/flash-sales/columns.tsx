"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/providers/modal-provider";
import { Edit, MoreHorizontal, Trash, Play, Pause } from "lucide-react";
import {
  deleteFlashSale,
  getFlashSale,
  toggleFlashSaleStatus,
} from "@/queries/flash-sale";
import { ColumnDef } from "@tanstack/react-table";
import { FlashSale } from "@prisma/client";
import { toast } from "sonner";
import FlashSaleDetails from "@/components/dashboard/forms/flash-sale-details";
import CustomModal from "@/components/shared/custom-modal";
import CountdownTimer from "@/components/shared/countdown-timer";

// Define the extended type with relations
type FlashSaleWithRelations = FlashSale & {
  store: {
    id: string;
    name: string;
    url: string;
  };
  products: Array<{
    product: {
      id: string;
      name: string;
    };
  }>;
};

export const columns: ColumnDef<FlashSaleWithRelations>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const flashSale = row.original;
      return (
        <div className="flex items-center gap-2">
          <div>
            <span className="font-semibold">{flashSale.name}</span>
            {flashSale.featured && (
              <Badge variant="secondary" className="ml-2 text-xs">
                FEATURED
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  // {
  //   accessorKey: "store",
  //   header: "Store",
  //   cell: ({ row }) => {
  //     const store = row.original.store;
  //     return (
  //       <div className="flex items-center gap-2">
  //         <span className="font-medium">{store?.name}</span>
  //         <Badge variant="outline" className="text-xs">
  //           {store?.url}
  //         </Badge>
  //       </div>
  //     );
  //   },
  // },
  {
    accessorKey: "discount",
    header: "Discount",
    cell: ({ row }) => {
      const flashSale = row.original;
      const discountText =
        flashSale.discountType === "PERCENTAGE"
          ? `${flashSale.discountValue}% OFF`
          : `$${flashSale.discountValue} OFF`;

      return (
        <Badge variant="destructive" className="font-semibold">
          {discountText}
        </Badge>
      );
    },
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ row }) => {
      const productCount = row.original.products?.length || 0;
      return (
        <div className="text-center">
          <span className="font-semibold">{productCount}</span>
          <p className="text-xs text-muted-foreground">products</p>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const flashSale = row.original;
      const now = new Date();
      const isActive =
        flashSale.isActive &&
        flashSale.startDate <= now &&
        flashSale.endDate > now;

      return (
        <div className="flex items-center gap-2">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-green-500" : ""}
          >
            {isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
          {isActive && (
            <CountdownTimer
              endDate={flashSale.endDate}
              variant="minimal"
              className="text-xs text-muted-foreground"
            />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "dates",
    header: "Duration",
    cell: ({ row }) => {
      const flashSale = row.original;
      return (
        <div className="text-sm">
          <div className="font-medium">
            {format(new Date(flashSale.startDate), "MMM dd, HH:mm")}
          </div>
          <div className="text-muted-foreground">
            to {format(new Date(flashSale.endDate), "MMM dd, HH:mm")}
          </div>
        </div>
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
  rowData: FlashSaleWithRelations;
}

const CellActions: React.FC<CellActionsProps> = ({ rowData }) => {
  const { setOpen, setClose } = useModal();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const storeUrl = rowData.store.url;

  if (!rowData || !rowData.id) return null;

  const handleToggleStatus = async () => {
    try {
      setLoading(true);
      await toggleFlashSaleStatus(rowData.id);
      toast.success("Flash sale status updated!");
      router.refresh();
    } catch (error: any) {
      toast.error("Error updating status:", {
        description: error.toString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteFlashSale(rowData.id);
      toast.success("Flash sale deleted successfully!");
      router.refresh();
      setClose();
    } catch (error: any) {
      toast.error("Error deleting flash sale:", {
        description: error.toString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const isActive =
    rowData.isActive && rowData.startDate <= now && rowData.endDate > now;

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
                  <FlashSaleDetails
                    data={{
                      ...rowData,
                      products:
                        rowData.products?.map((p) => ({
                          productId: p.product.id,
                          customDiscountValue: undefined,
                          customMaxDiscount: undefined,
                        })) || [],
                    }}
                    storeUrl={storeUrl}
                  />
                </CustomModal>,
                async () => {
                  return {
                    rowData: await getFlashSale(rowData?.id),
                  };
                }
              );
            }}
          >
            <Edit size={15} />
            Edit Details
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex gap-2"
            onClick={handleToggleStatus}
            disabled={loading}
          >
            {isActive ? <Pause size={15} /> : <Play size={15} />}
            {isActive ? "Pause" : "Activate"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="flex gap-2 text-red-600">
              <Trash size={15} /> Delete Flash Sale
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This action cannot be undone. This will permanently delete the flash
            sale and remove all associated product discounts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center">
          <AlertDialogCancel className="mb-2">Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-destructive hover:bg-destructive mb-2 text-white"
            onClick={handleDelete}
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
