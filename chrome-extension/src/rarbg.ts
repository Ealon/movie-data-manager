import { LOCAL_SERVER_BASE_URL, PROD_SERVER_BASE_URL } from "./config";
import { CoverImageInfo, ExtractedData, LinkInfo } from "./types";
import { logger, sanitizeName, waitForElement } from "./utils";

/**
 * Extract cover image info specifically from div#movie-poster > img
 */
async function getCoverImageInfo(): Promise<CoverImageInfo | null> {
  const img = document.querySelector<HTMLImageElement>("div#movie-poster > img");
  if (!img) return null;

  const PLACEHOLDER_SUBSTRING = "/img/default_thumbnail.svg";
  const deadline = Date.now() + 8000; // wait up to 8s for lazy image to resolve

  const imageEl: HTMLImageElement = img;

  function currentSrc(): string {
    const dataSrc = imageEl.getAttribute("data-src") || "";
    const attrSrc = imageEl.getAttribute("src") || "";
    const computed = imageEl.currentSrc || imageEl.src || "";
    // Prefer explicit data-src if present, otherwise attribute src, then computed src
    return (dataSrc || attrSrc || computed || "").trim();
  }

  function isPlaceholder(src: string): boolean {
    return !src || src.includes(PLACEHOLDER_SUBSTRING);
  }

  let src = currentSrc();
  while (isPlaceholder(src) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 300));
    src = currentSrc();
  }

  const title = img.getAttribute("title") || img.title || "";
  const alt = img.getAttribute("alt") || "";

  return { src, title: sanitizeName(title), alt: sanitizeName(alt) };
}
/**
 * Extracts movie data and magnet links from RARBG movie page.
 */
export async function extractRarbgMovieData(): Promise<ExtractedData | null> {
  try {
    const table = await waitForElement(".modal-download .modal-content table", document, 12000);
    if (!table) {
      logger("Table not found. Aborting.");
      return null;
    }

    const rows = table.querySelectorAll("tbody tr");
    const links: LinkInfo[] = [];
    const _title =
      document.querySelector("#movie-info h1")?.textContent?.trim() ||
      document.querySelector("#mobile-movie-info h1")?.textContent?.trim() ||
      "";
    const _year =
      document.querySelector("#movie-info h2")?.textContent?.trim() ||
      document.querySelector("#mobile-movie-info h2")?.textContent?.trim() ||
      "";

    rows.forEach((row) => {
      const cells = row.querySelectorAll<HTMLTableCellElement>("td");
      if (cells.length < 5) return;

      const quality = (cells[0].textContent || "").trim();
      const source = (cells[1].textContent || "").trim();
      const size = (cells[2].textContent || "").trim();
      const downloadAnchor = cells[3].querySelector<HTMLAnchorElement>("a[href]");
      const magnetAnchor = cells[4].querySelector<HTMLAnchorElement>("a[href]");
      const normalizedSource = source.trim().toUpperCase();
      const magnet = magnetAnchor ? magnetAnchor.getAttribute("href") : null;
      const download = downloadAnchor ? downloadAnchor.getAttribute("href") : null;

      if (magnet && download) {
        links.push({
          quality,
          size,
          source: normalizedSource,
          magnet,
          download,
        });
      }
    });

    const coverImage = await getCoverImageInfo();
    const data: ExtractedData = {
      title: _title || sanitizeName(document.title),
      url: window.location.href,
      year: _year ? +_year : 9999,
      coverImage,
      links,
    };

    return data;
  } catch (error) {
    logger("Error extracting RARBG movie data:", error);
    return null;
  }
}

export async function sendRarbgMovieDataToServer(data: ExtractedData, whichServer: "local" | "prod"): Promise<void> {
  try {
    const response = await fetch(
      `${whichServer === "local" ? LOCAL_SERVER_BASE_URL : PROD_SERVER_BASE_URL}/api/movie`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    logger("Server Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    logger("Failed to send RARBG movie data to server:", error);
  }
}
