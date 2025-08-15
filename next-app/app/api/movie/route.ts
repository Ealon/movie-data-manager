import { NextRequest, NextResponse } from "next/server";
import { Link, PrismaClient } from "../../../generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(body);
    // Check for existing movie by unique fields (e.g., title and url)
    const existingMovie = await prisma.movie.findUnique({
      where: {
        url: body.url,
      },
      include: {
        links: true,
      },
    });

    if (existingMovie) {
      // Check for duplicated links
      const existingLinks = existingMovie.links || [];
      const newLinks = body.links.filter((newLink: Link) => {
        return !existingLinks.some(
          (existingLink: Link) =>
            existingLink.quality === newLink.quality &&
            existingLink.size === newLink.size &&
            existingLink.source === newLink.source &&
            existingLink.magnet === newLink.magnet &&
            existingLink.download === newLink.download,
        );
      });

      if (newLinks.length === 0) {
        return NextResponse.json(
          { message: "Movie and all links already exist", movie: existingMovie },
          { status: 200 },
        );
      }

      // Add only new links to the existing movie
      const updatedMovie = await prisma.movie.update({
        where: { id: existingMovie.id },
        data: {
          links: {
            create: newLinks.map((link: Link) => ({
              quality: link.quality,
              size: link.size,
              source: link.source,
              magnet: link.magnet,
              download: link.download,
            })),
          },
        },
        include: { links: true },
      });

      return NextResponse.json({ message: "Movie exists, new links added", movie: updatedMovie }, { status: 200 });
    }

    const movie = await prisma.movie.create({
      data: {
        title: body.title,
        url: body.url,
        coverImage: body.coverImage?.src,
        coverTitle: body.coverImage?.title,
        coverAlt: body.coverImage?.alt,
        links: {
          create: body.links.map((link: Link) => ({
            quality: link.quality,
            size: link.size,
            source: link.source,
            magnet: link.magnet,
            download: link.download,
          })),
        },
      },
    });
    return NextResponse.json({ message: "Movie created successfully", movie }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
