"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function hideMovie(formData: FormData): Promise<void> {
  const movieId = formData.get("movieId") as string;

  if (!movieId) {
    throw new Error("Movie ID is required");
  }

  try {
    await prisma.movie.update({
      where: { id: movieId },
      data: { hidden: true },
    });

    revalidatePath("/", "page");
  } catch (error) {
    console.error("Error hiding movie:", error);
    throw new Error("Failed to hide movie");
  }
}

export async function unhideMovie(formData: FormData): Promise<void> {
  const movieId = formData.get("movieId") as string;

  if (!movieId) {
    throw new Error("Movie ID is required");
  }

  try {
    await prisma.movie.update({
      where: { id: movieId },
      data: { hidden: false },
    });

    revalidatePath("/", "page");
  } catch (error) {
    console.error("Error unhiding movie:", error);
    throw new Error("Failed to unhide movie");
  }
}
