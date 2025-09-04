import { NextResponse } from "next/server";
import { upsertDoubanInfo } from "@/lib/database";
import { revalidatePath } from "next/cache";

export async function POST(request: Request, { params }: { params: Promise<{ movieId: string }> }) {
  try {
    const { movieId } = await params;
    const body = await request.json();
    // Basic shape validation
    if (!body || typeof body !== "object") {
      return withCors(NextResponse.json({ message: "Invalid body" }, { status: 400 }));
    }

    await upsertDoubanInfo(movieId, body);
    revalidatePath("/", "page");
    return withCors(NextResponse.json({ message: "Douban info upserted successfully" }, { status: 200 }));
  } catch (error) {
    console.error(error);
    return withCors(NextResponse.json({ message: "Failed to upsert Douban info" }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

function withCors(res: NextResponse) {
  // Allow any movie.douban.com page as origin
  res.headers.set("Access-Control-Allow-Origin", "https://movie.douban.com");
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}
