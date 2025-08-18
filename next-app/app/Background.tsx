export default function Background() {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-[url('/bg/p2233085264.jpg')] bg-cover bg-center">
      <div
        className="w-screen h-screen"
        style={{ backgroundImage: "radial-gradient(circle at center, transparent, #000c 75%)" }}
      />
    </div>
  );
}
