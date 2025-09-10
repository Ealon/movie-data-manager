export interface CoverImageInfo {
  src: string | null;
  title: string | null;
  alt: string | null;
}

export interface LinkInfo {
  quality: string;
  size: string;
  source: string;
  magnet: string | null;
  download: string | null;
}

export interface ExtractedData {
  title: string;
  url: string;
  year: number;
  coverImage: CoverImageInfo | null;
  links: LinkInfo[];
}

export interface YinfansMovieData {
  link: string; // magnet link
  quality: string; // "4K", "1080P", etc.
  size: string; // "11.51GB", "在线观看", etc.
  title: string; // movie title
}

export interface DoubanMovieData {
  title: string;
  datePublished: string;
  rating: number;
  image: string;
  url: string;
}
