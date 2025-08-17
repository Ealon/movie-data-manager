import Link from "next/link";
import { PrismaClient } from "@/generated/prisma";
import { ExternalLink, MagnetIcon, StarIcon } from "lucide-react";
import { DoubanInfoUpdater } from "@/components/DoubanInfoUpdater";
import { cn } from "@/lib/utils";

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
      include: { links: { orderBy: { quality: "desc" } }, DoubanInfo: true },
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
          <h1 className="text-5xl font-black text-white">Movies Database</h1>
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
              <div
                key={movie.id}
                className="rounded border border-slate-300 dark:border-white/10 overflow-hidden bg-white/60 backdrop-blur-md group"
              >
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
                  <div className="absolute bottom-0 left-0 px-4 w-full h-fit pb-3 pt-12 bg-gradient-to-t from-black/95 to-transparent via-black/75 flex flex-col items-center justify-center gap-1.5">
                    <h2 className="text-white text-lg text-center font-bold text-shadow-xs text-shadow-black/35">
                      {movie.DoubanInfo?.title ?? movie.title}
                    </h2>
                    <p className="text-white text-sm flex items-center gap-2">
                      {movie.year || movie.DoubanInfo?.datePublished || null}
                      <StarIcon className="fill-yellow-400 stroke-0 size-4" />
                      <span className="text-yellow-400">{movie.DoubanInfo?.rating ?? 0}</span>
                      {movie.DoubanInfo?.url && (
                        <a
                          href={`https://movie.douban.com${movie.DoubanInfo.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-black bg-green-600 text-white px-2 py-1 rounded-md hidden group-hover:block"
                        >
                          豆瓣
                        </a>
                      )}
                    </p>
                    <div className="flex-col gap-2 text-sm hidden p-4 backdrop-blur-sm rounded-xl group-hover:flex">
                      {movie.links.map((l) => {
                        const label = `${l.quality} (${l.source}) - ${l.size}`;
                        const href = l.download ?? l.magnet ?? "#";

                        return (
                          <a
                            key={l.id}
                            href={href}
                            className={cn(
                              "flex items-center gap-1  underline font-medium underline-offset-1 hover:text-blue-400",
                              /(1080p)|(2160p)/gim.test(l.quality) && /blu/gim.test(l.source)
                                ? "text-amber-500 hover:text-yellow-400"
                                : "text-indigo-500 hover:text-blue-400",
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MagnetIcon className="size-4" />
                            <span>{label}</span>
                          </a>
                        );
                      })}
                    </div>
                    <div className=" items-center gap-2 hidden group-hover:flex">
                      <a
                        href={searchDoubanHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-black bg-green-600 text-white px-2 py-1 rounded-sm block"
                      >
                        在豆瓣搜索
                      </a>
                      <DoubanInfoUpdater movieId={movie.id} />
                    </div>
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
