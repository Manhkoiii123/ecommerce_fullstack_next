"use client";
import { FC } from "react";
import Image from "next/image";

import LogoImg from "../../../public/assets/icons/logo-1.png";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface LogoProps {
  width: string;
  height: string;
  user?: any;
  storeUrl?: string;
}

const Logo: FC<LogoProps> = ({ width, height, user, storeUrl }) => {
  // const searchParams = useSearchParams();

  // const storeUrl = searchParams?.get("storeUrl");
  const link = storeUrl ? `/dashboard/seller/stores/${storeUrl}` : "/";
  return (
    <div className="z-50 " style={{ width: width, height: height }}>
      <Link href={link ? link : "/"}>
        <Image
          src={LogoImg}
          alt="GoShop"
          className="w-full h-full object-cover overflow-visible"
        />
      </Link>
    </div>
  );
};

export default Logo;
