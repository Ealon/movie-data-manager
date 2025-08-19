import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

// Fetch all doubanInfo images, ordered by rating descending
// Only select images that are not null or empty
async function getDoubanImages() {
  // Get movies, join doubanInfo, order by doubanInfo.rating desc, select movie.coverImage
  const movies = await prisma.movie.findMany({
    where: {
      coverImage: {
        not: "",
      },
      doubanInfo: {
        // Only include movies that have a doubanInfo with a coverImage
        coverImage: {
          not: "",
        },
      },
    },
    orderBy: {
      doubanInfo: {
        rating: "desc",
      },
    },
    select: {
      coverImage: true,
    },
  });
  // Filter out empty strings just in case
  return movies.map((movie) => movie.coverImage).filter(Boolean);
}

export default async function Background() {
  // Query database and get all the doubanInfo images, based on rating in desc order
  // Note: This is a server component, so we can use async/await and import PrismaClient here.

  const posters = await getDoubanImages();

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-cover bg-center"
      // style={{ backgroundImage: `url(${posters[8]})` }}
      style={{ backgroundImage: `url(/bg/1106852.webp)` }}
    >
      <div
        className="w-screen h-screen bg-black/60"
        // style={{ backgroundImage: "radial-gradient(circle at center, transparent, #000c 75%)" }}
      />
    </div>
  );
}
