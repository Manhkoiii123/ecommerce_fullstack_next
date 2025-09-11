"use client";
import { toast } from "sonner";
import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { updateStream } from "@/actions/stream";

type FieldTypes = "isChatEnabled" | "isChatDelayed" | "isChatFollowersOnly";
interface ToggleCardProps {
  field: FieldTypes;
  label: string;
  value: boolean;
}
const ToggleCard = ({ field, label, value = false }: ToggleCardProps) => {
  const [isPending, startTransition] = useTransition();
  const onChange = async () => {
    // startTransition(() => {
    //   updateStream({
    //     [field]: !value,
    //   })
    //     .then(() => toast.success("Chat setting is updated"))
    //     .catch((error) => toast.error("Something went wrong"));
    // });
  };
  return (
    <div className="rounded-xl bg-[#252731] p-6">
      <div className="flex items-center justify-between ">
        <p className="font-semibold shrink-0">{label}</p>
        <div className="space-y-2">
          <Switch
            disabled={isPending}
            onCheckedChange={onChange}
            checked={value}
          >
            {value ? "On" : "Off"}
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default ToggleCard;
