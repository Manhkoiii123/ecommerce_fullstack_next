"use client";

import { FC, useEffect } from "react";

import { Coupon } from "@prisma/client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { format } from "date-fns";
import { NumberInput } from "@tremor/react";

import DateTimePicker from "react-datetime-picker";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import { CouponFormSchema } from "@/lib/schemas";
import { toast } from "sonner";
import { upsertCoupon } from "@/queries/coupons";

interface CouponDetailsProps {
  data?: Coupon;
  storeUrl: string;
}

const CouponDetails: FC<CouponDetailsProps> = ({ data, storeUrl }) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof CouponFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(CouponFormSchema),
    defaultValues: {
      code: data?.code,
      discount: data?.discount,
      startDate: data?.startDate || format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: data?.endDate || format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    },
  });

  const isLoading = form.formState.isSubmitting;

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const handleSubmit = async (values: z.infer<typeof CouponFormSchema>) => {
    try {
      const response = await upsertCoupon(
        {
          id: data?.id ? data.id : v4(),
          code: values.code,
          discount: values.discount,
          startDate: values.startDate,
          endDate: values.endDate,
          storeId: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        storeUrl
      );
      toast(
        data?.id
          ? "Coupon has been updated."
          : `Congratulations! '${response?.code}' is now created.`
      );
      if (data?.id) {
        router.refresh();
      } else {
        router.push(`/dashboard/seller/stores/${storeUrl}/coupons`);
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
          <CardTitle>Coupon Information</CardTitle>
          <CardDescription>
            {data?.id
              ? `Update ${data?.code} coupon information.`
              : " Lets create a coupon. You can edit coupon later from the coupons table or the coupon page."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                disabled={isLoading}
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Coupon code</FormLabel>
                    <FormControl>
                      <Input placeholder="Coupon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={isLoading}
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Coupon discount</FormLabel>
                    <FormControl>
                      <NumberInput
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder="%"
                        min={1}
                        className="!shadow-none rounded-md !text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={isLoading}
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        onChange={(date) => {
                          field.onChange(
                            date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : ""
                          );
                        }}
                        value={field.value ? new Date(field.value) : null}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={isLoading}
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        onChange={(date) => {
                          field.onChange(
                            date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : ""
                          );
                        }}
                        value={field.value ? new Date(field.value) : null}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "loading..."
                  : data?.id
                  ? "Save coupon information"
                  : "Create coupon"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AlertDialog>
  );
};

export default CouponDetails;
