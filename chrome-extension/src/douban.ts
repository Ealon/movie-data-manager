import { LOCAL_SERVER_BASE_URL, PROD_SERVER_BASE_URL } from "./config";
import { DoubanMovieData } from "./types";
import { logger, waitForElement } from "./utils";

// ! Use ld+json or HTML(as fallback method) to extract Douban movie data
export async function extractDoubanMovieData(): Promise<DoubanMovieData | null> {
  console.clear();
  try {
    const _dataStr = sessionStorage.getItem("EXTRACTED_DOUBAN_MOVIE_DATA");
    if (_dataStr) {
      const _data = JSON.parse(_dataStr);
      logger("豆瓣电影基本信息(Session Storage):", "\n", JSON.stringify(_data, null, 2), "\n\n");
      return _data;
    }
  } catch (error) {}

  try {
    await waitForElement('script[type="application/ld+json"]', document, 30_000);
    const script = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (!script) {
      throw new Error("No ld+json script found on Douban page.");
    }

    const payload = JSON.parse(script.textContent || "");
    if (payload) {
      // logger("Extracted LD+JSON:", payload);
      const _data: DoubanMovieData = {
        title: payload.name,
        datePublished: payload.datePublished,
        rating: Number(payload.aggregateRating.ratingValue),
        image: payload.image,
        url: payload.url,
      };
      logger("豆瓣电影基本信息(LD+JSON):", "\n", JSON.stringify(_data, null, 2), "\n\n");
      sessionStorage.setItem("EXTRACTED_DOUBAN_MOVIE_DATA", JSON.stringify(_data));
      return _data;
    } else {
      logger("Parse ld+json failed.");
      return null;
    }
  } catch (err) {
    logger("Failed to extract Douban ld+json:", err);
    // Fallback extraction from HTML if ld+json is missing or invalid
    try {
      // title: h1 > span (the first span inside h1)
      const titleEl = document.querySelector("h1 > span");
      const title = titleEl ? titleEl.textContent?.trim() : "";

      // datePublished: h1 > span.year
      const yearEl = document.querySelector("h1 > span.year");
      const datePublished = yearEl ? yearEl.textContent?.replace(/[()]/g, "").trim() : "";

      // rating: div.rating_self > strong.rating_num
      const ratingEl = document.querySelector("div.rating_self > strong.rating_num");
      const rating = ratingEl ? Number(ratingEl.textContent?.trim() || "0") : 0;

      // image: div#mainpic img.src
      const imgEl = document.querySelector("div#mainpic img");
      const image = imgEl ? imgEl.getAttribute("src") || "" : "";

      // url: location.pathname
      const url = location.pathname;

      const fallbackData: DoubanMovieData = {
        title: title || "",
        datePublished: datePublished || "",
        rating,
        image,
        url,
      };

      logger("豆瓣电影基本信息 (HTML Fallback):", "\n", JSON.stringify(fallbackData, null, 2), "\n\n");
      sessionStorage.setItem("EXTRACTED_DOUBAN_MOVIE_DATA", JSON.stringify(fallbackData));
      return fallbackData;
    } catch (fallbackErr) {
      logger("Failed to extract Douban info from HTML:", fallbackErr);
      return null;
    }
  }
}

export async function sendDoubanMovieDataToServer(
  data: DoubanMovieData,
  whichServer: "local" | "prod",
  movieId: string,
  sessionToken: string,
): Promise<void> {
  try {
    const serverUrl = whichServer === "local" ? LOCAL_SERVER_BASE_URL : PROD_SERVER_BASE_URL;
    const url = `${serverUrl}/api/douban/${movieId}`;

    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    logger("Douban movie data sent successfully");
  } catch (err) {
    logger("Failed to send Douban movie data to server:", err);
    throw err; // 重新抛出错误，让调用者处理
  }
}
