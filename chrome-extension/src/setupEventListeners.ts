import { PopupManager } from "./popup";

export function setupEventListeners(this: PopupManager): void {
  // Server selection radio buttons
  document.querySelectorAll('input[name="server"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target) {
        this.saveServerSelection(target.value as "local" | "prod");
      }
    });
  });

  // Douban submit button
  const doubanSubmit = document.getElementById("doubanSubmit");
  if (doubanSubmit) {
    doubanSubmit.addEventListener("click", () => this.handleDoubanSubmit());
  }

  // RARBG submit button
  const rarbgSubmit = document.getElementById("rarbgSubmit");
  if (rarbgSubmit) {
    rarbgSubmit.addEventListener("click", () => this.handleRarbgSubmit());
  }

  // Yinfans submit button
  const yinfansSubmit = document.getElementById("yinfansSubmit");
  if (yinfansSubmit) {
    yinfansSubmit.addEventListener("click", () => this.handleYinfansSubmit());
  }

  // Session token extraction button
  const extractTokenBtn = document.getElementById("extractTokenBtn");
  if (extractTokenBtn) {
    extractTokenBtn.addEventListener("click", () => this.extractSessionToken());
  }
}
