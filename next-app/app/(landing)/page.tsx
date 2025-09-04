import Link from "next/link";
import { Prisma, PrismaClient } from "@/generated/prisma";
import Pagination from "@/components/Pagination";
import Search from "@/components/search";
import Movies from "@/components/Movies";
import { Suspense } from "react";

type PageSearchParams = {
  page?: string;
  pageSize?: string;
  keyword?: string;
};

const PAGE_SIZE = 16;

const prisma = new PrismaClient();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const getData = async (skip = 0, pageSize: number, keyword?: string) => {
  await new Promise((resolve) => setTimeout(resolve, 2_000));
  const where: Prisma.MovieWhereInput | undefined = keyword
    ? {
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { doubanInfo: { title: { contains: keyword, mode: "insensitive" } } },
        ],
      }
    : undefined;

  const [totalMovies, movies] = await Promise.all([
    prisma.movie.count({
      where,
    }),
    prisma.movie.findMany({
      where,
      orderBy: [{ doubanInfo: { rating: "desc" } }, { year: "desc" }],
      include: { links: { orderBy: { quality: "desc" } }, doubanInfo: true },
      skip,
      take: pageSize,
    }),
  ]);
  return {
    totalMovies,
    movies,
  };
};

export default async function Home({ searchParams }: { searchParams?: Promise<PageSearchParams> }) {
  const _searchParams = await searchParams;
  const currentPage = parsePositiveInt(_searchParams?.page, 1);
  const pageSize = parsePositiveInt(_searchParams?.pageSize, PAGE_SIZE);
  const skip = (currentPage - 1) * pageSize;
  const keyword = _searchParams?.keyword;

  const { totalMovies, movies } = await getData(skip, pageSize, keyword);

  const totalPages = Math.max(1, Math.ceil(totalMovies / pageSize));

  return (
    <div className="max-w-[1920px] mx-auto p-6 flex flex-col justify-between min-h-screen w-full items-center relative z-10">
      <header className="mb-6 w-fit flex items-center justify-between gap-12">
        <Link href="/">
          <h1 className="text-5xl font-black text-white">Movie Database</h1>
        </Link>
        <Search queryName="keyword" placeholder="Search by title..." />
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-100">Total: {totalMovies}</span>
        </div>
      </header>

      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <Movies movies={movies} />
        </Suspense>
        <div>
          <Pagination
            pathname="/"
            pageSize={pageSize}
            className="my-2 p-2 min-w-xl w-fit mx-auto rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-between"
            totalPages={totalPages}
            currentPage={currentPage}
            searchParams={_searchParams}
          />
        </div>
      </div>
    </div>
  );
}
