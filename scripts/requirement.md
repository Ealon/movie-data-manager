I want to create a nodejs script to crawl the movie data from Douban's website, and update the movie data in the database. Read existing code for reference.

The script should be able to:

1. load the movie data from the database
2. sanitize the movie data using the sanitizeName function in the utils.ts file
   - extract the movie's year from the movie's title, and update the movie's year in the database, if the year field is empty.
   - sanitize movie's title, coverTitle, coverAlt, and update if they are empty or different from the database.
3. set a constant "ONLY_UPDATE_IF_EMPTY" to false, this is used to update the movie's doubanInfo if the doubanInfo field is empty.
4. check if the movie's doubanInfo is empty
   - if it's empty, go to step 5
   - if it's not empty
     - if "ONLY_UPDATE_IF_EMPTY" is false, go to step 5
     - if "ONLY_UPDATE_IF_EMPTY" is true, continue to next movie
5. use playwright to crawl the movie data from Douban's website. use the "chrome-extension/src/content.ts" as reference, but only use the HTML fallback method, i.e. extract the movie's doubanInfo from the HTML, not the JSON-LD.
   - go to douban movie's search page, using the movie's title as search keyword.
     ```js
     const searchWord = movie.url.split("/").pop()?.replaceAll("-", "+");
     const searchDoubanHref = `https://search.douban.com/movie/subject_search?search_text=${searchWord}`;
     ```
   - use `document.querySelector("div#root div.item-root a")` to get the douban movie's href. you need to wait for the page to load, and the douban movie's href to be available.
   - open the douban movie's page, and wait for the page to load.
   - use html fallback method to extract the movie's doubanInfo from the HTML, but extract one more content, "div#info", as doubanMovieDetails.
6. cross check the movie's year with extracted doubanMovie year, if they are different, log into the log file, and continue to next movie.
7. cross check the movie's name with extracted doubanMovie name, by checking if movie.s title appears in doubanInfo.title or doubanMovieDetails (case insensitive). If not, log into the log file, and continue to next movie
8. if all cross checks are passed, update the movie's doubanInfo in the database. then wait for 15-20 seconds, continue to next movie.

---

### Rephrased goal

Build a Node.js crawler script that reads movies from the database, cleans up/synchronizes their basic fields, and (optionally) scrapes Douban to populate `doubanInfo` using an HTML-only parser modeled after the extension’s HTML fallback. Throttle requests and log any mismatches instead of updating incorrect entries.

### Rephrased steps

1. Load movies from the database.
2. Normalize metadata using `sanitizeName` from `next-app/lib/utils.ts`:
   - Parse and set `year` from the movie title if `year` is missing.
   - Normalize `title`, `coverTitle`, and `coverAlt`; write changes if missing or different.
3. Set a constant `ONLY_UPDATE_IF_EMPTY = false`. This controls whether we update `doubanInfo` even when it already exists.
4. For each movie, decide if we should fetch Douban:
   - If `doubanInfo` is empty → fetch.
   - If not empty:
     - If `ONLY_UPDATE_IF_EMPTY` is false → fetch anyway.
     - If true → skip to next movie.
5. Scrape Douban via Playwright (HTML fallback only):
   - Build search URL from the movie URL slug (replace `-` with `+`) and open:
     - `https://search.douban.com/movie/subject_search?search_text=<searchWord>`
   - Wait until `div#root div.item-root a` exists; navigate to the first result’s href.
   - On the movie page, wait for full load; parse HTML-only details:
     - Extract `doubanInfo` fields like title/year from HTML (no JSON-LD).
     - Additionally extract `div#info` as `doubanMovieDetails`.
6. Validate before writing:
   - If the extracted year differs from the DB movie’s year → log mismatch and skip.
   - If the DB movie title (case-insensitive) does not appear in either extracted `doubanInfo.title` or `doubanMovieDetails` → log mismatch and skip.
7. If validations pass, update `doubanInfo` in the DB. Pause 15–20 seconds before processing the next movie.

### Questions before implementation

- Database model
  - Which Prisma model and field names should we update? I see `doubanInfo`, `title`, `coverTitle`, `coverAlt`, `year` implied—can you confirm the exact field names in `next-app/prisma/schema.prisma`?
  - Should `doubanMovieDetails` be saved separately (new string field), or embedded inside `doubanInfo` (e.g., as `detailsHtml`)?
- Script placement and runtime
  - Should this script live under `scripts/` and run via `yarn` at the repo root?
  - JS or TS? If TS, OK to use `ts-node` and import `next-app/lib/utils.ts` directly?
- Prisma client and env
  - Should the script reuse the Prisma client from `next-app` (and its `DATABASE_URL`), or do you want a separate `prisma` setup under `scripts/`?
  - Where will `DATABASE_URL` be sourced (root `.env`, `next-app/.env`, or elsewhere)?
- Crawling behavior
  - Is picking the first search result acceptable, or should we try to match by year/title in the search list before navigating?
  - Target delay between requests: fixed 17s, or a randomized 15–20s backoff?
  - Headless vs headful Playwright? Any custom user-agent/proxy to avoid rate limiting?
  - Retries: how many times should we retry a failed search/page load before logging and skipping?
- Sanitization scope
  - Even if Douban update is skipped due to validation failures, should we still persist the sanitized `title`, `coverTitle`, `coverAlt`, and derived `year`?
- Logging
  - Where should logs go (e.g., `scripts/logs/douban-crawl.log`)? Any preferred format (JSON lines vs plain text)?
  - Besides mismatched year/title, log other cases (e.g., search result not found, parse failures)?
- Movie selection
  - Process all movies, or filter to a subset (e.g., missing `year` or `doubanInfo`)? Any batching size limits?

Once I have these answers, I’ll implement the script accordingly.
