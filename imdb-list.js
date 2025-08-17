const names = ["1. The Shawshank Redemption", "2. The Godfather", "3. The Dark Knight"];

const links = names.map((name) => {
  const baseUrl = "https://en.rarbg-official.com/movies?keyword=";
  const keyword = name.replace(/\d+\.\s*/, "").replace(/\s+/g, "+");
  return `${baseUrl}${keyword}`;
});
