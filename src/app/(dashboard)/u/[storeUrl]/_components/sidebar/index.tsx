import Navigation from "@/app/(dashboard)/u/[storeUrl]/_components/sidebar/Navigation";
import Toggle from "@/app/(dashboard)/u/[storeUrl]/_components/sidebar/Toggle";
import Wrapper from "@/app/(dashboard)/u/[storeUrl]/_components/sidebar/Wrapper";

const Sidebar = () => {
  return (
    <Wrapper>
      <Toggle />
      <Navigation />
    </Wrapper>
  );
};

export default Sidebar;
