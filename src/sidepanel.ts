// LinkedIn Auto Commenter - Side Panel Script
// Handles side panel UI and interactions

import openAIService from "./services/openai";
import StorageService, { STORAGE_KEYS } from "./services/storage";
import { SidePanelElements } from "./types";

/**
 * UI handler for the side panel
 */
class SidePanelUI {
  private elements: Partial<SidePanelElements>;

  constructor() {
    this.elements = {
      settingsTab: document.getElementById("settingsTab") ?? undefined,
      responseTab: document.getElementById("responseTab") ?? undefined,
      settingsContent: document.getElementById("settingsContent") ?? undefined,
      responseContent: document.getElementById("responseContent") ?? undefined,

      promptInput:
        (document.getElementById("customPrompt") as HTMLTextAreaElement) ??
        undefined,
      status: document.getElementById("status") ?? undefined,
      activeToggle:
        (document.getElementById("activeToggle") as HTMLInputElement) ??
        undefined,

      // Response elements
      gptResponses: document.getElementById("gptResponses") ?? undefined,
      responseStatus: document.getElementById("responseStatus") ?? undefined,
    };

    // Initialize UI
    this.initTabSwitching();
    this.initSettingsHandlers();
    this.initResponseHandlers(); // Add this line
    this.loadSettings();

    // Listen for storage changes to detect when post text is saved
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[STORAGE_KEYS.LAST_POST_TEXT]) {
        // Auto-switch to response tab when post text is saved
        this.switchToResponseTab();
      }
    });
  }

  // Set up tab switching behavior
  private initTabSwitching(): void {
    if (
      !this.elements.settingsTab ||
      !this.elements.responseTab ||
      !this.elements.settingsContent ||
      !this.elements.responseContent
    )
      return;

    this.elements.settingsTab.addEventListener("click", () => {
      this.elements.settingsTab?.classList.add("active");
      this.elements.responseTab?.classList.remove("active");
      if (this.elements.settingsContent)
        this.elements.settingsContent.style.display = "";
      if (this.elements.responseContent)
        this.elements.responseContent.style.display = "none";
    });

    this.elements.responseTab.addEventListener("click", () => {
      this.elements.responseTab?.classList.add("active");
      this.elements.settingsTab?.classList.remove("active");
      if (this.elements.responseContent)
        this.elements.responseContent.style.display = "";
      if (this.elements.settingsContent)
        this.elements.settingsContent.style.display = "none";
      this.fetchVariants();
    });
  }

  // Fetch comment variants from OpenAI
  private async fetchVariants(): Promise<void> {
    if (!this.elements.gptResponses) return;

    // Set all variants to loading state
    const variants =
      this.elements.gptResponses.querySelectorAll<HTMLElement>(
        ".response-variant"
      );
    variants.forEach((variant: HTMLElement) => {
      variant.textContent = "Loading...";
    });

    try {
      // Fetch post and prompt data
      const dataFromStorage = await StorageService.get([STORAGE_KEYS.LAST_POST_TEXT, STORAGE_KEYS.CUSTOM_PROMPT, STORAGE_KEYS.DEFAULT_PROMPT]);

      const postText = dataFromStorage[STORAGE_KEYS.LAST_POST_TEXT];
      const customPromptValue = dataFromStorage[STORAGE_KEYS.CUSTOM_PROMPT];
      const defaultPromptValue = dataFromStorage[STORAGE_KEYS.DEFAULT_PROMPT];

      // Use custom prompt if it exists, otherwise use default prompt
      const promptToUse = customPromptValue || defaultPromptValue || "";

      if (!postText) {
        variants.forEach((variant: HTMLElement) => {
          variant.textContent =
            "No post selected. Click on a LinkedIn post comment button first.";
        });
        return;
      }

      const content: string = `${postText}\n\n---\n${promptToUse}`;

      const comments = await openAIService.generateComment(content);

      // Parse the response - it might return as a single string with separators
      let commentArray: string[] = [];
      if (Array.isArray(comments)) {
        commentArray = comments;
      } else if (typeof comments === "string") {
        // Split by "---" if the API returned all variants in one string
        commentArray = comments.split(/\s*---\s*/g).filter((c) => c.trim());
      }

      // Update variants with comments
      variants.forEach((variant: HTMLElement, index: number) => {
        if (commentArray[index]) {
          variant.textContent = commentArray[index];
        } else {
          variant.textContent = "No comment variant generated";
        }
      });
    } catch (error: any) {
      if (this.elements.responseStatus) {
        this.elements.responseStatus.textContent =
          error.userMessage || "Failed to generate comments";
      }

      variants.forEach((variant: HTMLElement) => {
        variant.textContent = "Error generating comment variants";
      });
    }
  }

  // Set up settings tab handlers
  private initSettingsHandlers(): void {
    const saveBtn = document.getElementById("savePrompt") as HTMLButtonElement;
    const resetBtn = document.getElementById(
      "resetPrompt"
    ) as HTMLButtonElement;

    if (
      !saveBtn ||
      !resetBtn ||
      !this.elements.promptInput ||
      !this.elements.activeToggle ||
      !this.elements.status
    )
      return;

    saveBtn.addEventListener("click", async () => {
      const promptNote = document.querySelector(".prompt-note");

      await StorageService.set({
        [STORAGE_KEYS.CUSTOM_PROMPT]: this.elements.promptInput?.value,
        [STORAGE_KEYS.EXTENSION_ACTIVE]: this.elements.activeToggle?.checked,
      });

      // Update the prompt note to indicate we're using a custom prompt
      if (promptNote) {
        promptNote.textContent =
          "You're using a custom prompt. You can reset to the default using the button below.";
      }

      if (this.elements.status) {
        this.elements.status.textContent = "Settings saved!";
        setTimeout(() => {
          if (this.elements.status) this.elements.status.textContent = "";
        }, 3000);
      }
    });

    resetBtn.addEventListener("click", async () => {
      const promptNote = document.querySelector(".prompt-note");

      // Get the default prompt from background script
      chrome.runtime.sendMessage(
        { action: "getDefaultPrompt" },
        async (response) => {
          if (response && response.defaultPrompt && this.elements.promptInput) {
            this.elements.promptInput.value = response.defaultPrompt;

            // Clear the custom prompt from storage
            await StorageService.set({ [STORAGE_KEYS.CUSTOM_PROMPT]: "" });

            // Update the prompt note to indicate we're using the default prompt
            if (promptNote) {
              promptNote.textContent =
                "This is the default prompt. You can customize it to control how the AI generates comments.";
            }

            if (this.elements.status) {
              this.elements.status.textContent = "Prompt reset to default!";
              setTimeout(() => {
                if (this.elements.status) this.elements.status.textContent = "";
              }, 3000);
            }
          }
        }
      );
    });

    this.elements.activeToggle.addEventListener("change", async () => {
      if (this.elements.activeToggle) {
        await StorageService.set({
          [STORAGE_KEYS.EXTENSION_ACTIVE]: this.elements.activeToggle.checked,
        });
      }
    });
  }

  // Add this method to handle response variant clicks
  private initResponseHandlers(): void {
    if (!this.elements.gptResponses) return;

    this.elements.gptResponses.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains("response-variant") && target.textContent) {
        // Send message to content script to fill the comment box
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "fillCommentBox",
              comment: target.textContent
            });
            
            // Show feedback to user
            if (this.elements.responseStatus) {
              this.elements.responseStatus.textContent = "Comment applied to LinkedIn!";
              setTimeout(() => {
                if (this.elements.responseStatus) this.elements.responseStatus.textContent = "";
              }, 3000);
            }
          }
        });
      }
    });
  }

  // Load settings from storage
  private async loadSettings(): Promise<void> {
    if (!this.elements.promptInput) return;

    const result = await StorageService.get([
      STORAGE_KEYS.CUSTOM_PROMPT,
      STORAGE_KEYS.EXTENSION_ACTIVE,
    ]);
    const promptNote = document.querySelector(".prompt-note");

    // If user has a custom prompt saved, use that
    if (result[STORAGE_KEYS.CUSTOM_PROMPT]) {
      this.elements.promptInput.value = result[STORAGE_KEYS.CUSTOM_PROMPT];
      if (promptNote) {
        promptNote.textContent =
          "You're using a custom prompt. You can reset to the default using the button below.";
      }
    } else {
      chrome.runtime.sendMessage({ action: "getDefaultPrompt" }, (response) => {
        if (response && response.defaultPrompt && this.elements.promptInput) {
          this.elements.promptInput.value = response.defaultPrompt;
          if (promptNote) {
            promptNote.textContent =
              "This is the default prompt. You can customize it to control how the AI generates comments.";
          }
        }
      });
    }

    if (this.elements.activeToggle) {
      this.elements.activeToggle.checked =
        result[STORAGE_KEYS.EXTENSION_ACTIVE] !== false;
    }
  }

  /**
   * Switch to the response tab and load variants
   */
  private switchToResponseTab(): void {
    if (
      !this.elements.responseTab ||
      !this.elements.settingsTab ||
      !this.elements.responseContent ||
      !this.elements.settingsContent
    )
      return;

    this.elements.responseTab.classList.add("active");
    this.elements.settingsTab.classList.remove("active");
    this.elements.responseContent.style.display = "";
    this.elements.settingsContent.style.display = "none";
    this.fetchVariants();
  }
}

// Initialize the side panel UI when the document is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SidePanelUI();
});
