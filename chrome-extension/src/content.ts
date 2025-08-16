interface CoverImageInfo {
  src: string | null;
  title: string | null;
  alt: string | null;
}

interface LinkInfo {
  quality: string;
  size: string;
  source: string;
  magnet: string | null;
  download: string | null;
}

interface ExtractedData {
  title: string;
  url: string;
  coverImage: CoverImageInfo | null;
  links: LinkInfo[];
}

function sanitizeName(name: string) {
  const reg = /(- YTS - Download Movie Torrent - Yify Movies)|(YIFY Torrent)|(On EN.RARBG-OFFICIAL.COM)/gim;
  return name.replace(reg, "").trim();
}

function main(): void {
  "use strict";

  const win = window as unknown as { __movieDataManagerRan?: boolean };
  if (win.__movieDataManagerRan) return;
  win.__movieDataManagerRan = true;

  /**
   * Waits for an element matching the selector to appear within the root.
   * Resolves with the element or null if timed out.
   */
  function waitForElement(
    selector: string,
    root: ParentNode = document,
    timeoutMs: number = 15000,
  ): Promise<Element | null> {
    return new Promise((resolve) => {
      const existing = root.querySelector(selector);
      if (existing) {
        resolve(existing);
        return;
      }

      let resolved = false;
      const observer = new MutationObserver(() => {
        const el = root.querySelector(selector);
        if (el) {
          if (!resolved) {
            resolved = true;
            observer.disconnect();
            resolve(el);
          }
        }
      });
      observer.observe(root === document ? document.documentElement : (root as Element), {
        childList: true,
        subtree: true,
      });

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          observer.disconnect();
          resolve(null);
        }
      }, timeoutMs);

      // In case the element appears synchronously after observer starts
      const immediate = root.querySelector(selector);
      if (immediate && !resolved) {
        resolved = true;
        clearTimeout(timer);
        observer.disconnect();
        resolve(immediate);
      }
    });
  }

  /**
   * Extracts movie data from the modal table according to requirements.
   */
  async function extractMovieDataFromTable(table: Element): Promise<ExtractedData> {
    const rows = table.querySelectorAll("tbody tr");
    const links: LinkInfo[] = [];

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
      title: sanitizeName(document.title),
      url: window.location.href,
      coverImage,
      links,
    };

    return data;
  }

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

  async function run(): Promise<void> {
    try {
      // If on Douban movie detail page, extract ld+json and print, then exit
      const isDoubanMoviePage = location.hostname === "movie.douban.com" && location.pathname.startsWith("/subject/");
      if (isDoubanMoviePage) {
        try {
          await waitForElement('script[type="application/ld+json"]', document, 30_000);
          const script = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
          if (!script) {
            console.warn("[Movie Data Manager] No ld+json found on Douban page.");
            return;
          }

          console.clear();
          console.log("\n\n", script.textContent, "\n\n");

          const payload = JSON.parse(script.textContent || "");
          if (payload) {
            try {
              console.log(JSON.stringify(payload, null, 2));
            } catch {
              console.log(payload);
            }
          } else {
            console.warn("[Movie Data Manager] No ld+json found on Douban page.");
          }
        } catch (err) {
          console.error("[Movie Data Manager] Failed extracting Douban ld+json:", err);
        }
        return;
      }

      // 1-2. Find and click the button programmatically
      const button = await waitForElement("a.torrent-modal-download", document, 8000);
      if (button) {
        try {
          (button as HTMLElement).click();
        } catch {
          try {
            button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
          } catch {}
        }
      }

      // 3. Find the table inside the modal
      const table = await waitForElement(".modal-download .modal-content table", document, 12000);
      if (!table) {
        console.warn("[Movie Data Manager] Table not found. Aborting.");
        return;
      }

      // 4-7. Extract, filter, and format data
      const data = await extractMovieDataFromTable(table);

      // 8. Print out the json data into the console
      try {
        console.log(JSON.stringify(data, null, 2));
        const response = await fetch("http://localhost:8120/api/movie", {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log(
          "\n\n%c[Movie Data Manager] Response:\n",
          "background: #f16; color: white; padding: 2px 6px; border-radius: 2px;",
          JSON.stringify(result, null, 2),
          "\n\n",
        );
      } catch (error) {
        console.error("[Movie Data Manager] Error1:", error);
      }
    } catch (error) {
      console.error("[Movie Data Manager] Unexpected error:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}

main();
