import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDoubanInfo } from "./action";

export function DoubanInfoUpdater({ movieId }: { movieId: string }) {
  return (
    <form className="w-full space-y-2 mt-6" action={updateDoubanInfo}>
      <input hidden aria-hidden type="hidden" name="movieId" value={movieId} />
      <Label htmlFor="json-info">JSON info</Label>
      <Input id="json-info" name="json-info" placeholder="Paste JSON info here..." />
    </form>
  );
}
