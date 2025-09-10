import Actions from "@/components/live/navbar/Actions";
import Search from "@/components/live/navbar/Search";
import Logo from "@/components/shared/logo";
import { currentUser } from "@clerk/nextjs/server";

const Navbar = async () => {
  const user = await currentUser();

  return (
    <nav className="fixed text-white top-0 w-full h-20 z-[49]  px-2 lg:px-4 flex justify-between items-center shadow-sm">
      <Logo
        width="100px"
        height="100px"
        user={JSON.parse(JSON.stringify(user))}
      />
      <Search />
      <Actions />
    </nav>
  );
};

export default Navbar;
