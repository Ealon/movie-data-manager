"use server";

import { revalidatePath } from "next/cache";
import type { DoubanMovie } from "./types";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function deleteMovie(formData: FormData): Promise<void> {
  const movieId = formData.get("movieId") as string;

  if (!movieId) {
    throw new Error("Movie ID is required");
  }

  try {
    // Delete the movie and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related links first
      await tx.link.deleteMany({
        where: {
          movieId: movieId,
        },
      });

      // Delete related douban info
      await tx.doubanInfo.deleteMany({
        where: {
          movieId: movieId,
        },
      });

      // Finally delete the movie
      await tx.movie.delete({
        where: {
          id: movieId,
        },
      });
    });

    revalidatePath("/", "page");
  } catch (error) {
    console.error("Error deleting movie:", error);
    throw new Error("Failed to delete movie");
  }
}
