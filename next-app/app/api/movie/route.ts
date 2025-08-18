import { NextRequest, NextResponse } from "next/server";
import { Link, PrismaClient } from "@/generated/prisma";
import { sanitizeName } from "@/lib/utils";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Basic shape validation
    if (!body || typeof body !== "object") {
      return withCors(NextResponse.json({ message: "Invalid body" }, { status: 400 }));
    }
    if (typeof body.title !== "string" || typeof body.url !== "string") {
      return withCors(NextResponse.json({ message: "Missing title or url" }, { status: 400 }));
    }
    const links = Array.isArray(body.links) ? body.links : [];
    const normalizedLinks = links
      .map((l: Link) => ({
        quality: String(l?.quality || "").trim(),
        size: String(l?.size || "").trim(),
        source: String(l?.source || "")
          .trim()
          .toUpperCase(),
        magnet: typeof l?.magnet === "string" ? l.magnet : null,
        download: typeof l?.download === "string" ? l.download : null,
      }))
      .filter((l: Link) => l.quality && l.size && l.source && l.magnet && l.download);

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
      const newLinks = normalizedLinks.filter((newLink: Link) => {
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
        if (
          existingMovie.coverImage !== body.coverImage?.src ||
          existingMovie.coverTitle !== sanitizeName(body.coverImage?.title) ||
          existingMovie.coverAlt !== sanitizeName(body.coverImage?.alt) ||
          existingMovie.title !== sanitizeName(body.title)
        ) {
          await prisma.movie.update({
            where: { id: existingMovie.id },
            data: {
              coverImage: body.coverImage?.src,
              coverTitle: sanitizeName(body.coverImage?.title),
              coverAlt: sanitizeName(body.coverImage?.alt),
              title: sanitizeName(body.title),
            },
          });
        }
        return NextResponse.json(
          { message: "Movie and all links already exist", movie: existingMovie },
          { status: 200 },
        );
      }

      // Add only new links to the existing movie
      const updatedMovie = await prisma.movie.update({
        where: { id: existingMovie.id },
        data: {
          coverImage: body.coverImage?.src,
          coverTitle: sanitizeName(body.coverImage?.title),
          coverAlt: sanitizeName(body.coverImage?.alt),
          title: sanitizeName(body.title),
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
        title: sanitizeName(body.title),
        url: body.url,
        coverImage: body.coverImage?.src,
        coverTitle: sanitizeName(body.coverImage?.title),
        coverAlt: sanitizeName(body.coverImage?.alt),
        links: {
          create: normalizedLinks.map((link: Link) => ({
            quality: link.quality,
            size: link.size,
            source: link.source,
            magnet: link.magnet,
            download: link.download,
          })),
        },
      },
    });
    return withCors(NextResponse.json({ message: "Movie created successfully", movie }, { status: 201 }));
  } catch (error) {
    console.error(error);
    return withCors(NextResponse.json({ message: "Error" }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}
