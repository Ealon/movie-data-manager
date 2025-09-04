import { PROD_SERVER_BASE_URL } from "./config";
import { extractDoubanMovieData, sendDoubanMovieDataToServer } from "./douban";
import { CoverImageInfo, LinkInfo, ExtractedData, YinfansMovieData } from "./types";
import { sanitizeName, waitForElement, logger } from "./utils";

// Server URL will be dynamically set based on user selection
let SERVER_BASE_URL = PROD_SERVER_BASE_URL;

// Chrome extension types
declare const chrome: {
  runtime: {
    onMessage: {
      addListener: (
        callback: (request: any, sender: any, sendResponse: (response: any) => void) => boolean | void,
      ) => void;
    };
  };
};

function main(): void {
  "use strict";

  const win = window as unknown as { __movieDataManagerRan?: boolean };
  if (win.__movieDataManagerRan) return;
  win.__movieDataManagerRan = true;

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "ping") {
      // Simple ping to check if content script is ready
      sendResponse({ success: true, message: "Content script ready" });
      return false;
    } else if (request.action === "extractAndSubmitDouban") {
      handleDoubanExtractAndSubmit(request.url, request.serverUrl, sendResponse);
      return true; // Keep message channel open for async response
    } else if (request.action === "extractAndSubmitYinfans") {
      handleYinfansExtractAndSubmit(request.url, request.serverUrl, sendResponse);
      return true; // Keep message channel open for async response
    }
  });

  /**
   * Handles Douban data extraction and submission from popup
   */
  async function handleDoubanExtractAndSubmit(url: string, serverUrl: string, sendResponse: (response: any) => void) {
    try {
      // Update server URL for this request
      SERVER_BASE_URL = serverUrl;

      // Extract data from current page
      const dataString = await extractDoubanMovieData();
      if (dataString) {
        await sendDoubanMovieDataToServer(dataString, serverUrl, url);
        sendResponse({ success: true, message: "Douban data submitted successfully", data: dataString });
      } else {
        sendResponse({ success: false, error: "Failed to extract Douban data" });
      }
    } catch (error) {
      sendResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  /**
   * Handles Yinfans data extraction and submission from popup
   */
  async function handleYinfansExtractAndSubmit(url: string, serverUrl: string, sendResponse: (response: any) => void) {
    try {
      // Update server URL for this request
      SERVER_BASE_URL = serverUrl;

      // Extract data from current page
      await extractYinfansMovieData();

      // For now, we'll just send a success response
      // In the future, you can modify this to actually send the extracted data
      sendResponse({ success: true, message: "Yinfans data extracted successfully" });
    } catch (error) {
      sendResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  /**
   * Extracts movie data and magnet links from RARBG movie page.
   */
  async function extractRarbgMovieData(table: Element): Promise<ExtractedData> {
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

  async function extractYinfansMovieData(): Promise<void> {
    try {
      // 1. Find "table#cili"
      const table = document.querySelector("table#cili");
      if (!table) {
        logger("Error: table#cili not found");
        return;
      }

      // 2. Traverse each row and extract data
      const rows = table.querySelectorAll("tbody tr");
      if (rows.length === 0) {
        logger("Error: No rows found in table#cili");
        return;
      }

      const movieData: YinfansMovieData[] = [];

      rows.forEach((row, index) => {
        const linkElement = row.querySelector("a[href]");
        if (!linkElement) return;

        const href = linkElement.getAttribute("href");
        if (!href) return;

        // Extract quality and size from the span elements
        const qualityElement = row.querySelector("span.label.label-danger");
        const sizeElement = row.querySelector("span.label.label-warning");

        const quality = qualityElement ? qualityElement.textContent?.trim() || "" : "";
        const size = sizeElement ? sizeElement.textContent?.trim() || "" : "";

        // Extract title from the bold text
        const titleElement = linkElement.querySelector("b");
        const title = titleElement ? titleElement.textContent?.trim() || "" : "";

        if (href && title) {
          movieData.push({
            link: href,
            quality,
            size,
            title,
          });
        }
      });

      // Log the extracted data
      logger("Extracted Yinfans movie data:", "\n", movieData, "\n\n");
      logger(`Total entries found: ${movieData.length}`);
    } catch (error) {
      logger("Error extracting Yinfans movie data:", error);
    }
  }

  async function _run(): Promise<void> {
    try {
      // * 豆瓣电影
      const isDoubanMoviePage = location.hostname === "movie.douban.com" && location.pathname.startsWith("/subject/");
      if (isDoubanMoviePage) {
        // x 暂时取消自动提取豆瓣电影数据
        // await extractDoubanMovieData();
        return;
      }

      // * 音范丝 https://www.yinfans.me/movie/40111
      const isYinfansMoviePage = /yinfans/gim.test(location.hostname) && location.pathname.startsWith("/movie/");
      if (isYinfansMoviePage) {
        await extractYinfansMovieData();
        return;
      }

      // * RARBG
      // 1-2. Find and click the button programmatically
      // const button = await waitForElement("a.torrent-modal-download", document, 8000);
      // if (button) {
      //   try {
      //     (button as HTMLElement).click();
      //   } catch {
      //     try {
      //       button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      //     } catch {}
      //   }
      // }

      // 3. Find the table inside the modal
      const table = await waitForElement(".modal-download .modal-content table", document, 12000);
      if (!table) {
        logger("Table not found. Aborting.");
        return;
      }

      // 4-7. Extract, filter, and format data
      const data = await extractRarbgMovieData(table);

      // 8. Print out the json data into the console
      try {
        logger("Extracted data:", JSON.stringify(data, null, 2));
        const response = await fetch(`${SERVER_BASE_URL}/api/movie`, {
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
        logger("Server Response:", JSON.stringify(result, null, 2));
        // window.close();
      } catch (error) {
        logger("Error:", error);
      }
    } catch (error) {
      logger("Unexpected error:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _run, { once: true });
  } else {
    _run();
  }
}

main();
