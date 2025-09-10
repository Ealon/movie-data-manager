"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import type { DoubanMovie } from "./types";
import { PrismaClient } from "@/generated/prisma";
import { auth } from "@/auth";
import type { MovieCardProps } from "../MovieCard";

const prisma = new PrismaClient();

export async function updateDoubanInfo(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session) {
    return;
  }

  const movieId = formData.get("movieId") as string;
  const jsonInfo = formData.get("json-info") as string;

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    // return { ok: false, error: "Movie not found" };
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonInfo);
  } catch {
    // return { ok: false, error: "Invalid JSON payload" };
    return;
  }

  const doubanMovie = parsed as DoubanMovie;
  const yearMatch = doubanMovie.datePublished.match(/\d{4}/);
  const year = yearMatch ? +yearMatch[0] : 0;

  if (year > 0 && movie?.year !== year) {
    await prisma.movie.update({
      where: { id: movieId },
      data: { year },
    });
  }

  // const doubanInfo =
  await prisma.doubanInfo.upsert({
    where: { movieId },
    update: {
      url: doubanMovie.url,
      title: doubanMovie.title,
      datePublished: doubanMovie.datePublished,
      rating: Number(doubanMovie.rating) || 0,
      coverImage: doubanMovie.image,
    },
    create: {
      movieId,
      url: doubanMovie.url,
      title: doubanMovie.title,
      datePublished: doubanMovie.datePublished,
      rating: Number(doubanMovie.rating) || 0,
      coverImage: doubanMovie.image,
    },
  });

  revalidatePath("/", "page");

  // return { ok: true, data: doubanInfo };
  return;
}

export async function getMovie(movieId: string): Promise<MovieCardProps | null> {
  const session = await auth();
  if (!session) {
    return null;
  }

  try {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: { links: { orderBy: { quality: "desc" } }, doubanInfo: true },
    });
    if (movie) {
      revalidatePath("/", "page");
      return movie;
    }
    return null;
  } catch (error) {
    console.error("Error getting movie:", error);
    return null;
  }
}
