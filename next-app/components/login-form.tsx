import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmailPasswordForm from "./email-password-form";
import { cn } from "@/lib/utils";

export function LoginForm({ noBorder = false }: { noBorder?: boolean }) {
  return (
    <Card className={cn("mx-auto w-80", noBorder && "border-none shadow-none")}>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-1">
          <img src="/logo.svg" alt="logo" width={28} height={28} />
          <span>Login</span>
        </CardTitle>
        <CardDescription>You need to login to access the website.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <EmailPasswordForm />
        </div>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="#" className="font-semibold text-amber-500 underline underline-offset-2">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
