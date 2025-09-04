import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export type DoubanMovie = {
  title: string;
  datePublished: string;
  rating: number;
  description: string;
  image: string;
  url: string;
};

export async function upsertDoubanInfo(movieId: string, doubanMovie: DoubanMovie) {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      // return { ok: false, error: "Movie not found" };
      return;
    }

    const yearMatch = doubanMovie.datePublished.match(/\d{4}/);
    const year = yearMatch ? +yearMatch[0] : 0;

    if (year > 0 && movie?.year !== year) {
      await prisma.movie.update({
        where: { id: movieId },
        data: { year },
      });
    }

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
  } catch (error) {
    console.error("Failed to upsert Douban info:", error);
  }
}
