import { Suspense } from "react";
import MovieCard, { type MovieCardProps } from "./MovieCard";

export default async function Movies({ movies }: { movies: MovieCardProps[] }) {
  return (
    <div className="my-6 grid grid-cols-8 movie-cards gap-6">
      {movies.map((movie) => (
        <Suspense key={movie.id} fallback={<div>Loading...</div>}>
          <MovieCard movie={movie} />
        </Suspense>
      ))}
    </div>
  );
}
