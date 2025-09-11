import { Poppins } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
const font = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});
const Logo = () => {
  return (
    <Link href={"/"}>
      <div className="flex lg:flex items-center gap-x-4 hover:opacity-70 transition ">
        <div className="bg-white rounded-full p-1 mr-12 lg:mr-0 shrink-0 lg:shrink">
          <Image
            src={"/logo.svg"}
            width={30}
            height={30}
            alt="logo"
            className="rounded-full"
          />
        </div>
        <div className={cn("hidden lg:block", font.className)}>
          <p className="text-lg font-semibold">Gamehub</p>
          <p className="text-sm text-muted-foreground">Creator Dashboard</p>
        </div>
      </div>
    </Link>
  );
};
export default Logo;
