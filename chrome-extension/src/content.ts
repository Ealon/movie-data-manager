import { extractDoubanMovieData, sendDoubanMovieDataToServer } from "./douban";
import { extractRarbgMovieData, sendRarbgMovieDataToServer } from "./rarbg";
import { YinfansMovieData } from "./types";
import { logger } from "./utils";

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
    } else if (request.action === "extractDouban") {
      handleDoubanExtract(sendResponse);
      return true; // Keep message channel open for async response
    } else if (request.action === "extractRarbg") {
      handleRarbgExtract(sendResponse);
      return true; // Keep message channel open for async response
    } else if (request.action === "extractAndSubmitDouban") {
      handleDoubanExtractAndSubmit(request.movieId, request.whichServer, sendResponse, request.sessionToken);
      return true; // Keep message channel open for async response
    } else if (request.action === "extractAndSubmitYinfans") {
      handleYinfansExtractAndSubmit(request.url, request.whichServer, sendResponse, request.sessionToken);
      return true; // Keep message channel open for async response
    } else if (request.action === "extractAndSubmitRarbg") {
      handleRarbgExtractAndSubmit(request.whichServer, sendResponse, request.sessionToken);
      return true; // Keep message channel open for async response
    }
  });

  async function handleRarbgExtract(sendResponse: (response: any) => void) {
    try {
      const _rarbgMovieInfo = await extractRarbgMovieData();
      if (_rarbgMovieInfo) {
        sendResponse({
          success: true,
          data: _rarbgMovieInfo,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger("RARBG extraction error:", errorMessage);
      sendResponse({
        success: false,
        error: errorMessage,
      });
    }
  }

  async function handleRarbgExtractAndSubmit(
    whichServer: "local" | "prod",
    sendResponse: (response: any) => void,
    sessionToken: string,
  ) {
    try {
      const _rarbgMovieInfo = await extractRarbgMovieData();
      if (_rarbgMovieInfo) {
        await sendRarbgMovieDataToServer(_rarbgMovieInfo, whichServer, sessionToken);
        sendResponse({
          success: true,
          message: "RARBG data submitted successfully",
          data: _rarbgMovieInfo,
        });
      } else {
        sendResponse({
          success: false,
          error: "Failed to extract RARBG data",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger("RARBG submission error:", errorMessage);
      sendResponse({
        success: false,
        error: errorMessage,
      });
    }
  }

  async function handleDoubanExtract(sendResponse: (response: any) => void) {
    try {
      const _doubanMovieInfo = await extractDoubanMovieData();
      if (_doubanMovieInfo) {
        sendResponse({
          success: true,
          data: _doubanMovieInfo,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger("Douban extraction error:", errorMessage);
      sendResponse({
        success: false,
        error: errorMessage,
      });
    }
  }

  /**
   * Handles Douban data extraction and submission from popup
   */
  async function handleDoubanExtractAndSubmit(
    movieId: string,
    whichServer: "local" | "prod",
    sendResponse: (response: any) => void,
    sessionToken: string,
  ) {
    try {
      // Extract data from current page
      const _doubanMovieInfo = await extractDoubanMovieData();
      if (_doubanMovieInfo) {
        await sendDoubanMovieDataToServer(_doubanMovieInfo, whichServer, movieId, sessionToken);
        sendResponse({
          success: true,
          message: "Douban data submitted successfully",
          data: _doubanMovieInfo,
        });
      } else {
        sendResponse({
          success: false,
          error: "Failed to extract Douban data",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger("Douban submission error:", errorMessage);
      sendResponse({
        success: false,
        error: errorMessage,
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
    sessionToken?: string,
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
      const isRarbgMoviePage =
        /rarbg/gim.test(location.hostname) && /(movies|seasons|episodes)/gim.test(location.pathname);
      if (isRarbgMoviePage) {
        await extractRarbgMovieData();
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

  // Add global function for console usage
  (window as any).submitDoubanData = async (movieId: string, whichServer: "local" | "prod" = "prod") => {
    try {
      const dataString = await extractDoubanMovieData();
      if (dataString) {
        await sendDoubanMovieDataToServer(dataString, whichServer, movieId, "");
        console.log("✅ Douban data submitted successfully using Bearer token authentication");
        return { success: true, data: dataString };
      } else {
        console.error("❌ Failed to extract Douban data");
        return { success: false, error: "Failed to extract Douban data" };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Douban submission error:", errorMessage);
      return { success: false, error: errorMessage };
    }
  };
}

main();
