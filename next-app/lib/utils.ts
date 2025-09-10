import { clsx, type ClassValue } from "clsx";
import { NextResponse } from "next/server";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeName(name: string) {
  const reg = /(- YTS - Download Movie Torrent - Yify Movies)|(YIFY Torrent)|(On EN.RARBG-OFFICIAL.COM)/gim;
  return name.replace(reg, "").trim();
}

export function withCors(res: NextResponse, origin?: "douban" | "rarbg") {
  if (origin === "douban") {
    res.headers.set("Access-Control-Allow-Origin", "https://movie.douban.com");
  } else if (origin === "rarbg") {
    res.headers.set("Access-Control-Allow-Origin", "https://en.rarbg-official.com");
  }
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}
