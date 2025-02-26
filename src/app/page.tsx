import ThemeToggle from "@/components/shared/theme-toggle";
import { updateVariantImage } from "@/migration-scripts/migrate-varinatImage";
import { UserButton } from "@clerk/nextjs";

export default async function Home() {
  await updateVariantImage();
  return (
    <div className="p-5">
      <div className="w-100 flex justify-end gap-x-5">
        <UserButton />
        <ThemeToggle />
      </div>
    </div>
  );
}
