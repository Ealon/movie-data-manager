import { LOCAL_SERVER_BASE_URL, PROD_SERVER_BASE_URL } from "./config";
import { extractDoubanMovieData, sendDoubanMovieDataToServer } from "./douban";
import { extractRarbgMovieData, sendRarbgMovieDataToServer } from "./rarbg";
import { CoverImageInfo, LinkInfo, ExtractedData, YinfansMovieData } from "./types";
import { waitForElement, logger } from "./utils";

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
      handleDoubanExtractAndSubmit(request.url, request.whichServer, sendResponse);
      return true; // Keep message channel open for async response
    } else if (request.action === "extractAndSubmitYinfans") {
      handleYinfansExtractAndSubmit(request.url, request.whichServer, sendResponse);
      return true; // Keep message channel open for async response
    }
  });

  /**
   * Handles Douban data extraction and submission from popup
   */
  async function handleDoubanExtractAndSubmit(
    url: string,
    whichServer: "local" | "prod",
    sendResponse: (response: any) => void,
  ) {
    try {
      // Extract data from current page
      const dataString = await extractDoubanMovieData();
      if (dataString) {
        await sendDoubanMovieDataToServer(dataString, whichServer, url);
        sendResponse({
          success: true,
          message: "Douban data submitted successfully",
          data: dataString,
        });
      } else {
        sendResponse({
          success: false,
          error: "Failed to extract Douban data",
        });
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Handles Yinfans data extraction and submission from popup
   */
  async function handleYinfansExtractAndSubmit(
    url: string,
    whichServer: "local" | "prod",
    sendResponse: (response: any) => void,
  ) {
    try {
      // Extract data from current page
      await extractYinfansMovieData();

      // For now, we'll just send a success response
      // In the future, you can modify this to actually send the extracted data
      sendResponse({
        success: true,
        message: "Yinfans data extracted successfully",
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
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

      rows.forEach((row) => {
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
      const data = await extractRarbgMovieData();
      if (data) {
        logger("Extracted RARBG movie data:", "\n", JSON.stringify(data, null, 2), "\n\n");
        await sendRarbgMovieDataToServer(data, "prod");
        return;
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
