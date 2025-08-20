import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import dotenv from "dotenv";
import { type Browser, chromium, Page, type Cookie } from "playwright";

// Reuse Prisma client generated in next-app/generated/prisma
import { PrismaClient } from "../next-app/generated/prisma";

// Load env from next-app/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../next-app/.env") });

function sanitizeName(name: string): string {
  const reg = /(- YTS - Download Movie Torrent - Yify Movies)|(YIFY Torrent)|(On EN.RARBG-OFFICIAL.COM)/gim;
  return name.replace(reg, "").trim();
}

const prisma = new PrismaClient();

const LOG_FILE = path.resolve(__dirname, "./log.log");
const ONLY_UPDATE_IF_EMPTY = true;

function appendLog(message: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line, { encoding: "utf8" });
}

function deriveYearFromTitle(title: string): number | null {
  const match = title.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  if (year < 1900 || year > 2199) return null;
  return year;
}

function buildDoubanSearchUrl(movieUrl: string): string {
  const slug = movieUrl.split("/").pop() || "";
  const searchWord = slug.replaceAll("-", "+").replaceAll("+idvc100", "");
  const searchUrl = `https://search.douban.com/movie/subject_search?search_text=${searchWord}`;
  return searchUrl;
}

async function waitForSelectorWithRetries(page: Page, selector: string, timeoutMs = 30000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: timeoutMs, state: "visible" });
    return true;
  } catch {
    return false;
  }
}

type DoubanHtmlInfo = {
  title: string;
  datePublished: string; // raw string (year)
  rating: number;
  image: string;
  url: string; // path
  detailsText: string; // textContent of div#info
};

async function extractDoubanInfoFromHtml(page: Page): Promise<DoubanHtmlInfo> {
  const title = (await page.locator("h1 > span").first().textContent())?.trim() || "";
  const yearText = (await page.locator("h1 > span.year").first().textContent())?.trim() || "";
  const datePublished = yearText.replace(/[()]/g, "").trim();
  const ratingText = (await page.locator("div.rating_self > strong.rating_num").first().textContent())?.trim() || "0";
  const rating = parseFloat(ratingText) || 0;
  const image = (await page.locator("div#mainpic img").first().getAttribute("src")) || "";
  const url = new URL(page.url()).pathname;
  const detailsText = (await page.locator("div#info").first().textContent())?.trim() || "";

  return { title, datePublished, rating, image, url, detailsText };
}

function titleAppearsInExtracted(movieTitle: string, info: DoubanHtmlInfo): boolean {
  const t = movieTitle.trim().toLowerCase();
  if (!t) return false;
  const inTitle = (info.title || "").toLowerCase().includes(t);
  const inDetails = (info.detailsText || "").toLowerCase().includes(t);
  return inTitle || inDetails;
}

