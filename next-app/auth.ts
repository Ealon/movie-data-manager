import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { object, string, ZodError } from "zod";

export class CredLoginError extends Error {
  usernameError?: string;
  pwdError?: string;
  other?: string;
  constructor(_usernameError?: string, _pwdError?: string, _other?: string) {
    super(`Credentials login error - username:${_usernameError || "N/A"} pwd:${_pwdError || "N/A"}`);
    if (_usernameError || _pwdError) {
      this.usernameError = _usernameError;
      this.pwdError = _pwdError;
      return;
    }
    this.other = _other;
  }
}

export const signInSchema = object({
  username: string({ message: "Username is required" }).min(5, "Username is required"),
  password: string({ message: "Password is required" })
    .min(8, "Password must be more than 8 characters")
    .max(16, "Password must be less than 16 characters"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // ? https://next-auth.js.org/configuration/providers/credentials
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, _req) => {
        try {
          const { username, password } = signInSchema.parse(credentials);
          // const { username, password } = await signInSchema.parseAsync(credentials);

          if (!/(ealon)|(yilong)/.test(username)) {
            throw new CredLoginError("Invalid credentials.");
          }

          // const _hash = bcrypt.hashSync(password, 10);
          const hash = process.env.PASSWORD_HASH || "";
          if (!bcrypt.compareSync(password, hash)) {
            throw new CredLoginError(undefined, "Invalid credentials.");
          }

          // return JSON object with the user data
          return {
            id: username,
          };
        } catch (error) {
          if (error instanceof ZodError) {
            console.log("credential parsing error(invalid)", error);
            // Return `null` to indicate that the credentials are invalid
            throw error;
          }
          if (error instanceof CredLoginError) {
            throw error;
          }
          console.log("NextAuth Credential authorize error:", error);
          throw error;
          throw new CredLoginError(undefined, undefined, (error as Error).message || "Unexpected auth error.");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    // strategy: "jwt",
    maxAge: 1 * 60 * 60, // 1 hour in seconds
    updateAge: 30 * 60, // 30 minutes in seconds
  },
  // callbacks: {
  //   async authorized({ auth, request: { nextUrl } }) {
  //     const isLoggedIn = !!auth?.user?.id;
  //     // todo: check user authority
  //     const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

  //     if (isOnDashboard) {
  //       if (isLoggedIn) return true;
  //       return false; // Redirect unauthenticated users to login page
  //     }
  //     // if (isLoggedIn) {
  //     //   return Response.redirect(new URL("/dashboard", nextUrl));
  //     // }
  //     return true;
  //   },
  // },
});

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}
