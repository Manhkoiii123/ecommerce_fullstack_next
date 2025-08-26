import { CartProductType } from "@/lib/types";
import { Size } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface Props {
  sizes: Size[];
  sizeId: string | undefined;
  handleChange: (property: keyof CartProductType, value: any) => void;
}
const SizeSelector = ({ sizeId, sizes, handleChange }: Props) => {
  const pathname = usePathname();
  const { replace, refresh } = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams!);
  const handleCartProductToBeAddedChange = (size: Size) => {
    handleChange("sizeId", size.id);
    handleChange("size", size.size);
  };
  useEffect(() => {
    if (sizeId) {
      const search_size = sizes.find((s) => s.id === sizeId);
      if (search_size) {
        handleCartProductToBeAddedChange(search_size);
      }
    } else {
    }
  }, [sizeId]);
  const handleSelectSize = (size: Size) => {
    params.set("size", size.id!);
    replace(`${pathname}?${params.toString()}`);
  };
  return (
    <div className="flex flex-wrap gap-4">
      {sizes.map((size) => (
        <span
          key={size.size}
          className={`border rounded-full px-5 py-1 cursor-pointer transition-all hover:bg-orange-background hover:text-white ${
            size.id === sizeId ? "bg-orange-background text-white" : ""
          }`}
          onClick={() => handleSelectSize(size)}
        >
          {size.size}
        </span>
      ))}
    </div>
  );
};

export default SizeSelector;
