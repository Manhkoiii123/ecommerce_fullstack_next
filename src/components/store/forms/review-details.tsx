"use client";
import { AddReviewSchema } from "@/lib/schemas";
import {
  ProductVariantDataType,
  RatingStatisticsType,
  ReviewDetailsType,
  ReviewWithImage,
  VariantInfoType,
} from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import ReactStars from "react-rating-stars-component";
import Select from "@/components/store/ui/select";
import Input from "@/components/store/ui/input";
import { Button } from "@/components/store/ui/button";
import { PulseLoader } from "react-spinners";
import ImageUploadStore from "@/components/store/shared/upload-images";
import { upsertReview } from "@/queries/review";
import { v4 } from "uuid";
import { useReviewPermission } from "@/hooks/use-review-permission";
const ReviewDetails = ({
  productId,
  data,
  variantsInfo,
  setReviews,
  reviews,
  setAverageRating,
  setStatistics,
}: {
  productId: string;
  data?: ReviewDetailsType;
  variantsInfo: VariantInfoType[];
  setReviews: React.Dispatch<React.SetStateAction<ReviewWithImage[]>>;
  reviews: ReviewWithImage[];
  setAverageRating: React.Dispatch<React.SetStateAction<number>>;
  setStatistics: React.Dispatch<React.SetStateAction<RatingStatisticsType>>;
}) => {
  const {
    canReview,
    isLoading: permissionLoading,
    message,
  } = useReviewPermission(productId);
  const [activeVariant, setActiveVariant] = useState<VariantInfoType>(
    variantsInfo[0]
  );
  const [images, setImages] = useState<{ url: string }[]>([]);
  const [sizes, setSizes] = useState<{ name: string; value: string }[]>([]);
  const form = useForm<z.infer<typeof AddReviewSchema>>({
    mode: "onChange",
    resolver: zodResolver(AddReviewSchema),
    defaultValues: {
      variantName: data?.variant || activeVariant.variantName,
      rating: data?.rating || 0,
      size: data?.size || "",
      review: data?.review || "",
      quantity: data?.quantity || undefined,
      images: data?.images || [],
      color: data?.color,
    },
  });
  const isLoading = form.formState.isSubmitting;
  const errors = form.formState.errors;

  const handleSubmit = async (values: z.infer<typeof AddReviewSchema>) => {
    try {
      const response = await upsertReview(productId, {
        id: data?.id || v4(),
        variant: values.variantName,
        images: values.images,
        quantity: values.quantity,
        rating: values.rating,
        review: values.review,
        size: values.size,
        color: values.color,
      });
      if (response.review.id) {
        const rev = reviews.filter((rev) => rev.id !== response.review.id);
        setReviews([...rev, response.review]);
        setStatistics(response.statistics);
        setAverageRating(response.rating);
        form.setValue("size", "");
        form.setValue("rating", 0);
        form.setValue("review", "");
        form.setValue("quantity", "");
        form.setValue("images", []);
        toast.success(response.message);
      }
    } catch (error: any) {
      toast.error(error.toString());
    }
  };
  const variants = variantsInfo.map((v) => ({
    name: v.variantName,
    value: v.variantName,
    image: v.variantImage,
    colors: v.colors.map((c) => c.name).join(","),
  }));

  useEffect(() => {
    form.setValue("size", "");
    const name = form.getValues().variantName;
    const variant = variantsInfo.find((v) => v.variantName === name);
    if (variant) {
      const sizes_data = variant.sizes.map((s) => ({
        name: s.size,
        value: s.size,
      }));
      setActiveVariant(variant);
      if (sizes) setSizes(sizes_data);
      form.setValue("color", variant.colors.map((c) => c.name).join(","));
      //   form.setValue("variantImage", variant.variantImage);
    }
  }, [form.getValues().variantName]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("quantity", e.target.value);
  };
  return (
    <div>
      <div className="p-4 bg-[#f5f5f5] rounded-xl">
        {/* Permission Check */}
        {permissionLoading ? (
          <div className="flex items-center justify-center py-8">
            <PulseLoader size={8} color="#11BE86" />
            <span className="ml-2 text-gray-600">
              Checking review permission...
            </span>
          </div>
        ) : !canReview ? (
          <div className="p-6 text-center">
            <div className="text-amber-600 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Review Not Available
            </h3>
            <p className="text-gray-600 mb-4">
              {message ||
                "You can only review products you have purchased, paid for, and received."}
            </p>
            <div className="text-sm text-gray-500 bg-gray-100 p-3 rounded-lg">
              <p>
                <strong>Requirements:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Product must be purchased</li>
                <li>Order must be paid</li>
                <li>Product must be shipped/delivered</li>
              </ul>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col space-y-4">
                {/* Title */}
                <div className="pt-4">
                  <h1 className="font-bold text-2xl">Add a review</h1>
                </div>
                {/* Form items */}
                <div className="flex flex-col gap-3">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-x-2">
                            <ReactStars
                              key={field.value}
                              count={5}
                              size={40}
                              color="#e2dfdf"
                              activeColor="#FFD804"
                              value={field.value}
                              onChange={field.onChange}
                              isHalf
                              edit={true}
                            />
                            <span>
                              ( {form.getValues().rating.toFixed(1)} out of 5.0)
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="w-full flex flex-wrap gap-4">
                    <div className="w-full sm:w-fit">
                      <FormField
                        control={form.control}
                        name="variantName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select
                                name={field.name}
                                value={field.value}
                                onChange={field.onChange}
                                options={variants}
                                placeholder="Select product"
                                subPlaceholder="Please select a product"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Select
                              name={field.name}
                              value={field.value}
                              onChange={field.onChange}
                              options={sizes}
                              placeholder="Select size"
                              subPlaceholder="Please select a size"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              name="quantity"
                              type="number"
                              placeholder="Quantity (Optional)"
                              onChange={handleInputChange}
                              value={field.value ? field.value.toString() : ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="review"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <textarea
                            className="min-h-32 p-4 w-full rounded-xl focus:outline-none ring-1 ring-[transparent] focus:ring-[#11BE86]"
                            placeholder="Write your review..."
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem className="w-full xl:border-r">
                        <FormControl>
                          <ImageUploadStore
                            value={field.value.map((image) => image.url)}
                            disabled={isLoading}
                            onChange={(url) => {
                              setImages((prevImages) => {
                                const updatedImages = [...prevImages, { url }];
                                if (updatedImages.length <= 3) {
                                  field.onChange(updatedImages);
                                  return updatedImages;
                                } else {
                                  return prevImages;
                                }
                              });
                            }}
                            onRemove={(url) =>
                              field.onChange([
                                ...field.value.filter(
                                  (current) => current.url !== url
                                ),
                              ])
                            }
                            maxImages={3}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2 text-destructive">
                  {errors.rating && <p>{errors.rating.message}</p>}
                  {errors.size && <p>{errors.size.message}</p>}
                  {errors.review && <p>{errors.review.message}</p>}
                </div>
                <div className="w-full flex justify-end">
                  <Button type="submit" className="w-36 h-12">
                    {isLoading ? (
                      <PulseLoader size={5} color="#fff" />
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default ReviewDetails;
