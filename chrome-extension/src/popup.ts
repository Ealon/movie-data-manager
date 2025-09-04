// Popup script for Movie Data Manager extension

import { LOCAL_SERVER_BASE_URL, PROD_SERVER_BASE_URL } from "./config";

// Chrome extension types
declare const chrome: {
  storage: {
    sync: {
      get: (keys: string[]) => Promise<{ [key: string]: any }>;
      set: (data: { [key: string]: any }) => Promise<void>;
    };
  };
  tabs: {
    query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<chrome.tabs.Tab[]>;
    sendMessage: (tabId: number, message: any) => Promise<any>;
  };
  scripting: {
    executeScript: (injection: { target: { tabId: number }; files: string[] }) => Promise<void>;
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
}

interface PopupManager {
  currentTab: chrome.tabs.Tab | null;
  serverUrl: string;
  currentPageType: string;
}

class PopupManager {
  public currentTab: chrome.tabs.Tab | null = null;
  public serverUrl: string = PROD_SERVER_BASE_URL; // Default to production
  public currentPageType: string = "unknown";

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    await this.loadServerSelection();
    await this.detectCurrentPage();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadServerSelection(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(["serverSelection"]);
      if (result.serverSelection) {
        this.serverUrl = result.serverSelection === "local" ? LOCAL_SERVER_BASE_URL : PROD_SERVER_BASE_URL;

        // Update radio button selection
        const radio = document.getElementById(result.serverSelection) as HTMLInputElement;
        if (radio) radio.checked = true;
      }
    } catch (error) {
      console.error("Failed to load server selection:", error);
    }
  }

  async saveServerSelection(selection: string): Promise<void> {
    try {
      await chrome.storage.sync.set({ serverSelection: selection });
      this.serverUrl = selection === "local" ? LOCAL_SERVER_BASE_URL : PROD_SERVER_BASE_URL;
      this.updateCurrentServerUrl();
    } catch (error) {
      console.error("Failed to save server selection:", error);
    }
  }

  async detectCurrentPage(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      console.log("Current tab:", tab);

      if (tab.url) {
        const url = new URL(tab.url);
        this.currentPageType = this.getPageType(url);
        console.log("Page type detected:", this.currentPageType, "for URL:", tab.url);
      }
    } catch (error) {
      console.error("Failed to detect current page:", error);
    }
  }

  getPageType(url: URL): string {
    if (url.hostname === "movie.douban.com" && url.pathname.startsWith("/subject/")) {
      return "douban";
    } else if (/yinfans/.test(url.hostname) && url.pathname.startsWith("/movie/")) {
      return "yinfans";
    } else if (
      url.hostname === "en.rarbg-official.com" &&
      (url.pathname.startsWith("/movies/") ||
        url.pathname.startsWith("/seasons/") ||
        url.pathname.startsWith("/episodes/"))
    ) {
      return "rarbg";
    }
    return "unknown";
  }

  setupEventListeners(): void {
    // Server selection radio buttons
    document.querySelectorAll('input[name="server"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        if (target) {
          this.saveServerSelection(target.value);
        }
      });
    });

    // Douban submit button
    const doubanSubmit = document.getElementById("doubanSubmit");
    if (doubanSubmit) {
      doubanSubmit.addEventListener("click", () => {
        this.handleDoubanSubmit();
      });
    }

    // Yinfans submit button
    const yinfansSubmit = document.getElementById("yinfansSubmit");
    if (yinfansSubmit) {
      yinfansSubmit.addEventListener("click", () => {
        this.handleYinfansSubmit();
      });
    }
  }

  updateUI(): void {
    this.updateCurrentServerUrl();
    this.showRelevantSections();
    this.updatePageStatus();
  }

  updateCurrentServerUrl(): void {
    const urlElement = document.getElementById("currentServerUrl");
    if (urlElement) {
      urlElement.textContent = `Current server: ${this.serverUrl}`;
    }
  }

  showRelevantSections(): void {
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

  updatePageStatus(): void {
    const statusElement = document.getElementById("pageStatus");
    if (statusElement) {
      if (this.currentPageType === "unknown") {
        statusElement.textContent = "Current page not supported";
        statusElement.className = "page-status unsupported";
      } else {
        statusElement.textContent = `Current page: ${this.currentPageType.toUpperCase()}`;
        statusElement.className = "page-status supported";
      }

      // Add debug info
      console.log("Page status updated:", {
        currentPageType: this.currentPageType,
        currentTab: this.currentTab,
        serverUrl: this.serverUrl,
      });
    }
  }

  async handleDoubanSubmit(): Promise<void> {
    const urlInput = document.getElementById("doubanUrl") as HTMLInputElement;
    const submitBtn = document.getElementById("doubanSubmit") as HTMLButtonElement;
    const statusDiv = document.getElementById("doubanStatus");

    if (!urlInput || !submitBtn || !statusDiv) {
      console.error("Required elements not found");
      return;
    }

    const url = urlInput.value.trim();
    if (!url) {
      this.showStatus(statusDiv, "Please enter a Douban movie URL", "error");
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
        url,
        serverUrl: this.serverUrl,
      });

      console.log("\nresponse", response);

      if (response.success) {
        this.showStatus(statusDiv, "Data submitted successfully!", "success");
        urlInput.value = "";
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
        serverUrl: this.serverUrl,
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

  setButtonLoading(button: HTMLButtonElement, loading: boolean): void {
    if (loading) {
      button.disabled = true;
      button.classList.add("loading");
    } else {
      button.disabled = false;
      button.classList.remove("loading");
    }
  }

  showStatus(element: HTMLElement, message: string, type: string): void {
    element.textContent = message;
    element.className = `status ${type}`;
    element.style.display = "block";
  }

  hideStatus(element: HTMLElement): void {
    element.style.display = "none";
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PopupManager();
});
