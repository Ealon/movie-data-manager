import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <LoginForm />
    </div>
  );
}
