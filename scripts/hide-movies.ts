import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaClient } from "../next-app/generated/prisma";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../next-app/.env") });

const prisma = new PrismaClient();

async function find(): Promise<void> {
  try {
    console.log("Fetching movies with 'episodes' in url (case insensitive)...\n");

    const movies = await prisma.movie.findMany({
      where: {
        url: {
          contains: "episodes",
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${movies.length} movies containing 'episodes':\n`);

    movies.forEach((movie, index) => {
      console.log("\n--------------------------\n");
      console.log(`${index + 1}. ${movie.title}`);
      console.log(`   Year: ${movie.year || "N/A"}`);
      console.log(`   URL: ${movie.url}`);
      console.log(`   Hidden: ${movie.hidden ? "Yes" : "No"}`);
      console.log(`   Created: ${movie.createdAt.toISOString()}`);
    });
  } catch (err: any) {
    console.error("Error fetching movies:", err);
  } finally {
    await prisma.$disconnect();
  }
}

async function hide(): Promise<void> {
  try {
    console.log("Hiding movies with 'episodes' in url (case insensitive)...\n");

    const movies = await prisma.movie.updateMany({
      where: {
        url: {
          contains: "episodes",
          mode: "insensitive",
        },
      },
      data: {
        hidden: true,
      },
    });

    console.log(`Hid ${movies.count} movies containing 'episode':\n`);
  } catch (err: any) {
    console.error("Error fetching movies:", err);
  } finally {
    await prisma.$disconnect();
  }
}

hide();
