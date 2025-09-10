import { hideMovie, unhideMovie } from "./action";
import { Button } from "@/components/ui/button";

export function ToggleHidden({ movieId, hidden }: { movieId: string; hidden: boolean }) {
  return (
    <form className="w-full space-y-2 mt-3" action={hidden ? hideMovie : unhideMovie}>
      <input hidden aria-hidden type="hidden" name="movieId" value={movieId} />
      <Button variant="destructive" type="submit">
        {hidden ? "Unhide" : "Hide"}
      </Button>
    </form>
  );
}
