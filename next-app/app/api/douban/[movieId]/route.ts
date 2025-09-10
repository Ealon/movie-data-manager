import "server-only";
import { NextResponse } from "next/server";
import { upsertDoubanInfo } from "@/lib/database";
import { revalidatePath } from "next/cache";
import isRequestAuthenticated from "@/lib/apiAuth";
import { withCors } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: Promise<{ movieId: string }> }) {
  try {
    const isAuthenticated = await isRequestAuthenticated(request);

    if (!isAuthenticated) {
      return withCors(NextResponse.json({ message: "Not authenticated" }, { status: 401 }), "douban");
    }

    const { movieId } = await params;
    const body = await request.json();

    // Basic shape validation
    if (!body || typeof body !== "object") {
      return withCors(NextResponse.json({ message: "Invalid body" }, { status: 400 }), "douban");
    }

    await upsertDoubanInfo(movieId, body);
    revalidatePath("/", "page");
    return withCors(NextResponse.json({ message: "Douban info upserted successfully" }, { status: 200 }), "douban");
  } catch (error) {
    console.error(error);
    return withCors(NextResponse.json({ message: "Failed to upsert Douban info" }, { status: 500 }), "douban");
  }
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }), "douban");
}
