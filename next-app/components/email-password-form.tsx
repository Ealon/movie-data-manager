"use client";
import { useActionState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { credentialsSignin } from "@/lib/server-actions";

export default function UsernamePasswordForm() {
  const [error, action, isPending] = useActionState(credentialsSignin, null);

  return (
    <form className="grid gap-4" action={action}>
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input className={error?.username ? "border-2 border-red-500" : ""} name="username" type="text" required />
      </div>
      {error?.username ? (
        <p className="-mt-3 px-3 py-1 text-sm font-medium text-red-500 underline">{error?.username}</p>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input className={error?.pwd ? "border-2 border-red-500" : ""} name="password" type="password" required />
      </div>
      {error?.pwd ? <p className="-mt-3 px-3 py-1 text-sm font-medium text-red-500 underline">{error?.pwd}</p> : null}
      <Button
        // loading={isPending}
        disabled={isPending}
        type="submit"
        variant="secondary"
        className="w-full"
      >
        Login
      </Button>
    </form>
  );
}
