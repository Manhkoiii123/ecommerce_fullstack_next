"use client";

import { FC, useEffect } from "react";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ShippingRateFormSchema } from "@/lib/schemas";

import { AlertDialog } from "@/components/ui/alert-dialog";
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

import { v4 } from "uuid";
import { useRouter } from "next/navigation";
import { CountryWithShippingRatesType } from "@/lib/types";
import { NumberInput } from "@tremor/react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { upsertShippingRate } from "@/queries/store";

interface ShippingRateDetailsProps {
  data?: CountryWithShippingRatesType;
  storeUrl: string;
}

const ShippingRateDetails: FC<ShippingRateDetailsProps> = ({
  data,
  storeUrl,
}) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof ShippingRateFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(ShippingRateFormSchema),
    defaultValues: {
      countryId: data?.countryId,
      countryName: data?.countryName,
      shippingService: data?.shippingRate
        ? data?.shippingRate.shippingService
        : "",
      shippingFeePerItem: data?.shippingRate
        ? data?.shippingRate.shippingFeePerItem
        : 0,
      shippingFeeForAdditionalItem: data?.shippingRate
        ? data?.shippingRate.shippingFeeForAdditionalItem
        : 0,
      shippingFeePerKg: data?.shippingRate
        ? data?.shippingRate.shippingFeePerKg
        : 0,
      shippingFeeFixed: data?.shippingRate
        ? data?.shippingRate.shippingFeeFixed
        : 0,
      deliveryTimeMin: data?.shippingRate
        ? data?.shippingRate.deliveryTimeMin
        : 1,
      deliveryTimeMax: data?.shippingRate
        ? data?.shippingRate.deliveryTimeMax
        : 1,
      returnPolicy: data?.shippingRate ? data.shippingRate.returnPolicy : "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const handleSubmit = async (
    values: z.infer<typeof ShippingRateFormSchema>
  ) => {
    try {
      const response = await upsertShippingRate(storeUrl, {
        id: data?.shippingRate ? data.shippingRate.id : v4(),
        countryId: data?.countryId ? data.countryId : "",
        shippingService: values.shippingService,
        shippingFeePerItem: values.shippingFeePerItem,
        shippingFeeForAdditionalItem: values.shippingFeeForAdditionalItem,
        shippingFeePerKg: values.shippingFeePerKg,
        shippingFeeFixed: values.shippingFeeFixed,
        deliveryTimeMin: values.deliveryTimeMin,
        deliveryTimeMax: values.deliveryTimeMax,
        returnPolicy: values.returnPolicy,
        // gửi lên rỗng để phía be update khi tìm store qua url => chứ ở đây ko lấy được id của store
        storeId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if (response.id) {
        toast("Shipping rates updated sucessfully !");
        router.refresh();
      }
    } catch (error: any) {
      toast.error("Oops!", {
        description: error.toString(),
      });
    }
  };

  return (
    <AlertDialog>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Shipping Rate</CardTitle>
          <CardDescription>
            Update Shipping rate information for {data?.countryName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="hidden">
                <FormField
                  disabled
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem className="flex-1 ">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  disabled
                  control={form.control}
                  name="countryName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="shippingService"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...field} placeholder="Shipping service" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="shippingFeePerItem"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Shipping fee per item</FormLabel>
                      <FormControl>
                        <NumberInput
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          step={0.1}
                          min={0}
                          className="pl-2 !shadow-none rounded-md"
                          placeholder="Shipping fee per item"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="shippingFeeForAdditionalItem"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Shipping fee for additional item</FormLabel>
                      <FormControl>
                        <NumberInput
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          step={0.1}
                          min={0}
                          className="pl-2 !shadow-none rounded-md"
                          placeholder="Shipping fee per item"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="shippingFeePerKg"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Shipping fee per kg</FormLabel>
                      <FormControl>
                        <NumberInput
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          step={0.1}
                          min={0}
                          className="pl-2 !shadow-none rounded-md"
                          placeholder="Shipping fee per kg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="shippingFeeFixed"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Fixed Shipping fee</FormLabel>
                      <FormControl>
                        <NumberInput
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          step={0.1}
                          min={0}
                          className="pl-2 !shadow-none rounded-md"
                          placeholder="Fixed shipping fee"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="deliveryTimeMin"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Delivery time min </FormLabel>
                      <FormControl>
                        <NumberInput
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          min={1}
                          className="pl-2 !shadow-none rounded-md"
                          placeholder="Minimum Delivery time (days)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="deliveryTimeMax"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Delivery time max </FormLabel>
                      <FormControl>
                        <NumberInput
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          min={1}
                          className="pl-2 !shadow-none rounded-md"
                          placeholder="Maximum Delivery time (days)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="returnPolicy"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Return policy</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What's the return policy for your store ?"
                          className="p-4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "loading..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AlertDialog>
  );
};

export default ShippingRateDetails;
