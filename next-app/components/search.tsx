"use client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import debounce from "lodash.debounce";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Search({ queryName, placeholder }: { queryName: string; placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();

  const handleSearch = debounce((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) {
      params.set(queryName, term);
    } else {
      params.delete(queryName);
    }
    push(`${pathname}?${params.toString()}`);
  }, 500);

  return (
    <div className="relative w-40 lg:w-52">
      <label htmlFor={`search-${queryName}`} className="sr-only">
        Search
      </label>
      <Input
        id={`search-${queryName}`}
        className="peer block pl-10 bg-white backdrop-blur-md text-sm"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get(queryName)?.toString()}
      />
      <SearchIcon className="absolute top-2.5 left-3 size-4 opacity-70" />
    </div>
  );
}
