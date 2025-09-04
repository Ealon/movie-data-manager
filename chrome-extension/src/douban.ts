import { logger, waitForElement } from "./utils";

// ! Use ld+json or HTML(as fallback method) to extract Douban movie data
export async function extractDoubanMovieData(): Promise<string | null> {
  try {
    console.clear();
    await waitForElement('script[type="application/ld+json"]', document, 30_000);
    const script = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (!script) {
      throw new Error("No ld+json script found on Douban page.");
    }

    const payload = JSON.parse(script.textContent || "");
    if (payload) {
      // logger("Extracted LD+JSON:", payload);
      const _data = {
        title: payload.name,
        datePublished: payload.datePublished,
        rating: payload.aggregateRating.ratingValue,
        image: payload.image,
        url: payload.url,
      };
      const dataString = JSON.stringify(_data);
      logger("豆瓣电影基本信息:", "\n", JSON.stringify(_data, null, 2), "\n\n");
      return dataString;
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
      const rating = ratingEl ? parseFloat(ratingEl.textContent?.trim() || "0") : 0;

      // image: div#mainpic img.src
      const imgEl = document.querySelector("div#mainpic img");
      const image = imgEl ? imgEl.getAttribute("src") || "" : "";

      // url: location.pathname
      const url = location.pathname;

      const fallbackData = {
        title,
        datePublished,
        rating,
        image,
        url,
      };
      const dataString = JSON.stringify(fallbackData);
      logger("豆瓣电影基本信息 (HTML Fallback):", "\n", JSON.stringify(fallbackData, null, 2), "\n\n");
      return dataString;
    } catch (fallbackErr) {
      logger("Failed to extract Douban info from HTML:", fallbackErr);
      return null;
    }
  }
}

export async function sendDoubanMovieDataToServer(
  dataString: string,
  serverUrl: string,
  movieId: string,
): Promise<void> {
  try {
    const response = await fetch(`${serverUrl}/api/douban/${movieId}`, {
      method: "POST",
      body: dataString,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    logger("Failed to send Douban movie data to server:", err);
  }
}