async function fetchDoubanInfoWithRetries(
  page: Page,
  movie: { title: string; url: string; year: number | null },
): Promise<DoubanHtmlInfo | null> {
  const searchUrl = buildDoubanSearchUrl(movie.url);
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const ok = await waitForSelectorWithRetries(page, "div#root div.item-root a", 30_000);
      if (!ok) {
        // save screenshot
        const screenshotPath = path.resolve(__dirname, `./screenshots/${movie.title}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        appendLog(`Saved screenshot for '${movie.title}' at ${screenshotPath}`);
        throw new Error("Search result selector not found");
      }

      const firstHref = await page.locator("div#root div.item-root a").first().getAttribute("href");
      if (!firstHref) throw new Error("First search result link has no href");

      await page.goto(firstHref, { waitUntil: "domcontentloaded", timeout: 60_000 });

      // Ensure main selectors are available before extracting
      await page.waitForLoadState("domcontentloaded");
      const info = await extractDoubanInfoFromHtml(page);
      return info;
    } catch (err: any) {
      appendLog(
        `Error fetching Douban info (attempt ${attempt}/3) for '${movie.title}': ${err?.message || String(err)}`,
      );
      if (attempt < maxAttempts) {
        await delay(10_000 * attempt);
        continue;
      }
      return null;
    }
  }
  return null;
}

async function processMovie(page: Page, movieId: string): Promise<void> {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: { doubanInfo: true },
    });
    if (!movie) return;

    // 1-2. Sanitize/normalize and update before crawling
    const sanitizedTitle = sanitizeName(movie.title);
    const derivedYear = movie.year && movie.year > 0 ? movie.year : deriveYearFromTitle(movie.title) || 0;

    const sanitizedCoverTitle = movie.coverTitle ? sanitizeName(movie.coverTitle) : null;
    const sanitizedCoverAlt = movie.coverAlt ? sanitizeName(movie.coverAlt) : null;

    const needsSanitizeUpdate =
      sanitizedTitle !== movie.title ||
      (derivedYear || 0) !== (movie.year || 0) ||
      (sanitizedCoverTitle ?? null) !== (movie.coverTitle ?? null) ||
      (sanitizedCoverAlt ?? null) !== (movie.coverAlt ?? null);

    if (needsSanitizeUpdate) {
      try {
        const data = {
          title: sanitizedTitle,
          year: derivedYear || 0,
          coverTitle: sanitizedCoverTitle ?? movie.coverTitle,
          coverAlt: sanitizedCoverAlt ?? movie.coverAlt,
        };
        console.log("\nmovie data:", data);
        await prisma.movie.update({
          where: { id: movie.id },
          data,
        });
      } catch (err: any) {
        appendLog(`Failed to update sanitized info for '${movie.title}': ${err?.message || String(err)}`);
      }
    } else {
      console.log("\nno need to update movie data for", movie.title);
    }

    // 3-4. Decide whether to crawl Douban
    if (movie.doubanInfo?.url) {
      console.log("豆瓣信息已存在:", movie.doubanInfo.title, movie.doubanInfo.rating);
      if (ONLY_UPDATE_IF_EMPTY) {
        console.log("跳过更新... (ONLY_UPDATE_IF_EMPTY)\n");
        return;
      }
    }

    // 5. Crawl via HTML fallback
    let _title = sanitizedTitle;

    if (
      /(american pie)|(Irreversible)|(frozen flower)|(Mulholland)|(Midnight Screenings Harry Potter)|(One Flew Over the Cuckoo)|(The Science of Interstellar)|(The Last Jedi Cast Live Q&A)/gim.test(
        _title,
      )
    ) {
      console.log("跳过", _title);
      return;
    }

    if (/\(\d{4}\)/.test(sanitizedTitle)) {
      _title = sanitizedTitle.slice(0, -6).trim();
    }

    const info = await fetchDoubanInfoWithRetries(page, {
      title: _title,
      url: movie.url,
      year: derivedYear || null,
    });
    if (!info) return;

    // 6. Cross-check year
    const extractedYear = parseInt(info.datePublished, 10) || 0;
    const dbYear = derivedYear || 0;
    if (dbYear && extractedYear && dbYear !== extractedYear) {
      appendLog(`Year mismatch for '${_title}': db=${dbYear}, douban=${extractedYear}`);
      return;
    }

    // 7. Cross-check title appearance
    if (!titleAppearsInExtracted(_title, info)) {
      appendLog(`Title mismatch for '${_title}': not found in douban title/details`);
      return;
    }

    // 8. Upsert doubanInfo
    try {
      const doubanUrl = info.url.startsWith("http") ? info.url : `https://movie.douban.com${info.url}`;
      if (movie.doubanInfo) {
        await prisma.doubanInfo.update({
          where: { movieId: movie.id },
          data: {
            url: doubanUrl,
            title: info.title,
            datePublished: info.datePublished,
            rating: info.rating,
            coverImage: info.image,
          },
        });
      } else {
        await prisma.doubanInfo.create({
          data: {
            movieId: movie.id,
            url: doubanUrl,
            title: info.title,
            datePublished: info.datePublished,
            rating: info.rating,
            coverImage: info.image,
          },
        });
      }
    } catch (err: any) {
      appendLog(`Failed to upsert doubanInfo for '${_title}': ${err?.message || String(err)}`);
      return;
    }

    // Throttle: randomized 30-40s
    const sleepMs = 30_000 + Math.floor(Math.random() * 10_000);
    await delay(sleepMs);
  } catch (err: any) {
    appendLog(`Unexpected error processing movieId=${movieId}: ${err?.message || String(err)}`);
  }
}

async function main(): Promise<void> {
  // Ensure log file exists
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  } catch {}

  let browser: Browser;
  try {
    browser = await chromium.launch({ headless: true });

    const USER_AGENT = process.env.DOUBAN_USER_AGENT || undefined;
    const COOKIE_JSON = process.env.DOUBAN_COOKIES_JSON || "";
    const COOKIE_HEADER = process.env.DOUBAN_COOKIE_HEADER || "";

    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1920, height: 1080 },
      locale: "zh-CN",
      timezoneId: "Asia/Shanghai",
      extraHTTPHeaders: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en,zh-CN;q=0.9,zh;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      // extraHTTPHeaders: COOKIE_HEADER ? { Cookie: COOKIE_HEADER } : undefined,
    });

    if (COOKIE_JSON) {
      try {
        const cookies: Cookie[] = JSON.parse(COOKIE_JSON);
        if (Array.isArray(cookies) && cookies.length > 0) {
          await context.addCookies(cookies);
          appendLog(`Loaded ${cookies.length} cookies from DOUBAN_COOKIES_JSON.`);
        }
      } catch (e: any) {
        appendLog(`Failed parsing DOUBAN_COOKIES_JSON: ${e?.message || String(e)}`);
      }
    }

    if (USER_AGENT) appendLog(`Using custom user-agent from DOUBAN_USER_AGENT.`);
    if (COOKIE_HEADER && !COOKIE_JSON) appendLog(`Using raw cookie header from DOUBAN_COOKIE_HEADER.`);

    const page = await context.newPage();

    // Process all movies
    const movies = await prisma.movie.findMany({ select: { id: true }, orderBy: { createdAt: "asc" } });
    for (const m of movies) {
      await processMovie(page, m.id);
    }

    await browser.close();
    await prisma.$disconnect();
  } catch (err: any) {
    appendLog(`Fatal error: ${err?.message || String(err)}`);
    try {
      await prisma.$disconnect();
    } catch {}
    if (browser) {
      await browser.close();
    }
    process.exitCode = 1;
  }
}

main();
