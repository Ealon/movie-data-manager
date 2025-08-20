export default function Background() {
  return (
    <>
      <img className="fixed inset-0 w-screen h-screen bg-cover bg-center" src="/bg/batman.webp" alt="batman" />
      <div className="fixed w-screen h-screen bg-black/30" />
    </>
  );
}
