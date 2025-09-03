export default function Loading() {
  return (
    <div className="max-w-[1920px] mx-auto p-6 flex flex-col justify-between min-h-screen w-full items-center relative z-10">
      <header className="mb-6 w-fit flex items-center justify-between gap-12">
        <h1 className="text-5xl font-black text-white">Movie Database</h1>

        <div className="h-9 w-52 bg-gray-300/20 rounded-md animate-pulse" />
        <div className="h-5 w-15 bg-gray-300/20 rounded-md animate-pulse" />
      </header>

      <div className="w-full">
        <div className="my-6 grid grid-cols-8 movie-cards gap-6">
          {Array.from({ length: 16 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg aspect-[2/3] border-2 border-white/10 bg-gray-300/20 animate-pulse"
            />
          ))}
        </div>

        <div className="h-13 w-md bg-gray-300/20 rounded-lg animate-pulse mx-auto backdrop-blur-sm" />
      </div>
    </div>
  );
}
