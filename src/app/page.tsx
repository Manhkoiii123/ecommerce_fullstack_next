import ThemeToggle from "@/components/shared/theme-toggle";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="p-5">
      <div className="w-100 flex justify-end gap-x-5">
        <UserButton />
        <ThemeToggle />
      </div>
    </div>
  );
}
