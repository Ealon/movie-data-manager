import { deleteMovie } from "./action";
import { Button } from "@/components/ui/button";

export function DeleteMovie({ movieId }: { movieId: string }) {
  return (
    <form className="w-full space-y-2 mt-3" action={deleteMovie}>
      <input hidden aria-hidden type="hidden" name="movieId" value={movieId} />
      <Button variant="destructive" type="submit">
        Delete this movie
      </Button>
    </form>
  );
}
