"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

type Link = {
  link: string;
  quality: string;
  size: string;
  title: string;
};

const getSourceFromLink = (link: string, title = "") => {
  if (/(bluray)|(blu-ray)/gim.test(link) || /(bluray)|(blu-ray)/gim.test(title)) {
    return "BluRay";
  }
  if (/(web-dl)|(webdl)/gim.test(link) || /(web-dl)|(webdl)/gim.test(title)) {
    return "WebDL";
  }
  return "Other";
};

export async function updateLinks(formData: FormData): Promise<void> {
  const movieId = formData.get("movieId") as string;
  const links = formData.get("links") as string;

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
      links: true,
    },
  });

  if (!movie) {
    // return { ok: false, error: "Movie not found" };
    return;
  }

  const parsedLinks = JSON.parse(links) as Link[];

  const existingLinks = movie.links || [];
  const newLinks = parsedLinks.filter((newLink: Link) => {
    return !existingLinks.some(
      (existingLink) => existingLink.magnet === newLink.link || existingLink.download === newLink.link,
    );
  });

  await prisma.movie.update({
    where: { id: movieId },
    data: {
      links: {
        create: newLinks.map((link: Link) => ({
          quality: link.quality,
          description: link.title,
          size: link.size,
          source: getSourceFromLink(link.link, link.title),
          magnet: link.link,
          download: link.link,
        })),
      },
    },
    include: { links: true },
  });

  revalidatePath("/", "page");

  // return { ok: true, data: doubanInfo };
  return;
}
