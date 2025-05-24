// LinkedIn Auto Commenter - Background Script
// Handles extension initialization and side panel management

import StorageService, { STORAGE_KEYS } from "./services/storage";
import { DEFAULT_PROMPT } from "./utils/constants";
import { isApiAvailable } from "./utils/helpers";

/**
 * Open the side panel for a tab
 * @param tabId - The ID of the tab
 */
function openSidePanel(tabId: number): void {
  // Check if side panel API is available
  if (isApiAvailable("sidePanel.setOptions")) {
    // First set the options for the side panel
    chrome.sidePanel.setOptions({
      tabId: tabId,
      path: "sidepanel.html",
      enabled: true,
    });

    // Then open the side panel if that API is available
    if (isApiAvailable("sidePanel.open")) {
      // @ts-ignore - Chrome types are not up to date
      chrome.sidePanel.open({ tabId: tabId });
    }
  } else {
    notifyUser(
      "Side panel not available",
      "Side panel is not supported in this Chrome version. Please update Chrome."
    );
  }
}

/**
 * Show a notification to the user
 * @param title - Notification title
 * @param message - Notification message
 */
function notifyUser(title: string, message: string): void {
  // Check if notifications API is available
  if (isApiAvailable("notifications.create")) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: title || "LinkedIn Auto Commenter",
      message: message,
    });
  }
}

// Initialize storage with default values
async function initializeStorage(): Promise<void> {
  try {
    // Check if Chrome storage API is available
    if (!isApiAvailable("storage.sync")) {
      return;
    }

    // Initialize with default values
    await StorageService.set({
      [STORAGE_KEYS.EXTENSION_ACTIVE]: true,
      [STORAGE_KEYS.DEFAULT_PROMPT]: DEFAULT_PROMPT,
    });
  } catch (error) {}
}

// Handle messages from content script
chrome.runtime.onMessage.addListener(
  (message: { action: string }, sender, sendResponse) => {
    try {
      if (message.action === "openSidePanel" && sender.tab?.id) {
        openSidePanel(sender.tab.id);
        sendResponse({ success: true });
      } else if (message.action === "getDefaultPrompt") {
        sendResponse({
          defaultPrompt: DEFAULT_PROMPT,
        });
      }
    } catch (error: any) {
      sendResponse({ error: error.message });
    }
    return true;
  }
);

chrome.runtime.onInstalled.addListener(() => {
  initializeStorage();
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    openSidePanel(tab.id);
  }
});
