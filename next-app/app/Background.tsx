export default function Background() {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-[url('https://m.media-amazon.com/images/M/MV5BMTkyNTI0NDM5NF5BMl5BanBnXkFtZTcwMDkzMTk2Mw@@._V1_FMjpg_UX2048_.jpg')] bg-cover bg-center">
      <div
        className="w-screen h-screen"
        style={{ backgroundImage: "radial-gradient(circle at center, transparent, #000c 75%)" }}
      />
    </div>
  );
}
