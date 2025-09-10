export function sanitizeName(name: string) {
  const reg = /(- YTS - Download Movie Torrent - Yify Movies)|(YIFY Torrent)|(On EN.RARBG-OFFICIAL.COM)/gim;
  return name.replace(reg, "").trim();
}

/**
 * Waits for an element matching the selector to appear within the root.
 * Resolves with the element or null if timed out.
 */
export function waitForElement(
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

export function logger(message: string, ...args: any[]): void {
  console.log(
    `%c[Movie DB]: ${message}`,
    "background: #b20710; background: linear-gradient(150deg,#b20710 18%, #e50914 100%); color: #fff; padding: 3px 6px; border-radius: 6px; font-weight: 600; font-size:13px;",
    "\n",
    ...args,
  );
}
