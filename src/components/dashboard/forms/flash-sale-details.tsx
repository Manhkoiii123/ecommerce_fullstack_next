"use client";

import { FC, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { FlashSale } from "@prisma/client";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FlashSaleFormSchema } from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { upsertFlashSale } from "@/queries/flash-sale";
import { getStorePageDetails } from "@/queries/store";
import { getProducts } from "@/queries/product";
import { v4 } from "uuid";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarIcon, Flame, Plus, X, Store, Package } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FlashSaleDetailsProps {
  data?: FlashSaleWithProducts;
  storeUrl: string;
}

interface Store {
  id: string;
  name: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  rating: number;
  sales: number;
  numReviews: number;
  variants: Array<{
    variantId: string;
    variantSlug: string;
    variantName: string;
    images: any[];
    sizes: Array<{
      id: string;
      price: number;
      discount: number;
    }>;
  }>;
  variantImages: any[];
}

// Extended FlashSale type with products relation
type FlashSaleWithProducts = FlashSale & {
  products: Array<{
    productId: string;
    customDiscountValue?: number;
    customMaxDiscount?: number;
  }>;
};

const FlashSaleDetails: FC<FlashSaleDetailsProps> = ({ data, storeUrl }) => {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [customDiscounts, setCustomDiscounts] = useState<
    Array<{
      productId: string;
      customDiscountValue?: number;
      customMaxDiscount?: number;
    }>
  >([]);

  const isInitialized = useRef(false);
  const hasFetchedData = useRef(false);

  const form = useForm<z.infer<typeof FlashSaleFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(FlashSaleFormSchema),
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      startDate: data?.startDate ? new Date(data.startDate) : new Date(),
      endDate: data?.endDate
        ? new Date(data.endDate)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: data?.isActive || false,
      featured: data?.featured || false,
      discountType: data?.discountType || "PERCENTAGE",
      discountValue: data?.discountValue || 0,
      maxDiscount: data?.maxDiscount || undefined,
      storeId: data?.storeId || "",
      productIds: data?.products?.map((p) => p.productId) || [],
      customDiscounts: [],
    },
  });

  const isLoading = form.formState.isSubmitting;

  // Memoize products to prevent unnecessary re-renders
  const memoizedProducts = useMemo(() => products, [products]);

  const fetchData = useCallback(async () => {
    if (hasFetchedData.current) return;

    try {
      // Get store info and products from the specific storeUrl
      const storeData = await getStorePageDetails(storeUrl);
      const productsData = await getProducts({ store: storeUrl });

      if (storeData) {
        setStore({ id: storeData.id, name: storeData.name, url: storeUrl });
        // Always set storeId when we have store data
        form.setValue("storeId", storeData.id);
      }

      if (productsData && productsData.products) {
        setProducts(productsData.products);
      }

      hasFetchedData.current = true;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [storeUrl, form]);

  useEffect(() => {
    if (!hasFetchedData.current) {
      fetchData();
    }
  }, [fetchData]);

  // Sync selectedProducts with form field - only when they actually change
  useEffect(() => {
    const currentProductIds = form.getValues("productIds");
    if (
      JSON.stringify(selectedProducts) !== JSON.stringify(currentProductIds)
    ) {
      form.setValue("productIds", selectedProducts);
    }
  }, [selectedProducts, form]);

  // Sync customDiscounts with form field - only when they actually change
  useEffect(() => {
    const currentCustomDiscounts = form.getValues("customDiscounts");
    if (
      JSON.stringify(customDiscounts) !== JSON.stringify(currentCustomDiscounts)
    ) {
      form.setValue("customDiscounts", customDiscounts);
    }
  }, [customDiscounts, form]);

  useEffect(() => {
    if (data && !isInitialized.current) {
      const productIds = data.products?.map((p) => p.productId) || [];
      const customDiscountsData =
        data.products?.map((p) => ({
          productId: p.productId,
          customDiscountValue: p.customDiscountValue || undefined,
          customMaxDiscount: p.customMaxDiscount || undefined,
        })) || [];

      // Set local state first
      setSelectedProducts(productIds);
      setCustomDiscounts(customDiscountsData);

      // Then reset form
      form.reset({
        name: data.name,
        description: data.description ?? undefined,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive,
        featured: data.featured,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscount: data.maxDiscount ?? undefined,
        storeId: data.storeId,
        productIds: productIds,
        customDiscounts: customDiscountsData,
      });

      isInitialized.current = true;
    }
  }, [data]); // Remove form dependency to prevent re-renders

  const handleProductToggle = useCallback(
    (productId: string) => {
      setSelectedProducts((prev) => {
        if (prev.includes(productId)) {
          // Remove product and its custom discount
          setCustomDiscounts((prevDiscounts) =>
            prevDiscounts.filter((d) => d.productId !== productId)
          );
          const newSelectedProducts = prev.filter((id) => id !== productId);
          // Update form field
          form.setValue("productIds", newSelectedProducts);
          return newSelectedProducts;
        } else {
          // Add product
          const newSelectedProducts = [...prev, productId];
          // Update form field
          form.setValue("productIds", newSelectedProducts);
          return newSelectedProducts;
        }
      });
    },
    [form]
  );

  const handleCustomDiscountChange = useCallback(
    (
      productId: string,
      field: "customDiscountValue" | "customMaxDiscount",
      value: number | undefined
    ) => {
      setCustomDiscounts((prev) => {
        const existing = prev.find((d) => d.productId === productId);
        if (existing) {
          return prev.map((d) =>
            d.productId === productId ? { ...d, [field]: value } : d
          );
        } else {
          return [...prev, { productId, [field]: value }];
        }
      });
    },
    []
  );

  const handleSubmit = async (values: z.infer<typeof FlashSaleFormSchema>) => {
    try {
      // Validate required fields
      if (!store?.id && !values.storeId) {
        throw new Error("Store ID is required");
      }

      if (selectedProducts.length === 0) {
        throw new Error("Please select at least one product");
      }

      const response = await upsertFlashSale({
        id: data?.id ? data.id : v4(),
        name: values.name,
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate,
        isActive: values.isActive,
        featured: values.featured,
        discountType: values.discountType,
        discountValue: values.discountValue,
        maxDiscount: values.maxDiscount,
        storeId: store?.id || values.storeId,
        productIds: selectedProducts,
        customDiscounts: customDiscounts,
      });

      toast(
        data?.id
          ? "Flash sale has been updated successfully!"
          : `Flash sale '${response?.name}' created successfully!`
      );

      if (data?.id) {
        router.refresh();
      } else {
        router.push("/dashboard/seller");
        router.refresh();
      }
    } catch (error: any) {
      toast.error("Error!", {
        description: error.toString(),
      });
    }
  };

  const getSelectedProduct = (productId: string) => {
    return products.find((p) => p.id === productId);
  };

  return (
    <DialogContent className="max-w-6xl h-[95vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-500" />
          {data?.id ? "Edit Flash Sale" : "Create New Flash Sale"}
        </DialogTitle>
        <DialogDescription>
          Set up a time-limited sale to boost your product sales with urgency
        </DialogDescription>
      </DialogHeader>
      <div className="p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flash Sale Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Black Friday Blitz"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store *</FormLabel>
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                      <Store className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">
                        {store?.name || "Loading store..."}
                      </span>
                    </div>
                    <input type="hidden" {...field} />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your flash sale to attract customers..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date & Time Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date & Time *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP 'at' HH:mm")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date & Time *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP 'at' HH:mm")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date <= (form.getValues("startDate") || new Date())
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Discount Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Discount Configuration</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">
                            Percentage (%)
                          </SelectItem>
                          <SelectItem value="FIXED_AMOUNT">
                            Fixed Amount ($)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("discountType") === "PERCENTAGE"
                          ? "Discount % *"
                          : "Discount Amount *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={
                            form.watch("discountType") === "PERCENTAGE"
                              ? "25"
                              : "10.00"
                          }
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("discountType") === "FIXED_AMOUNT" && (
                  <FormField
                    control={form.control}
                    name="maxDiscount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Discount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                parseFloat(e.target.value) || undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Status Settings */}
            <div className="flex items-center space-x-6">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable this flash sale immediately
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Highlight this sale prominently
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Product Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Products</h3>
                <span className="text-sm text-muted-foreground">
                  {selectedProducts.length} products selected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                {memoizedProducts.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  const customDiscount = customDiscounts.find(
                    (d) => d.productId === product.id
                  );

                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "border rounded-lg p-3 transition-all",
                        isSelected
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            handleProductToggle(product.id);
                          }}
                          className="cursor-pointer z-10 relative"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {product.variants.length} variants
                          </p>

                          {isSelected && (
                            <div className="mt-2 space-y-2">
                              <Separator />
                              <div className="text-xs">
                                <p className="font-medium text-red-600">
                                  Custom Discount (Optional):
                                </p>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  <Input
                                    type="number"
                                    placeholder="Override %"
                                    size={1}
                                    value={
                                      customDiscount?.customDiscountValue || ""
                                    }
                                    onChange={(e) =>
                                      handleCustomDiscountChange(
                                        product.id,
                                        "customDiscountValue",
                                        parseFloat(e.target.value) || undefined
                                      )
                                    }
                                  />
                                  {form.watch("discountType") ===
                                    "FIXED_AMOUNT" && (
                                    <Input
                                      type="number"
                                      placeholder="Max $"
                                      size={1}
                                      value={
                                        customDiscount?.customMaxDiscount || ""
                                      }
                                      onChange={(e) =>
                                        handleCustomDiscountChange(
                                          product.id,
                                          "customMaxDiscount",
                                          parseFloat(e.target.value) ||
                                            undefined
                                        )
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading
                  ? "Saving..."
                  : data?.id
                  ? "Update Flash Sale"
                  : "Create Flash Sale"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DialogContent>
  );
};

export default FlashSaleDetails;
