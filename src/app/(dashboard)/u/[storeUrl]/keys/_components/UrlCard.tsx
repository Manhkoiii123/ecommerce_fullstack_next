import CopyButton from "@/app/(dashboard)/u/[storeUrl]/keys/_components/CopyButton";
import { Input } from "@/components/ui/input";

interface UrlCardProps {
  value: string | null;
}
const UrlCard = ({ value }: UrlCardProps) => {
  return (
    <div className="rounded-xl  p-6">
      <div className="flex items-center gap-x-10">
        <p className="font-semibold shrink-0">Server URL</p>
        <div className="space-y-2 w-full">
          <div className="w-full flex items-center gap-x-2">
            <Input
              className=" border-none rounded-r-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0"
              value={value || ""}
              disabled
              placeholder="Server Url"
            />
            <CopyButton value={value || ""} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrlCard;
