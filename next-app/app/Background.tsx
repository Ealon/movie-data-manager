import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

// Fetch all DoubanInfo images, ordered by rating descending
// Only select images that are not null or empty
async function getDoubanImages() {
  // Get movies, join DoubanInfo, order by DoubanInfo.rating desc, select movie.coverImage
  const movies = await prisma.movie.findMany({
    where: {
      coverImage: {
        not: "",
      },
      DoubanInfo: {
        // Only include movies that have a DoubanInfo with a coverImage
        coverImage: {
          not: "",
        },
      },
    },
    orderBy: {
      DoubanInfo: {
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
  // Query database and get all the DoubanInfo images, based on rating in desc order
  // Note: This is a server component, so we can use async/await and import PrismaClient here.

  const posters = await getDoubanImages();

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-repeat bg-[length:240px] bg-center"
      style={{ backgroundImage: `url(${posters[8]})` }}
    >
      <div
        className="w-screen h-screen bg-black/70 backdrop-blur-[2px]"
        // style={{ backgroundImage: "radial-gradient(circle at center, transparent, #000c 75%)" }}
      />
    </div>
  );
}
