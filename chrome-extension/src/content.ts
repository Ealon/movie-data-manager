

interface CoverImageInfo {
  src: string | null;
  title: string | null;
  alt: string | null;
}

interface LinkInfo {
  quality: string;
  size: string;
  source: "BLURAY";
  magnet: string | null;
  download: string | null;
}

interface ExtractedData {
  title: string;
  url: string;
  coverImage: CoverImageInfo | null;
  links: LinkInfo[];
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
  function extractMovieDataFromTable(table: Element): ExtractedData {
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

      const isDesiredQuality = quality === "2160p" || quality === "1080p";
      const isBluray = source.trim().toUpperCase() === "BLURAY";

      if (isDesiredQuality && isBluray) {
        links.push({
          quality,
          size,
          source: "BLURAY",
          magnet: magnetAnchor ? magnetAnchor.getAttribute("href") : null,
          download: downloadAnchor ? downloadAnchor.getAttribute("href") : null,
        });
      }
    });

    const data: ExtractedData = {
      title: document.title,
      url: window.location.href,
      coverImage: getCoverImageInfo(),
      links,
    };

    return data;
  }

  /**
   * Extract cover image info specifically from div#movie-poster > img
   */
  function getCoverImageInfo(): CoverImageInfo | null {
    const img = document.querySelector<HTMLImageElement>("div#movie-poster > img");
    if (!img) return null;

    const src = img.src || img.getAttribute("src") || img.getAttribute("data-src") || null;
    const title = img.getAttribute("title") || img.title || null;
    const alt = img.getAttribute("alt") || null;

    return { src, title, alt };
  }

  async function run(): Promise<void> {
    try {
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
      const data = extractMovieDataFromTable(table);

      // 8. Print out the json data into the console
      try {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(data, null, 2));
      } catch {
        // eslint-disable-next-line no-console
        console.log(data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
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
