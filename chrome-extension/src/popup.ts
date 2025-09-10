// Popup script for Movie Data Manager extension

import {
  LOCAL_SERVER_BASE_URL,
  PROD_SERVER_BASE_URL,
  PROD_SESSION_TOKEN_NAME,
  LOCAL_SESSION_TOKEN_NAME,
} from "./config";
import { setupEventListeners } from "./setupEventListeners";

// Chrome extension types
declare const chrome: {
  storage: {
    sync: {
      get: (keys: string[]) => Promise<{ [key: string]: any }>;
      set: (data: { [key: string]: any }) => Promise<void>;
    };
    local: {
      get: (keys: string | string[] | null) => Promise<{ [key: string]: any }>;
      set: (items: { [key: string]: any }) => Promise<void>;
      remove: (keys: string | string[]) => Promise<void>;
    };
  };
  tabs: {
    query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<chrome.tabs.Tab[]>;
    sendMessage: (tabId: number, message: any) => Promise<any>;
  };
  scripting: {
    executeScript: (injection: {
      target: { tabId: number };
      files?: string[];
      func?: Function;
      args?: any[];
    }) => Promise<chrome.scripting.InjectionResult[]>;
  };
  cookies: {
    get: (details: { url: string; name: string }) => Promise<chrome.cookies.Cookie | null>;
  };
};

declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
    }
  }
  namespace cookies {
    interface Cookie {
      name: string;
      value: string;
      domain: string;
      path: string;
      secure: boolean;
      httpOnly: boolean;
      sameSite: string;
      expirationDate?: number;
    }
  }
  namespace scripting {
    interface InjectionResult {
      result?: any;
      error?: any;
    }
  }
}

type PageType = "douban" | "yinfans" | "rarbg" | "movie-db" | "unsupported";

