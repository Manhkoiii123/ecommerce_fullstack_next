import Actions from "@/app/(dashboard)/u/[storeUrl]/_components/navbar/Actions";
import Logo from "@/components/shared/logo";

const Navbar = ({ storeUrl }: { storeUrl?: string }) => {
  return (
    <nav className="fixed  top-0 w-full h-20 z-[49] !text-black px-2 lg:px-4 flex justify-between items-center shadow-sm">
      <Logo width="100px" height="100px" storeUrl={storeUrl} />
      <Actions />
    </nav>
  );
};

export default Navbar;
