// export { auth as middleware } from "@/auth";

import { auth } from "@/auth";
export default auth;

// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
// };

// // ? https://nextjs.org/docs/app/api-reference/file-conventions/middleware#matcher
export const config = {
  matcher: "/api/auth/:path*",
};

// export function middleware(request) {}
