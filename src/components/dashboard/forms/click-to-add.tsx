import React, { FC, useState } from "react";

import { Input } from "@/components/ui/input";

import { PaintBucket } from "lucide-react";

import { SketchPicker } from "react-color";
import { cn } from "@/lib/utils";

export interface Detail<T = { [key: string]: string | number | undefined }> {
  [key: string]: T[keyof T];
}

interface ClickToAddInputsProps<T extends Detail> {
  details: T[];
  setDetails: React.Dispatch<React.SetStateAction<T[]>>;
  initialDetail?: T;
  header?: string;
  colorPicker?: boolean;
  containerClassName?: string;
  inputClassName?: string;
}

const ClickToAddInputs = <T extends Detail>({
  details,
  setDetails,
  header,
  initialDetail = {} as T,
  colorPicker,
  containerClassName,
  inputClassName,
}: ClickToAddInputsProps<T>) => {
  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);

  const handleDetailsChange = (
    index: number,
    property: string,
    value: string | number
  ) => {
    const updatedDetails = details.map((detail, i) =>
      i === index ? { ...detail, [property]: value } : detail
    );
    setDetails(updatedDetails);
  };

  const handleAddDetail = () => {
    setDetails([
      ...details,
      {
        ...initialDetail,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    if (details.length === 1) return;
    const updatedDetails = details.filter((_, i) => i !== index);
    setDetails(updatedDetails);
  };

  const PlusButton = ({ onClick }: { onClick: () => void }) => {
    return (
      <button
        type="button"
        title="Add new detail"
        className="group cursor-pointer outline-none hover:rotate-90 duration-300"
        onClick={onClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="50px"
          height="50px"
          viewBox="0 0 24 24"
          className="w-8 h-8 stroke-blue-400 fill-none group-hover:fill-blue-primary group-active:stroke-blue-200 group-active:fill-blue-700 group-active:duration-0 duration-300"
        >
          <path
            d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
            strokeWidth="1.5"
          />
          <path d="M8 12H16" strokeWidth="1.5" />
          <path d="M12 16V8" strokeWidth="1.5" />
        </svg>
      </button>
    );
  };

  const MinusButton = ({ onClick }: { onClick: () => void }) => {
    return (
      <button
        type="button"
        title="Remove detail"
        className="group cursor-pointer outline-none hover:rotate-90 duration-300"
        onClick={onClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="50px"
          height="50px"
          viewBox="0 0 24 24"
          className="w-8 h-8 stroke-blue-400 fill-none group-hover:fill-white group-active:stroke-blue-200 group-active:fill-blue-700 group-active:duration-0 duration-300"
        >
          <path
            d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
            strokeWidth="1.5"
          />
          <path d="M8 12H16" strokeWidth="1.5" />
        </svg>
      </button>
    );
  };
  return (
    <div className="flex flex-col gap-y-4">
      {header && <div>{header}</div>}
      {details.length === 0 && <PlusButton onClick={handleAddDetail} />}
      {details.map((detail, index) => (
        <div key={index} className="flex items-center gap-x-4">
          {Object.keys(detail).map((property, propIndex) => (
            <div
              key={propIndex}
              className={cn("flex items-center gap-x-4", containerClassName)}
            >
              {property === "color" && colorPicker && (
                <div className="flex gap-x-4">
                  <button
                    type="button"
                    className="cursor-pointer"
                    onClick={() =>
                      setColorPickerIndex(
                        colorPickerIndex === index ? null : index
                      )
                    }
                  >
                    <PaintBucket />
                  </button>
                  <span
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: detail[property] as string }}
                  />
                </div>
              )}

              {colorPickerIndex === index && property === "color" && (
                <SketchPicker
                  color={detail[property] as string}
                  onChange={(e) => handleDetailsChange(index, property, e.hex)}
                />
              )}

              <Input
                className={cn("w-28 placeholder:capitalize", inputClassName)}
                type={typeof detail[property] === "number" ? "number" : "text"}
                name={property}
                placeholder={property}
                value={detail[property] as string}
                min={typeof detail[property] === "number" ? 0 : undefined}
                step="0.01"
                onChange={(e) =>
                  handleDetailsChange(
                    index,
                    property,
                    e.target.type === "number"
                      ? parseFloat(e.target.value)
                      : e.target.value
                  )
                }
              />
            </div>
          ))}
          <MinusButton onClick={() => handleRemove(index)} />
          <PlusButton onClick={handleAddDetail} />
        </div>
      ))}
    </div>
  );
};

export default ClickToAddInputs;
