"use client";

import { FC, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Store } from "@prisma/client";
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
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "../shared/image-upload";
import { v4 } from "uuid";
import { toast } from "sonner";
import { ProductFormSchema } from "@/lib/schemas";
import { upsertStore } from "@/queries/store";
import { ProductWithVariantType } from "@/lib/types";
import ImagesPreviewGrid from "@/components/dashboard/shared/images-preview-grid";

interface StoreDetailsProps {
  data?: ProductWithVariantType;
  categories: Category[];
  storeUrl: string;
}

const ProductDetails: FC<StoreDetailsProps> = ({
  data,
  categories,
  storeUrl,
}) => {
  const router = useRouter();
  const [images, setImages] = useState<{ url: string }[]>([]);
  const [colors, setColors] = useState<{ color: string }[]>(
    data?.colors || [{ color: "" }]
  );
  const form = useForm<z.infer<typeof ProductFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: data?.name,
      description: data?.description,
      variantName: data?.variantName,
      variantDescription: data?.variantDescription,
      images: data?.images || [],
      subCategoryId: data?.subCategoryId,
      categoryId: data?.categoryId,
      brand: data?.brand,
      sku: data?.sku,
      colors: data?.colors || [{ color: "" }],
      sizes: data?.sizes,
      keywords: data?.keywords,
      isSale: data?.isSale || false,
    },
  });

  const isLoading = form.formState.isSubmitting;

  useEffect(() => {
    if (data) {
      form.reset({
        name: data?.name,
        description: data?.description,
        variantName: data?.variantName,
        variantDescription: data?.variantDescription,
        images: data?.images || [],
        subCategoryId: data?.subCategoryId,
        categoryId: data?.categoryId,
        brand: data?.brand,
        sku: data?.sku,
        colors: data?.colors,
        sizes: data?.sizes,
        keywords: data?.keywords || [],
        isSale: data?.isSale || false,
      });
    }
  }, [data, form]);

  const handleSubmit = async (values: z.infer<typeof ProductFormSchema>) => {
    // try {
    //   const response = await upsertStore({
    //     id: data?.id ? data.id : v4(),
    //     name: values.name,
    //     description: values.description,
    //     email: values.email,
    //     phone: values.phone,
    //     logo: values.logo[0].url,
    //     cover: values.cover[0].url,
    //     url: values.url,
    //     featured: values.featured,
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   });
    //   toast(
    //     data?.id
    //       ? "Store has been updated."
    //       : `Congratulations! Store is now created.`
    //   );
    //   if (data?.id) {
    //     router.refresh();
    //   } else {
    //     router.push(`/dashboard/seller/stores/${response?.url}`);
    //   }
    // } catch (error: any) {
    //   toast.error("Oops!", {
    //     description: error.toString(),
    //   });
    // }
  };

  return (
    <AlertDialog>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Product Infomation</CardTitle>
          <CardDescription>
            {data?.productId && data.variantId
              ? `Update ${data?.name} product information.`
              : " Lets create a product. You can edit product later from the product page."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="flex flex-col gap-6 xl:flex-row">
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem className="w-full xl:border-r">
                      <FormControl>
                        <>
                          <ImagesPreviewGrid
                            images={form.getValues().images}
                            onRemove={(url) => {
                              const updatedImages = images.filter(
                                (img) => img.url !== url
                              );
                              setImages(updatedImages);
                              field.onChange(updatedImages);
                            }}
                            colors={colors}
                            setColors={setColors}
                          />
                          <FormMessage className="!mt-4" />
                          <ImageUpload
                            type="standard"
                            dontShowPreview
                            value={field.value.map((image) => image.url)}
                            disabled={isLoading}
                            onChange={(url) =>
                              setImages((prev) => {
                                const update = [...prev, { url }];
                                field.onChange(update);
                                return update;
                              })
                            }
                            onRemove={(url) =>
                              field.onChange([
                                ...field.value.filter(
                                  (current) => current.url !== url
                                ),
                              ])
                            }
                          />
                        </>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="w-full flex flex-col gap-y-3 xl:pl-5"></div>
              </div>
              <FormField
                disabled={isLoading}
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Store name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={isLoading}
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Store description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "loading..."
                  : data?.productId && data.variantId
                  ? "Save product information"
                  : "Create product"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AlertDialog>
  );
};

export default ProductDetails;
