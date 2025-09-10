"use client";
import qs from "query-string";
import React, { useState } from "react";
import { Search as SeachIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Search = () => {
  const router = useRouter();
  const [value, setValue] = useState("");
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value) return;
    const url = qs.stringifyUrl(
      {
        url: "/search",
        query: {
          term: value,
        },
      },
      {
        skipEmptyString: true,
      }
    );
    //local?term=vlaue
    router.push(url);
  };
  const onClear = () => {
    setValue("");
  };
  return (
    <form
      onSubmit={onSubmit}
      className="relative w-full lg:w-[400px] flex items-center "
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search"
        className=" text-black  rounded-r-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0 border-gray-500 border-r-0"
      />
      {value && (
        <X
          className="absolute top-2.5 right-14 h-5 w-5 cursor-pointer text-muted-foreground hover:opacity-75 transition"
          onClick={onClear}
        />
      )}
      <Button
        type="submit"
        size={"sm"}
        // variant={"secondary"}
        className="rounded-l-none  h-10 "
      >
        <SeachIcon className="w-4 h-4 text-white " />
      </Button>
    </form>
  );
};

export default Search;
