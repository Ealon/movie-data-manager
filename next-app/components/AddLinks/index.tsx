import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLinks } from "./action";

export function AddLinks({ movieId }: { movieId: string }) {
  return (
    <form className="w-full space-y-2 mt-6" action={updateLinks}>
      <input hidden aria-hidden type="hidden" name="movieId" value={movieId} />
      <Label htmlFor="links">Add links</Label>
      <Input id="links" name="links" placeholder="Paste links here..." />
    </form>
  );
}
