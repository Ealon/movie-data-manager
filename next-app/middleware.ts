// // export { default } from "next-auth/middleware";

export { auth as middleware } from "@/auth";

// export const config = {
// matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
// };

// ? https://nextjs.org/docs/app/api-reference/file-conventions/middleware#matcher
export const config = {
  matcher: "/api/:path*",
};

// export function middleware(request) {}
