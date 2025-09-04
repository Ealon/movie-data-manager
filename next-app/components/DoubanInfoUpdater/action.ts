"use server";

import { revalidatePath } from "next/cache";
import { upsertDoubanInfo, type DoubanMovie } from "@/lib/database";

export async function updateDoubanInfo(formData: FormData): Promise<void> {
  const movieId = formData.get("movieId") as string;
  const jsonInfo = formData.get("json-info") as string;

  let parsed: DoubanMovie;
  try {
    parsed = JSON.parse(jsonInfo);
    await upsertDoubanInfo(movieId, parsed);
  } catch {
    // return { ok: false, error: "Invalid JSON payload" };
    return;
  }

  revalidatePath("/", "page");

  // return { ok: true, data: doubanInfo };
  return;
}
