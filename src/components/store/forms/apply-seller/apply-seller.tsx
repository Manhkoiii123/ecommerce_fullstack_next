"use client";
import Instructions from "@/components/store/forms/apply-seller/instructions";
import ProgressBar from "@/components/store/forms/apply-seller/progress-bar";
import Step1 from "@/components/store/forms/apply-seller/steps/step-1/step-1";
import Step2 from "@/components/store/forms/apply-seller/steps/step-2/step-2";
import Step3 from "@/components/store/forms/apply-seller/steps/step-3/step-3";
import Step4 from "@/components/store/forms/apply-seller/steps/step-4/step-4";
import { StoreType } from "@/lib/types";
import { useState } from "react";

export default function ApplySellerMultiForm() {
  const [step, setStep] = useState<number>(1);

  const [formData, setFormData] = useState<StoreType>({
    name: "",
    description: "",
    email: "",
    phone: "",
    url: "",
    logo: "",
    cover: "",
    defaultShippingService: "",
    defaultShippingFeePerItem: undefined,
    defaultShippingFeeForAdditionalItem: undefined,
    defaultShippingFeePerKg: undefined,
    defaultShippingFeeFixed: undefined,
    defaultDeliveryTimeMin: undefined,
    defaultDeliveryTimeMax: undefined,
    returnPolicy: "",
  });
  return (
    <div className="grid lg:grid-cols-[400px_1fr]">
      <Instructions />
      <div className="relative p-5 w-full">
        <ProgressBar step={step} />
        {step === 1 ? (
          <Step1 step={step} setStep={setStep} />
        ) : step === 2 ? (
          <Step2
            formData={formData}
            setFormData={setFormData}
            step={step}
            setStep={setStep}
          />
        ) : step === 3 ? (
          <Step3
            formData={formData}
            setFormData={setFormData}
            step={step}
            setStep={setStep}
          />
        ) : step === 4 ? (
          <Step4 />
        ) : null}
      </div>
    </div>
  );
}
