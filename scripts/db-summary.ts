import { PrismaClient } from "../next-app/generated/prisma";
const prisma = new PrismaClient();

async function main(): Promise<void> {
  try {
    const [totalMovies, movies] = await Promise.all([
      prisma.movie.count({
        where: { doubanInfo: { is: null } },
      }),
      prisma.movie.findMany({
        where: { doubanInfo: { is: null } },
        select: { id: true, title: true },
        orderBy: { createdAt: "asc" },
        // include: { links: { orderBy: { quality: "desc" } }, doubanInfo: true },
        skip: 20,
        take: 10,
      }),
    ]);
    console.log(totalMovies, movies.map((m) => m.title).join("\n"));
  } catch (err: any) {
    console.error(err);
  }
}

main();