export class PopupManager {
  private currentTab: chrome.tabs.Tab | null = null;
  private whichServer: "local" | "prod" = "prod";
  private currentPageType: PageType = "unsupported";
  private sessionTokenValue: string | null = null;

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    await this.loadServerSelection();
    await this.loadSessionToken();
    await this.detectCurrentPage();
    this._setupEventListeners();
    this.updateUI();
    this.checkForSessionTokenExtraction();
  }

  private async loadServerSelection(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(["serverSelection"]);
      if (result.serverSelection) {
        this.whichServer = result.serverSelection;

        // Update radio button selection
        const radio = document.getElementById(result.serverSelection) as HTMLInputElement;
        if (radio) radio.checked = true;
      }
    } catch (error) {
      console.error("Failed to load server selection:", error);
    }
  }

  async saveServerSelection(selection: "local" | "prod"): Promise<void> {
    try {
      await chrome.storage.sync.set({ serverSelection: selection });
      this.whichServer = selection;
      this.updateCurrentServerUrl();
      this.checkForSessionTokenExtraction();
    } catch (error) {
      console.error("Failed to save server selection:", error);
    }
  }

  private async loadSessionToken(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(["sessionTokenValue"]);
      this.sessionTokenValue = result.sessionTokenValue || null;
      if (this.sessionTokenValue) {
        this.showStatus(
          document.getElementById("sessionTokenStatus")!,
          `Session token Loaded:\n${this.sessionTokenValue.slice(0, 12)}...${this.sessionTokenValue.slice(-18)}`,
          "success",
        );
      }
    } catch (error) {
      console.error("Failed to load session token:", error);
    }
  }

  private async saveSessionToken(tokenValue: string): Promise<void> {
    try {
      await chrome.storage.local.set({ sessionTokenValue: tokenValue });
      this.sessionTokenValue = tokenValue;
      this.showStatus(
        document.getElementById("sessionTokenStatus")!,
        `Session token:\n${tokenValue.slice(0, 18)}...${tokenValue.slice(-18)}`,
        "success",
      );
    } catch (error) {
      this.showStatus(document.getElementById("sessionTokenStatus")!, "Failed to save session token", "error");
    }
  }

  async extractSessionToken(): Promise<void> {
    if (!this.currentTab || !this.currentTab.url) {
      this.showStatus(document.getElementById("sessionTokenStatus")!, "No active tab found", "error");
      return;
    }

    try {
      const currentUrl = new URL(this.currentTab.url);
      const isServerPage = currentUrl.origin === PROD_SERVER_BASE_URL || currentUrl.origin === LOCAL_SERVER_BASE_URL;

      if (!isServerPage) {
        this.showStatus(document.getElementById("sessionTokenStatus")!, "Current page is not a server page", "error");
        return;
      }

      const tokenName = currentUrl.origin === PROD_SERVER_BASE_URL ? PROD_SESSION_TOKEN_NAME : LOCAL_SESSION_TOKEN_NAME;
      let tokenValue: string | null = null;

      // * Try Chrome cookies API first
      try {
        const cookie = await chrome.cookies.get({
          url: this.currentTab.url,
          name: tokenName,
        });
        if (cookie && cookie.value) {
          tokenValue = cookie.value;
        }
      } catch (cookieError) {
        console.log("Chrome cookies API failed, trying document.cookie fallback:", cookieError);
      }

      // * Fallback to document.cookie if Chrome API failed
      if (!tokenValue) {
        try {
          // Inject a script to read document.cookie
          const results = await chrome.scripting.executeScript({
            target: { tabId: this.currentTab.id! },
            func: (tokenName: string) => {
              const cookies = document.cookie.split(";");
              for (const cookie of cookies) {
                const [name, value] = cookie.trim().split("=");
                if (name === tokenName) {
                  return value;
                }
              }
              return null;
            },
            args: [tokenName],
          });

          if (results && results[0] && results[0].result) {
            tokenValue = results[0].result;
          }
        } catch (scriptError) {
          console.log("Document.cookie fallback failed:", scriptError);
        }
      }

      if (tokenValue) {
        await this.saveSessionToken(tokenValue);
      } else {
        this.showStatus(
          document.getElementById("sessionTokenStatus")!,
          `Session token '${tokenName}' not found`,
          "error",
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.showStatus(
        document.getElementById("sessionTokenStatus")!,
        `Failed to extract session token: ${errorMessage}`,
        "error",
      );
    }
  }

  private checkForSessionTokenExtraction(): void {
    if (!this.currentTab || !this.currentTab.url) return;

    const currentUrl = new URL(this.currentTab.url);
    const isServerPage = currentUrl.origin === PROD_SERVER_BASE_URL || currentUrl.origin === LOCAL_SERVER_BASE_URL;

    const sessionTokenSection = document.getElementById("sessionTokenSection");
    if (sessionTokenSection) {
      sessionTokenSection.style.display = isServerPage ? "block" : "none";
    }
  }

  private async detectCurrentPage(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      this.currentTab = tab;

      if (tab.url) {
        const url = new URL(tab.url);
        this.currentPageType = this.getPageType(url);

        if (this.currentPageType === "douban") {
          const response = await chrome.tabs.sendMessage(tab.id!, {
            action: "extractDouban",
          });
          if (response.success) {
            const extractedDoubanData = document.getElementById("extractedDoubanData");
            if (extractedDoubanData) {
              extractedDoubanData.textContent = JSON.stringify(response.data, null, 2);
            }
          }
        } else if (this.currentPageType === "rarbg") {
          const response = await chrome.tabs.sendMessage(tab.id!, {
            action: "extractRarbg",
          });
          if (response.success) {
            const extractedRarbgData = document.getElementById("extractedRarbgData");
            if (extractedRarbgData) {
              extractedRarbgData.textContent = JSON.stringify(response.data, null, 2);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to detect current page:", error);
    }
  }

  private getPageType(url: URL): PageType {
    if (url.origin === PROD_SERVER_BASE_URL || url.origin === LOCAL_SERVER_BASE_URL) {
      return "movie-db";
    }
    if (url.hostname === "movie.douban.com" && url.pathname.startsWith("/subject/")) {
      return "douban";
    }
    if (/yinfans/.test(url.hostname) && url.pathname.startsWith("/movie/")) {
      return "yinfans";
    }
    if (
      url.hostname === "en.rarbg-official.com" &&
      (url.pathname.startsWith("/movies/") ||
        url.pathname.startsWith("/seasons/") ||
        url.pathname.startsWith("/episodes/"))
    ) {
      return "rarbg";
    }
    return "unsupported";
  }

  private _setupEventListeners(): void {
    setupEventListeners.call(this);
  }

  private updateUI(): void {
    this.updateCurrentServerUrl();
    this.showRelevantSections();
    this.updatePageStatus();
  }

  private updateCurrentServerUrl(): void {
    const urlElement = document.getElementById("currentServerUrl");
    if (urlElement) {
      urlElement.textContent = `Current server: ${
        this.whichServer === "local" ? LOCAL_SERVER_BASE_URL : PROD_SERVER_BASE_URL
      }`;
    }
  }

  private showRelevantSections(): void {
    const sections = {
      douban: document.getElementById("doubanSection"),
      yinfans: document.getElementById("yinfansSection"),
      rarbg: document.getElementById("rarbgSection"),
    };

    // Hide all sections first
    Object.values(sections).forEach((section) => {
      if (section) section.style.display = "none";
    });

    // Show relevant section based on current page
    if (this.currentPageType && sections[this.currentPageType as keyof typeof sections]) {
      const section = sections[this.currentPageType as keyof typeof sections];
      if (section) section.style.display = "block";
    }
  }

  private updatePageStatus(): void {
    const statusElement = document.getElementById("pageStatus");
    if (statusElement) {
      if (this.currentPageType === "unsupported") {
        statusElement.textContent = "Current page not supported";
        statusElement.className = "page-status unsupported";
      } else {
        let textContent = `Current page: ${this.currentPageType.toUpperCase()}`;
        if (this.currentPageType === "douban") {
          textContent = "豆瓣电影";
        }
        statusElement.textContent = textContent;
        statusElement.className = "page-status supported";
      }

      // Add debug info
      console.log("Page status updated:", {
        currentPageType: this.currentPageType,
        currentTab: this.currentTab,
        whichServer: this.whichServer,
      });
    }
  }

  async handleDoubanSubmit(): Promise<void> {
    if (!this.sessionTokenValue) {
      this.showStatus(document.getElementById("doubanStatus")!, "Please extract/load session token first", "error");
      return;
    }

    const _movieIdInput = document.getElementById("movieID") as HTMLInputElement;
    const submitBtn = document.getElementById("doubanSubmit") as HTMLButtonElement;
    const statusDiv = document.getElementById("doubanStatus");

    if (!_movieIdInput || !submitBtn || !statusDiv) {
      console.error("Required elements not found");
      return;
    }

    const _movieId = _movieIdInput.value.trim();
    if (!_movieId) {
      this.showStatus(statusDiv, "Please enter a movie ID", "error");
      return;
    }

    try {
      this.setButtonLoading(submitBtn, true);
      this.hideStatus(statusDiv);

      // Check if content script is available
      if (!this.currentTab || !this.currentTab.id) {
        throw new Error("No active tab found");
      }

      // Try to inject content script if needed
      try {
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTab.id },
          files: ["dist/content.js"],
        });
      } catch (injectError) {
        console.log("Content script already injected or injection failed:", injectError);
      }

      // Wait a bit for content script to initialize and then ping it
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Ping the content script to make sure it's ready
      try {
        await chrome.tabs.sendMessage(this.currentTab.id, { action: "ping" });
      } catch (pingError) {
        console.log("Ping failed, content script not ready yet:", pingError);
        // Wait a bit more and try again
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Send message to content script to extract and submit data
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: "extractAndSubmitDouban",
        movieId: _movieId,
        whichServer: this.whichServer,
        sessionToken: this.sessionTokenValue,
      });

      console.log("\nresponse", response);

      if (response.success) {
        this.showStatus(statusDiv, "Data submitted successfully!", "success");
        _movieIdInput.value = "";
      } else {
        this.showStatus(statusDiv, `Error1: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("Douban submit error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Receiving end does not exist")) {
        this.showStatus(statusDiv, "Content script not ready. Please refresh the page and try again.", "error");
      } else {
        this.showStatus(statusDiv, `Error: ${errorMessage}`, "error");
      }
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  async handleYinfansSubmit(): Promise<void> {
    const urlInput = document.getElementById("yinfansUrl") as HTMLInputElement;
    const submitBtn = document.getElementById("yinfansSubmit") as HTMLButtonElement;
    const statusDiv = document.getElementById("yinfansStatus");

    if (!urlInput || !submitBtn || !statusDiv) {
      console.error("Required elements not found");
      return;
    }

    const url = urlInput.value.trim();
    if (!url) {
      this.showStatus(statusDiv, "Please enter a Yinfans movie URL", "error");
      return;
    }

    try {
      this.setButtonLoading(submitBtn, true);
      this.hideStatus(statusDiv);

      // Check if content script is available
      if (!this.currentTab || !this.currentTab.id) {
        throw new Error("No active tab found");
      }

      // Try to inject content script if needed
      try {
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTab.id },
          files: ["dist/content.js"],
        });
      } catch (injectError) {
        console.log("Content script already injected or injection failed:", injectError);
      }

      // Wait a bit for content script to initialize and then ping it
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Ping the content script to make sure it's ready
      try {
        await chrome.tabs.sendMessage(this.currentTab.id, { action: "ping" });
      } catch (pingError) {
        console.log("Ping failed, content script not ready yet:", pingError);
        // Wait a bit more and try again
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Send message to content script to extract and submit data
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: "extractAndSubmitYinfans",
        url: url,
        whichServer: this.whichServer,
        sessionToken: this.sessionTokenValue,
      });

      if (response.success) {
        this.showStatus(statusDiv, "Data submitted successfully!", "success");
        urlInput.value = "";
      } else {
        this.showStatus(statusDiv, `Error: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("Yinfans submit error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Receiving end does not exist")) {
        this.showStatus(statusDiv, "Content script not ready. Please refresh the page and try again.", "error");
      } else {
        this.showStatus(statusDiv, `Error: ${errorMessage}`, "error");
      }
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  async handleRarbgSubmit(): Promise<void> {
    if (!this.sessionTokenValue) {
      this.showStatus(document.getElementById("rarbgStatus")!, "Please extract/load session token first", "error");
      return;
    }

    const submitBtn = document.getElementById("rarbgSubmit") as HTMLButtonElement;
    const statusDiv = document.getElementById("rarbgStatus");

    if (!submitBtn || !statusDiv) {
      console.error("Required elements not found");
      return;
    }

    try {
      this.setButtonLoading(submitBtn, true);
      this.hideStatus(statusDiv);

      // Check if content script is available
      if (!this.currentTab || !this.currentTab.id) {
        throw new Error("No active tab found");
      }

      // Try to inject content script if needed
      try {
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTab.id },
          files: ["dist/content.js"],
        });
      } catch (injectError) {
        console.log("Content script already injected or injection failed:", injectError);
      }

      // Wait a bit for content script to initialize and then ping it
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Ping the content script to make sure it's ready
      try {
        await chrome.tabs.sendMessage(this.currentTab.id, { action: "ping" });
      } catch (pingError) {
        console.log("Ping failed, content script not ready yet:", pingError);
        // Wait a bit more and try again
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Send message to content script to extract and submit data
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: "extractAndSubmitRarbg",
        whichServer: this.whichServer,
        sessionToken: this.sessionTokenValue,
      });

      if (response.success) {
        this.showStatus(statusDiv, "Data submitted successfully!", "success");
      } else {
        this.showStatus(statusDiv, `Error: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("RARBG submit error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.showStatus(statusDiv, `Error: ${errorMessage}`, "error");
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  private setButtonLoading(button: HTMLButtonElement, loading: boolean): void {
    if (loading) {
      button.disabled = true;
      button.classList.add("loading");
    } else {
      button.disabled = false;
      button.classList.remove("loading");
    }
  }

  private showStatus(element: HTMLElement, message: string, type: string): void {
    element.textContent = message;
    element.className = `status ${type}`;
    element.style.display = "block";
  }

  private hideStatus(element: HTMLElement): void {
    element.style.display = "none";
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PopupManager();
});
