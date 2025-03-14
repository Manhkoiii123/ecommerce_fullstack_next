"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Store, SubCategory } from "@prisma/client";
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
import { ProductFormSchema } from "@/lib/schemas";
import { WithOutContext as ReactTags } from "react-tag-input";
import { ProductWithVariantType } from "@/lib/types";
import ImagesPreviewGrid from "@/components/dashboard/shared/images-preview-grid";
import ClickToAddInputs from "@/components/dashboard/forms/click-to-add";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllCategoriesForCategory } from "@/queries/subCategories";
import { toast } from "sonner";
import { upsertProduct } from "@/queries/product";
import { v4 } from "uuid";
import { format } from "date-fns";
import { ArrowRight, Dot } from "lucide-react";
import DateTimePicker from "react-datetime-picker";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JoditEditor from "jodit-react";
import { useTheme } from "next-themes";
import { NumberInput } from "@tremor/react";
interface Keyword {
  id: string;
  text: string;
}
interface StoreDetailsProps {
  data?: Partial<ProductWithVariantType>;
  categories: Category[];
  storeUrl: string;
}

const ProductDetails: FC<StoreDetailsProps> = ({
  data,
  categories,
  storeUrl,
}) => {
  const router = useRouter();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [images, setImages] = useState<{ url: string }[]>([]);
  const [colors, setColors] = useState<{ color: string }[]>(
    data?.colors || [{ color: "" }]
  );
  const [sizes, setSizes] = useState<
    { size: string; price: number; quantity: number; discount: number }[]
  >(data?.sizes || [{ size: "", price: 1, quantity: 0.01, discount: 0 }]);

  const [productSpecs, setProductSpecs] = useState<
    { name: string; value: string }[]
  >(data?.product_specs || [{ name: "", value: "" }]);
  const [questions, setQuestions] = useState<
    { question: string; answer: string }[]
  >(data?.questions || [{ question: "", answer: "" }]);

  const [variantSpecs, setVariantSpecs] = useState<
    { name: string; value: string }[]
  >(data?.variant_specs || [{ name: "", value: "" }]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const handleAddition = (keyword: Keyword) => {
    if (keywords.length === 10) return;
    setKeywords([...keywords, keyword.text]);
  };
  const handleDeleteKeyword = (i: number) => {
    setKeywords(keywords.filter((_, index) => index !== i));
  };
  const productDescEditor = useRef(null);
  const variantDescEditor = useRef(null);
  const { theme } = useTheme();

  const config = useMemo(
    () => ({
      theme: theme === "dark" ? "dark" : "default",
    }),
    [theme]
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
      variantImage: data?.variantImage ? [{ url: data.variantImage }] : [],
      subCategoryId: data?.subCategoryId,
      categoryId: data?.categoryId,
      brand: data?.brand,
      sku: data?.sku,
      colors: data?.colors || [{ color: "" }],
      sizes: data?.sizes,
      keywords: data?.keywords,
      isSale: data?.isSale || false,
      saleEndDate:
        data?.saleEndDate || format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      product_specs: data?.product_specs,
      variant_specs: data?.variant_specs,
      questions: data?.questions,
      weight: data?.weight,
    },
  });
  useEffect(() => {
    const getSubCategories = async () => {
      const res = await getAllCategoriesForCategory(form.watch().categoryId);
      setSubCategories(res);
    };
    getSubCategories();
  }, [form.watch().categoryId]);
  const isLoading = form.formState.isSubmitting;
  const errors = form.formState.errors;

  useEffect(() => {
    if (data) {
      form.reset({
        ...data,
        variantImage: data.variantImage ? [{ url: data.variantImage }] : [],
      });
    }
  }, [data, form]);
  const saleEndDate = form.getValues().saleEndDate || new Date().toISOString();
  const formattedDate = new Date(saleEndDate).toLocaleString("en-Us", {
    weekday: "short", // Abbreviated day name (e.g., "Mon")
    month: "long", // Abbreviated month name (e.g., "Nov")
    day: "2-digit", // Two-digit day (e.g., "25")
    year: "numeric", // Full year (e.g., "2024")
    hour: "2-digit", // Two-digit hour (e.g., "02")
    minute: "2-digit", // Two-digit minute (e.g., "30")
    second: "2-digit", // Two-digit second (optional)
    hour12: false, // 12-hour format (change to false for 24-hour format)
  });
  const handleSubmit = async (values: z.infer<typeof ProductFormSchema>) => {
    try {
      const response = await upsertProduct(
        {
          productId: data?.productId ? data.productId : v4(),
          variantId: data?.variantId ? data.variantId : v4(),
          name: values.name,
          description: values.description,
          variantName: values.variantName,
          variantImage: values.variantImage[0].url,
          variantDescription: values.variantDescription || "",
          images: values.images,
          categoryId: values.categoryId,
          subCategoryId: values.subCategoryId,
          isSale: values.isSale,
          brand: values.brand,
          sku: values.sku,
          colors: values.colors,
          sizes: values.sizes,
          keywords: values.keywords,
          createdAt: new Date(),
          updatedAt: new Date(),
          product_specs: values.product_specs,
          variant_specs: values.variant_specs,
          questions: values.questions,
          saleEndDate: values.saleEndDate,
          weight: values.weight,
        },
        storeUrl
      );
      toast(
        data?.productId && data?.variantId
          ? "Product has been updated."
          : `Congratulations! product is now created.`
      );
      if (data?.productId && data?.variantId) {
        router.refresh();
      } else {
        router.push(`/dashboard/seller/stores/${storeUrl}/products`);
        router.refresh();
      }
    } catch (error: any) {
      toast.error("Oops!", {
        description: error.toString(),
      });
    }
  };

  useEffect(() => {
    form.setValue("colors", colors);
    form.setValue("sizes", sizes);
    form.setValue("keywords", keywords);
    form.setValue("product_specs", productSpecs);
    form.setValue("variant_specs", variantSpecs);
    form.setValue("questions", questions);
  }, [colors, sizes, keywords, form, productSpecs, variantSpecs, questions]);

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
                <div className="flex-[2]">
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
                </div>

                <div className="w-full flex-1 flex flex-col gap-y-3 xl:pl-5">
                  <ClickToAddInputs
                    details={data?.colors || colors}
                    setDetails={setColors}
                    initialDetail={{ color: "" }}
                    header="Colors"
                    colorPicker
                  />
                  {errors.colors && (
                    <span className="text-sm font-medium text-destructive">
                      {errors.colors.message}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col lg:flex-row gap-4">
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Product name</FormLabel>
                      <FormControl>
                        <Input placeholder="Product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="variantName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Variant name</FormLabel>
                      <FormControl>
                        <Input placeholder="Variant name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* desc prodcut and variant */}
              <Tabs
                // defaultValue={isNewVariantPage ? "variant" : "product"}
                defaultValue={"product"}
                className="w-full"
              >
                {/* {!isNewVariantPage && ( */}
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="product">Product description</TabsTrigger>
                  <TabsTrigger value="variant">Variant description</TabsTrigger>
                </TabsList>
                {/* )} */}
                <TabsContent value="product">
                  <FormField
                    disabled={isLoading}
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Product description</FormLabel>
                        <FormControl>
                          <JoditEditor
                            ref={productDescEditor}
                            config={config}
                            value={form.getValues().description}
                            onChange={(content) => {
                              form.setValue("description", content);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="variant">
                  <FormField
                    disabled={isLoading}
                    control={form.control}
                    name="variantDescription"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Variant description</FormLabel>
                        <FormControl>
                          <JoditEditor
                            ref={variantDescEditor}
                            config={config}
                            value={form.getValues().variantDescription || ""}
                            onChange={(content) => {
                              form.setValue("variantDescription", content);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {/* category - sub category */}
              <div className="flex flex-col lg:flex-row gap-4">
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Product Category</FormLabel>
                      <Select
                        disabled={isLoading || categories.length == 0}
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              defaultValue={field.value}
                              placeholder="Select a category"
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("categoryId") && (
                  <FormField
                    disabled={isLoading}
                    control={form.control}
                    name="subCategoryId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Product subcategory</FormLabel>
                        <Select
                          disabled={isLoading || categories.length == 0}
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                defaultValue={field.value}
                                placeholder="Select a subcategory"
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subCategories.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Product brand</FormLabel>
                      <FormControl>
                        <Input placeholder="Product brand" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Product sku</FormLabel>
                      <FormControl>
                        <Input placeholder="Product sku" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Product weight</FormLabel>
                      <FormControl>
                        <NumberInput
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          placeholder="Product weight"
                          min={0.01}
                          step={0.01}
                          className="!shadow-none rounded-md !text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-10 py-14">
                {/* Variant image */}
                <div className="border-r pr-10">
                  <FormField
                    control={form.control}
                    name="variantImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="ml-14">Variant Image</FormLabel>
                        <FormControl>
                          <ImageUpload
                            dontShowPreview
                            type="profile"
                            value={field.value.map((image) => image.url)}
                            disabled={isLoading}
                            onChange={(url) => field.onChange([{ url }])}
                            onRemove={(url) =>
                              field.onChange([
                                ...field.value.filter(
                                  (current) => current.url !== url
                                ),
                              ])
                            }
                          />
                        </FormControl>
                        <FormMessage className="!mt-4" />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Keywords */}
                <div className="w-full flex-1 space-y-3">
                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem className="relative flex-1">
                        <FormLabel>Product Keywords</FormLabel>
                        <FormControl>
                          <ReactTags
                            handleAddition={handleAddition}
                            handleDelete={() => {}}
                            placeholder="Keywords (e.g., winter jacket, warm, stylish)"
                            classNames={{
                              tagInputField:
                                "bg-background border rounded-md p-2 w-full focus:outline-none",
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-wrap gap-1">
                    {keywords.map((k, i) => (
                      <div
                        key={i}
                        className="text-xs inline-flex items-center px-3 py-1 bg-blue-200 text-blue-700 rounded-full gap-x-2"
                      >
                        <span>{k}</span>
                        <span
                          className="cursor-pointer"
                          onClick={() => handleDeleteKeyword(i)}
                        >
                          x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* size */}
              <div className="w-full flex flex-col gap-y-3 xl:pl-5">
                <ClickToAddInputs
                  details={data?.sizes || sizes}
                  setDetails={setSizes}
                  initialDetail={{
                    size: "",
                    price: 1,
                    quantity: 0.01,
                    discount: 0,
                  }}
                  header="Sizes, Prices, Quantities, Discounts"
                />
                {errors.sizes && (
                  <span className="text-sm font-medium text-destructive">
                    {errors.sizes.message}
                  </span>
                )}
              </div>
              {/* product and variant specs */}
              <div className="w-full flex flex-col gap-y-3 xl:pl-5">
                <Tabs
                  // defaultValue={
                  //   isNewVariantPage ? "variantSpecs" : "productSpecs"
                  // }
                  defaultValue={"productSpecs"}
                  className="w-full"
                >
                  {/* {!isNewVariantPage && ( */}
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="productSpecs">
                      Product Specifications
                    </TabsTrigger>
                    <TabsTrigger value="variantSpecs">
                      Variant Specifications
                    </TabsTrigger>
                  </TabsList>
                  {/* )} */}
                  <TabsContent value="productSpecs">
                    <div className="w-full flex flex-col gap-y-3">
                      <ClickToAddInputs
                        details={productSpecs}
                        setDetails={setProductSpecs}
                        initialDetail={{
                          name: "",
                          value: "",
                        }}
                        containerClassName="flex-1"
                        inputClassName="w-full"
                      />
                      {errors.product_specs && (
                        <span className="text-sm font-medium text-destructive">
                          {errors.product_specs.message}
                        </span>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="variantSpecs">
                    <div className="w-full flex flex-col gap-y-3">
                      <ClickToAddInputs
                        details={variantSpecs}
                        setDetails={setVariantSpecs}
                        initialDetail={{
                          name: "",
                          value: "",
                        }}
                        containerClassName="flex-1"
                        inputClassName="w-full"
                      />
                      {errors.variant_specs && (
                        <span className="text-sm font-medium text-destructive">
                          {errors.variant_specs.message}
                        </span>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/*  question */}
              <div className="w-full flex flex-col gap-y-3">
                <ClickToAddInputs
                  details={questions}
                  setDetails={setQuestions}
                  initialDetail={{
                    question: "",
                    answer: "",
                  }}
                  containerClassName="flex-1"
                  inputClassName="w-full"
                  header="Questions"
                />
                {errors.questions && (
                  <span className="text-sm font-medium text-destructive">
                    {errors.questions.message}
                  </span>
                )}
              </div>
              {/* is sale */}
              <div className="flex border rounded-md">
                <FormField
                  control={form.control}
                  name="isSale"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          // @ts-ignore
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>On Sale</FormLabel>
                        <FormDescription>
                          Is this product on sale?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                {form.getValues().isSale && (
                  <div className="mt-5 w-full">
                    <p className="text-sm text-main-secondary dark:text-gray-400 pb-3 flex">
                      <Dot className="-me-1" />
                      When sale does end ?
                    </p>
                    <div className="flex items-center gap-x-5">
                      <FormField
                        control={form.control}
                        name="saleEndDate"
                        render={({ field }) => (
                          <FormItem className="ml-4">
                            <FormControl>
                              <DateTimePicker
                                className="inline-flex items-center gap-2 p-2 border rounded-md shadow-sm"
                                calendarIcon={
                                  <span className="text-gray-500 hover:text-gray-600">
                                    📅
                                  </span>
                                }
                                clearIcon={
                                  <span className="text-gray-500 hover:text-gray-600">
                                    ✖️
                                  </span>
                                }
                                onChange={(date) => {
                                  field.onChange(
                                    date
                                      ? format(date, "yyyy-MM-dd'T'HH:mm:ss")
                                      : ""
                                  );
                                }}
                                value={
                                  field.value ? new Date(field.value) : null
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <ArrowRight className="w-4 text-[#1087ff]" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                )}
              </div>

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
