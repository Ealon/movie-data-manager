import { EyeIcon, StarIcon } from "lucide-react";
import { DoubanInfoUpdater } from "@/components/DoubanInfoUpdater";
import type { DoubanInfo, Movie, Link as PrismaLink } from "@/generated/prisma";
import { Button } from "./ui/button";
import Link from "next/link";
import EditMovie from "./EditMovie";
import MagnetLinks from "./MagnetLinks";

export type MovieCardProps = Movie & { links?: PrismaLink[]; doubanInfo: DoubanInfo | null };

const MovieCover = ({ movie }: { movie: Movie }) => {
  const coverImage = /thumbnail/gim.test(movie.coverImage ?? "") ? "/300x450.svg" : movie.coverImage;

  if (coverImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverImage || "/300x450.svg"}
        alt={movie.coverAlt ?? movie.title}
        title={movie.coverTitle ?? movie.title}
        className="w-full object-cover aspect-[2/3] bg-[url('/300x450.svg')]"
      />
    );
  }
  return (
    <div className="w-full flex items-center justify-center" style={{ aspectRatio: "2 / 3" }}>
      <div className="size-[64px] rounded bg-gray-300 dark:bg-gray-700" />
    </div>
  );
};

const MovieInfo = ({ movie }: { movie: MovieCardProps }) => {
  return (
    <article className="text-center flex flex-col gap-1.5 justify-center items-center group-hover:hidden p-3">
      <h2 className="text-white text-lg font-bold text-shadow-xs text-shadow-black/35">
        {movie.doubanInfo?.title ?? movie.title}
      </h2>
      <p className="text-white mx-auto text-sm flex items-center gap-2">
        {movie.year || movie.doubanInfo?.datePublished || null}
        {movie.doubanInfo?.rating && (
          <>
            <StarIcon className="fill-yellow-400 stroke-0 size-4" />
            <span className="text-yellow-400">{movie.doubanInfo?.rating ?? 0}</span>
          </>
        )}
      </p>
    </article>
  );
};

const Links = ({ movie }: { movie: MovieCardProps }) => {
  return (
    <div className="absolute text-xs font-black top-2 right-2 items-center gap-2 hidden group-hover:flex">
      {movie.doubanInfo?.url && (
        <a
          href={`https://movie.douban.com${movie.doubanInfo.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 text-white px-2 py-1 rounded-md"
        >
          豆瓣
        </a>
      )}
      <a
        href={movie.url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-black/80 text-white px-2 py-1 rounded-md"
      >
        RARBG
      </a>
    </div>
  );
};

export default function MovieCard({ movie }: { movie: MovieCardProps }) {
  return (
    <div key={movie.id} className="rounded-lg overflow-hidden group relative">
      <MovieCover movie={movie} />
      <div className="absolute bottom-0 left-0 w-full h-fit pt-6 bg-gradient-to-t from-black/80 from-15% via-black/50 via-80% to-transparent">
        <MovieInfo movie={movie} />
        <MagnetLinks className="hidden group-hover:block text-sm space-y-1.5" links={movie.links ?? []} />
        {process.env.NODE_ENV === "development" && (
          <div className="w-fit mx-auto hidden group-hover:block">
            <EditMovie movie={movie} doubanInfoUpdater={<DoubanInfoUpdater movieId={movie.id} />} />
          </div>
        )}
      </div>
      <Links movie={movie} />
    </div>
  );
}
