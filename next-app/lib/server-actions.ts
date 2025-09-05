"use server";
import "server-only";
import { CredLoginError, signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
// import { isRedirectError } from "next/dist/client/components/redirect";

export const logout = async () => await signOut({ redirectTo: "/" });

export const credentialsSignin = async (_previousState: unknown, formData: FormData) => {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      const { type, cause } = error;
      switch (type) {
        case "CredentialsSignin": {
          return "Invalid credentials.";
        }
        case "CallbackRouteError": {
          if (cause?.err instanceof CredLoginError) {
            return { username: cause.err.usernameError, pwd: cause.err.pwdError };
          }
          console.log("\n\n\n\n cause:", cause, "\n\n\n", typeof cause?.err);
          return cause?.err?.toString();
        }
        default:
          return "Something went wrong.";
      }
    }

    // tips: https://github.com/nextauthjs/next-auth/discussions/9389#discussioncomment-8046451
    // if (isRedirectError(error)) {
    throw error; // ! in nextjs's official learning tutorial, this error is thrown anyway
    // }
  }
};
