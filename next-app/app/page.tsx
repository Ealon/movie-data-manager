import Link from "next/link";
import { PrismaClient } from "../generated/prisma";
import { ExternalLink, MagnetIcon } from "lucide-react";

type PageSearchParams = {
  page?: string;
  pageSize?: string;
};

const prisma = new PrismaClient();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function Home({ searchParams }: { searchParams?: Promise<PageSearchParams> }) {
  const _searchParams = await searchParams;
  const currentPage = parsePositiveInt(_searchParams?.page, 1);
  const pageSize = parsePositiveInt(_searchParams?.pageSize, 12);
  const skip = (currentPage - 1) * pageSize;

  const [totalMovies, movies] = await Promise.all([
    prisma.movie.count(),
    prisma.movie.findMany({
      orderBy: { createdAt: "desc" },
      include: { links: { orderBy: { quality: "desc" } } },
      skip,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalMovies / pageSize));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  function pageHref(page: number) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return `/?${params.toString()}`;
  }

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-5xl font-black">Movies Database</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Total: {totalMovies}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map((movie) => {
            const searchWord = movie.url.split("/").pop()?.replaceAll("-", "+");
            const searchDoubanHref = `https://search.douban.com/movie/subject_search?search_text=${searchWord}`;
            const coverImage = /thumbnail/gim.test(movie.coverImage ?? "") ? "/300x450.svg" : movie.coverImage;
            return (
              <div key={movie.id} className="rounded border border-slate-300 dark:border-white/10 overflow-hidden">
                <div className="bg-gray-100 relative dark:bg-gray-900">
                  {movie.coverImage ? (
                    <Link className="w-full" style={{ aspectRatio: "2/3" }} href={movie.url} target="_blank">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage || "/300x450.svg"}
                        alt={movie.coverAlt ?? movie.title}
                        title={movie.coverTitle ?? movie.title}
                        className="w-full object-contain"
                      />
                    </Link>
                  ) : (
                    <div className="w-full flex items-center justify-center" style={{ aspectRatio: "2 / 3" }}>
                      <div className="size-[64px] rounded bg-gray-300 dark:bg-gray-700" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-fit py-3 bg-gradient-to-t from-black/95 to-transparent via-black/70 flex items-center justify-center">
                    <h2 className="text-white text-lg font-bold">{movie.title}</h2>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <a
                      href={searchDoubanHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold bg-green-600 text-white px-2 py-1 rounded-md hover:underline break-all flex items-center gap-1"
                    >
                      <span>豆瓣搜索</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {movie.links.map((l) => {
                      const label = `${l.quality} (${l.source}) - ${l.size}`;
                      const href = l.download ?? l.magnet ?? "#";

                      return (
                        <a
                          key={l.id}
                          href={href}
                          className="flex items-center gap-1 text-indigo-600 underline font-medium underline-offset-2 text-sm hover:text-blue-500"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MagnetIcon className="size-4" />
                          <span>{label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={hasPrev ? pageHref(currentPage - 1) : "#"}
              className={`px-3 py-1 rounded border ${
                hasPrev
                  ? "border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              aria-disabled={!hasPrev}
            >
              Prev
            </Link>
            <Link
              href={hasNext ? pageHref(currentPage + 1) : "#"}
              className={`px-3 py-1 rounded border ${
                hasNext
                  ? "border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              aria-disabled={!hasNext}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
