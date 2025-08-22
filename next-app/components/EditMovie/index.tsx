/* eslint-disable @next/next/no-img-element */

"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { MovieCardProps } from "../MovieCard";
import { ExternalLink, EyeIcon, StarIcon } from "lucide-react";
import doubanLogo from "./douban.svg";
import { useState, useEffect } from "react";
import MagnetLinks from "../MagnetLinks";
import { DeleteMovie } from "../DeleteMovie";
import { AddLinks } from "../AddLinks";

export default function EditMovie({
  movie,
  doubanInfoUpdater,
}: {
  movie: MovieCardProps;
  doubanInfoUpdater: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const coverImage = /thumbnail/gim.test(movie.coverImage ?? "") ? "/300x450.svg" : movie.coverImage;
  const searchWord = movie.url.split("/").pop()?.replaceAll("-", "+").replaceAll("+idvc100", "");
  const searchDoubanHref = `https://search.douban.com/movie/subject_search?search_text=${searchWord}`;

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button
          className="text-xs font-black px-2 py-1 rounded-sm h-fit"
          variant="outline"
          onClick={() => setOpen(true)}
        >
          <EyeIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="min-w-2xl bg-black/60 backdrop-blur-sm text-white w-fit max-w-5xl!"
      >
        <DialogHeader>
          <DialogTitle>
            <span className="text-gray-400">Edit - </span> {movie?.doubanInfo?.title ?? movie.title}
          </DialogTitle>
        </DialogHeader>
        <article>
          <section className="flex gap-6">
            <div className="flex-[300px] grow-0 shrink-0 space-y-2">
              <img
                width={300}
                height={450}
                src={coverImage || "/300x450.svg"}
                alt={movie.coverAlt ?? movie.title}
                title={movie.coverTitle ?? movie.title}
                className="object-cover aspect-[2/3] bg-[url('/300x450.svg')] rounded-lg mb-6"
              />
              <h2 className="text-lg font-bold my-3">{movie.title}</h2>
              <p className="text-sm font-medium text-gray-400">{movie.year}</p>
              <p className="text-sm font-medium text-gray-400">Created At: {movie.createdAt.toLocaleString()}</p>
              <p className="text-sm font-medium text-gray-400">Updated At: {movie.updatedAt.toLocaleString()}</p>
            </div>
            <div className="flex-1">
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-gray-400">Movie Info</h2>
                <a
                  href={movie.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 flex items-center gap-2 underline underline-offset-3 hover:text-yellow-300 font-medium"
                >
                  <ExternalLink className="size-4" />
                  <span>{movie.title}</span>
                </a>

                {movie.doubanInfo?.title && (
                  <>
                    <a
                      href={movie.doubanInfo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-500 flex items-center gap-2 underline underline-offset-3 hover:text-green-300 font-medium"
                    >
                      <img src={doubanLogo.src} alt="豆瓣" className="size-5" />
                      <span>{movie.doubanInfo.title}</span>
                    </a>

                    <p className="flex items-center gap-1">
                      <StarIcon className="fill-yellow-400 stroke-0 size-4" />
                      <span className="text-yellow-400">{movie.doubanInfo?.rating ?? 0}</span>
                      <span className="text-gray-400 ml-4">{movie.doubanInfo?.datePublished || null}</span>
                    </p>
                  </>
                )}
                <div className="mt-3">
                  <a
                    href={searchDoubanHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black bg-green-600 text-white px-2 py-1 rounded-sm w-fit"
                  >
                    在豆瓣搜索
                  </a>
                  {doubanInfoUpdater}
                </div>
              </section>
              <hr className="my-6" />
              <section>
                <h2 className="text-lg font-bold text-gray-400">Links</h2>
                <div className="max-h-[40vh] overflow-y-auto h-fit">
                  <MagnetLinks links={movie.links ?? []} />
                </div>
                <AddLinks movieId={movie.id} />
              </section>

              <section className="mt-6 p-5 border-2 border-red-500 border-dashed rounded-lg relative">
                <h2 className="text-lg font-bold text-rose-500">Danger Zone</h2>
                <DeleteMovie movieId={movie.id} />
                <div className="absolute top-0 left-0 w-full h-full bg-rose-500/20 z-50" />
              </section>
            </div>
          </section>
        </article>
        {/* <form action={updateDoubanInfo}>
          <input hidden aria-hidden type="hidden" name="movieId" value={movieId} />
          <Label htmlFor="json-info">JSON info</Label>
          <Input autoFocus id="json-info" name="json-info" placeholder="Paste JSON info here..." />
        </form> */}
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
