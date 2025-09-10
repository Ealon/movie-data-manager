import { auth } from "@/auth";
import { getToken } from "next-auth/jwt";

export default async function isRequestAuthenticated(request: Request): Promise<boolean> {
  // ! 1. try cookie-based authentication first
  const session = await auth();
  if (session?.user) {
    console.log("Cookie authentication successful:", session);
    return true;
  }

  // ! 2. try Bearer token authentication as fallback
  const authorization = request.headers.get("authorization");

  if (authorization && authorization.startsWith("Bearer ")) {
    try {
      const _jwt = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        raw: false,
      });

      if (_jwt?.sub && (_jwt.sub === "ealon" || _jwt.sub === "yilong") && _jwt?.exp && _jwt?.exp > Date.now() / 1000) {
        console.log("Bearer token authentication successful:", _jwt);
        return true;
      }
      return false;
    } catch (tokenError) {
      console.log("Bearer token authentication failed:", tokenError);
      return false;
    }
  }

  return false;
}
