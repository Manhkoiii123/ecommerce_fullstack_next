import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SizeLink({ size }: { size: string }) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);

  const pathname = usePathname();

  const { replace } = useRouter();

  const sizeQueryArray = searchParams.getAll("size");
  console.log("🚀 ~ SizeLink ~ sizeQueryArray:", sizeQueryArray);

  const existed_size = sizeQueryArray.find((s) => s === size);

  const handleSizeChange = (size: string) => {
    if (existed_size) {
      const newSizes = sizeQueryArray.filter((s) => s !== size);
      params.delete("size");
      newSizes.forEach((size) => params.append("size", size));
    } else {
      params.append("size", size);
    }
    replaceParams();
  };

  const replaceParams = () => {
    replace(`${pathname}?${params.toString()}`);
  };
  return (
    <label
      className="flex items-center text-left cursor-pointer whitespace-nowrap select-none"
      onClick={() => handleSizeChange(size)}
    >
      <span
        className={cn(
          "mr-2 border border-[#ccc] w-3 h-3 relative flex items-center justify-center rrounded-full",
          {
            "bg-black text-white border-black": size === existed_size,
          }
        )}
      >
        {size === existed_size && <Check className="w-2" />}
      </span>
      <div className="flex-1 text-xs inline-block overflow-visible text-clip whitespace-normal">
        {size}
      </div>
    </label>
  );
}
