export default function Loading() {
  return (
    <div className="max-w-[1920px] mx-auto p-6 flex flex-col justify-between min-h-screen w-full items-center">
      {/* Header skeleton */}
      <div className="mb-6 w-fit flex items-center justify-between gap-12">
        {/* Title skeleton */}
        <div className="h-12 w-64 bg-gray-300/20 rounded-lg animate-pulse"></div>

        {/* Search bar skeleton */}
        <div className="h-10 w-64 bg-gray-300/20 rounded-lg animate-pulse"></div>

        {/* Total count skeleton */}
        <div className="h-6 w-20 bg-gray-300/20 rounded animate-pulse"></div>
      </div>

      <div>
        {/* Movie cards grid skeleton */}
        <div className="my-6 grid grid-cols-8 gap-6">
          {Array.from({ length: 16 }).map((_, index) => (
            <div key={index} className="flex flex-col space-y-3">
              {/* Movie poster skeleton */}
              <div className="aspect-[2/3] bg-gray-300/20 rounded-lg animate-pulse"></div>

              {/* Movie title skeleton */}
              <div className="h-4 bg-gray-300/20 rounded animate-pulse"></div>

              {/* Rating skeleton */}
              <div className="h-3 w-16 bg-gray-300/20 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="my-2 p-2 w-fit mx-auto rounded-lg bg-white/20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-8 w-8 bg-gray-300/20 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
